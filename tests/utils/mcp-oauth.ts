/**
 * Main Responsibility: Plays the part of an AI tool (Claude Code, Cursor...) for the MCP specs:
 * dynamic client registration, the authorization request, the REAL consent screen driven through
 * a signed-in browser page, the PKCE code exchange, and JSON-RPC calls to /api/mcp.
 *
 * Sensitive Dependencies:
 * - Supabase Auth's OAuth server (local, `[auth.oauth_server]` in supabase/config.toml).
 * - The consent screen's field names (`workspace`, `write`, `ai_marker`, `decision`).
 * - The 127.0.0.1 host: the local auth issuer is `http://127.0.0.1:54321/auth/v1`, so the app and
 *   the resource indicator must use the same host or token verification disagrees about the issuer.
 */
import crypto from 'crypto';
import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { supabaseAdmin } from './supabase-admin';

const APP = 'http://127.0.0.1:3000';
export const MCP_URL = `${APP}/api/mcp`;
const AUTH = `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'}/auth/v1`;
/** Never served: the browser only needs to attempt it so we can read the code off the request. */
const REDIRECT = 'http://127.0.0.1:9999/cb';

const b64 = (b: Buffer) => b.toString('base64url');

export interface ConsentOptions {
    /** Tick "Allow replying and changing status". Default false, as on the real screen. */
    write?: boolean;
    /** The AI-assisted marker. Default true, as on the real screen. */
    aiMarker?: boolean;
    /** A workspace id to scope the connection to. Default: all workspaces. */
    workspace?: string;
}

export interface McpClient {
    token: string;
    clientId: string;
    userId: string;
    /** Calls a tool; returns the parsed result. */
    callTool: (name: string, args?: object) => Promise<ToolResult>;
    /** Raw JSON-RPC request, for protocol-level assertions. */
    rpc: (method: string, params?: object) => Promise<{ status: number; body: any }>;
}

export interface ToolResult {
    status: number;
    isError: boolean;
    /** The first text block, parsed as JSON when it is JSON, otherwise the raw string. */
    data: any;
    /** Every content block, so image blocks can be counted. */
    content: Array<{ type: string; text?: string; mimeType?: string }>;
}

export interface AuthorizationRequest {
    clientId: string;
    authorizationId: string;
    verifier: string;
    tokenEndpoint: string;
}

/** Registers a client and starts an authorization; returns what the consent screen needs. */
export async function beginAuthorization(request: APIRequestContext, clientName = 'E2E AI tool'): Promise<AuthorizationRequest> {
    const meta = await (await request.get(`${AUTH}/.well-known/oauth-authorization-server`)).json();
    const reg = await request.post(meta.registration_endpoint, {
        data: {
            client_name: clientName,
            redirect_uris: [REDIRECT],
            token_endpoint_auth_method: 'none',
            grant_types: ['authorization_code', 'refresh_token'],
            response_types: ['code'],
        },
    });
    expect(reg.status()).toBe(201);
    const client = await reg.json();

    const verifier = b64(crypto.randomBytes(32));
    const challenge = b64(crypto.createHash('sha256').update(verifier).digest());
    const url = new URL(meta.authorization_endpoint);
    url.search = new URLSearchParams({
        response_type: 'code',
        client_id: client.client_id,
        redirect_uri: REDIRECT,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state: 'xyz',
        resource: MCP_URL,
    }).toString();

    // The authorize endpoint answers with a redirect to our consent screen; read it, don't follow it.
    const res = await request.get(url.toString(), { maxRedirects: 0 });
    const location = res.headers()['location'] ?? '';
    const authorizationId = new URL(location).searchParams.get('authorization_id');
    expect(authorizationId, `authorize redirected to ${location}`).toBeTruthy();

    return { clientId: client.client_id, authorizationId: authorizationId!, verifier, tokenEndpoint: meta.token_endpoint };
}

/** Opens the consent screen as the signed-in user, applies the options and submits. Returns the callback URL. */
export async function decide(
    page: Page,
    authorizationId: string,
    decision: 'approve' | 'deny',
    options: ConsentOptions = {},
): Promise<string> {
    let callback = '';
    page.on('request', (r) => { if (r.url().startsWith(REDIRECT)) callback = r.url(); });

    await page.goto(`${APP}/oauth/consent?authorization_id=${authorizationId}`);
    if (options.write) await page.locator('input[name="write"]').check();
    if (options.aiMarker === false) await page.locator('input[name="ai_marker"]').uncheck();
    if (options.workspace) await page.locator(`input[name="workspace"][value="${options.workspace}"]`).check();
    await page.getByRole('button', { name: decision === 'approve' ? 'Approve' : 'Deny' }).click();

    await expect.poll(() => callback, { message: 'the browser should be sent to the tool\'s redirect URI' }).not.toBe('');
    return callback;
}

/** Trades the code on the callback URL for an access token (PKCE). */
export async function exchangeCode(request: APIRequestContext, auth: AuthorizationRequest, callbackUrl: string) {
    const code = new URL(callbackUrl).searchParams.get('code');
    expect(code, `callback was ${callbackUrl}`).toBeTruthy();
    const res = await request.post(auth.tokenEndpoint, {
        form: {
            grant_type: 'authorization_code',
            code: code!,
            redirect_uri: REDIRECT,
            client_id: auth.clientId,
            code_verifier: auth.verifier,
        },
    });
    expect(res.status()).toBe(200);
    return (await res.json()) as { access_token: string; refresh_token: string };
}

export async function mcpRpc(request: APIRequestContext, token: string | null, method: string, params: object = {}, headers: Record<string, string> = {}) {
    const res = await request.post(MCP_URL, {
        headers: {
            'content-type': 'application/json',
            accept: 'application/json, text/event-stream',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        data: { jsonrpc: '2.0', id: Math.floor(Math.random() * 1e6), method, params },
    });
    const text = await res.text();
    const sse = text.split('\n').find((l) => l.startsWith('data:'))?.slice(5);
    let body: any = text;
    try { body = JSON.parse(sse ?? text); } catch { /* keep the raw text */ }
    return { status: res.status(), body };
}

/** The whole dance: register, consent as the signed-in `page` user, exchange, and return a ready client. */
export async function connectMcp(page: Page, request: APIRequestContext, options: ConsentOptions & { clientName?: string } = {}): Promise<McpClient> {
    const auth = await beginAuthorization(request, options.clientName);
    const callback = await decide(page, auth.authorizationId, 'approve', options);
    const { access_token } = await exchangeCode(request, auth, callback);
    const claims = JSON.parse(Buffer.from(access_token.split('.')[1], 'base64url').toString()) as { sub: string };

    return {
        token: access_token,
        clientId: auth.clientId,
        userId: claims.sub,
        rpc: (method, params) => mcpRpc(request, access_token, method, params),
        callTool: async (name, args = {}) => {
            const r = await mcpRpc(request, access_token, 'tools/call', { name, arguments: args });
            const content: ToolResult['content'] = r.body?.result?.content ?? [];
            const text = content.find((c) => c.type === 'text')?.text;
            let data: any = text;
            try { data = text ? JSON.parse(text) : undefined; } catch { /* plain-text answer */ }
            return { status: r.status, isError: r.body?.result?.isError === true, data, content };
        },
    };
}

/** Removes a connection row, so one spec's tool never leaks into the next. */
export async function dropConnection(client: Pick<McpClient, 'userId' | 'clientId'>) {
    await supabaseAdmin.from('mcp_connections').delete().eq('user_id', client.userId).eq('client_id', client.clientId);
}
