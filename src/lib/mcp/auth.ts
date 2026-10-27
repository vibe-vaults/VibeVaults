/**
 * Main Responsibility: Authenticates a call to the MCP endpoint. The bearer token must be an OAuth
 * access token issued by Supabase Auth's OAuth server (it carries a `client_id` claim, which a
 * normal dashboard session does not), and it must belong to a live `mcp_connections` row created
 * by our consent screen. Revoking the row cuts a connection off immediately, even though the JWT
 * itself would stay valid until it expires.
 *
 * Sensitive Dependencies:
 * - Supabase OAuth server (beta): token claims, JWKS verification via `auth.getClaims()`.
 * - `mcp_connections` table (admin client, since RLS only lets users read their own rows).
 * - Tools build a USER-SCOPED client from the same token, so RLS applies exactly as in the dashboard.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

export interface McpConnection {
    user_id: string;
    client_id: string;
    client_name: string | null;
    write_enabled: boolean;
    ai_marker: boolean;
    workspace_ids: string[] | null;
    last_used_at: string | null;
    revoked_at: string | null;
}

export interface McpSession {
    token: string;
    userId: string;
    email: string | null;
    connection: McpConnection;
}

const LAST_USED_STAMP_MS = 60_000;

function newClient(token?: string): SupabaseClient {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
        ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
    });
}

/** A client that acts as the connected user: RLS sees `auth.uid()` of the token. */
export function createUserClient(token: string): SupabaseClient {
    return newClient(token);
}

/** `withMcpAuth` verifier. Returns undefined (401) for anything that is not a live MCP connection. */
export async function verifyMcpToken(_req: Request, bearer?: string) {
    if (!bearer) return undefined;

    const { data, error } = await newClient().auth.getClaims(bearer);
    if (error || !data) return undefined;

    const claims = data.claims as Record<string, unknown>;
    const clientId = claims.client_id;
    if (typeof clientId !== 'string' || typeof claims.sub !== 'string') return undefined;

    const admin = createAdminClient();
    const { data: connection } = await admin
        .from('mcp_connections')
        .select('*')
        .eq('user_id', claims.sub)
        .eq('client_id', clientId)
        .maybeSingle();

    if (!connection || connection.revoked_at) return undefined;

    const lastUsed = connection.last_used_at ? Date.parse(connection.last_used_at) : 0;
    if (Date.now() - lastUsed > LAST_USED_STAMP_MS) {
        await admin
            .from('mcp_connections')
            .update({ last_used_at: new Date().toISOString() })
            .eq('user_id', claims.sub)
            .eq('client_id', clientId);
    }

    const session: McpSession = {
        token: bearer,
        userId: claims.sub,
        email: typeof claims.email === 'string' ? claims.email : null,
        connection: connection as McpConnection,
    };
    return { token: bearer, clientId, scopes: [], extra: { session } };
}
