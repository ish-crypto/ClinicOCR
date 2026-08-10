"use client";

import { useState, useEffect, useRef } from "react";
import { UploadCloud, CheckCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { preprocessImage } from "@/lib/ocr/preprocess";
import { extractTextFromImage } from "@/lib/ocr/tesseract";
import { processPrescriptionWithAI } from "@/app/actions/ocr";
import { savePrescription } from "@/app/actions/prescriptions";
import { ProcessedPrescription } from "@/lib/ocr/gemini";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Step = "UPLOAD" | "PROCESSING" | "REVIEW";

const pipelineSteps = [
  {
    title: "Preprocess",
    desc: "Enhance the paper — contrast, cleanup, straighten",
  },
  {
    title: "OCR read",
    desc: "Extract the raw handwriting as text",
  },
  {
    title: "Correct & structure",
    desc: "Fix OCR errors, pull medicines and summary",
  },
];

function activePipelineStep(progress: string): number {
  if (progress.includes("Structuring")) return 2;
  if (progress.includes("Extracting")) return 1;
  return 0;
}

export function PrescriptionUploader({ patientId }: { patientId?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("UPLOAD");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Processing State
  const [progress, setProgress] = useState("Waiting for image...");
  const scanRef = useRef<HTMLDivElement>(null);

  // Data State
  const [rawOcr, setRawOcr] = useState("");
  const [aiData, setAiData] = useState<ProcessedPrescription | null>(null);

  // Final Review State (editable)
  const [finalText, setFinalText] = useState("");
  const [finalSummary, setFinalSummary] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [isImportant, setIsImportant] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Drive the scan-line travel distance from the rendered paper height
  useEffect(() => {
    if (step !== "PROCESSING" || !scanRef.current) return;
    const el = scanRef.current;
    const update = () => el.style.setProperty("--scan-travel", `${el.clientHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [step]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const startProcessing = async () => {
    if (!imageFile) return;

    setStep("PROCESSING");
    try {
      // 1. Preprocess
      setProgress("Enhancing image quality...");
      const processedDataUrl = await preprocessImage(imageFile);

      // 2. OCR
      setProgress("Extracting text via OCR...");
      const extractedText = await extractTextFromImage(processedDataUrl);
      setRawOcr(extractedText);

      if (!extractedText.trim()) {
         throw new Error("No text could be extracted from this image.");
      }

      // 3. AI Processing
      setProgress("Structuring data with Gemini AI...");
      const aiResult = await processPrescriptionWithAI(extractedText);

      if (aiResult.success && aiResult.data) {
        setAiData(aiResult.data);
        setFinalText(aiResult.data.corrected_text);
        setFinalSummary(aiResult.data.summary);
        setStep("REVIEW");
        toast.success("Prescription processed successfully!");
      } else {
        throw new Error(aiResult.error || "AI processing failed");
      }

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred during processing";
      console.error(error);
      toast.error(message);
      setStep("UPLOAD");
    }
  };

  const handleSave = async () => {
    if (!patientId) {
      toast.error("No patient selected");
      return;
    }

    setIsSaving(true);

    const result = await savePrescription({
      patientId,
      rawOcr,
      correctedText: finalText,
      summary: finalSummary,
      medicines: aiData?.medicines || [],
      tags: aiData?.tags || [],
      important: isImportant,
      doctorNotes,
      // imageUrl would be uploaded to S3 here and URL passed, using placeholder for MVP
    });

    setIsSaving(false);

    if (result.success) {
      toast.success("Prescription saved to patient record");
      router.push(`/patients/${patientId}`);
    } else {
      toast.error(result.error);
    }
  };

  if (step === "UPLOAD") {
    return (
      <Card className="border-dashed border-2 bg-paper/50">
        <CardContent className="flex flex-col items-center justify-center p-12">
          {previewUrl ? (
            <div className="space-y-6 w-full max-w-md">
               <div className="paper-sheet p-3 rotate-[-1.2deg] transition-transform duration-300 hover:rotate-0">
                 <div className="relative aspect-[3/4] w-full rounded-[3px] overflow-hidden border border-ink/10">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={previewUrl} alt="Prescription preview" className="object-cover w-full h-full" />
                 </div>
               </div>
               <div className="flex gap-4">
                 <Button variant="outline" className="flex-1" onClick={() => { setImageFile(null); setPreviewUrl(null); }}>
                   Cancel
                 </Button>
                 <Button className="flex-1" onClick={startProcessing}>
                   Process with AI
                 </Button>
               </div>
            </div>
          ) : (
            <>
              <div className="h-20 w-20 rounded-[6px] bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                <UploadCloud className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Prescription</h3>
              <p className="text-muted-foreground mb-8 text-center max-w-sm">
                Stop retyping prescriptions by hand. Drop a photo of the paper here, and we&apos;ll read it back as clean, structured data.
              </p>

              <Label htmlFor="picture" className="cursor-pointer">
                <div className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-[4px] text-sm font-medium transition-colors shadow-[0_2px_0_var(--stamp-deep)]">
                  Select Image (JPG/PNG)
                </div>
                <Input id="picture" type="file" accept="image/jpeg, image/png" className="hidden" onChange={handleFileChange} />
              </Label>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === "PROCESSING") {
    const stepIdx = activePipelineStep(progress);
    return (
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: the prescription on the scanner bed */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-muted-foreground">Document</Label>
                <span className="stamp">Scanning</span>
              </div>
              <div className="paper-sheet p-3 rotate-[-1.2deg] transition-transform duration-300 hover:rotate-0">
                <div
                  ref={scanRef}
                  className="scan-frame relative aspect-[3/4] w-full rounded-[3px] overflow-hidden border border-ink/10 bg-paper"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl!} alt="Prescription being scanned" className="object-contain w-full h-full" />
                  <div className="scan-wash" />
                  <div className="scan-beam" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 font-mono">{progress}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right: numbered pipeline */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-muted-foreground">Processing pipeline</Label>
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-primary">Reading…</span>
              </div>
              {pipelineSteps.map((s, i) => {
                const state = i < stepIdx ? "done" : i === stepIdx ? "active" : "pending";
                return (
                  <div key={s.title} className={`pipeline-step ${state}`}>
                    <div
                      className={
                        "h-7 w-7 shrink-0 rounded-[4px] flex items-center justify-center font-heading text-sm font-semibold border " +
                        (state === "active"
                          ? "bg-primary text-primary-foreground border-primary"
                          : state === "done"
                          ? "bg-stamp/10 text-stamp border-stamp/25"
                          : "bg-muted/40 text-muted-foreground border-ink/10")
                      }
                    >
                      {state === "done" ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    <div>
                      <p
                        className={
                          "font-medium " +
                          (state === "active"
                            ? "text-foreground"
                            : state === "done"
                            ? "text-ink/70"
                            : "text-muted-foreground")
                        }
                      >
                        {s.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground/70 pt-3 font-mono">01 · {progress}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left Column: Image & Raw OCR */}
      <div className="space-y-6">
        <Card>
           <CardContent className="p-4">
             <div className="paper-sheet p-3 rotate-[-1deg] transition-transform duration-300 hover:rotate-0 mb-4">
               <div className="relative aspect-[3/4] w-full rounded-[3px] overflow-hidden border border-ink/10">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={previewUrl!} alt="Prescription" className="object-contain w-full h-full bg-paper" />
               </div>
             </div>
             <div className="space-y-2">
               <Label className="text-muted-foreground">Raw OCR Output</Label>
               <div className="p-3 bg-paper rounded-[4px] font-mono text-xs text-ink/75 max-h-40 overflow-y-auto whitespace-pre-wrap border border-ink/10 shadow-[inset_0_1px_2px_rgb(35_43_54/0.05)]">
                 {rawOcr}
               </div>
             </div>
           </CardContent>
        </Card>
      </div>

      {/* Right Column: AI Output & Editing */}
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-6">
             <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                   <CheckCircle className="h-5 w-5 text-primary" />
                   AI Structured Data
                </h3>
                <button
                  type="button"
                  onClick={() => setIsImportant(!isImportant)}
                  className={
                    "text-[0.62rem] uppercase tracking-[0.16em] font-semibold px-2 py-0.5 rounded-[3px] border transition-colors " +
                    (isImportant
                      ? "text-rxred border-rxred/40 bg-rxred/10"
                      : "text-muted-foreground border-ink/15 hover:border-rxred/40 hover:text-rxred")
                  }
                >
                  {isImportant ? "★ Marked important" : "Mark important"}
                </button>
             </div>

             <div className="space-y-4">
               <div className="space-y-2">
                 <Label>Corrected Text</Label>
                 <Textarea
                   rows={6}
                   value={finalText}
                   onChange={(e) => setFinalText(e.target.value)}
                   className="resize-none"
                 />
               </div>

               <div className="space-y-2">
                 <Label>AI Summary</Label>
                 <Textarea
                   rows={2}
                   value={finalSummary}
                   onChange={(e) => setFinalSummary(e.target.value)}
                   className="resize-none"
                 />
               </div>

               <div className="space-y-2 pt-2 border-t border-ink/10">
                  <Label>Extracted Medicines</Label>
                  {aiData?.medicines && aiData.medicines.length > 0 ? (
                    <div className="grid gap-2">
                      {aiData.medicines.map((med, i) => (
                        <div key={i} className="flex flex-col sm:flex-row gap-2 bg-paper/60 p-3 rounded-[4px] border border-ink/10">
                          <Input defaultValue={med.name} className="flex-1 font-medium" />
                          <div className="flex gap-2">
                            <Input defaultValue={med.dosage} className="w-24 font-mono" placeholder="Dosage" />
                            <Input defaultValue={med.frequency} className="w-24 font-mono" placeholder="Freq" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No medicines identified.</p>
                  )}
               </div>

               <div className="space-y-2 pt-2 border-t border-ink/10">
                  <Label>Doctor&apos;s Notes (Optional)</Label>
                 <Textarea
                   rows={3}
                   placeholder="Add your own notes here..."
                   value={doctorNotes}
                   onChange={(e) => setDoctorNotes(e.target.value)}
                 />
               </div>
             </div>

             <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-ink/10">
                <Button variant="outline" onClick={() => setStep("UPLOAD")} disabled={isSaving}>
                  Discard
                </Button>
                <Button onClick={handleSave} disabled={isSaving || !patientId}>
                  {isSaving ? "Saving..." : "Save to Patient Record"}
                </Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
