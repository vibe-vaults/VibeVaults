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
    <section className="py-24 w-full flex flex-col items-center bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            See the visual feedback tool in action
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Watch how agencies and dev studios collect, manage, and resolve client feedback in
            minutes — not days.
          </p>
        </motion.div>

        <motion.div
          ref={frameRef}
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative w-full aspect-video rounded-3xl overflow-hidden border border-gray-200 shadow-2xl bg-gray-900"
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

        <p className="mt-8 text-center text-gray-500">
          Rather click than watch?{" "}
          <Link href="/demo" className="font-semibold text-primary hover:underline underline-offset-4">
            Try the widget live on a sample site, no signup &rarr;
          </Link>
        </p>
      </div>
    </section>
  );
};
