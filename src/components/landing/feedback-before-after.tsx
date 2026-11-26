"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Camera, CheckCheck, Clock, Monitor, Paperclip, PhoneMissed, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Main Responsibility: The before/after picture in the landing problem section,
 * drawn in code. Left: the same review round scattered across a chat message,
 * an email, a missed call and a text, each styled like the channel it came
 * from. Right: that same feedback pinned on one page, with numbered pins that
 * match the numbered badges on the left. The pieces appear one by one, once,
 * as it scrolls into view.
 *
 * Sensitive Dependencies:
 * - Everything is visible in the server HTML. The hidden "armed" state is only
 *   set on the client while the picture is still below the fold, so without
 *   JavaScript or with reduced motion the finished picture simply shows.
 * - The channel cards borrow each channel's colours only: no logos, product
 *   names or trade dress beyond that.
 * - The threads mirror what a report really carries (pin, screenshot, browser
 *   and device) and use real statuses (In review, In progress, Completed). The
 *   people and messages are invented.
 */

const STEP_MS = 300;

/** One piece of the picture; `order` is its place in the reveal. */
function Reveal({ order, className, children }: { order: number; className?: string; children: ReactNode }) {
    return (
        <div
            style={{ transitionDelay: `${order * STEP_MS}ms` }}
            className={cn(
                "transition-[opacity,translate] duration-500 ease-out group-data-[state=armed]/picture:opacity-0 group-data-[state=armed]/picture:translate-y-4 group-data-[state=armed]/picture:transition-none",
                className
            )}
        >
            {children}
        </div>
    );
}

/** The numbered marker that ties a message on the left to a pin on the right. */
function PinBadge({ n, className }: { n: number; className?: string }) {
    return (
        <span
            className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full rounded-bl-none bg-secondary text-xs font-bold text-white shadow-md ring-2 ring-white",
                className
            )}
        >
            {n}
        </span>
    );
}

/** Badge pinned to the corner of a message card on the left. */
function CornerBadge({ n }: { n: number }) {
    return <PinBadge n={n} className="absolute -right-2 -top-2 z-10" />;
}

function ChatMessage() {
    return (
        <div className="relative w-[78%] -rotate-2">
            <CornerBadge n={1} />
            <div className="overflow-hidden rounded-2xl shadow-lg">
            <div className="flex items-center gap-2.5 bg-[#008069] px-4 py-2.5 text-white">
                <span className="flex size-7 items-center justify-center rounded-full bg-white/25 text-xs font-bold">A</span>
                <span className="text-sm font-semibold">Anna (client&apos;s partner)</span>
            </div>
            <div className="bg-[#EFEAE2] p-3">
                <div className="ml-auto w-[88%] rounded-lg rounded-tr-none bg-[#D9FDD3] p-1.5 shadow-sm">
                    <div aria-hidden="true" className="relative h-20 overflow-hidden rounded-md bg-gray-700 p-2.5">
                        <div className="h-1.5 w-1/3 rounded bg-white/40" />
                        <div className="mt-2 h-1.5 w-2/3 rounded bg-white/25" />
                        <div className="mt-2.5 h-5 w-1/4 rounded bg-white/50" />
                        <div className="absolute left-0 top-[40%] h-11 w-[38%] -rotate-6 rounded-[50%] border-[3px] border-red-500" />
                    </div>
                    <p className="flex items-end justify-between gap-2 px-1 pt-1.5 text-sm text-gray-900">
                        this looks broken
                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                            16:02 <CheckCheck className="size-3.5 text-[#53BDEB]" aria-hidden="true" />
                        </span>
                    </p>
                </div>
            </div>
            </div>
        </div>
    );
}

function EmailMessage() {
    return (
        <div className="relative ml-auto -mt-3 w-[76%] rotate-1 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
            <CornerBadge n={2} />
            <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-[#7C4DFF] text-xs font-bold text-white">M</span>
                <div className="min-w-0 flex-1">
                    <p className="flex items-baseline justify-between gap-2 text-sm font-semibold text-gray-900">
                        Mark, Marketing
                        <span className="shrink-0 text-[11px] font-normal text-gray-400">Fri 15:51</span>
                    </p>
                    <p className="truncate text-xs text-gray-500">Re: Re: Fwd: website feedback v3</p>
                </div>
            </div>
            <p className="mt-3 text-sm text-gray-700">12 changes, see attached. And a smaller hero, please.</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">
                <Paperclip className="size-3 text-red-500" aria-hidden="true" />
                changes_FINAL_v2.docx
            </span>
        </div>
    );
}

function MissedCall() {
    return (
        <div className="relative ml-[3%] -mt-2 w-[70%] -rotate-1 rounded-2xl bg-[#1C1C1E] p-4 text-white shadow-lg">
            <CornerBadge n={2} />
            <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-red-500/20">
                    <PhoneMissed className="size-4 text-red-400" aria-hidden="true" />
                </span>
                <div>
                    <p className="text-sm font-semibold">Missed call &middot; Founder</p>
                    <p className="text-xs text-white/50">Fri 16:40</p>
                </div>
            </div>
            <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-white/10 px-3 py-2">
                <Play className="size-3.5 shrink-0 fill-white" aria-hidden="true" />
                <div aria-hidden="true" className="flex h-4 flex-1 items-center gap-[3px]">
                    {[40, 80, 55, 100, 70, 35, 90, 60, 45, 75, 30, 65].map((h, i) => (
                        <span key={i} className="w-[3px] rounded-full bg-white/60" style={{ height: `${h}%` }} />
                    ))}
                </div>
                <span className="text-[10px] text-white/60">0:42</span>
            </div>
            <p className="mt-2 text-sm text-white/90">&ldquo;Make the hero bigger.&rdquo;</p>
        </div>
    );
}

function TextMessage() {
    return (
        <div className="relative ml-auto -mt-2 w-[72%] rotate-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg">
            <CornerBadge n={3} />
            <p className="pr-6 text-[10px] uppercase tracking-wide text-gray-400">
                Two weeks after launch <span className="whitespace-nowrap">&middot; Mon 09:14</span>
            </p>
            <p className="mt-2 w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900">
                I never asked for that.
            </p>
        </div>
    );
}

type Status = "In review" | "In progress" | "Completed";

const STATUS_STYLE: Record<Status, string> = {
    "In review": "bg-primary/10 text-[#0B6FB3]",
    "In progress": "bg-amber-100 text-amber-800",
    Completed: "bg-emerald-100 text-emerald-700",
};

/** One pinned report under the page mock-up, matching a numbered pin. */
function Thread({ n, status, title, children }: { n: number; status: Status; title: string; children: ReactNode }) {
    return (
        <div className="flex gap-3 border-t border-gray-100 px-5 py-3.5">
            <PinBadge n={n} className="mt-0.5 size-6 ring-0 shadow-none" />
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_STYLE[status])}>
                        {status}
                    </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">{children}</div>
            </div>
        </div>
    );
}

function Meta({ icon: Icon, children }: { icon?: typeof Camera; children: ReactNode }) {
    return (
        <span className="flex items-center gap-1.5">
            {Icon && <Icon className="size-3.5" aria-hidden="true" />}
            {children}
        </span>
    );
}

export function FeedbackBeforeAfter({ className }: { className?: string }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        if (el.getBoundingClientRect().top < window.innerHeight) return;

        el.dataset.state = "armed";
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                el.dataset.state = "shown";
                observer.disconnect();
            },
            { rootMargin: "0px 0px -20% 0px" }
        );
        observer.observe(el);
        return () => {
            observer.disconnect();
            delete el.dataset.state;
        };
    }, []);

    return (
        <div ref={ref} className={cn("group/picture grid lg:grid-cols-2 gap-10 lg:gap-8", className)}>
            <div className="flex flex-col">
                <h3 className="mb-4 text-lg font-semibold tracking-tight text-gray-900">Friday, 4pm</h3>
                <div className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-8">
                    <Reveal order={0}>
                        <ChatMessage />
                    </Reveal>
                    <Reveal order={1}>
                        <EmailMessage />
                    </Reveal>
                    <Reveal order={2}>
                        <MissedCall />
                    </Reveal>
                    <Reveal order={3}>
                        <TextMessage />
                    </Reveal>
                </div>
            </div>

            <div className="flex flex-col">
                <h3 className="mb-4 text-lg font-semibold tracking-tight text-gray-900">The same feedback, pinned</h3>
                <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <div className="relative">
                        <div aria-hidden="true">
                            <div className="flex gap-1.5 border-b border-gray-200 bg-gray-50 px-4 py-3">
                                {[0, 1, 2].map((dot) => (
                                    <span key={dot} className="size-2.5 rounded-full bg-gray-300" />
                                ))}
                            </div>
                            <div className="grid grid-cols-[1.1fr_1fr] gap-5 p-5 sm:p-6">
                                <div>
                                    <div className="h-4 w-4/5 rounded bg-gray-300" />
                                    <div className="mt-2.5 h-4 w-3/5 rounded bg-gray-300" />
                                    <div className="mt-2.5 h-2 w-full rounded bg-gray-200" />
                                    <div className="mt-1.5 h-2 w-4/5 rounded bg-gray-200" />
                                    <div className="mt-4 h-8 w-24 rounded-full bg-primary/25" />
                                </div>
                                <div className="rounded-lg bg-gradient-to-br from-primary/15 to-secondary/15" />
                            </div>
                            <div className="grid grid-cols-3 gap-3 px-5 pb-5 sm:px-6">
                                {[0, 1, 2].map((tile) => (
                                    <div key={tile} className="h-14 rounded-md bg-gray-100" />
                                ))}
                            </div>
                        </div>

                        <Reveal order={4} className="absolute left-[98px] top-[122px] sm:left-[102px] sm:top-[128px]">
                            <PinBadge n={1} />
                        </Reveal>
                        <Reveal order={5} className="absolute right-[18%] top-[66px]">
                            <PinBadge n={2} />
                        </Reveal>
                        <Reveal order={6} className="absolute right-[12%] bottom-[34px]">
                            <PinBadge n={3} />
                        </Reveal>
                    </div>

                    <Reveal order={4}>
                        <Thread n={1} status="In review" title="This looks broken">
                            <Meta icon={Camera}>Screenshot</Meta>
                            <Meta icon={Monitor}>Chrome, macOS</Meta>
                            <Meta icon={Clock}>Fri 16:02</Meta>
                        </Thread>
                    </Reveal>
                    <Reveal order={5}>
                        <Thread n={2} status="In progress" title="Hero: smaller or bigger?">
                            <Meta>Mark: &ldquo;smaller&rdquo; &middot; Founder: &ldquo;bigger&rdquo; &middot; both in one thread</Meta>
                            <Meta icon={Clock}>Fri 16:40</Meta>
                        </Thread>
                    </Reveal>
                    <Reveal order={6}>
                        <Thread n={3} status="Completed" title="Add a pricing table">
                            <Meta>Asked by Anna, Nov 12 &middot; done Nov 14</Meta>
                        </Thread>
                    </Reveal>
                </div>
            </div>
        </div>
    );
}
