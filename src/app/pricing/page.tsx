import { Check, X } from 'lucide-react';
import { PricingCards } from '@/components/landing/pricing-cards';
import { SiteHeader } from '@/components/landing/site-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { FEATURE_COMPARISON } from '@/lib/tier-config';
import { DetailsFaq, type FaqItem } from '@/components/landing/details-faq';
import { ClosingCta } from '@/components/landing/closing-cta';
import { TrustStrip } from '@/components/landing/trust-strip';
import { Accent, SectionHeading } from '@/components/landing/section-heading';

export const metadata = {
    title: 'Pricing — VibeVaults',
    description: 'Simple, transparent pricing for teams of all sizes. Start with a 14-day free trial.',
};

const faqs: FaqItem[] = [
    {
        question: 'What happens during the 14-day trial?',
        answer: 'You get full access to Pro features for 14 days, no credit card required. At the end of your trial, choose the plan that fits your team.',
    },
    {
        question: 'What happens when I upgrade during an already paid subscription?',
        answer: 'We charge the new price only for the remaining time in your current billing period. You get immediate access to the higher tier, with no double-charging.',
    },
    {
        question: 'What happens when I downgrade? Will I lose access to my current tier?',
        answer: 'No. You keep full access to your current tier until the end of your billing cycle. The downgrade takes effect on your next renewal, and your existing data is always preserved.',
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards through Stripe. For annual billing, you save 20% compared to monthly pricing.',
    },
    {
        question: 'Is there a free plan?',
        answer: "We don't offer a free plan, but every account starts with a 14-day free trial with full Pro features so you can evaluate VibeVaults risk-free.",
    },
];

const TIERS = ['starter', 'pro', 'business'] as const;

export default function PricingPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <SiteHeader />

            <main className="flex-1 hero-glow-top">
                {/* Hero + Cards */}
                <section className="max-w-7xl mx-auto px-4 md:px-8 pt-14 md:pt-24 pb-24">
                    <SectionHeading
                        as="h1"
                        className="mb-12"
                        kicker="Choose the plan that fits your team. All plans include a 14-day free trial with Pro features."
                    >
                        <Accent>Simple,</Accent> transparent pricing
                    </SectionHeading>
                    <PricingCards
                        ctaLabel="Get started now"
                        staticCtaHref="/auth/register"
                        showTrialNote={true}
                    />
                    <TrustStrip className="mt-6" />
                </section>

                {/* Feature comparison table */}
                <section id="comparison" className="w-full bg-gray-50 border-y border-gray-200 py-24 md:py-28 scroll-mt-20">
                    <div className="max-w-7xl mx-auto px-4 md:px-8">
                        <SectionHeading size="lg" className="mb-12">
                            Full feature <Accent>comparison</Accent>
                        </SectionHeading>
                        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-4 px-5 font-semibold text-gray-500 uppercase text-xs tracking-[0.14em]">
                                            Feature
                                        </th>
                                        {TIERS.map((tier) => (
                                            <th
                                                key={tier}
                                                className={`text-center py-4 px-5 font-semibold uppercase text-xs tracking-[0.14em] ${
                                                    tier === 'pro' ? 'text-primary bg-accent' : 'text-gray-900'
                                                }`}
                                            >
                                                {tier}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {FEATURE_COMPARISON.map((feature, i) => (
                                        <tr key={i} className="border-b border-gray-200 last:border-b-0">
                                            <td className="py-4 px-5 text-gray-700 font-medium">
                                                {feature.label}
                                            </td>
                                            {TIERS.map((tier) => {
                                                const value = feature[tier];
                                                return (
                                                    <td key={tier} className={`text-center py-4 px-5 ${tier === 'pro' ? 'bg-accent/50' : ''}`}>
                                                        {value === true ? (
                                                            <Check className="w-5 h-5 text-primary mx-auto" aria-label="Included" />
                                                        ) : value === false ? (
                                                            <X className="w-5 h-5 text-gray-300 mx-auto" aria-label="Not included" />
                                                        ) : (
                                                            <span className="text-gray-700 font-medium">{value}</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <DetailsFaq
                    title={<><Accent>Questions</Accent> about billing</>}
                    kicker="Trials, upgrades, downgrades and payment."
                    faqs={faqs}
                />

                <ClosingCta
                    title="Start your next feedback round"
                    accent="today."
                    subtitle="14-day free trial, no credit card required. Unlimited clients on every plan."
                />
            </main>

            <SiteFooter />
        </div>
    );
}
