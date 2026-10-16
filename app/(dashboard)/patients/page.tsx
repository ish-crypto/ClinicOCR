import { Button } from "@/components/ui/button";
import { Plus, Search, MoreVertical, Mic, Upload, User, ArrowRight, Phone, Calendar } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { desc } from "drizzle-orm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_PATIENTS, SamplePatient } from "@/lib/sample-data";

export const dynamic = "force-dynamic";

export default async function PatientsPage(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const q = searchParams.q?.toLowerCase() || "";
  let allPatients: SamplePatient[] = SAMPLE_PATIENTS;
  
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const dbPatients = await db.select().from(patients).orderBy(desc(patients.createdAt));
      if (dbPatients.length > 0) {
        allPatients = dbPatients.map((p) => ({
          id: p.id,
          name: p.name,
          age: p.age,
          gender: p.gender,
          phone: p.phone,
          prescriptionsCount: 0,
          lastVisit: "Recently",
          createdAt: p.createdAt.toISOString(),
        }));
      }
    }
  } catch (error) {
    console.warn("Using sample patients:", error);
  }

  if (q) {
    allPatients = allPatients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.gender.toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Patients
            </h2>
            <span className="text-[0.68rem] font-mono font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              {allPatients.length} registered
            </span>
          </div>
          <p className="text-slate-500 mt-1 text-sm">
            Manage and review your clinic&apos;s patient records and prescription histories.
          </p>
        </div>

        <Link href="/patients/new">
          <Button className="gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-600/20 text-xs sm:text-sm font-semibold h-9.5 px-4">
            <Plus className="h-4 w-4" />
            Add Patient
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <form className="relative flex-1 max-w-md" action="/patients">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search patients by name or phone number..."
            className="w-full bg-white pl-9.5 h-10 border-slate-200 rounded-xl text-sm shadow-2xs focus-visible:ring-sky-500"
          />
        </form>
        {q && (
          <Link href="/patients">
            <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-900">
              Clear filter
            </Button>
          </Link>
        )}
      </div>

      {/* Patient Table Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-100">
              <TableRow className="border-slate-100">
                <TableHead className="min-w-50 text-xs font-semibold uppercase tracking-wider text-slate-400 py-3.5 px-5">
                  Patient Name
                </TableHead>
                <TableHead className="min-w-17.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Age
                </TableHead>
                <TableHead className="min-w-22.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Gender
                </TableHead>
                <TableHead className="min-w-35 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Phone
                </TableHead>
                <TableHead className="min-w-27.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Prescriptions
                </TableHead>
                <TableHead className="min-w-30 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Last Visit
                </TableHead>
                <TableHead className="text-right min-w-17.5 text-xs font-semibold uppercase tracking-wider text-slate-400 px-5">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {allPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <User className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {q ? `No patients matching "${q}"` : "No registered patients yet"}
                      </p>
                      <p className="text-xs text-slate-400 max-w-xs">
                        {q ? "Try searching with a different name or phone number." : "Add your first patient to start building digital records."}
                      </p>
                      {!q && (
                        <Link href="/patients/new" className="pt-2">
                          <Button size="sm" className="rounded-xl gap-1.5 bg-sky-600 hover:bg-sky-700 text-white">
                            <Plus className="h-3.5 w-3.5" />
                            Add Patient
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                allPatients.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Name & Avatar */}
                    <TableCell className="py-3 px-5">
                      <Link href={`/patients/${patient.id}`} className="flex items-center gap-3">
                        <div className="h-8.5 w-8.5 rounded-lg bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0 border border-sky-100">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900 group-hover:text-sky-700 transition-colors flex items-center gap-1.5">
                            {patient.name}
                            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          <p className="text-[0.68rem] text-slate-400 font-mono">
                            ID: {patient.id.slice(0, 8)}
                          </p>
                        </div>
                      </Link>
                    </TableCell>

                    {/* Age */}
                    <TableCell className="font-mono text-xs text-slate-600">
                      {patient.age} yrs
                    </TableCell>

                    {/* Gender */}
                    <TableCell>
                      <Badge variant="outline" className="text-[0.65rem] capitalize font-medium px-2 py-0.5 bg-slate-50 border-slate-200 text-slate-600">
                        {patient.gender}
                      </Badge>
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="font-mono text-xs text-slate-600">
                      {patient.phone}
                    </TableCell>

                    {/* Prescriptions count */}
                    <TableCell>
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-700">
                        {patient.prescriptionsCount} Rx
                      </span>
                    </TableCell>

                    {/* Last Visit */}
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {patient.lastVisit}
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="text-right px-5">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl">
                          <DropdownMenuItem className="cursor-pointer">
                            <Link href={`/patients/${patient.id}`} className="w-full block text-xs">
                              Patient Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Link href={`/upload?patientId=${patient.id}`} className="w-full block text-xs">
                              Upload Prescription
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Link href={`/dictate?patientId=${patient.id}`} className="w-full block text-xs">
                              Voice Dictation
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Link href={`/patients/${patient.id}/edit`} className="w-full block text-xs">
                              Edit Details
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
