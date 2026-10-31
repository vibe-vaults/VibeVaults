"use client";

import { ArrowRight, Calendar } from "lucide-react";
import { SETUP_CALL_URL } from "@/lib/contact-links";
import { track } from "./demo-tour";

/**
 * Main Responsibility: The end of the /demo run: what the visitor just saw,
 * in agency terms, and the two ways forward (trial, setup call). Shown in
 * the agency guide card, and in the client strip on narrow screens, where
 * the client view is the last thing on screen when the run ends.
 */
export function DemoFinale() {
  return (
    <div className="mt-4 rounded-2xl bg-gradient-to-br from-primary/10 via-white to-secondary/10 p-4 ring-1 ring-primary/15">
      <p className="text-sm text-gray-700 leading-relaxed">
        That&apos;s the whole loop. No email chains, no screenshots pasted into Slack, no guessing which page they meant. Fewer review rounds, and client sites that ship faster.
      </p>
      <a
        href="/auth/register"
        onClick={() => track("demo_cta_clicked", { cta: "trial" })}
        className="mt-4 flex items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-bold text-white hover:bg-secondary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
      >
        Start free trial <ArrowRight className="h-4 w-4" aria-hidden />
      </a>
      <a
        href={SETUP_CALL_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("demo_cta_clicked", { cta: "setup_call" })}
        className="mt-2 flex items-center justify-center gap-2 rounded-full border-2 border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:border-primary hover:text-primary transition-all duration-300"
      >
        <Calendar className="h-4 w-4" aria-hidden /> Book a 15-min setup call
      </a>
      <p className="mt-3 text-center text-xs text-gray-400">14-day free trial &middot; No credit card required</p>
    </div>
  );
}
