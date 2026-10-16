"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { generatePrescriptionPdf, PrescriptionPdfData } from "@/lib/pdf-export";
import { toast } from "sonner";

interface DownloadPdfButtonProps {
  data: PrescriptionPdfData;
}

export function DownloadPdfButton({ data }: DownloadPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = () => {
    try {
      setIsGenerating(true);
      generatePrescriptionPdf(data);
      toast.success("Prescription PDF downloaded successfully!");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={isGenerating}
      className="gap-2 bg-paper hover:bg-muted border-ink/20 shadow-xs"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating PDF...</span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4 text-primary" />
          <span>Download Report (PDF)</span>
        </>
      )}
    </Button>
  );
}
