"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Main Responsibility: The one "look here, this is your next click" effect:
 * a soft pulsing brand-gradient halo behind an element, plus a periodic
 * bounce for the element itself. Shared so the /demo guide cards and the
 * feedback card they point at draw the eye the same way.
 *
 * Sensitive Dependencies:
 * - The halo is absolutely positioned: its parent must be `relative`, and
 *   the halo must come BEFORE the content so it paints behind it.
 * - Callers skip both under reduced motion.
 */

export function BeckonHalo({ className }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      className={cn("pointer-events-none absolute -inset-1.5 rounded-[1.9rem] bg-gradient-to-r from-primary via-secondary to-primary blur-md", className)}
      animate={{ opacity: [0.25, 0.8, 0.25] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/** Spread onto the beckoning element's motion component: `{...beckonBounce(on)}`. */
export function beckonBounce(on: boolean) {
  return on
    ? { animate: { y: [0, -8, 0, -4, 0] }, transition: { duration: 0.9, repeat: Infinity, repeatDelay: 2.4, delay: 1.2, ease: "easeOut" as const } }
    : { animate: { y: 0 }, transition: { duration: 0.2 } };
}
