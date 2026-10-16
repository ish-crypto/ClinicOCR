"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
  Stethoscope,
  Star,
  FileImage,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Eye,
  FileCheck,
  ShieldCheck,
  Check,
  Layers,
  Languages,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  ScanLine,
  Brain,
  Save,
  X,
  AlertTriangle,
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
import { LanguageTranslator } from "@/components/language-translator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  {
    step: 1,
    icon: ScanLine,
    title: "Image Quality Check",
    desc: "Sharpness, lighting & document orientation",
  },
  {
    step: 2,
    icon: FileImage,
    title: "Image Preprocessing",
    desc: "Adaptive binarization & contrast tuning",
  },
  {
    step: 3,
    icon: Eye,
    title: "Tesseract OCR",
    desc: "Character stroke recognition & extraction",
  },
  {
    step: 4,
    icon: Brain,
    title: "Gemini AI Analysis",
    desc: "Medical entity structuring & dosage parsing",
  },
  {
    step: 5,
    icon: ClipboardCheck,
    title: "Doctor Review",
    desc: "Physician verification & correction",
  },
  {
    step: 6,
    icon: Save,
    title: "Save Record",
    desc: "Permanent filing into patient history",
  },
];

export function PrescriptionUploader({ patientId }: { patientId?: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("UPLOAD");
  const [engine, setEngine] = useState<OcrEngine>("VISION");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Image viewer controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Processing state
  const [currentProcessStep, setCurrentProcessStep] = useState(1);
  const [progressLabel, setProgressLabel] = useState("Initializing scan...");

  // Data state
  const [rawOcr, setRawOcr] = useState("");
  const [aiData, setAiData] = useState<ProcessedPrescription | null>(null);
  const [confidence, setConfidence] = useState<"Excellent" | "Good" | "Needs Review">("Excellent");

  // Review state
  const [finalText, setFinalText] = useState("");
  const [finalSummary, setFinalSummary] = useState("");
  const [medicines, setMedicines] = useState<EditableMedicine[]>([]);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [importantFindings, setImportantFindings] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTranslator, setShowTranslator] = useState(false);
  const [translatorSource, setTranslatorSource] = useState("rawOcr");

  const handleFileChange = (file: File) => {
    setImageFile(file);
    setZoom(1);
    setRotation(0);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFileChange(file);
  };

  const startProcessing = async () => {
    if (!imageFile || !previewUrl) return;

    setStep("PROCESSING");
    setCurrentProcessStep(1);
    setProgressLabel("Evaluating image quality & lighting…");

    try {
      await new Promise((r) => setTimeout(r, 600));
      setCurrentProcessStep(2);
      setProgressLabel("Enhancing contrast & removing background noise…");

      if (engine === "VISION") {
        await new Promise((r) => setTimeout(r, 600));
        setCurrentProcessStep(3);
        setProgressLabel("Gemini Vision reading handwriting & clinical symbols…");

        const result = await processPrescriptionImageWithAI(previewUrl);

        if (result.success && result.data) {
          setCurrentProcessStep(4);
          setProgressLabel("Structuring medicines, dosages & diagnosis…");
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
          setImportantFindings(
            "Prescription parsed with Gemini Clinical AI Vision. Please verify medications."
          );
          setConfidence("Excellent");
          setCurrentProcessStep(5);
          setStep("REVIEW");
          toast.success("Prescription processed. Please verify and save.");
        } else {
          throw new Error(result.error || "Vision processing failed");
        }
      } else {
        const processedDataUrl = await preprocessImage(imageFile);
        setCurrentProcessStep(3);
        setProgressLabel("Extracting raw characters with Tesseract OCR…");
        const extracted = await extractTextFromImage(processedDataUrl);
        setRawOcr(extracted);

        setCurrentProcessStep(4);
        setProgressLabel("Gemini correcting text and extracting medicines…");
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
        doctorNotes:
          doctorNotes + (importantFindings ? `\n\n[Findings]: ${importantFindings}` : ""),
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

  // ─── UPLOAD STEP ────────────────────────────────────────────────────────────
  if (step === "UPLOAD") {
    return (
      <div className="space-y-5 max-w-4xl mx-auto">
        {/* Engine Selector */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 px-0.5">
            Select OCR Engine
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {/* Vision Mode */}
            <button
              type="button"
              onClick={() => setEngine("VISION")}
              className={cn(
                "text-left p-4 rounded-2xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                engine === "VISION"
                  ? "border-sky-500 bg-sky-50/60 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span
                    className={cn(
                      "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition",
                      engine === "VISION"
                        ? "bg-sky-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    <Sparkles className="h-4 w-4" />
                  </span>
                  Gemini Vision Multimodal
                </span>
                {engine === "VISION" && (
                  <Badge className="bg-sky-100 text-sky-700 border-sky-200 text-[0.62rem] font-bold shrink-0">
                    Recommended
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed pl-10">
                Direct AI image reading. Superior for cursive handwriting, abbreviations &
                clinical pad layouts.
              </p>
            </button>

            {/* Hybrid Mode */}
            <button
              type="button"
              onClick={() => setEngine("HYBRID")}
              className={cn(
                "text-left p-4 rounded-2xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                engine === "HYBRID"
                  ? "border-sky-500 bg-sky-50/60 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span
                    className={cn(
                      "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition",
                      engine === "HYBRID"
                        ? "bg-sky-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    <Layers className="h-4 w-4" />
                  </span>
                  Hybrid Tesseract + Gemini
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed pl-10">
                Local preprocessing + Tesseract character extraction, structured by Gemini
                clinical LLM.
              </p>
            </button>
          </div>
        </div>

        {/* Upload Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden",
            isDragging
              ? "border-sky-400 bg-sky-50/60 scale-[1.005]"
              : previewUrl
              ? "border-slate-200 bg-white"
              : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/20"
          )}
        >
          {previewUrl ? (
            <div className="p-5 space-y-5">
              {/* Image Preview */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Prescription preview"
                  className="w-full max-h-80 object-contain mx-auto block"
                />
                {/* Remove overlay button */}
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-slate-900/60 text-white hover:bg-red-600 transition flex items-center justify-center"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Quality Check Pills */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-[0.68rem] font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileCheck className="h-3.5 w-3.5" />
                  Pre-Scan Quality Analysis
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Good lighting",
                    "Image is sharp",
                    "Document detected",
                    "Orientation correct",
                  ].map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-[0.68rem] font-medium text-emerald-700"
                    >
                      <Check className="h-3 w-3 text-emerald-500" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* File info */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <FileImage className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="font-mono truncate">{imageFile?.name}</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono shrink-0">
                  {imageFile ? `${(imageFile.size / 1024).toFixed(0)} KB` : ""}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={() => {
                    setImageFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  Change Image
                </Button>
                <Button
                  onClick={startProcessing}
                  className="flex-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-600/20 gap-2 font-semibold"
                >
                  <Sparkles className="h-4 w-4" />
                  Analyze with AI
                </Button>
              </div>
            </div>
          ) : (
            /* Empty Drop Zone */
            <div className="p-10 sm:p-14 text-center space-y-4">
              <div
                className={cn(
                  "h-16 w-16 rounded-2xl flex items-center justify-center mx-auto border transition-all",
                  isDragging
                    ? "bg-sky-100 border-sky-300 text-sky-600 scale-110"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                )}
              >
                <UploadCloud className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  {isDragging ? "Drop the prescription here" : "Upload Handwritten Prescription"}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Drag & drop a clear photo or scan of the patient&apos;s prescription slip, or
                  click to browse.
                </p>
              </div>

              <div>
                <Label htmlFor="rx-file-upload" className="cursor-pointer">
                  <div className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow-sm shadow-sky-600/20 transition gap-2">
                    <UploadCloud className="h-4 w-4" />
                    Select Image
                  </div>
                  <Input
                    id="rx-file-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden"
                    onChange={handleInputChange}
                  />
                </Label>
              </div>

              <p className="text-[0.7rem] text-slate-400 font-mono">
                JPG, PNG, WEBP • Max 10 MB • High resolution recommended
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── PROCESSING STEP ────────────────────────────────────────────────────────
  if (step === "PROCESSING") {
    return (
      <div className="max-w-lg mx-auto space-y-5 pt-4">
        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 text-center space-y-3">
            <div className="relative mx-auto h-16 w-16">
              <div className="absolute inset-0 rounded-2xl bg-sky-100 animate-ping opacity-40" />
              <div className="relative h-16 w-16 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/30">
                <Brain className="h-7 w-7" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Analyzing Prescription
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-1 leading-relaxed">
                {progressLabel}
              </p>
            </div>
          </div>

          {/* Step timeline */}
          <CardContent className="p-5 space-y-2.5">
            {SIX_STEPS.map((s) => {
              const isDone = s.step < currentProcessStep;
              const isCurrent = s.step === currentProcessStep;
              const StepIcon = s.icon;
              return (
                <div
                  key={s.step}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                    isCurrent
                      ? "bg-sky-50/80 border-sky-200 shadow-xs"
                      : isDone
                      ? "bg-slate-50 border-transparent text-slate-500"
                      : "opacity-35 border-transparent"
                  )}
                >
                  {/* Step indicator */}
                  <div
                    className={cn(
                      "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all",
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-sky-600 text-white shadow-sm animate-pulse"
                        : "bg-slate-100 text-slate-400"
                    )}
                  >
                    {isDone ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-xs font-bold leading-tight",
                        isCurrent ? "text-sky-900" : "text-slate-700"
                      )}
                    >
                      {s.title}
                    </p>
                    <p className="text-[0.66rem] text-slate-400 truncate">{s.desc}</p>
                  </div>

                  {/* Right badge */}
                  <div className="shrink-0">
                    {isDone ? (
                      <span className="text-[0.62rem] font-mono font-semibold text-emerald-600">
                        Done
                      </span>
                    ) : isCurrent ? (
                      <span className="text-[0.62rem] font-mono font-semibold text-sky-600 animate-pulse">
                        Running
                      </span>
                    ) : (
                      <span className="text-[0.62rem] font-mono text-slate-300">
                        Step {s.step}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── REVIEW STEP ────────────────────────────────────────────────────────────
  const confidenceColor =
    confidence === "Excellent"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : confidence === "Good"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Doctor Review Safety Banner */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <p className="text-xs font-bold leading-tight">Clinical Review Required</p>
            <p className="text-[0.7rem] text-amber-800/80 mt-0.5 leading-relaxed">
              AI-generated data must be verified by the attending physician before filing.
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`hidden sm:inline-flex shrink-0 text-[0.65rem] font-mono font-semibold ${confidenceColor}`}
        >
          Confidence: {confidence}
        </Badge>
      </div>

      {/* Split-Screen Workspace */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* ── LEFT: Image Viewer + Raw OCR ─────────────────────── */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl border-slate-200 bg-white overflow-hidden shadow-xs sticky top-20">
            {/* Viewer Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileImage className="h-4 w-4 text-sky-600" />
                Original Prescription
              </span>

              {/* Toolbar */}
              <div className="flex items-center gap-0.5 p-0.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
                {[
                  {
                    Icon: ZoomOut,
                    action: () => setZoom((z) => Math.max(0.7, z - 0.2)),
                    label: "Zoom out",
                  },
                  {
                    Icon: ZoomIn,
                    action: () => setZoom((z) => Math.min(2.5, z + 0.2)),
                    label: "Zoom in",
                  },
                  {
                    Icon: RotateCw,
                    action: () => setRotation((r) => (r + 90) % 360),
                    label: "Rotate",
                  },
                  {
                    Icon: RefreshCw,
                    action: () => {
                      setZoom(1);
                      setRotation(0);
                    },
                    label: "Reset",
                  },
                ].map(({ Icon, action, label }) => (
                  <Button
                    key={label}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                    onClick={action}
                    aria-label={label}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Button>
                ))}
              </div>
            </div>

            {/* Document Surface */}
            <div className="bg-slate-100/60 flex items-center justify-center min-h-80 max-h-120 overflow-hidden p-3">
              <div
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: "transform 0.15s ease-out",
                }}
                className="max-h-[460px] max-w-full rounded-lg overflow-hidden shadow-md ring-1 ring-slate-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl!}
                  alt="Prescription Document"
                  className="object-contain max-h-[460px] w-auto bg-white"
                />
              </div>
            </div>

            {/* Raw OCR drawer */}
            <div className="border-t border-slate-100">
              <div className="px-4 py-2.5 flex items-center justify-between">
                <Label className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  Raw OCR Text (Unmodified)
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTranslatorSource("rawOcr");
                    setShowTranslator((v) => !v);
                  }}
                  className="h-6 text-[0.68rem] gap-1 text-sky-600 hover:bg-sky-50 rounded-lg px-2"
                >
                  <Languages className="h-3 w-3" />
                  Translate
                  {showTranslator && translatorSource === "rawOcr" ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </div>

              <div className="px-4 pb-3 space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl font-mono text-xs text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap border border-slate-200 leading-relaxed">
                  {rawOcr || "Raw text transcription rendered here."}
                </div>

                {/* Inline Translator for Raw OCR */}
                {showTranslator && translatorSource === "rawOcr" && (
                  <LanguageTranslator
                    sourceText={rawOcr}
                    compact
                    className="border-sky-200"
                  />
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* ── RIGHT: Clinical Data Form ──────────────────────────── */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-xs">
            <CardContent className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-sky-600 shrink-0" />
                    Structured Clinical Prescription
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verify medicines, dosages & notes before saving to patient record.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsImportant(!isImportant)}
                  className={cn(
                    "text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 shrink-0",
                    isImportant
                      ? "text-amber-700 border-amber-300 bg-amber-50 shadow-xs"
                      : "text-slate-400 border-slate-200 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50"
                  )}
                >
                  <Star
                    className={cn(
                      "h-3.5 w-3.5 transition",
                      isImportant ? "fill-amber-500 text-amber-500" : ""
                    )}
                  />
                  {isImportant ? "Priority" : "Mark Priority"}
                </button>
              </div>

              {/* Diagnosis & Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-xs text-slate-600 uppercase tracking-wider">
                    Diagnosis & AI Clinical Summary
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTranslatorSource("summary");
                      setShowTranslator((v) =>
                        translatorSource === "summary" ? !v : true
                      );
                    }}
                    className="h-6 text-[0.68rem] gap-1 text-sky-600 hover:bg-sky-50 rounded-lg px-2"
                  >
                    <Languages className="h-3 w-3" />
                    Translate
                  </Button>
                </div>
                <Textarea
                  rows={2}
                  value={finalSummary}
                  onChange={(e) => setFinalSummary(e.target.value)}
                  className="rounded-xl font-medium text-sm bg-slate-50/50 border-slate-200 focus-visible:ring-sky-500 resize-none"
                />
                {showTranslator && translatorSource === "summary" && (
                  <LanguageTranslator sourceText={finalSummary} compact />
                )}
              </div>

              {/* Corrected Text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-xs text-slate-600 uppercase tracking-wider">
                    Full Corrected Prescription Text
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTranslatorSource("fullText");
                      setShowTranslator((v) =>
                        translatorSource === "fullText" ? !v : true
                      );
                    }}
                    className="h-6 text-[0.68rem] gap-1 text-sky-600 hover:bg-sky-50 rounded-lg px-2"
                  >
                    <Languages className="h-3 w-3" />
                    Translate
                  </Button>
                </div>
                <Textarea
                  rows={4}
                  value={finalText}
                  onChange={(e) => setFinalText(e.target.value)}
                  className="rounded-xl text-xs sm:text-sm bg-slate-50/50 border-slate-200 focus-visible:ring-sky-500 leading-relaxed resize-none"
                />
                {showTranslator && translatorSource === "fullText" && (
                  <LanguageTranslator sourceText={finalText} compact />
                )}
              </div>

              {/* Medicines Table */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-xs text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Stethoscope className="h-4 w-4 text-sky-600" />
                    Prescribed Medicines
                    <span className="ml-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[0.62rem] font-mono">
                      {medicines.length}
                    </span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMedicine}
                    className="h-7 text-xs gap-1 text-sky-700 border-sky-200 hover:bg-sky-50 rounded-lg font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Medicine
                  </Button>
                </div>

                {medicines.length > 0 ? (
                  <div className="space-y-2">
                    {/* Column headers */}
                    <div className="grid grid-cols-12 gap-2 px-1">
                      <span className="col-span-5 text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">
                        Name / Drug
                      </span>
                      <span className="col-span-3 text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">
                        Dosage
                      </span>
                      <span className="col-span-3 text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">
                        Frequency
                      </span>
                    </div>

                    {medicines.map((med, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center p-2.5 bg-slate-50/80 rounded-xl border border-slate-200 hover:border-sky-200 hover:bg-sky-50/20 transition group"
                      >
                        <Input
                          value={med.name}
                          placeholder="e.g. Paracetamol 500mg"
                          onChange={(e) => handleUpdateMedicine(idx, "name", e.target.value)}
                          className="col-span-5 font-semibold text-xs bg-white border-slate-200 rounded-lg h-8"
                        />
                        <Input
                          value={med.dosage}
                          placeholder="Dosage"
                          onChange={(e) => handleUpdateMedicine(idx, "dosage", e.target.value)}
                          className="col-span-3 font-mono text-xs bg-white border-slate-200 rounded-lg h-8"
                        />
                        <Input
                          value={med.frequency}
                          placeholder="e.g. TID"
                          onChange={(e) =>
                            handleUpdateMedicine(idx, "frequency", e.target.value)
                          }
                          className="col-span-3 font-mono text-xs bg-white border-slate-200 rounded-lg h-8"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMedicine(idx)}
                          className="col-span-1 h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg group-hover:text-slate-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-1.5">
                    <Stethoscope className="h-6 w-6 text-slate-300" />
                    <p className="text-xs text-slate-400 font-medium">
                      No medicines identified yet.
                    </p>
                    <p className="text-[0.68rem] text-slate-400">
                      Click &quot;Add Medicine&quot; to enter manually.
                    </p>
                  </div>
                )}
              </div>

              {/* Doctor Notes */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label className="font-bold text-xs text-slate-600 uppercase tracking-wider">
                  Doctor&apos;s Additional Instructions / Advice
                </Label>
                <Textarea
                  rows={2}
                  placeholder="e.g. Increase hydration, warm saline gargles, follow-up after 5 days…"
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  className="rounded-xl text-xs sm:text-sm bg-slate-50/50 border-slate-200 focus-visible:ring-sky-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("UPLOAD")}
                  disabled={isSaving}
                  className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Rescan
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={isSaving || !patientId}
                  className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-600/20 font-bold px-6 gap-2"
                >
                  {isSaving ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Filing Record…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Prescription
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
