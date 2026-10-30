import Link from "next/link";
import { Activity } from "lucide-react";
import { LinkedinIcon } from "@/components/icons/linkedin-icon";
import { CookiePreferencesLink } from "@/components/CookiePreferencesLink";
import { allComparisons } from "@/lib/compare-data";
import { docsPages } from "@/lib/docs-data";
import { OPERATOR } from "@/lib/legal-entity";
import { STATUS_PAGE_URL } from "@/lib/contact-links";
import { Wordmark } from "@/components/landing/wordmark";

/**
 * Main Responsibility: Shared site footer used by the landing page, the
 * /compare marketing pages and /docs. Four-column link layout (Product,
 * Documentation, Compare, Legal) over a brand/copyright bar, which is the
 * convention across this category and keeps every internal link crawlable.
 * Sensitive Dependencies: CookiePreferencesLink is a client component; the
 * Compare links derive from allComparisons (lib/compare-data.ts) and the docs
 * links from docsPages (lib/docs-data.ts), so new entries appear automatically.
 */

const productLinks = [
    { href: "/#features", label: "Features" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/pricing", label: "Pricing" },
    { href: "/compare", label: "Compare" },
    { href: "/framer", label: "For Framer sites" },
];

function FooterColumn({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
    return (
        <div>
            {href ? (
                <Link
                    href={href}
                    className="inline-block text-xs font-bold uppercase tracking-[0.14em] text-gray-500 hover:text-primary transition-colors mb-4"
                >
                    {title}
                </Link>
            ) : (
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500 mb-4">{title}</div>
            )}
            <ul className="flex flex-col gap-2.5">{children}</ul>
        </div>
    );
}

function FooterLink({ href, label }: { href: string; label: string }) {
    return (
        <li>
            <Link href={href} className="text-sm text-gray-500 hover:text-primary transition-colors">
                {label}
            </Link>
        </li>
    );
}

export function SiteFooter() {
    return (
        <footer className="pt-16 pb-8 w-full border-t border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                {/* Brand + link columns */}
                <div className="grid grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))] gap-8 md:gap-12 pb-12 mb-8 border-b border-gray-200">
                    <div className="col-span-2 lg:col-span-1">
                        <Wordmark className="text-2xl" />
                        <p className="mt-4 max-w-xs text-sm text-gray-500 leading-relaxed">
                            A visual feedback widget for web agencies and design studios. Data hosted in the EU.
                        </p>
                        <a
                            href={STATUS_PAGE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
                        >
                            <Activity className="h-4 w-4" aria-hidden="true" />
                            System status
                        </a>
                    </div>

                    <FooterColumn title="Product">
                        {productLinks.map((l) => (
                            <FooterLink key={l.href} href={l.href} label={l.label} />
                        ))}
                    </FooterColumn>

                    <FooterColumn title="Documentation" href="/docs">
                        {docsPages.map((page) => (
                            <FooterLink key={page.slug} href={`/docs/${page.slug}`} label={page.title} />
                        ))}
                    </FooterColumn>

                    <FooterColumn title="Compare" href="/compare">
                        {allComparisons.map((c) => (
                            <FooterLink
                                key={c.slug}
                                href={`/compare/${c.slug}`}
                                label={`VibeVaults vs ${c.competitorName}`}
                            />
                        ))}
                    </FooterColumn>

                    <FooterColumn title="Legal">
                        <FooterLink href="/terms-of-service" label="Terms of Service" />
                        <FooterLink href="/privacy-policy" label="Privacy Policy" />
                        <li>
                            <CookiePreferencesLink className="text-sm text-gray-500 hover:text-primary transition-colors cursor-pointer" />
                        </li>
                        <FooterLink href="/access" label="Lost widget access?" />
                    </FooterColumn>
                </div>

                {/* Brand / social row */}
                {/* Three columns from md, so the contact line sits truly centred
                    regardless of how wide the two outer groups are. */}
                <div className="flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] items-center gap-4 text-sm text-gray-500">
                    <div className="md:justify-self-start">
                        &copy; {new Date().getFullYear()} VibeVaults. All rights reserved.
                    </div>
                    <div>
                        Contact:{" "}
                        <a href={`mailto:${OPERATOR.email}`} className="hover:text-primary transition-colors">
                            {OPERATOR.email}
                        </a>
                    </div>
                    <div className="flex items-center gap-5 md:justify-self-end">
                        <a
                            href="https://www.uneed.best/tool/vibevaults"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center hover:opacity-80 transition-opacity"
                        >
                            {/* Self-hosted copy of uneed.best/EMBED1B.png: the hotlinked
                                original was intermittently refused (403, NotSameOrigin) by
                                Uneed's edge, leaving a console error on every public page. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/badges/uneed-featured.png"
                                alt="VibeVaults is featured on Uneed"
                                className="h-10 w-auto"
                            />
                        </a>
                        <a
                            href="https://www.linkedin.com/company/vibevaults/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="VibeVaults on LinkedIn"
                            className="text-gray-600 hover:text-primary transition-colors inline-flex items-center"
                        >
                            <LinkedinIcon className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
