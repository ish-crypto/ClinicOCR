"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Upload,
  Mic,
  Plus,
  Settings,
  HelpCircle,
  X,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const mainRoutes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Patients",
    icon: Users,
    href: "/patients",
  },
  {
    label: "Prescriptions",
    icon: FileText,
    href: "/prescriptions",
  },
  {
    label: "Upload Prescription",
    icon: Upload,
    href: "/upload",
  },
  {
    label: "Voice Dictate",
    icon: Mic,
    href: "/dictate",
    badge: "AI",
  },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  showClose?: boolean;
}

export function Sidebar({ className, onNavigate, showClose }: SidebarProps = {}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-white border-r border-slate-200/80 w-64 shrink-0 select-none text-slate-700",
        className
      )}
    >
      {/* ClinicOCR Logo Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 group"
        >
          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/20 transition-transform group-hover:scale-105">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-slate-900">
                Clinic<span className="text-sky-600">OCR</span>
              </span>
              <span className="text-[0.62rem] font-semibold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200/60 font-mono">
                v2.5
              </span>
            </div>
            <p className="text-[0.62rem] text-slate-400 font-medium tracking-wide">
              Medical Intelligence
            </p>
          </div>
        </Link>

        {showClose && (
          <button
            type="button"
            onClick={onNavigate}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 md:hidden transition"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          <p className="px-3 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
            Platform
          </p>
          <nav className="space-y-1">
            {mainRoutes.map((route) => {
              const active =
                route.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(route.href);
              return (
                <Link
                  href={route.href}
                  key={route.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-sky-50 text-sky-700 font-semibold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <route.icon
                      className={cn(
                        "h-4.5 w-4.5 transition-colors",
                        active
                          ? "text-sky-600"
                          : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    <span>{route.label}</span>
                  </div>

                  {/* Active Indicator bar */}
                  {active && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-sky-600" />
                  )}

                  {route.badge && (
                    <span className="text-[0.6rem] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                      {route.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Actions */}
        <div className="space-y-1">
          <p className="px-3 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
            Quick Actions
          </p>
          <div className="space-y-1">
            <Link
              href="/patients/new"
              onClick={onNavigate}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
            >
              <Plus className="h-4 w-4 text-slate-400" />
              <span>Add Patient</span>
            </Link>
            <Link
              href="/upload"
              onClick={onNavigate}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
            >
              <Upload className="h-4 w-4 text-slate-400" />
              <span>Upload Prescription</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Profile & Utilities */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="h-4 w-4 text-slate-400" />
            <span>Help &amp; Clinical Docs</span>
          </div>
        </Link>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2.5">
            <Settings className="h-4 w-4 text-slate-400" />
            <span>Settings</span>
          </div>
        </Link>

        {/* Doctor Profile Pill */}
        <div className="pt-2">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition cursor-pointer">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                DR
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">Doctor</p>
                <p className="text-[0.62rem] text-slate-400 truncate font-mono">Clinic Admin</p>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
      </div>
    </aside>
  );
}
