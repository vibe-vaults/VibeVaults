"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, BookOpen, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";

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
  "Claude Desktop",
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
    <div className="absolute -inset-1 bg-linear-to-r from-violet-500 to-primary rounded-2xl opacity-30 group-hover:opacity-40 transition duration-500 blur-lg" />
    <div className="relative bg-[#1e1e1e] rounded-xl overflow-hidden border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-white/10">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
        <div className="text-[10px] text-gray-500 font-mono tracking-wider">claude code</div>
      </div>
      <div className="p-5 font-mono text-[11px] md:text-[13px] leading-relaxed space-y-3 text-left">
        <Line className="text-gray-100">
          <span className="text-violet-300 select-none">&gt; </span>
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
          <span className="text-violet-300 select-none">● </span>
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
    <section id="ai-agents" className="w-full py-24 md:py-32 bg-gray-950 text-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-violet-300 mb-6">
              <Bot className="w-3.5 h-3.5" />
              AI agents (MCP)
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-5">
              Your clients pin it.{" "}
              <span className="text-violet-300">Your agent fixes it.</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-400 leading-relaxed mb-10">
              Stop copying feedback out of a dashboard into your editor. Connect your AI tool once and it
              reads every report with the context a developer needs, so a round of client changes becomes
              minutes of review instead of an afternoon of triage.
            </p>

            <ol className="space-y-6 mb-10">
              {steps.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 text-violet-300">
                    <step.icon className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      <span className="text-gray-500 mr-2">{i + 1}.</span>
                      {step.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed mt-1">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold transition-all duration-300 bg-secondary text-white hover:bg-secondary/90 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0"
              >
                Start free trial
              </Link>
              <Link
                href="/docs/ai-agents"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold transition-all duration-300 border-2 border-white/20 text-white hover:border-violet-300 hover:text-violet-300"
              >
                <BookOpen className="w-4 h-4" />
                Read the setup guide
              </Link>
            </div>

            <ul className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <li
                  key={chip}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-300"
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
            <p className="mt-5 flex items-start gap-2 text-sm text-gray-500">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-violet-300" />
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
