"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { DetailAttachment, DetailReply } from "@/lib/feedback-detail-backend";
import type { FeedbackData } from "@/lib/feedback-utils";

/**
 * Main Responsibility: The /demo run as data. Types for the sandbox backend
 * (`public/widget-demo-backend.js`), the four steps the visitor walks across
 * the two panes, and the hooks both guide cards read their state from. One
 * source of truth: the backend's `stage()`, so the client card in the iframe
 * and the agency card in the top window can never disagree about whose turn
 * it is.
 *
 * Sensitive Dependencies:
 * - `DemoBackend` mirrors what the backend script installs on the TOP window.
 *   The iframe reaches it as `window.parent.__vvDemoBackend`.
 * - `STORE_KEY` must match the script's, it is how a fresh run is started.
 */

export const STORE_KEY = "vv_demo_state_v2";

export type DemoListItem = {
  id: string;
  content: string;
  sender: string;
  status: string;
  created_at: string;
  reply_count: number;
  attachment_count: number;
};

export type DemoBackend = {
  token: string;
  stage: () => Stage;
  tourFeedbackId: () => string | null;
  subscribe: (fn: () => void) => () => void;
  dispose: () => void;
  navigate: ((path: string) => void) | null;
  agency: {
    name: string;
    list: () => DemoListItem[];
    get: (id: string) => FeedbackData | null;
    replies: (id: string) => DetailReply[];
    attachments: (id: string) => DetailAttachment[];
    open: (id: string) => void;
    reply: (id: string, content: string, files: File[]) => Promise<{ error?: string }>;
    setStatus: (id: string, status: string) => { error?: string };
    remove: (id: string) => { error?: string };
  };
};

export type DemoWindow = Window & { __vvDemoBackend?: DemoBackend };

/** 0..3 is the step being worked on, 4 the finished loop. */
export type Stage = 0 | 1 | 2 | 3 | 4;
export type Side = "client" | "agency";

export const TOUR_STEPS: { side: Side; title: string; hint: string; waiting: string }[] = [
  {
    side: "client",
    title: "Pin something on the site",
    hint: "Open Feedback in the bottom-right corner, hit Pin, then click any spot (the typo in the headline, say) and describe it.",
    waiting: "Waiting for Maria to pin something on her site.",
  },
  {
    side: "agency",
    title: "Open the new report",
    hint: "Maria's pin just landed in your feedback list. Click it.",
    waiting: "Your report is on its way to the agency.",
  },
  {
    side: "agency",
    title: "Reply to Maria",
    hint: "Type a reply below and send it. Move the status to In progress while you are at it.",
    waiting: "Dani at the agency is reading your report.",
  },
  {
    side: "client",
    title: "Read the agency's reply",
    hint: "Open Feedback, switch on the list and click your report.",
    waiting: "Dani replied. Maria can read it in the widget.",
  },
];

export const STEP_COUNT = TOUR_STEPS.length;

/**
 * Narrowest bakery frame (px) where the client card can dock beside the OPEN
 * widget panel: 20 (panel inset) + 380 (panel) + 16 (gap) + 260 (narrowest
 * card) + 16 (gutter). Below it the open panel would cover the card, so the
 * card moves out of the frame into a strip above it (`DemoSplit`). Tied to
 * the panel width in widget.js.
 */
export const DOCK_MIN_FRAME = 692;

export function stepSide(stage: Stage): Side | null {
  return stage < STEP_COUNT ? TOUR_STEPS[stage].side : null;
}

/** Whose turn it is, live from the backend. 0 until the backend is up. */
export function useDemoStage(backend: DemoBackend | null): Stage {
  return useSyncExternalStore(
    (fn) => (backend ? backend.subscribe(fn) : () => {}),
    () => (backend ? backend.stage() : 0),
    () => 0,
  );
}

/**
 * A counter that ticks on every change either pane makes. For reads that
 * build fresh objects (lists, rows), which would make an external-store
 * snapshot unstable: derive them from this with useMemo instead.
 */
export function useDemoRevision(backend: DemoBackend | null): number {
  const [revision, setRevision] = useState(0);
  useEffect(() => (backend ? backend.subscribe(() => setRevision((r) => r + 1)) : undefined), [backend]);
  return revision;
}

export function track(event: string, props?: Record<string, unknown>) {
  import("posthog-js")
    .then(({ default: posthog }) => posthog.capture(event, props))
    .catch(() => { /* analytics must never break the demo */ });
}
