import { describe, it, expect } from "vitest";
import { bookSchema, userBookSchema, bookSearchSchema } from "@/lib/schemas/book.schema";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("bookSchema", () => {
  const validBook = { id: VALID_UUID, title: "Мастер и Маргарита", author: "Булгаков М.А." };

  it("accepts minimal valid book", () => {
    expect(bookSchema.safeParse(validBook).success).toBe(true);
  });

  it("defaults language to ru", () => {
    const r = bookSchema.safeParse(validBook);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.language).toBe("ru");
  });

  it("defaults emotionTags and atmosphereTags to []", () => {
    const r = bookSchema.safeParse(validBook);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.emotionTags).toEqual([]);
      expect(r.data.atmosphereTags).toEqual([]);
    }
  });

  it("rejects moodScore > 1", () => {
    expect(bookSchema.safeParse({ ...validBook, moodScore: 1.5 }).success).toBe(false);
  });

  it("rejects moodScore < 0", () => {
    expect(bookSchema.safeParse({ ...validBook, moodScore: -0.1 }).success).toBe(false);
  });

  it("rejects negative pageCount", () => {
    expect(bookSchema.safeParse({ ...validBook, pageCount: -1 }).success).toBe(false);
  });

  it("rejects non-integer publishedYear", () => {
    expect(bookSchema.safeParse({ ...validBook, publishedYear: 1990.5 }).success).toBe(false);
  });

  it("accepts full valid book", () => {
    const r = bookSchema.safeParse({
      ...validBook,
      description: "Классика",
      coverUrl: "https://example.com/cover.jpg",
      publishedYear: 1967,
      language: "ru",
      emotionTags: ["dark", "mysterious"],
      atmosphereTags: ["urban"],
      moodScore: 0.7,
      pageCount: 448,
    });
    expect(r.success).toBe(true);
  });
});

describe("userBookSchema", () => {
  it("accepts valid user book", () => {
    const r = userBookSchema.safeParse({ bookId: VALID_UUID, status: "read", rating: 9 });
    expect(r.success).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(userBookSchema.safeParse({ bookId: VALID_UUID, status: "finished" }).success).toBe(false);
  });

  it("rejects rating > 10", () => {
    expect(userBookSchema.safeParse({ bookId: VALID_UUID, status: "read", rating: 11 }).success).toBe(false);
  });

  it("rejects rating < 1", () => {
    expect(userBookSchema.safeParse({ bookId: VALID_UUID, status: "read", rating: 0 }).success).toBe(false);
  });

  it("rejects review > 4000 chars", () => {
    const r = userBookSchema.safeParse({ bookId: VALID_UUID, status: "read", review: "x".repeat(4001) });
    expect(r.success).toBe(false);
  });

  it("defaults quotes to []", () => {
    const r = userBookSchema.safeParse({ bookId: VALID_UUID, status: "reading" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.quotes).toEqual([]);
  });

  it("accepts all valid statuses", () => {
    const statuses = ["want_to_read", "reading", "read", "dropped"] as const;
    for (const status of statuses) {
      expect(userBookSchema.safeParse({ bookId: VALID_UUID, status }).success).toBe(true);
    }
  });
});

describe("bookSearchSchema", () => {
  it("accepts valid search", () => {
    const r = bookSearchSchema.safeParse({ q: "Bulgakov" });
    expect(r.success).toBe(true);
  });

  it("defaults limit=20 and offset=0", () => {
    const r = bookSearchSchema.safeParse({ q: "test" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.limit).toBe(20);
      expect(r.data.offset).toBe(0);
    }
  });

  it("rejects empty q", () => {
    expect(bookSearchSchema.safeParse({ q: "" }).success).toBe(false);
  });

  it("rejects q longer than 200 chars", () => {
    expect(bookSearchSchema.safeParse({ q: "x".repeat(201) }).success).toBe(false);
  });

  it("rejects limit > 50", () => {
    expect(bookSearchSchema.safeParse({ q: "test", limit: 51 }).success).toBe(false);
  });

  it("rejects negative offset", () => {
    expect(bookSearchSchema.safeParse({ q: "test", offset: -1 }).success).toBe(false);
  });
});
