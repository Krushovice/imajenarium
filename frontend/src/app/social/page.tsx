"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Heart, BookOpen, Sparkles, UserPlus, Check } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { StarryBackground, GlassCard, EmotionBadge, AmbientParticles } from "@/components/design-system";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/animations";
import {
  fetchFriends,
  fetchPendingRequests,
  acceptFriendRequest,
  declineFriendRequest,
  type FriendWithCompatibility,
  type PendingRequestOut,
} from "@/lib/api";

function getInitials(name: string | null | undefined, username: string): string {
  if (name) {
    return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

function CompatibilityRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 90 ? "#80C090" : score >= 75 ? "#D4873A" : "#8EB0D0";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={88} height={88} className="-rotate-90">
        <circle cx={44} cy={44} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <motion.circle
          cx={44} cy={44} r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.25, 0, 0.35, 1] }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-heading text-lg font-bold" style={{ color }}>{score}%</div>
        <div className="text-xs text-muted-foreground leading-none">match</div>
      </div>
    </div>
  );
}

function FriendCard({ item }: { item: FriendWithCompatibility }) {
  const { friend, compatibility_score } = item;
  const initials = getInitials(friend.display_name, friend.username);
  const score = compatibility_score != null ? Math.round(compatibility_score * 100) : null;

  return (
    <GlassCard hover className="space-y-4">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12 ring-1 ring-amber/20 shrink-0">
          <AvatarFallback className="bg-amber/10 text-amber font-heading text-base">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-cream">
            {friend.display_name ?? friend.username}
          </p>
          <p className="text-xs text-muted-foreground">@{friend.username}</p>
          {friend.bio && (
            <p className="text-xs text-[#9A7D5A] mt-1 line-clamp-2">{friend.bio}</p>
          )}
        </div>
        {score != null && <CompatibilityRing score={score} />}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/60 pt-3">
        <span className="flex items-center gap-1.5">
          <Heart size={12} className="text-[#D080A0]" />
          Literary DNA совпадение
        </span>
      </div>
    </GlassCard>
  );
}

function PendingCard({
  item,
  onAccept,
  onDecline,
}: {
  item: PendingRequestOut;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const { requester, friendship_id } = item;
  const initials = getInitials(requester.display_name, requester.username);

  return (
    <GlassCard className="space-y-4">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12 ring-1 ring-amber/20 shrink-0">
          <AvatarFallback className="bg-amber/10 text-amber font-heading text-base">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-heading font-semibold text-cream">
            {requester.display_name ?? requester.username}
          </p>
          <p className="text-xs text-muted-foreground">@{requester.username}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onAccept(friendship_id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-amber hover:bg-amber-light text-background transition-all"
        >
          <Check size={12} /> Принять
        </button>
        <button
          onClick={() => onDecline(friendship_id)}
          className="flex-1 py-2 rounded-lg text-xs font-medium border border-border/60 text-muted-foreground hover:border-destructive/30 hover:text-destructive transition-all"
        >
          Отклонить
        </button>
      </div>
    </GlassCard>
  );
}

export default function SocialPage() {
  const queryClient = useQueryClient();

  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ["social", "friends"],
    queryFn: fetchFriends,
    retry: 1,
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ["social", "pending"],
    queryFn: fetchPendingRequests,
    retry: 1,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social"] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: declineFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social"] });
    },
  });

  const friends = friendsData?.items ?? [];
  const pending = pendingData?.items ?? [];

  const topFriend = friends.length > 0
    ? friends.reduce((best, cur) =>
        (cur.compatibility_score ?? 0) > (best.compatibility_score ?? 0) ? cur : best
      )
    : null;

  return (
    <>
      <StarryBackground />
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-10 relative">
          <AmbientParticles count={8} />

          {/* Header */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-between"
          >
            <motion.div variants={staggerItem} className="space-y-1">
              <h1 className="font-heading text-4xl font-semibold text-gradient-cream">
                Литературный круг
              </h1>
              <p className="text-muted-foreground">
                Друзья с похожим Literary DNA — ваши вкусы резонируют
              </p>
            </motion.div>
            <motion.button
              variants={staggerItem}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber hover:bg-amber-light text-background text-sm font-medium transition-all"
            >
              <UserPlus size={16} />
              Найти друзей
            </motion.button>
          </motion.div>

          {/* Top match spotlight */}
          {topFriend && topFriend.compatibility_score != null && (
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <GlassCard glow className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-2 ring-amber/30">
                    <AvatarFallback className="bg-amber/10 text-amber font-heading text-xl">
                      {getInitials(topFriend.friend.display_name, topFriend.friend.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-amber" />
                      <span className="text-xs text-amber font-medium tracking-wider">ЛУЧШЕЕ СОВПАДЕНИЕ</span>
                    </div>
                    <h2 className="font-heading text-2xl font-semibold text-cream">
                      {topFriend.friend.display_name ?? topFriend.friend.username}
                    </h2>
                    <p className="text-sm text-muted-foreground">@{topFriend.friend.username}</p>
                  </div>
                </div>
                <div className="sm:ml-auto flex flex-col items-center gap-2">
                  <CompatibilityRing score={Math.round(topFriend.compatibility_score * 100)} />
                  <p className="text-xs text-muted-foreground text-center max-w-[120px]">
                    Literary DNA совпадает на {Math.round(topFriend.compatibility_score * 100)}%
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Main grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Friends list */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="font-heading text-2xl font-semibold text-gradient-cream flex items-center gap-2">
                <Users size={20} className="text-amber" />
                Друзья ({friends.length})
              </h2>

              {friendsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />)}
                </div>
              ) : friends.length === 0 ? (
                <GlassCard className="text-center py-10 space-y-2">
                  <Users className="mx-auto text-amber/40" size={28} />
                  <p className="text-sm text-muted-foreground">Пока нет друзей — найди читателей со схожим DNA</p>
                </GlassCard>
              ) : (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
                  {friends.map((f) => (
                    <motion.div key={f.friendship_id} variants={staggerItem}>
                      <FriendCard item={f} />
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Pending requests */}
              {!pendingLoading && pending.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-heading text-lg font-semibold text-cream">
                    Запросы в друзья ({pending.length})
                  </h3>
                  {pending.map((req) => (
                    <motion.div key={req.friendship_id} variants={fadeInUp} initial="hidden" animate="visible">
                      <PendingCard
                        item={req}
                        onAccept={(id) => acceptMutation.mutate(id)}
                        onDecline={(id) => declineMutation.mutate(id)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <GlassCard className="space-y-3">
                <h3 className="font-heading text-base font-semibold text-cream flex items-center gap-2">
                  <Heart size={14} className="text-[#D080A0]" />
                  О Literary Compatibility
                </h3>
                <p className="text-xs text-[#9A7D5A] leading-relaxed">
                  AI вычисляет совместимость DNA на основе общих эмоциональных предпочтений,
                  жанровых векторов и стилевых паттернов из ваших библиотек.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-amber">
                  <Sparkles size={11} />
                  Чем больше книг — тем точнее совпадение
                </div>
              </GlassCard>

              <GlassCard className="space-y-3">
                <h3 className="font-heading text-base font-semibold text-cream flex items-center gap-2">
                  <BookOpen size={14} className="text-amber" />
                  Shared Books
                </h3>
                <p className="text-xs text-muted-foreground">
                  Откройте профиль друга чтобы увидеть общие книги и получить совместные рекомендации
                </p>
              </GlassCard>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}
