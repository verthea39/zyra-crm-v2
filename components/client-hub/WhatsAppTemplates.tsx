"use client";

import { MessageCircle, Link as LinkIcon, Copy, User } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export function WhatsAppTemplates({ cases }: { cases: any[] }) {

  const generateWhatsAppLink = (phone: string | null, message: string) => {
    if (!phone) return "#";
    // Strip non-numeric chars
    const cleanPhone = phone.replace(/\D/g, "");
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const copyTrackingLink = async (c: any) => {
    const trackingLink = `${window.location.origin}/track/${c.trackingToken}`;
    try {
      await navigator.clipboard.writeText(trackingLink);
      toast.success("Tracking link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const getTemplateForStage = (c: any) => {
    const clientName = c.client?.name || "Client";
    const trackingLink = `${window.location.origin}/track/${c.trackingToken}`;
    
    switch (c.stage) {
      case "ENTRY_PERMIT":
        return `Dear ${clientName},\n\nGreetings from Zyra Documents Clearance.\nYour Entry Permit (Ref: ${c.reference}) has been successfully issued. Please find the document attached or visit your tracking portal to download it: ${trackingLink}\n\nBest regards,\nZyra Operations Team`;
      case "MEDICAL_BIOMETRICS":
        return `Dear ${clientName},\n\nYour Medical & Biometrics appointment is ready to be scheduled for your case (${c.reference}). Please let us know your preferred date and time.\nTrack progress: ${trackingLink}`;
      case "VISA_STAMPING_EID":
        return `Dear ${clientName},\n\nGreat news! Your UAE Visa has been stamped and your Emirates ID is under processing (Ref: ${c.reference}). We will notify you once the physical ID card is ready for collection.\nTrack progress: ${trackingLink}`;
      case "COMPLETED_HANDOVER":
        return `Dear ${clientName},\n\nYour application (${c.reference}) is now 100% complete! Your original documents and Emirates ID are ready for handover at our office.\nThank you for choosing Zyra Documents Clearance.`;
      default:
        return `Dear ${clientName},\n\nThis is an update regarding your application (Ref: ${c.reference}). You can track your real-time status securely here: ${trackingLink}`;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {cases.map(c => {
        const message = getTemplateForStage(c);
        const waLink = generateWhatsAppLink(c.client?.phone, message);
        
        return (
          <div key={c.id} className="bg-white  border  rounded-xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600 " />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900  leading-tight">
                    {c.client?.name || "Unknown Client"}
                  </h3>
                  <p className="text-xs text-slate-500">{c.reference} • {c.serviceType}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-1 bg-slate-100  text-slate-500 rounded">
                {c.stage.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="bg-slate-50  p-3 rounded-lg border ">
              <p className="text-sm text-slate-600  whitespace-pre-wrap font-mono text-xs">
                {message}
              </p>
            </div>

            <div className="flex gap-2 mt-auto pt-2">
              <Link
                href={`/track/${c.trackingToken}`}
                target="_blank"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-100  text-slate-600  font-medium text-sm hover:bg-slate-200  transition"
              >
                <LinkIcon className="w-4 h-4" />
                Preview
              </Link>
              <button
                type="button"
                onClick={() => copyTrackingLink(c)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-100  text-slate-600  font-medium text-sm hover:bg-slate-200  transition"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </button>
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#25D366] text-white font-medium text-sm hover:bg-[#20b858] transition"
              >
                <MessageCircle className="w-4 h-4" />
                Send via WA
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
