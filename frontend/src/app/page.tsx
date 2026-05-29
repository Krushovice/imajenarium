"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Brain, Sparkles, Star, ArrowRight, Users, Zap, ChevronRight } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { StarryBackground, BookConstellation, GlassCard, EmotionBadge, AmbientParticles } from "@/components/design-system";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/animations";

const STATS = [
  { label: "Читателей", value: "12 400+" },
  { label: "Книг в базе", value: "85 000+" },
  { label: "Рекомендаций", value: "1.2М+" },
];

const AI_STEPS = [
  { icon: BookOpen, title: "Читаешь", desc: "Отмечаешь книги, пишешь рецензии своими словами" },
  { icon: Brain, title: "AI анализирует", desc: "Извлекает эмоции, атмосферу, паттерны вкуса" },
  { icon: Sparkles, title: "DNA обновляется", desc: "Literary DNA профиль растёт с каждой книгой" },
  { icon: Star, title: "Рекомендует", desc: "Подбирает книги точно под твоё настроение" },
];

const SAMPLE_DNA = [
  { label: "Философия", value: 90, color: "#9080D0" },
  { label: "Романтика", value: 85, color: "#D080A0" },
  { label: "Меланхолия", value: 75, color: "#8EB0D0" },
  { label: "Приключение", value: 72, color: "#80C090" },
  { label: "Тайна", value: 68, color: "#D4873A" },
];

const SAMPLE_EMOTIONS = ["меланхолия", "философия", "романтика", "тайна"];

export default function Home() {
  return (
    <>
      <StarryBackground />
      <MainLayout>
        {/* ── Hero ── */}
        <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <AmbientParticles count={15} />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="relative z-10 flex flex-col items-center text-center px-4 gap-6"
          >
            <motion.div variants={staggerItem}>
              <BookConstellation />
            </motion.div>

            <motion.h1
              variants={staggerItem}
              className="font-heading font-semibold leading-tight tracking-wide pb-2"
              style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)" }}
            >
              <span className="text-gradient-cream">Imaginarium</span>
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="text-lg md:text-xl max-w-md mx-auto leading-relaxed text-[#B8956A] -mt-2"
            >
              Персональный литературный мир,<br className="hidden sm:block" />
              построенный на эмоциях и атмосфере
            </motion.p>

            <motion.div variants={staggerItem} className="flex items-center gap-3 flex-wrap justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-medium
                  bg-amber text-background hover:bg-amber-light transition-all duration-200
                  shadow-lg shadow-amber/20 hover:shadow-amber/35 hover:scale-105 active:scale-100"
              >
                <span>Начать погружение</span>
                <span className="text-lg">✦</span>
              </Link>
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-medium
                  border border-amber/30 text-amber hover:border-amber/60 hover:bg-amber/5 transition-all duration-200"
              >
                Открыть мир книг <ArrowRight size={14} />
              </Link>
            </motion.div>

            <motion.div variants={staggerItem} className="flex flex-wrap gap-2 justify-center mt-2">
              {SAMPLE_EMOTIONS.map((e) => (
                <EmotionBadge key={e} label={e} size="md" />
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-amber/40 flex flex-col items-center gap-1"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-sm tracking-widest uppercase">Листай</span>
            <ChevronRight className="rotate-90" size={16} />
          </motion.div>
        </section>

        {/* ── Literary DNA Preview ── */}
        <section className="py-24 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <motion.div variants={fadeInUp} className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber/30 bg-amber/5 text-amber text-sm font-medium tracking-wider">
                  <Sparkles size={14} /> Literary DNA
                </div>
                <h2 className="font-heading text-4xl md:text-5xl font-semibold leading-tight text-gradient-cream">
                  Живой профиль<br />твоего вкуса
                </h2>
                <p className="text-lg text-[#C4A882] leading-relaxed">
                  Literary DNA — не статичная анкета. Это живой портрет твоей читательской души,
                  который растёт с каждой книгой, рецензией и записью в дневнике.
                </p>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 text-amber hover:text-amber-light text-base font-medium transition-colors"
                >
                  Создать свой DNA профиль <ArrowRight size={14} />
                </Link>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <GlassCard glow className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-heading text-lg font-semibold text-cream">Твой Literary DNA</span>
                    <span className="text-xs text-amber font-medium tracking-wide">PREVIEW</span>
                  </div>
                  {SAMPLE_DNA.map((trait, i) => (
                    <div key={trait.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#D4B896]">{trait.label}</span>
                        <span className="text-amber font-medium">{trait.value}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: trait.color }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${trait.value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: i * 0.15, ease: [0.25, 0, 0.35, 1] }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-base text-muted-foreground mt-4 pt-4 border-t border-border">
                    Обновляется автоматически на основе твоих книг и рецензий
                  </p>
                </GlassCard>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="py-24 px-4 border-t border-border/40">
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="space-y-16"
            >
              <motion.div variants={fadeInUp} className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber/30 bg-amber/5 text-amber text-sm font-medium tracking-wider">
                  <Zap size={14} /> AI Engine
                </div>
                <h2 className="font-heading text-4xl md:text-5xl font-semibold text-gradient-cream">
                  Как работает магия
                </h2>
                <p className="text-lg text-[#C4A882] max-w-md mx-auto">
                  Четыре шага от первой книги до идеальных рекомендаций
                </p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {AI_STEPS.map((step, i) => (
                  <motion.div key={step.title} variants={staggerItem} className="relative">
                    <GlassCard hover className="h-full text-center space-y-3">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber/10 border border-amber/20 mx-auto">
                        <step.icon className="text-amber" size={20} />
                      </div>
                      <div className="text-2xl font-heading font-bold text-amber/30">0{i + 1}</div>
                      <h3 className="font-heading text-xl font-semibold text-cream">{step.title}</h3>
                      <p className="text-lg text-[#C4A882] leading-relaxed">{step.desc}</p>
                    </GlassCard>
                    {i < AI_STEPS.length - 1 && (
                      <div className="hidden lg:flex absolute top-1/2 -right-2 -translate-y-1/2 z-10 text-amber/30">
                        <ChevronRight size={16} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="py-20 px-4 border-t border-border/40">
          <div className="max-w-3xl mx-auto">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-3 gap-8 text-center"
            >
              {STATS.map((stat) => (
                <motion.div key={stat.label} variants={staggerItem} className="space-y-1">
                  <div className="font-heading text-3xl md:text-4xl font-bold text-gradient-amber">
                    {stat.value}
                  </div>
                  <div className="text-lg text-[#C4A882] tracking-wide">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-24 px-4 border-t border-border/40">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-8"
            >
              <motion.div variants={fadeInUp}>
                <h2 className="font-heading text-4xl md:text-5xl font-semibold leading-tight text-gradient-cream">
                  Твой литературный мир<br />ждёт тебя
                </h2>
              </motion.div>
              <motion.p variants={fadeInUp} className="text-xl text-[#C4A882]">
                Начни с одной книги. AI построит вселенную вокруг твоего вкуса.
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-medium
                    bg-amber text-background hover:bg-amber-light transition-all duration-200
                    shadow-xl shadow-amber/20 hover:shadow-amber/35 hover:scale-105 active:scale-100"
                >
                  <Users size={18} />
                  Создать аккаунт — бесплатно
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-medium
                    border border-amber/30 text-amber hover:border-amber/60 hover:bg-amber/5 transition-all duration-200"
                >
                  Войти
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </MainLayout>
    </>
  );
}
