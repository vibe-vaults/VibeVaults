import { FeedbackBeforeAfter } from "@/components/landing/feedback-before-after";
import { Accent, SectionHeading } from "@/components/landing/section-heading";

/**
 * Main Responsibility: Landing page section that names the problem before the
 * product is explained: the before/after picture, then the cost in money.
 *
 * Sensitive Dependencies:
 * - The scene in the picture is invented. Never attribute it to a customer or
 *   present it as a case study.
 */
export function ProblemSection() {
    return (
        <section className="w-full py-24 md:py-32">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <SectionHeading size="lg">
                    Feedback arrives everywhere <Accent>except on the site</Accent>
                </SectionHeading>

                <FeedbackBeforeAfter className="mt-12" />

                <p className="mt-14 max-w-3xl text-2xl md:text-3xl leading-snug tracking-tight text-gray-900 text-balance">
                    Every extra review round is work you don&apos;t get paid for, and the invoice waits until the client
                    signs off.
                </p>
            </div>
        </section>
    );
}
