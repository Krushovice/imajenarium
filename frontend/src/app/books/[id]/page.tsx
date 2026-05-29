"use client";

import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Star, Sparkles, ChevronLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { MainLayout } from "@/components/layout";
import { StarryBackground, GlassCard, EmotionBadge } from "@/components/design-system";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/animations";
import {
  getBook,
  getShelfEntry,
  addToShelf,
  updateShelfEntry,
  type BookOut,
  type UserBookOut,
} from "@/lib/api";

function coverGradient(title: string): string {
  const hash = [...title].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const palettes = [
    "from-[#3A2030] to-[#6A3050]",
    "from-[#202030] to-[#403060]",
    "from-[#2A3020] to-[#405030]",
    "from-[#3A2820] to-[#6A4030]",
    "from-[#203038] to-[#304858]",
    "from-[#2A2020] to-[#504030]",
  ];
  return palettes[hash % palettes.length];
}

const STATUS_OPTIONS = [
  { value: "want_to_read", label: "Хочу прочитать" },
  { value: "reading", label: "Читаю" },
  { value: "read", label: "Прочитано" },
  { value: "abandoned", label: "Отложил" },
] as const;

type StatusValue = (typeof STATUS_OPTIONS)[number]["value"];

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [book, setBook] = useState<BookOut | null>(null);
  const [shelfEntry, setShelfEntry] = useState<UserBookOut | null>(null);
  const [loadingBook, setLoadingBook] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<StatusValue | "">("");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dnaUpdated, setDnaUpdated] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoadingBook(true);
    setError(null);
    try {
      const [bookResult, shelfResult] = await Promise.allSettled([
        getBook(id),
        getShelfEntry(id),
      ]);

      if (bookResult.status === "fulfilled") {
        setBook(bookResult.value);
      } else {
        setError("Книга не найдена");
        return;
      }

      if (shelfResult.status === "fulfilled") {
        const entry = shelfResult.value;
        setShelfEntry(entry);
        setSelectedStatus(entry.status as StatusValue);
        setRating(entry.rating ? Math.ceil(entry.rating / 2) : 0);
        setReview(entry.review ?? "");
      }
    } finally {
      setLoadingBook(false);
    }
  }

  async function handleSaveShelf() {
    if (!book || !selectedStatus) return;
    setSaving(true);
    try {
      const payload = {
        status: selectedStatus,
        rating: rating > 0 ? rating * 2 : undefined,
        review: review.trim() || undefined,
      };

      let result: UserBookOut;
      if (shelfEntry) {
        result = await updateShelfEntry(id, payload);
      } else {
        result = await addToShelf(id, payload);
      }
      setShelfEntry(result);
      setSaved(true);
      if (payload.review || payload.rating) setDnaUpdated(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silently fail — could show toast in future
    } finally {
      setSaving(false);
    }
  }

  if (loadingBook) {
    return (
      <>
        <StarryBackground />
        <MainLayout>
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />
            <div className="h-8 w-1/2 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-1/3 rounded bg-white/5 animate-pulse" />
            <div className="h-32 rounded-xl bg-white/5 animate-pulse" />
          </div>
        </MainLayout>
      </>
    );
  }

  if (error || !book) {
    return (
      <>
        <StarryBackground />
        <MainLayout>
          <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
            <p className="text-destructive">{error ?? "Книга не найдена"}</p>
            <Link href="/books" className="text-sm text-amber hover:text-amber-light transition-colors">
              ← Вернуться в каталог
            </Link>
          </div>
        </MainLayout>
      </>
    );
  }

  const gradient = coverGradient(book.title);
  const emotionTags = (book.emotional_tags as string[]) ?? [];
  const showRating = selectedStatus === "reading" || selectedStatus === "read";
  const showReview = selectedStatus === "read";

  return (
    <>
      <StarryBackground />
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Back */}
          <Link
            href="/books"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-amber transition-colors w-fit"
          >
            <ChevronLeft size={16} />
            Каталог
          </Link>

          {/* Hero: cover + main info */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-[220px_1fr] gap-8 items-start"
          >
            {/* Cover */}
            <motion.div variants={staggerItem}>
              <div
                className={`relative h-80 md:h-[340px] rounded-2xl bg-gradient-to-b ${gradient} flex items-center justify-center overflow-hidden shadow-2xl`}
              >
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen size={64} className="text-white/20" />
                )}
              </div>
            </motion.div>

            {/* Info + shelf action */}
            <motion.div variants={staggerItem} className="space-y-5">
              {/* Title block */}
              <div>
                <h1 className="font-heading text-3xl md:text-4xl font-semibold text-gradient-cream leading-tight">
                  {book.title}
                </h1>
                <p className="text-[#9A7D5A] text-lg mt-1">{book.author}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {[
                    book.published_year,
                    book.page_count ? `${book.page_count} стр.` : null,
                    book.language !== "ru" ? book.language : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              {/* Emotional tags */}
              {emotionTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {emotionTags.map((tag) => (
                    <EmotionBadge key={tag} label={tag} size="md" />
                  ))}
                </div>
              )}

              {/* Current shelf status indicator */}
              {shelfEntry && (
                <div className="flex items-center gap-2 text-sm text-amber font-medium">
                  <Check size={14} />
                  {STATUS_OPTIONS.find((s) => s.value === shelfEntry.status)?.label ?? shelfEntry.status}
                </div>
              )}

              {/* Shelf action card */}
              <GlassCard className="space-y-4">
                <h3 className="font-heading text-base font-semibold text-cream">
                  {shelfEntry ? "Обновить в библиотеке" : "Добавить в библиотеку"}
                </h3>

                {/* Status buttons */}
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedStatus(opt.value)}
                      className={`px-3.5 py-1.5 rounded-full text-sm transition-all border ${
                        selectedStatus === opt.value
                          ? "bg-amber/15 border-amber/50 text-amber font-medium"
                          : "border-border/60 text-muted-foreground hover:border-amber/30 hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Rating */}
                {showRating && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Оценка</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => setRating(s === rating ? 0 : s)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            size={22}
                            className={
                              s <= rating
                                ? "text-amber fill-amber"
                                : "text-border hover:text-amber/50"
                            }
                          />
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-2 text-xs text-amber self-center">
                          {rating * 2}/10
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Review */}
                {showReview && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Рецензия</p>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Поделись впечатлениями — Literary DNA учтёт их..."
                      rows={4}
                      className="w-full px-3 py-2.5 rounded-xl bg-background/50 border border-border/60 focus:border-amber/40 focus:outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none transition-all"
                    />
                    <p className="text-xs text-[#9A7D5A]">
                      Рецензия обновит твой Literary DNA профиль
                    </p>
                  </div>
                )}

                {/* Save */}
                <button
                  onClick={handleSaveShelf}
                  disabled={!selectedStatus || saving}
                  className="w-full py-2.5 rounded-xl bg-amber hover:bg-amber-light disabled:opacity-50 text-background font-medium text-sm transition-all flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Сохранение...
                    </>
                  ) : saved ? (
                    <>
                      <Check size={14} />
                      Сохранено
                    </>
                  ) : shelfEntry ? (
                    "Обновить"
                  ) : (
                    "Добавить в библиотеку"
                  )}
                </button>

                {/* DNA update notice */}
                {dnaUpdated && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-xs text-amber"
                  >
                    <Sparkles size={12} />
                    Literary DNA обновляется в фоне...
                  </motion.div>
                )}
              </GlassCard>
            </motion.div>
          </motion.div>

          {/* Description + AI summary */}
          {(book.description || book.ai_summary) && (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {book.description && (
                <motion.div variants={fadeInUp}>
                  <GlassCard className="space-y-3">
                    <h2 className="font-heading text-lg font-semibold text-cream">О книге</h2>
                    <p className="text-sm text-[#C4A882] leading-relaxed">{book.description}</p>
                  </GlassCard>
                </motion.div>
              )}
              {book.ai_summary && book.ai_summary !== book.description && (
                <motion.div variants={fadeInUp}>
                  <GlassCard className="space-y-3">
                    <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-cream">
                      <Sparkles size={16} className="text-amber" />
                      AI-анализ атмосферы
                    </h2>
                    <p className="text-sm text-[#9A7D5A] leading-relaxed">{book.ai_summary}</p>
                  </GlassCard>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Friend quotes */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <GlassCard className="space-y-3">
              <h2 className="font-heading text-lg font-semibold text-cream">Цитаты друзей</h2>
              {shelfEntry?.quotes && shelfEntry.quotes.length > 0 ? (
                <div className="space-y-2">
                  {(shelfEntry.quotes as string[]).map((q, i) => (
                    <blockquote
                      key={i}
                      className="border-l-2 border-amber/40 pl-3 text-sm text-[#9A7D5A] italic leading-relaxed"
                    >
                      «{q}»
                    </blockquote>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Когда друзья прочитают эту книгу и оставят цитаты — они появятся здесь.
                </p>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </MainLayout>
    </>
  );
}
