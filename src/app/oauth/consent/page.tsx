/**
 * Main Responsibility: The consent screen an AI tool lands on after it asks to connect to a
 * VibeVaults account (OAuth 2.1 authorization, driven by Supabase Auth's OAuth server). The
 * signed-in user picks what the connection may do (workspace scope, read-only vs. read/write,
 * AI-assisted marker on replies) and approves or denies.
 *
 * Like the review gate, this is a plain server-rendered form that POSTs to a route handler
 * (/api/oauth/decision) with no client-side submit handler, so it works with JavaScript off and a
 * click that beats hydration cannot be swallowed. Approve and Deny sit side by side, so both carry
 * a clear border and label.
 *
 * Sensitive Dependencies:
 * - supabase.auth.oauth.getAuthorizationDetails: the client name is SELF-DECLARED by whoever
 *   registered the client (dynamic registration is open), so it is shown as such, never as proof.
 * - /api/oauth/decision: the form target; it creates the `mcp_connections` row the MCP endpoint
 *   requires, so a token without a row from this screen is rejected.
 * - Behind login in src/lib/supabase/proxy.ts, which keeps `?authorization_id=` through sign-in
 *   via `?next=`.
 */
import { redirect } from 'next/navigation';
import { Eye, Pencil, ShieldAlert } from 'lucide-react';
import { SiteHeader } from '@/components/landing/site-header';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
    title: 'Connect an AI tool — VibeVaults',
    robots: { index: false },
};

function Notice({ title, body }: { title: string; body: string }) {
    return (
        <div className="text-center">
            <h1 className="text-2xl font-bold mb-2 text-gray-900">{title}</h1>
            <p className="text-gray-500 text-sm">{body}</p>
        </div>
    );
}

function hostOf(uri: string | undefined): string | null {
    if (!uri) return null;
    try { return new URL(uri).host; } catch { return null; }
}

export default async function ConsentPage({
    searchParams,
}: {
    searchParams: Promise<{ authorization_id?: string }>;
}) {
    const { authorization_id } = await searchParams;
    const supabase = await createClient();

    let content: React.ReactNode;

    const { data, error } = authorization_id
        ? await supabase.auth.oauth.getAuthorizationDetails(authorization_id)
        : { data: null, error: null };

    if (data && 'redirect_url' in data && data.redirect_url) redirect(data.redirect_url);

    if (!authorization_id || error || !data) {
        content = (
            <Notice
                title="This connection request has expired"
                body="Go back to your AI tool and start the connection again."
            />
        );
    } else {
        const { data: workspaces } = await supabase.from('workspaces').select('id, name').order('name');
        const clientName = (data.client.name || 'An AI tool').slice(0, 100);
        const clientHost = hostOf(data.client.uri);

        content = (
            <>
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold mb-2 text-gray-900">Connect {clientName}?</h1>
                    <p className="text-gray-500 text-sm">
                        It will act as <span className="font-medium text-gray-700">{data.user.email}</span> and can read
                        the feedback you can see in VibeVaults.
                    </p>
                </div>

                <div className="flex gap-2 p-3 mb-5 bg-amber-50 text-amber-800 text-xs rounded-md border border-amber-200">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>
                        The name{clientHost ? ` and address (${clientHost})` : ''} above come from the tool itself and
                        are not verified. Only continue if you started this connection just now.
                    </p>
                </div>

                <form action="/api/oauth/decision" method="POST" className="flex flex-col gap-5">
                    <input type="hidden" name="authorization_id" value={authorization_id} />

                    <fieldset>
                        <legend className="text-sm font-medium text-gray-700 mb-2">Which workspaces can it see?</legend>
                        <div className="flex flex-col gap-2 text-sm text-gray-700">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="workspace" value="all" defaultChecked className="h-4 w-4" />
                                All my workspaces
                            </label>
                            {(workspaces ?? []).map((w) => (
                                <label key={w.id} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="workspace" value={w.id} className="h-4 w-4" />
                                    <span className="truncate">{w.name}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <div className="rounded-md border border-gray-200 divide-y divide-gray-200 text-sm">
                        <div className="flex gap-3 p-3">
                            <Eye className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" />
                            <p className="text-gray-700">
                                <span className="font-medium">Always: read.</span> Projects, reports, replies, pin
                                locations, screenshots and browser details.
                            </p>
                        </div>
                        <label className="flex gap-3 p-3 cursor-pointer">
                            <Pencil className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" />
                            <span className="flex-1 text-gray-700">
                                <span className="font-medium">Allow replying and changing status.</span>
                                <span className="block text-gray-500">
                                    Off by default. Replies are sent to your clients as you. You can switch this on or
                                    off later in Account.
                                </span>
                            </span>
                            <input type="checkbox" name="write" className="h-4 w-4 mt-0.5" />
                        </label>
                        <label className="flex gap-3 p-3 cursor-pointer">
                            <span className="w-4 shrink-0" />
                            <span className="flex-1 text-gray-700">
                                <span className="font-medium">Mark replies as AI-assisted.</span>
                                <span className="block text-gray-500">
                                    Clients see that a reply was written with AI help. Recommended unless you review
                                    every reply before it is sent.
                                </span>
                            </span>
                            <input type="checkbox" name="ai_marker" defaultChecked className="h-4 w-4 mt-0.5" />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="submit"
                            name="decision"
                            value="deny"
                            className="inline-flex items-center justify-center px-4 py-2 rounded-md font-medium text-gray-800 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            Deny
                        </button>
                        <button
                            type="submit"
                            name="decision"
                            value="approve"
                            className="inline-flex items-center justify-center px-4 py-2 rounded-md font-medium text-white bg-secondary border-2 border-secondary hover:bg-secondary/90 transition-colors cursor-pointer"
                        >
                            Approve
                        </button>
                    </div>
                </form>
            </>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <SiteHeader minimal />
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-[480px] bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    {content}
                </div>
            </main>
        </div>
    );
}
