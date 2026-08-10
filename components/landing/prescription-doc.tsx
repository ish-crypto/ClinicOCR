"use client";

import { cn } from "@/lib/utils";

type Props = {
  progress: number;
  className?: string;
};

const HAND_LINES: { text: string; tilt?: number; size?: number }[] = [
  { text: "Dr. Mehta  •  OPD", tilt: -1.1, size: 1.3 },
  { text: "04 Mar  —  Anil Kumar, 42 M", tilt: 0.8, size: 0.95 },
  { text: "Rx:", tilt: -0.4, size: 1.15 },
  { text: "1) Tab Amox 500mg — 1-0-1 ×5", tilt: 1.4, size: 1.05 },
  { text: "2) Tab Pcm 650 — SOS fever", tilt: -0.9, size: 1.05 },
  { text: "3) Cap Omep 20 — empty stomach", tilt: 0.7, size: 1.05 },
  { text: "4) Syr Dex 4ml — TDS", tilt: -1.2, size: 1.05 },
  { text: "Diet bland, fluids plenty", tilt: 0.5, size: 1 },
  { text: "Review in 3 days", tilt: -0.7, size: 1 },
];

const MEDICINES: [string, string][] = [
  ["Amoxicillin 500mg", "1-0-1 · ×5d"],
  ["Paracetamol 650mg", "SOS"],
  ["Omeprazole 20mg", "1-0-0 · fasting"],
  ["Dex syrup 4ml", "TDS"],
];

export function PrescriptionDoc({ progress, className }: Props) {
  const wipe = -1 + progress * 1.01;

  return (
    <div className={cn("rx-doc aspect-[3/4] select-none", className)}>
      {/* Handwritten layer — the paper as scanned */}
      <div className="rx-hand pointer-events-none" aria-hidden="true">
        <p className="font-semibold" style={{ transform: "rotate(-1.1deg)", fontSize: "1.3em" }}>
          Dr. Mehta &nbsp;•&nbsp; OPD
        </p>
        <p style={{ transform: "rotate(0.8deg)", fontSize: "0.72em", marginTop: "0.35em", opacity: 0.8 }}>
          04 Mar &nbsp;—&nbsp; Anil Kumar, 42 M
        </p>
        {HAND_LINES.slice(2).map((line, i) => (
          <p
            key={i}
            style={{
              transform: `rotate(${line.tilt ?? 0}deg)`,
              fontSize: `${(line.size ?? 1.05) * 0.62}em`,
              marginTop: i === 0 ? "0.45em" : "0.22em",
              paddingLeft: i >= 1 ? "0.9em" : 0,
            }}
          >
            {line.text}
          </p>
        ))}
      </div>

      {/* Digitized reveal — wipes down over the ink as the beam passes */}
      <div
        className="rx-digit-wipe"
        style={{ transform: `translateY(${wipe * 100}%)` }}
        aria-hidden="true"
      >
        <div className="rx-digit">
          <div className="flex items-start justify-between border-b border-ink/15 pb-1.5">
            <p className="font-mono text-[0.5rem] font-medium uppercase tracking-[0.18em] text-stamp">
              Outpatient record
            </p>
            <p className="font-mono text-[0.5rem] text-muted-foreground">RX #2041</p>
          </div>

          <p className="mt-1.5 text-[0.66rem] font-semibold text-ink">
            Anil Kumar <span className="font-mono text-[0.55rem] text-muted-foreground">· 42 M · 9988 11 22 33</span>
          </p>

          <p className="mt-2.5 text-[0.48rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Diagnosis
          </p>
          <p className="mt-0.5 text-[0.62rem] leading-snug text-ink">
            Acute pharyngitis — supportive Rx
          </p>

          <p className="mt-2.5 text-[0.48rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Medicines
          </p>
          <div className="mt-1 space-y-1">
            {MEDICINES.map(([name, freq]) => (
              <div key={name} className="flex items-baseline justify-between gap-2">
                <p className="truncate text-[0.6rem] font-medium text-ink">{name}</p>
                <p className="font-mono text-[0.5rem] text-ink/60">{freq}</p>
              </div>
            ))}
          </div>

          <p className="mt-2.5 text-[0.48rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Notes
          </p>
          <p className="mt-0.5 text-[0.6rem] leading-snug text-ink/75">
            bland diet · fluids · review 3 days
          </p>

          <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
            <p className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-rxred">✓ Filled</p>
          </div>
        </div>
        <div className="rx-glow" />
        <div className="rx-beam" />
      </div>
    </div>
  );
}
