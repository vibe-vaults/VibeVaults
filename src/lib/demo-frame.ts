/**
 * True inside the /demo bakery iframe. Site-wide chrome that must run once
 * per visit (the cookie banner, PostHog) checks this and stays out of the
 * frame, because the top /demo page already asks for consent and already
 * counts the visit. Client-only: call it from effects.
 */
export function isDemoFrame(): boolean {
  try {
    return window.self !== window.top && window.location.pathname.startsWith("/demo/site");
  } catch {
    return false;
  }
}
