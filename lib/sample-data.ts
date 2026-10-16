export interface SampleMedicine {
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  uncertain?: boolean;
}

export interface SamplePrescription {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  imageUrl: string;
  rawOcr: string;
  correctedText: string;
  aiSummary: string;
  medicines: SampleMedicine[];
  doctorNotes: string;
  importantFindings?: string;
  tags: string[];
  important: boolean;
  confidence: "Excellent" | "Good" | "Needs Review";
  status: "Processed" | "Needs Review" | "Important";
  createdAt: string;
}

export interface SamplePatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  prescriptionsCount: number;
  lastVisit: string;
  createdAt: string;
}

export const SAMPLE_PATIENTS: SamplePatient[] = [
  {
    id: "pat-101",
    name: "Arjun Verma",
    age: 42,
    gender: "Male",
    phone: "+91 98234 11029",
    prescriptionsCount: 3,
    lastVisit: "Today, 10:30 AM",
    createdAt: "2026-09-15T08:30:00.000Z",
  },
  {
    id: "pat-102",
    name: "Meera Krishnan",
    age: 29,
    gender: "Female",
    phone: "+91 97112 44901",
    prescriptionsCount: 2,
    lastVisit: "Yesterday",
    createdAt: "2026-09-20T11:15:00.000Z",
  },
  {
    id: "pat-103",
    name: "Rajesh Kulkarni",
    age: 58,
    gender: "Male",
    phone: "+91 98450 88219",
    prescriptionsCount: 4,
    lastVisit: "Sep 28, 2026",
    createdAt: "2026-08-10T09:00:00.000Z",
  },
  {
    id: "pat-104",
    name: "Priyanka Sen",
    age: 34,
    gender: "Female",
    phone: "+91 99201 55678",
    prescriptionsCount: 1,
    lastVisit: "Sep 25, 2026",
    createdAt: "2026-09-25T14:20:00.000Z",
  },
  {
    id: "pat-105",
    name: "Kabir Mehta",
    age: 8,
    gender: "Male",
    phone: "+91 98190 33412",
    prescriptionsCount: 2,
    lastVisit: "Sep 22, 2026",
    createdAt: "2026-09-12T16:45:00.000Z",
  },
  {
    id: "pat-106",
    name: "Sunita Deshmukh",
    age: 63,
    gender: "Female",
    phone: "+91 98670 99182",
    prescriptionsCount: 5,
    lastVisit: "Sep 18, 2026",
    createdAt: "2026-07-04T10:00:00.000Z",
  },
];

export const SAMPLE_PRESCRIPTIONS: SamplePrescription[] = [
  {
    id: "rx-901",
    patientId: "pat-101",
    patientName: "Arjun Verma",
    patientAge: 42,
    patientGender: "Male",
    patientPhone: "+91 98234 11029",
    imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800",
    rawOcr: "Rx\n1. Tab Amoxclav 625 TID x 5d\n2. Tab Dolo 650 SOS fever\n3. Syp Grilinctus 10ml TID\nDx: Acute Bronchitis\nAdvise: Warm fluids, avoid cold drinks",
    correctedText: "Rx\n1. Tab. Augmentin (Amoxicillin + Clavulanic Acid) 625mg — Three times a day (TID) after food for 5 days\n2. Tab. Dolo 650 (Paracetamol 650mg) — As needed (SOS) for fever > 100°F\n3. Syp. Grilinctus 10ml — Three times daily for 5 days\n\nDiagnosis: Acute Bronchitis with productive cough\nClinical Notes: Advised warm saline gargles, steam inhalation twice daily, plenty of warm oral fluids.",
    aiSummary: "Acute Bronchitis with fever and productive cough. Prescribed Augmentin 625mg TID, Dolo 650 SOS, and Grilinctus cough syrup for 5 days.",
    medicines: [
      { name: "Augmentin 625 (Amox-Clav)", dosage: "625 mg", frequency: "1-1-1 (TID after meals)", instructions: "Complete full 5-day antibiotic course" },
      { name: "Dolo 650 (Paracetamol)", dosage: "650 mg", frequency: "SOS (As needed)", instructions: "Max 3 tabs in 24 hours for fever" },
      { name: "Grilinctus Cough Syrup", dosage: "10 ml", frequency: "1-1-1 (TID)", instructions: "Take before bedtime" },
    ],
    doctorNotes: "Review in OPD after 5 days if cough persists or wheezing increases.",
    importantFindings: "Moderate wheezing on chest auscultation. SpO2: 98% on room air.",
    tags: ["Bronchitis", "Antibiotic", "Fever", "Respiratory"],
    important: true,
    confidence: "Excellent",
    status: "Processed",
    createdAt: "2026-10-01T05:00:00.000Z",
  },
  {
    id: "rx-902",
    patientId: "pat-102",
    patientName: "Meera Krishnan",
    patientAge: 29,
    patientGender: "Female",
    patientPhone: "+91 97112 44901",
    imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800",
    rawOcr: "Rx\n1. Pantocid 40 1 OD ac\n2. Mucaine gel 2 tsp tid pc\n3. Ganaton total 1 OD\nDx: GERD / Hyperacidity",
    correctedText: "Rx\n1. Tab. Pantocid 40mg (Pantoprazole) — Once daily (OD) 30 mins before breakfast for 14 days\n2. Syp. Mucaine Gel 10ml — Three times daily (TID) after meals for 7 days\n3. Cap. Ganaton Total — Once daily for 10 days\n\nDiagnosis: Gastroesophageal Reflux Disease (GERD) with epigastric burning.",
    aiSummary: "GERD with epigastric distress. Prescribed Pantocid 40mg OD before breakfast and Mucaine Gel TID.",
    medicines: [
      { name: "Pantocid 40 (Pantoprazole)", dosage: "40 mg", frequency: "1-0-0 (OD before food)", instructions: "Take 30 mins prior to breakfast" },
      { name: "Mucaine Gel", dosage: "10 ml", frequency: "1-1-1 (TID after meals)", instructions: "Do not drink water immediately after" },
      { name: "Ganaton Total", dosage: "Standard", frequency: "1-0-0 (OD)", instructions: "Take in morning" },
    ],
    doctorNotes: "Avoid spicy, oily foods and caffeine. Do not lie down immediately after dinner.",
    importantFindings: "Epigastric tenderness present on palpation. No alarming signs of GI bleeding.",
    tags: ["GERD", "Gastric", "Antacid"],
    important: false,
    confidence: "Excellent",
    status: "Processed",
    createdAt: "2026-09-30T10:30:00.000Z",
  },
  {
    id: "rx-903",
    patientId: "pat-103",
    patientName: "Rajesh Kulkarni",
    patientAge: 58,
    patientGender: "Male",
    patientPhone: "+91 98450 88219",
    imageUrl: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&q=80&w=800",
    rawOcr: "Rx\nTelma 40 1-0-0\nGlycomet GP1 1-0-1\nAtorva 10 0-0-1\nBP 142/90 FBS 134",
    correctedText: "Rx\n1. Tab. Telma 40mg (Telmisartan) — 1 tablet morning (1-0-0) after breakfast\n2. Tab. Glycomet GP1 (Metformin 500mg + Glimepiride 1mg) — Twice daily (1-0-1) before meals\n3. Tab. Atorva 10mg (Atorvastatin) — 1 tablet at bedtime (0-0-1)\n\nDiagnosis: Essential Hypertension & Type 2 Diabetes Mellitus follow-up.",
    aiSummary: "Routine chronic care review. Blood pressure 142/90 mmHg, Fasting Glucose 134 mg/dL. Maintained on Telma 40, Glycomet GP1, and Atorva 10.",
    medicines: [
      { name: "Telma 40 (Telmisartan)", dosage: "40 mg", frequency: "1-0-0 (Morning)", instructions: "Blood pressure management" },
      { name: "Glycomet GP 1", dosage: "500mg/1mg", frequency: "1-0-1 (BD before food)", instructions: "Take 15 mins before meals" },
      { name: "Atorva 10 (Atorvastatin)", dosage: "10 mg", frequency: "0-0-1 (Night)", instructions: "Cholesterol management" },
    ],
    doctorNotes: "HbA1c test and Lipid Profile ordered for next month visit. Low sodium diet.",
    importantFindings: "BP slightly elevated (142/90). Advised 30 min brisk walking 5 days/week.",
    tags: ["Hypertension", "Diabetes", "Cardiology", "Chronic"],
    important: true,
    confidence: "Good",
    status: "Important",
    createdAt: "2026-09-28T09:15:00.000Z",
  },
  {
    id: "rx-904",
    patientId: "pat-104",
    patientName: "Priyanka Sen",
    patientAge: 34,
    patientGender: "Female",
    patientPhone: "+91 99201 55678",
    imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800",
    rawOcr: "Rx\nLevocet M 1 hs\nOtrivin nasal spray 1 puff BD x 3d\nDx: Allergic Rhinitis",
    correctedText: "Rx\n1. Tab. Levocet-M (Levocetirizine 5mg + Montelukast 10mg) — 1 tablet at bedtime (0-0-1) for 10 days\n2. Otrivin Nasal Spray (Xylometazoline 0.1%) — 1 puff in each nostril twice daily for max 3 days\n\nDiagnosis: Acute Allergic Rhinitis with nasal congestion.",
    aiSummary: "Allergic Rhinitis with severe nasal congestion. Prescribed Levocet-M OD at bedtime and Otrivin nasal spray for 3 days.",
    medicines: [
      { name: "Levocet-M (Levocetirizine + Montelukast)", dosage: "5mg/10mg", frequency: "0-0-1 (Bedtime)", instructions: "May cause mild drowsiness" },
      { name: "Otrivin Nasal Spray", dosage: "1 puff each nostril", frequency: "1-0-1 (BD)", instructions: "Do NOT use for more than 3 consecutive days" },
    ],
    doctorNotes: "Avoid known dust allergens and cold exposure.",
    importantFindings: "Pale, edematous nasal turbinates on rhinoscopy.",
    tags: ["Allergy", "ENT", "Rhinitis"],
    important: false,
    confidence: "Good",
    status: "Processed",
    createdAt: "2026-09-25T14:20:00.000Z",
  },
  {
    id: "rx-905",
    patientId: "pat-105",
    patientName: "Kabir Mehta",
    patientAge: 8,
    patientGender: "Male",
    patientPhone: "+91 98190 33412",
    imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800",
    rawOcr: "Rx\nSyp Calpol 250 5ml SOS\nSyp Meftal P 5ml SOS >102\nSyp Ascoril D 2.5ml TID\nPediatric fever",
    correctedText: "Rx\n1. Syp. Calpol 250 (Paracetamol 250mg/5ml) — 5ml as needed (SOS) for fever > 100°F (gap 6h)\n2. Syp. Meftal-P (Mefenamic Acid 100mg/5ml) — 5ml SOS only if temperature > 102°F\n3. Syp. Ascoril-D Junior — 2.5ml three times daily (TID) for 4 days\n\nDiagnosis: Viral Upper Respiratory Tract Infection (Pediatric).",
    aiSummary: "Pediatric viral infection with high grade fever. Prescribed Calpol 250 SOS, Meftal-P for high fever, and Ascoril-D Junior for cough.",
    medicines: [
      { name: "Syp. Calpol 250", dosage: "5 ml", frequency: "SOS (Every 6h)", instructions: "For temperature > 100°F" },
      { name: "Syp. Meftal-P", dosage: "5 ml", frequency: "SOS (High fever)", instructions: "Only if temp > 102°F" },
      { name: "Syp. Ascoril-D Junior", dosage: "2.5 ml", frequency: "1-1-1 (TID)", instructions: "For dry cough" },
    ],
    doctorNotes: "Hydrate well with coconut water, juices. Sponge with lukewarm water during fever spikes.",
    importantFindings: "Weight: 24 kg. No signs of respiratory distress or chest indrawing.",
    tags: ["Pediatric", "Fever", "Viral"],
    important: true,
    confidence: "Excellent",
    status: "Processed",
    createdAt: "2026-09-22T16:45:00.000Z",
  },
];
