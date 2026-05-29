import React from "react";
import { vi } from "vitest";

const motion = new Proxy(
  {},
  {
    get: (_target, prop: string) =>
      // eslint-disable-next-line react/display-name
      React.forwardRef(({ children, className, onClick, style, ...rest }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }, ref: React.Ref<HTMLElement>) => {
        const Tag = prop as keyof JSX.IntrinsicElements;
        return React.createElement(Tag, { className, onClick, style, ref, ...rest }, children);
      }),
  }
);

const AnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>;
AnimatePresence.displayName = "AnimatePresence";

export { motion, AnimatePresence };
export const useAnimation = vi.fn(() => ({ start: vi.fn(), stop: vi.fn() }));
export const useInView = vi.fn(() => false);
export const useScroll = vi.fn(() => ({ scrollY: { get: vi.fn(() => 0) } }));
export const useTransform = vi.fn((_v: unknown, _r: unknown, output: unknown[]) => ({ get: vi.fn(() => output[0]) }));
export const useMotionValue = vi.fn((initial: unknown) => ({ get: vi.fn(() => initial), set: vi.fn() }));
