import { db } from "@/db";
import { patients, prescriptions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Upload, ArrowLeft, Star, FileText, Mic, Edit3, Plus, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_PATIENTS, SAMPLE_PRESCRIPTIONS, SamplePrescription } from "@/lib/sample-data";

export const dynamic = "force-dynamic";

export default async function PatientDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const patientId = params.id;

  let patient = SAMPLE_PATIENTS.find((p) => p.id === patientId) || {
    id: patientId,
    name: "Arjun Verma",
    age: 42,
    gender: "Male",
    phone: "+91 98234 11029",
    prescriptionsCount: 3,
    lastVisit: "Today, 10:30 AM",
    createdAt: "2026-09-15T08:30:00.000Z",
  };

  let patientHistory: SamplePrescription[] = SAMPLE_PRESCRIPTIONS.filter(
    (p) => p.patientId === patientId || p.patientName === patient.name
  );

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const [found] = await db.select().from(patients).where(eq(patients.id, patientId));
      if (found) {
        patient = {
          id: found.id,
          name: found.name,
          age: found.age,
          gender: found.gender,
          phone: found.phone,
          prescriptionsCount: 0,
          lastVisit: "Recently",
          createdAt: found.createdAt.toISOString(),
        };

        const dbHistory = await db
          .select()
          .from(prescriptions)
          .where(eq(prescriptions.patientId, found.id))
          .orderBy(desc(prescriptions.important), desc(prescriptions.createdAt));

        if (dbHistory.length > 0) {
          patientHistory = dbHistory.map((p) => {
            let meds = [];
            try {
              meds = typeof p.medicinesJson === "string" ? JSON.parse(p.medicinesJson) : p.medicinesJson;
            } catch {
              meds = [];
            }
            return {
              id: p.id,
              patientId: found.id,
              patientName: found.name,
              patientAge: found.age,
              patientGender: found.gender,
              patientPhone: found.phone,
              imageUrl: p.imageUrl,
              rawOcr: p.rawOcr,
              correctedText: p.correctedText,
              aiSummary: p.aiSummary,
              medicines: Array.isArray(meds) ? meds : [],
              doctorNotes: p.doctorNotes || "",
              tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
              important: p.important,
              confidence: (p.important ? "Good" : "Excellent") as "Excellent" | "Good",
              status: (p.important ? "Important" : "Processed") as "Processed" | "Important",
              createdAt: p.createdAt.toISOString(),
            };
          });
        }
      }
    }
  } catch (err) {
    console.warn("Using sample data for patient detail:", err);
  }

  return (
    <div className="space-y-7 max-w-6xl mx-auto">
      {/* Patient Profile Header Card */}
      <Card className="rounded-2xl border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <Link href="/patients">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-500 hover:text-slate-900">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="h-14 w-14 rounded-2xl bg-sky-50 text-sky-700 font-bold text-lg flex items-center justify-center shrink-0 border border-sky-100 shadow-2xs">
                {patient.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    {patient.name}
                  </h2>
                  <Badge variant="outline" className="text-[0.65rem] capitalize bg-slate-50 text-slate-600 border-slate-200">
                    {patient.gender}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Age: {patient.age} years • Contact: {patient.phone} • ID: {patient.id.slice(0, 8)}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link href={`/patients/${patient.id}/edit`}>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-9">
                  <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                  Edit Patient
                </Button>
              </Link>
              <Link href={`/dictate?patientId=${patient.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100/70 text-xs h-9">
                  <Mic className="h-3.5 w-3.5 text-sky-600" />
                  Voice Dictate
                </Button>
              </Link>
              <Link href={`/upload?patientId=${patient.id}`}>
                <Button size="sm" className="gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm text-xs h-9 px-3.5">
                  <Upload className="h-3.5 w-3.5" />
                  Upload Prescription
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Prescription History Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Prescription Timeline</h3>
            <p className="text-xs text-slate-500">
              Digitized medical records and doctor prescriptions in chronological order
            </p>
          </div>
          <Link href={`/upload?patientId=${patient.id}`}>
            <Button variant="ghost" size="sm" className="text-xs text-sky-600 gap-1 hover:bg-sky-50">
              <Plus className="h-3.5 w-3.5" /> Add Prescription
            </Button>
          </Link>
        </div>

        {patientHistory.length === 0 ? (
          <Card className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">No prescriptions digitized yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Upload a handwritten doctor slip or use voice dictation to generate this patient&apos;s first record.
            </p>
            <div className="flex justify-center gap-2">
              <Link href={`/upload?patientId=${patient.id}`}>
                <Button size="sm" className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> Upload Prescription
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {patientHistory.map((prescription) => (
              <Card
                key={prescription.id}
                className="rounded-2xl border-slate-200/90 bg-white hover:border-sky-300 hover:shadow-sm transition-all duration-150 relative overflow-hidden flex flex-col justify-between"
              >
                {prescription.important && (
                  <div className="absolute top-3.5 right-3.5 text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                )}
                
                <CardHeader className="pb-2 pt-5 px-5">
                  <div className="flex items-center gap-2">
                    <span
                      suppressHydrationWarning
                      className="text-xs font-mono font-semibold text-slate-900"
                    >
                      {new Date(prescription.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[0.62rem] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border-emerald-200"
                    >
                      Verified
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="px-5 pb-5 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {prescription.aiSummary || "Clinical prescription record."}
                  </p>

                  {/* Medicines preview pills */}
                  {prescription.medicines.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {prescription.medicines.map((m, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.65rem] font-mono font-medium bg-slate-100 text-slate-700"
                        >
                          {m.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {prescription.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {prescription.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[0.62rem] px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100">
                    <Link href={`/prescriptions/${prescription.id}`} className="block">
                      <Button
                        variant="outline"
                        className="w-full rounded-xl text-xs text-sky-700 border-sky-200 hover:bg-sky-50 font-medium justify-between"
                      >
                        <span>Open Complete Record</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
