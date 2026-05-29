"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, ArrowRight, X } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { StarryBackground, GlassCard, EmotionBadge, AmbientParticles } from "@/components/design-system";
import { BookCard, type BookData } from "@/components/books";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/animations";
import { fetchPromptRecommendations, type EphemeralRecommendation } from "@/lib/api";

const MOOD_CHIPS = [
  { emoji: "🌙", label: "Меланхоличное" },
  { emoji: "⚡", label: "Напряжённое" },
  { emoji: "🌹", label: "Романтичное" },
  { emoji: "🔭", label: "Философское" },
  { emoji: "🏔️", label: "Эпическое" },
  { emoji: "🌀", label: "Сюрреальное" },
];

const EXAMPLE_PROMPTS = [
  "хочу что-то мрачное с атмосферой Достоевского, но в современном Токио",
  "как Дюна, но про любовь и потерю",
  "философское, медленное, с красивым языком",
  "детектив с ненадёжным рассказчиком и неожиданной концовкой",
];

function ephemeralToBookData(rec: EphemeralRecommendation, idx: number): BookData {
  return {
    id: rec.book_id ?? `ep-${idx}`,
    title: rec.title,
    author: rec.author,
    year: rec.book?.published_year ?? undefined,
    emotionTags: rec.book?.emotional_tags ?? (rec.dominant_emotion ? [rec.dominant_emotion] : []),
    matchScore: Math.round(rec.score * 100),
    whyRecommended: rec.explanation,
  };
}

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BookData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSearch(q: string) {
    if (!q.trim()) return;
    setSubmitted(q);
    setQuery(q);
    setLoading(true);
    setResults([]);
    setError(null);
    try {
      const data = await fetchPromptRecommendations(q, 6);
      setResults(data.items.map(ephemeralToBookData));
    } catch {
      setError("Не удалось получить рекомендации. Проверь подключение к серверу.");
    } finally {
      setLoading(false);
    }
  }

  function handleChip(label: string) {
    const q = `Хочу ${label.toLowerCase()} книгу`;
    setQuery(q);
    handleSearch(q);
  }

  function clearSearch() {
    setQuery("");
    setSubmitted("");
    setResults([]);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <>
      <StarryBackground />
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-10 relative">
          <AmbientParticles count={10} />

          {/* ── Header + Search ── */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-center space-y-8 pt-4"
          >
            <motion.div variants={staggerItem} className="space-y-3">
              <h1 className="font-heading text-5xl md:text-6xl font-semibold text-gradient-cream leading-tight">
                Открытия
              </h1>
              <p className="text-[#9A7D5A] text-lg">
                Опиши что хочешь — AI найдёт книги по настроению
              </p>
            </motion.div>

            {/* AI prompt input */}
            <motion.div variants={staggerItem} className="max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-amber pointer-events-none">
                  <Sparkles size={18} />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
                  placeholder="хочу что-то мрачное с атмосферой Достоевского..."
                  className="w-full pl-12 pr-24 py-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-amber/20 focus:border-amber/50 focus:outline-none text-foreground placeholder:text-muted-foreground text-base transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {query && (
                    <button
                      onClick={clearSearch}
                      className="p-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleSearch(query)}
                    disabled={!query.trim() || loading}
                    className="p-2 rounded-xl bg-amber hover:bg-amber-light text-background transition-all disabled:opacity-50"
                  >
                    <Search size={18} />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Mood chips */}
            {!submitted && (
              <motion.div variants={staggerItem} className="flex flex-wrap gap-2 justify-center">
                {MOOD_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleChip(chip.label)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-amber/25 text-sm text-[#D4B896] hover:border-amber/50 hover:bg-amber/5 hover:text-amber transition-all"
                  >
                    <span>{chip.emoji}</span>
                    {chip.label}
                  </button>
                ))}
              </motion.div>
            )}

            {/* Example prompts */}
            {!submitted && (
              <motion.div variants={staggerItem} className="space-y-2">
                <p className="text-xs text-muted-foreground">Примеры запросов</p>
                <div className="flex flex-col gap-1.5 max-w-xl mx-auto">
                  {EXAMPLE_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSearch(p)}
                      className="text-sm text-[#9A7D5A] hover:text-amber text-left px-3 py-1.5 rounded-lg hover:bg-amber/5 transition-all flex items-center gap-2 group"
                    >
                      <ArrowRight size={12} className="text-amber/50 group-hover:text-amber shrink-0" />
                      «{p}»
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* ── Loading ── */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4"
              >
                <GlassCard glow className="max-w-sm mx-auto text-center space-y-4">
                  <motion.div
                    className="text-4xl"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ✦
                  </motion.div>
                  <div>
                    <p className="font-heading text-lg text-cream">AI ищет книги...</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Анализирую твой запрос и Literary DNA
                    </p>
                  </div>
                  <div className="space-y-1.5 text-left">
                    {["Анализ запроса...", "Поиск по эмбеддингам...", "Формирование объяснений..."].map((s, i) => (
                      <motion.div
                        key={s}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.5 }}
                        className="flex items-center gap-2 text-xs text-[#9A7D5A]"
                      >
                        <motion.div
                          className="w-1.5 h-1.5 rounded-full bg-amber"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
                        />
                        {s}
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Error ── */}
          <AnimatePresence>
            {error && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <GlassCard className="max-w-sm mx-auto text-center space-y-2 border-destructive/30">
                  <p className="text-sm text-destructive">{error}</p>
                  <button onClick={clearSearch} className="text-xs text-amber hover:text-amber-light transition-colors">
                    Попробовать снова
                  </button>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Results ── */}
          <AnimatePresence>
            {results.length > 0 && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber" />
                      Найдено {results.length} книг по запросу:
                    </p>
                    <p className="font-heading text-lg text-cream mt-0.5">«{submitted}»</p>
                  </div>
                  <button
                    onClick={clearSearch}
                    className="text-sm text-muted-foreground hover:text-amber transition-colors"
                  >
                    Новый поиск
                  </button>
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {results.map((book, i) => (
                    <motion.div
                      key={book.id}
                      variants={staggerItem}
                      transition={{ delay: i * 0.08 }}
                    >
                      <BookCard book={book} />
                    </motion.div>
                  ))}
                </motion.div>

                {/* DNA explanation */}
                <GlassCard className="flex items-start gap-3 py-4">
                  <Sparkles size={16} className="text-amber mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-cream">Как AI подбирал книги?</p>
                    <p className="text-xs text-[#9A7D5A] leading-relaxed">
                      AI проанализировал твой запрос, выделил эмоциональные маркеры (меланхолия, атмосфера города, психологизм)
                      и сопоставил с твоим Literary DNA профилем. Книги ранжированы по семантическому совпадению через pgvector.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {["меланхолия", "городское", "психологизм", "японское"].map((t) => (
                        <EmotionBadge key={t} label={t} size="sm" />
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </MainLayout>
    </>
  );
}
