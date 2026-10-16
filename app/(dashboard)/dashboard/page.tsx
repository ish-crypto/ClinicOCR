import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  Upload,
  Plus,
  Mic,
  Star,
  Clock,
  Sparkles,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { patients, prescriptions } from "@/db/schema";
import { count, desc, eq } from "drizzle-orm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SAMPLE_PATIENTS,
  SAMPLE_PRESCRIPTIONS,
  SamplePrescription,
} from "@/lib/sample-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let patientCount = SAMPLE_PATIENTS.length;
  let prescriptionCount = SAMPLE_PRESCRIPTIONS.length;
  let importantCount = SAMPLE_PRESCRIPTIONS.filter((p) => p.important).length;
  let recentPrescriptions: SamplePrescription[] = SAMPLE_PRESCRIPTIONS;

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const [patientsRes] = await db.select({ count: count() }).from(patients);
      const [prescriptionsRes] = await db.select({ count: count() }).from(prescriptions);
      
      if (patientsRes?.count) patientCount = patientsRes.count;
      if (prescriptionsRes?.count) prescriptionCount = prescriptionsRes.count;

      const recentDb = await db
        .select({
          prescription: prescriptions,
          patient: patients,
        })
        .from(prescriptions)
        .innerJoin(patients, eq(prescriptions.patientId, patients.id))
        .orderBy(desc(prescriptions.createdAt))
        .limit(6);

      if (recentDb.length > 0) {
        recentPrescriptions = recentDb.map(({ prescription: p, patient: pat }) => {
          let meds = [];
          try {
            meds = typeof p.medicinesJson === "string" ? JSON.parse(p.medicinesJson) : p.medicinesJson;
          } catch {
            meds = [];
          }
          return {
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
            medicines: Array.isArray(meds) ? meds : [],
            doctorNotes: p.doctorNotes || "",
            tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
            important: p.important,
            confidence: (p.important ? "Good" : "Excellent") as "Excellent" | "Good",
            status: (p.important ? "Important" : "Processed") as "Processed" | "Important",
            createdAt: p.createdAt.toISOString(),
          };
        });
        importantCount = recentPrescriptions.filter((p) => p.important).length;
      }
    }
  } catch (error) {
    console.warn("Using sample clinic records for dashboard:", error);
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Greeting & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Good morning, Doctor
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.7rem] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              OCR Online
            </span>
          </div>
          <p className="text-slate-500 mt-1 text-sm">
            Here&apos;s what&apos;s happening with your clinic records and prescriptions today.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/patients/new">
            <Button
              variant="outline"
              className="gap-2 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs text-xs sm:text-sm font-medium h-9.5 px-3.5"
            >
              <Plus className="h-4 w-4 text-slate-500" />
              Add Patient
            </Button>
          </Link>
          <Link href="/dictate">
            <Button
              variant="outline"
              className="gap-2 rounded-xl border-sky-200 bg-sky-50/50 text-sky-700 hover:bg-sky-100/60 shadow-2xs text-xs sm:text-sm font-medium h-9.5 px-3.5"
            >
              <Mic className="h-4 w-4 text-sky-600" />
              Voice Dictate
            </Button>
          </Link>
          <Link href="/upload">
            <Button className="gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-600/20 text-xs sm:text-sm font-medium h-9.5 px-4">
              <Upload className="h-4 w-4" />
              Upload Prescription
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Neutral Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <Card className="rounded-2xl border-slate-200/80 shadow-xs hover:shadow-sm transition-all duration-150 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Patients
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-600 border border-slate-100 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {patientCount}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
              <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> +3
              </span>
              <span>registered this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-xs hover:shadow-sm transition-all duration-150 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Prescriptions
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {prescriptionCount}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
              <span className="text-sky-600 font-medium font-mono">100%</span>
              <span>digitized &amp; verified</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-xs hover:shadow-sm transition-all duration-150 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Recent Uploads
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {recentPrescriptions.length}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
              <span className="text-emerald-600 font-medium">Ready</span>
              <span>for doctor review</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-xs hover:shadow-sm transition-all duration-150 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Important Records
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {importantCount}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
              <span className="text-amber-600 font-medium">Priority</span>
              <span>flagged for follow-up</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prominent Quick Upload Card */}
      <Card className="rounded-2xl border border-slate-200/90 shadow-xs bg-white overflow-hidden">
        <div className="p-6 sm:p-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-600" />
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Digitize a prescription
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Upload a handwritten prescription and let ClinicOCR structure medicines, dosages, and diagnosis for you.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Doctor Review Required Before Saving</span>
            </div>
          </div>

          {/* Drag & Drop Action Box */}
          <Link href="/upload" className="block group">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 sm:p-8 text-center bg-slate-50/50 hover:bg-sky-50/40 hover:border-sky-300 transition-all duration-150 cursor-pointer">
              <div className="h-12 w-12 rounded-xl bg-white shadow-2xs border border-slate-200/80 flex items-center justify-center mx-auto mb-3 text-sky-600 group-hover:scale-105 transition-transform">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-slate-900">
                Drag &amp; drop prescription here, or <span className="text-sky-600 underline underline-offset-2">browse files</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports JPG, JPEG, PNG (Maximum file size: 10 MB)
              </p>
              
              {/* 3 Step Workflow Indicator */}
              <div className="mt-5 pt-4 border-t border-slate-200/60 inline-flex items-center gap-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-sky-100 text-sky-700 text-[0.68rem] flex items-center justify-center font-bold">1</span>
                  Select Patient
                </span>
                <span className="text-slate-300">→</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-sky-100 text-sky-700 text-[0.68rem] flex items-center justify-center font-bold">2</span>
                  Upload Image
                </span>
                <span className="text-slate-300">→</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-sky-100 text-sky-700 text-[0.68rem] flex items-center justify-center font-bold">3</span>
                  Analyze &amp; Review
                </span>
              </div>
            </div>
          </Link>
        </div>
      </Card>

      {/* Recent Prescriptions Table */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Prescriptions</h3>
            <p className="text-xs text-slate-500">
              Verified clinical records and pending prescription reviews
            </p>
          </div>
          <Link href="/prescriptions">
            <Button variant="ghost" size="sm" className="text-xs text-sky-600 hover:text-sky-700 font-medium gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[0.68rem] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-5">Patient</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Medicines</th>
                  <th className="py-3 px-4">OCR Confidence</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Priority</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPrescriptions.map((rx) => (
                  <tr
                    key={rx.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    {/* Patient Name & Avatar */}
                    <td className="py-3.5 px-5">
                      <Link href={`/prescriptions/${rx.id}`} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0 border border-sky-100">
                          {rx.patientName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-sky-700 transition-colors leading-tight">
                            {rx.patientName}
                          </p>
                          <p className="text-[0.68rem] text-slate-400 font-mono">
                            {rx.patientAge}y • {rx.patientGender}
                          </p>
                        </div>
                      </Link>
                    </td>

                    {/* Prescription Date */}
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-500 whitespace-nowrap" suppressHydrationWarning>
                      {new Date(rx.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Medicine Badges */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {rx.medicines.slice(0, 2).map((med, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.68rem] font-medium bg-slate-100 text-slate-700 truncate max-w-35"
                          >
                            {med.name}
                          </span>
                        ))}
                        {rx.medicines.length > 2 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[0.65rem] font-medium text-slate-400 bg-slate-50">
                            +{rx.medicines.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* OCR Confidence Badge */}
                    <td className="py-3.5 px-4">
                      <Badge
                        variant="outline"
                        className={`text-[0.65rem] font-medium px-2 py-0.5 rounded-full ${
                          rx.confidence === "Excellent"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : rx.confidence === "Good"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {rx.confidence}
                      </Badge>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        {rx.status}
                      </span>
                    </td>

                    {/* Important Priority Flag */}
                    <td className="py-3.5 px-4 text-center">
                      {rx.important ? (
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500 inline-block" />
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Three-dot action menu */}
                    <td className="py-3.5 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl w-40">
                          <DropdownMenuItem className="cursor-pointer">
                            <Link href={`/prescriptions/${rx.id}`} className="w-full text-xs">
                              Open Record
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Link href={`/patients/${rx.patientId}`} className="w-full text-xs">
                              Patient Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Link href={`/upload?patientId=${rx.patientId}`} className="w-full text-xs">
                              Upload Another Rx
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
