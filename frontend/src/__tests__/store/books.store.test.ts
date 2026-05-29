import { describe, it, expect, beforeEach } from "vitest";
import { useBooksStore } from "@/store/books.store";

const mockBook = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Мастер и Маргарита",
  author: "Булгаков",
  emotionTags: ["dark", "mysterious"],
};

beforeEach(() => {
  useBooksStore.setState({ searchQuery: "", promptQuery: "", selectedBook: null });
});

describe("useBooksStore", () => {
  it("initial state is empty", () => {
    const s = useBooksStore.getState();
    expect(s.searchQuery).toBe("");
    expect(s.promptQuery).toBe("");
    expect(s.selectedBook).toBeNull();
  });

  it("setSearchQuery updates searchQuery", () => {
    useBooksStore.getState().setSearchQuery("Bulgakov");
    expect(useBooksStore.getState().searchQuery).toBe("Bulgakov");
  });

  it("setPromptQuery updates promptQuery", () => {
    useBooksStore.getState().setPromptQuery("хочу как Достоевский но веселее");
    expect(useBooksStore.getState().promptQuery).toBe("хочу как Достоевский но веселее");
  });

  it("setSelectedBook sets book", () => {
    useBooksStore.getState().setSelectedBook(mockBook);
    expect(useBooksStore.getState().selectedBook).toEqual(mockBook);
  });

  it("setSelectedBook(null) clears selection", () => {
    useBooksStore.getState().setSelectedBook(mockBook);
    useBooksStore.getState().setSelectedBook(null);
    expect(useBooksStore.getState().selectedBook).toBeNull();
  });

  it("setSearchQuery does not affect other state", () => {
    useBooksStore.getState().setSelectedBook(mockBook);
    useBooksStore.getState().setSearchQuery("new query");
    expect(useBooksStore.getState().selectedBook).toEqual(mockBook);
    expect(useBooksStore.getState().promptQuery).toBe("");
  });
});
