"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Bot, BookOpen, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";

/**
 * Main Responsibility: Landing page section that sells the MCP server (an AI tool reads a client's
 * pinned report and fixes the site). It sits right after the product demo because it is the lever
 * that turns "feedback collection" into "feedback that gets resolved".
 *
 * Sensitive Dependencies:
 * - The claims mirror `/docs/ai-agents` and `src/lib/mcp/` (read-only default, per-connection write
 *   switch, owners and members only, on every plan). Hand-written coupling: change them together.
 * - The Claude Connectors Directory chip states that the listing is live. Drop it if that changes.
 * - The terminal card is an illustration, not a recording; keep tool names in line with `tools.ts`.
 */

const steps = [
  {
    icon: MapPin,
    title: "Your client pins the problem",
    description:
      "They click the broken thing on the live site. The report carries the exact element, a screenshot, the console and the failed requests.",
  },
  {
    icon: Bot,
    title: "Your agent reads it and fixes the site",
    description:
      "Claude Code, Claude or Cursor pulls the report, sees where it was pinned, and goes straight to the code.",
  },
  {
    icon: CheckCircle2,
    title: "The client hears back in the same thread",
    description:
      "The agent can reply and move the report to In review. Replies are labelled as AI-assisted unless you turn that off.",
  },
];

const chips = [
  "Claude Code",
  "Claude",
  "Cursor",
  "Any MCP-ready tool",
  "In the Claude Connectors Directory",
  "On every plan",
];

/** One line of the illustrative terminal exchange. */
const Line = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`whitespace-pre-wrap break-words ${className}`}>{children}</div>
);

const AgentCard = () => (
  <div className="relative group">
    <div className="absolute -inset-1 bg-linear-to-r from-secondary to-primary rounded-2xl opacity-25 group-hover:opacity-35 transition duration-500 blur-lg" />
    <div className="relative bg-[#07111E] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
        <div className="text-[10px] text-gray-500 font-mono tracking-wider">claude code</div>
      </div>
      <div className="p-5 font-mono text-[11px] md:text-[13px] leading-relaxed space-y-3 text-left">
        <Line className="text-gray-100">
          <span className="text-primary select-none">&gt; </span>
          Work through the open pinned reports on the Acme site.
        </Line>

        <div className="space-y-1">
          <Line className="text-gray-400">
            <span className="text-green-400 select-none">● </span>
            vibevaults · list_feedback
          </Line>
          <Line className="text-gray-500 pl-4">3 open, 2 pinned</Line>
        </div>

        <div className="space-y-1">
          <Line className="text-gray-400">
            <span className="text-green-400 select-none">● </span>
            vibevaults · get_feedback
          </Line>
          <Line className="text-gray-500 pl-4">
            &ldquo;Menu button does nothing on my phone&rdquo;
          </Line>
          <Line className="text-gray-500 pl-4">
            pinned on <span className="text-amber-300">header .menu-toggle</span> · screenshot attached
          </Line>
          <Line className="text-gray-500 pl-4">
            console: <span className="text-red-300">TypeError: Cannot read properties of null</span>
          </Line>
        </div>

        <Line className="text-gray-100">
          <span className="text-primary select-none">● </span>
          The script looks up <span className="text-amber-300">#menu</span> before it exists. Fixed in
          header.js.
        </Line>

        <div className="space-y-1">
          <Line className="text-gray-400">
            <span className="text-green-400 select-none">● </span>
            vibevaults · reply_to_feedback
          </Line>
          <Line className="text-gray-400">
            <span className="text-green-400 select-none">● </span>
            vibevaults · update_feedback_status
            <span className="text-gray-500"> → in review</span>
          </Line>
        </div>
      </div>
    </div>
  </div>
);

export const McpAgents = () => {
  return (
    <section id="ai-agents" className="relative w-full py-24 md:py-32 bg-navy text-white scroll-mt-20 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(60%_70%_at_100%_0%,rgba(32,156,238,0.22),transparent_70%)]"
      />
      <div className="relative max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <p className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/60 mb-6">
              <Bot className="w-4 h-4 text-primary" aria-hidden="true" />
              AI agents (MCP)
            </p>
            <h2 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-6 text-balance">
              Your clients pin it.{" "}
              <span className="font-serif italic font-normal text-primary">Your agent fixes it.</span>
            </h2>
            <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-xl">
              Stop copying feedback out of a dashboard into your editor. Connect your AI tool once and it
              reads every report with the context a developer needs, so a round of client changes becomes
              minutes of review instead of an afternoon of triage.
            </p>

            <ol className="border-t border-white/15 mb-10">
              {steps.map((step, i) => (
                <li key={step.title} className="grid grid-cols-[44px_minmax(0,1fr)] gap-4 py-5 border-b border-white/15">
                  <span className="text-xs tracking-[0.1em] text-white/50 tabular-nums pt-1.5">
                    ( {String(i + 1).padStart(2, "0")} )
                  </span>
                  <div>
                    <h3 className="flex items-center gap-2.5 text-lg font-semibold text-white">
                      <step.icon className="w-4 h-4 text-secondary" aria-hidden="true" />
                      {step.title}
                    </h3>
                    <p className="text-white/60 leading-relaxed mt-1.5">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-[15px] transition-colors bg-secondary text-white hover:bg-[#D35F12]"
              >
                Start free trial
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                href="/docs/ai-agents"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-[15px] transition-colors border border-white/30 text-white hover:border-white hover:bg-white/5"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                Read the setup guide
              </Link>
            </div>

            <ul className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <li
                  key={chip}
                  className="rounded-full border border-white/15 px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-white/70"
                >
                  {chip}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <AgentCard />
            <p className="mt-5 flex items-start gap-2 text-sm text-white/50">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                Read-only until you switch writing on, per connection. Illustrative example. Owners and
                members connect; your clients never need an account.
              </span>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
