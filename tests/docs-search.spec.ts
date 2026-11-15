/**
 * Tier 2 — Public docs: search box
 *
 * `DocsSearch` builds its index by fetching the rendered docs pages and
 * splitting `.docs-prose` at its <h2 id> headings. The failure mode is silent:
 * if a page stops rendering `.docs-prose`, or a heading loses its id, search
 * still "works" but quietly stops finding that content or links to the wrong
 * place. So the tests search for words that live only in a section BODY and
 * assert the deep link lands on the right anchor.
 *
 * Runs signed out: the docs are public, and that is who searches them.
 */
import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('a body-only term finds its section and deep-links to the heading', async ({ page }) => {
    await page.goto('/docs');
    const box = page.getByRole('combobox', { name: 'Search documentation' }).first();
    await box.fill('unsafe-inline');

    const result = page.getByRole('option').filter({ hasText: 'strict Content Security Policy' });
    await expect(result).toBeVisible();
    await result.click();

    await expect(page).toHaveURL(/\/docs\/troubleshooting#strict-csp$/);
    await expect(page.locator('#strict-csp')).toBeInViewport();
});

test('keyboard: "/" focuses, arrows + Enter open a result, no match says so', async ({ page }) => {
    await page.goto('/docs/quick-start');
    const box = page.getByRole('combobox', { name: 'Search documentation' }).first();
    await expect(box).toBeEnabled();
    await page.locator('body').click();
    await page.keyboard.press('/');
    await expect(box).toBeFocused();

    await page.keyboard.type('zzqqxx-nothing');
    await expect(page.getByText('No results for')).toBeVisible();

    await box.fill('hardware acceleration');
    await expect(page.getByRole('option').first()).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/docs\/[a-z-]+#[a-z-]+$/);
});

test('every docs page is indexed: each page title is findable', async ({ page }) => {
    // Guards against a page dropping out of the index (fetch failure or a
    // missing .docs-prose), which would otherwise only show as fewer results.
    await page.goto('/docs');
    const box = page.getByRole('combobox', { name: 'Search documentation' }).first();
    for (const title of ['Quick start', 'Pinning feedback', 'Troubleshooting', 'AI agents (MCP)']) {
        await box.fill(title);
        await expect(page.getByRole('option').first()).toContainText(title);
    }
});
