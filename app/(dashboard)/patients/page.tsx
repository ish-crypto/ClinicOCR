import { Button } from "@/components/ui/button";
import { Plus, Search, MoreVertical } from "lucide-react";
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
import { desc, InferSelectModel } from "drizzle-orm";

type Patient = InferSelectModel<typeof patients>;
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default async function PatientsPage(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const q = searchParams.q?.toLowerCase() || "";
  let allPatients: Patient[] = [];
  
  try {
    if (process.env.DATABASE_URL) {
      const all = await db.select().from(patients).orderBy(desc(patients.createdAt));
      allPatients = q 
        ? all.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q))
        : all;
    }
  } catch (error) {
    console.error("Failed to fetch patients:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Patients</h2>
          <p className="text-muted-foreground mt-1 text-[0.72rem] uppercase tracking-[0.16em]">
            Manage records &amp; prescription history
          </p>
        </div>
        <Link href="/patients/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Patient
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <form className="relative flex-1" action="/patients">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search patients..."
            className="w-full bg-paper pl-9 border-ink/20 shadow-[inset_0_1px_2px_rgb(35_43_54/0.06)]"
          />
        </form>
      </div>

      <div className="paper-sheet overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-ink/10">
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No patients found.
                </TableCell>
              </TableRow>
            ) : (
              allPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell className="capitalize">{patient.gender}</TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer">
                          <Link href={`/patients/${patient.id}`} className="w-full block">View History</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Link href={`/upload?patientId=${patient.id}`} className="w-full block">Upload Prescription</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                           <Link href={`/patients/${patient.id}/edit`} className="w-full block">Edit Patient</Link>
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
  );
}
