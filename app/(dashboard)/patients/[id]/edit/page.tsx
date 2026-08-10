import { PatientForm } from "@/components/forms/patient-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function EditPatientPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  if (!process.env.DATABASE_URL) {
    return <div>Database not connected</div>;
  }

  const [patient] = await db.select().from(patients).where(eq(patients.id, params.id));

  if (!patient) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/patients/${patient.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Patient</h2>
          <p className="text-muted-foreground mt-1 text-[0.72rem] uppercase tracking-[0.16em]">
            Update patient record
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
          <CardDescription>
            This information will be used to track prescription history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PatientForm patient={patient} />
        </CardContent>
      </Card>
    </div>
  );
}
