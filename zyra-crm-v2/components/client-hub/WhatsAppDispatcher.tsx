"use client";

import { useState } from "react";
import { Send, FileSignature, FileText, Activity, CheckCircle, AlertTriangle, Receipt } from "lucide-react";
import { logWhatsAppDispatch } from "@/app/actions/client-hub";
import { toast } from "sonner";

const MILESTONES = [
  { id: "OFFER_LETTER", label: "Offer Letter Signed", icon: FileSignature, color: "bg-blue-100 text-blue-700" },
  { id: "ENTRY_PERMIT", label: "Entry Permit Issued", icon: FileText, color: "bg-purple-100 text-purple-700" },
  { id: "MEDICAL_PASSED", label: "Medical Fitness Passed", icon: Activity, color: "bg-emerald-100 text-emerald-700" },
  { id: "VISA_STAMPED", label: "Visa Stamped / EID", icon: CheckCircle, color: "bg-[#98682E]/20 text-[#98682E]" },
  { id: "RENEWAL_WARNING", label: "Renewal Warning", icon: AlertTriangle, color: "bg-amber-100 text-amber-700" },
  { id: "PAYMENT_RECEIPT", label: "Balance Statement", icon: Receipt, color: "bg-slate-200 text-slate-700" },
];

export function WhatsAppDispatcher({ cases }: { cases: any[] }) {
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  const handleDispatch = async (templateId: string, label: string) => {
    if (!selectedCase) {
      toast.error("Please select a case first");
      return;
    }

    const phone = selectedCase.client?.phone;
    if (!phone) {
      toast.error("Client has no phone number on record");
      return;
    }

    setLoadingId(templateId);

    // Build the dynamic message
    const baseUrl = window.location.origin;
    const trackingLink = `${baseUrl}/track/${selectedCase.trackingToken}`;
    
    let text = `Dear ${selectedCase.client?.name || 'Client'},\n\nGreetings from Zyra Documents Clearance Services.\n\n`;
    
    switch (templateId) {
      case "OFFER_LETTER":
        text += `We have successfully initiated your MOHRE application for ${selectedCase.serviceType}. Your offer letter is signed and submitted.\n`;
        break;
      case "ENTRY_PERMIT":
        text += `Good news! Your Entry Permit (e-Visa) has been issued for Case Ref: ${selectedCase.reference}.\n`;
        break;
      case "MEDICAL_PASSED":
        text += `Your Medical Fitness test has been passed successfully. We are now proceeding with the final visa stamping.\n`;
        break;
      case "VISA_STAMPED":
        text += `Congratulations! Your Residence Visa has been stamped and your Emirates ID is being processed. Your file (${selectedCase.reference}) is complete.\n`;
        break;
      case "RENEWAL_WARNING":
        text += `This is a courtesy reminder that your documents for ${selectedCase.serviceType} are due for renewal soon. Please let us know if you'd like our PRO team to assist.\n`;
        break;
      case "PAYMENT_RECEIPT":
        text += `This is an update regarding your balance for Case Ref: ${selectedCase.reference}. Please check your portal for the latest statement.\n`;
        break;
    }

    text += `\nYou can track your live application status and download approved documents securely here:\n${trackingLink}\n\nBest Regards,\nZyra Operations Team, Dubai`;

    // Log the dispatch
    const res = await logWhatsAppDispatch(selectedCase.id, selectedCase.clientId, label, phone);
    setLoadingId(null);

    if (res.success) {
      toast.success("Dispatch logged, opening WhatsApp...");
      const cleanPhone = phone.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="bg-white  border  rounded-xl flex flex-col h-full overflow-hidden shadow-sm">
      <div className="p-6 border-b ">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">1. Select Active Case to Notify</label>
        <select
          value={selectedCaseId}
          onChange={(e) => setSelectedCaseId(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50  border border-slate-200  focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg outline-none transition-all appearance-none text-slate-900 "
        >
          <option value="">-- Select a Client Case --</option>
          {cases.map(c => (
            <option key={c.id} value={c.id}>
              {c.client?.name} • {c.reference} ({c.serviceType})
            </option>
          ))}
        </select>
        
        {selectedCase && (
          <div className="mt-4 p-4 bg-slate-50  rounded-lg border border-slate-100 ">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-slate-700 ">Recipient Phone: <span className="font-mono text-slate-900 ">{selectedCase.client?.phone || "NO PHONE ADDED"}</span></p>
                <p className="text-xs text-slate-500 mt-1">Assigned PRO: {selectedCase.coordinator?.name}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">2. Dispatch WhatsApp Milestone</label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MILESTONES.map(m => {
            const Icon = m.icon;
            const isLoading = loadingId === m.id;
            return (
              <button
                key={m.id}
                disabled={!selectedCase || isLoading}
                onClick={() => handleDispatch(m.id, m.label)}
                className={`p-4 rounded-xl border flex flex-col items-start gap-3 transition-all text-left ${
                  selectedCase 
                    ? 'border-slate-200  hover:border-[#25D366] hover:shadow-md bg-white  cursor-pointer group' 
                    : 'border-slate-100  bg-slate-50  opacity-60 cursor-not-allowed'
                }`}
              >
                <div className={`p-2.5 rounded-lg ${m.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="w-full">
                  <h3 className="font-bold text-slate-900  text-sm mb-1">{m.label}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">Sends automated `{m.label}` message with secure tracking link.</p>
                </div>
                <div className={`mt-auto pt-3 border-t w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider ${selectedCase ? 'text-[#25D366]' : 'text-slate-400'}`}>
                  {isLoading ? 'Sending...' : 'Dispatch Now'}
                  <Send className={`w-3 h-3 ${isLoading ? 'animate-pulse' : ''}`} />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
}
