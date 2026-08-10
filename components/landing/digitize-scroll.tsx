"use client";

import { useEffect, useRef, useState } from "react";
import { PrescriptionDoc } from "./prescription-doc";

export function DigitizeScroll() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 1
        : 0
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let target = 0;
    let current = 0;

    const tick = () => {
      current += (target - current) * 0.12;
      setProgress(current);
      raf = 0;
    };

    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      target = Math.min(1, Math.max(0, (vh - rect.top) / (rect.height + vh)));
      if (!raf) raf = requestAnimationFrame(tick);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="relative border-t border-ink/10 bg-paper">
      <div ref={wrapRef} className="relative mx-auto min-h-[130vh] max-w-6xl px-6 py-24">
        <div className="sticky top-[12vh] grid items-center gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <span className="stamp mb-5">The ink resolves as you read</span>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-ink md:text-4xl">
              Watch handwriting become a record.
            </h2>
            <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-ink/70">
              Scroll, and the same sheet is read back — the scrawl replaced line by line
              with what actually got prescribed. Every save stays attached to the patient,
              searchable from the desk.
            </p>
            <p className="mt-6 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
              Scroll to scan · {Math.round(progress * 100)}%
            </p>
          </div>

          <div className="order-1 flex justify-center lg:order-2">
            <div className="transition-transform duration-300 hover:rotate-[-0.8deg]">
              <PrescriptionDoc progress={progress} className="w-56 sm:w-64 md:w-72" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
