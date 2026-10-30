"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

/**
 * Main Responsibility: Hero product demo section — embedded video player.
 *
 * Sensitive Dependencies:
 * - videoUrl must be a valid embed URL (YouTube, Loom, etc.).
 * - The iframe is mounted only once the section nears the viewport. An eager
 *   autoplay embed pulls ~1.3 MB of player JS + video on load and pushed the
 *   landing page's mobile LCP past 3.5s by keeping the main thread busy.
 */

interface ProductDemoProps {
  videoUrl: string;
}

export const ProductDemo = ({ videoUrl }: ProductDemoProps) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [loadVideo, setLoadVideo] = useState(false);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLoadVideo(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-20 md:py-24 w-full flex flex-col items-center">
      <div className="max-w-6xl mx-auto px-4 md:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 grid md:grid-cols-2 gap-6 items-end"
        >
          <h2 className="text-5xl md:text-6xl tracking-tight leading-[1.05]">
            See the visual feedback tool <span className="font-serif italic text-[#0B6FB3]">in action</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-md md:justify-self-end">
            Watch how agencies and dev studios collect, manage, and resolve client feedback in
            minutes, not days.
          </p>
        </motion.div>

        <motion.div
          ref={frameRef}
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative w-full aspect-video rounded-2xl overflow-hidden ring-1 ring-gray-200 shadow-[0_30px_60px_-30px_rgba(15,27,42,0.35)] bg-gray-900"
        >
          {loadVideo && (
            <iframe
              src={videoUrl}
              title="VibeVaults product demo"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </motion.div>

        <p className="mt-8 text-gray-500">
          Rather click than watch?{" "}
          <Link href="/demo" className="font-semibold text-gray-900 underline decoration-secondary decoration-2 underline-offset-4 hover:text-primary">
            Try the widget live on a sample site, no signup &rarr;
          </Link>
        </p>
      </div>
    </section>
  );
};
