"use client";

import { useState } from "react";
import { Languages, ArrowLeftRight, Loader2, Copy, Check, RotateCcw } from "lucide-react";
import { translateText, TranslationDirection } from "@/app/actions/translate";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface LanguageTranslatorProps {
  /** The source text to translate */
  sourceText: string;
  /** Optional compact mode for inline use */
  compact?: boolean;
  /** Additional className for container */
  className?: string;
}

export function LanguageTranslator({
  sourceText,
  compact = false,
  className = "",
}: LanguageTranslatorProps) {
  const [direction, setDirection] = useState<TranslationDirection>("en-to-hi");
  const [translated, setTranslated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const srcLabel = direction === "en-to-hi" ? "English" : "हिंदी";
  const tgtLabel = direction === "en-to-hi" ? "हिंदी" : "English";

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast.warning("No text available to translate.");
      return;
    }
    setIsLoading(true);
    setTranslated(null);
    try {
      const result = await translateText(sourceText, direction);
      if (result.success && result.translated) {
        setTranslated(result.translated);
      } else {
        toast.error(result.error || "Translation failed.");
      }
    } catch {
      toast.error("Translation service unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlipDirection = () => {
    setDirection((d) => (d === "en-to-hi" ? "hi-to-en" : "en-to-hi"));
    setTranslated(null);
  };

  const handleCopy = async () => {
    if (!translated) return;
    await navigator.clipboard.writeText(translated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    toast.success("Copied to clipboard");
  };

  const handleReset = () => {
    setTranslated(null);
  };

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs ${className}`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Languages className="h-3.5 w-3.5 text-sky-600" />
          <span>Language Converter</span>
        </div>

        {/* Direction Toggle */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setDirection("en-to-hi");
                setTranslated(null);
              }}
              className={`px-2.5 py-1 rounded-md text-[0.68rem] font-semibold transition-all ${
                direction === "en-to-hi"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              EN → हि
            </button>
            <button
              type="button"
              onClick={() => {
                setDirection("hi-to-en");
                setTranslated(null);
              }}
              className={`px-2.5 py-1 rounded-md text-[0.68rem] font-semibold transition-all ${
                direction === "hi-to-en"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              हि → EN
            </button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleFlipDirection}
            title="Swap direction"
            className="h-7 w-7 rounded-lg text-slate-400 hover:text-sky-600"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={`p-3.5 space-y-3 ${compact ? "text-xs" : "text-sm"}`}>
        {/* Source Language Label */}
        <div className="flex items-center justify-between">
          <span className="text-[0.68rem] font-semibold text-slate-400 uppercase tracking-wider">
            Source: {srcLabel}
          </span>
          <span className="text-[0.68rem] text-slate-400 font-mono">
            {sourceText.length} chars
          </span>
        </div>

        {/* Source Text Preview */}
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 max-h-28 overflow-y-auto">
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-mono">
            {sourceText.trim() || (
              <span className="italic text-slate-400">No source text available.</span>
            )}
          </p>
        </div>

        {/* Translate Button */}
        <Button
          type="button"
          onClick={handleTranslate}
          disabled={isLoading || !sourceText.trim()}
          className="w-full h-8 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-600/20 gap-1.5 disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Translating…
            </>
          ) : (
            <>
              <Languages className="h-3.5 w-3.5" />
              Translate to {tgtLabel}
            </>
          )}
        </Button>

        {/* Translation Output */}
        {translated && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] font-semibold text-sky-700 uppercase tracking-wider">
                {tgtLabel} Translation
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="h-6 w-6 rounded-md text-slate-400 hover:text-sky-600"
                  title="Copy translation"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  className="h-6 w-6 rounded-md text-slate-400 hover:text-red-500"
                  title="Clear translation"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="p-2.5 bg-sky-50/60 rounded-lg border border-sky-200/80 max-h-36 overflow-y-auto">
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {translated}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
