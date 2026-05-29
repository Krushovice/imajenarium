"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, BookOpen, Share2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import Link from "next/link";
import { EmotionBadge } from "@/components/design-system";
import { cn } from "@/lib/utils";

export interface BookData {
  id: string;
  title: string;
  author: string;
  year?: number;
  coverUrl?: string;
  coverColor?: string;
  emotionTags: string[];
  rating?: number;
  status?: "want_to_read" | "reading" | "read";
  whyRecommended?: string;
  quote?: string;
  matchScore?: number;
}

interface BookCardProps {
  book: BookData;
  variant?: "default" | "compact" | "horizontal";
  onStatusChange?: (id: string, status: BookData["status"]) => void;
  href?: string;
  className?: string;
}

const STATUS_LABELS: Record<NonNullable<BookData["status"]>, string> = {
  want_to_read: "Хочу прочитать",
  reading: "Читаю",
  read: "Прочитано",
};

const STATUS_COLORS: Record<NonNullable<BookData["status"]>, string> = {
  want_to_read: "text-gold border-gold/30 bg-gold/5",
  reading: "text-[#80C090] border-[#80C090]/30 bg-[#80C090]/5",
  read: "text-amber border-amber/30 bg-amber/10",
};

// Deterministic gradient from title string
function coverGradient(title: string, override?: string): string {
  if (override) return override;
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

export function BookCard({ book, variant = "default", onStatusChange, href, className }: BookCardProps) {
  const [expanded, setExpanded] = useState(false);
  const gradient = coverGradient(book.title, book.coverColor);

  if (variant === "compact") {
    return (
      <motion.div
        whileHover={{ y: -2, boxShadow: "0 12px 40px rgba(212, 135, 58, 0.12)" }}
        transition={{ duration: 0.2 }}
        className={cn(
          "glass rounded-xl p-4 flex gap-3 cursor-default",
          className
        )}
      >
        <div className={cn("w-10 h-14 rounded-lg bg-gradient-to-b shrink-0 flex items-center justify-center", gradient)}>
          <BookOpen size={14} className="text-white/40" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-heading text-sm font-semibold text-cream truncate">{book.title}</p>
          <p className="text-xs text-muted-foreground truncate">{book.author}</p>
          <div className="flex flex-wrap gap-1">
            {book.emotionTags.slice(0, 2).map((tag) => (
              <EmotionBadge key={tag} label={tag.toLowerCase()} size="sm" />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === "horizontal") {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className={cn("glass rounded-xl p-4 flex gap-4", className)}
      >
        <div className={cn("w-16 h-22 rounded-xl bg-gradient-to-b shrink-0 flex items-center justify-center", gradient)}
          style={{ minHeight: 88 }}
        >
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <BookOpen size={20} className="text-white/40" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h3 className="font-heading text-base font-semibold text-cream leading-snug">{book.title}</h3>
            <p className="text-xs text-muted-foreground">{book.author}{book.year ? `, ${book.year}` : ""}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {book.emotionTags.slice(0, 3).map((tag) => (
              <EmotionBadge key={tag} label={tag.toLowerCase()} size="sm" />
            ))}
          </div>
          {book.whyRecommended && (
            <p className="text-xs text-[#9A7D5A] leading-relaxed line-clamp-2">
              <Sparkles size={10} className="inline mr-1 text-amber" />
              {book.whyRecommended}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  // Default card
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 20px 60px rgba(212, 135, 58, 0.15)" }}
      transition={{ duration: 0.25 }}
      className={cn("glass rounded-xl overflow-hidden cursor-default relative", className)}
    >
      {href && (
        <Link href={href} className="absolute inset-0 z-0" aria-label={book.title} />
      )}
      {/* Cover */}
      <div className={cn("relative h-48 bg-gradient-to-b flex items-end p-4 z-[1]", gradient)}>
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <BookOpen size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20" />
        )}
        {/* Status badge */}
        {book.status && (
          <span className={cn(
            "relative z-10 text-xs font-medium px-2.5 py-1 rounded-full border",
            STATUS_COLORS[book.status]
          )}>
            {STATUS_LABELS[book.status]}
          </span>
        )}
        {/* Match score */}
        {book.matchScore !== undefined && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-medium text-amber">
            <Sparkles size={10} />
            {book.matchScore}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 relative z-[1]">
        <div>
          <h3 className="font-heading text-lg font-semibold text-cream leading-snug">{book.title}</h3>
          <p className="text-sm text-muted-foreground">{book.author}{book.year ? ` · ${book.year}` : ""}</p>
        </div>

        {/* Star rating */}
        {book.rating !== undefined && (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={13}
                className={s <= book.rating! ? "text-amber fill-amber" : "text-border"}
              />
            ))}
          </div>
        )}

        {/* Emotion tags */}
        <div className="flex flex-wrap gap-1.5">
          {book.emotionTags.map((tag) => (
            <EmotionBadge key={tag} label={tag.toLowerCase()} size="sm" />
          ))}
        </div>

        {/* Why recommended */}
        {book.whyRecommended && (
          <div className="pt-2 border-t border-border/60 relative z-[2]">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded((v) => !v); }}
              className="flex items-center gap-1.5 text-xs text-amber hover:text-amber-light transition-colors font-medium"
            >
              <Sparkles size={11} />
              Почему это тебе?
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            {expanded && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-xs text-[#9A7D5A] leading-relaxed mt-2"
              >
                {book.whyRecommended}
              </motion.p>
            )}
          </div>
        )}

        {/* Quote */}
        {book.quote && (
          <blockquote className="border-l-2 border-amber/40 pl-3 text-xs text-[#9A7D5A] italic leading-relaxed">
            «{book.quote}»
          </blockquote>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 relative z-[2]">
          {onStatusChange && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onStatusChange(book.id, "want_to_read"); }}
              className="flex-1 text-xs font-medium py-2 rounded-lg border border-amber/25 text-amber hover:bg-amber/10 transition-colors"
            >
              + В библиотеку
            </button>
          )}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="p-2 rounded-lg border border-border/60 text-muted-foreground hover:text-amber hover:border-amber/30 transition-colors"
            aria-label="Поделиться"
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
