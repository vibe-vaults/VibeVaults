/**
 * Main Responsibility: The remote MCP endpoint (Streamable HTTP) that lets an agency's AI agent
 * read client feedback and, on connections with write access, reply and change status. Auth is
 * OAuth 2.1 via Supabase Auth; discovery lives under /.well-known (see the sibling route).
 *
 * Sensitive Dependencies:
 * - Excluded from the auth gate in BOTH `src/proxy.ts` (matcher) and `src/lib/supabase/proxy.ts`:
 *   the proxy's bare 401 has no WWW-Authenticate header and would break OAuth discovery.
 * - `mcp-handler` + `@modelcontextprotocol/server` v2; `src/lib/mcp/*` for auth and tools.
 * - Origin validation is required by the Streamable HTTP spec (DNS-rebinding defence).
 */
import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { verifyMcpToken } from '@/lib/mcp/auth';
import { registerTools } from '@/lib/mcp/tools';

const handler = createMcpHandler(registerTools, { serverInfo: { name: 'vibevaults', version: '1.0.0' } });

const authed = withMcpAuth(handler, verifyMcpToken, {
    required: true,
    resourceMetadataPath: '/.well-known/oauth-protected-resource/api/mcp',
});

/** Agents and server-side connectors send no Origin; a browser page from another site must be refused. */
function originAllowed(req: Request): boolean {
    const origin = req.headers.get('origin');
    if (!origin) return true;
    const own = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin : null;
    return origin === own || (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
}

async function guarded(req: Request) {
    if (!originAllowed(req)) return new Response(JSON.stringify({ error: 'forbidden_origin' }), { status: 403, headers: { 'content-type': 'application/json' } });
    return authed(req);
}

export { guarded as GET, guarded as POST };
