import { cn } from "@/lib/utils";

const EMOTION_COLORS: Record<string, string> = {
  // Тональности
  dark: "bg-graphite text-cream border-graphite-light",
  light: "bg-cream/10 text-cream border-cream/20",
  melancholic: "bg-[#2A3040]/60 text-[#8EB0D0] border-[#4A6080]/40",
  nostalgic: "bg-[#3A2820]/60 text-[#D4A080] border-[#6A4030]/40",
  hopeful: "bg-[#203A28]/60 text-[#80C090] border-[#406050]/40",
  tense: "bg-[#3A2020]/60 text-[#D08080] border-[#6A3030]/40",
  romantic: "bg-[#3A2030]/60 text-[#D080A0] border-[#6A3050]/40",
  mysterious: "bg-[#202030]/60 text-[#9080D0] border-[#403060]/40",
  // Default
  default: "bg-amber/10 text-amber-light border-amber/20",
};

interface EmotionBadgeProps {
  label: string;
  size?: "sm" | "md";
  className?: string;
}

export function EmotionBadge({ label, size = "sm", className }: EmotionBadgeProps) {
  const colorClass = EMOTION_COLORS[label.toLowerCase()] ?? EMOTION_COLORS.default;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium tracking-wide",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}
