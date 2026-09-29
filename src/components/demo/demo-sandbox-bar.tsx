import { FlaskConical } from "lucide-react";

/**
 * Main Responsibility: The VibeVaults strip above the fake client site on
 * /demo. Says plainly that this is a sandbox and nothing leaves the browser,
 * and keeps the trial CTA one click away.
 *
 * Sensitive Dependencies:
 * - The "nothing leaves your browser" claim is only true because
 *   `public/widget-demo-backend.js` answers every widget request locally.
 *   Pinned by `tests/widget-demo.spec.ts`.
 * - Links are plain <a> on purpose, see the note in `src/app/demo/page.tsx`.
 */
export function DemoSandboxBar() {
  return (
    <div className="sticky top-0 z-40 bg-gray-950 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center gap-3 md:gap-5">
        {/* Full page load on purpose: see the exits note in src/app/demo/page.tsx. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="font-bold text-lg tracking-tight text-primary whitespace-nowrap hover:opacity-90 transition-opacity">
          VibeVaults
        </a>
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/15 whitespace-nowrap">
          <FlaskConical className="h-3.5 w-3.5 text-secondary" aria-hidden />
          Live sandbox
        </span>
        <p className="hidden md:block flex-1 text-sm text-white/70 truncate">
          A pretend client site. Use the Feedback button in the bottom-right corner. Nothing you type leaves your browser.
        </p>
        <div className="flex-1 md:hidden" />
        <a
          href="/auth/register"
          className="inline-flex items-center justify-center px-4 py-2 rounded-full font-bold text-sm bg-secondary text-white hover:bg-secondary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 whitespace-nowrap"
        >
          Start free trial
        </a>
      </div>
    </div>
  );
}
