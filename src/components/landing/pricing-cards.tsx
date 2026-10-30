'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { TIER_DISPLAY, type TierSlug, type BillingInterval } from '@/lib/tier-config';

/** Pre-resolved price ID map, keyed by tier and interval. Pass this from a server
 *  component so the client never reads process.env directly. */
export type PriceIdMap = Record<TierSlug, Record<BillingInterval, string>>;

interface PricingCardsProps {
    defaultInterval?: BillingInterval;
    ctaLabel?: string;
    /** If set, all CTA buttons link to this static URL (e.g. '/auth/register').
     *  If omitted, buttons link to Stripe checkout with the appropriate priceId. */
    staticCtaHref?: string;
    showTrialNote?: boolean;
    currentTier?: TierSlug | null;
    /** Server-resolved Stripe price IDs. Required when staticCtaHref is not set. */
    priceIds?: PriceIdMap;
}

export function PricingCards({
    defaultInterval = 'monthly',
    ctaLabel = 'Get started now',
    staticCtaHref,
    showTrialNote = false,
    currentTier,
    priceIds,
}: PricingCardsProps) {
    const [interval, setInterval] = useState<BillingInterval>(defaultInterval);

    const getHref = (tier: TierSlug, int: BillingInterval) => {
        if (staticCtaHref) return staticCtaHref;
        const priceId = priceIds?.[tier]?.[int] ?? '';
        return `/api/stripe/checkout?priceId=${priceId}`;
    };

    return (
        <div className="w-full">
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-2 mb-10" role="group" aria-label="Billing period">
                {(['monthly', 'yearly'] as const).map((value) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => setInterval(value)}
                        aria-pressed={interval === value}
                        className={`cursor-pointer px-5 py-2 rounded-full text-sm font-semibold transition-colors border flex items-center gap-2 ${
                            interval === value
                                ? 'bg-gray-900 border-gray-900 text-white'
                                : 'bg-white border-gray-300 text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        {value === 'monthly' ? 'Monthly' : 'Yearly'}
                        {value === 'yearly' && (
                            <span className="text-xs font-bold text-secondary">
                                Save 20%
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tier columns: one ruled block, the recommended tier tinted */}
            <div className="grid grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto rounded-2xl border border-gray-200 bg-white overflow-hidden text-left">
                {TIER_DISPLAY.map((tier) => {
                    const isHighlighted = tier.highlighted;
                    const isCurrent = currentTier === tier.slug;
                    const price = interval === 'monthly' ? tier.monthlyPrice : tier.yearlyPricePerMonth;

                    return (
                        <div
                            key={tier.slug}
                            className={`flex flex-col gap-6 p-8 border-b md:border-b-0 md:border-r border-gray-200 last:border-0 ${
                                isHighlighted ? 'bg-linear-to-b from-accent to-white' : ''
                            }`}
                        >
                            <div className="flex items-center justify-between gap-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                                <h3>{tier.name}</h3>
                                {isCurrent ? (
                                    <span className="text-[11px] font-bold text-green-600">Current Plan</span>
                                ) : isHighlighted ? (
                                    <span className="text-[11px] font-bold text-secondary">Recommended</span>
                                ) : null}
                            </div>

                            <div>
                                <span className="text-6xl font-semibold tracking-[-0.04em] tabular-nums text-gray-900">${price}</span>
                                <span className="text-sm text-gray-500"> /mo</span>
                                {interval === 'yearly' && (
                                    <p className="text-xs text-gray-500 mt-2">${tier.yearlyTotal}/yr billed annually</p>
                                )}
                                <p className="text-sm text-gray-500 mt-3">{tier.tagline}</p>
                            </div>

                            <ul className="flex-1 border-t border-gray-200">
                                {tier.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2.5 py-2.5 border-b border-gray-200 text-sm text-gray-700">
                                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {isCurrent ? (
                                <div className="w-full py-3 px-6 rounded-full border border-gray-200 bg-gray-50 text-gray-500 font-semibold text-center text-sm">
                                    Current Plan
                                </div>
                            ) : (
                                <a
                                    href={getHref(tier.slug, interval)}
                                    className={`block w-full py-3 px-6 rounded-full font-bold text-center text-sm transition-colors ${
                                        isHighlighted
                                            ? 'bg-secondary text-white hover:bg-[#D35F12]'
                                            : 'border border-gray-300 text-gray-900 hover:border-primary hover:text-primary'
                                    }`}
                                >
                                    {ctaLabel}
                                </a>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Trial note */}
            {showTrialNote && (
                <p className="text-center text-xs text-gray-500 mt-8 uppercase tracking-[0.14em] font-semibold">
                    14-day free trial &middot; No credit card required
                </p>
            )}
        </div>
    );
}
