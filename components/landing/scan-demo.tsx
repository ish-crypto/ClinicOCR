"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ScanLine, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PrescriptionDoc } from "./prescription-doc";

const DURATION = 2800;

const READOUT_MEDS: [string, string][] = [
  ["Amoxicillin 500mg", "1-0-1"],
  ["Paracetamol 650mg", "SOS"],
  ["Omeprazole 20mg", "1-0-0"],
  ["Dex syrup 4ml", "TDS"],
];

type Phase = "idle" | "scanning" | "done";

export function ScanDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const playedRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);

  const run = () => {
    setProgress(0);
    setPhase("scanning");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      setPhase("done");
      return;
    }

    const start = performance.now();
    const frame = (ts: number) => {
      const t = Math.min((ts - start) / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        setPhase("done");
      }
    };
    rafRef.current = requestAnimationFrame(frame);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !playedRef.current) {
          playedRef.current = true;
          run();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const shown = (t: number) => phase === "done" || progress > t;

  return (
    <section className="relative overflow-hidden">
      <div
        ref={containerRef}
        className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:py-24 lg:grid-cols-2"
      >
        {/* Copy */}
        <div>
          <span className="stamp mb-6">Handwritten prescriptions, digitized</span>
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-ink md:text-[3.4rem]">
            Stop retyping prescriptions{" "}
            <span className="font-hand font-medium text-stamp" style={{ fontSize: "1.06em" }}>
              by hand.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-ink/70">
            ClinicOCR reads the scrawl on your prescription pads and files it — medicines,
            dosage, diagnosis — into clean, searchable patient records. What took a clerk
            ten minutes now takes one scan.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={run} disabled={phase === "scanning"} className="gap-2">
              <ScanLine className="h-4 w-4" />
              {phase === "scanning"
                ? `Scanning… ${Math.round(progress * 100)}%`
                : phase === "done"
                  ? "Run it again"
                  : "Digitize a sample"}
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="gap-2">
                Open the desk
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <p className="mt-6 flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
            <Stethoscope className="h-3.5 w-3.5" />
            Image → text → record &nbsp;·&nbsp; nothing to install
          </p>
        </div>

        {/* Live demo */}
        <div className="relative">
          <div className="flex items-start justify-center gap-4 sm:gap-6">
            <div
              className="transition-transform duration-300 hover:-translate-y-1 hover:rotate-[-0.6deg]"
              style={{ transform: "rotate(-1.6deg)" }}
            >
              <PrescriptionDoc progress={progress} className="w-48 sm:w-56 md:w-64" />
            </div>

            <div className="paper-sheet flex-1 p-4 sm:p-5" style={{ maxWidth: 260 }}>
              <div className="flex items-center justify-between border-b border-ink/10 pb-2">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink">
                  Structured readout
                </p>
                <p className="font-mono text-[0.55rem] text-muted-foreground">RX #2041</p>
              </div>

              <div className={cn("rx-line", shown(0.28) && "is-shown")}>
                <p className="mt-3 text-[0.5rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Diagnosis
                </p>
                <p className="mt-0.5 text-[0.68rem] leading-snug text-ink">
                  Acute pharyngitis — supportive Rx
                </p>
              </div>

              <div className={cn("rx-line", shown(0.42) && "is-shown")}>
                <p className="mt-3 text-[0.5rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Medicines
                </p>
                <div className="mt-1 space-y-1">
                  {READOUT_MEDS.map(([name, freq], i) => (
                    <div
                      key={name}
                      className={cn("rx-line flex items-baseline justify-between gap-2", shown(0.42 + i * 0.11) && "is-shown")}
                    >
                      <p className="truncate text-[0.62rem] font-medium text-ink">{name}</p>
                      <p className="font-mono text-[0.54rem] text-ink/55">{freq}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={cn("rx-line", shown(0.86) && "is-shown")}>
                <p className="mt-3 text-[0.5rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Notes
                </p>
                <p className="mt-0.5 text-[0.62rem] text-ink/70">bland diet · fluids · review 3 days</p>
              </div>

              <div
                className={cn(
                  "mt-4 flex items-center justify-between border-t border-ink/10 pt-3 transition-opacity duration-300",
                  phase === "done" ? "opacity-100" : "opacity-0"
                )}
              >
                <span className="stamp">Filed to patient record</span>
                <span className="font-mono text-[0.55rem] text-muted-foreground">00:14 saved</span>
              </div>
            </div>
          </div>

          {/* Desk shadow */}
          <div
            className="pointer-events-none mx-auto mt-6 h-4 w-3/4 rounded-[50%] bg-ink/15 blur-md"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}
