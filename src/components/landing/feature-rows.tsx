"use client";

import { useState } from "react";
import Image from "next/image";
import { Columns3, Link2, List, MapPin, MessageSquare, Users, type LucideIcon } from "lucide-react";
import { NumberedRow } from "@/components/landing/numbered-row";
import { Accent, SectionHeading } from "@/components/landing/section-heading";
import { ZoomableImage } from "@/components/zoomable-image";

/**
 * Main Responsibility: "What it does" on the landing page. Six capabilities as
 * large hairline-ruled rows; one is open at a time and shows a short
 * description, the concrete things it covers and, where one exists, a real
 * product screenshot (click to enlarge).
 *
 * Sensitive Dependencies:
 * - Every claim here mirrors real widget/dashboard behaviour. The "Pin &
 *   Screenshot" tags mirror getMetadata() in public/widget.js and
 *   /docs/widget-data; the "Review links" copy mirrors the hosted review gate
 *   and its pause control. Change them when the product changes.
 * - `id="features"` is the target of the header and footer "Features" links.
 * - Screenshots live at /public/screenshots/feature-{slug}.png; `shot.width`
 *   and `shot.height` are the files' real pixel sizes.
 */

type Shot = { slug: string; width: number; height: number };
type Feature = { title: string; icon: LucideIcon; body: string; tags?: string[]; shot?: Shot };

const FEATURES: Feature[] = [
    {
        title: "Pin & Screenshot",
        shot: { slug: "widget", width: 1001, height: 614 },
        icon: MapPin,
        body: "Clients click any element on the live site to drop a pin. Every report arrives with the context a developer needs, captured automatically.",
        tags: ["Screenshot", "Page URL", "Browser & OS", "Screen & viewport", "Console logs", "Failed requests"],
    },
    {
        title: "Real-time threads",
        shot: { slug: "chat", width: 1160, height: 739 },
        icon: MessageSquare,
        body: "Reply right on the page. Threads sync live between the widget and your dashboard, and a reply can carry its own pin when the same issue shows up elsewhere.",
        tags: ["Live replies", "Reply pins", "Attachments", "Email digests"],
    },
    {
        title: "Shared feedback list",
        shot: { slug: "feedback", width: 917, height: 641 },
        icon: List,
        body: "Every reviewer sees what is already reported and where it stands, so the same request does not arrive three times.",
        tags: ["Open", "In progress", "In review", "Completed"],
    },
    {
        title: "Review links",
        icon: Link2,
        body: "Share one link. Guests enter a name and email and land on the site ready to pin. Pause the link any time, or invite clients one by one instead.",
        tags: ["Guest access", "Client invites", "Pause anytime", "Revoke per person"],
    },
    {
        title: "Public boards",
        shot: { slug: "dashboard", width: 995, height: 552 },
        icon: Columns3,
        body: "A read-only board for stakeholders who want progress at a glance without joining anything.",
    },
    {
        title: "Teams & roles",
        shot: { slug: "team", width: 1524, height: 696 },
        icon: Users,
        body: "Owners, members and clients each see what they need, with workspaces per client and notifications that keep everyone in the loop.",
    },
];

function FeatureShot({ title, shot }: { title: string; shot: Shot }) {
    const src = `/screenshots/feature-${shot.slug}.png`;
    const alt = `${title} feature screenshot`;
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
