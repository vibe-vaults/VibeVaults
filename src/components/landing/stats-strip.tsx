/**
 * Main Responsibility: The three plain facts under the hero, then a scrolling
 * strip of the platforms the widget runs on.
 *
 * Sensitive Dependencies:
 * - Every number and platform here is a product claim. The platform list
 *   mirrors the landing FAQ ("Does VibeVaults work on all websites?"); change
 *   both together.
 * - The track renders the list twice and slides by -50% (`animate-marquee` in
 *   globals.css), so the loop is seamless. The duplicate is aria-hidden.
 */

const STATS = [
    { value: "1", label: "script tag to install on any site" },
    { value: "0", label: "logins or extensions for your clients" },
    { value: "14", label: "day free trial, no card needed" },
];

const PLATFORMS = ["Webflow", "Framer", "WordPress", "Shopify", "React", "Plain HTML"];

export function StatsStrip() {
    return (
        <div className="w-full">
            <div className="max-w-7xl mx-auto px-4 md:px-8 grid sm:grid-cols-3 gap-6 py-10">
                {STATS.map((s) => (
                    <div key={s.label} className="flex items-baseline gap-4">
                        <span className="text-5xl md:text-6xl font-semibold tracking-tight tabular-nums text-gray-900">{s.value}</span>
                        <span className="text-[11.5px] leading-normal uppercase tracking-[0.14em] text-gray-500 max-w-[18ch]">{s.label}</span>
                    </div>
                ))}
            </div>

            <div
                className="overflow-hidden border-y border-gray-200 bg-gray-50 py-7 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]"
                aria-label={`Works on ${PLATFORMS.join(", ")}`}
                role="img"
            >
                <div className="flex w-max animate-marquee motion-reduce:animate-none">
                    {[0, 1].map((copy) => (
                        <ul key={copy} aria-hidden="true" className="flex shrink-0">
                            {PLATFORMS.map((p, i) => (
                                <li
                                    key={p}
                                    className={`flex items-center gap-14 pr-14 whitespace-nowrap text-2xl md:text-[32px] after:content-[''] after:size-1.5 after:rounded-full after:bg-secondary ${
                                        i % 3 === 0 ? "font-medium text-gray-400" : "font-bold text-gray-900"
                                    }`}
                                >
                                    {p}
                                </li>
                            ))}
                        </ul>
                    ))}
                </div>
            </div>
        </div>
    );
}
