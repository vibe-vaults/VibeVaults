import { HeroCtas } from "@/components/landing/hero-ctas";

/**
 * Main Responsibility: Landing page hero. Split layout: the headline (sans,
 * with the serif italic accent on "feedback chaos.") on the left, the pitch
 * and CTAs in a side column on the right, over a soft brand-blue glow that
 * also sits behind the transparent sticky header.
 *
 * Sensitive Dependencies:
 * - The negative top margin pulls the glow under SiteHeader (h-[76px]); keep
 *   the two heights in sync.
 * - The headline is the page's main SEO signal; change it deliberately.
 */
export function Hero() {
    return (
        <section className="relative w-full -mt-[76px] pt-[76px] bg-hero-glow">
            <div className="max-w-7xl mx-auto px-4 md:px-8 grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-12 pt-14 md:pt-24 pb-16 md:pb-20 items-start">
                <h1 className="text-[clamp(44px,6.4vw,96px)] leading-[1.02] tracking-[-0.03em] font-semibold text-gray-900 text-balance">
                    Ship client sites faster without the{" "}
                    <span className="font-serif italic font-normal text-[#0B6FB3]">feedback chaos.</span>
                </h1>

                <div className="flex flex-col gap-6 max-w-md lg:pt-4">
                    <span className="text-[17px] text-gray-900">Clear feedback &middot; Faster sign-off</span>
                    <p className="text-[15.5px] leading-relaxed text-gray-500">
                        VibeVaults is a visual feedback widget for <b className="text-gray-900">web agencies</b> and{" "}
                        <b className="text-gray-900">design studios</b>. Clients comment right on the site you&apos;re
                        building. <b className="text-gray-900">No logins</b>, no browser extensions, and you{" "}
                        <b className="text-gray-900">never pay per client</b>. Send a link, they start marking up, and
                        your <b className="text-gray-900">AI agent</b> can pick up every report and fix it.
                    </p>
                    <HeroCtas align="start" trialLabel="Start free trial" />
                    <p className="text-xs text-gray-500">14-day free trial &middot; No credit card required</p>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="border-t border-gray-200" />
            </div>
        </section>
    );
}
