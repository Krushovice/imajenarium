"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Quote,
  Dna,
} from "lucide-react";
import { MainLayout } from "@/components/layout";
import {
  StarryBackground,
  GlassCard,
  EmotionBadge,
  AmbientParticles,
} from "@/components/design-system";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import {
  fetchMyDiary,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
  analyzeDiaryEntry,
  type DiaryEntryOut,
  type DiaryEntryCreate,
  type DiaryEntryUpdate,
} from "@/lib/api";

// ── Mood config ───────────────────────────────────────────────────────────────

const MOODS = [
  { id: "восторг", label: "Восторг", emoji: "✨" },
  { id: "вдохновение", label: "Вдохновение", emoji: "🔥" },
  { id: "умиротворение", label: "Умиротворение", emoji: "🌿" },
  { id: "грусть", label: "Грусть", emoji: "🌧" },
  { id: "тревога", label: "Тревога", emoji: "🌀" },
  { id: "восхищение", label: "Восхищение", emoji: "💫" },
  { id: "задумчивость", label: "Задумчивость", emoji: "🌙" },
  { id: "радость", label: "Радость", emoji: "☀️" },
];

function moodEmoji(mood: string | null): string {
  if (!mood) return "📖";
  return MOODS.find((m) => m.id === mood)?.emoji ?? "📖";
}

// ── Date format ───────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

// ── Entry Card ────────────────────────────────────────────────────────────────

interface EntryCardProps {
  entry: DiaryEntryOut;
  onEdit: (entry: DiaryEntryOut) => void;
  onDelete: (id: string) => Promise<void>;
  onAnalyze: (id: string) => Promise<void>;
  analyzing: boolean;
  deleting: boolean;
}

function EntryCard({ entry, onEdit, onDelete, onAnalyze, analyzing, deleting }: EntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const preview = entry.content.length > 200 ? entry.content.slice(0, 200) + "…" : entry.content;
  const hasQuotes = entry.quotes.length > 0;
  const hasTags = entry.emotion_tags.length > 0;

  return (
    <motion.div layout variants={staggerItem} className="glass rounded-2xl overflow-hidden">
      {/* Top accent bar */}
      <div className="h-0.5 bg-gradient-to-r from-amber/60 via-amber/20 to-transparent" />

      <div className="p-5 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">{moodEmoji(entry.mood)}</span>
            <div className="min-w-0">
              <p className="text-xs text-[#9A7D5A]">
                {formatDate(entry.created_at)} · {formatTime(entry.created_at)}
              </p>
              {entry.mood && (
                <p className="text-sm font-medium text-cream capitalize">{entry.mood}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* DNA badge */}
            {entry.dna_impact_applied && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-400/25 text-violet-300 font-medium">
                <Dna size={9} />
                DNA
              </span>
            )}

            {/* Analyze */}
            {!entry.dna_impact_applied && (
              <button
                onClick={() => onAnalyze(entry.id)}
                disabled={analyzing}
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-amber/25 text-amber hover:bg-amber/10 transition-colors disabled:opacity-50"
              >
                {analyzing ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
                AI-анализ
              </button>
            )}

            {/* Edit */}
            <button
              onClick={() => onEdit(entry)}
              className="p-1.5 rounded-lg text-[#9A7D5A] hover:text-cream hover:bg-white/5 transition-colors"
            >
              <Pencil size={13} />
            </button>

            {/* Delete */}
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={async () => {
                    setConfirmDelete(false);
                    await onDelete(entry.id);
                  }}
                  disabled={deleting}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  {deleting ? <Loader2 size={9} className="animate-spin" /> : "Да"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-[#9A7D5A] hover:text-cream transition-colors"
                >
                  Нет
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg text-[#9A7D5A] hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="text-sm text-[#D4B896] leading-relaxed whitespace-pre-wrap">
          {expanded ? entry.content : preview}
        </div>

        {entry.content.length > 200 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-[#9A7D5A] hover:text-amber transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? "Свернуть" : "Читать полностью"}
          </button>
        )}

        {/* Quotes */}
        {hasQuotes && (
          <div className="space-y-1.5 border-l-2 border-amber/30 pl-3">
            {(entry.quotes as string[]).map((q, i) => (
              <p key={i} className="text-xs text-[#9A7D5A] italic leading-relaxed">
                <Quote size={9} className="inline mr-1 text-amber/60" />
                {q}
              </p>
            ))}
          </div>
        )}

        {/* Emotion tags */}
        {hasTags && (
          <div className="flex flex-wrap gap-1">
            {(entry.emotion_tags as string[]).map((tag) => (
              <EmotionBadge key={tag} label={tag.toLowerCase()} size="sm" />
            ))}
          </div>
        )}

        {/* AI analysis snippet */}
        {entry.ai_emotional_analysis && (
          <div className="rounded-xl bg-violet-500/8 border border-violet-400/15 px-3 py-2">
            <p className="text-[11px] text-violet-300/80 leading-relaxed">
              <Sparkles size={9} className="inline mr-1 text-violet-400/60" />
              {typeof entry.ai_emotional_analysis === "object" &&
              "summary" in entry.ai_emotional_analysis
                ? String(entry.ai_emotional_analysis.summary)
                : "AI-анализ применён"}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Entry Form Modal ──────────────────────────────────────────────────────────

interface EntryFormProps {
  initial?: DiaryEntryOut | null;
  onSave: (data: DiaryEntryCreate | DiaryEntryUpdate) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

function EntryForm({ initial, onSave, onClose, saving }: EntryFormProps) {
  const [content, setContent] = useState(initial?.content ?? "");
  const [mood, setMood] = useState<string>(initial?.mood ?? "");
  const [quotesRaw, setQuotesRaw] = useState<string>(
    initial?.quotes ? (initial.quotes as string[]).join("\n") : ""
  );
  const [tagsRaw, setTagsRaw] = useState<string>(
    initial?.emotion_tags ? (initial.emotion_tags as string[]).join(", ") : ""
  );
  const [isPrivate, setIsPrivate] = useState(initial?.is_private ?? false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    const quotes = quotesRaw
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);
    const emotion_tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await onSave({
      content: content.trim(),
      mood: mood || null,
      quotes,
      emotion_tags,
      is_private: isPrivate,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg glass rounded-2xl overflow-hidden"
      >
        {/* Top bar */}
        <div className="h-0.5 bg-gradient-to-r from-amber/70 via-amber/30 to-transparent" />

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl text-cream">
              {initial ? "Редактировать запись" : "Новая запись"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9A7D5A] hover:text-cream hover:bg-white/5 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mood selector */}
          <div className="space-y-2">
            <label className="text-xs text-[#9A7D5A] font-medium">Настроение</label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(mood === m.id ? "" : m.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all",
                    mood === m.id
                      ? "bg-amber/20 border border-amber/40 text-amber"
                      : "border border-white/10 text-[#9A7D5A] hover:border-amber/20 hover:text-cream"
                  )}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-xs text-[#9A7D5A] font-medium">
              Запись <span className="text-red-400">*</span>
            </label>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Что ты думаешь о книге? Какие эмоции она вызвала?"
              rows={6}
              required
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-cream placeholder:text-[#9A7D5A]/60 focus:outline-none focus:border-amber/40 focus:bg-white/7 transition-all resize-none"
            />
          </div>

          {/* Quotes */}
          <div className="space-y-2">
            <label className="text-xs text-[#9A7D5A] font-medium">
              Цитаты <span className="text-[#9A7D5A]/50">(каждая с новой строки)</span>
            </label>
            <textarea
              value={quotesRaw}
              onChange={(e) => setQuotesRaw(e.target.value)}
              placeholder="«Слова, которые тронули тебя…»"
              rows={3}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-cream placeholder:text-[#9A7D5A]/60 focus:outline-none focus:border-amber/40 transition-all resize-none"
            />
          </div>

          {/* Emotion tags */}
          <div className="space-y-2">
            <label className="text-xs text-[#9A7D5A] font-medium">
              Теги эмоций <span className="text-[#9A7D5A]/50">(через запятую)</span>
            </label>
            <input
              type="text"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="ностальгия, одиночество, надежда"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-cream placeholder:text-[#9A7D5A]/60 focus:outline-none focus:border-amber/40 transition-all"
            />
          </div>

          {/* Private toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setIsPrivate((v) => !v)}
              className={cn(
                "relative w-9 h-5 rounded-full transition-colors",
                isPrivate ? "bg-amber/70" : "bg-white/15"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow",
                  isPrivate ? "translate-x-[1.125rem]" : "translate-x-0.5"
                )}
              />
            </div>
            <span className="text-sm text-[#9A7D5A] group-hover:text-cream transition-colors">
              Приватная запись
            </span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-[#9A7D5A] hover:text-cream hover:bg-white/5 transition-all"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving || !content.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber/20 border border-amber/35 text-amber text-sm font-medium hover:bg-amber/30 transition-all disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <BookOpen size={14} />
              )}
              {initial ? "Сохранить" : "Создать запись"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntryOut[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<DiaryEntryOut | null>(null);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const [dnaFlash, setDnaFlash] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyDiary(50);
      setEntries(data.items);
      setTotal(data.total);
    } catch {
      setError("Не удалось загрузить дневник.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(entry: DiaryEntryOut) {
    setEditTarget(entry);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditTarget(null);
  }

  async function handleSave(data: DiaryEntryCreate | DiaryEntryUpdate) {
    setSaving(true);
    try {
      if (editTarget) {
        const updated = await updateDiaryEntry(editTarget.id, data as DiaryEntryUpdate);
        setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      } else {
        const created = await createDiaryEntry(data as DiaryEntryCreate);
        setEntries((prev) => [created, ...prev]);
        setTotal((t) => t + 1);
      }
      closeForm();
    } catch {
      // keep modal open — user can retry
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteDiaryEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setTotal((t) => t - 1);
    } catch {
      // noop
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAnalyze(id: string) {
    setAnalyzingId(id);
    try {
      const res = await analyzeDiaryEntry(id);
      setEntries((prev) => prev.map((e) => (e.id === id ? res.entry : e)));
      if (res.dna_updated) {
        setDnaFlash(true);
        setTimeout(() => setDnaFlash(false), 3000);
      }
    } catch {
      // noop
    } finally {
      setAnalyzingId(null);
    }
  }

  return (
    <>
      <StarryBackground />
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 relative">
          <AmbientParticles count={6} />

          {/* Header */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <motion.div
              variants={staggerItem}
              className="flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="space-y-1">
                <h1 className="font-heading text-4xl md:text-5xl font-semibold text-gradient-cream">
                  Читательский дневник
                </h1>
                <p className="text-[#9A7D5A]">
                  {total > 0 ? `${total} ${plural(total, "запись", "записи", "записей")}` : "Твои мысли о книгах"}
                </p>
              </div>

              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber/15 border border-amber/30 text-amber text-sm font-medium hover:bg-amber/25 transition-all"
              >
                <Plus size={15} />
                Новая запись
              </button>
            </motion.div>

            {/* DNA flash notification */}
            <AnimatePresence>
              {dnaFlash && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/15 border border-violet-400/30"
                >
                  <Dna size={14} className="text-violet-300" />
                  <p className="text-sm text-violet-300">
                    Literary DNA обновлён на основе твоей записи
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GlassCard className="text-center space-y-2">
                  <p className="text-sm text-destructive">{error}</p>
                  <button
                    onClick={load}
                    className="text-xs text-amber hover:text-amber-light transition-colors"
                  >
                    Попробовать снова
                  </button>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skeleton */}
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl p-5 animate-pulse space-y-3">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/5" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-32 rounded bg-white/5" />
                      <div className="h-3 w-20 rounded bg-white/5" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 rounded bg-white/5 w-full" />
                    <div className="h-3 rounded bg-white/5 w-4/5" />
                    <div className="h-3 rounded bg-white/5 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && entries.length === 0 && !error && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard glow className="max-w-md mx-auto text-center space-y-5 py-10">
                <BookOpen size={40} className="mx-auto text-amber/40" />
                <div>
                  <p className="font-heading text-lg text-cream">Дневник пока пуст</p>
                  <p className="text-sm text-[#9A7D5A] mt-1">
                    Запиши мысли о книге — AI проанализирует твои эмоции и обновит Literary DNA
                  </p>
                </div>
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber/15 border border-amber/30 text-amber text-sm font-medium hover:bg-amber/25 transition-all"
                >
                  <Plus size={14} />
                  Создать первую запись
                </button>
              </GlassCard>
            </motion.div>
          )}

          {/* Entries */}
          {!loading && entries.length > 0 && (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onAnalyze={handleAnalyze}
                  analyzing={analyzingId === entry.id}
                  deleting={deletingId === entry.id}
                />
              ))}
            </motion.div>
          )}

          {/* Info hint */}
          {!loading && entries.length > 0 && (
            <GlassCard className="flex items-start gap-3 py-4">
              <Sparkles size={14} className="text-amber mt-0.5 shrink-0" />
              <p className="text-xs text-[#9A7D5A] leading-relaxed">
                Нажми <strong className="text-[#D4B896]">AI-анализ</strong> на записи — Claude прочитает твои мысли,
                извлечёт эмоциональный профиль и обновит Literary DNA. Записи с{" "}
                <span className="text-violet-300">DNA</span> значком уже повлияли на рекомендации.
              </p>
            </GlassCard>
          )}
        </div>
      </MainLayout>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <EntryForm
            initial={editTarget}
            onSave={handleSave}
            onClose={closeForm}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
