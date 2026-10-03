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
 * - STATUS_PAGE_URL is the public UptimeRobot status page. UptimeRobot only
 *   pings our public URLs and never receives user data, so it is not a
 *   sub-processor; visitors who open the status page are on UptimeRobot's
 *   own site.
 */
export const SETUP_CALL_URL = "https://calendly.com/jozsef-tar/15min";
export const STATUS_PAGE_URL = "https://stats.uptimerobot.com/h0B96HrTXV";
