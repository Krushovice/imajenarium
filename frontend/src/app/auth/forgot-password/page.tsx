"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { StarryBackground, GlassCard } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { apiClient } from "@/lib/api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setError("Ошибка сервера, попробуй позже");
    } finally {
      setLoading(false);
    }
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
            <p className="text-sm text-muted-foreground">Восстановление пароля</p>
          </motion.div>

          <motion.div variants={staggerItem}>
            <GlassCard glow>
              {sent ? (
                <div className="space-y-4 text-center py-4">
                  <CheckCircle className="mx-auto text-amber" size={48} />
                  <h2 className="font-heading text-xl font-semibold text-gradient-cream">
                    Письмо отправлено
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Если аккаунт с email <span className="text-amber">{email}</span> существует,
                    на него придёт ссылка для сброса пароля. Проверь папку «Спам».
                  </p>
                  <Link href="/auth/login">
                    <Button
                      variant="outline"
                      className="mt-2 border-amber/30 text-amber hover:bg-amber/5"
                    >
                      <ArrowLeft size={16} className="mr-2" />
                      Назад ко входу
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Введи email аккаунта — мы отправим ссылку для сброса пароля.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#D4B896]">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="твой@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white/5 border-amber/20 focus:border-amber/50"
                        required
                        autoFocus
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
                        Отправляем...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Отправить ссылку <ArrowRight size={16} />
                      </span>
                    )}
                  </Button>

                  <div className="text-center">
                    <Link
                      href="/auth/login"
                      className="text-sm text-muted-foreground hover:text-amber transition-colors inline-flex items-center gap-1"
                    >
                      <ArrowLeft size={14} />
                      Назад ко входу
                    </Link>
                  </div>
                </form>
              )}
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
