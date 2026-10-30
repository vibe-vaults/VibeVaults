/**
 * Main Responsibility: Server-rendered FAQ list built on native <details>
 * (zero JS, every answer in the HTML for crawlers) plus the matching
 * FAQPage JSON-LD. Shared by /pricing, /framer and the /compare pages. Looks
 * the same as the landing page FAQ: numbered hairline rows under a
 * SectionHeading, styled from numbered-row-styles.ts.
 * Sensitive Dependencies: the JSON-LD is generated from the same array as the
 * visible text, so the two cannot drift (Google requires them to match).
 */

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";
import {
    ROW_BODY,
    ROW_HEADER,
    ROW_ICON,
    ROW_NUMBER,
    ROW_TITLE_BASE,
    ROW_TITLE_SIZE,
    rowNumber,
} from "@/components/landing/numbered-row-styles";
import { cn } from "@/lib/utils";

export interface FaqItem {
    question: string;
    answer: string;
}

export function DetailsFaq({ title, kicker, faqs }: { title: ReactNode; kicker?: string; faqs: FaqItem[] }) {
    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
    };

    return (
        <section className="w-full py-24 md:py-28">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <SectionHeading size="lg" kicker={kicker}>
                    {title}
                </SectionHeading>
                <div className="mt-12 border-t border-gray-200">
                    {faqs.map((faq, index) => (
                        <details key={faq.question} className="group border-b border-gray-200">
                            <summary className={cn(ROW_HEADER, "list-none [&::-webkit-details-marker]:hidden")}>
                                <span className={ROW_NUMBER}>{rowNumber(index)}</span>
                                <h3 className={cn(ROW_TITLE_BASE, ROW_TITLE_SIZE.sm, "text-gray-400 group-open:text-gray-900")}>
                                    {faq.question}
                                </h3>
                                <span className={cn(ROW_ICON, "text-gray-400 group-open:text-primary")} aria-hidden="true">
                                    <Plus className="size-6 transition-transform duration-300 group-open:rotate-45" strokeWidth={1.5} />
                                </span>
                            </summary>
                            <p className={cn(ROW_BODY, "max-w-[64ch] pt-2 pb-9 text-[15.5px] leading-relaxed text-gray-500")}>
                                {faq.answer}
                            </p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}
