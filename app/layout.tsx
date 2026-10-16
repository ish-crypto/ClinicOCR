import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ClinicOCR — Medical Document Intelligence Platform",
  description: "AI-powered medical document intelligence platform for clinics and private doctors. Digitize handwritten prescriptions into structured patient records with Gemini AI and Tesseract OCR.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${plexMono.variable} font-sans h-full antialiased`}
    >
      <body suppressHydrationWarning className="h-full flex flex-col bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
