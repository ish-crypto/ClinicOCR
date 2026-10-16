"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  Square,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Plus,
  Trash2,
  Stethoscope,
  Activity,
  Volume2,
  FileText,
  Star,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { processVoiceDictationAction } from "@/app/actions/dictation";
import { savePrescription } from "@/app/actions/prescriptions";
import {
  ProcessedDictation,
  StructuredDictatedMedicine,
} from "@/lib/dictation/gemini";

type DictationStep = "RECORDING" | "PROCESSING" | "REVIEW";

interface VoiceDictationRecorderProps {
  patientId: string;
  patientName?: string;
}

// Global declaration for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface ISpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognitionInstance;
}

interface IWindow extends Window {
  SpeechRecognition?: ISpeechRecognitionConstructor;
  webkitSpeechRecognition?: ISpeechRecognitionConstructor;
  webkitAudioContext?: typeof AudioContext;
}

export function VoiceDictationRecorder({
  patientId,
  patientName,
}: VoiceDictationRecorderProps) {
  const router = useRouter();

  const [step, setStep] = useState<DictationStep>("RECORDING");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Review & Edit state
  const [aiData, setAiData] = useState<ProcessedDictation | null>(null);
  const [finalSummary, setFinalSummary] = useState("");
  const [finalText, setFinalText] = useState("");
  const [medicines, setMedicines] = useState<StructuredDictatedMedicine[]>([]);
  const [doctorAdvice, setDoctorAdvice] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Audio & Speech refs
  const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Speech Recognition & Audio Setup
  useEffect(() => {
    const win = typeof window !== "undefined" ? (window as unknown as IWindow) : null;
    const SpeechRecognition = win?.SpeechRecognition || win?.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentInterim = "";
        let finalChunk = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalChunk += result[0].transcript + " ";
          } else {
            currentInterim += result[0].transcript;
          }
        }

        if (finalChunk) {
          setTranscript((prev) => prev + finalChunk);
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          toast.error("Microphone access was denied. Please allow microphone permissions.");
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // Timer counter when recording
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  // Audio Visualizer Waveform Drawer
  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (!isRecording) return;
      animationFrameRef.current = requestAnimationFrame(render);
      analyserRef.current?.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / (bufferLength / 2)) * 2.2;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength / 2; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.9;

        // Clinical styled gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, "rgba(29, 95, 168, 0.4)");
        gradient.addColorStop(1, "rgba(29, 95, 168, 0.95)");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 1.5, Math.max(3, barHeight));

        x += barWidth;
      }
    };

    render();
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup audio analyzer for canvas visualizer
      const win = typeof window !== "undefined" ? (window as unknown as IWindow) : null;
      const AudioContextClass = window.AudioContext || win?.webkitAudioContext;
      if (!AudioContextClass) throw new Error("AudioContext is not supported on this browser.");
      const audioCtx = new AudioContextClass();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser.fftSize = 128;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      // MediaRecorder for playback blob
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(audioBlob));
      };

      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;

      // Start SpeechRecognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log("Recognition start info:", e);
        }
      }

      setIsRecording(true);
      setRecordingDuration(0);
      drawVisualizer();
      toast.info("Microphone is active. Speak your clinical notes naturally.");
    } catch (err) {
      console.error("Failed to access microphone:", err);
      toast.error("Unable to access microphone. Please check permissions or type your notes.");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleReset = () => {
    stopRecording();
    setTranscript("");
    setInterimTranscript("");
    setRecordingDuration(0);
    setAudioUrl(null);
  };

  const appendSamplePrompt = (sampleText: string) => {
    setTranscript((prev) => (prev ? prev + " " + sampleText : sampleText));
  };

  const processDictation = async () => {
    const fullText = (transcript + " " + interimTranscript).trim();
    if (!fullText) {
      toast.error("Please dictate or enter some clinical notes first.");
      return;
    }

    stopRecording();
    setStep("PROCESSING");

    try {
      const response = await processVoiceDictationAction(fullText);

      if (response.success && response.data) {
        setAiData(response.data);
        setFinalSummary(response.data.summary);
        setFinalText(response.data.corrected_text);
        setMedicines(response.data.medicines || []);
        setDoctorAdvice(response.data.doctor_advice || "");
        setStep("REVIEW");
        toast.success("Voice dictation successfully structured by AI!");
      } else {
        throw new Error(response.error || "Failed to process dictation with AI.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error processing voice dictation.";
      toast.error(msg);
      setStep("RECORDING");
    }
  };

  const handleAddMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      {
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);
  };

  const handleUpdateMedicine = (
    index: number,
    field: keyof StructuredDictatedMedicine,
    value: string
  ) => {
    setMedicines((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveToPatient = async () => {
    if (!patientId) {
      toast.error("Patient ID is missing.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await savePrescription({
        patientId,
        rawOcr: `[Voice Dictated Prescription]\n${transcript}`,
        correctedText: finalText,
        summary: finalSummary,
        medicines: medicines.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: `${m.frequency}${m.duration ? ` for ${m.duration}` : ""}${m.instructions ? ` (${m.instructions})` : ""}`,
        })),
        tags: aiData?.tags || ["Voice Entry"],
        important: isImportant,
        doctorNotes: doctorAdvice,
      });

      if (res.success) {
        toast.success("Prescription successfully saved to patient record!");
        router.push(`/patients/${patientId}`);
      } else {
        toast.error(res.error || "Failed to save prescription.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save prescription.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {step === "RECORDING" && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Voice Dictation Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                      <Mic className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Clinical Voice Dictation</CardTitle>
                      <CardDescription>
                        {patientName ? `Prescription for ${patientName}` : "Speak natural doctor notes & prescription orders"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={isRecording ? "destructive" : "secondary"}
                    className={`font-mono text-xs px-2.5 py-1 flex items-center gap-1.5 ${
                      isRecording ? "animate-pulse" : ""
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isRecording ? "bg-white" : "bg-muted-foreground/60"
                      }`}
                    />
                    {isRecording ? `RECORDING ${formatTimer(recordingDuration)}` : "MIC IDLE"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Audio Waveform Canvas */}
                <div className="h-24 w-full bg-paper rounded-lg border border-ink/10 flex flex-col items-center justify-center relative overflow-hidden p-2">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                  {!isRecording && !audioUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-paper/60 backdrop-blur-[1px] text-muted-foreground text-sm font-mono gap-2">
                      <Volume2 className="h-4 w-4" />
                      Press &quot;Start Dictation&quot; to begin speaking
                    </div>
                  )}
                </div>

                {/* Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg border border-ink/10">
                  <div className="flex items-center gap-3">
                    {!isRecording ? (
                      <Button
                        onClick={startRecording}
                        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                      >
                        <Mic className="h-4 w-4" />
                        Start Dictation
                      </Button>
                    ) : (
                      <Button
                        onClick={stopRecording}
                        variant="destructive"
                        className="gap-2 animate-pulse"
                      >
                        <Square className="h-4 w-4 fill-current" />
                        Stop Dictation
                      </Button>
                    )}

                    {(transcript || audioUrl) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <RotateCcw className="h-4 w-4 mr-1.5" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {audioUrl && !isRecording && (
                    <audio
                      src={audioUrl}
                      controls
                      className="h-9 max-w-55"
                    />
                  )}
                </div>

                {/* Spoken Live Transcript & Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-primary" />
                      Live Dictation Transcript (Spoken or Edited)
                    </Label>
                    <span className="text-xs text-muted-foreground font-mono">
                      {(transcript + (interimTranscript ? " " + interimTranscript : "")).length} characters
                    </span>
                  </div>

                  <div className="relative">
                    <Textarea
                      rows={7}
                      placeholder="Doctor's notes will transcribe here in real-time as you speak... You can also type or edit directly."
                      value={transcript + (interimTranscript ? " " + interimTranscript : "")}
                      onChange={(e) => {
                        setTranscript(e.target.value);
                        setInterimTranscript("");
                      }}
                      className="resize-none font-sans text-sm leading-relaxed p-3.5 bg-paper border-ink/20 focus-visible:ring-primary shadow-inner"
                    />
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Info className="h-4 w-4" />
                    Medical abbreviations like &quot;TID&quot;, &quot;SOS&quot;, &quot;BD&quot; will be automatically standardized.
                  </div>

                  <Button
                    onClick={processDictation}
                    disabled={!(transcript.trim() || interimTranscript.trim()) || isRecording}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-medium"
                  >
                    <Sparkles className="h-4 w-4" />
                    Structure Prescription with AI
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Voice Prompt Assistants & Guides */}
          <div className="space-y-5">
            <Card className="bg-paper/70 border-ink/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  Quick Dictation Templates
                </CardTitle>
                <CardDescription className="text-xs">
                  Click to insert starter clinical phrases or practice dictation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <button
                  type="button"
                  onClick={() =>
                    appendSamplePrompt(
                      "Patient has acute pharyngitis and fever for 2 days. Blood pressure is 120/80. Prescribe Amoxicillin 500mg TID for 7 days, Paracetamol 650mg SOS for fever, and advise warm saline gargles."
                    )
                  }
                  className="w-full text-left p-3 rounded-md bg-paper border border-ink/10 hover:border-primary/40 hover:bg-primary/5 transition text-xs space-y-1 block"
                >
                  <span className="font-semibold text-foreground flex items-center justify-between">
                    <span>Upper Respiratory / Throat Infection</span>
                    <Plus className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <p className="text-muted-foreground line-clamp-2 italic">
                    &quot;Acute pharyngitis... Amoxicillin 500mg TID, Paracetamol 650mg SOS...&quot;
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    appendSamplePrompt(
                      "Patient complaining of acid reflux, epigastric pain and indigestion. Prescribe Pantoprazole 40mg once daily before breakfast for 14 days, and Antacid gel 10ml after meals TID. Advise avoidance of spicy foods."
                    )
                  }
                  className="w-full text-left p-3 rounded-md bg-paper border border-ink/10 hover:border-primary/40 hover:bg-primary/5 transition text-xs space-y-1 block"
                >
                  <span className="font-semibold text-foreground flex items-center justify-between">
                    <span>Gastroenteritis / GERD</span>
                    <Plus className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <p className="text-muted-foreground line-clamp-2 italic">
                    &quot;Acid reflux... Pantoprazole 40mg OD before food, Antacid gel 10ml TID...&quot;
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    appendSamplePrompt(
                      "Patient with essential hypertension follow up. BP is 140/90 mmHg. Continue Telmisartan 40mg once daily in morning. Advise low salt diet and 30 minutes daily walking."
                    )
                  }
                  className="w-full text-left p-3 rounded-md bg-paper border border-ink/10 hover:border-primary/40 hover:bg-primary/5 transition text-xs space-y-1 block"
                >
                  <span className="font-semibold text-foreground flex items-center justify-between">
                    <span>Hypertension Follow-up</span>
                    <Plus className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <p className="text-muted-foreground line-clamp-2 italic">
                    &quot;BP 140/90... Telmisartan 40mg OD... low salt diet...&quot;
                  </p>
                </button>
              </CardContent>
            </Card>

            <Card className="bg-paper/40 border-ink/10">
              <CardContent className="p-4 space-y-2 text-xs text-muted-foreground">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-primary" />
                  Dictation Best Practices
                </div>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Speak clearly close to your microphone.</li>
                  <li>State medicine names, dosages, and frequencies naturally.</li>
                  <li>Mention vitals (e.g. &quot;BP 120 over 80, pulse 75&quot;).</li>
                  <li>Add patient dietary and follow-up advice at the end.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Processing Animation Step */}
      {step === "PROCESSING" && (
        <Card className="max-w-xl mx-auto border-primary/30 p-12 text-center bg-paper">
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="absolute -inset-1 rounded-full border border-primary/40 animate-ping opacity-25" />
            </div>
            <h3 className="text-xl font-bold font-heading">AI Structuring Dictation...</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Parsing medical entities, dosages, clinical frequencies, and diagnosis from your spoken notes.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review & Finalize Prescription Step */}
      {step === "REVIEW" && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Original Spoken Audio & Transcript */}
          <div className="space-y-5">
            <Card className="bg-paper/60 border-ink/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-primary" />
                    Spoken Dictation
                  </span>
                  {audioUrl && (
                    <audio src={audioUrl} controls className="h-7 w-36" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 bg-paper rounded-md font-mono text-xs text-ink/80 max-h-56 overflow-y-auto whitespace-pre-wrap border border-ink/10 shadow-inner">
                  {transcript || "Dictated notes recorded."}
                </div>

                {/* Vitals Summary Card if extracted */}
                {aiData?.vitals && (
                  <div className="space-y-2 pt-2 border-t border-ink/10">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-primary" />
                      Extracted Vitals
                    </Label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {aiData.vitals.bp && (
                        <div className="p-2 bg-paper rounded border border-ink/10">
                          <span className="text-muted-foreground block text-[0.65rem]">BP:</span>
                          <span className="font-semibold font-mono">{aiData.vitals.bp}</span>
                        </div>
                      )}
                      {aiData.vitals.pulse && (
                        <div className="p-2 bg-paper rounded border border-ink/10">
                          <span className="text-muted-foreground block text-[0.65rem]">Pulse:</span>
                          <span className="font-semibold font-mono">{aiData.vitals.pulse}</span>
                        </div>
                      )}
                      {aiData.vitals.temp && (
                        <div className="p-2 bg-paper rounded border border-ink/10">
                          <span className="text-muted-foreground block text-[0.65rem]">Temp:</span>
                          <span className="font-semibold font-mono">{aiData.vitals.temp}</span>
                        </div>
                      )}
                      {aiData.vitals.weight && (
                        <div className="p-2 bg-paper rounded border border-ink/10">
                          <span className="text-muted-foreground block text-[0.65rem]">Weight:</span>
                          <span className="font-semibold font-mono">{aiData.vitals.weight}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {aiData?.tags?.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[0.65rem]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Interactive Structured Prescription Editor */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-primary/25 shadow-md">
              <CardHeader className="pb-4 border-b border-ink/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">Structured Digital Prescription</CardTitle>
                      <CardDescription>Review and make any fine adjustments before saving</CardDescription>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsImportant(!isImportant)}
                    className={
                      "text-xs font-medium px-2.5 py-1 rounded border transition-colors flex items-center gap-1.5 " +
                      (isImportant
                        ? "text-rxred border-rxred/40 bg-rxred/10 font-semibold"
                        : "text-muted-foreground border-ink/15 hover:text-rxred hover:border-rxred/30")
                    }
                  >
                    <Star className={`h-3.5 w-3.5 ${isImportant ? "fill-current text-rxred" : ""}`} />
                    {isImportant ? "Marked High Priority" : "Mark Important"}
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Clinical Diagnosis & Summary */}
                <div className="space-y-2">
                  <Label className="font-semibold text-ink text-sm">Diagnosis &amp; Clinical Summary</Label>
                  <Textarea
                    rows={2}
                    value={finalSummary}
                    onChange={(e) => setFinalSummary(e.target.value)}
                    className="resize-none bg-paper font-medium text-sm"
                  />
                </div>

                {/* Full Clinical Note */}
                <div className="space-y-2">
                  <Label className="font-semibold text-ink text-sm">Consultation Notes &amp; Findings</Label>
                  <Textarea
                    rows={3}
                    value={finalText}
                    onChange={(e) => setFinalText(e.target.value)}
                    className="resize-none bg-paper text-sm"
                  />
                </div>

                {/* Prescribed Medicines (Dynamic Table Editor) */}
                <div className="space-y-3 pt-2 border-t border-ink/10">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-ink flex items-center gap-2 text-sm">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      Prescribed Medicines ({medicines.length})
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddMedicine}
                      className="h-8 gap-1 text-xs text-primary border-primary/30 hover:bg-primary/5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Medicine
                    </Button>
                  </div>

                  {medicines.length > 0 ? (
                    <div className="space-y-2.5">
                      {medicines.map((med, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-paper/70 rounded-md border border-ink/15 space-y-2 transition hover:border-primary/40"
                        >
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Medicine Name (e.g. Amoxicillin 500mg)"
                              value={med.name}
                              onChange={(e) => handleUpdateMedicine(idx, "name", e.target.value)}
                              className="font-semibold text-sm flex-1 bg-paper"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMedicine(idx)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <Input
                              placeholder="Dosage (e.g. 500mg / 1 tab)"
                              value={med.dosage}
                              onChange={(e) => handleUpdateMedicine(idx, "dosage", e.target.value)}
                              className="text-xs font-mono bg-paper"
                            />
                            <Input
                              placeholder="Frequency (e.g. 1-0-1 / TID)"
                              value={med.frequency}
                              onChange={(e) => handleUpdateMedicine(idx, "frequency", e.target.value)}
                              className="text-xs font-mono bg-paper"
                            />
                            <Input
                              placeholder="Duration (e.g. 5 days)"
                              value={med.duration || ""}
                              onChange={(e) => handleUpdateMedicine(idx, "duration", e.target.value)}
                              className="text-xs font-mono bg-paper"
                            />
                          </div>

                          <Input
                            placeholder="Special Instructions (e.g. After food with warm water)"
                            value={med.instructions || ""}
                            onChange={(e) => handleUpdateMedicine(idx, "instructions", e.target.value)}
                            className="text-xs bg-paper/50"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded border border-dashed border-ink/20 text-center text-xs text-muted-foreground">
                      No medicines prescribed yet. Click &quot;Add Medicine&quot; above to add one.
                    </div>
                  )}
                </div>

                {/* Doctor's Advice & Patient Instructions */}
                <div className="space-y-2 pt-2 border-t border-ink/10">
                  <Label className="font-semibold text-ink text-sm">
                    Doctor&apos;s Advice, Dietary Guidelines &amp; Follow-up
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="Dietary precautions, steam inhalation, return in 5 days if symptoms persist..."
                    value={doctorAdvice}
                    onChange={(e) => setDoctorAdvice(e.target.value)}
                    className="resize-none bg-paper text-sm"
                  />
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-ink/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("RECORDING")}
                    disabled={isSaving}
                  >
                    Re-dictate
                  </Button>

                  <Button
                    onClick={handleSaveToPatient}
                    disabled={isSaving || !patientId}
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isSaving ? "Saving to Record..." : "Save to Patient Record"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
