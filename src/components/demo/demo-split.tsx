"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Toaster } from "@/components/ui/sonner";
import { DemoAgencyPane } from "./demo-agency-pane";
import { DemoGuideCard } from "./demo-guide-card";
import { DemoFinale } from "./demo-finale";
import { DOCK_MIN_FRAME, STORE_KEY, stepSide, track, useDemoStage, type DemoBackend, type DemoWindow, type Side } from "./demo-tour";

/**
 * Main Responsibility: The /demo page body. Boots the in-browser sandbox
 * backend in the top window, then shows the two sides of the product at once:
 * the client's website (the bakery, in an iframe, with the real widget) on
 * the left and the agency's dashboard on the right, split down the middle.
 * On phones there is no room for both, so the halves become two tabs.
 *
 * Sensitive Dependencies:
 * - Load order is the sandbox guarantee: the backend script must have
 *   installed `window.__vvDemoBackend` BEFORE the iframe exists, because the
 *   frame borrows it and widget.js reads it once at init. The iframe is only
 *   rendered once `backend` is set.
 * - Fresh run vs resume: only a reload of /demo keeps the sessionStorage
 *   state (`STORE_KEY`); every other arrival, including a bfcache restore,
 *   starts over, so a returning visitor never lands on a finished run.
 * - Fills the viewport minus `--cookie-banner-height` (set by
 *   `CookieConsent` while the banner is up), so the banner never covers the
 *   widget's launcher at the bottom of the left pane.
 * - The `Toaster` sits bottom-right, which on desktop is the agency pane:
 *   that is where the dashboard's "New Feedback" notification belongs.
 * - Exits are plain <a> (full page loads) so the sandbox never outlives the
 *   demo inside the SPA. Cleanup disposes the backend for soft navigations.
 * - PostHog is imported lazily and captures only after cookie consent.
 */

/**
 * True only when this document was loaded by reloading /demo. Every other
 * arrival (a link from the landing page, a typed URL, back/forward) starts
 * the demo from scratch.
 */
function isReloadOfDemo(): boolean {
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type !== "reload") return false;
    return new URL(nav.name).pathname.replace(/\/+$/, "") === "/demo";
  } catch {
    return false;
  }
}

function startOver() {
  try { sessionStorage.removeItem(STORE_KEY); } catch { /* reload still resets what it can */ }
  track("demo_restarted");
  window.location.reload();
}

const EVENT_ANALYTICS: Record<string, string> = {
  feedback_submitted: "demo_pin_submitted",
  agency_opened: "demo_agency_opened",
  agency_replied: "demo_agency_replied",
  loop_complete: "demo_loop_complete",
  reply_sent: "demo_reply_sent",
  status_changed: "demo_status_changed",
};

const TABS: { side: Side; label: string }[] = [
  { side: "client", label: "Client's website" },
  { side: "agency", label: "Agency dashboard" },
];

function PaneLabel({ side }: { side: Side }) {
  return side === "client" ? (
    // A browser address bar, so the left pane reads as "someone's website".
    <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-100 px-4 py-2">
      <span aria-hidden className="flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
      </span>
      <span className="flex-1 truncate rounded-full bg-white px-3 py-1 text-xs text-gray-500 ring-1 ring-gray-200">crumbandco.com</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Your client&apos;s site</span>
    </div>
  ) : (
    <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-2">
      <span className="text-xs font-semibold text-gray-700 truncate">Pixel &amp; Pine &middot; VibeVaults dashboard</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Your agency</span>
    </div>
  );
}

const DESKTOP = "(min-width: 1024px)"; // Tailwind `lg`, where both halves show

function useIsDesktop() {
  return useSyncExternalStore(
    (fn) => { const mq = window.matchMedia(DESKTOP); mq.addEventListener("change", fn); return () => mq.removeEventListener("change", fn); },
    () => window.matchMedia(DESKTOP).matches,
    () => true,
  );
}

/** Live width of an element, for the client half's strip decision. */
function useWidth(ref: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

export function DemoSplit() {
  const [backend, setBackend] = useState<DemoBackend | null>(null);
  const [tab, setTab] = useState<Side>("client");
  const stage = useDemoStage(backend);
  const turn = stepSide(stage);
  const isDesktop = useIsDesktop();
  const clientRef = useRef<HTMLElement>(null);
  const clientWidth = useWidth(clientRef);
  // The client card lives in the bakery frame beside the widget, unless the
  // frame is too narrow for that: then it goes here, above the frame, where
  // the open widget panel cannot cover it.
  const clientStrip = !!backend && clientWidth > 0 && clientWidth < DOCK_MIN_FRAME && turn !== "agency";

  // Phones show one half at a time: follow the run to whichever side has the
  // next move (pin placed -> agency, agency replied -> client). A short beat
  // first, so the widget's "Feedback pinned" confirmation is seen before the
  // view changes. Desktop shows both halves and ignores `tab`.
  useEffect(() => {
    if (!turn) return;
    const t = window.setTimeout(() => setTab(turn), 900);
    return () => window.clearTimeout(t);
  }, [turn]);

  useEffect(() => {
    let cancelled = false;
    if (!isReloadOfDemo()) {
      try { sessionStorage.removeItem(STORE_KEY); } catch { /* the seed is the default anyway */ }
    }
    // Restored from the back/forward cache: the page comes back exactly as it
    // was left, finished run included, so start over like any other return.
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) startOver(); };
    window.addEventListener("pageshow", onPageShow);
    const onDemo = (e: Event) => {
      const type = (e as CustomEvent<{ type?: string }>).detail?.type;
      if (type && EVENT_ANALYTICS[type]) track(EVENT_ANALYTICS[type]);
    };
    window.addEventListener("vv:demo", onDemo);
    const own = window as DemoWindow & { __vvDemoStartOver?: () => void };
    // The client guide lives in the iframe; its Start over reloads this window.
    own.__vvDemoStartOver = startOver;

    const script = document.createElement("script");
    script.src = "/widget-demo-backend.js";
    script.onload = () => { if (!cancelled && own.__vvDemoBackend) setBackend(own.__vvDemoBackend); };
    document.body.appendChild(script);
    track("demo_opened");

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("vv:demo", onDemo);
      own.__vvDemoBackend?.dispose();
      script.remove();
      delete own.__vvDemoBackend;
      delete own.__vvDemoStartOver;
    };
  }, []);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Phones: one half at a time. The tab whose turn it is pulses. */}
      <div role="tablist" aria-label="Demo views" className="lg:hidden grid grid-cols-2 gap-1 border-b border-gray-200 bg-white p-1.5">
        {TABS.map(({ side, label }) => (
          <button
            key={side}
            type="button"
            role="tab"
            aria-selected={tab === side}
            onClick={() => setTab(side)}
            className={`relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
              tab === side ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {label}
            {turn === side && tab !== side && (
              <span aria-label="Your turn here" className="absolute top-1.5 right-2 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 grid lg:grid-cols-2 lg:divide-x-2 lg:divide-gray-950">
        {/* Hidden halves stay mounted, so the widget and the run survive a tab switch. */}
        <section ref={clientRef} aria-label="Client's website" className={`${tab === "client" ? "flex" : "hidden"} lg:flex min-h-0 flex-col`}>
          <div className="hidden lg:block"><PaneLabel side="client" /></div>
          {clientStrip && (
            <div className="shrink-0 border-b border-gray-200 bg-gray-50 p-2">
              <DemoGuideCard side="client" stage={stage} compact onStartOver={startOver} finale={<DemoFinale />} />
            </div>
          )}
          {backend ? (
            <iframe
              src="/demo/site"
              title="Crumb & Co., a pretend client website with the VibeVaults widget"
              className="flex-1 min-h-0 w-full border-0 bg-[#fffaf3]"
            />
          ) : (
            <div className="flex-1 bg-[#fffaf3]" />
          )}
        </section>
        <section aria-label="Agency dashboard" className={`${tab === "agency" ? "flex" : "hidden"} lg:flex min-h-0 flex-col`}>
          <div className="hidden lg:block"><PaneLabel side="agency" /></div>
          <div className="flex-1 min-h-0">
            {backend && <DemoAgencyPane backend={backend} visible={isDesktop || tab === "agency"} onStartOver={startOver} onReveal={() => setTab("agency")} />}
          </div>
        </section>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
