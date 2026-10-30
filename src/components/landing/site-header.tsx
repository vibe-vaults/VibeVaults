import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "@/components/landing/wordmark";

/**
 * Main Responsibility: Shared sticky site header/nav used by the landing page,
 * /pricing, /compare, /docs and the legal pages, so the top chrome stays
 * identical everywhere. Auth-aware: signed-in visitors get a Dashboard button
 * instead of Sign In / Start free trial, so a customer reading the docs is not
 * invited to register a second time.
 *
 * Sensitive Dependencies:
 * - Async server component. Resolving the session on the server means no
 *   sign-in flash for logged-in customers. It costs nothing in caching terms
 *   because every route is already dynamically rendered: the root layout reads
 *   headers() for the GDPR country check. If that ever changes and these pages
 *   become statically generated, this header has to move to a client-side
 *   session check instead.
 * - getClaims() decodes the JWT rather than calling the auth server. Never use
 *   getSession() to read user fields — with `encode: 'tokens-only'` they are
 *   not in the cookie.
 * - Failure is treated as signed out, so an auth outage still renders a usable
 *   header with working CTAs.
 * - nav anchors use absolute /#... hrefs so they resolve from any route.
 * - `minimal` keeps only the wordmark. Used on /access, whose audience is
 *   largely invited clients who by design never get an account: a "Sign In"
 *   button there invites them into a signup that cannot solve what they came
 *   for.
 */
export async function SiteHeader({ minimal = false }: { minimal?: boolean } = {}) {
    let signedIn = false;
    try {
        const supabase = await createClient();
        const { data } = await supabase.auth.getClaims();
        signedIn = !!data?.claims;
    } catch {
        signedIn = false;
    }

    return (
        <header className="sticky top-0 z-50 bg-white/75 backdrop-blur-md">
            <div className="px-4 md:px-8 h-[76px] flex justify-between items-center max-w-7xl mx-auto w-full gap-4">
                <div className="flex-1">
                    <Wordmark className="text-xl md:text-2xl" />
                </div>

                {!minimal && (
                    <>
                        <nav className="hidden md:flex gap-1 p-1 rounded-full border border-gray-200 bg-white/80 text-[13.5px] font-semibold">
                            {NAV_LINKS.map(({ href, label }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="px-4 py-1.5 rounded-full text-gray-500 hover:text-gray-900 hover:bg-accent transition-colors"
                                >
                                    {label}
                                </Link>
                            ))}
                        </nav>

                        <div className="flex gap-2 md:gap-3 items-center flex-1 justify-end">
                            {signedIn ? (
                                <Link href="/dashboard" className={SOLID_PILL}>
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/auth/login"
                                        className="inline-flex items-center px-3 md:px-4 py-2 rounded-full border border-gray-300 bg-white/80 text-sm font-semibold text-gray-900 hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
                                    >
                                        Sign In
                                    </Link>
                                    <Link href="/auth/register" className={SOLID_PILL}>
                                        Start free trial
                                    </Link>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}

const NAV_LINKS = [
    { href: "/#features", label: "Features" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/pricing", label: "Pricing" },
];

const SOLID_PILL =
    "inline-flex items-center justify-center px-4 py-2 md:px-5 rounded-full font-bold text-sm transition-colors bg-secondary text-white hover:bg-[#D35F12] whitespace-nowrap";
