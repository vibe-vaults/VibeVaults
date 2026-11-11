/**
 * Main Responsibility: Pins the embed status pill on the Embed widget card
 * (`/dashboard/project-settings`), derived from `projects.widget_last_seen_at`
 * by `getWidgetEmbedState()`: never seen -> "Not detected", seen within 7 days
 * -> "Embedded", older -> "Not seen in 7 days".
 *
 * Sensitive Dependencies:
 * - Mutates the seed project's `widget_last_seen_at`; saved in beforeAll and
 *   restored in afterAll so later spec files see the seeded value.
 * - Single browser: the pill is server-rendered, and the column is shared state
 *   that parallel browser projects would race on.
 */

import { test, expect } from '@playwright/test';
import { supabaseAdmin } from './utils/supabase-admin';
import { getSeedResult } from './utils/seed-result';
import { AUTH_FILES } from './fixtures/test-data';

test.describe.configure({ mode: 'serial' });
test.skip(({ browserName }) => browserName !== 'chromium', 'Server-rendered pill on shared seed state');

const DAY_MS = 24 * 60 * 60 * 1000;

test.describe('Embed widget status pill', () => {
    test.use({ storageState: AUTH_FILES.owner });

    let originalLastSeen: string | null = null;

    test.beforeAll(async () => {
        const { data, error } = await supabaseAdmin
            .from('projects')
            .select('widget_last_seen_at')
            .eq('id', getSeedResult().projectId)
            .single();
        if (error) throw error;
        originalLastSeen = data.widget_last_seen_at;
    });

    test.afterAll(async () => {
        await supabaseAdmin
            .from('projects')
            .update({ widget_last_seen_at: originalLastSeen })
            .eq('id', getSeedResult().projectId);
    });

    const cases: { name: string; lastSeen: () => string | null; state: string; label: string }[] = [
        { name: 'never seen', lastSeen: () => null, state: 'not_detected', label: 'Not detected' },
        { name: 'seen just now', lastSeen: () => new Date().toISOString(), state: 'embedded', label: 'Embedded' },
        { name: 'seen 6 days ago', lastSeen: () => new Date(Date.now() - 6 * DAY_MS).toISOString(), state: 'embedded', label: 'Embedded' },
        { name: 'seen 8 days ago', lastSeen: () => new Date(Date.now() - 8 * DAY_MS).toISOString(), state: 'stale', label: 'Not seen in 7 days' },
    ];

    for (const c of cases) {
        test(`${c.name} -> "${c.label}"`, async ({ page }) => {
            const { error } = await supabaseAdmin
                .from('projects')
                .update({ widget_last_seen_at: c.lastSeen() })
                .eq('id', getSeedResult().projectId);
            expect(error).toBeNull();

            await page.goto('/dashboard/project-settings');
            const pill = page.getByTestId('widget-embed-status');
            await expect(pill).toBeVisible({ timeout: 10_000 });
            await expect(pill).toHaveAttribute('data-state', c.state);
            await expect(pill).toHaveText(c.label);
        });
    }
});
