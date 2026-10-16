"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, User, FileText, Plus, Upload, Mic, X, ArrowRight } from "lucide-react";
import { SAMPLE_PATIENTS, SAMPLE_PRESCRIPTIONS } from "@/lib/sample-data";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // Keyboard shortcut listener for ⌘K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const filteredPatients = query.trim()
    ? SAMPLE_PATIENTS.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.phone.includes(query)
      )
    : SAMPLE_PATIENTS.slice(0, 3);

  const filteredPrescriptions = query.trim()
    ? SAMPLE_PRESCRIPTIONS.filter(
        (rx) =>
          rx.patientName.toLowerCase().includes(query.toLowerCase()) ||
          rx.medicines.some((m) =>
            m.name.toLowerCase().includes(query.toLowerCase())
          ) ||
          rx.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
      )
    : SAMPLE_PRESCRIPTIONS.slice(0, 3);

  const handleSelect = (url: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog container */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patient, phone, medicine (e.g. Paracetamol), date..."
            className="w-full bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[0.65rem] font-mono font-medium text-slate-400 bg-slate-100 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4 text-sm">
          {/* Quick Actions */}
          {!query && (
            <div>
              <p className="px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-slate-400">
                Quick Actions
              </p>
              <div className="space-y-0.5">
                <button
                  onClick={() => handleSelect("/upload")}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition group text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                      <Upload className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">Upload New Prescription</span>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button
                  onClick={() => handleSelect("/dictate")}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition group text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                      <Mic className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">Hands-Free Voice Dictation</span>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button
                  onClick={() => handleSelect("/patients/new")}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition group text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Plus className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">Register New Patient</span>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          )}

          {/* Patients Section */}
          {filteredPatients.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-slate-400">
                Patients ({filteredPatients.length})
              </p>
              <div className="space-y-0.5">
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelect(`/patients/${patient.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition group text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-sky-100 group-hover:text-sky-700 flex items-center justify-center font-semibold text-xs">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900 group-hover:text-sky-900 leading-tight">
                          {patient.name}
                        </p>
                        <p className="text-[0.68rem] text-slate-400 font-mono">
                          {patient.phone} • {patient.age}y {patient.gender}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-sky-600 font-mono">
                      {patient.prescriptionsCount} Rx
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prescriptions Section */}
          {filteredPrescriptions.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-slate-400">
                Prescriptions &amp; Medicines ({filteredPrescriptions.length})
              </p>
              <div className="space-y-0.5">
                {filteredPrescriptions.map((rx) => (
                  <button
                    key={rx.id}
                    onClick={() => handleSelect(`/prescriptions/${rx.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition group text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-slate-900 group-hover:text-sky-900 truncate">
                          {rx.patientName} — {rx.medicines.map((m) => m.name).join(", ")}
                        </p>
                        <p className="text-[0.68rem] text-slate-400 truncate">
                          {rx.aiSummary}
                        </p>
                      </div>
                    </div>
                    <span className="text-[0.68rem] text-slate-400 font-mono shrink-0">
                      {new Date(rx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredPatients.length === 0 && filteredPrescriptions.length === 0 && (
            <div className="py-8 text-center text-slate-400">
              <p className="text-sm">No results found for &quot;{query}&quot;</p>
              <p className="text-xs text-slate-400 mt-1">Try searching with a patient name or medicine</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[0.68rem] text-slate-400 font-mono">
          <span>Navigate with ⌘K</span>
          <span>ClinicOCR Intelligent Search</span>
        </div>
      </div>
    </div>
  );
}
