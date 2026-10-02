"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Croissant, Phone } from "lucide-react";

/**
 * Main Responsibility: The pretend bakery's own nav on /demo. Its links are
 * Next <Link>s on purpose: moving between the bakery's pages is a client-side
 * route change, which is exactly what a customer's React or Next site does,
 * so the demo exercises widget.js's pushState/popstate handling for real.
 *
 * Sensitive Dependencies:
 * - Routes under `src/app/demo/`. The widget keys pins by path, so each page
 *   must be its own URL; switching content in place on /demo would put every
 *   page's pins on one page.
 * - A client component only for the active-link state. Keep it out of the
 *   page content, which stays plain markup so pin anchors are not re-rendered.
 */

const NAV = [
  { href: "/demo/menu", label: "Menu" },
  { href: "/demo/catering", label: "Catering" },
  { href: "/demo/story", label: "Our story" },
];

export function BakeryHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[#ecdcc6] text-[#3b2414]">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between gap-4">
        <Link href="/demo" className="flex items-center gap-2.5 shrink-0">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#6b3f1d] text-[#fffaf3]">
            <Croissant className="h-5 w-5" aria-hidden />
          </span>
          <span className="hidden sm:inline font-[family-name:var(--font-bakery)] text-2xl font-semibold tracking-tight">Crumb &amp; Co.</span>
        </Link>
        <nav className="flex gap-5 md:gap-8 text-sm font-medium">
          {NAV.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative py-1 transition-colors whitespace-nowrap ${active ? "text-[#3b2414]" : "text-[#7a5a40] hover:text-[#3b2414]"}`}
              >
                {label}
                <span
                  aria-hidden
                  className={`absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-[#e5a563] transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
                />
              </Link>
            );
          })}
        </nav>
        <span className="hidden lg:inline-flex items-center gap-2 text-sm font-medium text-[#7a5a40]">
          <Phone className="h-4 w-4" aria-hidden /> (555) 014-2290
        </span>
      </div>
    </header>
  );
}
