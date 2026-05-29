"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Rss, Sparkles, Globe, Clock, TrendingUp, BookOpen } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { StarryBackground, GlassCard, EmotionBadge, AmbientParticles } from "@/components/design-system";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/animations";
import { fetchNewsFeed, type NewsFeedItemOut } from "@/lib/api";

interface Article {
  id: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  emotionTags: string[];
  publishedAt: string;
  featured?: boolean;
}

function feedItemToArticle(item: NewsFeedItemOut, idx: number): Article {
  return {
    id: item.id,
    title: item.title,
    source: item.source_name,
    url: item.url,
    summary: item.ai_summary ?? item.title,
    emotionTags: item.emotional_tags,
    publishedAt: item.published_at
      ? new Date(item.published_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
      : "Недавно",
    featured: idx === 0,
  };
}

const FILTER_TAGS = ["Все", "меланхолия", "философия", "тайна", "романтика", "приключение"];

function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <GlassCard hover className={`space-y-4 ${featured ? "border-amber/20" : ""}`}>
        {featured && (
          <div className="flex items-center gap-1.5 text-xs text-amber font-medium tracking-wider">
            <TrendingUp size={12} />
            ГЛАВНОЕ СЕГОДНЯ
          </div>
        )}

        <div className="space-y-2">
          <h3 className={`font-heading font-semibold leading-snug text-cream ${featured ? "text-xl" : "text-base"}`}>
            {article.title}
          </h3>
          <p className={`text-[#9A7D5A] leading-relaxed ${featured ? "text-sm" : "text-xs"} line-clamp-3`}>
            {article.summary}
          </p>
        </div>

        {article.emotionTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.emotionTags.map((tag) => (
              <EmotionBadge key={tag} label={tag} size="sm" />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-3">
          <span className="flex items-center gap-1">
            <Globe size={11} />
            {article.source}
          </span>
          <div className="flex items-center gap-3">
            <span>{article.publishedAt}</span>
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber hover:text-amber-light transition-colors"
              >
                Читать →
              </a>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default function FeedPage() {
  const [activeFilter, setActiveFilter] = useState("Все");

  const { data, isLoading } = useQuery({
    queryKey: ["news-feed"],
    queryFn: () => fetchNewsFeed(30),
    staleTime: 5 * 60 * 1000,
  });

  const articles = (data?.items ?? []).map(feedItemToArticle);

  const filtered = activeFilter === "Все"
    ? articles
    : articles.filter((a) => a.emotionTags.some((t) => t.toLowerCase().includes(activeFilter.toLowerCase())));

  const featured = filtered[0];
  const rest = filtered.slice(1);

  const allTags = [...new Set(articles.flatMap((a) => a.emotionTags))].slice(0, 6);

  return (
    <>
      <StarryBackground />
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 relative">
          <AmbientParticles count={6} />

          {/* Header */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <motion.div variants={staggerItem} className="space-y-1">
              <div className="flex items-center gap-2">
                <Rss size={20} className="text-amber" />
                <h1 className="font-heading text-4xl font-semibold text-gradient-cream">
                  Литературная лента
                </h1>
              </div>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber" />
                Персонализировано по твоему Literary DNA
              </p>
            </motion.div>

            {/* Filters */}
            <motion.div variants={staggerItem} className="flex gap-2 flex-wrap">
              {["Все", ...allTags].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveFilter(tag)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    activeFilter === tag
                      ? "border-amber bg-amber/10 text-amber"
                      : "border-border/60 text-muted-foreground hover:border-amber/30 hover:text-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </motion.div>
          </motion.div>

          {/* Content */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main feed */}
            <div className="lg:col-span-2 space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : articles.length === 0 ? (
                <GlassCard className="text-center py-12 space-y-2">
                  <Rss className="mx-auto text-amber/40" size={32} />
                  <p className="text-sm text-muted-foreground">Лента пуста — RSS источники ещё не загружены</p>
                </GlassCard>
              ) : (
                <>
                  {featured && (
                    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                      <ArticleCard article={featured} featured />
                    </motion.div>
                  )}
                  <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
                    {rest.map((article, i) => (
                      <motion.div key={article.id} variants={staggerItem} transition={{ delay: i * 0.08 }}>
                        <ArticleCard article={article} />
                      </motion.div>
                    ))}
                  </motion.div>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <GlassCard className="space-y-3">
                <h3 className="font-heading text-base font-semibold text-cream flex items-center gap-2">
                  <BookOpen size={14} className="text-amber" />
                  Источники ленты
                </h3>
                {(() => {
                  const sourceCounts = articles.reduce<Record<string, number>>((acc, a) => {
                    acc[a.source] = (acc[a.source] ?? 0) + 1;
                    return acc;
                  }, {});
                  return Object.entries(sourceCounts).slice(0, 5).map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <span className="text-[#D4B896]">{name}</span>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </div>
                  ));
                })()}
              </GlassCard>

              {allTags.length > 0 && (
                <GlassCard className="space-y-3">
                  <h3 className="font-heading text-base font-semibold text-cream flex items-center gap-2">
                    <TrendingUp size={14} className="text-amber" />
                    Трендовые тэги
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((t) => <EmotionBadge key={t} label={t} size="sm" />)}
                  </div>
                </GlassCard>
              )}

              <GlassCard className="space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Лента обновляется раз в час. AI анализирует каждую статью и выбирает релевантные для твоего Literary DNA.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-amber">
                  <Sparkles size={11} />
                  DNA совпадение: активно
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}
