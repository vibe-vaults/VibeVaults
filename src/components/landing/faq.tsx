"use client";

/**
 * Main Responsibility: Landing page FAQ section with accordion UI and
 * FAQPage JSON-LD structured data for SEO/GEO. Answers stay mounted in the
 * DOM when collapsed (NumberedRow animates grid rows, it never unmounts) so
 * crawlers always see the full text in the server-rendered HTML.
 * Sensitive Dependencies: Answer copy must stay in sync with pricing
 * ($29/$49/$149, 14-day trial) and the JSON-LD below must mirror the
 * visible Q&A text exactly per Google's structured data guidelines.
 */

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { NumberedRow } from "@/components/landing/numbered-row";
import { Accent, SectionHeading } from "@/components/landing/section-heading";

/**
 * `link` makes one substring of the answer clickable. The JSON-LD below still
 * uses the raw `answer` string, so the structured data mirrors the visible text
 * exactly, as Google requires.
 */
const faqs: { question: string; answer: string; link?: { match: string; href: string } }[] = [
    {
        question: "What is VibeVaults?",
        answer: "VibeVaults is a visual feedback widget for websites. It lets your clients click on any part of a live website and leave feedback exactly where it belongs, with a screenshot and technical details captured automatically. Agencies use it to replace scattered email threads, vague screenshots, and endless revision calls with one clear feedback stream.",
    },
    {
        question: "Who is VibeVaults for?",
        answer: "VibeVaults is built for web agencies, dev studios, and freelancers who build websites for clients. If you run feedback rounds with clients on the sites you build, from staging to launch, VibeVaults is designed for you. It is not a survey tool or a bug tracker for end users; it is a client collaboration tool for the people who build and review websites.",
    },
    {
        question: "Does VibeVaults work on all websites?",
        answer: "Yes. VibeVaults works on any website where you can add a single script tag, including WordPress, Webflow, Framer, Shopify, React, and plain HTML sites. There are no plugins to maintain and no browser extensions for anyone to install.",
    },
    {
        question: "How easy is it to set up?",
        answer: "Setup takes minutes. You create a project in your dashboard, paste one script tag into the website's code, and send your client the project's review link. They enter their name and email, land on the site, and can start leaving feedback right away. If you prefer per-client control, you can also invite clients individually by email.",
    },
    {
        question: "Do clients need an account?",
        answer: "No. Clients never create an account, set a password, or install anything. They open the review link (or an email invite) and the feedback widget appears on the site. You also never pay per client: every plan includes unlimited clients and unlimited feedback.",
    },
    {
        question: "How much does VibeVaults cost?",
        answer: "VibeVaults starts at $29/month for the Starter plan, $49/month for Pro, and $149/month for Business. Yearly billing saves 20%. Every plan starts with a 14-day free trial, no credit card required. There is no free tier, and there are never per-client or per-feedback fees.",
    },
    {
        question: "What does the widget collect from my client's site?",
        answer: "With each report the widget attaches the page URL, browser and screen details, a screenshot, the last 50 console log entries, and any failed network requests, so a bug arrives with the context a developer needs. Query strings are stripped from recorded request URLs before anything leaves the browser, because they often carry access tokens and email addresses. The widget never records keystrokes, form contents, request bodies, or a session replay. The full detail is documented at vibe-vaults.com/docs/widget-data.",
        link: { match: "vibe-vaults.com/docs/widget-data", href: "/docs/widget-data" },
    },
    {
        question: "Can my AI coding tool read and fix the feedback?",
        answer: "Yes. VibeVaults runs an MCP server, so Claude Code, Claude, Cursor and other MCP-ready tools can read your clients' reports, including the pin location, the page, console logs, failed requests and screenshots. Every connection starts read-only; you decide per connection whether it may also reply and change status. It is included on every plan and the trial, and setup is described at vibe-vaults.com/docs/ai-agents.",
        link: { match: "vibe-vaults.com/docs/ai-agents", href: "/docs/ai-agents" },
    },
    {
        question: "Can I integrate VibeVaults with my project management tools?",
        answer: "Not yet. Today, all feedback lives in the VibeVaults dashboard, where your whole team can view, discuss, and resolve it. Direct integrations with project management tools are on our roadmap. As an early customer you can tell us which integration to build first.",
    },
];

/**
 * Renders an answer, turning `link.match` into an internal link when present.
 * Splits on the literal substring so the surrounding copy — and therefore the
 * JSON-LD text — stays byte-identical to what a reader sees.
 */
function renderAnswer(faq: (typeof faqs)[number]) {
    if (!faq.link) return faq.answer;
    const [before, ...rest] = faq.answer.split(faq.link.match);
    if (rest.length === 0) return faq.answer;
    return (
        <>
            {before}
            <Link href={faq.link.href} className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">
                {faq.link.match}
            </Link>
            {rest.join(faq.link.match)}
        </>
    );
}

const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
        },
    })),
};

export const Faq = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section id="faq" className="py-24 md:py-32 w-full bg-white scroll-mt-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <SectionHeading kicker="Everything you need to know about collecting visual feedback with VibeVaults.">
                    <Accent>Questions</Accent>
                </SectionHeading>

                <div className="mt-14 border-t border-gray-200">
                    {faqs.map((faq, index) => (
                        <NumberedRow
                            key={faq.question}
                            index={index}
                            title={faq.question}
                            icon={<Plus className={`size-6 transition-transform duration-300 ${openIndex === index ? "rotate-45" : ""}`} strokeWidth={1.5} />}
                            open={openIndex === index}
                            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                            size="sm"
                        >
                            <p className="max-w-[64ch] text-[15.5px] leading-relaxed text-gray-500">{renderAnswer(faq)}</p>
                        </NumberedRow>
                    ))}
                </div>
            </div>
        </section>
    );
};
