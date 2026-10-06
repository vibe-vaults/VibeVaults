import { test, expect, Page } from '@playwright/test';
import { generateMagicLink } from './utils/supabase-admin';
import { AUTH_FILES } from './fixtures/test-data';

// ---------------------------------------------------------------------------
// Onboarding helper — only used by the fresh-user onboarding test.
// Creates a brand-new user so the onboarding card is guaranteed to show.
// ---------------------------------------------------------------------------
async function signInFreshUser(page: Page): Promise<void> {
    const testEmail = `e2e-onboard-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const magicLink = await generateMagicLink(testEmail);
    await page.goto(magicLink);
    await page.waitForURL('**/dashboard**');
}

// ---------------------------------------------------------------------------
// Onboarding flow — requires a completely unauthenticated fresh user.
// Overrides the project-level storageState to start with no session.
// ---------------------------------------------------------------------------
test.describe('Onboarding flow', () => {
    test.use({ storageState: AUTH_FILES.empty });

    test('new user completes onboarding and reaches dashboard', async ({ page }) => {
        await signInFreshUser(page);

        // Onboarding card must appear
        await expect(page.locator('text=Getting Started 🚀')).toBeVisible();

        // Open "Create a project" dialog via the clickable step label
        await page.getByRole('button', { name: /Create a project/i }).click();

        // Fill and submit the dialog
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.locator('#createProjectName').fill('My Test Project');
        await page.locator('#createWebsiteUrl').fill('https://example.com');
        await page.getByRole('dialog').getByRole('button', { name: /^create$/i }).click();

        // Post-create embed step: shows the snippet and waits for the widget to
        // be seen on the site. A brand-new project has never loaded it, so the
        // step stays in its waiting state and offers Cancel, not Activate.
        await expect(page.getByRole('dialog')).toContainText('My Test Project is ready');
        await expect(page.getByRole('dialog').getByLabel('Widget embed snippet')).toHaveValue(/widget\.js/);
        await expect(page.getByRole('dialog')).toContainText('Waiting for the widget');
        await expect(page.getByRole('dialog').getByRole('button', { name: /activate widget/i })).toHaveCount(0);
        await page.getByRole('dialog').getByRole('button', { name: /^cancel$/i }).click();

        await expect(page.getByRole('dialog')).toBeHidden();

        // The chevron only minimizes: the checklist shrinks to the Resume banner.
        await page.getByRole('button', { name: 'Minimize' }).click();
        await expect(page.getByRole('button', { name: /resume/i })).toBeVisible();
        await page.getByRole('button', { name: /resume/i }).click();

        // Dismiss onboarding: gone entirely, not minimized
        await expect(page.getByText("I'll explore on my own")).toBeVisible();
        await page.getByText("I'll explore on my own").click();
        await expect(page.locator('text=Getting Started 🚀')).toBeHidden();
        await expect(page.getByRole('button', { name: /resume/i })).toHaveCount(0);

        // Dashboard renders with the new project
        await expect(page.locator('h1')).toContainText('Overview');
        await expect(page.locator('h1')).toContainText('My Test Project');
        await expect(page.locator('text=Total Feedback')).toBeVisible();
        await expect(page.locator('text=Questions or Problems?')).toBeVisible();

        // Dismissal survives a reload (it's the profile flag, not localStorage)
        await page.reload();
        await expect(page.locator('h1')).toContainText('Overview');
        await expect(page.locator('text=Getting Started 🚀')).toBeHidden();

        // The Account page toggle brings it back
        // Via the deep link: the Highlight spotlight must not swallow the
        // first click, so wait for it to be up and toggle straight through it.
        await page.goto('/dashboard/account#onboarding');
        await expect(page.locator('.highlight-persist')).toBeVisible();
        const toggle = page.getByRole('switch', { name: /show checklist on dashboard/i });
        await expect(toggle).not.toBeChecked();
        await toggle.click();
        await expect(toggle).toBeChecked();
        await expect(page.locator('.highlight-persist')).toHaveCount(0);
        await expect(page.getByText('Saved')).toBeVisible();
        await page.goto('/dashboard');
        await expect(page.locator('text=Getting Started 🚀')).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Pre-authenticated tests — use the storageState created by globalSetup.
// These tests skip the onboarding/auth steps and run significantly faster.
// ---------------------------------------------------------------------------
test.describe('Dashboard pages — authenticated user', () => {

    test('overview page renders correctly', async ({ page }) => {
        await page.goto('/dashboard');

        await expect(page.locator('h1')).toContainText('Overview');
        await expect(page.locator('text=Total Feedback')).toBeVisible();
        await expect(page.locator('text=Questions or Problems?')).toBeVisible();
    });

    test('project settings page renders correctly', async ({ page }) => {
        await page.goto('/dashboard/project-settings', { waitUntil: 'domcontentloaded' });

        await expect(page.locator('h1')).toContainText('Project Settings');
        await expect(page.locator('text=Project Name')).toBeVisible();
        await expect(page.locator('text=Embed widget').first()).toBeVisible();
    });

    test('users page renders correctly', async ({ page }) => {
        await page.goto('/dashboard/settings/users', { waitUntil: 'domcontentloaded' });

        await expect(page.locator('h1')).toContainText('Users');
        await expect(page.getByRole('button', { name: /invite/i })).toBeVisible();
    });
});
