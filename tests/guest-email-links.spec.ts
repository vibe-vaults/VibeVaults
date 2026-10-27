/**
 * Tier 1 — Guests must never be sent somewhere they cannot go.
 *
 * A guest arrives through a shareable review link: no account, and no
 * workspace_invites row either. Two links in notification emails are dead
 * ends for them, and both fail silently — the guest just lands on a login
 * wall and gives up, while the agency never learns the reply went unread:
 *
 *   1. "View in Dashboard" (an /api/email-redirect deep link) requires a
 *      session, so it bounces to /auth/login.
 *   2. "Lost widget access? Request a new link" points at /access, whose
 *      recovery enumerates members and invited clients only. For a guest it
 *      always reports success and sends nothing.
 *
 * These assertions run against the real rendered HTML from
 * `src/lib/notifications.ts`, so they break if a template regains a
 * dashboard link for a non-member.
 */
import { test, expect } from '@playwright/test';
import {
    sendAgencyReplyNotification,
    sendReplyNotification,
    sendReplyDigestEmail,
} from '../src/lib/notifications';
import { renderEmail as render } from './utils/email-capture';

const SITE = 'https://client-site.example.com';

const baseReply = {
    to: 'guest@example.com',
    projectName: 'Acme Redesign',
    replyContent: 'Thanks, fixed!',
    sender: 'agency@example.com',
    unsubscribeToken: 'tok-123',
    workspaceId: 'ws-1',
    projectId: 'proj-1',
    feedbackId: 'fb-1',
};

test.describe('agency reply email', () => {
    test('guest gets the site CTA, never the dashboard or recovery link', async () => {
        const html = await render(() =>
            sendAgencyReplyNotification({ ...baseReply, recipientKind: 'guest', siteUrl: SITE }));

        expect(html).not.toContain('/api/email-redirect');
        expect(html).not.toContain('View in Dashboard');
        expect(html).not.toContain('/access');
        expect(html).toContain(SITE);
        // The opt-out must survive — it is the one link a guest can use.
        expect(html).toContain('/unsubscribe?token=tok-123');
    });

    test('client keeps the recovery link but loses the dashboard link', async () => {
        const html = await render(() =>
            sendAgencyReplyNotification({ ...baseReply, recipientKind: 'client', siteUrl: SITE }));

        expect(html).not.toContain('/api/email-redirect');
        expect(html).toContain('/access');
    });

    test('member still gets the dashboard link', async () => {
        const html = await render(() =>
            sendAgencyReplyNotification({ ...baseReply, recipientKind: 'member' }));

        expect(html).toContain('/api/email-redirect');
        expect(html).toContain('View in Dashboard');
        expect(html).toContain('/access');
    });
});

test.describe('direct reply email', () => {
    test('guest gets no recovery link', async () => {
        const html = await render(() => sendReplyNotification({
            to: 'guest@example.com',
            projectName: 'Acme Redesign',
            replyContent: 'Thanks!',
            originalFeedback: 'Button is broken',
            sender: 'agency@example.com',
            unsubscribeToken: 'tok-123',
            recipientKind: 'guest',
            siteUrl: SITE,
        }));

        expect(html).not.toContain('/access');
        expect(html).toContain('/unsubscribe?token=tok-123');
    });
});

test.describe('reply digest email', () => {
    const items = [{
        replyContent: 'Fixed in staging',
        sender: 'agency@example.com',
        projectName: 'Acme Redesign',
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        feedbackId: 'fb-1',
    }];

    test('guest digest has no dashboard links at all', async () => {
        const html = await render(() =>
            sendReplyDigestEmail({ to: 'guest@example.com', items, unsubscribeToken: 'tok-123', recipientKind: 'guest', siteUrl: SITE }));

        // Covers both the main CTA and the per-item "View →" links.
        expect(html).not.toContain('/api/email-redirect');
        expect(html).not.toContain('View in Dashboard');
        expect(html).not.toContain('/access');
        expect(html).toContain(SITE);
    });

    test('member digest keeps them', async () => {
        const html = await render(() =>
            sendReplyDigestEmail({ to: 'owner@example.com', items, unsubscribeToken: 'tok-123', recipientKind: 'member' }));

        expect(html).toContain('/api/email-redirect');
        expect(html).toContain('View in Dashboard');
    });
});
