import Image from "next/image";

/**
 * Main Responsibility: Founder note on a dark navy band: a round portrait and
 * the short pull quote, plus the founding-cohort ask (no discount: price was
 * never the objection in outreach, and a permanent public discount undercut
 * every other offer).
 *
 * Sensitive Dependencies:
 * - Founder avatar at /avatar.jpg in public folder.
 */
export function FounderNote() {
    return (
        <section className="w-full bg-navy text-white py-24 md:py-32 relative overflow-hidden">
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(60%_80%_at_0%_50%,rgba(32,156,238,0.18),transparent_70%)]"
            />
            <div className="relative max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-[auto_minmax(0,1fr)] gap-12 md:gap-20 items-center">
                <a
                    href="https://www.linkedin.com/in/jozseftar/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="József's LinkedIn profile"
                    className="block w-56 md:w-72 rounded-full p-2 ring-1 ring-white/15 transition-transform hover:scale-[1.02]"
                >
                    <Image
                        src="/avatar.jpg"
                        alt="József, founder of VibeVaults"
                        width={288}
                        height={288}
                        className="w-full h-auto aspect-square rounded-full object-cover"
                    />
                </a>
                <div>
                    <blockquote className="font-serif italic text-3xl md:text-[44px] leading-[1.2] max-w-[24ch] text-balance">
                        &ldquo;I spent years decoding feedback from email threads and cropped screenshots. VibeVaults is
                        the tool I wanted on every one of those projects.&rdquo;
                    </blockquote>
                    <p className="mt-7 flex items-center gap-3 text-[15px] text-white/60">
                        <span className="h-px w-8 bg-secondary" aria-hidden="true" />
                        <b className="text-white">József</b> &middot; Founder, VibeVaults
                    </p>
                    <p className="mt-6 max-w-[52ch] text-white/70 leading-relaxed">
                        I&apos;m working with a small group of founding agencies. You get a direct line to the person
                        building it and a say in what ships next.
                    </p>
                </div>
            </div>
        </section>
    );
}
