/**
 * Main Responsibility: /framer/client-sign-off, a public how-to guide for
 * Framer agencies: getting client sign-off in two or three review rounds.
 * Top-of-funnel content for people who are not shopping for a tool yet, so it
 * teaches the process first and uses VibeVaults only as the worked example.
 * Server component, so the whole guide is in the server-rendered HTML.
 *
 * Sensitive Dependencies:
 * - Source text: VibeVaults-claude/content/guides/framer-client-sign-off.md
 *   (the partner version, which also names competitors). This page drops the
 *   competitor disclosure; keep the two in step otherwise.
 * - Framer claims (Site Settings > Code > End of <body>, custom code on every
 *   plan, canvas comments are editor-only) mirror /framer, verified Oct 2026.
 * - Product claims (pins, screenshot, page/browser/device, statuses, review
 *   link, MCP replies and status changes) mirror real behaviour; the AI part
 *   mirrors /docs/ai-agents.
 * - Lives under /framer, so it inherits that prefix's public exemption in
 *   src/lib/supabase/proxy.ts. Listed in sitemap.ts and the footer.
 * - Prose styling is the shared `.docs-prose` class in globals.css.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { ClosingCta } from "@/components/landing/closing-cta";
import { Accent } from "@/components/landing/section-heading";

const TITLE = "How to Get Client Sign-off on a Framer Site in 2-3 Rounds | VibeVaults";
const DESCRIPTION =
    "A step-by-step process for Framer agencies and freelancers: feedback on the live site, a brief per round, two or three focused rounds, one decision-maker and a 24-hour sign-off rule. With templates.";

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "/framer/client-sign-off" },
    openGraph: { title: TITLE, description: DESCRIPTION, url: "/framer/client-sign-off", type: "article" },
};

export default function FramerClientSignOffPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <SiteHeader />

            <main className="flex-1 hero-glow-top">
                <article className="max-w-3xl mx-auto px-4 md:px-8 pt-14 md:pt-24 pb-20">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0B6FB3] mb-6">
                        Guide for Framer agencies and freelancers
                    </p>
                    <h1 className="text-[clamp(36px,5vw,64px)] leading-[1.05] tracking-[-0.03em] font-semibold text-gray-900 text-balance">
                        How to get client sign-off on a Framer site <Accent className="text-[#0B6FB3]">in two or three rounds</Accent>
                    </h1>

                    <div className="docs-prose mt-12 text-[17px]">
                        <p>
                            <strong>The old way:</strong> you send a link and say &ldquo;have a look.&rdquo; Feedback
                            trickles in on WhatsApp, as screenshots in email, and in a call where everyone talks at
                            once. You spend a round just asking &ldquo;which page, which button?&rdquo;, and weeks later
                            you&apos;re still collecting &ldquo;one more small change&rdquo; with no clear approval.
                        </p>
                        <p>
                            <strong>The way faster studios work now:</strong> clients pin comments directly on the live
                            Framer site, every comment arrives with a screenshot and the page it belongs to, each round
                            has a single focus, and sign-off happens automatically 24 hours after the last fixes. You
                            skip the guessing round, and the site goes live in two or three rounds instead of an
                            open-ended back-and-forth.
                        </p>
                        <p>Here is the setup, step by step, with templates you can copy.</p>

                        <h2 id="review-tool">1. Put a review tool on the published site</h2>
                        <p>
                            Framer&apos;s built-in comments live only in the editor; clients can&apos;t comment on the
                            live site. That matters, because the published site is where forms submit, CMS pages load
                            real content, embeds run and interactions behave as visitors will see them.
                        </p>
                        <p>
                            So give the client a review tool that runs on the published site itself. With a script-based
                            tool such as VibeVaults, setup takes a couple of minutes:
                        </p>
                        <ol>
                            <li>
                                Open <strong>Site Settings &rarr; Code</strong> in Framer and paste the snippet into{" "}
                                <strong>End of <code>&lt;body&gt;</code></strong>. Custom code works on every Framer
                                plan, including the free one.
                            </li>
                            <li>
                                Publish. The free <code>.framer.app</code> (or <code>.framer.website</code>) subdomain
                                is fine before the custom domain is connected.
                            </li>
                            <li>
                                Invite the client: either by email, or by sending one review link the whole client team
                                can use. Nobody needs an account or a browser extension.
                            </li>
                        </ol>
                        <p>
                            From then on, a client comment looks like this: a pin on the exact spot, a screenshot taken
                            automatically, and the page, browser and device recorded with it. &ldquo;The header feels
                            off&rdquo; stops being a mystery. The full install steps are in the{" "}
                            <Link href="/docs/quick-start">quick start</Link>.
                        </p>

                        <h2 id="round-brief">2. Send a short brief before every round</h2>
                        <p>
                            The tool removes the &ldquo;where?&rdquo; questions. The brief removes the &ldquo;what are we
                            looking at?&rdquo; questions.
                        </p>
                        <h3>Template: round brief</h3>
                        <blockquote>
                            <p>Hi [Name], round [1] is ready on [staging link].</p>
                            <p>
                                <strong>This round we&apos;re looking at:</strong> [the structure and layout of each
                                page; wording and images come next round].
                            </p>
                            <p>
                                <strong>How:</strong> click the feedback button on the site and pin your comment where
                                you see the problem. Please check it on your phone too.
                            </p>
                            <p>
                                <strong>Who:</strong> everyone on your team is welcome to comment. Where comments
                                disagree, [contact name] makes the final call.
                            </p>
                            <p>
                                <strong>By:</strong> [date].
                            </p>
                        </blockquote>

                        <h2 id="focused-rounds">3. Run two or three focused rounds</h2>
                        <p>
                            Mixed reviews produce long lists where structural problems hide behind typos. Give each round
                            one job:
                        </p>
                        <h3>Round 1: structure</h3>
                        <ul>
                            <li>All pages there, in the right order?</li>
                            <li>Navigation makes sense?</li>
                            <li>Layout right on Desktop, Tablet and Mobile?</li>
                        </ul>
                        <h3>Round 2: content</h3>
                        <ul>
                            <li>Final wording, images and videos?</li>
                            <li>CMS items, links and forms working?</li>
                        </ul>
                        <h3>Round 3: polish (often merged into round 2 on small sites)</h3>
                        <ul>
                            <li>Spacing, typos and mobile details</li>
                            <li>Page titles, descriptions, social images, favicon and 404 page</li>
                        </ul>
                        <p>Comments outside a round&apos;s focus go on a &ldquo;later&rdquo; list instead of reopening the round.</p>

                        <h2 id="one-decides">4. Everyone comments, one person decides</h2>
                        <p>
                            Let the whole client team comment. With pins on the live site, nobody has to collect anything
                            into one list, and you hear from the people who actually notice the problems.
                        </p>
                        <p>
                            What you need is one named person who settles disagreements. When the founder wants the hero
                            bigger and the marketing lead wants it smaller, that person decides, and you build their
                            answer. Several small studios we spoke with insist on a decision-maker like this before work
                            starts. Put it in the proposal, so it never feels like a rule invented halfway through.
                        </p>

                        <h2 id="threads">5. Reply and resolve in the thread</h2>
                        <p>Every pinned comment is its own thread, so handle each one there:</p>
                        <ul>
                            <li>
                                <strong>Reply</strong> with what you did: &ldquo;Done, more space above the footer.&rdquo;
                            </li>
                            <li>
                                <strong>Move its status</strong> (for example open, in progress, in review, completed),
                                so the client sees progress without asking.
                            </li>
                            <li>
                                <strong>Defer</strong> anything out of scope to after launch, and say so in the thread.
                            </li>
                        </ul>
                        <p>At the end of the round, send the client contact one line:</p>
                        <blockquote>
                            <p>Round 2 done: 14 changes made, 2 moved to after launch, 0 open.</p>
                        </blockquote>
                        <p>
                            That line, plus the threads, is your record of what was agreed. It&apos;s what settles an
                            &ldquo;I never asked for that&rdquo; later.
                        </p>

                        <h2 id="sign-off">6. Sign-off: the 24-hour rule</h2>
                        <p>
                            Waiting for a client to reply &ldquo;Approved&rdquo; is how launches slip by weeks. Instead,
                            agree up front that silence after the last round means approval.
                        </p>
                        <h3>Template: last-round message</h3>
                        <blockquote>
                            <p>Hi [Name], all round 3 changes are done: [summary].</p>
                            <p>
                                You have 24 hours to flag anything that blocks the launch. If nothing blocking comes in
                                by [day, time], we&apos;ll treat the site as approved and publish it to [domain].
                            </p>
                            <p>
                                Anything after approval we&apos;ll handle as a new request, so nothing slips into the
                                launch unplanned.
                            </p>
                        </blockquote>
                        <p>
                            Two things keep this fair: announce the rule in your proposal or kickoff, not for the first
                            time at the end, and accept a genuine blocker by phone or email even inside the window.
                            Clients rarely object. It protects their launch date as much as your time.
                        </p>

                        <h2 id="ai">7. Bonus: let your AI tool pick up the reports</h2>
                        <p>
                            If you build with AI help, the review itself can feed it. VibeVaults connects to Claude,
                            Cursor and other AI tools through MCP. Your AI assistant can read a pinned report, with its
                            screenshot, page and console logs, and help fix it, then reply in the thread and update its
                            status if you allow it to. You stay in control of what gets sent to the client. Details are
                            in <Link href="/docs/ai-agents">AI agents</Link>.
                        </p>

                        <h2 id="short-version">The short version</h2>
                        <ol>
                            <li>Put a review tool on the published Framer site; invite the client by link.</li>
                            <li>Send a brief before each round: focus, who decides, deadline.</li>
                            <li>Run two or three rounds: structure, content, polish.</li>
                            <li>Everyone comments; one named person settles disagreements.</li>
                            <li>Reply, update the status, and close each round with a one-line summary.</li>
                            <li>Sign off with the 24-hour rule, announced at kickoff.</li>
                        </ol>
                        <p>
                            Start with the review tool and a named decision-maker on your next Framer project. Those two
                            changes alone remove most of the back-and-forth.
                        </p>
                    </div>
                </article>

                <ClosingCta
                    title="Run your next Framer review round"
                    accent="on the live site."
                    subtitle="14-day free trial. No credit card. Works on Framer's free plan."
                />
            </main>

            <SiteFooter />
        </div>
    );
}
