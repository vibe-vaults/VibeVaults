/**
 * Tier 1 — Public /demo sandbox: the real widget and the agency pane against
 * the in-browser backend
 *
 * The demo page tells anonymous visitors "nothing you type leaves your
 * browser". That is only true while `public/widget-demo-backend.js` answers
 * every widget request and `public/widget.js` routes all of its traffic
 * through the hook, beacons included. A regression here would quietly send
 * demo text to the production API (where it would 401 against a key that
 * matches no project, so nobody would notice), so the headline assertion is
 * that no `/api/` request is made at all.
 *
 * The first block needs a browser but no DB or dev server: the real files are
 * served from a synthetic origin and everything else is refused. The second
 * drives the real /demo page (bakery in an iframe on the left, the agency
 * dashboard on the right) on the dev server.
 */
import { test, expect, type Frame, type Page, type Route } from '@playwright/test';
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

type Target = Page | Frame;

const shadow = (target: Target, fn: string) =>
    target.evaluate((f) => {
        const root = document.querySelector('#vibe-vaults-widget-host')!.shadowRoot!;
        return new Function('root', f)(root);
    }, fn);

// Stand-in for snapdom (normally fetched from a CDN) so a screenshot really
// lands in the attachments. Same approach as `tests/utils/widget-harness.ts`.
const FAKE_SNAPDOM = `window.snapdom = { toCanvas: () => { const c = document.createElement('canvas');
    c.width = document.body.scrollWidth; c.height = document.body.scrollHeight; return Promise.resolve(c); } };`;

/** Collects sandbox events (emitted in the top window) from its first script on. */
function recordDemoEvents(page: Page) {
    return page.addInitScript(() => {
        if (window.top !== window) return;
        (window as unknown as { __events: unknown[] }).__events = [];
        window.addEventListener('vv:demo', (e) => (window as unknown as { __events: unknown[] }).__events.push((e as CustomEvent).detail));
    });
}

const events = (page: Page) =>
    page.evaluate(() => (window as unknown as { __events: { type: string; stage?: number }[] }).__events);

/** Every `/api/` request the page (any frame) makes. The demo must make none. */
function recordApiCalls(page: Page) {
    const calls: string[] = [];
    page.on('request', (r) => { if (new URL(r.url()).pathname.startsWith('/api/')) calls.push(`${r.method()} ${r.url()}`); });
    return calls;
}

async function mountHarness(page: Page, opts: { fakeSnapdom?: boolean } = {}) {
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
    // The seeded pins are filed under the bakery's home page.
    await page.goto(`${HOST}/demo/site`);
    return { apiCalls };
}

/**
 * A reload the page can recognise as one. The demo decides between resuming
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

async function openWidget(target: Target) {
    await expect.poll(() => target.evaluate(() =>
        (document.querySelector('#vibe-vaults-widget-host') as HTMLElement | null)?.style.display)).toBe('block');
    await shadow(target, `if (!root.querySelector('.popup').classList.contains('open')) root.querySelector('.trigger-btn').click();`);
    await target.waitForTimeout(150);
}

async function openList(target: Target) {
    await shadow(target, `if (!root.querySelector('.popup').classList.contains('list-open')) root.querySelector('#vv-action-list').click();`);
}

async function openThread(target: Target, text: string) {
    await openList(target);
    await expect.poll(() => shadow(target, `
        const item = Array.from(root.querySelectorAll('.feedback-item')).find((el) => el.textContent.includes(${JSON.stringify(text)}));
        if (item) item.click();
        return !!item;`), { timeout: 8_000 }).toBe(true);
}

/** Pin the first heading and submit. `page` drives the mouse; `target` holds the widget. */
async function pinAndSubmit(page: Page, target: Target, text: string, opts: { waitForScreenshot?: boolean } = {}) {
    await openWidget(target);
    await shadow(target, `root.querySelector('#vv-action-pin').click();`);
    await target.waitForTimeout(120);
    // boundingBox() is in the top page's coordinates, iframe or not.
    const box = (await target.locator('h1').first().boundingBox())!;
    await page.mouse.move(box.x + 40, box.y + box.height / 2);
    await page.mouse.click(box.x + 40, box.y + box.height / 2);
    await expect.poll(() => shadow(target, `return root.querySelector('#vv-composer').classList.contains('open');`)).toBe(true);
    if (opts.waitForScreenshot) {
        await expect.poll(() => shadow(target, `return root.querySelectorAll('#vv-composer-previews img').length;`), { timeout: 10_000 }).toBe(1);
    }
    await shadow(target, `root.querySelector('#vv-composer-text').value = ${JSON.stringify(text)}; root.querySelector('#vv-composer-submit').click();`);
    await expect.poll(async () => (await events(page)).some((e) => e.type === 'feedback_submitted')).toBe(true);
}

test.describe('demo sandbox backend', () => {
    test('renders for an anonymous visitor with the seeded pins', async ({ page }) => {
        const { apiCalls } = await mountHarness(page);
        await openWidget(page);
        await expect.poll(() => shadow(page, `return root.querySelectorAll('.pin-marker:not(.pending)').length;`)).toBe(2);
        expect(apiCalls).toEqual([]);
    });

    test('the agency side answers a pin: reply and status reach the widget, and the run walks its four steps', async ({ page }) => {
        const { apiCalls } = await mountHarness(page);
        const stage = () => page.evaluate(() => (window as unknown as { __vvDemoBackend: { stage: () => number } }).__vvDemoBackend.stage());
        expect(await stage()).toBe(0);
        await pinAndSubmit(page, page, 'Typo: evrey');
        expect(await stage()).toBe(1);

        // What the agency pane does with it, through the same backend.
        await page.evaluate(async () => {
            const b = (window as unknown as { __vvDemoBackend: {
                tourFeedbackId: () => string;
                agency: {
                    open: (id: string) => void;
                    reply: (id: string, c: string, f: File[]) => Promise<unknown>;
                    setStatus: (id: string, s: string) => unknown;
                    get: (id: string) => { metadata: { anchor?: unknown } };
                };
            } }).__vvDemoBackend;
            const id = b.tourFeedbackId();
            if (!b.agency.get(id).metadata.anchor) throw new Error('the agency must get the pin with its metadata');
            b.agency.open(id);
            await b.agency.reply(id, 'Fixing it now.', []);
            b.agency.setStatus(id, 'in review');
        });
        expect(await stage()).toBe(3);

        await openList(page);
        await expect.poll(() => shadow(page, `
            const item = Array.from(root.querySelectorAll('.feedback-item')).find((el) => el.textContent.includes('Typo: evrey'));
            return item ? item.querySelector('.feedback-status').textContent.trim() : null;`), { timeout: 5_000 })
            .toBe('in review');

        // Reading the thread in the widget is the last step of the run.
        await openThread(page, 'Typo: evrey');
        await expect.poll(() => shadow(page, `return root.querySelectorAll('#vv-chat .msg-wrapper.other').length;`)).toBe(1);
        await expect.poll(stage).toBe(4);
        expect((await events(page)).map((e) => e.type)).toContain('loop_complete');
        expect(apiCalls).toEqual([]);
    });

    test('a refresh keeps the visitor\'s pin', async ({ page }) => {
        const { apiCalls } = await mountHarness(page);
        await pinAndSubmit(page, page, 'Keep me');
        await page.reload();
        await openWidget(page);
        await expect.poll(() => shadow(page, `return root.querySelectorAll('.pin-marker:not(.pending)').length;`)).toBe(3);
        expect(apiCalls).toEqual([]);
    });

    test('screenshots are served as openable blob: URLs, also after a refresh', async ({ page }) => {
        // Browsers refuse to open a data: URL in a new tab, which is what the
        // widget does when an attachment is clicked; the demo once showed a
        // blank page there.
        const { apiCalls } = await mountHarness(page, { fakeSnapdom: true });
        await pinAndSubmit(page, page, 'With a screenshot', { waitForScreenshot: true });
        const screenshotHref = async () => {
            await openThread(page, 'With a screenshot');
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

// The real /demo page on the dev server: the split view, and what only the
// page itself owns (a visitor who leaves and comes back starts over, a
// refresh resumes).
test.describe('demo page', () => {
    // The bakery iframe. Re-resolved on every use: a reload replaces it.
    const site = async (page: Page): Promise<Frame> => {
        let frame: Frame | undefined;
        await expect.poll(() => {
            frame = page.frames().find((f) => /^https?:\/\/[^/]+\/demo\/site/.test(f.url()));
            return !!frame;
        }).toBe(true);
        return frame!;
    };
    const clientGuide = async (page: Page) => (await site(page)).locator('aside[aria-label="Client guide"]');
    const agencyGuide = (page: Page) => page.locator('aside[aria-label="Agency guide"]').first();
    // The landing page links to /demo twice (hero and the closing CTA band);
    // the hero one is the entry point these runs model.
    const demoLink = (page: Page) => page.getByRole('link', { name: 'Try the live demo' }).first();
    // The widget's own list, not on-page markers: a pin below the fold is
    // not painted, so a marker count depends on the viewport.
    const listed = async (frame: Frame) => {
        await openList(frame);
        return shadow(frame, `return Array.from(root.querySelectorAll('.feedback-item .feedback-preview')).map((el) => el.textContent);`);
    };
    /** Which guide card is asking for attention. Exactly one, or none once done. */
    const activeSides = async (page: Page) => {
        // The client card is not rendered at all during the agency's turn.
        const card = await clientGuide(page);
        const client = (await card.count()) ? await card.getAttribute('data-active') : null;
        const agency = await agencyGuide(page).getAttribute('data-active');
        return [client === 'true' && 'client', agency === 'true' && 'agency'].filter(Boolean);
    };

    test.use({ viewport: { width: 1600, height: 1000 } });

    test('the whole loop across both panes, one guide at a time, with zero API traffic', async ({ page }) => {
        const apiCalls = recordApiCalls(page);
        await recordDemoEvents(page);
        await page.goto('/demo');
        const frame = await site(page);
        await expect(await clientGuide(page)).toContainText('0/4');
        expect(await activeSides(page)).toEqual(['client']);

        // 1. Client pins on the bakery site.
        await pinAndSubmit(page, frame, 'Typo: evrey');
        // ...and the agency hears about it the way the dashboard tells them.
        await expect(page.getByText('New feedback received from Maria (Crumb & Co.)')).toBeVisible();
        await expect.poll(() => activeSides(page)).toEqual(['agency']);
        await expect(await clientGuide(page)).toHaveCount(0);

        // 2. Agency opens the report from its list.
        const card = page.locator('[data-demo-pane="agency"] button[data-feedback-id]').filter({ hasText: 'Typo: evrey' });
        await card.click();
        await expect(page.locator('[data-demo-pane="agency"]')).toContainText('Back to Feedback');

        // 3. Agency replies and moves the status.
        await page.getByPlaceholder('Type your reply...').fill('Thanks Maria, fixing it now.');
        await page.keyboard.press('Enter');
        await page.locator('[data-demo-pane="agency"] [role="combobox"]').click();
        await page.getByRole('option', { name: 'In Progress' }).click();
        await expect.poll(() => activeSides(page)).toEqual(['client']);

        // 4. Client reads the reply in the widget, status included.
        await openThread(frame, 'Typo: evrey');
        await expect.poll(() => shadow(frame, `return Array.from(root.querySelectorAll('#vv-chat .msg-wrapper.other')).map((el) => el.textContent).join('|');`))
            .toContain('Thanks Maria, fixing it now.');
        await expect(agencyGuide(page)).toContainText('4/4');
        await expect(agencyGuide(page)).toContainText('Start free trial');
        expect(await activeSides(page)).toEqual([]);

        // A client reply from the widget lands in the agency's open thread.
        await shadow(frame, `root.querySelector('#vv-reply-text').value = 'Looks great, thank you!'; root.querySelector('#vv-send-reply').click();`);
        await expect(page.locator('[data-demo-pane="agency"]')).toContainText('Looks great, thank you!');

        expect(apiCalls).toEqual([]);
    });

    test('leaving and coming back restarts the run; a refresh resumes it', async ({ page }) => {
        await recordDemoEvents(page);
        await page.goto('/demo');
        await pinAndSubmit(page, await site(page), 'First visit');
        await expect(agencyGuide(page)).toContainText('1/4');

        // Away (full load of the landing page) and back through its CTA
        // (a client-side navigation): a fresh run with only the seeded pins.
        await page.locator('a[href="/"]').first().click();
        await page.waitForURL((u) => u.pathname === '/');
        await demoLink(page).click();
        await page.waitForURL('**/demo');
        await expect(await clientGuide(page)).toContainText('0/4');
        let frame = await site(page);
        await openWidget(frame);
        await expect.poll(async () => (await listed(frame)).length).toBe(2);
        expect((await listed(frame)).join('|')).not.toContain('First visit');
        await shadow(frame, `root.querySelector('#vv-action-list').click();`); // close the list again

        await pinAndSubmit(page, frame, 'Second visit');
        await expect(agencyGuide(page)).toContainText('1/4');
        await browserReload(page);
        await expect(agencyGuide(page)).toContainText('1/4');
        await expect(page.locator('[data-demo-pane="agency"]')).toContainText('Second visit');
        frame = await site(page);
        await openWidget(frame);
        await expect.poll(async () => (await listed(frame)).join('|')).toContain('Second visit');
    });

    test('the bakery pages are client-side routes inside the frame, each with its own pins', async ({ page }) => {
        // The demo doubles as our own check of widget.js on a Next site: the
        // nav is <Link>s, so every move below is a pushState, never a load.
        await recordDemoEvents(page);
        await page.goto('/demo');
        const frame = await site(page);
        const markers = () => shadow(frame, `return root.querySelectorAll('.pin-marker:not(.pending)').length;`);
        const sameDocument = () => frame.evaluate(() => (window as unknown as { __vvSameDoc?: boolean }).__vvSameDoc === true);
        await openWidget(frame);
        await expect.poll(markers).toBeGreaterThan(0); // the seeded pins live on the home page
        await frame.evaluate(() => { (window as unknown as { __vvSameDoc: boolean }).__vvSameDoc = true; });

        await frame.locator('header nav').getByRole('link', { name: 'Menu', exact: true }).click();
        await expect.poll(() => new URL(frame.url()).pathname).toBe('/demo/site/menu');
        await expect.poll(markers).toBe(0);
        await pinAndSubmit(page, frame, 'This bread has no price');
        await expect.poll(markers).toBe(1);

        await frame.locator('header nav').getByRole('link', { name: 'Our story', exact: true }).click();
        await expect.poll(() => new URL(frame.url()).pathname).toBe('/demo/site/story');
        await expect.poll(markers).toBe(0);

        // Opening the thread from the list takes the visitor to its page.
        await openThread(frame, 'This bread has no price');
        await expect.poll(() => new URL(frame.url()).pathname).toBe('/demo/site/menu');
        await expect.poll(() => shadow(frame, `return root.querySelectorAll('.pin-marker.pulsing').length;`)).toBe(1);

        expect(await sameDocument()).toBe(true);
        // The top page never moved.
        expect(new URL(page.url()).pathname).toBe('/demo');
    });

    test('an in-app back and return starts over', async ({ page }) => {
        await recordDemoEvents(page);
        await page.goto('/');
        await demoLink(page).click();
        await page.waitForURL('**/demo');
        await pinAndSubmit(page, await site(page), 'Before going back');
        await expect(agencyGuide(page)).toContainText('1/4');

        // Client-side back and forth: same document, so the first visit's
        // sandbox would still be around if it were not disposed.
        await page.goBack();
        await page.waitForURL((u) => u.pathname === '/');
        await demoLink(page).click();
        await page.waitForURL('**/demo');
        await expect(await clientGuide(page)).toContainText('0/4');
        const frame = await site(page);
        await openWidget(frame);
        expect((await listed(frame)).join('|')).not.toContain('Before going back');
    });

    test.describe('on a phone', () => {
        test.use({ viewport: { width: 390, height: 844 } });

        test('the view follows the run: to the agency after a pin, back to the client after the reply', async ({ page }) => {
            const tab = (name: RegExp) => page.getByRole('tab', { name });
            await recordDemoEvents(page);
            await page.goto('/demo');
            await expect(tab(/Client's website/)).toHaveAttribute('aria-selected', 'true');

            const toast = page.getByText('New feedback received from Maria (Crumb & Co.)');
            await pinAndSubmit(page, await site(page), 'Typo on my phone');
            // Not over the client's view, where it would hide the widget's own
            // "Feedback pinned" confirmation; only once the agency view is up.
            await expect(toast).toHaveCount(0);
            await expect(tab(/Agency dashboard/)).toHaveAttribute('aria-selected', 'true');
            await expect(toast).toBeVisible();

            await page.locator('[data-demo-pane="agency"] button[data-feedback-id]').filter({ hasText: 'Typo on my phone' }).click();
            await page.getByPlaceholder('Type your reply...').fill('On it.');
            await page.keyboard.press('Enter');
            await expect(tab(/Client's website/)).toHaveAttribute('aria-selected', 'true');

            // The widget panel is still open and covers nearly the whole
            // frame, so the client's next step is shown above the frame.
            expect(await shadow(await site(page), `return root.querySelector('.popup').classList.contains('open');`)).toBe(true);
            const strip = page.locator('aside[aria-label="Client guide"]');
            await expect(strip).toBeVisible();
            await expect(strip).toContainText("Read the agency's reply");
            // The agency's notification left with the agency view.
            await expect(toast).toHaveCount(0);

            // Reading the reply ends the run, and the phone's last screen is
            // the client view: the finale and its CTAs must be there.
            await openThread(await site(page), 'Typo on my phone');
            await expect(strip).toContainText('Fewer review rounds');
            await expect(strip.getByRole('link', { name: /Start free trial/ })).toBeVisible();
        });
    });

    test('the bakery opened on its own forwards to the demo', async ({ page }) => {
        // Without the top window there is no backend: the widget must never
        // boot there (it would talk to the real API).
        const apiCalls = recordApiCalls(page);
        await page.goto('/demo/site/menu');
        await page.waitForURL((u) => u.pathname === '/demo');
        expect(apiCalls).toEqual([]);
    });
});
