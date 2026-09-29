import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { DemoSandboxBar } from "@/components/demo/demo-sandbox-bar";
import { BakerySite } from "@/components/demo/bakery-site";
import { DemoGuide } from "@/components/demo/demo-guide";

/**
 * Main Responsibility: Public, no-signup live demo. Renders a made-up client
 * website (a small bakery, the kind of SMB site our agency customers build)
 * with the real widget running on it in sandbox mode, so a curious visitor can
 * pin feedback and watch the agency side answer without creating an account.
 *
 * Sensitive Dependencies:
 * - `DemoGuide` loads `public/widget-demo-backend.js` before `public/widget.js`;
 *   the order is what keeps every widget request inside the browser.
 * - The seeded pins in the backend anchor to `#demo-hours` and
 *   `#demo-order-btn` in `BakerySite`. Renaming those ids strands the seeds on
 *   their grey fallback position.
 * - Public in `src/lib/supabase/proxy.ts`; the backend script is excluded from
 *   the proxy matcher in `src/proxy.ts` like widget.js itself.
 * - Exits are plain <a> (full page loads) so the widget host and its timers
 *   never outlive this page inside the SPA.
 */

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-bakery", display: "swap" });

export const metadata: Metadata = {
  title: "Live Demo: Try the Visual Feedback Widget | VibeVaults",
  description:
    "Try VibeVaults without signing up. Pin feedback on a sample client website, attach a screenshot, and watch the agency reply in the thread.",
  alternates: { canonical: "/demo" },
};

export default function DemoPage() {
  return (
    <div className={`${fraunces.variable} min-h-screen flex flex-col bg-[#fffaf3]`}>
      <DemoSandboxBar />
      <DemoGuide />
      <BakerySite />
    </div>
  );
}
