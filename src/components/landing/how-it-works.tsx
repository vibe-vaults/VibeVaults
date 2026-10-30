import { Code2, Send, UserPlus, type LucideIcon } from "lucide-react";
import { Accent, SectionHeading } from "@/components/landing/section-heading";

/**
 * Main Responsibility: "How it works" as an isometric staircase. Three blocks
 * rise left to right, shading from the brand orange to the brand blue, each
 * carrying its step's icon, with a numbered label card beside it. Block colours
 * run secondary (orange), primary (blue), navy. Below `lg`
 * the drawing is dropped for a plain numbered list.
 *
 * Sensitive Dependencies:
 * - The embed snippet in step 2 must match what `embed-widget-card.tsx`
 *   generates (same coupling as /docs/quick-start and /framer).
 * - `id="how-it-works"` is the target of the header and footer links.
 * - Block geometry lives in BLOCKS (SVG user units in a 1200x600 viewBox); the
 *   icons and label cards are HTML positioned in percentages of that same
 *   box, so moving a block means moving its `icon`/`card` coordinates too.
 */

type Step = { title: string; body: string; icon: LucideIcon; code?: boolean };

const STEPS: Step[] = [
    {
        title: "Create your account",
        body: "Sign up and set up your project dashboard in less than 2 minutes.",
        icon: UserPlus,
    },
    {
        title: "Embed the widget",
        body: "Copy and paste our lightweight script into your client's website code.",
        icon: Code2,
        code: true,
    },
    {
        title: "Invite clients to review",
        body: "Share the review link or invite clients from your dashboard. They leave feedback right on the site, no sign up required.",
        icon: Send,
    },
];

// Isometric prism: centre x, ground y, height. a = half width, b = half depth.
// Consecutive blocks are spaced just over two half-widths apart (dx >= 2A), so
// no part of one block's silhouette crosses the next. Still painted back to
// front (see the reversed map below) in case the spacing is ever tightened.
const A = 96;
const B = 55;
const BLOCKS = [
    { cx: 430, gy: 530, h: 40, top: "#F7A56B", left: "#EE7220", right: "#C85A12" },
    { cx: 634, gy: 413, h: 115, top: "#7CC6F6", left: "#209CEE", right: "#0B6FB3" },
    { cx: 838, gy: 296, h: 190, top: "#2B4A70", left: "#12263F", right: "#0B1A2E" },
];

// Label card and icon anchors in % of the 1200x600 box.
const LAYOUT = [
    { card: { left: "2%", top: "62%" }, align: "right" },
    { card: { left: "17%", top: "11%" }, align: "right" },
    { card: { left: "65%", top: "64%" }, align: "left" },
] as const;

const SNIPPET = '<script src="https://vibe-vaults.com/widget.js" data-key="vv_abc123" async></script>';

function prism({ cx, gy, h }: (typeof BLOCKS)[number]) {
    const ty = gy - h;
    const pts = (p: number[][]) => p.map(([x, y]) => `${x},${y}`).join(" ");
    return {
        top: pts([[cx, ty - B], [cx + A, ty], [cx, ty + B], [cx - A, ty]]),
        left: pts([[cx - A, ty], [cx, ty + B], [cx, gy + B], [cx - A, gy]]),
        right: pts([[cx, ty + B], [cx + A, ty], [cx + A, gy], [cx, gy + B]]),
        iconTop: ((ty) / 600) * 100,
        iconLeft: (cx / 1200) * 100,
    };
}

function StepNumber({ n }: { n: number }) {
    return (
        <span className="inline-grid place-items-center size-7 rounded-full bg-gray-900 text-white text-[13px] font-bold tabular-nums">
            {n}
        </span>
    );
}

function Snippet() {
    return (
        <code className="block rounded-lg bg-gray-900 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-[#9ECE6A] break-all text-left">
            {SNIPPET}
        </code>
    );
}

export function HowItWorks() {
    return (
        <section id="how-it-works" className="w-full py-24 md:py-32 bg-gray-50 border-y border-gray-200 scroll-mt-20 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <SectionHeading kicker="Up and running in minutes, not hours.">
                    <Accent>How</Accent> it works
                </SectionHeading>

                {/* Desktop: isometric staircase */}
                <div className="relative mt-10 hidden lg:block aspect-[2/1]">
                    <svg viewBox="0 0 1200 600" className="absolute inset-0 size-full" aria-hidden="true">
                        <defs>
                            <linearGradient id="hiw-fade" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
                                <stop offset="1" stopColor="#F6F8FB" stopOpacity="0.9" />
                            </linearGradient>
                            <filter id="hiw-shadow" x="-20%" y="-20%" width="140%" height="160%">
                                <feGaussianBlur stdDeviation="14" />
                            </filter>
                        </defs>
                        {/* Floor shadow along the rise */}
                        <polygon
                            points="310,590 930,240 980,290 370,630"
                            fill="#209CEE"
                            opacity="0.12"
                            filter="url(#hiw-shadow)"
                        />
                        {[...BLOCKS].reverse().map((b) => {
                            const p = prism(b);
                            return (
                                <g key={b.cx}>
                                    <polygon points={p.left} fill={b.left} />
                                    <polygon points={p.right} fill={b.right} />
                                    <polygon points={p.top} fill={b.top} />
                                    <polygon points={p.left} fill="url(#hiw-fade)" />
                                    <polygon points={p.right} fill="url(#hiw-fade)" />
                                </g>
                            );
                        })}
                    </svg>

                    {BLOCKS.map((b, i) => {
                        const p = prism(b);
                        const Icon = STEPS[i].icon;
                        return (
                            <span
                                key={b.cx}
                                className="absolute -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
                                style={{ left: `${p.iconLeft}%`, top: `${p.iconTop}%` }}
                                aria-hidden="true"
                            >
                                <Icon className="size-11" strokeWidth={1.6} />
                            </span>
                        );
                    })}

                    <ol>
                        {STEPS.map((s, i) => (
                            <li
                                key={s.title}
                                className="absolute w-[24%] rounded-2xl border border-white/80 bg-white/85 backdrop-blur-sm p-5 shadow-[0_20px_40px_-24px_rgba(15,27,42,0.35)]"
                                style={LAYOUT[i].card}
                            >
                                <div className={`flex items-center gap-3 mb-2 ${LAYOUT[i].align === "right" ? "flex-row-reverse text-right" : ""}`}>
                                    <StepNumber n={i + 1} />
                                    <h3 className="text-xl font-bold tracking-tight">{s.title}</h3>
                                </div>
                                <p className={`text-sm leading-relaxed text-gray-500 ${LAYOUT[i].align === "right" ? "text-right" : ""}`}>{s.body}</p>
                                {s.code && <div className="mt-3"><Snippet /></div>}
                            </li>
                        ))}
                    </ol>
                </div>

                {/* Mobile and tablet: numbered list with a small block per step */}
                <ol className="mt-12 flex flex-col gap-5 lg:hidden">
                    {STEPS.map((s, i) => (
                        <li key={s.title} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5">
                            <span
                                className="shrink-0 grid place-items-center size-14 rounded-xl text-white"
                                style={{ background: `linear-gradient(145deg, ${BLOCKS[i].top}, ${BLOCKS[i].right})` }}
                                aria-hidden="true"
                            >
                                <s.icon className="size-7" strokeWidth={1.6} />
                            </span>
                            <div className="min-w-0 flex flex-col gap-2">
                                <div className="flex items-center gap-2.5">
                                    <StepNumber n={i + 1} />
                                    <h3 className="text-lg font-bold tracking-tight">{s.title}</h3>
                                </div>
                                <p className="text-sm leading-relaxed text-gray-500">{s.body}</p>
                                {s.code && <Snippet />}
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
