import { db } from "@/db";
import { patients, prescriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, FileImage, Stethoscope } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

type Medicine = {
  name: string;
  dosage: string;
  frequency: string;
};

export default async function PrescriptionDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  if (!process.env.DATABASE_URL) {
    return <div>Database not connected</div>;
  }

  const [prescription] = await db
    .select({
      prescription: prescriptions,
      patient: patients,
    })
    .from(prescriptions)
    .innerJoin(patients, eq(prescriptions.patientId, patients.id))
    .where(eq(prescriptions.id, params.id));

  if (!prescription) {
    notFound();
  }

  const p = prescription.prescription;
  const patient = prescription.patient;
  
  // Ensure we safely parse medicines if it's a string from db
  let medicines: Medicine[] = [];
  try {
    medicines = typeof p.medicinesJson === 'string' ? JSON.parse(p.medicinesJson) : p.medicinesJson;
    if (!Array.isArray(medicines)) medicines = [];
  } catch {
    medicines = [];
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/patients/${patient.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">Prescription Details</h2>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            For {patient.name} • Saved on {new Date(p.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mt-8">
        <div className="space-y-6">
          <Card>
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                 <FileImage className="h-5 w-5" />
                 Original Document
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="relative aspect-[3/4] w-full bg-muted/40 rounded-[4px] border border-ink/10 flex items-center justify-center overflow-hidden">
                  <p className="text-muted-foreground italic text-sm p-4 text-center">
                    Original image viewing not implemented for MVP.
                  </p>
               </div>
               
               <div className="space-y-2">
                 <Label className="text-muted-foreground">Raw OCR Extraction</Label>
                 <div className="p-4 bg-paper rounded-[4px] font-mono text-xs text-ink/80 max-h-60 overflow-y-auto whitespace-pre-wrap border border-ink/10 shadow-[inset_0_1px_2px_rgb(35_43_54/0.05)]">
                   {p.rawOcr || "No raw text available."}
                 </div>
               </div>
             </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/25 shadow-[0_1px_1.5px_rgb(35_43_54/0.06),0_18px_40px_-18px_rgb(29_95_168/0.28)]">
            <CardContent className="p-6 space-y-6">
               <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                     <CheckCircle className="h-5 w-5 text-primary" />
                     Processed Information
                  </h3>
                  {p.important && (
                    <Badge variant="destructive">Important</Badge>
                  )}
               </div>

               <div className="space-y-4">
                 <div className="space-y-2">
                   <Label className="font-semibold text-ink">Diagnosis &amp; Summary</Label>
                   <p className="text-ink/80 leading-relaxed bg-primary/[0.05] p-4 rounded-[4px] border border-primary/15">
                     {p.aiSummary || "No summary provided."}
                   </p>
                 </div>

                 <div className="space-y-3 pt-2">
                    <Label className="font-semibold text-ink flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Prescribed Medicines
                    </Label>
                    {medicines.length > 0 ? (
                      <div className="border border-ink/10 rounded-[4px] overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40 border-b border-ink/10">
                            <tr>
                              <th className="text-left py-2 px-3 font-semibold text-muted-foreground text-[0.68rem] uppercase tracking-[0.12em]">Medicine</th>
                              <th className="text-left py-2 px-3 font-semibold text-muted-foreground text-[0.68rem] uppercase tracking-[0.12em]">Dosage</th>
                              <th className="text-left py-2 px-3 font-semibold text-muted-foreground text-[0.68rem] uppercase tracking-[0.12em]">Frequency</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ink/10">
                            {medicines.map((med: Medicine, i: number) => (
                              <tr key={i} className="bg-card hover:bg-primary/[0.045]">
                                <td className="py-2 px-3 font-medium">{med.name}</td>
                                <td className="py-2 px-3 text-ink/70 font-mono">{med.dosage}</td>
                                <td className="py-2 px-3 text-ink/70 font-mono">{med.frequency}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No medicines listed in this prescription.</p>
                    )}
                 </div>
                 
                 {p.doctorNotes && (
                   <div className="space-y-2 pt-2">
                      <Label className="font-semibold text-ink">Doctor&apos;s Additional Notes</Label>
                     <p className="text-ink/80 bg-rxred/[0.05] p-4 rounded-[4px] text-sm border border-rxred/15">
                       {p.doctorNotes}
                     </p>
                   </div>
                 )}

                 <div className="pt-4 flex flex-wrap gap-2">
                   {Array.isArray(p.tags) && p.tags.map((tag: string, i: number) => (
                     <Badge key={i} variant="outline" className="bg-paper text-muted-foreground border-ink/15">
                       {tag}
                     </Badge>
                   ))}
                 </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
