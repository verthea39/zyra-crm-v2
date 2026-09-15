"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, AlertTriangle, X } from "lucide-react";
import { parseQuickPasteText, type ParsedLineItem } from "@/lib/quickPasteParser";

const PLACEHOLDER = `Name: Company LLC
Offer letter 150
Medical 300
Visa stamping 550`;

export function QuickPasteDialog({
  open,
  onOpenChange,
  onInsert,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (items: ParsedLineItem[], clientName: string | null) => void;
}) {
  const [text, setText] = useState("");

  const parsed = useMemo(() => parseQuickPasteText(text), [text]);

  const handleClose = (o: boolean) => {
    if (!o) setText("");
    onOpenChange(o);
  };

  const handleInsert = () => {
    if (parsed.items.length === 0) return;
    onInsert(parsed.items, parsed.clientName);
    setText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] w-full h-[100dvh] sm:h-auto sm:max-h-[85vh] max-w-full m-0 p-0 sm:rounded-2xl rounded-none bg-white border-none shadow-2xl flex flex-col overflow-hidden">
        <DialogHeader className="bg-white border-b border-slate-200 p-5 sm:p-6 sm:rounded-t-2xl shrink-0 relative">
          <button onClick={() => handleClose(false)} className="absolute right-5 top-5 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-[#FDF8F0] border border-[#EADBC8] text-[#98682E] p-2.5 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">Smart Paste: Client & Line Items</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Paste a rough cost sheet or WhatsApp message -- we'll extract the client and line items.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 sm:px-6 flex flex-col gap-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={8}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#98682E] focus-visible:border-[#98682E]"
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Parsed Preview</p>
              {parsed.clientName && (
                <span className="text-xs font-semibold text-[#98682E]">Client: {parsed.clientName}</span>
              )}
            </div>

            {parsed.items.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-sm text-slate-400">
                Paste text above to see parsed items here.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-center w-16">Qty</th>
                      <th className="px-3 py-2 text-right w-28">Price (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsed.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-slate-800">{item.description}</td>
                        <td className="px-3 py-2 text-center text-slate-500">1</td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-800">{item.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {parsed.skippedLines.length > 0 && (
              <div className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Skipped {parsed.skippedLines.length} unparsed line{parsed.skippedLines.length > 1 ? "s" : ""}: "{parsed.skippedLines.join('", "')}"</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 sm:px-6 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0 pb-safe">
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={parsed.items.length === 0}
            onClick={handleInsert}
            className="bg-[#98682E] hover:bg-[#7D5321] text-white"
          >
            Insert Items into Form
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
