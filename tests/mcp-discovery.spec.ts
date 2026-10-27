/**
 * MCP endpoint discovery and token rules (`/api/mcp`).
 *
 * An AI tool finds the server by hitting it unauthenticated and following the
 * `WWW-Authenticate: Bearer resource_metadata=...` header, so a bare 401 (the
 * failure mode if the proxy ever gates this route again) silently breaks every
 * client. The same endpoint must also refuse an ordinary dashboard session
 * token: only tokens issued through the OAuth consent screen are MCP tokens.
 *
 * No browser, no state changes.
 */
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { getSeedResult } from './utils/seed-result';
import { supabaseAdmin } from './utils/supabase-admin';
import { MCP_URL, mcpRpc } from './utils/mcp-oauth';

const APP = 'http://127.0.0.1:3000';

test.describe('MCP discovery', () => {
    test('an unauthenticated call gets 401 with a pointer to the resource metadata', async ({ request }) => {
        const res = await mcpRpc(request, null, 'tools/list');
        expect(res.status).toBe(401);

        const raw = await request.post(MCP_URL, {
            headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
            data: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
        });
        expect(raw.headers()['www-authenticate']).toMatch(/Bearer .*resource_metadata=/);
    });

    test('protected resource metadata names the auth server, and is public with CORS', async ({ request }) => {
        const res = await request.get(`${APP}/.well-known/oauth-protected-resource/api/mcp`, {
            headers: { origin: 'https://claude.ai' },
        });
        expect(res.status()).toBe(200);
        const doc = await res.json();
        expect(doc.resource).toContain('/api/mcp');
        expect(doc.authorization_servers).toEqual([expect.stringContaining('/auth/v1')]);
        expect(res.headers()['access-control-allow-origin']).toBeTruthy();
    });

    test('an ordinary dashboard session token is not an MCP token', async ({ request }) => {
        const seed = getSeedResult();
        const { data } = await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email: seed.ownerEmail });
        const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
            auth: { persistSession: false },
        });
        const { data: session, error } = await anon.auth.verifyOtp({
            token_hash: data.properties!.hashed_token,
            type: 'magiclink',
        });
        expect(error).toBeNull();

        const res = await mcpRpc(request, session.session!.access_token, 'tools/list');
        expect(res.status).toBe(401);
    });

    test('a garbage bearer token is rejected', async ({ request }) => {
        const res = await mcpRpc(request, 'not-a-jwt', 'tools/list');
        expect(res.status).toBe(401);
    });

    test('a browser request from a foreign origin is refused', async ({ request }) => {
        const res = await mcpRpc(request, null, 'tools/list', {}, { origin: 'https://evil.example' });
        expect(res.status).toBe(403);
    });
});
