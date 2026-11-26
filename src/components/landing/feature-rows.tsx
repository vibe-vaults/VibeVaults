"use client";

import { useState } from "react";
import Image from "next/image";
import { Columns3, Link2, List, MapPin, MessageSquare, Users, type LucideIcon } from "lucide-react";
import { NumberedRow } from "@/components/landing/numbered-row";
import { Accent, SectionHeading } from "@/components/landing/section-heading";
import { ZoomableImage } from "@/components/zoomable-image";

/**
 * Main Responsibility: "What it does" on the landing page. Six capabilities as
 * large hairline-ruled rows, each titled with the buyer's problem in their own
 * words rather than the feature name; one is open at a time and shows a short
 * description, the concrete things it covers and, where one exists, a real
 * product screenshot (click to enlarge).
 *
 * Sensitive Dependencies:
 * - Every claim here mirrors real widget/dashboard behaviour. The first row's
 *   tags mirror getMetadata() in public/widget.js and
 *   /docs/widget-data; the review-link row mirrors the hosted review gate
 *   and its pause control. Change them when the product changes.
 * - `id="features"` is the target of the header and footer "Features" links.
 * - Screenshots live at /public/screenshots/feature-{slug}.png; `shot.width`
 *   and `shot.height` are the files' real pixel sizes.
 */

type Shot = { slug: string; width: number; height: number };
type Feature = { title: string; icon: LucideIcon; body: string; tags?: string[]; shot?: Shot };

const FEATURES: Feature[] = [
    {
        title: "Know exactly what they mean",
        shot: { slug: "widget", width: 1001, height: 614 },
        icon: MapPin,
        body: "No more \u201cthe thing on the left looks off\u201d. Clients click the spot on the live site and drop a pin. The screenshot, page, browser and device come with it, plus the console errors your developer would ask for.",
        tags: ["Screenshot", "Page URL", "Browser & OS", "Screen & viewport", "Console logs", "Failed requests"],
    },
    {
        title: "Answer right where the comment is",
        shot: { slug: "chat", width: 1160, height: 739 },
        icon: MessageSquare,
        body: "No more digging through WhatsApp and email for what was said. Every comment is its own thread, live in the widget and your dashboard. If the same issue shows up on another page, a reply can pin it there too.",
        tags: ["Live replies", "Reply pins", "Attachments", "Email digests"],
    },
    {
        title: "No more duplicate requests",
        shot: { slug: "feedback", width: 917, height: 641 },
        icon: List,
        body: "Everyone on the client side sees what\u2019s already reported and where it stands, so the marketing lead doesn\u2019t resend what the founder already flagged.",
        tags: ["Open", "In progress", "In review", "Completed"],
    },
    {
        title: "No new account for your clients",
        shot: { slug: "review-link", width: 1105, height: 248 },
        icon: Link2,
        body: "Send one link. Reviewers type a name and email and land on the site ready to pin, with no login and no extension. Pause the link any time, or invite clients one by one.",
        tags: ["Guest access", "Client invites", "Pause anytime", "Revoke per person"],
    },
    {
        title: "Progress without chasing",
        shot: { slug: "dashboard", width: 995, height: 552 },
        icon: Columns3,
        body: "A read-only board shows the client\u2019s boss what\u2019s done and what\u2019s next, without joining anything.",
    },
    {
        title: "One workspace per client",
        shot: { slug: "team", width: 1524, height: 696 },
        icon: Users,
        body: "Keep each client\u2019s sites, feedback and people apart. Add your team where they\u2019re needed; clients only ever see their own site.",
    },
];

function FeatureShot({ title, shot }: { title: string; shot: Shot }) {
    const src = `/screenshots/feature-${shot.slug}.png`;
    const alt = `Product screenshot: ${title}`;
    return (
        <ZoomableImage
            src={src}
            alt={alt}
            className="group relative block w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 cursor-zoom-in"
        >
            <Image
                src={src}
                alt={alt}
                width={shot.width}
                height={shot.height}
                sizes="(min-width: 1024px) 640px, 100vw"
                className="w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
            />
        </ZoomableImage>
    );
}

export function FeatureRows() {
    const [open, setOpen] = useState<number | null>(0);

    return (
        <section id="features" className="w-full py-24 md:py-32 scroll-mt-20">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <SectionHeading kicker="From the first pin to the final sign-off, in one thread.">
                    <Accent>What it does</Accent>
                </SectionHeading>

                <div className="mt-14 border-t border-gray-200">
                    {FEATURES.map((f, i) => (
                        <NumberedRow
                            key={f.title}
                            index={i}
                            title={f.title}
                            icon={<f.icon className="size-6" strokeWidth={1.5} />}
                            open={open === i}
                            onToggle={() => setOpen(open === i ? null : i)}
                        >
                            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-8 lg:gap-12 items-start">
                                <div className="flex flex-col gap-6">
                                    <p className="max-w-[56ch] text-[15.5px] leading-relaxed text-gray-500">{f.body}</p>
                                    {f.tags && (
                                        <ul className="grid grid-cols-2 gap-x-8 gap-y-3 max-w-md text-xs uppercase tracking-[0.1em] text-gray-900">
                                            {f.tags.map((t) => (
                                                <li key={t}>{t}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                {f.shot && <FeatureShot title={f.title} shot={f.shot} />}
                            </div>
                        </NumberedRow>
                    ))}
                </div>
            </div>
        </section>
    );
}
