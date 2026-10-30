import Link from "next/link";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { Hero } from "@/components/landing/hero";
import { StatsStrip } from "@/components/landing/stats-strip";
import { McpAgents } from "@/components/landing/mcp-agents";
import { FeatureRows } from "@/components/landing/feature-rows";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ROICalculator } from "@/components/landing/roi-calculator";
import { FounderNote } from "@/components/landing/founder-note";
import { PricingCards } from "@/components/landing/pricing-cards";
import { Faq } from "@/components/landing/faq";
import { TrustStrip } from "@/components/landing/trust-strip";
import { ClosingCta } from "@/components/landing/closing-cta";
import { Accent, SectionHeading } from "@/components/landing/section-heading";
import { SETUP_CALL_URL } from "@/lib/contact-links";

/**
 * Main Responsibility: The landing page. Sections alternate between light and
 * dark navy bands as the page scrolls: light hero and facts, dark AI
 * agents (MCP), light capabilities and setup, dark founder note, the ROI card
 * (light inputs, navy results), light pricing and FAQ, dark closing CTA.
 *
 * Sensitive Dependencies:
 * - Anchors #features, #how-it-works, #pricing and #faq are linked from
 *   SiteHeader and SiteFooter.
 * - The SoftwareApplication JSON-LD prices must match tier-config.ts.
 */
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex flex-col items-center">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "VibeVaults",
              "operatingSystem": "Web",
              "applicationCategory": "BusinessApplication",
              "description": "VibeVaults is a visual feedback widget for websites. The feedback tool for modern agencies: collect visual feedback directly on client sites, from staging to launch, share progress, and ship faster.",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": "29.00",
                "highPrice": "149.00",
                "priceCurrency": "USD",
                "offerCount": 3
              }
            })
          }}
        />

        <Hero />
        <StatsStrip />

        {/* Product demo video: hidden temporarily (Oct 30, 2026) until the outdated
            recording is replaced. Bring it back by restoring this block:
        <div id="demo" className="w-full">
          <ProductDemo videoUrl="https://www.youtube-nocookie.com/embed/<NEW_ID>?rel=0&modestbranding=1&autoplay=1&mute=1&playsinline=1&loop=1&playlist=<NEW_ID>" />
        </div>
        */}

        {/* AI agents (MCP): the lever that gets feedback resolved, not just collected */}
        <McpAgents />

        <FeatureRows />
        <HowItWorks />

        <FounderNote />

        {/* ROI Calculator: right before pricing for final justification */}
        <ROICalculator />

        {/* Pricing */}
        <section id="pricing" className="py-24 md:py-32 w-full scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <SectionHeading className="mb-12" kicker="Unlimited clients and feedback on every plan. Scale up as you grow.">
              <Accent>Simple</Accent> pricing
            </SectionHeading>
            <PricingCards
              ctaLabel="Start free trial"
              staticCtaHref="/auth/register"
              showTrialNote={true}
            />
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-x-8 gap-y-3 text-sm">
              <Link
                href="/pricing#comparison"
                className="inline-flex items-center gap-1.5 font-semibold text-gray-500 hover:text-primary transition-colors"
              >
                Compare all features
                <span aria-hidden="true">&rarr;</span>
              </Link>
              <p className="text-gray-500">
                Not sure which plan fits?{" "}
                <a
                  href={SETUP_CALL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline"
                >
                  Book a 15-min setup call
                </a>
              </p>
            </div>
            <TrustStrip className="mt-8" />
          </div>
        </section>

        <Faq />

        <ClosingCta
          title="Start your next feedback round"
          accent="today."
          subtitle="Every pin, screenshot and reply in one place. 14-day free trial, no credit card required."
        />
      </main>

      <SiteFooter />
    </div>
  );
}
