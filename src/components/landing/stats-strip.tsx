/**
 * Main Responsibility: The three plain facts under the hero, then a scrolling
 * strip of the platforms the widget runs on, introduced by "Works on any site:".
 *
 * Sensitive Dependencies:
 * - Every number and platform here is a product claim. The platform list
 *   mirrors the landing FAQ ("Does VibeVaults work on all websites?"); change
 *   both together. Wix and Squarespace only allow custom code on paid plans,
 *   which the FAQ says.
 * - Logos come from the `simple-icons` package (CC0 SVGs, but each logo stays
 *   its owner's trademark): shown unmodified in one colour, only to say the
 *   widget runs there. Never pair them with "partner" or endorsement wording.
 * - The track renders the list twice and slides by -50% (`animate-marquee` in
 *   globals.css), so the loop is seamless. The duplicate is aria-hidden.
 */

import {
    siAngular,
    siFramer,
    siHtml5,
    siNextdotjs,
    siNuxt,
    siReact,
    siShopify,
    siSquarespace,
    siSvelte,
    siVuedotjs,
    siWebflow,
    siWix,
    siWordpress,
    type SimpleIcon,
} from "simple-icons";

const STATS = [
    { value: "1", label: "script tag to install on any site" },
    { value: "0", label: "logins or extensions for your clients" },
    { value: "14", label: "day free trial, no card needed" },
];

/** `wordmark`: the logo already spells the name, so it is shown alone (larger). */
const PLATFORMS: { name: string; icon: SimpleIcon; wordmark?: boolean }[] = [
    { name: "Webflow", icon: siWebflow },
    { name: "Framer", icon: siFramer },
    { name: "WordPress", icon: siWordpress },
    { name: "Shopify", icon: siShopify },
    { name: "Wix", icon: siWix, wordmark: true },
    { name: "Squarespace", icon: siSquarespace },
    { name: "React", icon: siReact },
    { name: "Next.js", icon: siNextdotjs },
    { name: "Vue.js", icon: siVuedotjs },
    { name: "Nuxt", icon: siNuxt },
    { name: "Svelte", icon: siSvelte },
    { name: "Angular", icon: siAngular },
    { name: "Plain HTML", icon: siHtml5 },
];

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

            <div className="flex flex-col md:flex-row md:items-center border-y border-gray-200 bg-gray-50">
                <p className="shrink-0 px-4 pt-5 md:py-7 md:pl-8 md:pr-4 xl:pl-[calc((100vw-80rem)/2+2rem)] text-[11.5px] uppercase tracking-[0.14em] text-gray-500">
                    Works on any site:
                </p>
                <div
                    className="min-w-0 flex-1 overflow-hidden py-5 md:py-7 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]"
                    aria-label={PLATFORMS.map((p) => p.name).join(", ")}
                    role="img"
                >
                    <div className="flex w-max animate-marquee motion-reduce:animate-none">
                        {[0, 1].map((copy) => (
                            <ul key={copy} aria-hidden="true" className="flex shrink-0">
                                {PLATFORMS.map(({ name, icon, wordmark }, i) => (
                                    <li
                                        key={name}
                                        className={`flex items-center gap-14 pr-14 whitespace-nowrap text-2xl md:text-[32px] after:content-[''] after:size-1.5 after:rounded-full after:bg-secondary ${
                                            i % 3 === 0 ? "font-medium text-gray-400" : "font-bold text-gray-900"
                                        }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <svg
                                                viewBox="0 0 24 24"
                                                className={`fill-current ${wordmark ? "-my-4 size-14 md:size-16" : "size-6 md:size-7"}`}
                                                aria-hidden="true"
                                            >
                                                <path d={icon.path} />
                                            </svg>
                                            {!wordmark && name}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
