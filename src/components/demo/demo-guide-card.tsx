"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { BeckonHalo, beckonBounce } from "@/components/beckon";
import type { ReactNode } from "react";
import { STEP_COUNT, TOUR_STEPS, stepSide, type Side, type Stage } from "./demo-tour";

/**
 * Main Responsibility: The card both /demo guides are drawn with: who you are
 * on this side, this side's steps (numbered across the whole run, so 1 and 4
 * sit on the client card and 2 and 3 on the agency card), and a "waiting"
 * line while it is the other side's turn.
 *
 * Sensitive Dependencies:
 * - Exactly one card beckons at a time: `active` is derived from the shared
 *   stage (`stepSide(stage) === side`), never from local state, so the two
 *   cards cannot both pulse or both go quiet.
 * - Rendered in two documents (the top window and the bakery iframe). Keep it
 *   free of anything window-specific; the callers own positioning.
 */

export function TypingDots({ still }: { still: boolean }) {
  return (
    <span aria-hidden className="ml-1 inline-flex items-center gap-0.5 align-middle">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1 w-1 rounded-full bg-current"
          initial={{ opacity: 0.6 }}
          animate={still ? { opacity: 0.6 } : { opacity: [0.15, 1, 0.15] }}
          transition={still ? undefined : { duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

const ROLES: Record<Side, { badge: string; name: string; icon: string }> = {
  client: { badge: "Client view", name: "You are Maria, the bakery owner", icon: "M" },
  agency: { badge: "Agency view", name: "You are Dani at Pixel & Pine", icon: "D" },
};

export function DemoGuideCard({
  side,
  stage,
  onStartOver,
  finale,
  compact = false,
  className = "",
  style,
}: {
  side: Side;
  stage: Stage;
  onStartOver: () => void;
  /** Shown under the steps once the whole loop is done. */
  finale?: ReactNode;
  /** Just the current step (title + hint), or the finale once done, for the strip above a narrow bakery frame. */
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduceMotion = useReducedMotion();
  const active = stepSide(stage) === side;
  const beckon = active && !reduceMotion;
  const steps = TOUR_STEPS.map((step, i) => ({ ...step, number: i + 1, index: i })).filter((s) => s.side === side);
  const role = ROLES[side];
  const current = stage < STEP_COUNT ? TOUR_STEPS[stage] : null;
  const done = stage >= STEP_COUNT;
  const startOverButton = (
    <button
      type="button"
      onClick={onStartOver}
      className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors cursor-pointer"
    >
      <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Start over
    </button>
  );

  return (
    <motion.aside
      aria-label={side === "client" ? "Client guide" : "Agency guide"}
      data-active={active ? "true" : "false"}
      initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.3 }}
      // cn() so a caller's `fixed` replaces the default `relative` instead of
      // losing to it on stylesheet order.
      className={cn("relative text-gray-900", className)}
      style={style}
    >
      {/* The pulsing halo marks the card whose turn it is, and only that one. */}
      {beckon && <BeckonHalo />}
      <motion.div
        className={`relative rounded-3xl bg-white/95 backdrop-blur-md ring-1 transition-[box-shadow,opacity] duration-300 ${
          active ? "shadow-2xl shadow-gray-900/10 ring-gray-200" : "shadow-lg shadow-gray-900/5 ring-gray-200/70"
        }`}
        {...beckonBounce(beckon)}
      >
        <div className={`flex items-center gap-3 ${compact ? "px-4 py-2.5" : "px-5 pt-4 pb-3"}`}>
          <span
            aria-hidden
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${
              side === "client" ? "bg-[#6b3f1d]" : "bg-primary"
            }`}
          >
            {role.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{role.badge}</p>
            <p className={`text-sm font-bold ${compact ? "" : "truncate"}`}>
              {compact && current ? (active ? `${stage + 1}. ${current.title}` : current.waiting) : role.name}
            </p>
            {compact && active && current && <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{current.hint}</p>}
          </div>
          <span className="text-xs font-semibold text-gray-400 tabular-nums shrink-0">
            {Math.min(stage, STEP_COUNT)}/{STEP_COUNT}
          </span>
        </div>

        {!compact && (
          <div className="px-5 pb-5">
            <ol className="space-y-3">
              {steps.map((step) => {
                const done = step.index < stage;
                const now = step.index === stage;
                return (
                  <li key={step.number} className="flex gap-3" data-done={done}>
                    <span className="relative mt-0.5 h-6 w-6 shrink-0">
                      {now && !reduceMotion && <span aria-hidden className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />}
                      <span
                        className={`relative grid h-6 w-6 place-items-center rounded-full text-xs font-bold transition-colors ${
                          done ? "bg-emerald-500 text-white" : now ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : step.number}
                      </span>
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${done ? "text-gray-400 line-through decoration-gray-300" : now ? "text-gray-900" : "text-gray-500"}`}>
                        {step.title}
                      </p>
                      {!done && (
                        <p className={`mt-0.5 text-xs leading-relaxed ${now ? "text-gray-500" : "text-gray-400"}`}>{step.hint}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            {/* The other side's turn: say what is happening over there. */}
            {current && !active && (
              <p className="mt-4 rounded-2xl bg-gray-50 px-3.5 py-2.5 text-xs font-medium text-gray-500 ring-1 ring-gray-100" aria-live="polite">
                {current.waiting}
                <TypingDots still={!!reduceMotion} />
              </p>
            )}

            {done && finale}

            {stage > 0 && startOverButton}
          </div>
        )}

        {/* The strip has no step list, but the end of the run still gets its
            finale: on a phone it is the last thing on screen. */}
        {compact && done && (
          <div className="px-4 pb-4">
            {finale}
            {startOverButton}
          </div>
        )}
      </motion.div>
    </motion.aside>
  );
}
