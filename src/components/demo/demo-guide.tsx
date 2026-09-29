"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Calendar, Check, ChevronDown, RotateCcw, Sparkles } from "lucide-react";
import { SETUP_CALL_URL } from "@/lib/contact-links";

/**
 * Main Responsibility: Boots the sandboxed widget on /demo and walks the
 * visitor through the loop in two steps: pin something, then watch the agency
 * respond (the progress bar fills while the scripted agency "works"), then
 * offers the trial. Progress is driven by the `vv:demo` events that
 * `public/widget-demo-backend.js` dispatches, including a `progress` event on
 * boot so a refreshed tab resumes where it was.
 *
 * Sensitive Dependencies:
 * - Script ORDER is the sandbox guarantee: the backend must install
 *   `window.__vvDemoBackend` before widget.js runs, because the widget reads
 *   the hook once at init. Loading widget.js first would send the demo's
 *   requests to the real API with a key that matches no project.
 * - Bar timing comes from the events' `nextInMs` (the backend's own script
 *   delays), so the bar and the agency's replies cannot drift apart.
 * - Docks beside the widget: `useWidgetLeftEdge` measures the widget's
 *   `.launcher` and `.popup` inside its (open) shadow root and floats the card
 *   just left of whichever is further left, so the guide and the widget sit
 *   together. Renaming those classes in widget.js only degrades this to the
 *   CSS fallback offset (beside the collapsed launcher), never breaks it.
 * - Cleanup removes the widget host and the hook, so a soft navigation away
 *   (browser back) does not leave a sandbox widget floating over the site.
 * - PostHog is imported lazily and captures only after cookie consent: its
 *   singleton starts opted out (see `PostHogProvider`), so these calls are
 *   no-ops for visitors who declined analytics.
 */

const DEMO_KEY = "demo-sandbox";
const BACKEND_STATE_KEY = "vv_demo_state_v1";

type Stage = 0 | 1 | 2 | 3; // nothing yet, pinned, agency replied, fixed
type DemoEvent = { type: string; stage?: number; nextInMs?: number };

const STEPS = [
  {
    title: "Open Feedback and hit Pin",
    hint: "The Feedback button sits in the bottom-right corner.",
  },
  {
    title: "Pin anything, then watch the agency respond",
    hint: "Click any spot (the typo in the headline, say) and describe it. The agency replies in that thread.",
  },
];

// What the agency is doing while the bar fills, one line per stage. They
// build up as a log, each typed out (typewriter effect) and followed by
// blinking dots (a typing indicator) while the next move is pending.
const STATUS_LINES = [
  "Sent! Pixel & Pine (your agency) is looking at your pin.",
  "Dani replied and is fixing it. Switch on the Feedback toggle in the widget to follow your pin's status and read the thread.",
  "Fixed and moved to \"in review\". The reply is waiting in your pin's thread.",
];
const TYPE_MS = 30; // per character: a steady, readable typing speed
const HOLD_MS = 3000; // how long the last line stays before the finale

function TypingDots({ still }: { still: boolean }) {
  return (
    <span aria-hidden className="ml-1 inline-flex items-center gap-0.5 align-middle">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1 w-1 rounded-full bg-primary"
          initial={{ opacity: 0.6 }}
          animate={still ? { opacity: 0.6 } : { opacity: [0.15, 1, 0.15] }}
          transition={still ? undefined : { duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

// Bar milestones. The in-between stretches animate over the backend's real
// delay, so the bar is still moving when the reply lands, never ahead of it.
const BAR = { pinned: 40, replied: 72, almost: 96, done: 100 };

const EVENT_STAGE: Record<string, Stage> = { feedback_submitted: 1, agency_replied: 2, loop_complete: 3 };
const EVENT_ANALYTICS: Record<string, string> = {
  feedback_submitted: "demo_pin_submitted",
  agency_replied: "demo_agency_replied",
  loop_complete: "demo_loop_complete",
  reply_sent: "demo_reply_sent",
};

/**
 * True only when this document was loaded by reloading /demo itself. Every
 * other arrival (a link from the landing page, a typed URL, back/forward)
 * starts the demo from scratch, so a returning visitor never lands on a
 * half-played or finished run.
 */
function isReloadOfDemo(): boolean {
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return nav?.type === "reload" && new URL(nav.name).pathname.replace(/\/+$/, "") === "/demo";
  } catch {
    return false;
  }
}

function startOver() {
  try { sessionStorage.removeItem(BACKEND_STATE_KEY); } catch { /* reload still resets what it can */ }
  track("demo_restarted");
  window.location.reload();
}

function track(event: string, props?: Record<string, unknown>) {
  import("posthog-js")
    .then(({ default: posthog }) => posthog.capture(event, props))
    .catch(() => { /* analytics must never break the demo */ });
}

const DOCK_GAP = 16;

/**
 * Distance (px) from the viewport's right edge to just left of the widget's
 * visible chrome, tracked as its panel opens, closes and resizes. `null` until
 * the widget has rendered, so the caller keeps its CSS fallback until then.
 */
function useWidgetLeftEdge() {
  const [right, setRight] = useState<number | null>(null);

  useEffect(() => {
    let root: ShadowRoot | null = null;
    let raf = 0;
    const observers: MutationObserver[] = [];

    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!root) return;
        let left = Infinity;
        for (const sel of [".launcher", ".popup"]) {
          const r = root.querySelector(sel)?.getBoundingClientRect();
          if (r && r.width > 0) left = Math.min(left, r.left);
        }
        // Nothing visible (widget hidden, or chrome tucked away while a pin
        // is being placed): keep the last position rather than jumping.
        if (left !== Infinity) setRight(Math.round(window.innerWidth - left + DOCK_GAP));
      });
    };

    const attach = () => {
      const host = document.getElementById("vibe-vaults-widget-host");
      if (!host?.shadowRoot) return false;
      root = host.shadowRoot;
      const mo = new MutationObserver(measure);
      mo.observe(root, { subtree: true, attributes: true, attributeFilter: ["class"] });
      mo.observe(host, { attributes: true, attributeFilter: ["style"] });
      observers.push(mo);
      measure();
      return true;
    };

    // widget.js is injected after mount, so wait for its host to appear.
    if (!attach()) {
      const bodyObserver = new MutationObserver(() => { if (attach()) bodyObserver.disconnect(); });
      bodyObserver.observe(document.body, { childList: true });
      observers.push(bodyObserver);
    }
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      observers.forEach((o) => o.disconnect());
      window.removeEventListener("resize", measure);
    };
  }, []);

  return right;
}

export function DemoGuide() {
  const [stage, setStage] = useState<Stage>(0);
  const [minimized, setMinimized] = useState(false);
  const [bar, setBar] = useState({ pct: 0, ms: 0 });
  // Typewriter progress: lines fully typed, plus characters of the next one.
  const [typed, setTyped] = useState({ lines: 0, chars: 0 });
  // The finale (step 2 ticked, CTA shown) waits until the last status line
  // has been typed and read, not merely until the backend says it is done.
  const [finished, setFinished] = useState(false);
  const barTimer = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const dockRight = useWidgetLeftEdge();

  // Mount the sandbox: backend first, widget second.
  useEffect(() => {
    let cancelled = false;
    if (!isReloadOfDemo()) {
      try { sessionStorage.removeItem(BACKEND_STATE_KEY); } catch { /* the seed is the default anyway */ }
    }
    // Restored from the back/forward cache: the page comes back exactly as it
    // was left, finished run included, so start over like any other return.
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) startOver(); };
    window.addEventListener("pageshow", onPageShow);
    const backend = document.createElement("script");
    backend.src = "/widget-demo-backend.js";
    let widget: HTMLScriptElement | null = null;
    backend.onload = () => {
      if (cancelled) return;
      widget = document.createElement("script");
      widget.src = "/widget.js";
      widget.setAttribute("data-key", DEMO_KEY);
      document.body.appendChild(widget);
    };
    document.body.appendChild(backend);
    track("demo_opened");

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onPageShow);
      (window as Window & { __vvDemoBackend?: { dispose?: () => void } }).__vvDemoBackend?.dispose?.();
      backend.remove();
      widget?.remove();
      document.getElementById("vibe-vaults-widget-host")?.remove();
      delete (window as Window & { __vvDemoBackend?: unknown }).__vvDemoBackend;
    };
  }, []);

  useEffect(() => {
    // Snap to a milestone, then creep towards the next one over `ms`.
    const animateBar = (from: number, to: number, ms: number) => {
      if (barTimer.current) window.clearTimeout(barTimer.current);
      setBar({ pct: from, ms: 400 });
      if (to > from && ms > 0) {
        barTimer.current = window.setTimeout(() => setBar({ pct: to, ms: Math.max(ms - 400, 300) }), 400);
      }
    };

    const onDemo = (e: Event) => {
      const detail = (e as CustomEvent<DemoEvent>).detail;
      if (!detail?.type) return;
      if (EVENT_ANALYTICS[detail.type]) track(EVENT_ANALYTICS[detail.type]);
      // `progress` is the backend replaying where a refreshed tab left off.
      const next = detail.type === "progress" ? (detail.stage as Stage | undefined) : EVENT_STAGE[detail.type];
      if (!next) return;
      const ms = detail.nextInMs ?? 0;
      if (next === 1) animateBar(BAR.pinned, BAR.replied, ms);
      if (next === 2) animateBar(BAR.replied, BAR.almost, ms);
      if (next === 3) animateBar(BAR.done, BAR.done, 0);
      setStage((prev) => Math.max(prev, next) as Stage);
      if (detail.type === "progress") {
        // A refreshed tab has already seen these lines: show them at once.
        setTyped({ lines: next, chars: 0 });
        if (next === 3) setFinished(true);
      }
      // Pinning and the finale are the moments worth seeing, so reopen then.
      if (detail.type === "feedback_submitted" || detail.type === "loop_complete") setMinimized(false);
    };
    window.addEventListener("vv:demo", onDemo);
    return () => {
      window.removeEventListener("vv:demo", onDemo);
      if (barTimer.current) window.clearTimeout(barTimer.current);
    };
  }, []);

  // Reduced motion skips the typing; everything below derives from this.
  const shownLines = reduceMotion ? stage : typed.lines;

  // Type the next character (or move to the next line) on a timer.
  useEffect(() => {
    if (reduceMotion || typed.lines >= stage) return;
    const lineLength = STATUS_LINES[typed.lines].length;
    const t = window.setTimeout(() => {
      setTyped((p) => (p.chars < lineLength ? { lines: p.lines, chars: p.chars + 1 } : { lines: p.lines + 1, chars: 0 }));
    }, typed.chars < lineLength ? TYPE_MS : 0);
    return () => window.clearTimeout(t);
  }, [stage, typed, reduceMotion]);

  // Hold the final line on screen before revealing the finale.
  useEffect(() => {
    if (stage !== 3 || shownLines < STATUS_LINES.length || finished) return;
    const t = window.setTimeout(() => setFinished(true), HOLD_MS);
    return () => window.clearTimeout(t);
  }, [stage, shownLines, finished]);


  const complete = finished;
  const done = stage === 0 ? 0 : complete ? 2 : 1;
  // Draws the eye until the first pin; after that the bar does the talking.
  const beckon = stage === 0 && !reduceMotion;

  const stepRow = (i: number) => {
    const step = STEPS[i];
    const isDone = i < done;
    const isCurrent = i === done;
    // The status log stays under step 2 after the finale too, so the story
    // (sent, fixing, fixed) reads straight into the CTA below it.
    const working = i === 1 && stage > 0;
    return (
      <li key={step.title} className="flex gap-3" data-done={isDone}>
        <span className="relative mt-0.5 h-6 w-6 shrink-0">
          {isCurrent && !reduceMotion && (
            <span aria-hidden className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
          )}
          <span
            className={`relative grid h-6 w-6 place-items-center rounded-full text-xs font-bold transition-colors ${
              isDone ? "bg-emerald-500 text-white" : isCurrent ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
            }`}
          >
            {isDone ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
          </span>
        </span>
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${isDone ? "text-gray-400 line-through decoration-gray-300" : isCurrent ? "text-gray-900" : "text-gray-500"}`}>
            {step.title}
          </p>
          {/* Upcoming steps show their hint too: step 2's "click the typo" is
              the instruction someone needs before they have pinned. */}
          {!isDone && !working && (
            <p className={`mt-0.5 text-xs leading-relaxed ${isCurrent ? "text-gray-500" : "text-gray-400"}`}>{step.hint}</p>
          )}
          {working && (
            <div className="mt-1 space-y-1.5">
              {/* Screen readers get each status once, whole, not per keystroke. */}
              <p className="sr-only" aria-live="polite">{STATUS_LINES[Math.min(shownLines, stage) - 1] ?? ""}</p>
              {STATUS_LINES.slice(0, stage).map((text, li) => {
                if (li > shownLines) return null;
                const typing = li === shownLines;
                const latest = li === stage - 1;
                return (
                  <p
                    key={li}
                    aria-hidden
                    className={`text-xs leading-relaxed ${latest ? "font-medium text-primary" : "text-gray-500"}`}
                  >
                    {typing ? text.slice(0, typed.chars) : text}
                    {typing && <span className="ml-px inline-block h-3 w-px translate-y-0.5 bg-primary animate-pulse" />}
                    {latest && !typing && !complete && <TypingDots still={!!reduceMotion} />}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </li>
    );
  };

  return (
    <motion.aside
      aria-label="Demo guide"
      initial={reduceMotion ? false : { opacity: 0, y: 48, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
      // Docked beside the widget from lg up. Below that there is no room next
      // to a 380px panel, so the card sits inline at the top of the page.
      className="relative z-30 mx-4 mt-4 lg:mx-0 lg:mt-0 lg:fixed lg:bottom-5 lg:right-[var(--vv-dock-right)] lg:w-[340px] lg:transition-[right] lg:duration-300 lg:ease-out text-gray-900"
      style={{ "--vv-dock-right": `${dockRight ?? 116}px` } as React.CSSProperties}
    >
      {/* Soft pulsing halo behind the card until the visitor has pinned. */}
      {beckon && (
        <motion.span
          aria-hidden
          className="absolute -inset-1.5 rounded-[1.9rem] bg-gradient-to-r from-primary via-secondary to-primary blur-md"
          animate={{ opacity: [0.25, 0.75, 0.25] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Periodic nudge on top of the halo: movement is what the eye catches. */}
      <motion.div
        className="relative rounded-3xl bg-white/95 backdrop-blur-md shadow-2xl shadow-gray-900/10 ring-1 ring-gray-200"
        animate={beckon ? { y: [0, -10, 0, -5, 0] } : { y: 0 }}
        transition={beckon ? { duration: 0.9, repeat: Infinity, repeatDelay: 2.4, delay: 1.6, ease: "easeOut" } : { duration: 0.2 }}
      >
        <button
          type="button"
          onClick={() => setMinimized((m) => !m)}
          className="w-full flex items-center justify-between gap-3 px-5 pt-4 pb-3 text-left cursor-pointer"
          aria-expanded={!minimized}
          aria-label={minimized ? "Expand the demo guide" : "Minimize the demo guide"}
        >
          <span className="inline-flex items-center gap-2 text-sm font-bold">
            <motion.span
              className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary"
              animate={beckon ? { rotate: [0, -14, 14, -8, 0], scale: [1, 1.15, 1] } : { rotate: 0, scale: 1 }}
              transition={beckon ? { duration: 1.1, repeat: Infinity, repeatDelay: 1.6 } : { duration: 0.2 }}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
            </motion.span>
            {complete ? "That's the whole loop" : "Try it in 30 seconds"}
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400">
            {done}/{STEPS.length}
            <ChevronDown className={`h-4 w-4 transition-transform ${minimized ? "rotate-180" : ""}`} aria-hidden />
          </span>
        </button>

        <div
          className="mx-5 h-1.5 rounded-full bg-gray-100 overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={bar.pct}
        >
          <div
            className="relative h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-[width] ease-in-out"
            style={{ width: `${bar.pct}%`, transitionDuration: `${bar.ms}ms` }}
          >
          </div>
        </div>

        {(!minimized || stage > 0) && (
          <div className={minimized ? "px-5 pt-3 pb-4" : "px-5 pt-4 pb-5"}>
            {!minimized && (
              <ol className="space-y-3">
                {STEPS.map((_, i) => stepRow(i))}
              </ol>
            )}

            <AnimatePresence>
              {complete && !minimized && (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-5 rounded-2xl bg-gradient-to-br from-primary/10 via-white to-secondary/10 p-4 ring-1 ring-primary/15"
                >
                  <p className="text-sm text-gray-700 leading-relaxed">
                    No email chains, no screenshots pasted into Slack. Put it on a client site in two minutes, and your clients never need an account.
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Visible even when minimized: running the loop a second time is
                exactly when someone reaches for it. Hidden only before there
                is anything to reset. */}
            {stage > 0 && (
              <button
                type="button"
                onClick={startOver}
                className={`${minimized ? "" : "mt-4"} inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors cursor-pointer`}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Start over
              </button>
            )}
          </div>
        )}
        {minimized && stage === 0 && <div className="pb-4" />}
      </motion.div>
    </motion.aside>
  );
}
