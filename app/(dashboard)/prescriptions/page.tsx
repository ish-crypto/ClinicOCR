import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Upload,
  Search,
  Star,
  Clock,
  MoreVertical,
  CheckCircle2,
  ArrowRight,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { patients, prescriptions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SAMPLE_PRESCRIPTIONS,
  SamplePrescription,
} from "@/lib/sample-data";

export const dynamic = "force-dynamic";

export default async function PrescriptionsPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams.q?.toLowerCase() || "";

  let list: SamplePrescription[] = SAMPLE_PRESCRIPTIONS;

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const dbRows = await db
        .select({
          prescription: prescriptions,
          patient: patients,
        })
        .from(prescriptions)
        .innerJoin(patients, eq(prescriptions.patientId, patients.id))
        .orderBy(desc(prescriptions.important), desc(prescriptions.createdAt));

      if (dbRows.length > 0) {
        list = dbRows.map(({ prescription: p, patient: pat }) => {
          let meds = [];
          try {
            meds =
              typeof p.medicinesJson === "string"
                ? JSON.parse(p.medicinesJson)
                : p.medicinesJson;
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
      }
    }
  } catch (err) {
    console.warn("Using sample prescriptions:", err);
  }

  if (q) {
    list = list.filter(
      (item) =>
        item.patientName.toLowerCase().includes(q) ||
        item.medicines.some((m) => m.name.toLowerCase().includes(q)) ||
        item.tags.some((t) => t.toLowerCase().includes(q)) ||
        item.aiSummary.toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Prescriptions Directory
            </h2>
            <span className="text-[0.68rem] font-mono font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              {list.length} records
            </span>
          </div>
          <p className="text-slate-500 mt-1 text-sm">
            Review and search all digitized doctor prescriptions, medicines, and clinical summaries.
          </p>
        </div>

        <Link href="/upload">
          <Button className="gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-600/20 text-xs sm:text-sm font-medium h-9.5 px-4">
            <Upload className="h-4 w-4" />
            Upload Prescription
          </Button>
        </Link>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center gap-3">
        <form className="relative flex-1 max-w-md" action="/prescriptions">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search by patient, medicine (e.g. Augmentin), diagnosis..."
            className="w-full bg-white pl-9.5 h-10 border-slate-200 rounded-xl text-sm shadow-2xs focus-visible:ring-sky-500"
          />
        </form>
        {q && (
          <Link href="/prescriptions">
            <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-900">
              Clear filter
            </Button>
          </Link>
        )}
      </div>

      {/* Prescriptions List Card */}
      <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[0.68rem] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 px-5">Patient</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Diagnosis &amp; Medicines</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4">Tags</th>
                <th className="py-3.5 px-4 text-center">Priority</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-44 text-center py-10">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {q ? `No prescriptions matching "${q}"` : "No prescriptions digitized yet"}
                      </p>
                      <p className="text-xs text-slate-400 max-w-xs">
                        {q ? "Try searching with a different medicine name or diagnosis." : "Upload a handwritten prescription slip to get started."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                list.map((rx) => (
                  <tr
                    key={rx.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    {/* Patient Name */}
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

                    {/* Date */}
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-500 whitespace-nowrap" suppressHydrationWarning>
                      {new Date(rx.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Summary & Medicines */}
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="text-xs text-slate-700 font-medium truncate mb-1">
                        {rx.aiSummary}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {rx.medicines.map((m, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.65rem] font-medium bg-slate-100 text-slate-700 font-mono"
                          >
                            {m.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Confidence */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
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

                    {/* Tags */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {rx.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.62rem] font-medium bg-slate-50 text-slate-500 border border-slate-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 text-center">
                      {rx.important ? (
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500 inline-block" />
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/prescriptions/${rx.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg gap-1"
                        >
                          View <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
