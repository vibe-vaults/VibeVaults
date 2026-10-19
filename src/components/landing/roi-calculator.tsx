"use client";

import React, { useState, useMemo, useId } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, DollarSign, Clock, FolderOpen } from "lucide-react";
import { TIER_DISPLAY, TIER_LIMITS } from "@/lib/tier-config";

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

// Pro covers up to its project limit; above that the visitor needs Business.
const planFor = (projects: number) =>
  TIER_DISPLAY.find(
    (t) => t.slug === (projects <= TIER_LIMITS.pro.maxProjects ? "pro" : "business")
  )!;

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
    <section className="py-24 md:py-32 w-full bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            Calculate your savings
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            See how much time and money your agency can save each month by
            eliminating the feedback chaos.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-stretch">
          {/* Left: Inputs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl border border-gray-200 p-8 md:p-10 shadow-xl flex flex-col"
          >
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
                accent="secondary"
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
          </motion.div>

          {/* Right: Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-6"
          >
            {/* Big savings card */}
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

              <p className="text-sm font-semibold text-white/70 mb-2 relative z-10">
                Your estimated monthly savings
              </p>
              <motion.p
                key={stats.netMonthly}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl md:text-6xl font-black tracking-tight relative z-10"
              >
                {formatCurrency(stats.netMonthly)}
              </motion.p>
              <p className="text-white/60 text-sm mt-2 relative z-10">
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

            {/* Comparison cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                    <TrendingUp size={16} className="text-red-500" />
                  </div>
                  <span className="text-xs font-semibold text-gray-500">
                    Without
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">
                  {formatCurrency(stats.withoutCost)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {stats.withoutHours}h / month on feedback
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-primary/20 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                    <TrendingDown size={16} className="text-green-500" />
                  </div>
                  <span className="text-xs font-semibold text-gray-500">
                    With VibeVaults
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-primary">
                  {formatCurrency(stats.withCost)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {stats.withHours}h / month on feedback + plan
                </p>
              </div>
            </div>

            {/* Payback + annual savings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-secondary" />
                  <span className="text-xs font-semibold text-gray-500">
                    Pays for itself in
                  </span>
                </div>
                <motion.p
                  key={stats.paybackHours}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl font-extrabold text-secondary"
                >
                  {stats.paybackHours}h
                </motion.p>
                <p className="text-xs text-gray-400 mt-1">
                  of saved work per month
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign size={16} className="text-green-500" />
                  <span className="text-xs font-semibold text-gray-500">
                    Annual savings
                  </span>
                </div>
                <motion.p
                  key={stats.netAnnual}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-2xl font-extrabold ${stats.netAnnual > 0 ? "text-green-600" : "text-gray-500"}`}
                >
                  {formatCurrency(stats.netAnnual)}
                </motion.p>
                <p className="text-xs text-gray-400 mt-1">
                  after {formatCurrency(stats.plan.yearlyTotal)}/yr for{" "}
                  {stats.plan.name}, billed yearly
                </p>
              </div>
            </div>
          </motion.div>
        </div>

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
