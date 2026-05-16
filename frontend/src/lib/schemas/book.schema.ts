import { z } from "zod";

export const bookSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  author: z.string(),
  description: z.string().optional(),
  coverUrl: z.string().url().optional(),
  publishedYear: z.number().int().optional(),
  language: z.string().default("ru"),
  emotionTags: z.array(z.string()).default([]),
  atmosphereTags: z.array(z.string()).default([]),
  moodScore: z.number().min(0).max(1).optional(),
  pageCount: z.number().int().positive().optional(),
});

export const userBookSchema = z.object({
  bookId: z.string().uuid(),
  status: z.enum(["want_to_read", "reading", "read", "dropped"]),
  rating: z.number().min(1).max(10).optional(),
  review: z.string().max(4000).optional(),
  quotes: z.array(z.string()).default([]),
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional(),
});

export const bookSearchSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
});

export type Book = z.infer<typeof bookSchema>;
export type UserBook = z.infer<typeof userBookSchema>;
export type BookSearch = z.infer<typeof bookSearchSchema>;
