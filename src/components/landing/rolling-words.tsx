"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Cycles through `words` in place, each one rolling down out of view as the
 * next drops in from above. Every word is stacked invisibly in the same grid
 * cell, so the slot is always as wide as the longest one and the sentence
 * around it never jumps. Crawlers and screen readers get the full list as
 * plain text, and visitors who prefer reduced motion see that list instead of
 * the animation. Reduced motion is handled in CSS, not a JS hook, so the
 * server and client markup always match.
 */
export function RollingWords({ words, className }: { words: string[]; className?: string }) {
    const [index, setIndex] = useState(0);
    const asList = `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;

    useEffect(() => {
        const id = setInterval(() => setIndex((i) => (i + 1) % words.length), 2200);
        return () => clearInterval(id);
    }, [words.length]);

    return (
        <>
            <b className={`sr-only motion-reduce:not-sr-only ${className ?? ""}`}>{asList}</b>
            <span aria-hidden="true" className="relative inline-grid overflow-hidden align-bottom motion-reduce:hidden">
                {words.map((w) => (
                    <b key={w} className={`invisible col-start-1 row-start-1 ${className ?? ""}`}>
                        {w}
                    </b>
                ))}
                <AnimatePresence initial={false}>
                    <motion.b
                        key={words[index]}
                        className={`col-start-1 row-start-1 ${className ?? ""}`}
                        initial={{ y: "-100%", opacity: 0 }}
                        animate={{ y: "0%", opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {words[index]}
                    </motion.b>
                </AnimatePresence>
            </span>
        </>
    );
}
