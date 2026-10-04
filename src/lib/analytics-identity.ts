/**
 * Main Responsibility: Links PostHog analytics to the signed-in account and
 * unlinks it on sign-out, so a visitor's pre-signup trail (UTM source, demo
 * run) and their later dashboard usage show up as one person.
 *
 * Sensitive Dependencies:
 * - Identifies by the Supabase user id (JWT `sub`), never the email, to keep
 *   personal data in PostHog to the minimum. Privacy policy section 9 and the
 *   ROPA entry A5 in VibeVaults-internal describe exactly this.
 * - Only ever runs after analytics consent: `PostHogProvider` calls
 *   `identifySignedInUser` from its consent handling, and PostHog is opted out
 *   until then anyway.
 * - Every client-side sign-out path must call `resetAnalyticsIdentity` before
 *   it navigates away, or two people on a shared computer merge into one.
 */

type PostHogClient = typeof import('posthog-js').default

export async function identifySignedInUser(posthog: PostHogClient): Promise<void> {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const { data } = await createClient().auth.getClaims()
    const userId = data?.claims?.sub
    if (!userId) return
    if (posthog.get_distinct_id() === userId) return
    posthog.identify(userId)
  } catch {
    // Analytics must never break the page.
  }
}

export async function resetAnalyticsIdentity(): Promise<void> {
  try {
    const { default: posthog } = await import('posthog-js')
    if (posthog.__loaded) posthog.reset()
  } catch {
    // Analytics must never block sign-out.
  }
}
