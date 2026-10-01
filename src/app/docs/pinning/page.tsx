/**
 * Main Responsibility: Public reference for the widget's pinning model — the
 * Pin/Feedback controls, dropping a pin anywhere on the page, and how a pin
 * stays attached to the right place after the site changes or is viewed at a
 * different width. Written for the agency handing this to a client.
 *
 * Sensitive Dependencies:
 * - "Pin and Feedback" mirrors the widget's action bar (#vv-action-pin,
 *   #vv-action-list) and the rule that collapsing the widget hides the pins.
 * - Mirrors the anchoring behaviour in `public/widget.js` (resolveAnchor,
 *   pickAnchorElement, resolvePinPosition). If the anchoring model changes,
 *   the "when a pin loses its place" section is the claim that goes stale.
 * - The pin data that gets stored is documented in `/docs/widget-data`.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { DocsPageHeader } from "@/components/docs/docs-page-header";
import { DocsPageFooter } from "@/components/docs/docs-page-footer";
import { getDocPage } from "@/lib/docs-data";

const page = getDocPage("pinning")!;

export const metadata: Metadata = {
    title: page.title,
    description:
        "How pinned feedback works in VibeVaults: drop a pin anywhere on the page, keep the site usable in between, and see everyone's pins in context on the live site.",
};

export default function PinningDoc() {
    return (
        <>
            <DocsPageHeader
                title={page.title}
                summary="Feedback is attached to a point on the page, not just to a page. Your client clicks the spot they mean, types what is wrong, and the pin stays there for everyone who opens the site afterwards."
            />

            <div className="docs-prose">
                <h2 id="dropping-a-pin">Dropping a pin</h2>
                <p>
                    Open the widget, press <strong>Pin</strong>, then click the spot you mean. A small dialog opens right
                    next to where you clicked. Write the feedback, press send, and the pin stays on the page.
                </p>
                <p>
                    You can pin <em>anything</em>, not only buttons and images. The empty gap between two sections, the space
                    around a heading, a stretch of margin that looks wrong: all of it can carry a pin. That matters because
                    spacing problems are some of the most common things a designer needs to flag, and they are exactly the
                    things that are not an element you can point at.
                </p>
                <p>
                    A screenshot of the page is captured automatically in the background while you type, with the pin drawn onto
                    it. You do not have to ask for one.
                </p>

                <h2 id="modes">Pin and Feedback</h2>
                <p>Opening the widget shows everyone&apos;s pins on the page and two buttons.</p>
                <ul>
                    <li>
                        <strong>Pin</strong> gets the widget ready for exactly one pin. The next click on the page drops it
                        instead of following a link, and the site goes straight back to normal once the dialog opens. While
                        you are choosing the spot the widget steps out of the way, so it never covers what you want to pin.
                        Press <strong>Esc</strong> to change your mind.
                    </li>
                    <li>
                        <strong>Feedback</strong> opens and closes the list of conversations for this project.
                    </li>
                </ul>
                <p>
                    Apart from that one click, links, buttons and forms keep working while the widget is open, so you can
                    click through to the page you actually want to review. Collapsing the widget hides the pins and gives
                    the site back completely.
                </p>

                <h2 id="reading-pins">Reading what other people left</h2>
                <p>
                    Pins are numbered in the order they were created across the whole project, so pin 1 is the oldest and a
                    number means the same thing on every page. Click one to open its conversation in the panel and reply
                    there. Replies appear live for everyone with the site open.
                </p>
                <p>
                    It works the other way round too. Pick a conversation from the feedback list and its pins pulse on the
                    page for as long as the conversation is open, reply pins included, and the page scrolls to bring them
                    into view. If the pins are on another page of the site, the widget takes you there and reopens the
                    conversation.
                </p>

                <h3 id="reply-pins">Pinning inside a conversation</h3>
                <p>
                    A reply can carry a pin of its own. Use the pin button in the reply bar, click the spot, and the reply
                    picks up a screenshot of it, exactly like a new report does. These show on the page as lettered pins
                    under the report&apos;s number, <strong>1a</strong>, <strong>1b</strong> and so on, and clicking one
                    opens the same conversation.
                </p>
                <p>
                    Two things this is for: pointing at the same problem somewhere else on the site without starting a
                    second thread, and showing what a spot looks like after a fix went out. A reply pin can sit on a
                    different page than the report it belongs to; it renders there alone with its parent&apos;s number, and
                    the reply names the page.
                </p>
                <p>
                    When several pins land close together they collapse into a single dark marker showing how many are stacked
                    there. Click it and they fan out so you can pick the one you want.
                </p>
                <p>
                    Pins only appear on the page they were left on. The page is matched on its address without the query
                    string, so arriving with a tracking parameter such as <code>?utm_source=…</code> still shows the same pins.
                </p>

                <h2 id="staying-in-place">How a pin stays in place</h2>
                <p>
                    A pin is not stored as a pair of screen coordinates. Coordinates stop meaning anything the moment the page
                    scrolls, the window is resized, or the site is deployed again.
                </p>
                <p>
                    Instead, each pin remembers the element it was placed on or beside, and its position relative to that
                    element. A pin dropped in the gap to the right of a button remembers that it sits a fixed distance from
                    that button&apos;s edge, so the gap it is describing survives a narrower window. A pin dropped inside a
                    panel that stretches with the viewport remembers its position proportionally, so it stays on the same part
                    of that panel.
                </p>
                <p>
                    The practical result is that a client can report a spacing problem on a wide monitor and you can open the
                    same pin on a laptop and find it pointing at the same thing.
                </p>

                <h2 id="losing-place">When a pin loses its place</h2>
                <p>
                    If the element a pin was attached to no longer exists, usually because the section was rebuilt or removed,
                    the pin falls back to roughly where it was and is drawn in grey with a dashed edge. That styling is a
                    warning: treat its position as approximate and rely on the screenshot, which still shows the page exactly as
                    it looked when the feedback was written.
                </p>
                <p>
                    This is also why the screenshot is captured automatically rather than being optional. The pin tells you
                    where; the screenshot proves what.
                </p>

                <h2 id="unpinned">Feedback without a pin</h2>
                <p>
                    Every report made from the widget is pinned, because a report made while looking at the site almost always
                    has a place it belongs. If you want to raise something general that is not tied to a spot on a page, add it
                    from the dashboard instead.
                </p>
                <p>
                    What the pin stores alongside your message is listed in{" "}
                    <Link href="/docs/widget-data">What the widget records</Link>.
                </p>
            </div>

            <DocsPageFooter slug={page.slug} />
        </>
    );
}
