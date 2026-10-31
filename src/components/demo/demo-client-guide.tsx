"use client";

import { memo, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Permanent_Marker } from "next/font/google";
import { DemoGuideCard } from "./demo-guide-card";
import { DOCK_MIN_FRAME, stepSide, useDemoStage, type DemoBackend, type DemoWindow } from "./demo-tour";

const handLettering = Permanent_Marker({ weight: "400", subsets: ["latin"] });

/**
 * Main Responsibility: The client half of /demo, running INSIDE the bakery
 * iframe. Borrows the sandbox backend from the top window, boots the real
 * widget.js against it, and shows the client guide card (Maria's steps)
 * beside the widget, plus the "Start here!" arrow until the first pin.
 *
 * Sensitive Dependencies:
 * - Framed only. Loaded as a top-level page (someone opened /demo/site
 *   directly) it forwards to /demo, because the backend, the agency pane and
 *   the run all live in the top window.
 * - Script ORDER is the sandbox guarantee: `window.__vvDemoBackend` must be
 *   set (here, borrowed from the parent) before widget.js runs, because the
 *   widget reads the hook once at init. Loading widget.js without it would
 *   send the demo's requests to the real API with a key that matches no
 *   project.
 * - Docks beside the widget: `useWidgetLeftEdge` measures the widget's
 *   `.launcher` and `.popup` inside its (open) shadow root and floats the card
 *   just left of whichever is further left. Renaming those classes in
 *   widget.js only degrades this to the fallback offset, never breaks it.
 *   Below `DOCK_MIN_FRAME` there is no room beside the open panel (which on a
 *   phone covers nearly the whole frame, and sits above anything in it), so
 *   the card is not drawn here at all: `DemoSplit` shows it in a strip above
 *   the frame. While it is the agency's turn it is not shown anywhere.
 * - Mounted by `src/app/demo/site/layout.tsx`, so it (and the widget)
 *   survives the client-side moves between the bakery's pages. Hands the
 *   frame's Next router to the backend as `navigate`, which widget.js uses to
 *   open a thread whose pin is on another bakery page.
 */

const DOCK_GAP = 16;

/** Where the widget's launcher sits, for the "start here" arrow. */
type LauncherSpot = { centerX: number; bottom: number; panelOpen: boolean };

/**
 * Distance (px) from the viewport's right edge to just left of the widget's
 * visible chrome, tracked as its panel opens, closes and resizes. `null` until
 * the widget has rendered, so the caller keeps its CSS fallback until then.
 * Also reports the launcher's position and whether the panel is open, which
 * drives the arrow that points first-time visitors at the widget.
 */
function useWidgetLeftEdge() {
  const [right, setRight] = useState<number | null>(null);
  const [launcher, setLauncher] = useState<LauncherSpot | null>(null);

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
        const l = root.querySelector(".launcher")?.getBoundingClientRect();
        const next: LauncherSpot | null =
          l && l.width > 0
            ? {
                centerX: Math.round(l.left + l.width / 2),
                bottom: Math.round(window.innerHeight - l.top),
                panelOpen: !!root.querySelector(".popup.open"),
              }
            : null;
        // The widget repaints its pins constantly, and every class change lands
        // here. Handing React a fresh but identical object would re-render the
        // arrow each time and restart its bounce, which shows up as a jitter.
        setLauncher((prev) =>
          prev && next && prev.centerX === next.centerX && prev.bottom === next.bottom && prev.panelOpen === next.panelOpen
            ? prev
            : next
        );
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

  return { right, launcher };
}

/**
 * Big red cartoon-style "Start here!" arrow, arcing from the middle of the
 * screen down to the widget's launcher. Visitors kept missing the widget in
 * the bottom-right corner and browsed the bakery instead, so until they open
 * it (or pin something) the arrow points straight at it. Drawn in viewport
 * pixels from the measured launcher position, so it follows resizes; fully
 * click-through, so it never blocks the page. The label uses a hand-lettered
 * font (self-hosted by next/font at build time, no runtime request to Google).
 */
const LauncherArrow = memo(function LauncherArrow({ spot, reduceMotion }: { spot: LauncherSpot; reduceMotion: boolean | null }) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const start = { x: w / 2, y: h / 2 };
  // Tip lands just above the launcher.
  const tip = { x: spot.centerX, y: h - spot.bottom - 16 };
  const dx = tip.x - start.x;
  const dy = tip.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // Bulge the curve to the "upper" side of the straight line, like a hand-drawn arc.
  const px = uy;
  const py = -ux;
  const bulge = len * 0.28;
  const ctrl = { x: (start.x + tip.x) / 2 + px * bulge, y: (start.y + tip.y) / 2 + py * bulge };
  const curve = `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${tip.x} ${tip.y}`;

  // Open chevron head along the curve's final direction, same stroke width.
  const ex = tip.x - ctrl.x;
  const ey = tip.y - ctrl.y;
  const el = Math.hypot(ex, ey) || 1;
  const tx = ex / el;
  const ty = ey / el;
  const headLen = 38;
  const spread = Math.PI / 6;
  const wing = (sign: number) => {
    const c = Math.cos(sign * spread);
    const sn = Math.sin(sign * spread);
    const bx = -(tx * c - ty * sn);
    const by = -(tx * sn + ty * c);
    return `${tip.x + bx * headLen} ${tip.y + by * headLen}`;
  };
  const head = `M ${wing(1)} L ${tip.x} ${tip.y} L ${wing(-1)}`;

  // Label at the curve's midpoint, lifted above the arc and tilted along it.
  const mid = {
    x: 0.25 * start.x + 0.5 * ctrl.x + 0.25 * tip.x,
    y: 0.25 * start.y + 0.5 * ctrl.y + 0.25 * tip.y,
  };
  const label = { x: mid.x + px * 44, y: mid.y + py * 44 };
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const nudge = 12;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute inset-0"
        animate={reduceMotion ? undefined : { x: [0, tx * nudge, 0], y: [0, ty * nudge, 0] }}
        transition={reduceMotion ? undefined : { duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width={w} height={h} className="absolute inset-0 drop-shadow-lg">
          <g className="stroke-red-600" fill="none" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round">
            <path d={curve} />
            <path d={head} />
          </g>
        </svg>
        <span
          className={`${handLettering.className} absolute whitespace-nowrap text-4xl md:text-5xl text-red-600 drop-shadow-md`}
          style={{ left: label.x, top: label.y, transform: `translate(-50%, -50%) rotate(${angle}deg)` }}
        >
          Start here!
        </span>
      </motion.div>
    </motion.div>
  );
});

const MAX_CARD = 340;

export function DemoClientGuide() {
  const [backend, setBackend] = useState<DemoBackend | null>(null);
  const stage = useDemoStage(backend);
  const reduceMotion = useReducedMotion();
  const { right: dockRight, launcher } = useWidgetLeftEdge();
  const [frameWidth, setFrameWidth] = useState(0);
  const router = useRouter();
  // Read through a ref so the mount effect below never re-runs (and tears the
  // widget down) just because the router object changed identity.
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);

  useEffect(() => {
    const onResize = () => setFrameWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Borrow the top window's backend, then boot the widget against it.
  useEffect(() => {
    let parentBackend: DemoBackend | undefined;
    try { parentBackend = window.parent !== window ? (window.parent as DemoWindow).__vvDemoBackend : undefined; } catch { /* cross-origin parent */ }
    if (!parentBackend) {
      window.location.replace("/demo");
      return;
    }
    const own = window as DemoWindow;
    own.__vvDemoBackend = parentBackend;
    // Only ever within the bakery: a stale pin must not route the frame out.
    parentBackend.navigate = (path) => { if (path === "/demo/site" || path.startsWith("/demo/site/")) routerRef.current.push(path); };
    const widget = document.createElement("script");
    widget.src = "/widget.js";
    widget.setAttribute("data-key", parentBackend.token);
    // The guide appears with the widget it docks beside.
    widget.onload = () => setBackend(parentBackend ?? null);
    document.body.appendChild(widget);
    return () => {
      widget.remove();
      document.getElementById("vibe-vaults-widget-host")?.remove();
      if (parentBackend) parentBackend.navigate = null;
      delete own.__vvDemoBackend;
    };
  }, []);

  if (!backend) return null;

  const right = dockRight ?? 96;
  const room = frameWidth - right - 16;
  // Gone while the agency works: the visitor's attention belongs on the
  // other pane. Also gone in a narrow frame, where the open widget panel
  // would cover it: the top window shows it above the frame instead.
  const hidden = stepSide(stage) === "agency" || frameWidth < DOCK_MIN_FRAME;
  const showArrow = stage === 0 && launcher !== null && !launcher.panelOpen;
  // Start over is a reload of the whole demo, which lives in the top window.
  const startOver = () => {
    try { (window.parent as Window & { __vvDemoStartOver?: () => void }).__vvDemoStartOver?.(); } catch { /* parent gone */ }
  };

  return (
    <>
      <AnimatePresence>
        {showArrow && launcher && <LauncherArrow key="launcher-arrow" spot={launcher} reduceMotion={reduceMotion} />}
      </AnimatePresence>
      {!hidden && <DemoGuideCard
        side="client"
        stage={stage}
        onStartOver={startOver}
        finale={
          <p className="mt-4 rounded-2xl bg-emerald-50 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-emerald-800 ring-1 ring-emerald-100">
            That&apos;s the loop from Maria&apos;s side: she pinned it on her own site, and the answer came back in the same thread.
          </p>
        }
        className="fixed z-30 bottom-[calc(var(--cookie-banner-height,0px)+1.25rem)] transition-[right] duration-300 ease-out"
        style={{ right, width: Math.min(MAX_CARD, room) }}
      />}
    </>
  );
}
