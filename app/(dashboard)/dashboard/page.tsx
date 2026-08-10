import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { db } from "@/db";
import { patients, prescriptions } from "@/db/schema";
import { count } from "drizzle-orm";

export default async function DashboardPage() {
  let patientCount = 0;
  let prescriptionCount = 0;

  try {
    if (process.env.DATABASE_URL) {
      const [patientsRes] = await db.select({ count: count() }).from(patients);
      const [prescriptionsRes] = await db.select({ count: count() }).from(prescriptions);
      patientCount = patientsRes.count;
      prescriptionCount = prescriptionsRes.count;
    }
  } catch (error) {
    console.error("Database connection failed:", error);
    // Fallback to 0 if database is not connected
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1 text-[0.72rem] uppercase tracking-[0.16em]">
            Patient records &amp; digitized prescriptions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/patients/new">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Patient
            </Button>
          </Link>
          <Link href="/upload">
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Prescription
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
          <div className="absolute top-0 left-0 h-full w-1 bg-stamp"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Total Patients
            </CardTitle>
            <div className="h-8 w-8 rounded-[4px] bg-stamp/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-stamp" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground tabular-nums">{patientCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered in the clinic</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
          <div className="absolute top-0 left-0 h-full w-1 bg-rxred"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Total Prescriptions
            </CardTitle>
            <div className="h-8 w-8 rounded-[4px] bg-rxred/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-rxred" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground tabular-nums">{prescriptionCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Digitized records</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="border-b border-ink/10 bg-muted/30">
            <CardTitle className="text-base text-foreground">Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-[4px] bg-muted flex items-center justify-center mb-4 border border-dashed border-ink/20">
                <FileText className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <p className="text-foreground font-medium text-lg">No recent uploads</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Stop retyping prescriptions by hand. Upload one to start digitizing your records.
              </p>
              <Link href="/upload" className="mt-6">
                <Button variant="outline" className="rounded-full px-6">Upload Now</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader className="border-b border-ink/10 bg-muted/30">
            <CardTitle className="text-base text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Link href="/upload" className="block w-full group">
              <div className="flex items-center p-4 border border-ink/10 rounded-[4px] bg-paper/60 transition-all duration-200 hover:border-primary/40 group-hover:-translate-y-0.5">
                <div className="h-11 w-11 rounded-[4px] bg-primary/10 flex items-center justify-center mr-4">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Upload Prescription</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">Scan a record and read it back as clean text</p>
                </div>
              </div>
            </Link>
            <Link href="/patients" className="block w-full group">
              <div className="flex items-center p-4 border border-ink/10 rounded-[4px] bg-paper/60 transition-all duration-200 hover:border-primary/40 group-hover:-translate-y-0.5">
                <div className="h-11 w-11 rounded-[4px] bg-accent/10 flex items-center justify-center mr-4">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Manage Patients</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">View and edit patient records</p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
