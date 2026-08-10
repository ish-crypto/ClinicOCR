"use client";

import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SECTIONS: [string, string][] = [
  ["/dashboard", "Dashboard"],
  ["/patients", "Patients"],
  ["/upload", "Upload prescription"],
  ["/prescriptions", "Prescription"],
];

function sectionLabel(pathname: string): string {
  for (const [prefix, label] of SECTIONS) {
    if (pathname.startsWith(prefix)) return label;
  }
  return "Records";
}

export function Header() {
  const pathname = usePathname();

  return (
    <div className="flex h-14 flex-shrink-0 items-end justify-between gap-4 border-b border-ink/10 bg-paper/80 px-4 backdrop-blur-sm md:px-6">
      <div className="tab-bar hidden self-stretch pb-0 md:flex">
        <span className="tab is-active self-end">{sectionLabel(pathname)}</span>
      </div>
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground md:hidden">
        {sectionLabel(pathname)}
      </p>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search patients, prescriptions..."
            className="w-72 bg-paper pl-9 border-ink/20 focus-visible:ring-primary shadow-[inset_0_1px_2px_rgb(35_43_54/0.06)]"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </Button>
        <div className="h-8 w-8 rounded-[4px] bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm shadow-[0_1.5px_0_var(--stamp-deep)]">
          Dr
        </div>
      </div>
    </div>
  );
}
