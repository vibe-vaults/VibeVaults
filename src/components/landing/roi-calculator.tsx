"use client";

import React, { useState, useMemo, useId } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, DollarSign, Clock, FolderOpen } from "lucide-react";
import { TIER_DISPLAY, TIER_LIMITS } from "@/lib/tier-config";
import { Accent, SectionHeading } from "@/components/landing/section-heading";

/**
 * Main Responsibility: Interactive ROI calculator that lets prospects input their
 * hourly rate, active project count and feedback hours per project, then visualises
 * monthly time & money savings.
 *
 * Sensitive Dependencies: TIER_DISPLAY / TIER_LIMITS from tier-config.ts (plan price
 * and which plan fits the project count). Otherwise pure client-side math.
 */

// Deliberately conservative model. Only the feedback *logistics* is counted
// (collecting, clarifying "which button?", chasing screenshots and browser details),
// never the design/dev rework itself, which a feedback tool does not remove.
// The 50% cut matches the public vendor claims ("2x faster" on Pastel's site; a
// Pastel customer reporting "at least 50%"); the strongest single case study
// (BugHerd/Longhouse, 88%) is deliberately not used. The baseline hours are only a
// default; the visitor sets their own on the third slider. The reduction is fixed
// on purpose: letting visitors pick it would make the result look invented.
const DEFAULT_FEEDBACK_HOURS = 6; // per active project, per month
// Capped at 20h: beyond that the figure is really design/dev rework, which this
// model deliberately leaves out.
const MAX_FEEDBACK_HOURS = 20;
const TIME_REDUCTION = 0.5;

// Full class strings per accent, because Tailwind only generates classes it can
// see verbatim in the source.
const ACCENT_STYLES = {
  primary: {
    icon: "text-primary",
    input:
      "accent-primary [&::-webkit-slider-thumb]:bg-primary",
  },
  secondary: {
    icon: "text-secondary",
    input:
      "accent-secondary [&::-webkit-slider-thumb]:bg-secondary",
  },
} as const;

interface RangeFieldProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: keyof typeof ACCENT_STYLES;
  label: string;
  display: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  minLabel: string;
  maxLabel: string;
}

const RangeField = ({
  icon: Icon,
  accent,
  label,
  display,
  min,
  max,
  step,
  value,
  onChange,
  minLabel,
  maxLabel,
}: RangeFieldProps) => {
  const id = useId();
  const styles = ACCENT_STYLES[accent];
  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-3">
        <label
          htmlFor={id}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700"
        >
          <Icon size={16} className={`shrink-0 ${styles.icon}`} />
          {label}
        </label>
        <span className="text-2xl font-extrabold text-gray-900">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg ${styles.input}`}
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
};

// The cheapest plan whose project limit covers the visitor's active projects
// (TIER_DISPLAY is ordered cheapest first; Business is the unlimited fallback).
const planFor = (projects: number) =>
  TIER_DISPLAY.find((t) => projects <= TIER_LIMITS[t.slug].maxProjects) ??
  TIER_DISPLAY[TIER_DISPLAY.length - 1];

/** One result figure in the navy results panel; tiles form a 2x2 hairline grid. */
function StatTile({
  icon: Icon,
  iconClass,
  label,
  value,
  valueClass = "text-white",
  note,
}: {
  icon: React.ElementType;
  iconClass: string;
  label: string;
  value: string;
  valueClass?: string;
  note: string;
}) {
  return (
    <div className="py-5 pr-4 border-b border-white/15 [&:nth-child(odd)]:border-r [&:nth-child(even)]:pl-5">
      <dt className="flex items-center gap-2 mb-2 text-xs font-semibold text-white/60">
        <Icon size={15} className={iconClass} aria-hidden="true" />
        {label}
      </dt>
      <dd>
        <motion.p
          key={value}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-2xl font-semibold tabular-nums ${valueClass}`}
        >
          {value}
        </motion.p>
        <p className="text-xs text-white/50 mt-1">{note}</p>
      </dd>
    </div>
  );
}

export const ROICalculator = () => {
  const [hourlyRate, setHourlyRate] = useState(100);
  const [activeProjects, setActiveProjects] = useState(5);
  const [feedbackHours, setFeedbackHours] = useState(DEFAULT_FEEDBACK_HOURS);

  const stats = useMemo(() => {
    // Round the two hour totals once and derive everything else from them, so the
    // displayed hours and dollars always add up.
    const withoutHours = Math.round(feedbackHours * activeProjects);
    const withHours = Math.round(withoutHours * (1 - TIME_REDUCTION));
    const savedHours = withoutHours - withHours;
    const savedTime = savedHours * hourlyRate;

    const plan = planFor(activeProjects);
    // Rounded UP to 0.1h: rounding down would claim it pays off before it does.
    const paybackHours = Math.ceil((plan.monthlyPrice / hourlyRate) * 10) / 10;

    // Savings are net of the plan fee, and may be negative for a small setup:
    // we show that honestly rather than clamping to $0. Annual uses the
    // yearly-billed price, which is what a one-year commitment actually costs.
    const withoutCost = withoutHours * hourlyRate;
    const withCost = withHours * hourlyRate + plan.monthlyPrice;

    return {
      withoutHours,
      withHours,
      savedHours,
      netMonthly: withoutCost - withCost,
      withoutCost,
      withCost,
      paybackHours: String(paybackHours),
      netAnnual: Math.round(savedTime * 12 - plan.yearlyTotal),
      plan,
    };
  }, [hourlyRate, activeProjects, feedbackHours]);

  const formatCurrency = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <section className="py-24 md:py-32 w-full bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <SectionHeading kicker="See how much time and money your agency can save each month by eliminating the feedback chaos.">
            Calculate your <Accent>savings</Accent>
          </SectionHeading>
        </motion.div>

        {/* One card: inputs on white, results on navy (side by side from lg) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid lg:grid-cols-2 rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-[0_30px_60px_-30px_rgba(15,27,42,0.25)]"
        >
          {/* Left: Inputs */}
          <div className="p-8 md:p-10 flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-8">
              Your agency details
            </h3>

            <div className="flex flex-1 flex-col justify-between gap-10">
              <RangeField
                icon={DollarSign}
                accent="primary"
                label="Hourly rate"
                display={`$${hourlyRate}`}
                min={25}
                max={300}
                step={5}
                value={hourlyRate}
                onChange={setHourlyRate}
                minLabel="$25/hr"
                maxLabel="$300/hr"
              />
              <RangeField
                icon={FolderOpen}
                accent="primary"
                label="Active projects per month"
                display={String(activeProjects)}
                min={1}
                max={30}
                step={1}
                value={activeProjects}
                onChange={setActiveProjects}
                minLabel="1 project"
                maxLabel="30 projects"
              />
              <RangeField
                icon={Clock}
                accent="primary"
                label="Hours on feedback per project / month"
                display={`${feedbackHours}h`}
                min={1}
                max={MAX_FEEDBACK_HOURS}
                step={1}
                value={feedbackHours}
                onChange={setFeedbackHours}
                minLabel="1h"
                maxLabel={`${MAX_FEEDBACK_HOURS}h`}
              />
            </div>
          </div>

          {/* Right: Results */}
          <div className="relative bg-navy text-white p-8 md:p-10 flex flex-col gap-8 overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(70%_60%_at_100%_0%,rgba(32,156,238,0.28),transparent_70%)]"
            />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60 mb-3">
                Your estimated monthly savings
              </p>
              <motion.p
                key={stats.netMonthly}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-6xl md:text-7xl font-semibold tracking-[-0.04em] tabular-nums"
              >
                {formatCurrency(stats.netMonthly)}
              </motion.p>
              <p className="text-white/60 text-sm mt-3">
                {stats.netMonthly > 0 ? (
                  <>
                    That&apos;s{" "}
                    <span className="text-white font-bold">
                      {stats.savedHours} hours
                    </span>{" "}
                    saved every month, after the{" "}
                  </>
                ) : (
                  <>Doesn&apos;t pay off yet at this size, against the </>
                )}
                <span className="text-white font-bold">
                  ${stats.plan.monthlyPrice}/mo
                </span>{" "}
                {stats.plan.name} plan
              </p>
            </div>

            <dl className="relative grid grid-cols-2 border-t border-white/15">
              <StatTile
                icon={TrendingUp}
                iconClass="text-secondary"
                label="Without"
                value={formatCurrency(stats.withoutCost)}
                valueClass="text-secondary"
                note={`${stats.withoutHours}h / month on feedback`}
              />
              <StatTile
                icon={TrendingDown}
                iconClass="text-primary"
                label="With VibeVaults"
                value={formatCurrency(stats.withCost)}
                valueClass="text-primary"
                note={`${stats.withHours}h / month on feedback + plan`}
              />
              <StatTile
                icon={Clock}
                iconClass="text-primary"
                label="Pays for itself in"
                value={`${stats.paybackHours}h`}
                valueClass="text-primary"
                note="of saved work per month"
              />
              <StatTile
                icon={DollarSign}
                iconClass="text-primary"
                label="Annual savings"
                value={formatCurrency(stats.netAnnual)}
                valueClass={stats.netAnnual > 0 ? "text-primary" : "text-white/60"}
                note={`after ${formatCurrency(stats.plan.yearlyTotal)}/yr for ${stats.plan.name}, billed yearly`}
              />
            </dl>
          </div>
        </motion.div>

        {/* Methodology note */}
        <p className="text-center text-xs text-gray-400 mt-12 max-w-xl mx-auto">
          Hours on feedback means collecting, clarifying and chasing client
          feedback, cut by {Math.round(TIME_REDUCTION * 100)}% in line with what
          visual feedback tools publicly report. Design and development rework
          is not counted. Your actual savings may vary.
        </p>
      </div>
    </section>
  );
};
