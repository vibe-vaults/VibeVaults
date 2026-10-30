import { HeroCtas } from "@/components/landing/hero-ctas";

/**
 * Main Responsibility: Dark navy call-to-action band that closes the marketing
 * pages (/, /framer, /compare/*). Visitors who read to the bottom get both the
 * trial and the lower-commitment demo.
 *
 * Sensitive Dependencies: `title` may contain an italic accent via `accent`,
 * rendered in the serif display face like the rest of the marketing headlines.
 */
export function ClosingCta({ title, accent, subtitle }: { title: string; accent?: string; subtitle: string }) {
    return (
        <section className="w-full bg-navy text-white py-24 md:py-28 relative overflow-hidden">
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(70%_90%_at_100%_100%,rgba(32,156,238,0.28),transparent_70%)]"
            />
            <div className="relative max-w-7xl mx-auto px-4 md:px-8 grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-10 items-end">
                <h2 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02] text-balance">
                    {title}
                    {accent && (
                        <>
                            {" "}
                            <span className="font-serif italic font-normal text-primary">{accent}</span>
                        </>
                    )}
                </h2>
                <div className="flex flex-col gap-6">
                    <p className="text-lg text-white/70 max-w-md">{subtitle}</p>
                    <HeroCtas align="start" tone="dark" />
                </div>
            </div>
        </section>
    );
}
