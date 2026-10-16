import { db } from "@/db";
import { patients, prescriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  FileImage,
  Stethoscope,
  Star,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DownloadPdfButton } from "@/components/prescription/download-pdf-button";
import { PrescriptionTranslatorPanel } from "@/components/prescription/prescription-translator-panel";
import { SAMPLE_PRESCRIPTIONS, SamplePrescription } from "@/lib/sample-data";

export const dynamic = "force-dynamic";

type Medicine = {
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
};

export default async function PrescriptionDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const prescriptionId = params.id;

  let prescription: SamplePrescription =
    SAMPLE_PRESCRIPTIONS.find((p) => p.id === prescriptionId) ||
    SAMPLE_PRESCRIPTIONS[0];

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const [found] = await db
        .select({
          prescription: prescriptions,
          patient: patients,
        })
        .from(prescriptions)
        .innerJoin(patients, eq(prescriptions.patientId, patients.id))
        .where(eq(prescriptions.id, prescriptionId));

      if (found) {
        const p = found.prescription;
        const pat = found.patient;
        let meds: Medicine[] = [];
        try {
          meds =
            typeof p.medicinesJson === "string"
              ? JSON.parse(p.medicinesJson)
              : p.medicinesJson;
          if (!Array.isArray(meds)) meds = [];
        } catch {
          meds = [];
        }

        prescription = {
          id: p.id,
          patientId: pat.id,
          patientName: pat.name,
          patientAge: pat.age,
          patientGender: pat.gender,
          patientPhone: pat.phone,
          imageUrl: p.imageUrl,
          rawOcr: p.rawOcr,
          correctedText: p.correctedText,
          aiSummary: p.aiSummary,
          medicines: meds,
          doctorNotes: p.doctorNotes || "",
          tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
          important: p.important,
          confidence: p.important ? "Good" : "Excellent",
          status: p.important ? "Important" : "Processed",
          createdAt: p.createdAt.toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn("Using sample prescription detail:", err);
  }

  const pdfData = {
    id: prescription.id,
    patientName: prescription.patientName,
    patientAge: prescription.patientAge,
    patientGender: prescription.patientGender,
    patientPhone: prescription.patientPhone,
    createdAt: new Date(prescription.createdAt),
    summary: prescription.aiSummary,
    medicines: prescription.medicines,
    doctorNotes: prescription.doctorNotes,
    tags: prescription.tags,
    important: prescription.important,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <Link href={`/patients/${prescription.patientId}`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Prescription Record
              </h2>
              {prescription.important && (
                <Badge className="bg-amber-50 text-amber-700 border-amber-300 text-[0.65rem] font-semibold gap-1">
                  <Star className="h-3 w-3 fill-amber-500" /> Priority
                </Badge>
              )}
            </div>
            <p
              suppressHydrationWarning
              className="text-xs text-slate-500 font-mono mt-0.5"
            >
              Patient: {prescription.patientName} ({prescription.patientAge}y, {prescription.patientGender}) • Filed:{" "}
              {new Date(prescription.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <DownloadPdfButton data={pdfData} />
        </div>
      </div>

      {/* Two-Column Medical Record Interface */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Original Prescription Document & Raw OCR (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl border-slate-200 bg-white overflow-hidden shadow-xs">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileImage className="h-4 w-4 text-sky-600" />
                Original Document
              </CardTitle>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[0.62rem]"
              >
                Verified Record
              </Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="relative aspect-3/4 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2 shadow-2xs">
                {prescription.imageUrl &&
                (prescription.imageUrl.startsWith("data:image") ||
                  prescription.imageUrl.startsWith("http")) &&
                prescription.imageUrl !== "placeholder-image-url" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={prescription.imageUrl}
                    alt="Prescription Document"
                    className="object-contain w-full h-full rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
                    <Stethoscope className="h-10 w-10 text-sky-600" />
                    <p className="font-semibold text-xs text-slate-700">
                      Voice Dictated Prescription
                    </p>
                    <p className="text-[0.68rem] text-slate-400 max-w-xs">
                      Recorded and transcribed directly via Gemini Clinical Speech-to-Rx AI.
                    </p>
                  </div>
                )}
              </div>

              {/* Raw OCR Text Transcript */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-slate-400" />
                  Raw OCR / Transcript
                </Label>
                <div className="p-3 bg-slate-50 rounded-xl font-mono text-xs text-slate-600 max-h-48 overflow-y-auto whitespace-pre-wrap border border-slate-200">
                  {prescription.rawOcr || "Raw text transcription not available."}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Structured Medical Information (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="rounded-2xl border-slate-200/90 bg-white shadow-xs">
            <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-sky-600" />
                  Verified Clinical Data
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Structured diagnoses, medications, and physician advice
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-[0.65rem] bg-sky-50 text-sky-700 border-sky-200 font-mono"
              >
                Confidence: {prescription.confidence}
              </Badge>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Diagnosis & Summary */}
              <div className="space-y-2">
                <Label className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
                  Diagnosis &amp; Clinical Summary
                </Label>
                <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200/70 text-slate-800 text-xs sm:text-sm leading-relaxed font-medium">
                  {prescription.aiSummary || "No summary provided."}
                </div>
              </div>

              {/* Prescribed Medicines Structured Table */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <Label className="font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-sky-600" />
                  Prescribed Medicines ({prescription.medicines.length})
                </Label>

                {prescription.medicines.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[0.68rem] uppercase tracking-wider text-slate-500 font-semibold">
                        <tr>
                          <th className="py-2.5 px-4">Medicine Name</th>
                          <th className="py-2.5 px-3">Dosage</th>
                          <th className="py-2.5 px-4">Frequency &amp; Regimen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {prescription.medicines.map((med, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {med.name}
                            </td>
                            <td className="py-3 px-3 font-mono text-xs text-slate-600">
                              {med.dosage}
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-xs">
                              {med.frequency}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No medicines listed in this prescription.</p>
                )}
              </div>

              {/* Full Corrected Transcript */}
              {prescription.correctedText && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <Label className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
                    Corrected Prescription Text
                  </Label>
                  <div className="p-3.5 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap border border-slate-200">
                    {prescription.correctedText}
                  </div>
                </div>
              )}

              {/* Doctor's Notes */}
              {prescription.doctorNotes && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <Label className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
                    Doctor&apos;s Advice &amp; Notes
                  </Label>
                  <div className="p-3.5 bg-amber-50/50 rounded-xl text-xs sm:text-sm text-slate-800 border border-amber-200/80 leading-relaxed">
                    {prescription.doctorNotes}
                  </div>
                </div>
              )}

              {/* Tags */}
              {prescription.tags.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <Label className="font-semibold text-xs text-slate-500 uppercase tracking-wider">
                    Prescription Tags
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {prescription.tags.map((tag, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-0.5 rounded-lg border border-slate-200"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Language Converter Panel */}
      <PrescriptionTranslatorPanel
        rawOcr={prescription.rawOcr}
        correctedText={prescription.correctedText}
        aiSummary={prescription.aiSummary}
        doctorNotes={prescription.doctorNotes}
      />
    </div>
  );
}
