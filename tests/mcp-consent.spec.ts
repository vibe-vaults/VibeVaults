/**
 * The MCP consent screen (`/oauth/consent`) and the account-page card that manages connections.
 *
 * The screen is where a user decides what an AI tool may do, so it has to be trustworthy and
 * click-proof: it is a plain form posting to a route handler with no client-side submit handler
 * (a click that beats hydration must not be swallowed), pinned by the no-JavaScript case. Deny must
 * leave no connection behind, and a logged-out visitor has to come back to the same request after
 * signing in, or the AI tool hangs waiting for an answer.
 *
 * State care: every connection row a test creates is dropped afterwards.
 */
import { test, expect } from '@playwright/test';
import { supabaseAdmin } from './utils/supabase-admin';
import { getSeedResult } from './utils/seed-result';
import { AUTH_FILES } from './fixtures/test-data';
import { beginAuthorization, connectMcp, decide, dropConnection } from './utils/mcp-oauth';

async function connectionRow(userId: string, clientId: string) {
    const { data } = await supabaseAdmin.from('mcp_connections').select('*').eq('user_id', userId).eq('client_id', clientId).maybeSingle();
    return data;
}

test.describe('consent screen', () => {
    test('a logged-out visitor is sent to sign in and brought back to the same request', async ({ browser, request }) => {
        const context = await browser.newContext({ storageState: AUTH_FILES.empty });
        const page = await context.newPage();
        const auth = await beginAuthorization(request);

        await page.goto(`/oauth/consent?authorization_id=${auth.authorizationId}`);
        await expect(page).toHaveURL(/\/auth\/login/);
        const next = new URL(page.url()).searchParams.get('next');
        expect(next).toContain(`/oauth/consent?authorization_id=${auth.authorizationId}`);
        await context.close();
    });

    test('Deny sends the tool an error and creates no connection', async ({ page, request }) => {
        const seed = getSeedResult();
        const auth = await beginAuthorization(request);
        const callback = await decide(page, auth.authorizationId, 'deny');

        expect(new URL(callback).searchParams.get('error')).toBe('access_denied');
        expect(await connectionRow(seed.ownerId, auth.clientId)).toBeNull();
    });

    test('Approve stores the choices made on the screen', async ({ page, request }) => {
        const seed = getSeedResult();
        const agent = await connectMcp(page, request, { write: true, aiMarker: false, workspace: seed.workspaceId });

        const row = await connectionRow(seed.ownerId, agent.clientId);
        expect(row).toMatchObject({ write_enabled: true, ai_marker: false, workspace_ids: [seed.workspaceId], revoked_at: null });
        await dropConnection(agent);
    });

    test('a request id that does not exist shows the expired notice, not a form', async ({ page }) => {
        await page.goto('/oauth/consent?authorization_id=does-not-exist');
        await expect(page.getByText('This connection request has expired')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0);
    });

    test.describe('without JavaScript', () => {
        test.use({ javaScriptEnabled: false });

        test('Approve still connects', async ({ page, request }) => {
            const seed = getSeedResult();
            const auth = await beginAuthorization(request);
            const callback = await decide(page, auth.authorizationId, 'approve');

            expect(new URL(callback).searchParams.get('code')).toBeTruthy();
            const row = await connectionRow(seed.ownerId, auth.clientId);
            expect(row).toMatchObject({ write_enabled: false, ai_marker: true, workspace_ids: null });
            await dropConnection({ userId: seed.ownerId, clientId: auth.clientId });
        });
    });
});

test.describe('account card', () => {
    test('a connection made in another tab appears when this tab becomes visible again', async ({ page, context, request }) => {
        const clientName = `E2E refresh ${Date.now()}`;
        await page.goto('/dashboard/account');
        const row = page.getByTestId('mcp-connection').filter({ hasText: clientName });
        await expect(row).toHaveCount(0);

        const other = await context.newPage();
        const agent = await connectMcp(other, request, { clientName });
        await other.close();

        await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
        await expect(row).toBeVisible();
        await dropConnection(agent);
    });

    test('the switches save to the connection', async ({ page, request }) => {
        const seed = getSeedResult();
        const clientName = `E2E switches ${Date.now()}`;
        const agent = await connectMcp(page, request, { clientName });

        await page.goto('/dashboard/account');
        const row = page.getByTestId('mcp-connection').filter({ hasText: clientName });
        await row.getByRole('switch', { name: 'Allow replying and changing status' }).click();
        await expect.poll(async () => (await connectionRow(seed.ownerId, agent.clientId))?.write_enabled).toBe(true);

        await row.getByRole('switch', { name: 'Mark replies as AI-assisted' }).click();
        await expect.poll(async () => (await connectionRow(seed.ownerId, agent.clientId))?.ai_marker).toBe(false);
        await dropConnection(agent);
    });
});
