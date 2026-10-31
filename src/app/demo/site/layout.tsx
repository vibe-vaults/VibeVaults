import { BakeryHeader } from "@/components/demo/bakery-header";
import { BakeryFooter } from "@/components/demo/bakery-site";
import { DemoClientGuide } from "@/components/demo/demo-client-guide";

/**
 * Main Responsibility: The made-up client website (a small bakery, the kind
 * of SMB site our agency customers build) that fills the LEFT pane of /demo,
 * loaded in an iframe, with the real widget running on it in sandbox mode.
 *
 * Sensitive Dependencies:
 * - Only meaningful inside the /demo iframe: the sandbox backend lives in the
 *   top window (`src/components/demo/demo-split.tsx`), and `DemoClientGuide`
 *   forwards a top-level visit to /demo. An iframe, not a div, because
 *   widget.js treats its window as the client's site (pin overlay, document
 *   coordinates, screenshots, console capture); in a frame that window is
 *   exactly the left pane.
 * - A layout, not a page, on purpose: the bakery's pages (`/demo/site`,
 *   `/menu`, `/catering`, `/story`) are client-side route changes, and the
 *   guide and widget must survive them. That is also what makes the demo
 *   exercise widget.js's pushState/popstate handling.
 * - The seeded pins in the backend anchor to `#demo-hours` and
 *   `#demo-order-btn` on the home page (`BakeryHome`). Renaming those ids
 *   strands the seeds on their grey fallback position.
 * - `CookieConsent` and `PostHogProvider` skip themselves in this frame
 *   (`isDemoFrame()`): the top window already asks and already counts.
 */
export default function DemoSiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#fffaf3]">
      <DemoClientGuide />
      <BakeryHeader />
      {children}
      <BakeryFooter />
    </div>
  );
}
