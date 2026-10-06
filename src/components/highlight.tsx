'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Main Responsibility: Wraps content with an ID and applies pulsating highlight
 * animation + dark backdrop overlay when navigated to via URL hash.
 * The overlay has a cut-out over the target, so the REAL element shows through
 * and stays interactive: the first click on a highlighted switch or button
 * acts on it (a cloned copy would swallow it). No z-index lifting is needed,
 * so parent stacking contexts can't trap it. A pointer-less ring above the
 * overlay carries the glow; both track the target on scroll and resize.
 *
 * Sensitive Dependencies:
 * - globals.css for .pulse-active, .highlight-persist, and related keyframes.
 */
export function Highlight({
    id,
    className,
    children,
}: {
    id: string;
    className?: string;
    children: React.ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(false);

    useEffect(() => {
        const check = () => {
            if (window.location.hash !== `#${id}` || !ref.current) return;

            const target = ref.current;

            // Scroll into view first, then activate after scroll settles
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => setActive(true), 500);
        };

        // Check on mount
        check();

        // Re-check when hash changes (e.g. notification click while already on /feedback)
        window.addEventListener('hashchange', check);
        return () => window.removeEventListener('hashchange', check);
    }, [id]);

    // Overlay with a cut-out over the target + a glow ring above it
    useEffect(() => {
        if (!active || !ref.current) return;

        const target = ref.current;
        const radius = parseFloat(getComputedStyle(target).borderTopLeftRadius) || 0;

        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed',
            inset: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: '9998',
            cursor: 'pointer',
        });

        const ring = document.createElement('div');
        Object.assign(ring.style, {
            position: 'fixed',
            zIndex: '9999',
            pointerEvents: 'none',
            borderRadius: `${radius}px`,
        });
        ring.classList.add('pulse-active', 'highlight-persist');

        // clip-path also governs hit-testing, so clicks inside the hole fall
        // through to the real element instead of the overlay.
        const place = () => {
            const { left: x, top: y, width: w, height: h } = target.getBoundingClientRect();
            const r = Math.min(radius, w / 2, h / 2);
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            overlay.style.clipPath = `path(evenodd, "M0 0 H${vw} V${vh} H0 Z `
                + `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} `
                + `V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} `
                + `H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} `
                + `V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z")`;
            Object.assign(ring.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
        };
        let frame = 0;
        const schedulePlace = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(place);
        };

        place();
        document.body.append(overlay, ring);
        window.addEventListener('scroll', schedulePlace, true);
        window.addEventListener('resize', schedulePlace);

        // Clicking the overlay dismisses; so does using the highlighted
        // element itself (the click still lands on it, this only lifts the dim).
        const dismiss = () => setActive(false);
        overlay.addEventListener('click', dismiss);
        target.addEventListener('click', dismiss);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', schedulePlace, true);
            window.removeEventListener('resize', schedulePlace);
            overlay.removeEventListener('click', dismiss);
            target.removeEventListener('click', dismiss);
            overlay.remove();
            ring.remove();
        };
    }, [active]);

    return (
        <div
            ref={ref}
            id={id}
            className={className}
        >
            {children}
        </div>
    );
}
