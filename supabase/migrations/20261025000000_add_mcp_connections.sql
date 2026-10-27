-- One row per (user, OAuth client) pair that has connected an AI tool to the MCP
-- server at /api/mcp. Supabase Auth's OAuth server owns the grants and tokens; this
-- table holds only what Supabase cannot: instant revocation of a still-unexpired
-- access token, the read/write switch, the AI-marker preference and the workspace
-- scope of the connection.
--
-- Expand-only (new table, nothing altered).
--
-- Writes:
--   * Inserts, revocation and last_used_at stamping happen server-side through the
--     admin client (verifyToken, the consent decision route, the disconnect action).
--   * A signed-in user may read their own rows and change only the three settings
--     below, via column-level UPDATE grants.
--   * workspace_ids is a narrowing filter only: every tool still runs through RLS
--     and the owner-billing gate, so a bogus id can never widen access.

CREATE TABLE IF NOT EXISTS public.mcp_connections (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id text NOT NULL,
    client_name text,
    write_enabled boolean NOT NULL DEFAULT false,
    ai_marker boolean NOT NULL DEFAULT true,
    workspace_ids uuid[],
    created_at timestamptz NOT NULL DEFAULT now(),
    last_used_at timestamptz,
    revoked_at timestamptz,
    PRIMARY KEY (user_id, client_id)
);

ALTER TABLE public.mcp_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own MCP connections"
    ON public.mcp_connections FOR SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own MCP connection settings"
    ON public.mcp_connections FOR UPDATE
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Default privileges hand authenticated full access; narrow it to what the
-- dashboard actually needs.
REVOKE ALL ON public.mcp_connections FROM anon, authenticated;
GRANT SELECT ON public.mcp_connections TO authenticated;
GRANT UPDATE (write_enabled, ai_marker, workspace_ids) ON public.mcp_connections TO authenticated;

COMMENT ON TABLE public.mcp_connections IS
    'AI-tool (MCP) connections per user and OAuth client. Supabase Auth holds the grant; this row adds revocation, the write switch, the AI marker preference and workspace scope. client_id is the OAuth client_id claim of the access token.';
COMMENT ON COLUMN public.mcp_connections.workspace_ids IS
    'NULL means every workspace the user belongs to. A non-null array narrows the connection to those workspaces.';
