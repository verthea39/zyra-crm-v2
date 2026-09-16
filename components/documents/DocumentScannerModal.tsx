"use client";

import { useCallback, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScanLine, UploadCloud, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { recognizeText, parseDocumentText, type ParsedDocumentFields } from "@/lib/ocr/document-parser";

type ScannerStage = "idle" | "scanning" | "preview";

export type ScannerResult = ParsedDocumentFields & { fileDataUrl: string };

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
  const [progressLabel, setProgressLabel] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fields, setFields] = useState<ParsedDocumentFields | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStage("idle");
    setProgressLabel("");
    setFields(null);
    setFileDataUrl("");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const readAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a JPG or PNG image of the document");
      return;
    }

    setStage("scanning");
    setProgressLabel("Reading file...");

    try {
      const dataUrl = await readAsDataUrl(file);
      setFileDataUrl(dataUrl);

      const text = await recognizeText(file, (status, progress) => {
        setProgressLabel(`${status.replace(/_/g, " ")}... ${Math.round(progress * 100)}%`);
      });

      setProgressLabel("Parsing extracted fields...");
      const parsed = await parseDocumentText(text);

      if (parsed.kind === "UNKNOWN") {
        toast.error("Could not detect an Emirates ID or Passport in this image. You can still edit fields manually below.");
      }

      setFields(parsed);
      setStage("preview");
    } catch (err) {
      console.error("OCR failed:", err);
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
            Upload an Emirates ID or Passport photo to auto-fill the form
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
              <p className="text-xs text-slate-400">Emirates ID or Passport photo &mdash; JPG, PNG</p>
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
              <p className="text-sm font-medium text-slate-600">Analyzing document with OCR engine...</p>
              <p className="text-xs text-slate-400">{progressLabel}</p>
            </div>
          )}

          {stage === "preview" && fields && (
            <div className="flex flex-col gap-4 pb-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                {fields.kind === "EMIRATES_ID" ? "Emirates ID detected" : fields.kind === "PASSPORT" ? "Passport detected" : "Document scanned"}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <EditableField label="Full Name" value={fields.fullName || ""} onChange={(v) => setFields({ ...fields, fullName: v })} />
                <EditableField
                  label={fields.kind === "PASSPORT" ? "Passport Number" : "Emirates ID Number"}
                  value={fields.documentNumber || ""}
                  onChange={(v) => setFields({ ...fields, documentNumber: v })}
                />
                <EditableField label="Nationality" value={fields.nationality || ""} onChange={(v) => setFields({ ...fields, nationality: v })} />
                <div className="grid grid-cols-2 gap-3">
                  <EditableField label="Date of Birth" type="date" value={fields.dob || ""} onChange={(v) => setFields({ ...fields, dob: v })} />
                  <EditableField label="Expiry Date" type="date" value={fields.expiryDate || ""} onChange={(v) => setFields({ ...fields, expiryDate: v })} />
                </div>
                {fields.kind === "PASSPORT" && (
                  <EditableField label="Sex" value={fields.sex || ""} onChange={(v) => setFields({ ...fields, sex: v })} />
                )}
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
