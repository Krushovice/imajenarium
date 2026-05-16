from __future__ import annotations

import asyncio
import logging
import uuid
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import httpx

from app.ai.embeddings import get_embedding_service
from app.ai.tasks.news_feed import NewsFeedAIService
from app.repositories.literary_dna import LiteraryDNARepository
from app.repositories.news_feed import NewsFeedRepository
from app.schemas.news_feed import NewsFeedItemOut, NewsFeedResponse, RefreshResult, RssSource

logger = logging.getLogger(__name__)

RSS_SOURCES: list[tuple[str, str]] = [
    ("Literary Hub", "https://lithub.com/feed/"),
    ("The Guardian Books", "https://www.theguardian.com/books/rss"),
    ("NPR Books", "https://feeds.npr.org/1032/rss.xml"),
    ("Book Riot", "https://bookriot.com/feed/"),
    ("Publishers Weekly", "https://www.publishersweekly.com/pw/feeds/latest/index.html.rss"),
]

_ATOM_NS = "http://www.w3.org/2005/Atom"
_HTTP_TIMEOUT = 15.0
_EXCERPT_MAX = 1500


def _parse_date(date_str: str | None) -> datetime | None:
    if not date_str:
        return None
    try:
        return parsedate_to_datetime(date_str)
    except Exception:
        pass
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except Exception:
        return None


def _strip_tags(text: str) -> str:
    """Remove HTML tags naively for excerpt extraction."""
    import re
    return re.sub(r"<[^>]+>", " ", text).strip()


def _parse_rss(source_name: str, source_url: str, content: bytes) -> list[dict]:
    items: list[dict] = []
    try:
        root = ET.fromstring(content)
    except ET.ParseError as exc:
        logger.warning("RSS parse error for %s: %s", source_url, exc)
        return items

    # RSS 2.0
    channel = root.find("channel")
    if channel is not None:
        for item in channel.findall("item"):
            title = item.findtext("title", "").strip()
            link = item.findtext("link", "").strip()
            author = item.findtext("author") or item.findtext("dc:creator")
            pub_date = _parse_date(item.findtext("pubDate"))
            desc = item.findtext("description") or ""
            excerpt = _strip_tags(desc)[:_EXCERPT_MAX]
            if title and link:
                items.append(
                    {
                        "source_name": source_name,
                        "source_url": source_url,
                        "title": title,
                        "url": link,
                        "author": author,
                        "raw_excerpt": excerpt or None,
                        "published_at": pub_date,
                    }
                )
        return items

    # Atom
    tag = lambda name: f"{{{_ATOM_NS}}}{name}"
    for entry in root.findall(tag("entry")):
        title_el = entry.find(tag("title"))
        title = (title_el.text or "").strip() if title_el is not None else ""
        link_el = entry.find(tag("link"))
        link = link_el.get("href", "") if link_el is not None else ""
        author_el = entry.find(f"{tag('author')}/{tag('name')}")
        author = author_el.text if author_el is not None else None
        updated = _parse_date(entry.findtext(tag("updated")))
        summary_el = entry.find(tag("summary")) or entry.find(tag("content"))
        excerpt = _strip_tags(summary_el.text or "")[:_EXCERPT_MAX] if summary_el is not None else ""
        if title and link:
            items.append(
                {
                    "source_name": source_name,
                    "source_url": source_url,
                    "title": title,
                    "url": link,
                    "author": author,
                    "raw_excerpt": excerpt or None,
                    "published_at": updated,
                }
            )
    return items


class NewsFeedService:
    def __init__(
        self,
        repo: NewsFeedRepository,
        dna_repo: LiteraryDNARepository,
        ai: NewsFeedAIService,
    ) -> None:
        self._repo = repo
        self._dna_repo = dna_repo
        self._ai = ai

    # ------------------------------------------------------------------
    # 9.1 — RSS parsing
    # ------------------------------------------------------------------

    async def refresh_feeds(self, *, tag_batch: int = 10) -> RefreshResult:
        fetched = await self._fetch_all_sources()
        tagged = await self._process_ai_tagging(batch=tag_batch)
        return RefreshResult(
            fetched=fetched,
            tagged=tagged,
            sources_checked=len(RSS_SOURCES),
        )

    async def _fetch_all_sources(self) -> int:
        saved = 0
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT, follow_redirects=True) as client:
            for name, url in RSS_SOURCES:
                try:
                    resp = await client.get(url, headers={"User-Agent": "BookImaginarium/1.0"})
                    resp.raise_for_status()
                except Exception as exc:
                    logger.warning("Failed to fetch feed %s: %s", url, exc)
                    continue

                items = _parse_rss(name, url, resp.content)
                for item_data in items:
                    existing = await self._repo.get_by_url(item_data["url"])
                    if existing is None:
                        await self._repo.create(item_data)
                        saved += 1

        return saved

    # ------------------------------------------------------------------
    # 9.2 — AI summarization + emotional tagging
    # ------------------------------------------------------------------

    async def _process_ai_tagging(self, *, batch: int = 10) -> int:
        embedding_svc = get_embedding_service()
        untagged = await self._repo.get_untagged(limit=batch)
        tagged = 0

        for item in untagged:
            excerpt = item.raw_excerpt or item.title
            result = await self._ai.summarize_and_tag(item.title, excerpt)

            summary = result.get("summary") or None
            emotional_tags = result.get("emotional_tags") or []
            mood = result.get("mood") or None
            atmosphere = result.get("atmosphere") or None

            embed_text = f"{item.title}. {summary or excerpt}"
            try:
                vecs = await embedding_svc.embed_async([embed_text])
                embedding = vecs[0]
            except Exception as exc:
                logger.warning("Embedding failed for item %s: %s", item.id, exc)
                embedding = None

            await self._repo.update(
                item,
                {
                    "ai_summary": summary,
                    "emotional_tags": emotional_tags,
                    "mood": mood,
                    "atmosphere": atmosphere,
                    "embedding": embedding,
                },
            )
            tagged += 1

        return tagged

    # ------------------------------------------------------------------
    # 9.3 — Personalized feed by Literary DNA
    # ------------------------------------------------------------------

    async def get_feed(
        self, user_id: uuid.UUID | None, *, limit: int = 20, offset: int = 0
    ) -> NewsFeedResponse:
        personalized = False
        items = []

        if user_id is not None:
            dna = await self._dna_repo.get_by_user_id(user_id)
            if dna is not None and dna.embedding is not None:
                items = await self._repo.find_by_embedding(
                    dna.embedding, limit=limit + offset
                )
                items = items[offset : offset + limit]
                personalized = True

        if not items:
            items = await self._repo.get_recent(limit=limit, offset=offset)

        total = await self._repo.count()
        return NewsFeedResponse(
            items=[NewsFeedItemOut.model_validate(i) for i in items],
            total=total,
            personalized=personalized,
        )

    @staticmethod
    def list_sources() -> list[RssSource]:
        return [RssSource(name=name, url=url) for name, url in RSS_SOURCES]
