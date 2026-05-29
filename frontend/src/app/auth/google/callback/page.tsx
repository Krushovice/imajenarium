"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { StarryBackground } from "@/components/design-system";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setAccessToken } = useAuthStore();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError("Авторизация через Google отменена");
      setTimeout(() => router.push("/auth/login"), 2000);
      return;
    }

    if (!code) {
      setError("Код авторизации не получен");
      setTimeout(() => router.push("/auth/login"), 2000);
      return;
    }

    const redirectUri = `${window.location.origin}/auth/google/callback`;

    apiClient
      .post("/auth/google/callback", { code, redirect_uri: redirectUri })
      .then(({ data }) => {
        setAccessToken(data.access_token);
        setUser({
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          displayName: data.user.display_name ?? data.user.username,
          avatarUrl: data.user.avatar_url ?? undefined,
          isGuest: data.user.is_guest,
        });
        router.push("/app");
      })
      .catch(() => {
        setError("Ошибка авторизации через Google");
        setTimeout(() => router.push("/auth/login"), 2000);
      });
  }, [searchParams, router, setAccessToken, setUser]);

  return (
    <>
      <StarryBackground />
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          {error ? (
            <>
              <p className="text-destructive font-medium">{error}</p>
              <p className="text-sm text-muted-foreground">Перенаправляем на страницу входа...</p>
            </>
          ) : (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block w-10 h-10 border-2 border-amber/30 border-t-amber rounded-full"
              />
              <p className="text-[#D4B896] font-medium">Входим через Google...</p>
            </>
          )}
        </motion.div>
      </div>
    </>
  );
}
