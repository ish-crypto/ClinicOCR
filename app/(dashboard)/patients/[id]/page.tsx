import { db } from "@/db";
import { patients, prescriptions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload, ArrowLeft, Star, FileText } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PatientDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  
  if (!process.env.DATABASE_URL) {
    return <div>Database not connected</div>;
  }

  const [patient] = await db.select().from(patients).where(eq(patients.id, params.id));
  
  if (!patient) {
    notFound();
  }

  const patientHistory = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.patientId, patient.id))
    .orderBy(desc(prescriptions.important), desc(prescriptions.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/patients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{patient.name}</h2>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            {patient.age} yrs • {patient.gender} • {patient.phone}
          </p>
        </div>
        <Link href={`/upload?patientId=${patient.id}`}>
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Prescription
          </Button>
        </Link>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Prescription History</h3>
        
        {patientHistory.length === 0 ? (
          <Card className="border-dashed bg-paper/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">No prescriptions yet</p>
              <p className="text-sm text-muted-foreground/80 mb-4">Upload a prescription to get started.</p>
              <Link href={`/upload?patientId=${patient.id}`}>
                <Button variant="outline">Upload First Prescription</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {patientHistory.map((prescription) => (
              <Card key={prescription.id} className="transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_1px_1.5px_rgb(35_43_54/0.06),0_18px_40px_-18px_rgb(35_43_54/0.35)]">
                {prescription.important && (
                  <div className="absolute top-3 right-3 text-rxred/80">
                    <Star className="h-5 w-5 fill-current" />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{new Date(prescription.createdAt).toLocaleDateString()}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm line-clamp-3 text-muted-foreground">
                    {prescription.aiSummary || "No summary available."}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    {Array.isArray(prescription.tags) && prescription.tags.map((tag: string, i) => (
                      <Badge key={i} variant="secondary" className="text-[0.6rem]">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Link href={`/prescriptions/${prescription.id}`} className="block mt-4">
                    <Button variant="outline" className="w-full text-primary border-primary/25 hover:bg-primary/5">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
