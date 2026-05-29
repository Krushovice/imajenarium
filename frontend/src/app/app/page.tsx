"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
    };
    auth_date?: number;
    hash?: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    onClick: (fn: () => void) => void;
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

interface Book {
  book_id: string;
  title: string;
  author: string;
  explanation?: string;
  atmosphere?: string;
}

interface UserProfile {
  id: string;
  username: string;
  display_name?: string;
}

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

async function telegramAuth(initData: string): Promise<{ access_token: string; user: UserProfile }> {
  const res = await fetch(`${API_BASE}/telegram/miniapp/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ init_data: initData }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  return res.json();
}

async function fetchMoodRecommendations(
  token: string,
  mood: string,
  count = 5
): Promise<Book[]> {
  const res = await fetch(`${API_BASE}/recommendations/mood`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ mood_description: mood, count }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.recommendations ?? data.items ?? []) as Book[];
}

async function markBookRead(token: string, bookId: string): Promise<void> {
  await fetch(`${API_BASE}/books/${bookId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: "read" }),
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const MOODS = [
  { key: "inspirational", label: "Вдохновение", emoji: "🌅" },
  { key: "melancholic", label: "Меланхолия", emoji: "😔" },
  { key: "adventurous", label: "Приключение", emoji: "🎭" },
  { key: "philosophical", label: "Философия", emoji: "🤔" },
  { key: "romantic", label: "Любовь", emoji: "💝" },
  { key: "humorous", label: "Юмор", emoji: "😂" },
  { key: "mysterious", label: "Мистика", emoji: "😱" },
  { key: "cozy", label: "Уют", emoji: "🌿" },
];

function MoodPicker({ onSelect }: { onSelect: (mood: string, label: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {MOODS.map((m) => (
        <motion.button
          key={m.key}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(m.key, `${m.emoji} ${m.label}`)}
          className="flex items-center gap-2 rounded-xl border border-amber-800/30 bg-stone-800/60 p-3 text-left text-sm font-medium text-amber-100 hover:bg-stone-700/60 active:bg-stone-700"
        >
          <span className="text-xl">{m.emoji}</span>
          <span>{m.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

function BookCard({
  book,
  onMarkRead,
}: {
  book: Book;
  onMarkRead: (id: string) => void;
}) {
  const [marked, setMarked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-800/20 bg-stone-800/70 p-4 backdrop-blur"
    >
      <p className="font-serif text-base font-semibold text-amber-100">{book.title}</p>
      <p className="mt-0.5 text-xs text-amber-400">{book.author}</p>
      {book.explanation && (
        <p className="mt-2 text-xs leading-relaxed text-stone-400">{book.explanation}</p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => {
            setMarked(true);
            onMarkRead(book.book_id);
          }}
          disabled={marked}
          className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
            marked
              ? "bg-emerald-800/50 text-emerald-300"
              : "bg-amber-700/40 text-amber-200 hover:bg-amber-700/60"
          }`}
        >
          {marked ? "✅ Прочитал(а)" : "Отметить прочитанным"}
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type Step = "loading" | "error" | "mood" | "recommendations";

export default function TelegramMiniApp() {
  const [step, setStep] = useState<Step>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedMoodLabel, setSelectedMoodLabel] = useState<string>("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // -------------------------------------------------------------------------
  // Init Telegram WebApp
  // -------------------------------------------------------------------------

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      setErrorMsg("Откройте эту страницу через бота Book Imaginarium в Telegram.");
      setStep("error");
      return;
    }
    tg.ready();
    tg.expand();

    const initData = tg.initData;
    if (!initData) {
      setErrorMsg("Не удалось получить данные авторизации.");
      setStep("error");
      return;
    }

    telegramAuth(initData)
      .then(({ access_token, user: u }) => {
        setToken(access_token);
        setUser(u);
        setStep("mood");
      })
      .catch((e) => {
        setErrorMsg(`Ошибка авторизации: ${e.message}`);
        setStep("error");
      });
  }, []);

  // -------------------------------------------------------------------------
  // Mood selected → fetch recommendations
  // -------------------------------------------------------------------------

  const handleMoodSelect = async (mood: string, label: string) => {
    if (!token) return;
    setSelectedMood(mood);
    setSelectedMoodLabel(label);
    setStep("recommendations");
    setLoadingRecs(true);
    try {
      const recs = await fetchMoodRecommendations(token, mood);
      setBooks(recs);
    } catch {
      setBooks([]);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleMarkRead = (bookId: string) => {
    if (token) markBookRead(token, bookId).catch(() => {});
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 font-sans text-stone-100">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-amber-900/20 bg-stone-950/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="font-serif text-lg font-semibold text-amber-300">
            📚 Book Imaginarium
          </span>
          {user && (
            <span className="text-xs text-stone-400">
              {user.display_name ?? user.username}
            </span>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Loading */}
        {step === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-4 px-6 py-20"
          >
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <p className="text-sm text-stone-400">Авторизация…</p>
          </motion.div>
        )}

        {/* Error */}
        {step === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-12 text-center"
          >
            <p className="text-4xl">😕</p>
            <p className="mt-4 text-sm text-stone-300">{errorMsg}</p>
          </motion.div>
        )}

        {/* Mood picker */}
        {step === "mood" && (
          <motion.div
            key="mood"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <div className="px-4 pb-2 pt-5">
              <h2 className="font-serif text-xl font-semibold text-amber-200">
                Какое у вас настроение?
              </h2>
              <p className="mt-1 text-xs text-stone-400">
                Подберу книгу специально для вас
              </p>
            </div>
            <MoodPicker onSelect={handleMoodSelect} />
          </motion.div>
        )}

        {/* Recommendations */}
        {step === "recommendations" && (
          <motion.div
            key="recs"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="px-4 py-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-semibold text-amber-200">
                  {selectedMoodLabel}
                </h2>
                <p className="mt-0.5 text-xs text-stone-400">Рекомендации для вас</p>
              </div>
              <button
                onClick={() => setStep("mood")}
                className="rounded-lg border border-stone-700 px-3 py-1 text-xs text-stone-400 hover:border-amber-700 hover:text-amber-300"
              >
                ← Назад
              </button>
            </div>

            {loadingRecs ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              </div>
            ) : books.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-400">
                Книги не найдены. Попробуйте другое настроение.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {books.map((book, i) => (
                  <BookCard key={book.book_id ?? i} book={book} onMarkRead={handleMarkRead} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
