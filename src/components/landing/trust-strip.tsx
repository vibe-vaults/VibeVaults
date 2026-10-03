import Link from "next/link";
import { Activity, DatabaseBackup, FlaskConical, Globe, ShieldCheck, type LucideIcon } from "lucide-react";
import { STATUS_PAGE_URL } from "@/lib/contact-links";
import { cn } from "@/lib/utils";

/**
 * Main Responsibility: Slim row of reliability and data-protection facts shown
 * directly above the landing pricing cards, so the page offers some proof
 * before it asks for a signup (there are no customer testimonials yet).
 *
 * Sensitive Dependencies: every chip is a factual claim and goes stale
 * silently, so each one is tied to something checkable:
 * - "Daily backups": the cron in .github/workflows/supabase-backup.yml.
 * - "200+ automated tests": the Playwright suite in tests/ (~225 tests when
 *   written), run on every pull request to main by playwright.yml. Keep the
 *   rounded number; lower it if the suite ever shrinks below it.
 * - "Uptime monitored 24/7": the public UptimeRobot page (STATUS_PAGE_URL).
 * - "Data hosted in the EU": the Supabase project region (EU), confirmed by
 *   the owner. Changing region means changing this chip.
 * - "DPA included": /terms-of-service section 8 (Art. 28 processor terms).
 */

type TrustItem = { icon: LucideIcon; label: string; href?: string; external?: boolean };

const items: TrustItem[] = [
    { icon: DatabaseBackup, label: "Daily backups" },
    { icon: FlaskConical, label: "200+ automated tests on every release" },
    { icon: Activity, label: "Uptime monitored 24/7", href: STATUS_PAGE_URL, external: true },
    { icon: Globe, label: "Data hosted in the EU" },
    { icon: ShieldCheck, label: "GDPR-ready, DPA included", href: "/terms-of-service" },
];

const chipClass =
    "inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm";

export function TrustStrip({ className }: { className?: string }) {
    return (
        <ul className={cn("flex flex-wrap justify-center gap-3", className)} aria-label="Reliability and data protection">
            {items.map(({ icon: Icon, label, href, external }) => {
                const content = (
                    <>
                        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                        {label}
                    </>
                );
                return (
                    <li key={label}>
                        {href ? (
                            <Link
                                href={href}
                                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                className={cn(chipClass, "transition-colors hover:border-primary hover:text-primary")}
                            >
                                {content}
                            </Link>
                        ) : (
                            <span className={chipClass}>{content}</span>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
