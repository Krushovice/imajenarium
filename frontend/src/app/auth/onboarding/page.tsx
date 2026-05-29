"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { StarryBackground, GlassCard, AmbientParticles } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";

interface OnboardingQuestion {
  id: string;
  question: string;
  options: string[];
  multi_select: boolean;
}

// Mood step — stored in localStorage only, never sent to DNA endpoint.
const MOODS = [
  { id: "reflective", emoji: "🌙", label: "Задумчивое" },
  { id: "adventurous", emoji: "⚡", label: "Авантюрное" },
  { id: "romantic", emoji: "🌹", label: "Романтичное" },
  { id: "melancholic", emoji: "🫧", label: "Меланхоличное" },
  { id: "curious", emoji: "🔭", label: "Любопытное" },
];

const stepVariants = {
  enter: { opacity: 0, x: 48 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -48 },
};

// step 0 = mood (localStorage only)
// steps 1..N = dynamicQuestions[step-1] (AI-generated, each depends on previous answers)
// step N+1 = confirm + submit

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [dynamicQuestions, setDynamicQuestions] = useState<OnboardingQuestion[]>([]);
  const [loadingNextQuestion, setLoadingNextQuestion] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState("");

  const isQuestionStep = step >= 1 && !onboardingDone;
  const isConfirmStep = onboardingDone || (step >= 1 && step > dynamicQuestions.length);
  const currentQ = isQuestionStep && step <= dynamicQuestions.length ? dynamicQuestions[step - 1] : null;
  const totalSteps = dynamicQuestions.length + 2; // mood + questions + confirm

  function toggleOption(qId: string, option: string, multiSelect: boolean) {
    setAnswers((prev) => {
      if (multiSelect) {
        const current = (prev[qId] as string[] | undefined) ?? [];
        const next = current.includes(option)
          ? current.filter((o) => o !== option)
          : [...current, option];
        return { ...prev, [qId]: next };
      }
      return { ...prev, [qId]: option };
    });
  }

  function isOptionSelected(qId: string, option: string): boolean {
    const ans = answers[qId];
    if (Array.isArray(ans)) return ans.includes(option);
    return ans === option;
  }

  function canAdvance(): boolean {
    if (step === 0) return currentMood !== null;
    if (currentQ) {
      const ans = answers[currentQ.id];
      if (currentQ.multi_select) return Array.isArray(ans) && ans.length > 0;
      return typeof ans === "string" && ans.length > 0;
    }
    return true;
  }

  async function advanceToNextQuestion(currentAnswers: Record<string, string | string[]>) {
    // If we already have the next question loaded, just advance
    if (dynamicQuestions.length > step) {
      setStep(step + 1);
      return;
    }

    setLoadingNextQuestion(true);
    try {
      const res = await apiClient.post<{ done: boolean; question?: OnboardingQuestion }>(
        "/literary-dna/onboarding/next-question",
        { answers_so_far: currentAnswers }
      );
      if (res.data.done) {
        setOnboardingDone(true);
        setStep(dynamicQuestions.length + 1);
      } else if (res.data.question) {
        setDynamicQuestions((prev) => [...prev, res.data.question!]);
        setStep(step + 1);
      }
    } catch {
      // Fallback: treat as done if request fails
      setOnboardingDone(true);
      setStep(dynamicQuestions.length + 1);
    } finally {
      setLoadingNextQuestion(false);
    }
  }

  async function handleMoodNext() {
    if (currentMood) {
      localStorage.setItem("current_mood", currentMood);
    }
    await advanceToNextQuestion({});
  }

  async function handleQuestionNext() {
    if (!currentQ) return;
    await advanceToNextQuestion(answers);
  }

  async function handleFinish() {
    setBuilding(true);
    setBuildError("");
    try {
      await apiClient.post("/literary-dna/onboarding", { answers });
      router.push("/app");
    } catch {
      setBuildError("Не удалось сохранить профиль — попробуй ещё раз");
      setBuilding(false);
    }
  }

  return (
    <>
      <StarryBackground />
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
        <AmbientParticles count={12} />
        <div className="w-full max-w-lg space-y-8 relative z-10">
          {/* Progress bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-heading text-lg text-gradient-amber">Book Imaginarium</span>
              <span>
                {onboardingDone || isConfirmStep
                  ? "Готово"
                  : `Шаг ${step + 1}${dynamicQuestions.length > 0 ? ` из ~${totalSteps}` : ""}`}
              </span>
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-amber"
                animate={{
                  width: isConfirmStep
                    ? "100%"
                    : `${Math.min(95, ((step + 1) / Math.max(totalSteps, 3)) * 100)}%`,
                }}
                transition={{ duration: 0.5, ease: [0.25, 0, 0.35, 1] }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loadingNextQuestion ? (
              <motion.div
                key="loading-question"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <GlassCard glow className="flex items-center justify-center py-16 gap-3">
                  <Loader2 className="text-amber animate-spin" size={24} />
                  <span className="text-[#D4B896]">AI формирует следующий вопрос...</span>
                </GlassCard>
              </motion.div>
            ) : !building ? (
              <motion.div
                key={step}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <GlassCard glow className="space-y-6">
                  {/* Step 0: current mood (localStorage only) */}
                  {step === 0 && (
                    <>
                      <div className="space-y-2">
                        <h2 className="font-heading text-3xl font-semibold text-gradient-cream">
                          Как ты сейчас себя чувствуешь?
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Это настроение прямо сейчас — повлияет только на первые рекомендации
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {MOODS.map((mood) => (
                          <button
                            key={mood.id}
                            onClick={() => setCurrentMood(mood.id)}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                              currentMood === mood.id
                                ? "border-amber bg-amber/10 text-amber"
                                : "border-border/60 hover:border-amber/30 hover:bg-amber/5 text-[#D4B896]"
                            }`}
                          >
                            <span className="text-2xl">{mood.emoji}</span>
                            <span className="font-medium">{mood.label}</span>
                            {currentMood === mood.id && <Check size={16} className="ml-auto" />}
                          </button>
                        ))}
                      </div>
                      <Button
                        onClick={handleMoodNext}
                        disabled={!canAdvance()}
                        className="w-full bg-amber hover:bg-amber-light text-background font-semibold py-5"
                      >
                        Далее <ArrowRight size={16} />
                      </Button>
                    </>
                  )}

                  {/* Dynamic AI-generated questions */}
                  {isQuestionStep && currentQ && (
                    <>
                      <div className="space-y-2">
                        <h2 className="font-heading text-2xl font-semibold text-gradient-cream leading-snug">
                          {currentQ.question}
                        </h2>
                        {currentQ.multi_select && (
                          <p className="text-sm text-muted-foreground">
                            Можно выбрать несколько
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {currentQ.options.map((option) => {
                          const selected = isOptionSelected(currentQ.id, option);
                          return (
                            <button
                              key={option}
                              onClick={() => toggleOption(currentQ.id, option, currentQ.multi_select)}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                                selected
                                  ? "border-amber bg-amber/10 text-amber"
                                  : "border-border/60 hover:border-amber/30 hover:bg-amber/5 text-[#D4B896]"
                              }`}
                            >
                              <span className="flex-1 font-medium text-sm">{option}</span>
                              {selected && <Check size={16} className="shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setStep(step - 1)}
                          className="border-amber/30 text-amber hover:bg-amber/5 flex-1 py-5"
                        >
                          Назад
                        </Button>
                        <Button
                          onClick={handleQuestionNext}
                          disabled={!canAdvance()}
                          className="bg-amber hover:bg-amber-light text-background font-semibold flex-1 py-5"
                        >
                          Далее <ArrowRight size={16} />
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Final confirm step */}
                  {isConfirmStep && (
                    <>
                      <div className="space-y-2 text-center">
                        <div className="text-5xl mb-2">✦</div>
                        <h2 className="font-heading text-3xl font-semibold text-gradient-cream">
                          Всё готово!
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          AI построит твой Literary DNA на основе {Object.keys(answers).length} ответов. Профиль будет расти с каждой книгой.
                        </p>
                      </div>
                      <div className="space-y-2 py-2">
                        {dynamicQuestions.map((q) => {
                          const ans = answers[q.id];
                          const display = Array.isArray(ans) ? ans.join(", ") : (ans ?? "—");
                          return (
                            <div key={q.id} className="flex items-start gap-2 text-sm text-[#D4B896]">
                              <Check size={14} className="text-amber mt-0.5 shrink-0" />
                              <span className="line-clamp-2">{display}</span>
                            </div>
                          );
                        })}
                      </div>
                      {buildError && (
                        <p className="text-sm text-destructive text-center">{buildError}</p>
                      )}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setOnboardingDone(false);
                            setStep(dynamicQuestions.length);
                          }}
                          className="border-amber/30 text-amber hover:bg-amber/5 flex-1 py-5"
                        >
                          Назад
                        </Button>
                        <Button
                          onClick={handleFinish}
                          className="bg-amber hover:bg-amber-light text-background font-semibold flex-1 py-5 text-base"
                        >
                          Построить Literary DNA ✦
                        </Button>
                      </div>
                    </>
                  )}
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div
                key="building"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <GlassCard glow className="text-center space-y-6 py-8">
                  <motion.div
                    className="text-6xl mx-auto"
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    ✦
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="font-heading text-2xl font-semibold text-gradient-cream">
                      Literary DNA формируется...
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      AI анализирует твои предпочтения и строит уникальный профиль
                    </p>
                  </div>
                  <div className="space-y-2">
                    {["Анализ предпочтений...", "Построение DNA профиля...", "Настройка рекомендаций..."].map(
                      (label, i) => (
                        <motion.div
                          key={label}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.6 }}
                          className="flex items-center gap-2 text-sm text-[#9A7D5A]"
                        >
                          <motion.div
                            className="w-1.5 h-1.5 rounded-full bg-amber"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
                          />
                          {label}
                        </motion.div>
                      )
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
