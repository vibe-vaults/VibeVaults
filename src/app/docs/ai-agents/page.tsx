/**
 * Main Responsibility: Public reference for connecting an AI tool (Claude, Cursor and similar) to
 * VibeVaults over MCP: how to connect, what an agent can read and do, what protects the account,
 * and where the data goes. Written for agency owners deciding whether to switch it on.
 *
 * Sensitive Dependencies:
 * - Mirrors the real behaviour of `/api/mcp` (`src/lib/mcp/`), the consent screen
 *   (`src/app/oauth/consent/page.tsx`) and the account card (`mcp-connections-card.tsx`): tool
 *   names, the read-only default, the AI-assisted marker default, the rate limit. Hand-written
 *   coupling, so change them together.
 * - The connect snippets must match the ones on the account card.
 * - Pricing is deliberately not restated: the feature is on every plan and the trial, and
 *   `tier-config.ts` (`mcpAccess`) is where that is decided.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { DocsPageHeader } from "@/components/docs/docs-page-header";
import { DocsPageFooter } from "@/components/docs/docs-page-footer";
import { getDocPage } from "@/lib/docs-data";

const page = getDocPage("ai-agents")!;

export const metadata: Metadata = {
    title: page.title,
    description:
        "Connect Claude, Cursor or another AI tool to VibeVaults over MCP so it can read your clients' pinned feedback and, if you allow it, reply and change status.",
};

export default function AiAgentsDoc() {
    return (
        <>
            <DocsPageHeader
                title={page.title}
                summary="Your clients pin it. Your agent fixes it. Connect an AI tool to VibeVaults and it can read the feedback you can see, with the pin, the page, the console and the screenshot, and, only if you allow it, reply and change status."
            />

            <div className="docs-prose">
                <h2 id="what-it-is">What this is</h2>
                <p>
                    MCP (Model Context Protocol) is the standard way AI tools connect to other products. VibeVaults runs an MCP
                    server, so a tool such as Claude Code, Claude Desktop or Cursor can look up a report, see where on the page it was
                    pinned, read the thread, and start fixing the site, without you copying anything out of the dashboard.
                </p>
                <p>
                    It is available on every plan and during the trial. Only owners and members can connect a tool. Clients and
                    guests have no account, so they cannot.
                </p>

                <h2 id="connect">Connect a tool</h2>
                <p>
                    The server address is <code>https://vibe-vaults.com/api/mcp</code>. You never create or paste a key: the tool opens
                    a VibeVaults page, you sign in if needed, choose what the connection may do, and approve.
                </p>
                <h3 id="claude-code">Claude Code</h3>
                <pre><code>claude mcp add --scope user --transport http vibevaults https://vibe-vaults.com/api/mcp</code></pre>
                <p>Then run <code>/mcp</code> inside Claude Code and choose <strong>vibevaults</strong> to sign in.</p>
                <h3 id="claude-desktop">Claude Desktop</h3>
                <p>
                    Open Settings, then Connectors, choose <strong>Add custom connector</strong>, and paste the server address.
                </p>
                <h3 id="cursor">Cursor</h3>
                <p>Add this to your <code>mcp.json</code>:</p>
                <pre><code>{`{ "mcpServers": { "vibevaults": { "url": "https://vibe-vaults.com/api/mcp" } } }`}</code></pre>
                <p>
                    The same snippets, with copy buttons, are on your <Link href="/dashboard/account#ai-agents">Account page</Link>.
                </p>

                <h2 id="approve">What you decide when you approve</h2>
                <ul>
                    <li>
                        <strong>Which workspaces.</strong> All of yours, or just one. A tool limited to one workspace cannot see the
                        others at all.
                    </li>
                    <li>
                        <strong>Read only, or read and write.</strong> Every new connection is read only. Tick{" "}
                        <em>Allow replying and changing status</em> to let it reply to clients and move reports between statuses.
                    </li>
                    <li>
                        <strong>AI-assisted marker.</strong> On by default. Replies the tool sends are labelled as written with AI
                        help. Turn it off only if you review every reply before it goes out.
                    </li>
                </ul>
                <p>
                    You can change all three later, or disconnect, from the <strong>AI agents (MCP)</strong> card on your Account
                    page. Disconnecting takes effect on the tool&apos;s very next request.
                </p>

                <h2 id="what-it-can-do">What an agent can do</h2>
                <table>
                    <thead>
                        <tr><th>Tool</th><th>What it does</th><th>Needs write</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>list_projects</code></td><td>Your workspaces and projects, with how many reports are open, in progress and in review</td><td>No</td></tr>
                        <tr><td><code>list_feedback</code></td><td>Reports for a project, filterable by status, by page, and by whether they are pinned</td><td>No</td></tr>
                        <tr><td><code>get_feedback</code></td><td>One report in full: the pin and how reliable it is, browser details, console logs, failed requests, the thread, and up to three screenshots</td><td>No</td></tr>
                        <tr><td><code>reply_to_feedback</code></td><td>Posts a reply in the thread, as you</td><td>Yes</td></tr>
                        <tr><td><code>update_feedback_status</code></td><td>Sets a report to open, in progress, in review or completed</td><td>Yes</td></tr>
                    </tbody>
                </table>
                <p>
                    It cannot delete anything, create reports, change members, projects or billing, or upload files. You can paste a
                    dashboard link to a report straight into the tool and it will find it.
                </p>

                <h2 id="safeguards">What protects your account</h2>
                <ul>
                    <li>
                        <strong>It sees what you see.</strong> The connection acts as you, under the same access rules as the
                        dashboard. It cannot read a workspace you are not in.
                    </li>
                    <li>
                        <strong>Your plan decides, not the tool&apos;s.</strong> If the workspace owner&apos;s trial or subscription
                        lapses, connected tools stop working for everyone in that workspace, reads included, exactly as the dashboard
                        does. Disconnecting always keeps working.
                    </li>
                    <li>
                        <strong>Client text is treated as untrusted.</strong> Anything a client or their web page wrote, such as
                        feedback, replies and console output, is handed to the agent inside marked blocks with a notice that it is
                        content to analyse and not instructions. That limits, but cannot fully remove, the risk of a hostile page or a
                        sneaky comment steering an agent. Keep write access off for tools you do not fully trust.
                    </li>
                    <li>
                        <strong>Limits.</strong> Each tool is limited to 60 calls a minute per person.
                    </li>
                </ul>

                <h2 id="replies">Replies sent by an agent</h2>
                <p>
                    A reply posted through a tool is an ordinary reply from you: it appears in the thread, in the widget, and in the
                    notification email your client receives. VibeVaults cannot tell whether you read it before your tool sent it,
                    which is why the AI-assisted marker exists and why write access is off until you ask for it. You remain
                    responsible for what is sent in your name.
                </p>

                <h2 id="data-flow">Where the data goes</h2>
                <p>
                    When a connected tool reads a report, that content is sent to the tool and to the AI provider behind it, at your
                    instruction. That provider acts for you. It is not a VibeVaults sub-processor and we are not a party to your
                    arrangement with it. Check that its terms suit what your clients have agreed to, and mention it in your own
                    privacy notice where it applies. What a report contains in the first place is described in{" "}
                    <Link href="/docs/widget-data">What the widget records</Link>.
                </p>

                <h2 id="troubleshooting">If something does not work</h2>
                <ul>
                    <li>
                        <strong>“This connection is read-only”:</strong> switch on <em>Allow replying and changing status</em> for that
                        connection on your Account page.
                    </li>
                    <li>
                        <strong>A workspace shows as paused:</strong> the owner&apos;s trial or subscription has lapsed. Nothing is
                        deleted; it works again once the owner renews.
                    </li>
                    <li>
                        <strong>The tool says it is not authorised:</strong> the connection was disconnected. Connect it again from the
                        tool.
                    </li>
                    <li>
                        <strong>The approval page says the request expired:</strong> start the connection again from the tool. The
                        page only works when opened by the tool.
                    </li>
                </ul>
            </div>

            <DocsPageFooter slug={page.slug} />
        </>
    );
}
