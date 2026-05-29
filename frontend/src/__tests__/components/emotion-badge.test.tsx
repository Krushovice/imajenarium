import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmotionBadge } from "@/components/design-system/emotion-badge";

describe("EmotionBadge", () => {
  it("renders label text", () => {
    render(<EmotionBadge label="dark" />);
    expect(screen.getByText("dark")).toBeInTheDocument();
  });

  it("applies known emotion color class", () => {
    const { container } = render(<EmotionBadge label="melancholic" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("8EB0D0");
  });

  it("applies default color for unknown emotion", () => {
    const { container } = render(<EmotionBadge label="xyzcustom" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("amber");
  });

  it("case-insensitive label matching", () => {
    const { container: c1 } = render(<EmotionBadge label="DARK" />);
    const { container: c2 } = render(<EmotionBadge label="dark" />);
    expect(c1.firstChild).not.toBeNull();
    expect(c2.firstChild).not.toBeNull();
    expect((c1.firstChild as HTMLElement).className).toBe((c2.firstChild as HTMLElement).className);
  });

  it("sm size applies text-xs", () => {
    const { container } = render(<EmotionBadge label="hopeful" size="sm" />);
    expect((container.firstChild as HTMLElement).className).toContain("text-xs");
  });

  it("md size applies text-sm", () => {
    const { container } = render(<EmotionBadge label="hopeful" size="md" />);
    expect((container.firstChild as HTMLElement).className).toContain("text-sm");
  });

  it("accepts custom className", () => {
    const { container } = render(<EmotionBadge label="tense" className="my-custom" />);
    expect((container.firstChild as HTMLElement).className).toContain("my-custom");
  });

  it("renders as span", () => {
    const { container } = render(<EmotionBadge label="romantic" />);
    expect(container.firstChild?.nodeName).toBe("SPAN");
  });
});
