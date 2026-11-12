/**
 * Main Responsibility: Support-deflection page — the recurring "why is the
 * widget not showing" style questions and their fixes, ordered by how often
 * they actually come up.
 *
 * Sensitive Dependencies:
 * - Answers must match real behaviour: invite-only visibility, per-device
 *   tokens, trial gating in `validateApiKey()`, completed feedback hidden from
 *   the widget (`/api/widget/feedback` filters `status = completed`).
 * - The `#strict-csp` policy mirrors every host and inline construct
 *   `public/widget.js` uses: its own origin (script + API + SSE), the snapdom
 *   script on cdn.jsdelivr.net, presigned PUTs and attachment images on the
 *   Supabase Storage origin, data:/blob: images for screenshots and previews,
 *   and the inline <style> element + style attributes in its shadow root.
 *   Hosts are derived from env vars; a new host or construct in the widget
 *   must be added here.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { DocsPageHeader } from "@/components/docs/docs-page-header";
import { DocsPageFooter } from "@/components/docs/docs-page-footer";
import { getDocPage } from "@/lib/docs-data";

const page = getDocPage("troubleshooting")!;

// Derived rather than typed out, so the policy below always names the hosts
// this deployment actually serves the widget, its API and its storage from.
const appOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL!).origin;
const storageOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
const cspSnippet = [
    `script-src ${appOrigin} https://cdn.jsdelivr.net`,
    `connect-src ${appOrigin} ${storageOrigin}`,
    `img-src ${storageOrigin} data: blob:`,
    `style-src 'unsafe-inline'`,
].join("\n");

export const metadata: Metadata = {
    title: page.title,
    description: page.summary,
};

export default function TroubleshootingDoc() {
    return (
        <>
            <DocsPageHeader title={page.title} summary={page.summary} />

            <div className="docs-prose">
                <h2 id="widget-not-appearing">The widget is not appearing</h2>
                <p>Almost always one of these five, in this order:</p>
                <ul>
                    <li>
                        <strong>Nobody has invited that person yet.</strong> The widget is invisible to anyone without access.
                        This is by design, not a fault.
                    </li>
                    <li>
                        <strong>They are on a different device or browser.</strong> Access is per device. They need to open
                        their invite link on the machine they are actually using. The same link works everywhere and can be
                        reused.
                    </li>
                    <li>
                        <strong>They cleared their browser data.</strong> That removes the stored access. They can get a fresh
                        link at <Link href="/access">vibe-vaults.com/access</Link>.
                    </li>
                    <li>
                        <strong>The script tag is missing on that page.</strong> Check the page source for{" "}
                        <code>widget.js</code>. Site builders sometimes apply custom code to the homepage only, or drop it from
                        cached or AMP versions of a page.
                    </li>
                    <li>
                        <strong>Your trial ended without a subscription.</strong> The widget switches off across all your
                        projects at once. If it vanished for everybody on the same day, check billing first.
                    </li>
                </ul>

                <h2 id="wrong-site">The widget shows on the wrong site, or not after deploy</h2>
                <p>
                    Each project key is tied to one website address. If you moved the site to a new domain, update the
                    project&apos;s website address in its settings, otherwise the access links you send will point at the old
                    place.
                </p>
                <p>
                    After a deploy, the browser picks up the current widget version on the next page load. Someone who left a
                    tab open across your deploy should refresh it.
                </p>

                <h2 id="strict-csp">The site has a strict Content Security Policy</h2>
                <p>
                    A Content Security Policy (CSP) is a list a website sends to the browser naming the only places it may load
                    scripts, styles and images from, or send requests to. Anything not on the list is blocked, so on a site
                    with a strict policy the widget can fail without any visible error. The browser console will show a
                    message mentioning <code>Content-Security-Policy</code> if that is what happened.
                </p>
                <p>Add these sources to the existing directives in the site&apos;s policy (keep everything already there):</p>
                <pre>
                    <code>{cspSnippet}</code>
                </pre>
                <ul>
                    <li>
                        <strong>script-src</strong> loads the widget itself, plus the screenshot library it fetches from
                        jsDelivr the first time someone takes a screenshot.
                    </li>
                    <li>
                        <strong>connect-src</strong> lets the widget send feedback, receive live replies and upload
                        attachments, which go straight to our file storage.
                    </li>
                    <li>
                        <strong>img-src</strong> shows attached images, screenshot previews and the screenshot capture itself.
                    </li>
                    <li>
                        <strong>style-src &apos;unsafe-inline&apos;</strong> is needed because the widget carries its own styles
                        inside the page. Without it the widget loads but appears unstyled. If your policy uses nonces or hashes
                        for styles, the widget cannot pick those up today; tell us at{" "}
                        <a href="mailto:support@vibe-vaults.com">support@vibe-vaults.com</a> if that blocks you.
                    </li>
                </ul>
                <p>
                    If the policy is set in a site builder or hosting dashboard rather than in your own code, look for a
                    setting called security headers or custom headers.
                </p>

                <h2 id="missing-feedback">A client says they submitted feedback that I cannot find</h2>
                <ul>
                    <li>
                        Check the status filter on the feedback list. <strong>Completed</strong> items are hidden by default.
                    </li>
                    <li>
                        Check you are looking at the right project. The sidebar switcher changes both workspace and project,
                        and notifications will move you to whichever project the item belongs to.
                    </li>
                    <li>
                        Ask which site they were on. A client invited to two projects can file against either, and it lands
                        where they were.
                    </li>
                </ul>

                <h2 id="client-cannot-see">A client cannot see their own feedback in the widget</h2>
                <p>
                    The widget hides items you have marked <strong>completed</strong>, so a client who reported something you
                    have since closed will not find it in their list. This keeps their view focused on what is still open. The
                    full history is always in your dashboard.
                </p>

                <h2 id="no-notifications">I am not getting notified</h2>
                <ul>
                    <li>
                        Check your email preferences for that project in the dashboard. Notifications can be set per project.
                    </li>
                    <li>
                        Emails are grouped rather than sent one per event: new feedback is batched into a digest every 15
                        minutes, and replies within one thread have a short cooldown. Nothing is dropped, it arrives together.
                    </li>
                    <li>You are never emailed about your own replies.</li>
                    <li>Check the spam folder for mail from vibe-vaults.com, and mark it as safe if it landed there.</li>
                </ul>

                <h2 id="replies-not-live">Replies are not appearing live</h2>
                <p>
                    The dashboard and the widget both stream new messages as they arrive. If a conversation seems frozen,
                    reload the page: a browser tab that has been asleep for a long time can lose its connection, and a refresh
                    restores it. Nothing is lost while the connection is down; the messages are all there on reload.
                </p>

                <h2 id="screenshot-wrong">The screenshot looks wrong</h2>
                <p>
                    If small rounded buttons or badges appear hollow, that is a known Firefox rendering issue with a
                    one-setting workaround, described in{" "}
                    <Link href="/docs/screenshots#firefox-bug">Screenshots</Link>.
                </p>

                <h2 id="still-stuck">Still stuck</h2>
                <p>
                    Email <a href="mailto:support@vibe-vaults.com">support@vibe-vaults.com</a> with the project name and, if a
                    specific person is affected, the email address you invited. That is usually enough for us to tell whether
                    their access is active.
                </p>
            </div>

            <DocsPageFooter slug={page.slug} />
        </>
    );
}
