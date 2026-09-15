"use client";

import { useState } from "react";
import { Send, FileSignature, FileText, Activity, CheckCircle, ClipboardCheck, Wallet, ShieldCheck, BadgeCheck } from "lucide-react";
import { logWhatsAppDispatch } from "@/app/actions/client-hub";
import { toast } from "sonner";

type Milestone = {
  id: string;
  label: string;
  icon: typeof FileSignature;
  color: string;
  message: (ctx: { clientName: string; reference: string; serviceType: string }) => string;
};

const VISA_MILESTONES: Milestone[] = [
  {
    id: "OFFER_LETTER",
    label: "Offer Letter Signed",
    icon: FileSignature,
    color: "bg-blue-100 text-blue-700",
    message: ({ serviceType }) =>
      `We have successfully initiated your MOHRE application for ${serviceType}. Your offer letter is signed and submitted.\n`,
  },
  {
    id: "ENTRY_PERMIT",
    label: "Entry Permit Issued",
    icon: FileText,
    color: "bg-purple-100 text-purple-700",
    message: ({ reference }) => `Good news! Your Entry Permit (e-Visa) has been issued for Case Ref: ${reference}.\n`,
  },
  {
    id: "MEDICAL_PASSED",
    label: "Medical Fitness Passed",
    icon: Activity,
    color: "bg-emerald-100 text-emerald-700",
    message: () => `Your Medical Fitness test has been passed successfully. We are now proceeding with the final visa stamping.\n`,
  },
  {
    id: "VISA_STAMPED",
    label: "Visa Stamped / EID",
    icon: CheckCircle,
    color: "bg-[#98682E]/20 text-[#98682E]",
    message: ({ reference }) =>
      `Congratulations! Your Residence Visa has been stamped and your Emirates ID is being processed. Your file (${reference}) is complete.\n`,
  },
];

const LICENSE_MILESTONES: Milestone[] = [
  {
    id: "EJARI_SUBMITTED",
    label: "Ejari / Lease Renewal Submitted",
    icon: ClipboardCheck,
    color: "bg-blue-100 text-blue-700",
    message: ({ clientName }) =>
      `Your Ejari / lease renewal has been submitted on behalf of ${clientName}. We will notify you once the payment voucher is issued.\n`,
  },
  {
    id: "PAYMENT_VOUCHER",
    label: "Payment Voucher Issued",
    icon: Wallet,
    color: "bg-amber-100 text-amber-700",
    message: ({ clientName, reference }) =>
      `A payment voucher has been issued by DED / the Freezone Authority for ${clientName}'s trade license renewal (Ref: ${reference}). Please arrange payment to proceed.\n`,
  },
  {
    id: "EXTERNAL_CLEARANCES",
    label: "External Clearances Approved",
    icon: ShieldCheck,
    color: "bg-purple-100 text-purple-700",
    message: ({ clientName }) =>
      `External clearances (Civil Defense / Municipality) for ${clientName} have been approved. Your trade license renewal is in its final stage.\n`,
  },
  {
    id: "LICENSE_RENEWED",
    label: "Trade License Renewed & Delivered",
    icon: BadgeCheck,
    color: "bg-emerald-100 text-emerald-700",
    message: ({ clientName, reference }) =>
      `Congratulations! ${clientName}'s trade license has been renewed and delivered. Your file (${reference}) is now complete.\n`,
  },
];

const LICENSE_KEYWORDS = ["license", "licence", "trade license", "business setup", "renewal"];

function getMilestonesForCase(serviceType: string | undefined): Milestone[] {
  const s = (serviceType || "").toLowerCase();
  // "Visa Renewal" contains "renewal" too, so exclude explicit visa/employment
  // service types before falling back to the renewal/license keyword match.
  const isVisaType = s.includes("visa") || s.includes("employment") || s.includes("permit");
  if (!isVisaType && LICENSE_KEYWORDS.some((k) => s.includes(k))) {
    return LICENSE_MILESTONES;
  }
  return VISA_MILESTONES;
}

export function WhatsAppDispatcher({ cases }: { cases: any[] }) {
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const selectedCase = cases.find(c => c.id === selectedCaseId);
  const milestones = getMilestonesForCase(selectedCase?.serviceType);

  const handleDispatch = async (milestone: Milestone) => {
    if (!selectedCase) {
      toast.error("Please select a case first");
      return;
    }

    const phone = selectedCase.client?.phone;
    if (!phone) {
      toast.error("Client has no phone number on record");
      return;
    }

    setLoadingId(milestone.id);

    const baseUrl = window.location.origin;
    const trackingLink = `${baseUrl}/track/${selectedCase.trackingToken}`;
    const clientName = selectedCase.client?.name || "Client";

    let text = `Dear ${clientName},\n\nGreetings from Zyra Documents Clearance Services.\n\n`;
    text += milestone.message({ clientName, reference: selectedCase.reference, serviceType: selectedCase.serviceType });
    text += `\nYou can track your live application status and download approved documents securely here:\n${trackingLink}\n\nBest Regards,\nZyra Operations Team, Dubai`;

    const res = await logWhatsAppDispatch(selectedCase.id, selectedCase.clientId, milestone.label, phone);
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
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          2. Dispatch WhatsApp Milestone
          {selectedCase && (
            <span className="ml-2 normal-case font-normal text-slate-400">
              ({milestones === LICENSE_MILESTONES ? "Trade License Renewal workflow" : "Visa / Employment workflow"})
            </span>
          )}
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {milestones.map(m => {
            const Icon = m.icon;
            const isLoading = loadingId === m.id;
            return (
              <button
                key={m.id}
                disabled={!selectedCase || isLoading}
                onClick={() => handleDispatch(m)}
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
