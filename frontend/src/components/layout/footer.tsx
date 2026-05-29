import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const FOOTER_LINKS = {
  Платформа: [
    { href: "/discover", label: "Открытия" },
    { href: "/diary", label: "Читательский дневник" },
    { href: "/social", label: "Сообщество" },
    { href: "/feed", label: "Новости" },
  ],
  Профиль: [
    { href: "/profile", label: "Literary DNA" },
    { href: "/library", label: "Моя библиотека" },
    { href: "/settings", label: "Настройки" },
  ],
  "О проекте": [
    { href: "/about", label: "О нас" },
    { href: "/privacy", label: "Конфиденциальность" },
    { href: "/terms", label: "Условия использования" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-xl font-heading font-semibold text-gradient-amber">
                Book Imaginarium
              </span>
            </Link>
            <p className="text-base text-[#C4A882] leading-relaxed">
              Персональный литературный мир, построенный на эмоциях и атмосфере.
            </p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-base text-[#C4A882] hover:text-amber-light transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8 bg-border" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-[#B09060]">
            © {new Date().getFullYear()} Book Imaginarium. Все права защищены.
          </p>
          <p className="text-sm text-[#B09060]">
            Создано с любовью к книгам
          </p>
        </div>
      </div>
    </footer>
  );
}
