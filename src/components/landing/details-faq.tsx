/**
 * Main Responsibility: Server-rendered FAQ list built on native <details>
 * (zero JS, every answer in the HTML for crawlers) plus the matching
 * FAQPage JSON-LD. Shared by the /compare pages and the /framer page.
 * Sensitive Dependencies: the JSON-LD is generated from the same array as the
 * visible text, so the two cannot drift (Google requires them to match).
 */

import { ChevronDown } from "lucide-react";

export interface FaqItem {
    question: string;
    answer: string;
}

export function DetailsFaq({ title, faqs }: { title: string; faqs: FaqItem[] }) {
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
        <section className="max-w-3xl mx-auto px-4 md:px-8 py-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12">{title}</h2>
            <div className="flex flex-col gap-4">
                {faqs.map((faq) => (
                    <details
                        key={faq.question}
                        className="group rounded-2xl border-2 border-gray-200 bg-white open:border-primary/30 open:shadow-lg open:shadow-primary/5 transition-colors"
                    >
                        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center justify-between gap-4 px-6 py-5 text-base md:text-lg font-bold text-gray-900">
                            {faq.question}
                            <ChevronDown className="w-5 h-5 shrink-0 text-gray-400 transition-transform duration-300 group-open:rotate-180 group-open:text-primary" />
                        </summary>
                        <p className="px-6 pb-6 text-gray-500 leading-relaxed">{faq.answer}</p>
                    </details>
                ))}
            </div>
        </section>
    );
}
