/**
 * Main Responsibility: Single source of truth for outbound contact links that
 * appear in more than one place (landing page CTAs, dashboard help card).
 *
 * Sensitive Dependencies:
 * - SETUP_CALL_URL is a Calendly event slug. Renaming the event link in
 *   Calendly kills the old URL immediately, so change it here in the same go.
 * - Calendly (booking) and Zoom (the call itself) are listed in
 *   /privacy-policy sections 3.5 and 7 and /terms-of-service section 11.
 *   Swapping either tool means updating those lists first.
 */
export const SETUP_CALL_URL = "https://calendly.com/jozsef-tar/15min";
