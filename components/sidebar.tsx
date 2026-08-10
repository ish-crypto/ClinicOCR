"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Upload, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
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
    label: "Upload Prescription",
    icon: Upload,
    href: "/upload",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="ledger space-y-4 py-4 flex flex-col h-full text-sidebar-foreground w-64 flex-shrink-0 border-r border-sidebar-border">
      <div className="px-3 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-10">
          <div className="relative w-9 h-9 mr-3 rounded-[4px] bg-primary flex items-center justify-center text-primary-foreground shadow-[0_2px_0_rgb(13_20_29/0.5)]">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-sidebar-accent-foreground">
              ClinicOCR
            </h1>
            <p className="text-[0.58rem] uppercase tracking-[0.22em] text-sidebar-foreground/60">
              Medical document desk
            </p>
          </div>
        </Link>
        <p className="px-3 mb-2 text-[0.6rem] uppercase tracking-[0.22em] text-sidebar-foreground/40">
          Records
        </p>
        <div className="space-y-1.5">
          {routes.map((route) => {
            const active = pathname.startsWith(route.href);
            return (
              <Link
                href={route.href}
                key={route.href}
                className={cn(
                  "group flex items-center p-3 w-full justify-start font-medium rounded-md transition-transform duration-200 border-l-2",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground border-rxred/80 shadow-inner"
                    : "border-transparent text-sidebar-foreground/75 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60"
                )}
              >
                <div className="flex items-center flex-1">
                  <route.icon
                    className={cn(
                      "h-5 w-5 mr-3 transition-transform duration-200 group-hover:scale-110",
                      active ? "text-primary" : "text-[#7fa8d1]"
                    )}
                  />
                  <span className="text-[15px]">{route.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="px-5 py-3 border-t border-sidebar-border">
        <p className="text-[0.58rem] uppercase tracking-[0.2em] text-sidebar-foreground/40">
          Rx · Digitized records
        </p>
      </div>
    </div>
  );
}
