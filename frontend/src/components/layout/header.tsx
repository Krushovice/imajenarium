"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fadeInDown } from "@/lib/animations";

const NAV_LINKS = [
  { href: "/discover", label: "Открытия" },
  { href: "/diary", label: "Дневник" },
  { href: "/social", label: "Друзья" },
  { href: "/feed", label: "Новости" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.header
      variants={fadeInDown}
      initial="hidden"
      animate="visible"
      className="sticky top-0 z-50 glass border-b border-border"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-heading font-semibold text-gradient-amber tracking-wide">
            Book Imaginarium
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(link.href)
                  ? "bg-accent text-amber"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="relative h-9 w-9 rounded-full cursor-pointer">
                  <Avatar className="h-9 w-9 ring-2 ring-amber/30">
                    <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                    <AvatarFallback className="bg-amber/10 text-amber font-heading">
                      {user.displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass border-border">
                <div className="px-3 py-2">
                  <p className="font-heading text-sm font-semibold">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  Профиль & ДНК
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/library")}>
                  Моя библиотека
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  Настройки
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} variant="destructive">
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                Войти
              </Link>
              <Link
                href="/auth/register"
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber text-background hover:bg-amber-light transition-colors"
              >
                Начать
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Меню"
          >
            <span className="sr-only">Меню</span>
            <div className="flex flex-col gap-1.5 w-5">
              <span className={cn("h-0.5 bg-foreground transition-all", mobileMenuOpen && "rotate-45 translate-y-2")} />
              <span className={cn("h-0.5 bg-foreground transition-all", mobileMenuOpen && "opacity-0")} />
              <span className={cn("h-0.5 bg-foreground transition-all", mobileMenuOpen && "-rotate-45 -translate-y-2")} />
            </div>
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-border md:hidden"
        >
          <nav className="flex flex-col p-4 gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  pathname.startsWith(link.href)
                    ? "bg-accent text-amber"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}
