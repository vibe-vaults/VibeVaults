/**
 * Main Responsibility: Polls `getWidgetEmbedStatus()` every 3s until widget.js
 * has been seen loading on a project's site, so the UI can unlock "Activate
 * widget" the moment the customer's snippet goes live, with no refresh.
 * Shared by the create-project dialog's embed step and the Embed widget card.
 *
 * Sensitive Dependencies:
 * - Detection is `projects.widget_last_seen_at`, stamped by the unauthenticated
 *   heartbeat (`src/app/api/widget/heartbeat/route.ts`) on every page load.
 * - The detected flag is stored per project id, so a different project id (the
 *   dialog creating a second project) starts undetected without a reset effect
 *   (this repo's lint forbids synchronous setState inside an effect).
 */
'use client';

import { useEffect, useState } from 'react';
import { getWidgetEmbedStatus } from '@/actions/widget-access';

const POLL_MS = 3000;

/**
 * @param projectId Project to watch; `null` pauses polling (e.g. dialog closed).
 * @param alreadyEmbedded Server-side verdict; when true there is nothing to poll.
 */
export function useWidgetEmbedDetected(projectId: string | null, alreadyEmbedded = false): boolean {
    const [detectedFor, setDetectedFor] = useState<string | null>(null);
    const detected = alreadyEmbedded || (projectId !== null && detectedFor === projectId);

    useEffect(() => {
        if (!projectId || detected) return;
        let cancelled = false;
        const timer = setInterval(async () => {
            try {
                const status = await getWidgetEmbedStatus(projectId);
                if (!cancelled && status.embedded) setDetectedFor(projectId);
            } catch { /* transient: the next tick retries */ }
        }, POLL_MS);
        return () => { cancelled = true; clearInterval(timer); };
    }, [projectId, detected]);

    return detected;
}
