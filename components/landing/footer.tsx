import Link from "next/link";

const LINKS = [
  { label: "Records desk", href: "/dashboard" },
  { label: "Patients", href: "/patients" },
  { label: "Upload prescription", href: "/upload" },
];

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="ink-rule mb-8" aria-hidden="true" />
        <div className="flex flex-col justify-between gap-8 sm:flex-row">
          <div className="max-w-xs">
            <p className="font-heading text-xl font-bold tracking-tight text-ink">ClinicOCR</p>
            <p className="mt-1 text-[0.55rem] uppercase tracking-[0.22em] text-muted-foreground">
              Medical document desk
            </p>
            <p className="mt-4 text-[0.8rem] leading-relaxed text-ink/60">
              Reading the handwriting of medicine back into readable, searchable records —
              for the small clinics that still do it all by hand.
            </p>
          </div>

          <nav className="flex flex-col gap-2" aria-label="Footer">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[0.8rem] text-ink/70 underline-offset-4 hover:text-stamp hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground sm:text-right">
            <p>Rx · digitized records</p>
            <p className="mt-1">opd sheets → patient files</p>
          </div>
        </div>

        <p className="mt-10 text-right font-hand text-lg leading-none text-ink/70" style={{ transform: "rotate(-1deg)" }}>
          Filed by ClinicOCR — no clerk, no retyping.
        </p>
      </div>
    </footer>
  );
}
