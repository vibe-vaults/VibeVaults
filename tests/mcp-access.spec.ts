/**
 * Tier 1 — Revenue-critical: the MCP endpoint follows the workspace OWNER's billing.
 *
 * Same bug class as workspace-paused.spec.ts, for the new door: an agent connected by a member of a
 * workspace whose owner stopped paying must stop working, and so must the owner's own agent. The
 * gate is never the connecting user's plan. Reads are blocked too, not just writes: the data is
 * the product.
 *
 * Also pinned here: a member can connect at all (owners and members both may), and Disconnect on
 * the account page cuts a connection off on its very next call.
 *
 * Mutates the owner's billing state; runs serially and restores it in afterAll.
 */
import { test, expect } from '@playwright/test';
import { getSeedResult } from './utils/seed-result';
import { supabaseAdmin } from './utils/supabase-admin';
import { connectMcp, dropConnection, type McpClient } from './utils/mcp-oauth';
import { AUTH_FILES } from './fixtures/test-data';

test.describe.configure({ mode: 'serial' });

const yesterday = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

test.describe('MCP access follows the owner', () => {
    let original: { trial_ends_at: string | null; subscription_status: string | null; subscription_tier: string | null };
    let feedbackId: string;
    let connections: McpClient[] = [];

    test.beforeAll(async () => {
        const seed = getSeedResult();
        const { data } = await supabaseAdmin
            .from('profiles')
            .select('trial_ends_at, subscription_status, subscription_tier')
            .eq('id', seed.ownerId)
            .single();
        original = data!;

        const { data: fb } = await supabaseAdmin.from('feedbacks').insert({
            project_id: seed.projectId, content: 'MCP access spec', sender: 'client@example.com', type: 'Bug', status: 'open', metadata: {},
        }).select('id').single();
        feedbackId = fb!.id;
    });

    test.afterEach(async () => {
        for (const c of connections) await dropConnection(c);
        connections = [];
    });

    test.afterAll(async () => {
        const seed = getSeedResult();
        await supabaseAdmin.from('profiles').update(original).eq('id', seed.ownerId);
        await supabaseAdmin.from('feedbacks').delete().eq('id', feedbackId);
    });

    async function lapseOwner() {
        const seed = getSeedResult();
        await supabaseAdmin
            .from('profiles')
            .update({ trial_ends_at: yesterday(), subscription_status: null, subscription_tier: null })
            .eq('id', seed.ownerId);
    }

    async function expectLockedOut(connection: McpClient) {
        const seed = getSeedResult();

        const projects = await connection.callTool('list_projects');
        expect(projects.data.workspaces.find((w: any) => w.id === seed.workspaceId).paused).toBe(true);

        const reads = [
            await connection.callTool('list_feedback', { project_id: seed.projectId }),
            await connection.callTool('get_feedback', { feedback: feedbackId }),
        ];
        for (const r of reads) expect(r.isError).toBe(true);

        const writes = [
            await connection.callTool('reply_to_feedback', { feedback_id: feedbackId, content: 'should not land' }),
            await connection.callTool('update_feedback_status', { feedback_id: feedbackId, status: 'in review' }),
        ];
        for (const w of writes) expect(w.isError).toBe(true);

        const { count } = await supabaseAdmin.from('feedback_replies').select('id', { count: 'exact', head: true }).eq('feedback_id', feedbackId);
        expect(count).toBe(0);
        const { data: row } = await supabaseAdmin.from('feedbacks').select('status').eq('id', feedbackId).single();
        expect(row!.status).toBe('open');
    }

    test('a lapsed owner locks their own agent, reads and writes', async ({ page, request }) => {
        const seed = getSeedResult();
        const agent = await connectMcp(page, request, { write: true });
        connections.push(agent);

        const healthy = await agent.callTool('list_feedback', { project_id: seed.projectId });
        expect(healthy.isError).toBe(false);

        await lapseOwner();
        await expectLockedOut(agent);

        await supabaseAdmin.from('profiles').update(original).eq('id', seed.ownerId);
        const restored = await agent.callTool('list_feedback', { project_id: seed.projectId });
        expect(restored.isError).toBe(false);
    });

    test.describe('as a member', () => {
        test.use({ storageState: AUTH_FILES.member });

        test('a member can connect, and a lapsed owner locks the member\'s agent too', async ({ page, request }) => {
            const seed = getSeedResult();
            const agent = await connectMcp(page, request, { write: true });
            connections.push(agent);
            expect(agent.userId).toBe(seed.memberId);

            const healthy = await agent.callTool('get_feedback', { feedback: feedbackId });
            expect(healthy.isError).toBe(false);

            await lapseOwner();
            await expectLockedOut(agent);
        });
    });
});

test.describe('Disconnect', () => {
    test('disconnecting on the account page ends the connection on its next call', async ({ page, request }) => {
        const clientName = `E2E disconnect ${Date.now()}`;
        const agent = await connectMcp(page, request, { clientName });
        expect((await agent.callTool('list_projects')).isError).toBe(false);

        await page.goto('/dashboard/account');
        const row = page.getByTestId('mcp-connection').filter({ hasText: clientName });
        await row.getByRole('button', { name: 'Disconnect' }).click();
        await page.getByRole('alertdialog').getByRole('button', { name: 'Disconnect' }).click();
        await expect(row).toHaveCount(0);

        const after = await agent.rpc('tools/call', { name: 'list_projects', arguments: {} });
        expect(after.status).toBe(401);

        await dropConnection(agent);
    });
});
