"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpen, Calendar, Sparkles, Star, TrendingUp } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { StarryBackground, GlassCard, EmotionBadge, AmbientParticles } from "@/components/design-system";
import { BookCard, type BookData } from "@/components/books";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/animations";
import { useAuthStore } from "@/store/auth.store";
import {
  fetchMyDNA,
  fetchMyShelf,
  fetchMyDiary,
  fetchMyRecommendations,
  type LiteraryDNAOut,
  type UserBookOut,
  type DiaryEntryOut,
  type RecommendationOut,
} from "@/lib/api";

// ── DNA helpers ────────────────────────────────────────────────────────────

const DNA_LABEL_MAP: Record<string, string> = {
  // DEFAULT_METRICS axes
  darkness: "Тёмность",
  tension: "Напряжение",
  romanticism: "Романтика",
  philosophy: "Философия",
  humor: "Юмор",
  adventure: "Приключение",
  social_themes: "Социальность",
  psychological_depth: "Психология",
  lyrical: "Лиричность",
  pacing: "Темп",
  // AI-enriched fields (may appear in metrics after AI merge)
  romance: "Романтика",
  mystery: "Тайна",
  intellect: "Интеллект",
  melancholy: "Меланхолия",
  magic: "Магия",
  dark: "Тёмное",
  nostalgia: "Ностальгия",
  surrealism: "Сюрреализм",
  psychology: "Психология",
  atmosphere: "Атмосфера",
  poetic: "Поэтичность",
};

const DNA_COLOR_MAP: Record<string, string> = {
  darkness: "#607080",
  tension: "#D07060",
  romanticism: "#D080A0",
  philosophy: "#9080D0",
  humor: "#D4C073",
  adventure: "#80C090",
  social_themes: "#8EB0D0",
  psychological_depth: "#C08080",
  lyrical: "#D0C0A0",
  pacing: "#90A080",
  romance: "#D080A0",
  mystery: "#D4873A",
  intellect: "#8EB0D0",
  melancholy: "#7080B0",
  magic: "#B080D0",
  dark: "#607080",
  nostalgia: "#D0A060",
  surrealism: "#80B0C0",
  psychology: "#C08080",
  atmosphere: "#90A080",
  poetic: "#D0C0A0",
};

const PALETTE = [
  "#9080D0","#D080A0","#D4873A","#8EB0D0","#7080B0",
  "#80C090","#D4C073","#D07060","#B080D0","#607080",
];

interface DNATrait {
  key: string;
  label: string;
  value: number;
  color: string;
}

function metricsToTraits(metrics: Record<string, number>): DNATrait[] {
  return Object.entries(metrics)
    .filter(([, v]) => typeof v === "number")
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([key, value], i) => ({
      key,
      label: DNA_LABEL_MAP[key] ?? key,
      value: Math.min(1, Math.max(0, value)),
      color: DNA_COLOR_MAP[key] ?? PALETTE[i % PALETTE.length],
    }));
}

// ── Map backend → BookData ─────────────────────────────────────────────────

function shelfToBookData(ub: UserBookOut): BookData {
  return {
    id: ub.id,
    title: ub.book?.title ?? "Неизвестная книга",
    author: ub.book?.author ?? "",
    year: ub.book?.published_year ?? undefined,
    emotionTags: (ub.book?.emotional_tags ?? []) as string[],
    rating: ub.rating ?? undefined,
    status: ub.status as BookData["status"],
    quote: ub.quotes?.[0] ?? undefined,
  };
}

function recToBookData(rec: RecommendationOut, idx: number): BookData {
  return {
    id: rec.id ?? `r${idx}`,
    title: rec.book?.title ?? "Книга",
    author: rec.book?.author ?? "",
    year: rec.book?.published_year ?? undefined,
    emotionTags: (rec.book?.emotional_tags ?? []) as string[],
    matchScore: rec.book ? Math.round(rec.score * 100) : undefined,
    whyRecommended: rec.ai_explanation ?? undefined,
  };
}

// ── DNA Radar Chart ────────────────────────────────────────────────────────

function DNARadarChart({ traits }: { traits: DNATrait[] }) {
  if (traits.length === 0) return null;
  const cx = 160, cy = 160, r = 110;
  const N = traits.length;

  function pt(i: number, value: number) {
    const angle = (-Math.PI / 2) + (2 * Math.PI * i / N);
    return { x: cx + value * r * Math.cos(angle), y: cy + value * r * Math.sin(angle) };
  }

  function labelPt(i: number) {
    const angle = (-Math.PI / 2) + (2 * Math.PI * i / N);
    return { x: cx + (r + 30) * Math.cos(angle), y: cy + (r + 30) * Math.sin(angle), angle };
  }

  const dnaPoints = traits.map((t, i) => { const p = pt(i, t.value); return `${p.x},${p.y}`; }).join(" ");
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <svg viewBox="0 0 320 320" width="100%" className="max-w-xs mx-auto">
      <defs>
        <radialGradient id="dna-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(212, 135, 58, 0.25)" />
          <stop offset="100%" stopColor="rgba(144, 128, 208, 0.12)" />
        </radialGradient>
      </defs>
      {gridLevels.map((lv) => {
        const pts = traits.map((_, i) => { const p = pt(i, lv); return `${p.x},${p.y}`; }).join(" ");
        return <polygon key={lv} points={pts} fill="none" stroke="rgba(212, 135, 58, 0.10)" strokeWidth={0.8} />;
      })}
      {traits.map((_, i) => {
        const end = pt(i, 1.0);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(212, 135, 58, 0.12)" strokeWidth={0.8} />;
      })}
      <motion.polygon
        points={dnaPoints}
        fill="url(#dna-fill)"
        stroke="rgba(212, 135, 58, 0.65)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.25, 0, 0.35, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {traits.map((t, i) => {
        const p = pt(i, t.value);
        return (
          <motion.circle
            key={t.key}
            cx={p.x} cy={p.y} r={4.5}
            fill={t.color}
            stroke="rgba(35, 21, 8, 0.8)"
            strokeWidth={1.5}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.9 + i * 0.08 }}
          />
        );
      })}
      {traits.map((t, i) => {
        const lp = labelPt(i);
        const cosA = Math.cos(lp.angle);
        const anchor = cosA > 0.2 ? "start" : cosA < -0.2 ? "end" : "middle";
        return (
          <text key={t.key} x={lp.x} y={lp.y} textAnchor={anchor} dominantBaseline="central"
            fontSize={9.5} fill="rgba(212, 184, 150, 0.85)" fontFamily="var(--font-inter)">
            {t.label}
          </text>
        );
      })}
      <circle cx={cx} cy={cy} r={3} fill="rgba(212, 135, 58, 0.5)" />
    </svg>
  );
}

// ── Empty / Loading states ─────────────────────────────────────────────────

function LoadingRow() {
  return (
    <div className="animate-pulse space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-xl bg-white/5" />
      ))}
    </div>
  );
}

// ── Tab types ──────────────────────────────────────────────────────────────

type Tab = "dna" | "library" | "diary" | "recommendations";

// ── DNA Tab ────────────────────────────────────────────────────────────────

function DNATab({ dna }: { dna: LiteraryDNAOut | undefined }) {
  const traits = dna ? metricsToTraits(dna.metrics) : [];
  const topEmotions = traits.slice(0, 6).map((t) => t.label.toLowerCase());

  if (!dna) {
    return (
      <GlassCard className="text-center py-12 space-y-3">
        <Sparkles className="mx-auto text-amber/40" size={32} />
        <p className="font-heading text-lg text-cream">Literary DNA формируется</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Пройди онбординг и добавь первые книги — DNA появится автоматически
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <GlassCard glow className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-gradient-cream">Радар вкусов</h2>
          <span className="text-xs text-amber font-medium tracking-wider flex items-center gap-1">
            <Sparkles size={11} /> LIVE
          </span>
        </div>
        <DNARadarChart traits={traits} />
        <p className="text-xs text-muted-foreground text-center">
          Обновляется автоматически с каждой книгой и рецензией
        </p>
      </GlassCard>

      <div className="space-y-4">
        <GlassCard className="space-y-4">
          <h2 className="font-heading text-xl font-semibold text-gradient-cream">Черты DNA</h2>
          {traits.length === 0 ? (
            <p className="text-sm text-muted-foreground">Данных пока нет</p>
          ) : (
            traits.sort((a, b) => b.value - a.value).map((t, i) => (
              <div key={t.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#D4B896] font-medium">{t.label}</span>
                  <span className="font-medium" style={{ color: t.color }}>{Math.round(t.value * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: t.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${t.value * 100}%` }}
                    transition={{ duration: 1.0, delay: i * 0.08, ease: [0.25, 0, 0.35, 1] }}
                  />
                </div>
              </div>
            ))
          )}
        </GlassCard>

        {topEmotions.length > 0 && (
          <GlassCard className="space-y-3">
            <h3 className="font-heading text-base font-semibold text-cream">Топ эмоциональных тэгов</h3>
            <div className="flex flex-wrap gap-2">
              {topEmotions.map((e) => <EmotionBadge key={e} label={e} size="md" />)}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

// ── Library Tab ────────────────────────────────────────────────────────────

function LibraryTab({ items, isLoading }: { items: UserBookOut[]; isLoading: boolean }) {
  const [filter, setFilter] = useState<BookData["status"] | "all">("all");

  const statuses: { key: BookData["status"] | "all"; label: string }[] = [
    { key: "all", label: "Все" },
    { key: "read", label: "Прочитано" },
    { key: "reading", label: "Читаю" },
    { key: "want_to_read", label: "Хочу прочитать" },
  ];

  const filtered = filter === "all" ? items : items.filter((b) => b.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s.key ?? "all"}
            onClick={() => setFilter(s.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filter === s.key
                ? "border-amber bg-amber/10 text-amber"
                : "border-border/60 text-muted-foreground hover:border-amber/30 hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingRow />
      ) : filtered.length === 0 ? (
        <GlassCard className="text-center py-12 space-y-2">
          <BookOpen className="mx-auto text-amber/40" size={32} />
          <p className="text-sm text-muted-foreground">Библиотека пуста — добавь первые книги</p>
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ub) => (
            <motion.div key={ub.id} variants={fadeInUp} initial="hidden" animate="visible">
              <BookCard
                book={shelfToBookData(ub)}
                href={ub.book_id ? `/books/${ub.book_id}` : undefined}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Diary Tab ──────────────────────────────────────────────────────────────

function DiaryTab({ entries, isLoading }: { entries: DiaryEntryOut[]; isLoading: boolean }) {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold text-gradient-cream">Читательский дневник</h2>
        <button className="text-xs text-amber hover:text-amber-light font-medium transition-colors">
          + Новая запись
        </button>
      </div>

      {isLoading ? (
        <LoadingRow />
      ) : entries.length === 0 ? (
        <GlassCard className="text-center py-12 space-y-2">
          <Calendar className="mx-auto text-amber/40" size={32} />
          <p className="text-sm text-muted-foreground">Дневник пуст — запиши первые впечатления</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{entry.mood ?? "📖"}</span>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString("ru-RU", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-[#D4B896] leading-relaxed line-clamp-3">{entry.content}</p>
                {entry.emotion_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {entry.emotion_tags.map((tag) => (
                      <EmotionBadge key={tag} label={tag} size="sm" />
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Recommendations Tab ────────────────────────────────────────────────────

function RecommendationsTab({ recs, isLoading }: { recs: RecommendationOut[]; isLoading: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles size={14} className="text-amber" />
        AI подобрал книги специально под твой Literary DNA
      </div>

      {isLoading ? (
        <LoadingRow />
      ) : recs.length === 0 ? (
        <GlassCard className="text-center py-12 space-y-2">
          <Sparkles className="mx-auto text-amber/40" size={32} />
          <p className="text-sm text-muted-foreground">
            Рекомендации появятся после добавления первых книг в библиотеку
          </p>
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recs.map((rec, i) => (
            <motion.div
              key={rec.id}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: i * 0.12 }}
            >
              <BookCard
                book={recToBookData(rec, i)}
                href={rec.book_id ? `/books/${rec.book_id}` : undefined}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("dna");
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: dna, isLoading: dnaLoading } = useQuery({
    queryKey: ["dna", "me"],
    queryFn: fetchMyDNA,
    enabled: isAuthenticated,
    retry: 1,
  });

  const { data: shelf, isLoading: shelfLoading } = useQuery({
    queryKey: ["shelf", "me"],
    queryFn: () => fetchMyShelf(),
    enabled: isAuthenticated,
    retry: 1,
  });

  const { data: diary, isLoading: diaryLoading } = useQuery({
    queryKey: ["diary", "me"],
    queryFn: () => fetchMyDiary(20),
    enabled: isAuthenticated,
    retry: 1,
  });

  const { data: recs, isLoading: recsLoading } = useQuery({
    queryKey: ["recommendations", "me"],
    queryFn: () => fetchMyRecommendations(20),
    enabled: isAuthenticated,
    retry: 1,
  });

  const shelfItems = shelf?.items ?? [];
  const diaryEntries = diary?.items ?? [];
  const recItems = recs?.items ?? [];

  const readCount = shelfItems.filter((b) => b.status === "read").length;
  const avgRating = (() => {
    const rated = shelfItems.filter((b) => b.rating != null);
    if (!rated.length) return null;
    const avg = rated.reduce((acc, b) => acc + (b.rating ?? 0), 0) / rated.length;
    return avg.toFixed(1);
  })();

  const displayName = user?.displayName ?? user?.username ?? "Читатель";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "ЧТ";

  const tabs: { key: Tab; label: string }[] = [
    { key: "dna",             label: "Literary DNA" },
    { key: "library",         label: "Библиотека" },
    { key: "diary",           label: "Дневник" },
    { key: "recommendations", label: "Рекомендации" },
  ];

  const topTraits = dna ? metricsToTraits(dna.metrics).slice(0, 3).map((t) => t.label.toLowerCase()) : [];

  return (
    <>
      <StarryBackground />
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 relative">
          <AmbientParticles count={8} />

          {/* ── Profile header ── */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-start sm:items-center gap-6"
          >
            <motion.div variants={staggerItem}>
              <Avatar className="h-20 w-20 ring-2 ring-amber/30">
                <AvatarFallback className="bg-amber/10 text-amber font-heading text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </motion.div>

            <motion.div variants={staggerItem} className="flex-1 space-y-2">
              <div>
                <h1 className="font-heading text-3xl font-semibold text-gradient-cream">
                  {displayName}
                </h1>
                {user?.username && (
                  <p className="text-muted-foreground text-sm">@{user.username}</p>
                )}
              </div>
              {topTraits.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {topTraits.map((e) => <EmotionBadge key={e} label={e} size="sm" />)}
                </div>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="font-heading text-xl font-bold text-gradient-amber">{readCount}</div>
                <div className="text-xs text-muted-foreground">Прочитано</div>
              </div>
              {avgRating && (
                <div className="text-center">
                  <div className="font-heading text-xl font-bold text-gradient-amber">{avgRating}</div>
                  <div className="text-xs text-muted-foreground">Средняя оценка</div>
                </div>
              )}
              <div className="text-center">
                <div className="font-heading text-xl font-bold text-gradient-amber">{diaryEntries.length}</div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Calendar size={10} /> Записей
                </div>
              </div>
              <div className="text-center">
                <div className="font-heading text-xl font-bold text-gradient-amber">
                  {dna?.version ?? 0}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <TrendingUp size={10} /> DNA версия
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Tabs ── */}
          <div className="flex gap-1 border-b border-border/60 overflow-x-auto pb-0 scrollbar-thin">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                  activeTab === t.key
                    ? "border-amber text-amber"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab content ── */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {activeTab === "dna" && (
              dnaLoading
                ? <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-2 border-amber border-t-transparent rounded-full" /></div>
                : <DNATab dna={dna} />
            )}
            {activeTab === "library" && (
              <LibraryTab items={shelfItems} isLoading={shelfLoading} />
            )}
            {activeTab === "diary" && (
              <DiaryTab entries={diaryEntries} isLoading={diaryLoading} />
            )}
            {activeTab === "recommendations" && (
              <RecommendationsTab recs={recItems} isLoading={recsLoading} />
            )}
          </motion.div>
        </div>
      </MainLayout>
    </>
  );
}
