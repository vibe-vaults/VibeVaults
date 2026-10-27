/**
 * Main Responsibility: Captures the HTML a notification template actually builds, for specs that
 * assert on email content.
 *
 * Sensitive Dependencies:
 * - Resend is stubbed during Playwright runs (see src/lib/resend.ts), so calling a template renders
 *   it without sending; swapping `resend.emails.send` for the duration of the call captures the HTML.
 */

/** Renders one email and returns its HTML body. */
export async function renderEmail(fn: () => Promise<unknown>): Promise<string> {
    const mod = await import('../../src/lib/resend');
    const original = mod.resend.emails.send;
    let html = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mod.resend.emails as any).send = async (payload: any) => {
        html = payload.html ?? '';
        return { data: null, error: null };
    };
    try { await fn(); } finally {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mod.resend.emails as any).send = original;
    }
    return html;
}
