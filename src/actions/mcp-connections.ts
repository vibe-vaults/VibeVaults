/**
 * Main Responsibility: Dashboard controls for AI-agent (MCP) connections: change a connection's
 * settings and disconnect it. The connection is created by the consent screen, not here.
 *
 * Sensitive Dependencies:
 * - `mcp_connections` column grants: users may UPDATE only write_enabled, ai_marker and
 *   workspace_ids, and only on their own rows (RLS), so the settings update runs user-scoped.
 * - Disconnect must work even for a locked-out (lapsed) account, so nothing here is billing-gated;
 *   it is an exit, like leaving a workspace.
 * - Disconnect sets `revoked_at` first (cuts the connection off on the next call, because the JWT
 *   stays valid until it expires), then asks Supabase to revoke the grant and its refresh tokens.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface McpConnectionPatch {
    write_enabled?: boolean;
    ai_marker?: boolean;
    /** null = all workspaces. */
    workspace_ids?: string[] | null;
}

export async function updateMcpConnection(clientId: string, patch: McpConnectionPatch) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'You must be logged in.' };

    const update: McpConnectionPatch = {};
    if (typeof patch.write_enabled === 'boolean') update.write_enabled = patch.write_enabled;
    if (typeof patch.ai_marker === 'boolean') update.ai_marker = patch.ai_marker;
    if (patch.workspace_ids !== undefined) {
        if (patch.workspace_ids !== null) {
            const { data: visible } = await supabase.from('workspaces').select('id').in('id', patch.workspace_ids);
            if ((visible?.length ?? 0) !== patch.workspace_ids.length) return { error: 'Unknown workspace.' };
        }
        update.workspace_ids = patch.workspace_ids;
    }

    const { data, error } = await supabase
        .from('mcp_connections')
        .update(update)
        .eq('user_id', user.id)
        .eq('client_id', clientId)
        .is('revoked_at', null)
        .select('client_id');
    if (error || !data?.length) return { error: 'Could not update this connection.' };

    revalidatePath('/dashboard/account');
    return { error: null };
}

export async function disconnectMcpConnection(clientId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'You must be logged in.' };

    const { error } = await createAdminClient()
        .from('mcp_connections')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('client_id', clientId);
    if (error) return { error: 'Could not disconnect. Please try again.' };

    // Best effort: the row above already blocks the tool. This also kills refresh tokens so the
    // tool cannot quietly mint a new access token.
    await supabase.auth.oauth.revokeGrant({ clientId });

    revalidatePath('/dashboard/account');
    return { error: null };
}
