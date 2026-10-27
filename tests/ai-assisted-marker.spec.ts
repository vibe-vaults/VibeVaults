/**
 * Tier 1 — A reply an AI tool sent is labelled as such wherever a person reads it.
 *
 * The AI-assisted marker is the mitigation for "we cannot tell whether a human read this reply
 * before the agent sent it" (see the MCP section of CLAUDE.md and ToS section 8). A marker that is
 * stored but not shown protects nobody, and the docs promise clients see it. It has to reach every
 * reader: the notification emails (single and digest), the widget thread (covered in
 * widget-pinning.spec.ts, which owns the harness) and the dashboard thread.
 *
 * Emails are rendered from the real templates; the dashboard check seeds a reply row and loads the
 * real feedback page.
 */
import { test, expect } from '@playwright/test';
import {
    sendAgencyReplyNotification,
    sendReplyNotification,
    sendReplyDigestEmail,
} from '../src/lib/notifications';
import { renderEmail } from './utils/email-capture';
import { getSeedResult } from './utils/seed-result';
import { supabaseAdmin } from './utils/supabase-admin';

const NOTE = 'Written with AI assistance';

const base = {
    to: 'client@example.com',
    projectName: 'Acme Redesign',
    replyContent: 'Fixed in the latest deploy.',
    sender: 'agency@example.com',
    unsubscribeToken: 'tok-123',
};

test.describe('notification emails', () => {
    test('client reply email shows the note only when the reply was AI-assisted', async () => {
        const send = (aiAssisted?: boolean) => renderEmail(() =>
            sendReplyNotification({ ...base, originalFeedback: 'Button is broken', recipientKind: 'client', aiAssisted }));

        expect(await send(true)).toContain(NOTE);
        expect(await send(false)).not.toContain(NOTE);
        expect(await send()).not.toContain(NOTE);
    });

    test('team reply email shows the note only when the reply was AI-assisted', async () => {
        const send = (aiAssisted?: boolean) => renderEmail(() =>
            sendAgencyReplyNotification({ ...base, recipientKind: 'member', aiAssisted }));

        expect(await send(true)).toContain(NOTE);
        expect(await send(false)).not.toContain(NOTE);
    });

    test('digest labels only the AI-assisted replies in it', async () => {
        const html = await renderEmail(() => sendReplyDigestEmail({
            to: base.to,
            recipientKind: 'client',
            unsubscribeToken: base.unsubscribeToken,
            items: [
                { replyContent: 'One', sender: base.sender, projectName: base.projectName, aiAssisted: true },
                { replyContent: 'Two', sender: base.sender, projectName: base.projectName },
            ],
        }));

        expect(html.split(NOTE)).toHaveLength(2);
    });
});

test.describe('dashboard thread', () => {
    let feedbackId: string;

    test.beforeAll(async () => {
        const seed = getSeedResult();
        const { data } = await supabaseAdmin.from('feedbacks').insert({
            project_id: seed.projectId, content: 'Marker display spec', sender: 'client@example.com', type: 'Bug', status: 'open', metadata: {},
        }).select('id').single();
        feedbackId = data!.id;
        await supabaseAdmin.from('feedback_replies').insert([
            { feedback_id: feedbackId, content: 'Sent by my AI tool', user_id: seed.ownerId, author_role: 'agency', author_name: seed.ownerEmail, metadata: { via: 'mcp', ai_assisted: true } },
            { feedback_id: feedbackId, content: 'Typed by me', user_id: seed.ownerId, author_role: 'agency', author_name: seed.ownerEmail },
        ]);
    });

    test.afterAll(async () => {
        await supabaseAdmin.from('feedbacks').delete().eq('id', feedbackId);
    });

    test('only the AI-assisted reply carries the badge', async ({ page, context }) => {
        const seed = getSeedResult();
        await context.addCookies([
            { name: 'selectedWorkspaceId', value: seed.workspaceId, url: 'http://127.0.0.1:3000' },
            { name: 'selectedProjectId', value: seed.projectId, url: 'http://127.0.0.1:3000' },
        ]);
        await page.goto(`/dashboard/feedback/${feedbackId}`);

        await expect(page.getByText('Sent by my AI tool')).toBeVisible();
        await expect(page.getByText('Typed by me')).toBeVisible();
        await expect(page.getByText('AI-assisted')).toHaveCount(1);
    });
});
