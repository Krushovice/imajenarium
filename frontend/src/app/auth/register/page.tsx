"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";
import { StarryBackground, GlassCard } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";

const TELEGRAM_BOT_NAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME;

declare global {
  interface Window {
    onTelegramAuthRegister?: (user: Record<string, unknown>) => void;
  }
}

const CYRILLIC_RE = /[а-яёА-ЯЁ]/;
const USERNAME_RE = /^[a-zA-Z0-9_-]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setAccessToken } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const storeAuthResponse = useCallback(
    (data: {
      access_token: string;
      user: {
        id: string;
        email: string;
        username: string;
        display_name?: string;
        avatar_url?: string;
        is_guest: boolean;
      };
    }) => {
      setAccessToken(data.access_token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        displayName: data.user.display_name ?? data.user.username,
        avatarUrl: data.user.avatar_url ?? undefined,
        isGuest: data.user.is_guest,
      });
    },
    [setAccessToken, setUser]
  );

  useEffect(() => {
    if (!TELEGRAM_BOT_NAME) return;

    window.onTelegramAuthRegister = async (user) => {
      setLoading(true);
      setError("");
      try {
        const { data } = await apiClient.post("/auth/telegram", user);
        storeAuthResponse(data);
        router.push("/books");
      } catch {
        setError("Ошибка авторизации через Telegram");
      } finally {
        setLoading(false);
      }
    };

    const container = document.getElementById("telegram-widget-register");
    if (container) {
      container.innerHTML = "";
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.async = true;
      script.setAttribute("data-telegram-login", TELEGRAM_BOT_NAME);
      script.setAttribute("data-size", "medium");
      script.setAttribute("data-onauth", "onTelegramAuthRegister(user)");
      script.setAttribute("data-request-access", "write");
      container.appendChild(script);
    }

    return () => {
      delete window.onTelegramAuthRegister;
    };
  }, [router, storeAuthResponse]);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleGoogleLogin() {
    try {
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const { data } = await apiClient.get(`/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`);
      window.location.href = data.url;
    } catch {
      setError("Не удалось начать авторизацию через Google");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!USERNAME_RE.test(form.username)) {
      setError("Username: только латиница, цифры, _ и -");
      return;
    }
    if (CYRILLIC_RE.test(form.password)) {
      setError("Пароль не может содержать кириллицу");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Пароли не совпадают");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/register", {
        email: form.email,
        username: form.username,
        password: form.password,
        display_name: form.name || null,
      });
      storeAuthResponse(data);
      router.push("/auth/onboarding");
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (status === 409) setError("Email или username уже занят");
      else if (status === 422) setError(typeof detail === "string" ? detail : "Проверь введённые данные");
      else if (status === 429) setError("Слишком много попыток — подожди немного");
      else setError("Ошибка сервера, попробуй позже");
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
            <p className="text-sm text-muted-foreground">Создай свой литературный мир</p>
          </motion.div>

          <motion.div variants={staggerItem}>
            <GlassCard glow>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#D4B896]">Имя</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Как тебя зовут?"
                      value={form.name}
                      onChange={update("name")}
                      className="pl-10 bg-white/5 border-amber/20 focus:border-amber/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[#D4B896]">Username</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">@</span>
                    <Input
                      id="username"
                      type="text"
                      placeholder="только латиница и цифры"
                      value={form.username}
                      onChange={update("username")}
                      className="pl-8 bg-white/5 border-amber/20 focus:border-amber/50"
                      minLength={3}
                      maxLength={50}
                      pattern="^[a-zA-Z0-9_-]+$"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#D4B896]">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="твой@email.com"
                      value={form.email}
                      onChange={update("email")}
                      className="pl-10 bg-white/5 border-amber/20 focus:border-amber/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#D4B896]">Пароль</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Минимум 8 символов"
                      value={form.password}
                      onChange={update("password")}
                      className="pl-10 pr-10 bg-white/5 border-amber/20 focus:border-amber/50"
                      minLength={8}
                      required
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
                      placeholder="••••••••"
                      value={form.confirm}
                      onChange={update("confirm")}
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
                  className="w-full bg-amber hover:bg-amber-light text-background font-semibold py-5 text-base mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-block w-4 h-4 border-2 border-background/30 border-t-background rounded-full"
                      />
                      Создаём аккаунт...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Создать аккаунт <ArrowRight size={16} />
                    </span>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/60" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-card text-muted-foreground">или через</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {TELEGRAM_BOT_NAME ? (
                    <div id="telegram-widget-register" className="flex items-center justify-center" />
                  ) : (
                    <button
                      type="button"
                      disabled
                      title="Требует настройки NEXT_PUBLIC_TELEGRAM_BOT_NAME"
                      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border/60 opacity-40 cursor-not-allowed text-sm font-medium text-[#D4B896]"
                    >
                      <TelegramIcon />
                      Telegram
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border/60 hover:border-amber/30 hover:bg-amber/5 transition-all text-sm font-medium text-[#D4B896]"
                  >
                    <GoogleIcon />
                    Google
                  </button>
                </div>

                <p className="text-center text-xs text-muted-foreground leading-relaxed">
                  Регистрируясь, ты соглашаешься с{" "}
                  <Link href="/terms" className="text-amber hover:underline">условиями</Link>
                  {" "}и{" "}
                  <Link href="/privacy" className="text-amber hover:underline">политикой конфиденциальности</Link>
                </p>
              </form>
            </GlassCard>
          </motion.div>

          <motion.p variants={staggerItem} className="text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link href="/auth/login" className="text-amber hover:text-amber-light font-medium transition-colors">
              Войти
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </>
  );
}

function TelegramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.7 8.02c-.12.58-.45.72-.9.45l-2.5-1.84-1.2 1.16c-.14.14-.25.25-.5.25l.18-2.52 4.56-4.12c.2-.18-.04-.28-.3-.1l-5.64 3.54-2.43-.76c-.52-.16-.54-.52.12-.77l9.5-3.66c.44-.16.83.1.81.35z"
        fill="currentColor"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
