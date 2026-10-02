import { Fraunces } from "next/font/google";
import { DemoSandboxBar } from "@/components/demo/demo-sandbox-bar";
import { BakeryHeader } from "@/components/demo/bakery-header";
import { BakeryFooter } from "@/components/demo/bakery-site";
import { DemoGuide } from "@/components/demo/demo-guide";

/**
 * Main Responsibility: Public, no-signup live demo. Wraps the made-up client
 * website (a small bakery, the kind of SMB site our agency customers build)
 * with the real widget running on it in sandbox mode, so a curious visitor can
 * pin feedback across several pages and watch the agency side answer without
 * creating an account.
 *
 * Sensitive Dependencies:
 * - A layout, not a page, on purpose: the bakery's pages (`/demo`,
 *   `/demo/menu`, `/demo/catering`, `/demo/story`) are client-side route
 *   changes, and the guide and widget must survive them. That is also what
 *   makes the demo exercise widget.js's pushState/popstate handling.
 * - `DemoGuide` loads `public/widget-demo-backend.js` before `public/widget.js`;
 *   the order is what keeps every widget request inside the browser.
 * - The seeded pins in the backend anchor to `#demo-hours` and
 *   `#demo-order-btn` on the home page (`BakeryHome`). Renaming those ids
 *   strands the seeds on their grey fallback position.
 * - Public in `src/lib/supabase/proxy.ts` (prefix match covers `/demo/*`); the
 *   backend script is excluded from the proxy matcher in `src/proxy.ts` like
 *   widget.js itself.
 * - Exits are plain <a> (full page loads) so the widget host and its timers
 *   never outlive the demo inside the SPA.
 */

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-bakery", display: "swap" });

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fraunces.variable} min-h-screen flex flex-col bg-[#fffaf3]`}>
      <DemoSandboxBar />
      <DemoGuide />
      <BakeryHeader />
      {children}
      <BakeryFooter />
    </div>
  );
}
