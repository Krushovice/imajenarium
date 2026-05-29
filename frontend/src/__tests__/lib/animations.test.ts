import { describe, it, expect } from "vitest";
import {
  fadeIn,
  fadeInUp,
  fadeInDown,
  scaleIn,
  slideInLeft,
  slideInRight,
  staggerContainer,
  staggerItem,
  parallaxConfig,
  glassHover,
  pageTransition,
  floatAnimation,
  pulseAnimation,
} from "@/lib/animations";

describe("animation variants", () => {
  it("fadeIn has hidden/visible states", () => {
    expect(fadeIn.hidden).toMatchObject({ opacity: 0 });
    expect(fadeIn.visible).toMatchObject({ opacity: 1 });
  });

  it("fadeInUp hidden has y offset", () => {
    expect((fadeInUp.hidden as { y: number }).y).toBeGreaterThan(0);
  });

  it("fadeInDown hidden has negative y offset", () => {
    expect((fadeInDown.hidden as { y: number }).y).toBeLessThan(0);
  });

  it("scaleIn hidden scale < 1", () => {
    expect((scaleIn.hidden as { scale: number }).scale).toBeLessThan(1);
  });

  it("slideInLeft hidden x < 0", () => {
    expect((slideInLeft.hidden as { x: number }).x).toBeLessThan(0);
  });

  it("slideInRight hidden x > 0", () => {
    expect((slideInRight.hidden as { x: number }).x).toBeGreaterThan(0);
  });

  it("staggerContainer has staggerChildren in visible transition", () => {
    const visible = staggerContainer.visible as { transition: { staggerChildren: number } };
    expect(visible.transition.staggerChildren).toBeGreaterThan(0);
  });

  it("staggerItem visible has opacity 1", () => {
    expect((staggerItem.visible as { opacity: number }).opacity).toBe(1);
  });

  it("parallaxConfig has slow/medium/fast keys", () => {
    expect(parallaxConfig).toHaveProperty("slow");
    expect(parallaxConfig).toHaveProperty("medium");
    expect(parallaxConfig).toHaveProperty("fast");
    expect(parallaxConfig.slow).toBeLessThan(parallaxConfig.fast);
  });

  it("glassHover hover scale > rest scale", () => {
    const rest = glassHover.rest as { scale: number };
    const hover = glassHover.hover as { scale: number };
    expect(hover.scale).toBeGreaterThan(rest.scale);
  });

  it("pageTransition has exit state", () => {
    expect(pageTransition).toHaveProperty("exit");
  });

  it("floatAnimation has infinite repeat", () => {
    expect(floatAnimation.transition.repeat).toBe(Infinity);
  });

  it("pulseAnimation has scale array", () => {
    expect(Array.isArray(pulseAnimation.scale)).toBe(true);
    expect(pulseAnimation.scale.length).toBe(3);
  });
});
