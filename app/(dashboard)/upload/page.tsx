import { PrescriptionUploader } from "@/components/upload/prescription-uploader";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Plus } from "lucide-react";

type Patient = InferSelectModel<typeof patients>;

export default async function UploadPage(props: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const patientId = searchParams.patientId;
  
  let patientList: Patient[] = [];
  try {
     if (process.env.DATABASE_URL) {
        patientList = await db.select().from(patients);
     }
  } catch (e) {
     console.error("DB error fetching patients for upload page", e);
  }

  if (!patientId && patientList.length === 0) {
    // No patients exist at all, redirect to create one
    redirect(`/patients/new`);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Upload Prescription</h2>
        <p className="text-muted-foreground mt-1 text-[0.72rem] uppercase tracking-[0.16em]">
          Digitize a handwritten prescription
        </p>
      </div>

      {!patientId ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
           <Card className="border-dashed bg-paper/50 flex flex-col items-center justify-center p-6 text-center transition-transform duration-200 hover:-translate-y-0.5">
             <div className="h-12 w-12 rounded-[4px] bg-primary/10 flex items-center justify-center mb-4">
               <Plus className="h-6 w-6 text-primary" />
             </div>
             <CardTitle className="text-lg">New Patient</CardTitle>
             <CardDescription className="mt-2 mb-4">Upload a prescription for a new patient</CardDescription>
             <Link href="/patients/new">
               <Button variant="outline">Create Patient</Button>
             </Link>
           </Card>
           
           {patientList.map((p) => (
             <Link href={`/upload?patientId=${p.id}`} key={p.id} className="block h-full">
               <Card className="hover:border-primary/40 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_1px_1.5px_rgb(35_43_54/0.06),0_18px_40px_-18px_rgb(35_43_54/0.35)] cursor-pointer h-full">
                 <CardContent className="p-6 flex flex-col items-center text-center">
                   <div className="h-12 w-12 rounded-[4px] bg-accent/10 flex items-center justify-center mb-4">
                     <User className="h-6 w-6 text-accent" />
                   </div>
                   <h3 className="font-semibold text-lg">{p.name}</h3>
                   <p className="text-sm text-muted-foreground mt-1 font-mono">{p.age} yrs • {p.gender}</p>
                   <p className="text-sm text-muted-foreground font-mono">{p.phone}</p>
                 </CardContent>
               </Card>
             </Link>
           ))}
        </div>
      ) : (
        <Suspense fallback={<div>Loading Uploader...</div>}>
           <PrescriptionUploader patientId={patientId} />
        </Suspense>
      )}
    </div>
  );
}
