"use client";

import { useState } from "react";
import { Languages, ChevronDown, ChevronUp } from "lucide-react";
import { LanguageTranslator } from "@/components/language-translator";
import { Button } from "@/components/ui/button";

interface PrescriptionTranslatorPanelProps {
  rawOcr?: string;
  correctedText?: string;
  aiSummary?: string;
  doctorNotes?: string;
}

type PanelSection = "rawOcr" | "correctedText" | "summary" | "notes" | null;

export function PrescriptionTranslatorPanel({
  rawOcr,
  correctedText,
  aiSummary,
  doctorNotes,
}: PrescriptionTranslatorPanelProps) {
  const [openSection, setOpenSection] = useState<PanelSection>(null);

  const toggle = (section: PanelSection) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const sections: {
    key: PanelSection;
    label: string;
    text: string | undefined;
  }[] = [
    { key: "summary", label: "Diagnosis Summary", text: aiSummary },
    { key: "correctedText", label: "Corrected Prescription Text", text: correctedText },
    { key: "rawOcr", label: "Raw OCR Transcript", text: rawOcr },
    { key: "notes", label: "Doctor's Notes", text: doctorNotes },
  ];

  const available = sections.filter((s) => s.text && s.text.trim());
  if (available.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
        <Languages className="h-4 w-4 text-sky-600" />
        <p className="text-xs font-bold text-slate-700">
          Language Converter
          <span className="ml-1.5 font-normal text-slate-400">— Hindi ↔ English</span>
        </p>
      </div>

      {/* Section Selectors */}
      <div className="divide-y divide-slate-100">
        {available.map((section) => (
          <div key={section.key}>
            <button
              type="button"
              onClick={() => toggle(section.key)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition group"
            >
              <span className="text-xs font-semibold text-slate-700 group-hover:text-sky-700 transition">
                {section.label}
              </span>
              <span className="text-[0.68rem] text-slate-400 flex items-center gap-1">
                {openSection === section.key ? (
                  <>
                    Hide <ChevronUp className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    Translate <ChevronDown className="h-3.5 w-3.5" />
                  </>
                )}
              </span>
            </button>

            {openSection === section.key && (
              <div className="px-4 pb-4">
                <LanguageTranslator sourceText={section.text!} compact />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
