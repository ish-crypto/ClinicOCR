import Link from "next/link";
import { ArrowRight, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-primary text-primary-foreground shadow-[0_2px_0_var(--stamp-deep)]">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <p className="font-heading text-xl font-bold leading-none tracking-tight text-ink">
              ClinicOCR
            </p>
            <p className="mt-1 text-[0.55rem] uppercase tracking-[0.22em] text-muted-foreground">
              Medical document desk
            </p>
          </div>
        </Link>

        <nav className="tab-bar hidden sm:flex" aria-label="Desk sections">
          <Link href="/upload" className="tab">
            Upload
          </Link>
          <Link href="/patients" className="tab">
            Patients
          </Link>
          <Link href="/dashboard" className="tab is-active">
            Records desk
          </Link>
        </nav>

        <Link href="/dashboard">
          <Button className="gap-2">
            Open the desk
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
