/**
 * Main Responsibility: Form target of the MCP consent screen. On Approve it records the
 * connection's settings in `mcp_connections` and then approves the OAuth request; on Deny it only
 * denies. Either way it answers 303 to the AI tool's redirect URI.
 *
 * The row is written BEFORE approving: the MCP endpoint rejects any token without a live row, so
 * the other order could issue a token that is dead on arrival if the write failed. Re-consenting
 * after a Disconnect overwrites the settings and clears `revoked_at`.
 *
 * Sensitive Dependencies:
 * - The OAuth client id and name come from Supabase (`getAuthorizationDetails`), never from the
 *   form, so a forged form cannot attach settings to another client.
 * - A workspace id from the form is only kept if the signed-in user can see that workspace (RLS).
 * - Admin client for the upsert: RLS gives users no INSERT on `mcp_connections` on purpose.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
    const form = await request.formData();
    const id = String(form.get('authorization_id') ?? '');
    const decision = form.get('decision');
    if (!id || (decision !== 'approve' && decision !== 'deny')) {
        return NextResponse.json({ error: 'missing decision' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'not signed in' }, { status: 401 });

    if (decision === 'approve') {
        const { data: details, error: detailsError } = await supabase.auth.oauth.getAuthorizationDetails(id);
        if (detailsError || !details || !details.client?.id) {
            return NextResponse.json({ error: 'authorization request not found' }, { status: 400 });
        }

        let workspaceIds: string[] | null = null;
        const workspace = String(form.get('workspace') ?? 'all');
        if (workspace !== 'all') {
            const { data: ws } = await supabase.from('workspaces').select('id').eq('id', workspace).maybeSingle();
            if (!ws) return NextResponse.json({ error: 'unknown workspace' }, { status: 400 });
            workspaceIds = [ws.id];
        }

        const { error: upsertError } = await createAdminClient()
            .from('mcp_connections')
            .upsert({
                user_id: user.id,
                client_id: details.client.id,
                client_name: (details.client.name || '').slice(0, 100) || null,
                write_enabled: form.get('write') === 'on',
                ai_marker: form.get('ai_marker') === 'on',
                workspace_ids: workspaceIds,
                revoked_at: null,
            }, { onConflict: 'user_id,client_id' });
        if (upsertError) return NextResponse.json({ error: 'could not save connection' }, { status: 500 });
    }

    const { data, error } = decision === 'approve'
        ? await supabase.auth.oauth.approveAuthorization(id, { skipBrowserRedirect: true })
        : await supabase.auth.oauth.denyAuthorization(id, { skipBrowserRedirect: true });
    if (error || !data) return NextResponse.json({ error: 'authorization failed' }, { status: 400 });

    return NextResponse.redirect(data.redirect_url, 303);
}
