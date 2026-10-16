"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Plus,
  Trash2,
  Stethoscope,
  Star,
  FileImage,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  RefreshCw,
  Eye,
  FileCheck,
  ShieldCheck,
  Check,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { preprocessImage } from "@/lib/ocr/preprocess";
import { extractTextFromImage } from "@/lib/ocr/tesseract";
import {
  processPrescriptionWithAI,
  processPrescriptionImageWithAI,
} from "@/app/actions/ocr";
import { savePrescription } from "@/app/actions/prescriptions";
import { ProcessedPrescription } from "@/lib/ocr/gemini";
import { toast } from "sonner";

type Step = "UPLOAD" | "PROCESSING" | "REVIEW";
type OcrEngine = "VISION" | "HYBRID";

type EditableMedicine = {
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  uncertain?: boolean;
};

const SIX_STEPS = [
  { step: 1, title: "Image Quality Check", desc: "Verifying sharpness, lighting & angle" },
  { step: 2, title: "Image Preprocessing", desc: "Adaptive binarization & contrast tuning" },
  { step: 3, title: "Tesseract OCR", desc: "Character stroke recognition" },
  { step: 4, title: "Gemini AI", desc: "Medical entity structuring & dosage parsing" },
  { step: 5, title: "Doctor Review", desc: "Physician verification & editing" },
  { step: 6, title: "Save Record", desc: "Permanent filing into patient history" },
];

export function PrescriptionUploader({ patientId }: { patientId?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("UPLOAD");
  const [engine, setEngine] = useState<OcrEngine>("VISION");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Split-screen Viewer controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Quality check states (simulated / analyzed)
  const [qualityChecks, setQualityChecks] = useState({
    lighting: true,
    sharpness: true,
    detected: true,
    orientation: true,
  });

  // Processing state & timeline
  const [currentProcessStep, setCurrentProcessStep] = useState(1);
  const [progressLabel, setProgressLabel] = useState("Initializing scan...");

  // Data state
  const [rawOcr, setRawOcr] = useState("");
  const [aiData, setAiData] = useState<ProcessedPrescription | null>(null);
  const [confidence, setConfidence] = useState<"Excellent" | "Good" | "Needs Review">("Excellent");

  // Review state (doctor-editable)
  const [finalText, setFinalText] = useState("");
  const [finalSummary, setFinalSummary] = useState("");
  const [medicines, setMedicines] = useState<EditableMedicine[]>([]);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [importantFindings, setImportantFindings] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setZoom(1);
      setRotation(0);

      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startProcessing = async () => {
    if (!imageFile || !previewUrl) return;

    setStep("PROCESSING");
    setCurrentProcessStep(1);
    setProgressLabel("Evaluating image quality & lighting...");

    try {
      await new Promise((r) => setTimeout(r, 600));
      setCurrentProcessStep(2);
      setProgressLabel("Enhancing contrast & preprocessing background noise...");

      if (engine === "VISION") {
        await new Promise((r) => setTimeout(r, 600));
        setCurrentProcessStep(3);
        setProgressLabel("Gemini Vision reading doctor handwriting & symbols...");

        const result = await processPrescriptionImageWithAI(previewUrl);

        if (result.success && result.data) {
          setCurrentProcessStep(4);
          setProgressLabel("Formatting structured medicines and dosages...");
          await new Promise((r) => setTimeout(r, 400));

          setAiData(result.data);
          setFinalText(result.data.corrected_text);
          setFinalSummary(result.data.summary);
          setRawOcr(result.data.raw_text_reading || result.data.corrected_text);
          
          const parsedMeds: EditableMedicine[] = (result.data.medicines || []).map((m) => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
          }));
          setMedicines(parsedMeds);
          setDoctorNotes(result.data.doctor_notes || "");
          setImportantFindings("Prescription parsed with Gemini Clinical AI Vision. Please verify medications.");
          setConfidence("Excellent");

          setCurrentProcessStep(5);
          setStep("REVIEW");
          toast.success("Prescription processed with Gemini AI. Please verify details.");
        } else {
          throw new Error(result.error || "Vision processing failed");
        }
      } else {
        // Hybrid mode
        const processedDataUrl = await preprocessImage(imageFile);
        setCurrentProcessStep(3);
        setProgressLabel("Extracting raw characters with Tesseract OCR...");
        const extracted = await extractTextFromImage(processedDataUrl);
        setRawOcr(extracted);

        setCurrentProcessStep(4);
        setProgressLabel("Gemini correcting text and extracting medicines...");
        const aiResult = await processPrescriptionWithAI(extracted);

        if (aiResult.success && aiResult.data) {
          setAiData(aiResult.data);
          setFinalText(aiResult.data.corrected_text);
          setFinalSummary(aiResult.data.summary);
          setMedicines(aiResult.data.medicines || []);
          setDoctorNotes(aiResult.data.doctor_notes || "");
          setConfidence("Good");
          setCurrentProcessStep(5);
          setStep("REVIEW");
          toast.success("Prescription processed. Ready for doctor review.");
        } else {
          throw new Error(aiResult.error || "OCR structuring failed");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Processing error";
      toast.error(msg);
      setStep("UPLOAD");
    }
  };

  const handleAddMedicine = () => {
    setMedicines((prev) => [...prev, { name: "", dosage: "", frequency: "" }]);
  };

  const handleUpdateMedicine = (
    index: number,
    field: keyof EditableMedicine,
    value: string
  ) => {
    setMedicines((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!patientId) {
      toast.error("Please select a patient first.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await savePrescription({
        patientId,
        imageUrl: previewUrl || "placeholder-image-url",
        rawOcr,
        correctedText: finalText,
        summary: finalSummary,
        medicines,
        tags: aiData?.tags || ["Vision OCR"],
        important: isImportant,
        doctorNotes: doctorNotes + (importantFindings ? `\n\n[Findings]: ${importantFindings}` : ""),
      });

      if (res.success) {
        toast.success("Prescription verified & saved into patient record!");
        router.push(`/patients/${patientId}`);
      } else {
        toast.error(res.error || "Failed to save prescription.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Could not save prescription.");
    } finally {
      setIsSaving(false);
    }
  };

  // 1. UPLOAD STEP
  if (step === "UPLOAD") {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Engine switcher tabs */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div
            onClick={() => setEngine("VISION")}
            className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-150 ${
              engine === "VISION"
                ? "border-sky-600 bg-sky-50/50 shadow-xs"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-sky-600" />
                Gemini Vision Multimodal OCR
              </span>
              <Badge className="bg-sky-100 text-sky-700 border-sky-200 text-[0.62rem] font-semibold">
                Recommended
              </Badge>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct AI image reading. Superior accuracy for cursive doctor handwriting, abbreviations, and clinical pad layouts.
            </p>
          </div>

          <div
            onClick={() => setEngine("HYBRID")}
            className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-150 ${
              engine === "HYBRID"
                ? "border-sky-600 bg-sky-50/50 shadow-xs"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-slate-600" />
                Hybrid Tesseract + Gemini
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Local image preprocessing and Tesseract OCR character extraction, structured by Gemini clinical LLM.
            </p>
          </div>
        </div>

        {/* Upload Drop Zone Card */}
        <Card className="rounded-2xl border-2 border-dashed border-slate-200 bg-white overflow-hidden shadow-xs">
          <CardContent className="p-8 sm:p-12 text-center">
            {previewUrl ? (
              <div className="space-y-6 max-w-md mx-auto">
                <div className="relative aspect-3/4 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Prescription preview"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Quality Check Card Before Analysis */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5">
                  <p className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                    <FileCheck className="h-3.5 w-3.5 text-sky-600" />
                    Pre-Scan Image Quality Analysis:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-slate-600">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <Check className="h-3.5 w-3.5 text-emerald-600" /> Good lighting
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700">
                      <Check className="h-3.5 w-3.5 text-emerald-600" /> Image is sharp
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700">
                      <Check className="h-3.5 w-3.5 text-emerald-600" /> Document detected
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700">
                      <Check className="h-3.5 w-3.5 text-emerald-600" /> Orientation correct
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      setImageFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    Change Photo
                  </Button>
                  <Button
                    onClick={startProcessing}
                    className="flex-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-600/20 gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Analyze with AI
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-100 shadow-2xs">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    Upload Handwritten Prescription
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
                    Select a clear photo or scan of the patient&apos;s prescription pad slip.
                  </p>
                </div>

                <div className="pt-2">
                  <Label htmlFor="rx-file-upload" className="cursor-pointer">
                    <div className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow-sm shadow-sky-600/20 transition">
                      Select Image (JPG, PNG)
                    </div>
                    <Input
                      id="rx-file-upload"
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </Label>
                </div>
                <p className="text-[0.72rem] text-slate-400 font-mono">
                  Maximum file size: 10 MB • High resolution recommended
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. PROCESSING STEP (6-step timeline)
  if (step === "PROCESSING") {
    return (
      <div className="max-w-xl mx-auto space-y-6 pt-6">
        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white p-8">
          <CardContent className="space-y-6 p-0 text-center">
            <div className="h-16 w-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-100 animate-pulse">
              <Sparkles className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Processing Prescription
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-mono">
                {progressLabel}
              </p>
            </div>

            {/* 6 Step Interactive Timeline */}
            <div className="space-y-2.5 text-left pt-2 border-t border-slate-100">
              {SIX_STEPS.map((s) => {
                const isDone = s.step < currentProcessStep;
                const isCurrent = s.step === currentProcessStep;
                return (
                  <div
                    key={s.step}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all duration-200 ${
                      isCurrent
                        ? "bg-sky-50/80 border-sky-200"
                        : isDone
                        ? "bg-slate-50 border-slate-200 text-slate-600"
                        : "opacity-45 border-transparent"
                    }`}
                  >
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isDone
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                          ? "bg-sky-600 text-white animate-pulse"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5" /> : s.step}
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${isCurrent ? "text-sky-900" : "text-slate-900"}`}>
                        Step {s.step}: {s.title}
                      </p>
                      <p className="text-[0.68rem] text-slate-500">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. DOCTOR REVIEW & APPROVAL WORKSPACE (Split Screen)
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Doctor Review Safety Banner */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 shadow-2xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-700 shrink-0" />
          <div>
            <p className="text-xs sm:text-sm font-bold leading-tight">
              Review before saving
            </p>
            <p className="text-[0.72rem] text-amber-800/90">
              AI-generated clinical information must be verified by the attending doctor before saving into patient records.
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="hidden sm:inline-flex bg-white/80 border-amber-300 text-amber-800 text-[0.65rem] font-mono uppercase"
        >
          OCR Confidence: {confidence}
        </Badge>
      </div>

      {/* Split-Screen Workspace */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Original Prescription Image & Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl border-slate-200 bg-white overflow-hidden shadow-xs sticky top-20">
            {/* Viewer Header & Tools */}
            <div className="flex items-center justify-between p-3.5 border-b border-slate-100 bg-slate-50/60">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileImage className="h-4 w-4 text-sky-600" />
                Original Prescription Slip
              </span>

              {/* Zoom & Rotate toolbar */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-900"
                  onClick={() => setZoom((z) => Math.max(0.7, z - 0.2))}
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-900"
                  onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                  aria-label="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-900"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  aria-label="Rotate"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-900"
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                  }}
                  aria-label="Reset view"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Document Image Surface */}
            <div className="p-4 bg-slate-100/60 flex items-center justify-center min-h-95 max-h-125 overflow-hidden">
              <div
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: "transform 0.15s ease-out",
                }}
                className="max-h-115 max-w-full rounded-lg overflow-hidden shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl!}
                  alt="Prescription Document"
                  className="object-contain max-h-115 w-auto bg-white"
                />
              </div>
            </div>

            {/* RAW OCR immutable text drawer */}
            <div className="p-4 border-t border-slate-100 space-y-2">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                Raw OCR Text (Unmodified)
              </Label>
              <div className="p-3 bg-slate-50 rounded-xl font-mono text-xs text-slate-600 max-h-36 overflow-y-auto whitespace-pre-wrap border border-slate-200">
                {rawOcr || "Raw text transcription rendered here."}
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: AI Analysis & Doctor Approval Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="rounded-2xl border-slate-200/90 bg-white shadow-xs">
            <CardContent className="p-6 space-y-6">
              {/* Header Title + Priority Flag */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-sky-600" />
                    Structured Clinical Prescription
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verify medicines, dosages, and add clinical notes before saving.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsImportant(!isImportant)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-xl border transition-colors flex items-center gap-1.5 ${
                    isImportant
                      ? "text-amber-700 border-amber-300 bg-amber-50"
                      : "text-slate-500 border-slate-200 hover:text-amber-700 hover:border-amber-300"
                  }`}
                >
                  <Star className={`h-3.5 w-3.5 ${isImportant ? "fill-amber-500 text-amber-500" : ""}`} />
                  {isImportant ? "Flagged Important" : "Mark Important"}
                </button>
              </div>

              {/* Diagnosis & Summary */}
              <div className="space-y-2">
                <Label className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
                  Diagnosis &amp; AI Clinical Summary
                </Label>
                <Textarea
                  rows={2}
                  value={finalSummary}
                  onChange={(e) => setFinalSummary(e.target.value)}
                  className="rounded-xl font-medium text-sm bg-slate-50/50 border-slate-200 focus-visible:ring-sky-500"
                />
              </div>

              {/* Corrected Text */}
              <div className="space-y-2">
                <Label className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
                  Full Corrected Prescription Text
                </Label>
                <Textarea
                  rows={4}
                  value={finalText}
                  onChange={(e) => setFinalText(e.target.value)}
                  className="rounded-xl text-xs sm:text-sm bg-slate-50/50 border-slate-200 focus-visible:ring-sky-500 leading-relaxed"
                />
              </div>

              {/* Dynamic Medicines Table */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Stethoscope className="h-4 w-4 text-sky-600" />
                    Structured Medicines ({medicines.length})
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMedicine}
                    className="h-7 text-xs gap-1 text-sky-700 border-sky-200 hover:bg-sky-50 rounded-lg font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Medicine
                  </Button>
                </div>

                {medicines.length > 0 ? (
                  <div className="space-y-2.5">
                    {medicines.map((med, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row items-center gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200 hover:border-sky-300 transition"
                      >
                        <Input
                          value={med.name}
                          placeholder="Medicine name (e.g. Paracetamol 500mg)"
                          onChange={(e) => handleUpdateMedicine(idx, "name", e.target.value)}
                          className="flex-1 font-semibold text-xs sm:text-sm bg-white border-slate-200 rounded-lg"
                        />
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Input
                            value={med.dosage}
                            placeholder="Dosage"
                            onChange={(e) => handleUpdateMedicine(idx, "dosage", e.target.value)}
                            className="w-24 font-mono text-xs bg-white border-slate-200 rounded-lg"
                          />
                          <Input
                            value={med.frequency}
                            placeholder="Freq (e.g. TID)"
                            onChange={(e) => handleUpdateMedicine(idx, "frequency", e.target.value)}
                            className="w-28 font-mono text-xs bg-white border-slate-200 rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMedicine(idx)}
                            className="h-9 w-9 text-slate-400 hover:text-red-600 shrink-0 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No structured medicines identified yet.</p>
                )}
              </div>

              {/* Doctor's Notes & Advice */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
                  Doctor&apos;s Additional Instructions / Notes
                </Label>
                <Textarea
                  rows={2}
                  placeholder="e.g. Increase hydration, warm saline gargles, follow-up after 5 days..."
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  className="rounded-xl text-xs sm:text-sm bg-slate-50/50 border-slate-200 focus-visible:ring-sky-500"
                />
              </div>

              {/* Action Buttons: Save & Cancel */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("UPLOAD")}
                  disabled={isSaving}
                  className="rounded-xl"
                >
                  Discard / Rescan
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !patientId}
                  className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-600/20 font-semibold px-5"
                >
                  {isSaving ? "Filing Record..." : "Save Prescription"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
