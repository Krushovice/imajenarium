"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Brain, Users, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { StarryBackground, GlassCard, EmotionBadge, AmbientParticles } from "@/components/design-system";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import {
  fetchMyRecommendations,
  refreshDNARecommendations,
  refreshCollaborativeRecommendations,
  explainRecommendation,
  type RecommendationOut,
  type BookSearchResult,
} from "@/lib/api";
import { BookOpen } from "lucide-react";

// ── Mini book cover ──────────────────────────────────────────────────────────

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

// ── Recommendation card with inline explain ──────────────────────────────────

interface RecCardProps {
  rec: RecommendationOut;
  onExplain: (id: string) => Promise<void>;
  explaining: boolean;
}

function RecCard({ rec, onExplain, explaining }: RecCardProps) {
  const [expanded, setExpanded] = useState(false);
  const book = rec.book as BookSearchResult | null;
  const title = book?.title ?? "Без названия";
  const author = book?.author ?? "";
  const tags = book?.emotional_tags ?? [];
  const gradient = coverGradient(title);
  const score = Math.round(rec.score * 100);

  async function handleExplain(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!rec.ai_explanation) {
      await onExplain(rec.id);
    }
    setExpanded((v) => !v);
  }

  return (
    <motion.div
      layout
      whileHover={{ y: -3, boxShadow: "0 16px 50px rgba(212, 135, 58, 0.14)" }}
      transition={{ duration: 0.22 }}
      className="glass rounded-xl overflow-hidden"
    >
      {/* Cover strip */}
      <div className={cn("relative h-36 bg-gradient-to-b flex items-end p-3", gradient)}>
        {book?.cover_url ? (
          <img src={book.cover_url} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <BookOpen size={28} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20" />
        )}
        {/* Source badge */}
        <span className="relative z-10 text-[10px] font-medium px-2 py-0.5 rounded-full bg-background/70 backdrop-blur-sm text-amber border border-amber/20">
          {rec.source === "dna_similarity" ? "Literary DNA" : "Похожие читатели"}
        </span>
        {/* Match score */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-medium text-amber">
          <Sparkles size={9} />
          {score}%
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-heading text-base font-semibold text-cream leading-snug line-clamp-2">{title}</h3>
          <p className="text-xs text-muted-foreground">{author}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <EmotionBadge key={tag} label={tag.toLowerCase()} size="sm" />
          ))}
        </div>

        {/* Explain button */}
        <div className="pt-2 border-t border-border/60">
          <button
            onClick={handleExplain}
            disabled={explaining}
            className="flex items-center gap-1.5 text-xs text-amber hover:text-amber-light transition-colors font-medium"
          >
            {explaining ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Sparkles size={11} />
            )}
            Почему эта книга тебе?
            {!explaining && (expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
          </button>

          <AnimatePresence>
            {expanded && rec.ai_explanation && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-[#9A7D5A] leading-relaxed mt-2 overflow-hidden"
              >
                {rec.ai_explanation}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ── Source tab ───────────────────────────────────────────────────────────────

type SourceTab = "all" | "dna_similarity" | "collaborative";

const SOURCE_TABS: { id: SourceTab; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "Все", icon: <Sparkles size={13} /> },
  { id: "dna_similarity", label: "Literary DNA", icon: <Brain size={13} /> },
  { id: "collaborative", label: "Похожие читатели", icon: <Users size={13} /> },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<RecommendationOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<"dna" | "collab" | null>(null);
  const [explaining, setExplaining] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<SourceTab>("all");
  const [error, setError] = useState<string | null>(null);

  const loadRecs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyRecommendations(40);
      setRecs(data.items);
    } catch {
      setError("Не удалось загрузить рекомендации.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecs();
  }, [loadRecs]);

  async function handleRefreshDNA() {
    setRefreshing("dna");
    try {
      await refreshDNARecommendations(20);
      await loadRecs();
    } catch {
      setError("Ошибка обновления DNA рекомендаций.");
    } finally {
      setRefreshing(null);
    }
  }

  async function handleRefreshCollab() {
    setRefreshing("collab");
    try {
      await refreshCollaborativeRecommendations(20);
      await loadRecs();
    } catch {
      setError("Ошибка обновления коллаборативных рекомендаций.");
    } finally {
      setRefreshing(null);
    }
  }

  async function handleExplain(id: string) {
    setExplaining((prev) => new Set([...prev, id]));
    try {
      const updated = await explainRecommendation(id);
      setRecs((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } finally {
      setExplaining((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  const filtered = tab === "all" ? recs : recs.filter((r) => r.source === tab);

  return (
    <>
      <StarryBackground />
      <MainLayout>
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 relative">
          <AmbientParticles count={8} />

          {/* Header */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={staggerItem} className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <h1 className="font-heading text-4xl md:text-5xl font-semibold text-gradient-cream">
                  Для тебя
                </h1>
                <p className="text-[#9A7D5A]">
                  Книги, подобранные по твоему Literary DNA и похожим читателям
                </p>
              </div>

              {/* Refresh buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleRefreshDNA}
                  disabled={refreshing !== null}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber/25 text-sm text-amber hover:bg-amber/10 transition-all disabled:opacity-50"
                >
                  {refreshing === "dna" ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  Обновить DNA
                </button>
                <button
                  onClick={handleRefreshCollab}
                  disabled={refreshing !== null}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber/25 text-sm text-[#D4B896] hover:bg-amber/5 hover:text-amber transition-all disabled:opacity-50"
                >
                  {refreshing === "collab" ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Users size={13} />
                  )}
                  Обновить похожих
                </button>
              </div>
            </motion.div>

            {/* Source tabs */}
            <motion.div variants={staggerItem} className="flex gap-1">
              {SOURCE_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    tab === t.id
                      ? "bg-amber/15 text-amber border border-amber/30"
                      : "text-[#9A7D5A] hover:text-amber hover:bg-amber/5"
                  )}
                >
                  {t.icon}
                  {t.label}
                  {t.id === "all" && recs.length > 0 && (
                    <span className="text-xs opacity-60">({recs.length})</span>
                  )}
                  {t.id !== "all" && recs.filter((r) => r.source === t.id).length > 0 && (
                    <span className="text-xs opacity-60">
                      ({recs.filter((r) => r.source === t.id).length})
                    </span>
                  )}
                </button>
              ))}
            </motion.div>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <GlassCard className="border-destructive/30 text-center space-y-2">
                  <p className="text-sm text-destructive">{error}</p>
                  <button onClick={loadRecs} className="text-xs text-amber hover:text-amber-light transition-colors">
                    Попробовать снова
                  </button>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
                  <div className="h-36 bg-white/5" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && !error && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard glow className="max-w-md mx-auto text-center space-y-4">
                <div className="text-4xl">✦</div>
                <div>
                  <p className="font-heading text-lg text-cream">Рекомендации ещё не созданы</p>
                  <p className="text-sm text-[#9A7D5A] mt-1">
                    Нажми «Обновить DNA» — AI подберёт книги под твой профиль
                  </p>
                </div>
                <button
                  onClick={handleRefreshDNA}
                  disabled={refreshing !== null}
                  className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-amber/15 border border-amber/30 text-amber text-sm font-medium hover:bg-amber/25 transition-all"
                >
                  {refreshing === "dna" ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Вычислить рекомендации
                </button>
              </GlassCard>
            </motion.div>
          )}

          {/* Recommendation grid */}
          {!loading && filtered.length > 0 && (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filtered.map((rec, i) => (
                <motion.div key={rec.id} variants={staggerItem} transition={{ delay: i * 0.05 }}>
                  <RecCard
                    rec={rec}
                    onExplain={handleExplain}
                    explaining={explaining.has(rec.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Info card */}
          {!loading && filtered.length > 0 && (
            <GlassCard className="flex items-start gap-3 py-4">
              <Sparkles size={15} className="text-amber mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-cream">Как формируются рекомендации?</p>
                <p className="text-xs text-[#9A7D5A] leading-relaxed">
                  <strong className="text-[#D4B896]">Literary DNA</strong> — pgvector сравнивает вектор твоего
                  эмоционального профиля с атмосферными эмбеддингами книг.{" "}
                  <strong className="text-[#D4B896]">Похожие читатели</strong> — collaborative filtering:
                  книги из библиотек людей с похожим DNA и высокими оценками.
                  Нажми «Почему эта книга тебе?» — AI объяснит персонально.
                </p>
              </div>
            </GlassCard>
          )}
        </div>
      </MainLayout>
    </>
  );
}
