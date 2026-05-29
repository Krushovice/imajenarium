from __future__ import annotations

import uuid
from unittest.mock import MagicMock, patch


def _mock_embedding_service():
    svc = MagicMock()
    svc.embed.return_value = [[0.0] * 384]
    svc.embed_async.return_value = [[0.0] * 384]
    return svc


async def _seed_book(db) -> dict:
    """Insert a book directly into the test DB session."""
    from app.models.books import Book

    book = Book(
        title="Test Book",
        author="Test Author",
        description="A book for testing",
        language="en",
        published_year=2020,
    )
    db.add(book)
    await db.flush()
    await db.refresh(book)
    return {"id": str(book.id), "title": book.title, "author": book.author}


class TestListBooks:
    async def test_empty_catalog_returns_list(self, client):
        with patch("app.ai.get_embedding_service", return_value=_mock_embedding_service()):
            resp = await client.get("/api/v1/books")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_pagination_params(self, client):
        with patch("app.ai.get_embedding_service", return_value=_mock_embedding_service()):
            resp = await client.get("/api/v1/books?offset=0&limit=10")
        assert resp.status_code == 200

    async def test_invalid_limit_returns_422(self, client):
        resp = await client.get("/api/v1/books?limit=0")
        assert resp.status_code == 422


class TestGetBook:
    async def test_not_found_returns_404(self, client):
        with patch("app.ai.get_embedding_service", return_value=_mock_embedding_service()):
            resp = await client.get(f"/api/v1/books/{uuid.uuid4()}")
        assert resp.status_code == 404

    async def test_invalid_uuid_returns_422(self, client):
        resp = await client.get("/api/v1/books/not-a-uuid")
        assert resp.status_code == 422


class TestMyShelf:
    async def test_unauthenticated_returns_401(self, client):
        resp = await client.get("/api/v1/books/shelf/me")
        assert resp.status_code == 401

    async def test_authenticated_returns_empty_shelf(self, client, auth_headers):
        with patch("app.ai.get_embedding_service", return_value=_mock_embedding_service()):
            resp = await client.get("/api/v1/books/shelf/me", headers=auth_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 0
        assert body["items"] == []

    async def test_add_and_retrieve_book(self, client, db, auth_headers):
        book = await _seed_book(db)
        await db.commit()

        with patch("app.ai.get_embedding_service", return_value=_mock_embedding_service()):
            add_resp = await client.post(
                f"/api/v1/books/{book['id']}/shelf",
                headers=auth_headers,
                json={"status": "want_to_read"},
            )
        assert add_resp.status_code == 201
        shelf_entry = add_resp.json()
        assert shelf_entry["book_id"] == book["id"]
        assert shelf_entry["status"] == "want_to_read"
