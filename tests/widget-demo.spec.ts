/**
 * Tier 1 — Public /demo sandbox: the real widget against the in-browser backend
 *
 * The demo page tells anonymous visitors "nothing you type leaves your
 * browser". That is only true while `public/widget-demo-backend.js` answers
 * every widget request and `public/widget.js` routes all of its traffic
 * through the hook, beacons included. A regression here would quietly send
 * demo text to the production API (where it would 401 against a key that
 * matches no project, so nobody would notice), so the headline assertion is
 * that no `/api/` request is made at all.
 *
 * Like the other widget specs this needs a browser but no DB or dev server:
 * the real files are served from a synthetic origin and everything else is
 * refused.
 */
import { test, expect, type Page, type Route } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const HOST = 'https://demo-harness.test';
const read = (f: string) => readFileSync(path.join(process.cwd(), 'public', f), 'utf8');

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;font-family:sans-serif} section{padding:60px}
  </style></head><body>
  <section><h1 id="headline">Freshly baked, evrey morning.</h1>
    <span id="demo-order-btn" style="display:inline-block;padding:14px 26px;background:#6b3f1d;color:#fff">Order</span></section>
  <section><div id="demo-hours" style="width:320px;height:160px;background:#3f6b4a"></div></section>
  <script src="${HOST}/widget-demo-backend.js"></script>
  <script src="${HOST}/widget.js" data-key="demo-sandbox"></script>
</body></html>`;

const shadow = (page: Page, fn: string) =>
    page.evaluate((f) => {
        const root = document.querySelector('#vibe-vaults-widget-host')!.shadowRoot!;
        return new Function('root', f)(root);
    }, fn);

// Stand-in for snapdom (normally fetched from a CDN) so a screenshot really
// lands in the attachments. Same approach as `tests/utils/widget-harness.ts`.
const FAKE_SNAPDOM = `window.snapdom = { toCanvas: () => { const c = document.createElement('canvas');
    c.width = document.body.scrollWidth; c.height = document.body.scrollHeight; return Promise.resolve(c); } };`;

/** Collects sandbox events from the very first script of every document on. */
function recordDemoEvents(page: Page) {
    return page.addInitScript(() => {
        (window as unknown as { __events: unknown[] }).__events = [];
        window.addEventListener('vv:demo', (e) => (window as unknown as { __events: unknown[] }).__events.push((e as CustomEvent).detail));
    });
}

async function mountDemo(page: Page, opts: { fakeSnapdom?: boolean } = {}) {
    const apiCalls: string[] = [];
    await page.route('**', async (route: Route) => {
        const url = route.request().url();
        // WebKit sends blob: fetches through interception too (Chromium and
        // Firefox do not), so the catch-all abort below would fail the demo's
        // own screenshot URLs there. They never leave the browser anyway.
        if (url.startsWith('blob:')) return route.continue();
        if (url.includes('/api/')) {
            apiCalls.push(`${route.request().method()} ${url}`);
            return route.abort();
        }
        if (url === `${HOST}/widget.js`) return route.fulfill({ contentType: 'application/javascript', body: read('widget.js') });
        if (url === `${HOST}/widget-demo-backend.js`) return route.fulfill({ contentType: 'application/javascript', body: read('widget-demo-backend.js') });
        if (url.startsWith(`${HOST}/`)) return route.fulfill({ contentType: 'text/html', body: PAGE });
        if (opts.fakeSnapdom && url.includes('cdn.jsdelivr.net')) {
            return route.fulfill({ contentType: 'application/javascript', body: FAKE_SNAPDOM });
        }
        return route.abort(); // snapdom CDN etc.: exercise the capture-failure path offline
    });
    await recordDemoEvents(page);
    await page.goto(`${HOST}/demo`);
    return { apiCalls };
}

/**
 * A reload the page can recognise as one. The guide decides between resuming
 * and starting over from the Navigation Timing entry (`isReloadOfDemo`), and
 * Playwright's page.reload() in Firefox is reported there as `navigate`, not
 * `reload`. A real F5 or location.reload() reports `reload` in every browser.
 */
async function browserReload(page: Page) {
    await Promise.all([
        page.waitForEvent('load'),
        page.evaluate(() => location.reload()).catch(() => { /* context torn down by the reload */ }),
    ]);
}

const events = (page: Page) =>
    page.evaluate(() => (window as unknown as { __events: { type: string; stage?: number }[] }).__events);

async function openWidget(page: Page) {
    await expect.poll(() => page.evaluate(() =>
        (document.querySelector('#vibe-vaults-widget-host') as HTMLElement | null)?.style.display)).toBe('block');
    await shadow(page, `if (!root.querySelector('.popup').classList.contains('open')) root.querySelector('.trigger-btn').click();`);
    await page.waitForTimeout(150);
}

async function pinAndSubmit(page: Page, text: string, opts: { waitForScreenshot?: boolean } = {}) {
    await openWidget(page);
    await shadow(page, `root.querySelector('#vv-action-pin').click();`);
    await page.waitForTimeout(120);
    const box = (await page.locator('h1').first().boundingBox())!;
    await page.mouse.move(box.x + 40, box.y + box.height / 2);
    await page.mouse.click(box.x + 40, box.y + box.height / 2);
    await expect.poll(() => shadow(page, `return root.querySelector('#vv-composer').classList.contains('open');`)).toBe(true);
    if (opts.waitForScreenshot) {
        await expect.poll(() => shadow(page, `return root.querySelectorAll('#vv-composer-previews img').length;`), { timeout: 10_000 }).toBe(1);
    }
    await shadow(page, `root.querySelector('#vv-composer-text').value = ${JSON.stringify(text)}; root.querySelector('#vv-composer-submit').click();`);
    await expect.poll(async () => (await events(page)).some((e) => e.type === 'feedback_submitted')).toBe(true);
}

test.describe('demo sandbox', () => {
    test('renders for an anonymous visitor with the seeded pins', async ({ page }) => {
        const { apiCalls } = await mountDemo(page);
        await openWidget(page);
        await expect.poll(() => shadow(page, `return root.querySelectorAll('.pin-marker:not(.pending)').length;`)).toBe(2);
        expect(apiCalls).toEqual([]);
    });

    test('a pin gets the scripted agency reply and reaches review, with zero API traffic', async ({ page }) => {
        const { apiCalls } = await mountDemo(page);
        await pinAndSubmit(page, 'Typo: evrey');

        await expect.poll(async () => (await events(page)).map((e) => e.type), { timeout: 15_000 })
            .toContain('loop_complete');

        // The list, once opened (as the /demo guide tells visitors to), reflects
        // the status the agency moved it to.
        await shadow(page, `if (!root.querySelector('.popup').classList.contains('list-open')) root.querySelector('#vv-action-list').click();`);
        await expect.poll(() => shadow(page, `
            const item = Array.from(root.querySelectorAll('.feedback-item')).find((el) => el.textContent.includes('Typo: evrey'));
            return item ? item.querySelector('.feedback-status').textContent.trim() : null;`), { timeout: 5_000 })
            .toBe('in review');

        // And the thread carries both agency replies.
        await shadow(page, `Array.from(root.querySelectorAll('.feedback-item')).find((el) => el.textContent.includes('Typo: evrey')).click();`);
        await expect.poll(() => shadow(page, `return root.querySelectorAll('#vv-chat .msg-wrapper.other').length;`)).toBe(2);

        expect(apiCalls).toEqual([]);
    });

    test('a refresh keeps the visitor\'s pin and replays their progress', async ({ page }) => {
        const { apiCalls } = await mountDemo(page);
        await pinAndSubmit(page, 'Keep me');
        await page.reload();
        await expect.poll(async () => (await events(page)).find((e) => e.type === 'progress')?.stage).toBeGreaterThanOrEqual(1);
        await openWidget(page);
        await expect.poll(() => shadow(page, `return root.querySelectorAll('.pin-marker:not(.pending)').length;`)).toBe(3);
        expect(apiCalls).toEqual([]);
    });

    test('screenshots are served as openable blob: URLs, also after a refresh', async ({ page }) => {
        // Browsers refuse to open a data: URL in a new tab, which is what the
        // widget does when an attachment is clicked; the demo once showed a
        // blank page there.
        const { apiCalls } = await mountDemo(page, { fakeSnapdom: true });
        await pinAndSubmit(page, 'With a screenshot', { waitForScreenshot: true });
        const screenshotHref = async () => {
            await shadow(page, `if (!root.querySelector('.popup').classList.contains('list-open')) root.querySelector('#vv-action-list').click();`);
            await expect.poll(() => shadow(page, `
                const item = Array.from(root.querySelectorAll('.feedback-item')).find((el) => el.textContent.includes('With a screenshot'));
                if (item) item.click();
                return !!item;`)).toBe(true);
            let href: string | null = null;
            await expect.poll(async () => (href = await shadow(page, `
                const a = root.querySelector('.view-detail .msg-attachments a');
                return a ? a.getAttribute('href') : null;`)), { timeout: 10_000 }).toMatch(/^blob:/);
            return href!;
        };
        const opens = (u: string) => page.evaluate(async (x) => (await fetch(x)).ok, u);

        expect(await opens(await screenshotHref())).toBe(true);

        await page.reload();
        await openWidget(page);
        expect(await opens(await screenshotHref())).toBe(true);
        expect(apiCalls).toEqual([]);
    });
});

// The real /demo page on the dev server, for what only the page itself owns:
// a visitor who leaves and comes back starts over, a refresh resumes.
test.describe('demo page lifecycle', () => {
    const guide = (page: Page) => page.locator('aside[aria-label="Demo guide"]');
    // The widget's own list, not on-page markers: a pin below the fold is
    // not painted, so a marker count depends on the viewport.
    const listed = async (page: Page) => {
        await shadow(page, `if (!root.querySelector('.popup').classList.contains('list-open')) root.querySelector('#vv-action-list').click();`);
        return shadow(page, `return Array.from(root.querySelectorAll('.feedback-item .feedback-preview')).map((el) => el.textContent);`);
    };

    test('leaving and coming back restarts the run; a refresh resumes it', async ({ page }) => {
        await recordDemoEvents(page);
        await page.goto('/demo');
        await expect(guide(page)).toContainText('0/2');
        await pinAndSubmit(page, 'First visit');
        await expect(guide(page)).toContainText('1/2');

        // Away (full load of the landing page) and back through its CTA
        // (a client-side navigation): a fresh run with only the seeded pins.
        await page.locator('a[href="/"]').first().click();
        await page.waitForURL((u) => u.pathname === '/');
        await page.getByRole('link', { name: 'Try it live, no signup' }).click();
        await page.waitForURL('**/demo');
        await expect(guide(page)).toContainText('0/2');
        await openWidget(page);
        await expect.poll(async () => (await listed(page)).length).toBe(2);
        expect((await listed(page)).join('|')).not.toContain('First visit');
        await shadow(page, `root.querySelector('#vv-action-list').click();`); // close the list again

        // Let the previous visit's scripted reply come due: it must not leak
        // into this run.
        await page.waitForTimeout(3_000);
        await expect(guide(page)).toContainText('0/2');

        await pinAndSubmit(page, 'Second visit');
        await expect(guide(page)).toContainText('1/2');
        await browserReload(page);
        await expect(guide(page)).toContainText('1/2');
        await openWidget(page);
        await expect.poll(async () => (await listed(page)).join('|')).toContain('Second visit');
    });

    test('the bakery pages are client-side routes, each with its own pins', async ({ page }) => {
        // The demo doubles as our own check of widget.js on a Next site: the
        // nav is <Link>s, so every move below is a pushState, never a load.
        const markers = () => shadow(page, `return root.querySelectorAll('.pin-marker:not(.pending)').length;`);
        const sameDocument = () => page.evaluate(() => (window as unknown as { __vvSameDoc?: boolean }).__vvSameDoc === true);
        await recordDemoEvents(page);
        await page.goto('/demo');
        await page.evaluate(() => { (window as unknown as { __vvSameDoc: boolean }).__vvSameDoc = true; });
        await openWidget(page);
        await expect.poll(markers).toBeGreaterThan(0); // the seeded pins live on the home page

        await page.locator('header nav').getByRole('link', { name: 'Menu', exact: true }).click();
        await page.waitForURL('**/demo/menu');
        await expect.poll(markers).toBe(0);
        await pinAndSubmit(page, 'This bread has no price');
        await expect.poll(markers).toBe(1);

        await page.locator('header nav').getByRole('link', { name: 'Our story', exact: true }).click();
        await page.waitForURL('**/demo/story');
        await expect.poll(markers).toBe(0);

        // Opening the thread from the list takes the visitor to its page.
        await shadow(page, `if (!root.querySelector('.popup').classList.contains('list-open')) root.querySelector('#vv-action-list').click();`);
        await expect.poll(() => shadow(page, `return Array.from(root.querySelectorAll('.feedback-item')).some((el) => el.textContent.includes('This bread has no price'));`)).toBe(true);
        await shadow(page, `Array.from(root.querySelectorAll('.feedback-item')).find((el) => el.textContent.includes('This bread has no price')).click();`);
        await page.waitForURL('**/demo/menu');
        await expect.poll(() => shadow(page, `return root.querySelectorAll('.pin-marker.pulsing').length;`)).toBe(1);

        expect(await sameDocument()).toBe(true);
    });

    test('an in-app back and return starts over, and the old run cannot leak in', async ({ page }) => {
        await recordDemoEvents(page);
        await page.goto('/');
        await page.getByRole('link', { name: 'Try it live, no signup' }).click();
        await page.waitForURL('**/demo');
        await pinAndSubmit(page, 'Before going back');
        await expect(guide(page)).toContainText('1/2');

        // Client-side back and forth: same document, so the first visit's
        // sandbox (and its scripted-reply timers) would still be around.
        await page.goBack();
        await page.waitForURL((u) => u.pathname === '/');
        await page.getByRole('link', { name: 'Try it live, no signup' }).click();
        await page.waitForURL('**/demo');
        await expect(guide(page)).toContainText('0/2');

        // The first run's reply comes due in this window; it must not move the
        // fresh run along.
        await page.waitForTimeout(4_000);
        await expect(guide(page)).toContainText('0/2');
        await openWidget(page);
        expect((await listed(page)).join('|')).not.toContain('Before going back');
    });
});
