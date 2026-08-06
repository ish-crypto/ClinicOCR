# ClinicOCR

ClinicOCR digitizes handwritten medical prescriptions. Upload a photo of a prescription, and the app extracts the raw text with OCR, then uses AI to correct errors, structure the medicines, and summarize the diagnosis — all linked to a patient record.

## Features

- **Patient management** — add, view, and manage patient records (name, age, gender, phone)
- **Prescription upload & OCR** — upload a photo of a handwritten prescription; text is extracted locally using Tesseract.js
- **AI-powered correction** — raw OCR output is cleaned up and structured by Gemini, which extracts:
  - Corrected full text
  - A short diagnosis/treatment summary
  - A list of medicines (name, dosage, frequency)
  - Important findings
  - Descriptive tags (e.g. "Fever", "Antibiotic", "Pediatric")
- **Dashboard** — overview of patients and recent prescriptions

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **UI:** React 19, Tailwind CSS 4, shadcn/ui, Base UI, Radix
- **Forms:** react-hook-form + Zod validation
- **Database:** [Neon](https://neon.tech) (serverless Postgres) via [Drizzle ORM](https://orm.drizzle.team)
- **OCR:** [Tesseract.js](https://tesseract.projectnaptha.com/)
- **AI:** Google Gemini (`@google/genai`) for OCR correction and structuring

## Prerequisites

- Node.js 18.18+ (Node 20+ recommended)
- A [Neon](https://neon.tech) account (free tier works) for the Postgres database
- A [Google AI Studio](https://aistudio.google.com/) API key for Gemini

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```bash
DATABASE_URL=postgres://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require
GEMINI_API_KEY=your-gemini-api-key
```

- `DATABASE_URL` — connection string from your Neon project dashboard
- `GEMINI_API_KEY` — API key from Google AI Studio

Without these, the app still runs, but patient/prescription actions return a "Database not configured" error and OCR correction will fail.

### 3. Push the database schema

```bash
npx drizzle-kit push
```

This creates the `patients` and `prescriptions` tables in your Neon database, based on `db/schema.ts`.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
  (dashboard)/
    dashboard/        # Overview page
    patients/         # Patient list, detail, and new-patient pages
    upload/           # Prescription upload flow
  actions/
    patients.ts        # Server actions: create/update/delete patients
    prescriptions.ts    # Server actions: prescription records
    ocr.ts               # Server action: runs OCR + Gemini pipeline
components/
  forms/               # Patient/prescription forms
  upload/               # Upload UI
  ui/                     # shadcn/ui components
db/
  schema.ts             # Drizzle schema (patients, prescriptions)
  index.ts                # Drizzle + Neon client setup
lib/
  ocr/
    tesseract.ts        # Tesseract.js OCR extraction
    gemini.ts             # Gemini correction/structuring
    preprocess.ts        # Image preprocessing before OCR
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server (Turbopack) |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

## Database Schema

- **patients** — `id`, `name`, `age`, `gender`, `phone`, `createdAt`
- **prescriptions** — `id`, `patientId` (FK → patients), `imageUrl`, `rawOcr`, `correctedText`, `aiSummary`, `medicinesJson`, `doctorNotes`, `tags`, `important`, `createdAt`

## Notes

- OCR runs client-side or server-side via Tesseract.js on the uploaded image, then the raw text is sent to Gemini for correction and structuring — Gemini is instructed not to hallucinate missing dosage/frequency info, and to prefix uncertain medicine names with "Possibly ".
- Make sure `.env` is listed in `.gitignore` so database and API credentials are never committed.
