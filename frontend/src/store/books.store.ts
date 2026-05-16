import { create } from "zustand";

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  emotionTags: string[];
  moodScore?: number;
}

interface BooksState {
  searchQuery: string;
  promptQuery: string;
  selectedBook: Book | null;
  setSearchQuery: (q: string) => void;
  setPromptQuery: (q: string) => void;
  setSelectedBook: (book: Book | null) => void;
}

export const useBooksStore = create<BooksState>((set) => ({
  searchQuery: "",
  promptQuery: "",
  selectedBook: null,
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setPromptQuery: (promptQuery) => set({ promptQuery }),
  setSelectedBook: (selectedBook) => set({ selectedBook }),
}));
