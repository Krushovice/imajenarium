"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, Sparkles, X } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { StarryBackground, GlassCard, AmbientParticles } from "@/components/design-system";
import { BookCard, type BookData } from "@/components/books";
import { staggerContainer, staggerItem } from "@/lib/animations";
import {
  fetchCatalog,
  textSearchBooks,
  semanticSearchBooks,
  addToShelf,
  type BookSearchResult,
} from "@/lib/api";

function catalogToBookData(book: BookSearchResult): BookData {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    year: book.published_year ?? undefined,
    emotionTags: (book.emotional_tags as string[]) ?? [],
    coverUrl: book.cover_url ?? undefined,
  };
}

type SearchMode = "text" | "semantic";

export default function CatalogPage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("text");
  const [books, setBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadCatalog();
  }, []);

  async function loadCatalog() {
    setLoading(true);
    setError(null);
    setSearched(false);
    try {
      const data = await fetchCatalog(0, 100);
      setBooks(data.map(catalogToBookData));
      setTotal(data.length);
    } catch {
      setError("Не удалось загрузить каталог");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!query.trim()) {
      loadCatalog();
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      let results: BookSearchResult[];
      if (mode === "semantic") {
        results = await semanticSearchBooks(query, 30);
      } else {
        results = await textSearchBooks(query, 30);
      }
      setBooks(results.map(catalogToBookData));
      setTotal(results.length);
    } catch {
      setError("Ошибка поиска. Попробуй снова.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToShelf(bookId: string) {
    try {
      await addToShelf(bookId, { status: "want_to_read" });
      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, status: "want_to_read" as const } : b))
      );
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status;
      if (status === 409) {
        setBooks((prev) =>
          prev.map((b) => (b.id === bookId ? { ...b, status: "want_to_read" as const } : b))
        );
      }
    }
  }

  function clearSearch() {
    setQuery("");
    loadCatalog();
  }

  return (
    <>
      <StarryBackground />
      <MainLayout>
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 relative">
          <AmbientParticles count={8} />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h1 className="font-heading text-4xl md:text-5xl font-semibold text-gradient-cream">
                Каталог книг
              </h1>
              <p className="text-[#9A7D5A] mt-2">
                {!loading && total > 0
                  ? searched
                    ? `Найдено ${total} книг`
                    : `${total} книг в каталоге`
                  : "Открой мир книг"}
              </p>
            </div>

            {/* Search */}
            <div className="space-y-3 max-w-2xl">
              {/* Mode toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("text")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    mode === "text"
                      ? "bg-amber/15 border-amber/40 text-amber"
                      : "border-border/60 text-muted-foreground hover:border-amber/30"
                  }`}
                >
                  По названию / автору
                </button>
                <button
                  onClick={() => setMode("semantic")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border flex items-center gap-1.5 ${
                    mode === "semantic"
                      ? "bg-amber/15 border-amber/40 text-amber"
                      : "border-border/60 text-muted-foreground hover:border-amber/30"
                  }`}
                >
                  <Sparkles size={13} />
                  Семантический
                </button>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={
                    mode === "semantic"
                      ? "меланхоличный Петербург, магический реализм..."
                      : "Достоевский, Дюна, Мастер и Маргарита..."
                  }
                  className="w-full pl-10 pr-24 py-3 rounded-xl bg-card/80 border border-amber/20 focus:border-amber/50 focus:outline-none text-foreground placeholder:text-muted-foreground text-sm transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  {query && (
                    <button
                      onClick={clearSearch}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg bg-amber hover:bg-amber-light disabled:opacity-50 text-background text-xs font-medium transition-all"
                  >
                    Найти
                  </button>
                </div>
              </div>

              {mode === "semantic" && (
                <p className="text-xs text-[#9A7D5A] flex items-center gap-1.5">
                  <Sparkles size={11} className="text-amber" />
                  Ищет по смыслу и атмосфере — попробуй «меланхоличный Петербург»
                </p>
              )}
            </div>
          </motion.div>

          {/* Loading skeletons */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-72 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && !loading && (
            <GlassCard className="max-w-sm mx-auto text-center py-8 space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={loadCatalog}
                className="text-xs text-amber hover:text-amber-light transition-colors"
              >
                Попробовать снова
              </button>
            </GlassCard>
          )}

          {/* Empty state after search */}
          {!loading && !error && books.length === 0 && searched && (
            <GlassCard className="text-center py-16 space-y-3">
              <BookOpen size={40} className="mx-auto text-amber/30" />
              <p className="font-heading text-xl text-cream">Ничего не найдено</p>
              <p className="text-sm text-muted-foreground">
                Попробуй другой запрос или{" "}
                <button
                  onClick={() => { setMode("semantic"); }}
                  className="text-amber hover:text-amber-light transition-colors"
                >
                  семантический поиск
                </button>
              </p>
            </GlassCard>
          )}

          {/* Empty catalog */}
          {!loading && !error && books.length === 0 && !searched && (
            <GlassCard className="text-center py-16 space-y-3">
              <BookOpen size={40} className="mx-auto text-amber/30" />
              <p className="font-heading text-xl text-cream">Каталог пуст</p>
              <p className="text-sm text-muted-foreground">
                Книги появятся после импорта данных
              </p>
            </GlassCard>
          )}

          {/* Results */}
          {!loading && !error && books.length > 0 && (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {books.map((book, i) => (
                <motion.div
                  key={book.id}
                  variants={staggerItem}
                  transition={{ delay: Math.min(i * 0.04, 0.5) }}
                >
                  <BookCard
                    book={book}
                    href={`/books/${book.id}`}
                    onStatusChange={() => handleAddToShelf(book.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </MainLayout>
    </>
  );
}
