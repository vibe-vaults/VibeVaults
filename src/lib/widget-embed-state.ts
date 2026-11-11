/**
 * Main Responsibility: Turns `projects.widget_last_seen_at` into the embed
 * status shown on the Embed widget card: never seen, seen recently, or not
 * seen for a while (snippet removed, site rebuilt without it, or no traffic).
 *
 * Sensitive Dependencies:
 * - `widget_last_seen_at` is stamped on EVERY page load by the unauthenticated
 *   heartbeat (`src/app/api/widget/heartbeat/route.ts`). If that ever becomes
 *   throttled or first-load-only, the stale state here stops meaning anything.
 * - Pure and free of server imports, so it is safe in client and server code.
 *   Call it on the server and pass the result down: reading the clock during a
 *   client render would mismatch on hydration.
 */

export type WidgetEmbedState = 'not_detected' | 'embedded' | 'stale';

/** No heartbeat for this long and the embed is reported as stale. */
export const WIDGET_STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export function getWidgetEmbedState(
    lastSeenAt: string | null | undefined,
    now: number = Date.now(),
): WidgetEmbedState {
    if (!lastSeenAt) return 'not_detected';
    const seen = new Date(lastSeenAt).getTime();
    if (Number.isNaN(seen)) return 'not_detected';
    return now - seen > WIDGET_STALE_AFTER_MS ? 'stale' : 'embedded';
}
