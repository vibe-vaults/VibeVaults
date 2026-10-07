import { TIER_DISPLAY, YEARLY_DISCOUNT } from "@/lib/tier-config";
import { docsPages } from "@/lib/docs-data";
import { allComparisons } from "@/lib/compare-data";

/**
 * Main Responsibility: Serves /llms.txt (llmstxt.org convention), the Markdown
 * summary AI assistants read to describe VibeVaults. The prose at the top is
 * hand-written; prices, the docs list and the comparison list are derived from
 * the same sources the site renders, so this file cannot drift from them.
 *
 * Sensitive Dependencies:
 * - TIER_DISPLAY / YEARLY_DISCOUNT (lib/tier-config.ts), docsPages
 *   (lib/docs-data.ts) and allComparisons (lib/compare-data.ts).
 * - The hand-written "Key facts" assert product behaviour and go stale
 *   silently, like the docs pages: keep them in step with CLAUDE.md's widget
 *   section, /docs/widget-data and the landing TrustStrip.
 * - Must stay public: excluded from the proxy matcher in src/proxy.ts and from
 *   the auth gate in src/lib/supabase/proxy.ts (both match "llms.txt").
 * - Replaces the old static public/llms.txt; a file there would conflict with
 *   this route.
 */

export const dynamic = "force-static";

function buildLlmsTxt(baseUrl: string): string {
    const url = (path: string) => `${baseUrl}${path}`;
    const yearlyOff = Math.round(YEARLY_DISCOUNT * 100);

    const pricing = TIER_DISPLAY.map(
        (t) =>
            `- **${t.name}**: $${t.monthlyPrice}/month, or $${t.yearlyPricePerMonth.toFixed(2)}/month billed yearly. ${t.features.join(", ")}.`
    ).join("\n");

    const docs = docsPages
        .map((p) => `- [${p.title}](${url(`/docs/${p.slug}`)}): ${p.summary}`)
        .join("\n");

    const comparisons = allComparisons
        .map((c) => `- [VibeVaults vs ${c.competitorName}](${url(`/compare/${c.slug}`)}): ${c.hubBlurb}`)
        .join("\n");

    return `# VibeVaults

> VibeVaults is a visual feedback widget for web agencies and design studios. Clients and testers mark problems directly on the site or web app being built, staging or live, and a screenshot plus browser context, console logs and failed network requests are captured automatically. The agency replies in one real-time thread per issue. Clients need no account and no browser extension.

## Key facts

- **How feedback is given:** the reviewer drops a pin on the exact spot on the page and types a comment. From that one action a screenshot is captured automatically, along with the page URL, browser, operating system, viewport, recent console logs and failed network requests. Query strings are stripped from captured URLs for privacy.
- **Pins live on the page:** pins stay visible on the site where they were placed, survive layout and viewport changes, and each one opens its own thread with real-time replies between the team and the client.
- **Client access:** send one shareable review link (the reviewer enters a name and email, no account), or invite clients individually by email. The widget is invite-only, so ordinary visitors of the site never see it.
- **Setup:** paste one script tag into the site. Works on Webflow, WordPress, Shopify, React, Next.js, Vue and plain HTML, including single-page apps with client-side routing.
- **Team side:** a shared dashboard with workspaces, projects and roles (owner, member, client), feedback statuses (open, in progress, in review, completed), email notifications, and an optional public read-only board for stakeholders.
- **Try it without signing up:** an interactive demo on a made-up site at ${url("/demo")}.
- **Trust and data:** data hosted in the EU, GDPR processor terms (DPA) included in the Terms of Service, daily backups, and public uptime monitoring.
- **Integrations:** native integrations with project-management tools (Jira, Trello, etc.) are not available yet; feedback lives in the VibeVaults dashboard.
- **What it is not:** not a survey or NPS tool, and not a public bug tracker for anonymous site visitors. It is a review tool for the people who build websites and their clients.

## Pricing

Every plan starts with a 14-day free trial, no credit card required. There is no free tier after the trial. Yearly billing saves ${yearlyOff}%. Clients and feedback are unlimited on every plan; there are no per-client fees.

${pricing}

Full comparison: ${url("/pricing")}

## Documentation

${docs}

## Comparisons

${comparisons}

## Pages

- [Homepage](${url("/")}): product overview, features, FAQ
- [Interactive demo](${url("/demo")}): try the widget on a made-up site, no signup
- [Pricing](${url("/pricing")}): plans and full feature matrix
- [Documentation](${url("/docs")}): setup and how the widget works
- [Comparisons](${url("/compare")}): VibeVaults compared with other visual feedback tools
- [Widget access recovery](${url("/access")}): for invited clients and team members who lost their widget access link

## Legal

- [Terms of Service](${url("/terms-of-service")})
- [Privacy Policy](${url("/privacy-policy")})
`;
}

export function GET() {
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.vibe-vaults.com").replace(/\/+$/, "");
    return new Response(buildLlmsTxt(baseUrl), {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
}
