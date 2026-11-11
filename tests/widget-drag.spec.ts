/**
 * Movable launcher: the visitor can drag the widget off whatever it covers.
 *
 * What can go wrong silently, and what these tests pin:
 *   1. The handle is hover-revealed, so a regression that never shows it (or
 *      shows it permanently on the customer's site) is easy to miss.
 *   2. The panel's stylesheet corner assumes a bottom-right launcher. Moved
 *      anywhere else, the panel must follow it AND stay fully on screen.
 *   3. The spot is remembered per site and re-clamped on resize, so a launcher
 *      parked on a wide screen can never be stranded off a narrower one.
 *   4. A drag must never also count as a click that opens the widget.
 *
 * No database or dev server: the harness serves the real `public/widget.js`.
 */
import { test, expect, type Page } from '@playwright/test';
import { mountWidget } from './utils/widget-harness';

const BODY = '<div style="height:2000px">page</div>';
const VIEWPORT = { width: 1280, height: 800 };

const rectOf = (page: Page, sel: string) =>
    page.evaluate((s) => {
        const r = document.querySelector('#vibe-vaults-widget-host')!.shadowRoot!.querySelector(s)!.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    }, sel);

const handleVisible = (page: Page) =>
    page.evaluate(() => {
        const h = document.querySelector('#vibe-vaults-widget-host')!.shadowRoot!.querySelector('.drag-handle')!;
        return getComputedStyle(h).pointerEvents !== 'none';
    });

const panelOpen = (page: Page) =>
    page.evaluate(() => document.querySelector('#vibe-vaults-widget-host')!.shadowRoot!
        .querySelector('.popup')!.classList.contains('open'));

/** Hovers the launcher until the handle shows, then returns its centre. */
async function revealHandle(page: Page) {
    const l = await rectOf(page, '.trigger-btn');
    await page.mouse.move(l.left + l.width / 2, l.top + l.height / 2);
    await expect.poll(() => handleVisible(page)).toBe(true);
    const h = await rectOf(page, '.drag-handle');
    return { x: h.left + h.width / 2, y: h.top + h.height / 2 };
}

/** Drags the handle so the launcher's top-left lands near (x, y). */
async function dragLauncherTo(page: Page, x: number, y: number) {
    const handle = await revealHandle(page);
    const l = await rectOf(page, '.launcher');
    await page.mouse.move(handle.x, handle.y);
    await page.mouse.down();
    await page.mouse.move(x + (handle.x - l.left), y + (handle.y - l.top), { steps: 8 });
    await page.mouse.up();
}

test.describe('movable launcher', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize(VIEWPORT);
    });

    test('the handle appears only after a sustained hover', async ({ page }) => {
        await mountWidget(page, { body: BODY });
        expect(await handleVisible(page)).toBe(false);
        const l = await rectOf(page, '.trigger-btn');
        await page.mouse.move(l.left + l.width / 2, l.top + l.height / 2);
        await page.waitForTimeout(250);
        expect(await handleVisible(page)).toBe(false);
        await expect.poll(() => handleVisible(page)).toBe(true);
    });

    test('dragging moves the launcher without opening the widget, and survives a reload', async ({ page }) => {
        await mountWidget(page, { body: BODY });
        await dragLauncherTo(page, 40, 60);

        const moved = await rectOf(page, '.launcher');
        expect(Math.abs(moved.left - 40)).toBeLessThan(3);
        expect(Math.abs(moved.top - 60)).toBeLessThan(3);
        expect(await panelOpen(page)).toBe(false);

        await page.reload();
        await page.waitForFunction(() => {
            const host = document.querySelector('#vibe-vaults-widget-host') as HTMLElement | null;
            return !!host && host.style.display !== 'none';
        });
        await expect.poll(async () => Math.round((await rectOf(page, '.launcher')).left)).toBe(40);
        expect(Math.round((await rectOf(page, '.launcher')).top)).toBe(60);
    });

    test('a launcher moved to the top-left opens its panel below it, fully on screen', async ({ page }) => {
        await mountWidget(page, { body: BODY });
        await dragLauncherTo(page, 20, 20);
        await page.mouse.move(640, 400);
        await page.evaluate(() => {
            (document.querySelector('#vibe-vaults-widget-host')!.shadowRoot!.querySelector('.trigger-btn') as HTMLElement).click();
        });
        await expect.poll(() => panelOpen(page)).toBe(true);
        // List open = the panel at full height, the case most likely to overflow.
        await page.evaluate(() => {
            (document.querySelector('#vibe-vaults-widget-host')!.shadowRoot!.querySelector('#vv-action-list') as HTMLElement).click();
        });

        const launcher = await rectOf(page, '.launcher');
        await expect.poll(async () => (await rectOf(page, '.popup')).top).toBeGreaterThanOrEqual(launcher.bottom);
        const panel = await rectOf(page, '.popup');
        expect(panel.left).toBeGreaterThanOrEqual(0);
        expect(panel.right).toBeLessThanOrEqual(VIEWPORT.width);
        expect(panel.bottom).toBeLessThanOrEqual(VIEWPORT.height);
        // The handle flips to the side facing the middle of the screen.
        const handle = await rectOf(page, '.drag-handle');
        expect(handle.left).toBeGreaterThanOrEqual(launcher.right);
    });

    test('a smaller window pulls a parked launcher back on screen, keeping its corner', async ({ page }) => {
        await mountWidget(page, { body: BODY });
        // Bottom-left corner, 30px in from each edge.
        const l = await rectOf(page, '.launcher');
        await dragLauncherTo(page, 30, VIEWPORT.height - l.height - 30);

        await page.setViewportSize({ width: 700, height: 500 });
        await expect.poll(async () => Math.round((await rectOf(page, '.launcher')).bottom)).toBe(500 - 30);
        expect(Math.round((await rectOf(page, '.launcher')).left)).toBe(30);

        // A position stored on a bigger screen is clamped, never stranded.
        await page.evaluate(() => {
            const key = Object.keys(localStorage).find((k) => k.startsWith('vv_pos_'))!;
            localStorage.setItem(key, JSON.stringify({ h: 'left', x: 5000, v: 'top', y: 5000 }));
        });
        await page.reload();
        await page.waitForFunction(() => {
            const host = document.querySelector('#vibe-vaults-widget-host') as HTMLElement | null;
            return !!host && host.style.display !== 'none';
        });
        await expect.poll(async () => (await rectOf(page, '.launcher')).right).toBeLessThanOrEqual(700);
        expect((await rectOf(page, '.launcher')).bottom).toBeLessThanOrEqual(500);
    });

    test('Escape cancels a drag, and double-clicking the handle resets to the corner', async ({ page }) => {
        await mountWidget(page, { body: BODY });
        const home = await rectOf(page, '.launcher');

        const handle = await revealHandle(page);
        await page.mouse.move(handle.x, handle.y);
        await page.mouse.down();
        await page.mouse.move(300, 300, { steps: 5 });
        await page.keyboard.press('Escape');
        await page.mouse.up();
        expect(Math.round((await rectOf(page, '.launcher')).left)).toBe(Math.round(home.left));

        await dragLauncherTo(page, 200, 200);
        expect(Math.round((await rectOf(page, '.launcher')).left)).toBe(200);
        const h = await revealHandle(page);
        await page.mouse.dblclick(h.x, h.y);
        await expect.poll(async () => Math.round((await rectOf(page, '.launcher')).left)).toBe(Math.round(home.left));
        expect(await page.evaluate(() => Object.keys(localStorage).some((k) => k.startsWith('vv_pos_')))).toBe(false);
    });
});
