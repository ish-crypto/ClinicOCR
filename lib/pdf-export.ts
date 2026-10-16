import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PrescriptionPdfData {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  createdAt: string | Date;
  summary: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
  }[];
  doctorNotes?: string | null;
  tags?: string[] | null;
  important?: boolean;
}

export function generatePrescriptionPdf(data: PrescriptionPdfData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const formattedDate = new Date(data.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Color Palette
  const primaryColor: [number, number, number] = [29, 95, 168]; // Medical Blue
  const darkTextColor: [number, number, number] = [35, 43, 54];
  const mutedTextColor: [number, number, number] = [100, 116, 139];
  const paperBgColor: [number, number, number] = [248, 249, 250];

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 28, "F");

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CLINIC OCR", 14, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Digital Prescription & Clinical Record", 14, 21);

  // Rx Symbol in top right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Rx", 185, 18);

  // Patient Demographic Card Background
  doc.setFillColor(...paperBgColor);
  doc.roundedRect(14, 34, 182, 32, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 34, 182, 32, 2, 2, "S");

  // Patient Info
  doc.setTextColor(...darkTextColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(data.patientName, 20, 43);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...mutedTextColor);
  doc.text(`Age / Gender: ${data.patientAge} yrs • ${data.patientGender.toUpperCase()}`, 20, 50);
  doc.text(`Phone: ${data.patientPhone}`, 20, 56);
  doc.text(`Prescription ID: ${data.id.slice(0, 8).toUpperCase()}`, 20, 62);

  doc.text(`Date: ${formattedDate}`, 140, 43);
  if (data.important) {
    doc.setTextColor(220, 38, 38);
    doc.setFont("helvetica", "bold");
    doc.text("★ PRIORITY RECORD", 140, 50);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedTextColor);
  }

  let cursorY = 74;

  // Clinical Summary Section
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("CLINICAL DIAGNOSIS & SUMMARY", 14, cursorY);
  cursorY += 2;

  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(14, cursorY, 196, cursorY);
  cursorY += 6;

  doc.setTextColor(...darkTextColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const splitSummary = doc.splitTextToSize(
    data.summary || "No specific diagnosis summary recorded.",
    182
  );
  doc.text(splitSummary, 14, cursorY);
  cursorY += splitSummary.length * 5 + 6;

  // Medicines Table
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("PRESCRIBED MEDICATIONS", 14, cursorY);
  cursorY += 2;

  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(14, cursorY, 196, cursorY);
  cursorY += 4;

  const tableBody =
    data.medicines && data.medicines.length > 0
      ? data.medicines.map((m, idx) => [
          `${idx + 1}.`,
          m.name,
          m.dosage || "-",
          m.frequency || "-",
        ])
      : [["-", "No medicines recorded", "-", "-"]];

  autoTable(doc, {
    startY: cursorY,
    head: [["#", "Medicine Name", "Dosage", "Frequency / Timing"]],
    body: tableBody,
    theme: "grid",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      textColor: darkTextColor,
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { fontStyle: "bold" },
      2: { cellWidth: 35 },
      3: { cellWidth: 45 },
    },
    margin: { left: 14, right: 14 },
  });

  // Calculate position after table
  const lastTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
  cursorY = (lastTable ? lastTable.finalY : cursorY + 30) + 10;

  // Doctor's Notes (if any)
  if (data.doctorNotes) {
    if (cursorY > 240) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DOCTOR'S INSTRUCTIONS & NOTES", 14, cursorY);
    cursorY += 2;

    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(14, cursorY, 196, cursorY);
    cursorY += 6;

    doc.setTextColor(...darkTextColor);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const splitNotes = doc.splitTextToSize(data.doctorNotes, 182);
    doc.text(splitNotes, 14, cursorY);
    cursorY += splitNotes.length * 5 + 8;
  }

  // Tags (if any)
  if (data.tags && data.tags.length > 0) {
    if (cursorY > 260) {
      doc.addPage();
      cursorY = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...mutedTextColor);
    doc.text(`Tags: ${data.tags.join(" • ")}`, 14, cursorY);
  }

  // Footer / Signature Section
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(140, pageHeight - 30, 196, pageHeight - 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...mutedTextColor);
  doc.text("Doctor / Authorized Signature", 145, pageHeight - 25);

  doc.text(
    "Digitized & verified via ClinicOCR • Confidential Medical Record",
    14,
    pageHeight - 12
  );

  // Trigger download
  const cleanPatientName = data.patientName.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`Prescription_${cleanPatientName}_${formattedDate}.pdf`);
}
