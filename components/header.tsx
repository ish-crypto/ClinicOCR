"use client";

import { useState, useEffect } from "react";
import { Bell, Search, Menu, Stethoscope } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";

const BREADCRUMBS: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Clinic Overview & Document Desk" },
  "/patients": { title: "Patients", subtitle: "Medical Registry & History" },
  "/prescriptions": { title: "Prescriptions", subtitle: "Digitized Clinical Documents" },
  "/upload": { title: "Upload Prescription", subtitle: "AI Handwriting OCR & Extraction" },
  "/dictate": { title: "Voice Dictate", subtitle: "Speech-to-Prescription AI" },
};

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close drawer on path navigation
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  // Get active breadcrumb title
  const currentKey = Object.keys(BREADCRUMBS).find((k) =>
    pathname === k || (k !== "/dashboard" && pathname.startsWith(k))
  ) || "/dashboard";
  const { title, subtitle } = BREADCRUMBS[currentKey] || {
    title: "Clinic Workspace",
    subtitle: "Medical Document Desk",
  };

  return (
    <>
      <header className="h-16 shrink-0 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Mobile hamburger + Page Title / Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="text-slate-500 hover:text-slate-900 md:hidden -ml-2 h-9 w-9 rounded-xl"
            aria-label="Open Navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                {title}
              </h1>
            </div>
            <p className="text-[0.68rem] text-slate-400 font-medium hidden sm:block truncate">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: ⌘K Search trigger + Notifications + Doctor Avatar */}
        <div className="flex items-center gap-3">
          {/* Global Search Button / Trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition text-xs shadow-2xs group"
          >
            <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
            <span className="hidden sm:inline-block font-normal">Search patient, Rx, medicine...</span>
            <span className="sm:hidden font-normal">Search...</span>
            <kbd className="ml-1 px-1.5 py-0.5 text-[0.62rem] font-mono font-medium text-slate-500 bg-white rounded border border-slate-200 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:text-slate-900 h-9 w-9 rounded-xl relative"
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-sky-500 ring-2 ring-white" />
          </Button>

          {/* Doctor Avatar Pill */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-100">
            <div className="h-8 w-8 rounded-xl bg-linear-to-tr from-sky-600 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-sky-600/20">
              DR
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">Doctor</p>
              <p className="text-[0.62rem] text-slate-400 font-mono">Clinic Admin</p>
            </div>
          </div>
        </div>
      </header>

      {/* ⌘K Command Palette Modal */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-50 h-full w-72 max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-200 bg-white">
            <Sidebar
              className="h-full w-full border-r-0"
              onNavigate={() => setMobileMenuOpen(false)}
              showClose
            />
          </div>
        </div>
      )}
    </>
  );
}
