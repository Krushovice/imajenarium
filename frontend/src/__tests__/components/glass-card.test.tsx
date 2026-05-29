import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GlassCard } from "@/components/design-system/glass-card";

describe("GlassCard", () => {
  it("renders children", () => {
    render(<GlassCard>Hello Card</GlassCard>);
    expect(screen.getByText("Hello Card")).toBeInTheDocument();
  });

  it("applies glass and rounded-xl classes by default", () => {
    const { container } = render(<GlassCard>content</GlassCard>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("glass");
    expect(el.className).toContain("rounded-xl");
  });

  it("applies ambient-glow when glow=true", () => {
    const { container } = render(<GlassCard glow>content</GlassCard>);
    expect((container.firstChild as HTMLElement).className).toContain("ambient-glow");
  });

  it("no ambient-glow when glow=false", () => {
    const { container } = render(<GlassCard glow={false}>content</GlassCard>);
    expect((container.firstChild as HTMLElement).className).not.toContain("ambient-glow");
  });

  it("applies cursor-pointer when onClick provided", () => {
    const { container } = render(<GlassCard onClick={() => {}}>content</GlassCard>);
    expect((container.firstChild as HTMLElement).className).toContain("cursor-pointer");
  });

  it("no cursor-pointer without onClick", () => {
    const { container } = render(<GlassCard>content</GlassCard>);
    expect((container.firstChild as HTMLElement).className).not.toContain("cursor-pointer");
  });

  it("calls onClick when clicked", () => {
    const handler = vi.fn();
    render(<GlassCard onClick={handler}>click me</GlassCard>);
    fireEvent.click(screen.getByText("click me"));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("merges custom className", () => {
    const { container } = render(<GlassCard className="custom-class">content</GlassCard>);
    expect((container.firstChild as HTMLElement).className).toContain("custom-class");
  });
});
