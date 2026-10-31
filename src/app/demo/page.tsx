import type { Metadata } from "next";
import { DemoSandboxBar } from "@/components/demo/demo-sandbox-bar";
import { DemoSplit } from "@/components/demo/demo-split";

export const metadata: Metadata = {
  title: "Live Demo: Try the Visual Feedback Widget | VibeVaults",
  description:
    "Try VibeVaults without signing up. Pin feedback on a sample client website, then answer it from the agency dashboard right beside it, and watch the reply land in the client's thread.",
  alternates: { canonical: "/demo" },
};

/**
 * Main Responsibility: Public, no-signup live demo. Client side and agency
 * side at once, split down the middle (see `DemoSplit`); the made-up client
 * site itself is `src/app/demo/site/*`, loaded in the left pane's iframe.
 *
 * Sensitive Dependencies:
 * - Public in `src/lib/supabase/proxy.ts` (prefix match covers `/demo/*`); the
 *   backend script is excluded from the proxy matcher in `src/proxy.ts` like
 *   widget.js itself.
 * - The old bakery URLs (`/demo/menu` and friends) redirect here
 *   (`next.config.ts`).
 */
export default function DemoPage() {
  return (
    <div className="h-[calc(100dvh-var(--cookie-banner-height,0px))] flex flex-col overflow-hidden bg-gray-50">
      <DemoSandboxBar />
      <DemoSplit />
    </div>
  );
}
