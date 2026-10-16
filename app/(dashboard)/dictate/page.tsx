import { VoiceDictationRecorder } from "@/components/dictation/voice-dictation-recorder";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Mic, ArrowLeft } from "lucide-react";
import { SAMPLE_PATIENTS } from "@/lib/sample-data";

export const dynamic = "force-dynamic";

export default async function DictatePage(props: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const patientId = searchParams.patientId;

  let patientList: { id: string; name: string; age: number; gender: string; phone: string }[] =
    SAMPLE_PATIENTS;
  let selectedPatient = null;

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const dbPatients = await db.select().from(patients);
      if (dbPatients.length > 0) {
        patientList = dbPatients;
      }
    }
  } catch (e) {
    console.warn("Using sample patients for voice dictate:", e);
  }

  if (patientId) {
    selectedPatient = patientList.find((p) => p.id === patientId) || {
      id: patientId,
      name: "Selected Patient",
      age: 35,
      gender: "Male",
      phone: "+91 98200 00000",
    };
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2.5">
            {patientId && (
              <Link href="/dictate">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Voice Dictation
            </h2>
            <span className="text-[0.68rem] font-mono font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              Speech-to-Rx AI
            </span>
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">
            {selectedPatient
              ? `Dictating clinical prescription for ${selectedPatient.name} (${selectedPatient.age}y, ${selectedPatient.gender})`
              : "Speak natural doctor notes and let Gemini Clinical AI structure medicines, dosages & advice"}
          </p>
        </div>

        {patientId && (
          <Link href="/dictate">
            <Button variant="outline" size="sm" className="rounded-xl text-xs">
              Change Patient
            </Button>
          </Link>
        )}
      </div>

      {/* Select Patient if not chosen */}
      {!patientId ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Select a patient to begin hands-free dictation:
            </p>
            <Link href="/patients/new">
              <Button size="sm" className="gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs">
                <Plus className="h-3.5 w-3.5" /> Register New Patient
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* New patient card */}
            <Link href="/patients/new">
              <Card className="rounded-2xl border-2 border-dashed border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/30 transition-all p-6 text-center flex flex-col items-center justify-center h-full group">
                <div className="h-11 w-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Plus className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">New Patient</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Register before dictating
                </p>
              </Card>
            </Link>

            {/* Existing patient cards */}
            {patientList.map((p) => (
              <Link href={`/dictate?patientId=${p.id}`} key={p.id}>
                <Card className="rounded-2xl border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm transition-all p-5 group cursor-pointer h-full">
                  <CardContent className="p-0 flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-sky-100 group-hover:text-sky-700 flex items-center justify-center font-bold text-sm shrink-0 transition-colors">
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                        {p.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {p.age}y • {p.gender}
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-xs text-sky-600 font-medium">
                        <Mic className="h-3 w-3" /> Dictate Rx
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <Suspense fallback={<div className="text-xs text-slate-500">Loading voice dictation recorder...</div>}>
          <VoiceDictationRecorder
            patientId={patientId}
            patientName={selectedPatient?.name}
          />
        </Suspense>
      )}
    </div>
  );
}
