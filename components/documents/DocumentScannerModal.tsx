"use client";

import { useCallback, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScanLine, UploadCloud, Loader2, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { parseDocumentWithAI, type UniversalDocumentFields, type UniversalDocumentType } from "@/app/actions/universal-ocr";
import { recognizeText, parseDocumentText } from "@/lib/ocr/document-parser";

type ScannerStage = "idle" | "scanning" | "preview";

export type ScannerResult = UniversalDocumentFields & { fileDataUrl: string };

const TYPE_LABEL: Record<UniversalDocumentType, string> = {
  PASSPORT: "Passport",
  EMIRATES_ID: "Emirates ID",
  RESIDENCE_VISA: "UAE Residence Visa",
  TRADE_LICENSE: "Trade License",
  EJARI: "Ejari Tenancy Contract",
  ESTABLISHMENT_CARD: "MOHRE Establishment Card",
  LABOUR_CONTRACT: "Labour Contract",
  MEDICAL_FITNESS: "Medical Fitness Certificate",
  UNKNOWN: "Document",
};

function fileToBase64(file: File): Promise<{ base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] || "";
      resolve({ base64, dataUrl });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Local tesseract.js/mrz fallback if the Gemini call fails (no key, quota, network). */
async function runLocalFallback(file: File): Promise<UniversalDocumentFields> {
  const text = await recognizeText(file);
  const parsed = await parseDocumentText(text);
  return {
    documentType: parsed.kind === "EMIRATES_ID" || parsed.kind === "PASSPORT" ? parsed.kind : "UNKNOWN",
    fullName: parsed.fullName || null,
    documentNumber: parsed.documentNumber || null,
    expiryDate: parsed.expiryDate || null,
    dob: parsed.dob || null,
    nationality: parsed.nationality || null,
    companyName: null,
    sponsorName: null,
  };
}

export function DocumentScannerModal({
  open,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (result: ScannerResult) => void;
}) {
  const [stage, setStage] = useState<ScannerStage>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [fields, setFields] = useState<UniversalDocumentFields | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>("");
  const [usedFallback, setUsedFallback] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStage("idle");
    setFields(null);
    setFileDataUrl("");
    setUsedFallback(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a JPG or PNG image of the document");
      return;
    }

    setStage("scanning");

    try {
      const { base64, dataUrl } = await fileToBase64(file);
      setFileDataUrl(dataUrl);

      const aiResult = await parseDocumentWithAI(base64, file.type);

      let parsed: UniversalDocumentFields;
      if (aiResult.success) {
        parsed = aiResult.data;
        setUsedFallback(false);
      } else {
        console.warn("AI parse failed, falling back to local OCR:", aiResult.error);
        toast.error(`AI analysis unavailable (${aiResult.error}) -- using local scanner instead`);
        parsed = await runLocalFallback(file);
        setUsedFallback(true);
      }

      if (parsed.documentType === "UNKNOWN") {
        toast.error("Could not confidently identify this document. You can still edit fields manually below.");
      }

      setFields(parsed);
      setStage("preview");
    } catch (err) {
      console.error("Document scan failed:", err);
      toast.error("Failed to scan document. Please try a clearer photo.");
      setStage("idle");
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleApply = () => {
    if (!fields) return;
    onApply({ ...fields, fileDataUrl });
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-[#98682E]" />
            Scan Document (OCR)
          </DialogTitle>
          <DialogDescription>
            Upload a passport, Emirates ID, residence visa, trade license, or Ejari to auto-fill the form
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto overscroll-contain pt-2">
          {stage === "idle" && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors ${
                dragOver ? "border-[#98682E] bg-[#98682E]/5" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <UploadCloud className="w-10 h-10 text-slate-400" />
              <p className="text-sm font-medium text-slate-600">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-400">Any UAE identity or business document &mdash; JPG, PNG</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                  e.target.value = "";
                }}
              />
            </div>
          )}

          {stage === "scanning" && (
            <div className="flex flex-col items-center justify-center gap-3 py-14">
              <Loader2 className="w-8 h-8 text-[#98682E] animate-spin" />
              <p className="text-sm font-medium text-slate-600">AI analyzing document type & extracting metadata...</p>
            </div>
          )}

          {stage === "preview" && fields && (
            <div className="flex flex-col gap-4 pb-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                {usedFallback ? <CheckCircle2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                Detected: {TYPE_LABEL[fields.documentType]}
                {usedFallback && <span className="text-xs font-normal text-slate-400">(local scanner)</span>}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <EditableField label="Full Name" value={fields.fullName || ""} onChange={(v) => setFields({ ...fields, fullName: v })} />
                <EditableField label="Document Number" value={fields.documentNumber || ""} onChange={(v) => setFields({ ...fields, documentNumber: v })} />
                <EditableField label="Nationality" value={fields.nationality || ""} onChange={(v) => setFields({ ...fields, nationality: v })} />
                <div className="grid grid-cols-2 gap-3">
                  <EditableField label="Date of Birth" type="date" value={fields.dob || ""} onChange={(v) => setFields({ ...fields, dob: v })} />
                  <EditableField label="Expiry Date" type="date" value={fields.expiryDate || ""} onChange={(v) => setFields({ ...fields, expiryDate: v })} />
                </div>
                <EditableField label="Company Name" value={fields.companyName || ""} onChange={(v) => setFields({ ...fields, companyName: v })} />
                <EditableField label="Sponsor Name" value={fields.sponsorName || ""} onChange={(v) => setFields({ ...fields, sponsorName: v })} />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={reset}
                  className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  <RotateCcw className="w-4 h-4" /> Rescan
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 h-10 rounded-lg bg-[#98682E] text-white text-sm font-semibold hover:bg-[#98682E]/90"
                >
                  Apply to Form
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditableField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] outline-none text-sm"
        placeholder="Not detected -- enter manually"
      />
    </label>
  );
}
