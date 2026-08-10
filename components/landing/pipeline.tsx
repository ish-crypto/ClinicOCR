import { CheckCircle2, ScanLine, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  {
    n: "01",
    title: "Scan",
    icon: ScanLine,
    desc: "Photograph the paper. The image is deskewed, contrast-pushed, and read by on-device OCR.",
    spec: "tesseract.js · eng · canvas",
  },
  {
    n: "02",
    title: "Correct",
    icon: CheckCircle2,
    desc: "AI rewrites the raw OCR text, fixing misread drug names against medical context — never inventing a dose that isn't on the page.",
    spec: "gemini · structured JSON",
  },
  {
    n: "03",
    title: "Structure",
    icon: FileText,
    desc: "Medicines, dosage and frequency drop into the patient record. You approve the readout before it's filed.",
    spec: "patients[] · medicines[]",
  },
];

export function Pipeline() {
  return (
    <section className="relative border-t border-ink/10">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="max-w-xl">
          <span className="stamp mb-5">How it works</span>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-ink md:text-4xl">
            A lab workflow, not a checklist.
          </h2>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-ink/70">
            Three passes over the same sheet. Each one is an instrument step with a
            defined output — you can stop and edit at any stage.
          </p>
        </div>

        <div className="relative mt-12 grid gap-5 md:grid-cols-3">
          <div
            className="ink-rule absolute left-8 right-8 top-[2.4rem] hidden md:block"
            aria-hidden="true"
          />
          {STEPS.map((step) => (
            <Card key={step.n} className="relative bg-paper-raised/60">
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[5px] border border-ink/15 bg-paper text-ink shadow-[0_2px_0_rgb(35_43_54/0.14)]">
                    <step.icon className="h-5 w-5 text-stamp" />
                  </span>
                  <span className="font-heading text-2xl font-bold text-ink/15">
                    {step.n}
                  </span>
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-[0.85rem] leading-relaxed text-ink/70">{step.desc}</p>
                </div>
                <span className="spec-chip">{step.spec}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
