/**
 * Main Responsibility: /framer, the platform landing page for agencies that
 * build client sites in Framer. Doubles as the link we send in Framer agency
 * outreach, so it has to make the case and show the install on its own.
 * Server component, so all copy is in the server-rendered HTML for SEO.
 *
 * Sensitive Dependencies:
 * - Claims about Framer itself (canvas comments are for project members,
 *   custom code is available on the free plan, the snippet goes in Site
 *   Settings > Code > End of <body>, and the widget follows Framer's page
 *   changes) were verified on a real Framer site in October 2026.
 *   Re-verify before editing them.
 * - The embed snippet must match what `embed-widget-card.tsx` generates, the
 *   same coupling as `/docs/quick-start`.
 * - Feature claims mirror real widget behaviour (pins, captured context,
 *   statuses, review link, invite-only visibility, SPA navigation). If one of
 *   those changes, this page goes stale silently.
 * - Public route: excluded from the auth gate in `src/lib/supabase/proxy.ts`.
 */

import type { Metadata } from "next";
import Image from "next/image";
import {
    Camera,
    EyeOff,
    Link2,
    MapPin,
    MessagesSquare,
    Route,
} from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { PricingCards } from "@/components/landing/pricing-cards";
import { TrustStrip } from "@/components/landing/trust-strip";
import { DetailsFaq, type FaqItem } from "@/components/landing/details-faq";
import { GradientCta } from "@/components/landing/gradient-cta";
import { HeroCtas } from "@/components/landing/hero-ctas";

const TITLE = "Client Feedback for Framer Sites | VibeVaults";
const DESCRIPTION =
    "Let clients pin feedback on your live Framer site, not the canvas. No Framer seat or account for clients, works on the free plan, unlimited clients on every VibeVaults plan.";

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "/framer" },
    openGraph: { title: TITLE, description: DESCRIPTION, url: "/framer" },
};

const SNIPPET = `<script src="https://www.vibe-vaults.com/widget.js" data-key="YOUR_PROJECT_KEY" async></script>`;

const gaps = [
    {
        title: "Comments live on the canvas",
        body: "Framer's built-in comments sit in the editor, on the design. Your client is reviewing the published site: real fonts, real load times, real breakpoints. That is where their feedback belongs.",
    },
    {
        title: "Clients need project access",
        body: "To comment in Framer, a client has to be invited into the project. Most clients will not learn an editor to tell you a heading is too big. They send a screenshot in an email instead.",
    },
    {
        title: "Feedback without context",
        body: "\"The button is broken\" on which page, which browser, which screen size? Without that, every report starts with a round of questions before anyone can fix anything.",
    },
];

const steps = [
    {
        title: "Create a project in VibeVaults",
        body: "Add your client's Framer site URL. The free framer.website address works fine for staging.",
    },
    {
        title: "Paste the snippet into Framer",
        body: "Open Site Settings, then Code, and paste the snippet into the End of <body> field. Custom code is available on every Framer plan, including the free one.",
    },
    {
        title: "Publish and invite your client",
        body: "Custom code runs on the published site, not in the canvas preview, so publish once. VibeVaults detects the widget, and you send your client one review link.",
    },
];

const features = [
    {
        icon: MapPin,
        title: "Pinned to the exact spot",
        body: "Clients click anywhere on the live page and drop a pin. Pins stay attached to the element as the layout reflows across breakpoints.",
    },
    {
        icon: Camera,
        title: "Context captured automatically",
        body: "Every report carries a screenshot, the page URL, browser, OS, viewport, recent console logs and failed network requests.",
    },
    {
        icon: MessagesSquare,
        title: "A real-time thread per pin",
        body: "Reply on the spot and move each report from open to in progress, in review and completed, so clients stop asking whether it was fixed.",
    },
    {
        icon: Link2,
        title: "One review link, no account",
        body: "Clients enter a name and email and they are in. No Framer seat, no signup, no browser extension.",
    },
    {
        icon: EyeOff,
        title: "Invisible to visitors",
        body: "Only people you invited, or who opened the site through your review link, see the widget. Your client's customers never do, so it can stay on a live site.",
    },
    {
        icon: Route,
        title: "Follows Framer's page changes",
        body: "Framer switches pages without a full reload. The widget follows along, and each page, including CMS item pages, shows only its own pins.",
    },
];

const faqs: FaqItem[] = [
    {
        question: "Does VibeVaults work on Framer's free plan?",
        answer: "Yes. Framer allows custom code on every plan, including the free one, and VibeVaults only needs one script tag. You can collect feedback on a free framer.website staging site before the client pays for hosting.",
    },
    {
        question: "Do my clients need a Framer account or seat?",
        answer: "No. Clients open your review link, enter their name and email, and leave feedback on the published site. They never touch the Framer editor, so you never pay for a seat for them.",
    },
    {
        question: "How is this different from Framer's built-in comments?",
        answer: "Framer's comments are for people working inside the project and point at the design on the canvas. VibeVaults collects feedback on the published site, from clients who are not in the project, and attaches a screenshot, browser details, console logs and failed requests to every report.",
    },
    {
        question: "Will site visitors see the widget?",
        answer: "No. The widget is only visible to people you invited and to those who opened the site through your shareable review link. Everyone else sees your site as usual, so the widget can stay installed after launch for ongoing feedback.",
    },
    {
        question: "Does it slow down my Framer site?",
        answer: "The script loads asynchronously, so it does not block your page from rendering, and for ordinary visitors it stays hidden.",
    },
    {
        question: "Where do I paste the code in Framer?",
        answer: "Open Site Settings, then Code, and paste the snippet into the End of <body> field. Save and publish. The snippet applies to every page of the site.",
    },
    {
        question: "How much does it cost?",
        answer: "Every plan starts with a 14-day free trial, no credit card required. Client reviewers and feedback are unlimited on every plan, so inviting more people to review never changes your bill. Plans differ in how many projects (client sites) and team members they include.",
    },
];

export default function FramerPage() {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <SiteHeader />

            <main className="flex-1">
                {/* Hero */}
                <section className="max-w-4xl mx-auto px-4 md:px-8 pt-20 pb-16 text-center">
                    <span className="inline-block text-sm font-bold uppercase tracking-wider text-primary mb-4">
                        For Framer agencies and freelancers
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6 text-gray-900">
                        Client feedback on your live Framer site, not on the canvas
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 max-w-3xl mx-auto mb-10 leading-relaxed">
                        Your clients pin comments straight onto the published page, and every report arrives with a
                        screenshot and the technical details you need. No Framer seat, no account, no extension.
                    </p>
                    <HeroCtas />
                </section>

                {/* Product shot */}
                <section className="max-w-5xl mx-auto px-4 md:px-8 pb-20">
                    <figure>
                        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-2xl shadow-primary/10">
                            <Image
                                src="/screenshots/feature-widget.png"
                                alt="The VibeVaults feedback widget open on a live website, with a screenshot attached to a client's feedback message"
                                width={1001}
                                height={614}
                                priority
                                className="block w-full h-auto"
                            />
                        </div>
                        <figcaption className="mt-4 text-center text-sm text-gray-500">
                            What your client sees on the published site. The same widget runs on any Framer site.
                        </figcaption>
                    </figure>
                </section>

                {/* The gap */}
                <section className="bg-gray-50 py-20">
                    <div className="max-w-6xl mx-auto px-4 md:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900">
                                Framer is built for designing, not for client reviews
                            </h2>
                            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                                Framer collaboration is great inside your team. Once the client gets involved, feedback
                                scatters across email, Slack and calls.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            {gaps.map((gap) => (
                                <div key={gap.title} className="rounded-2xl border-2 border-gray-200 bg-white p-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{gap.title}</h3>
                                    <p className="text-gray-500 leading-relaxed">{gap.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Install */}
                <section id="install" className="max-w-5xl mx-auto px-4 md:px-8 py-20 scroll-mt-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900">
                            Live on your Framer site in three steps
                        </h2>
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                            One script tag. Nothing to install in Framer, nothing for your client to install.
                        </p>
                    </div>
                    <ol className="grid md:grid-cols-3 gap-6 mb-10">
                        {steps.map((step, i) => (
                            <li
                                key={step.title}
                                className="rounded-2xl border-2 border-gray-200 bg-white p-8 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                            >
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-extrabold mb-4">
                                    {i + 1}
                                </span>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{step.body}</p>
                            </li>
                        ))}
                    </ol>
                    <div className="rounded-2xl bg-gray-900 p-6 shadow-xl">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                            The snippet (your project key is filled in for you in the dashboard)
                        </div>
                        <pre className="overflow-x-auto text-sm text-green-300">
                            <code>{SNIPPET}</code>
                        </pre>
                    </div>
                </section>

                {/* Features */}
                <section className="bg-gray-50 py-20">
                    <div className="max-w-6xl mx-auto px-4 md:px-8">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12 text-gray-900">
                            Everything a feedback round needs
                        </h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map(({ icon: Icon, title, body }) => (
                                <div
                                    key={title}
                                    className="rounded-2xl border-2 border-gray-200 bg-white p-8 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                                >
                                    <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary mb-4">
                                        <Icon className="w-5 h-5" />
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                                    <p className="text-gray-500 leading-relaxed">{body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing */}
                <section className="max-w-7xl mx-auto px-4 md:px-8 py-20">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900">
                            Pay per plan, never per reviewer
                        </h2>
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                            Invite as many client reviewers as each project needs, at no extra cost. Plans differ in how many projects and team members they include.
                        </p>
                    </div>
                    <PricingCards ctaLabel="Start your 14-day trial" staticCtaHref="/auth/register" showTrialNote />
                    <TrustStrip className="mt-6" />
                </section>

                <DetailsFaq title="VibeVaults for Framer FAQ" faqs={faqs} />

                <GradientCta
                    title="Run your next Framer feedback round on the live site"
                    subtitle="14-day free trial. No credit card. Works on Framer's free plan."
                />
            </main>

            <SiteFooter />
        </div>
    );
}
