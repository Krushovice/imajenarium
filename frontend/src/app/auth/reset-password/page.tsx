"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { StarryBackground, GlassCard } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { apiClient } from "@/lib/api/client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await apiClient.post("/auth/reset-password", { token, new_password: password });
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 3000);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Ссылка недействительна или истекла");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <>
        <StarryBackground />
        <div className="min-h-screen flex items-center justify-center px-4">
          <GlassCard glow className="text-center space-y-4 max-w-sm w-full">
            <p className="text-destructive font-medium">Ссылка недействительна</p>
            <Link href="/auth/forgot-password">
              <Button variant="outline" className="border-amber/30 text-amber hover:bg-amber/5">
                Запросить новую ссылку
              </Button>
            </Link>
          </GlassCard>
        </div>
      </>
    );
  }

  return (
    <>
      <StarryBackground />
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md space-y-6"
        >
          <motion.div variants={staggerItem} className="text-center space-y-2">
            <Link href="/" className="inline-block">
              <h1 className="font-heading text-3xl font-semibold text-gradient-amber">
                Book Imaginarium
              </h1>
            </Link>
            <p className="text-sm text-muted-foreground">Новый пароль</p>
          </motion.div>

          <motion.div variants={staggerItem}>
            <GlassCard glow>
              {done ? (
                <div className="space-y-4 text-center py-4">
                  <CheckCircle className="mx-auto text-amber" size={48} />
                  <h2 className="font-heading text-xl font-semibold text-gradient-cream">
                    Пароль изменён!
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Перенаправляем на страницу входа...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[#D4B896]">Новый пароль</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="минимум 8 символов"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-white/5 border-amber/20 focus:border-amber/50"
                        minLength={8}
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-amber transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm" className="text-[#D4B896]">Повтори пароль</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        id="confirm"
                        type={showPassword ? "text" : "password"}
                        placeholder="повтори пароль"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className="pl-10 bg-white/5 border-amber/20 focus:border-amber/50"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber hover:bg-amber-light text-background font-semibold py-5 text-base"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="inline-block w-4 h-4 border-2 border-background/30 border-t-background rounded-full"
                        />
                        Сохраняем...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Сохранить пароль <ArrowRight size={16} />
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
