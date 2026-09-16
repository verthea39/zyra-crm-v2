import { getCasePublicTracking } from "@/app/actions/track";
import { notFound } from "next/navigation";
import { ShieldCheck, MessageCircle, FileText, Download, CheckCircle, Clock, Phone, MapPin } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

const COMPANY_PHONE = "+971 50 722 8583";
const COMPANY_ADDRESS = "Burj Nahar, Deira, Dubai, UAE";

const STAGES = [
  { key: "DRAFT_INTAKE", label: "Case Intake & Document Verification" },
  { key: "OFFER_LETTER_MOHRE", label: "Labor Approval / MOHRE Permit" },
  { key: "ENTRY_PERMIT", label: "Entry Permit (e-Visa)" },
  { key: "MEDICAL_BIOMETRICS", label: "Medical Fitness & Biometrics" },
  { key: "VISA_STAMPING_EID", label: "Residence Visa Stamping & Emirates ID" },
  { key: "COMPLETED_HANDOVER", label: "Completed & Delivered" },
];

export default async function PublicTrackingPage({ params }: { params: Promise<{ trackingToken: string }> }) {
  const { trackingToken } = await params;
  const caseData = await getCasePublicTracking(trackingToken);

  if (!caseData) {
    notFound();
  }

  const currentStageIndex = STAGES.findIndex(s => s.key === caseData.stage);
  
  // Find index of fallback stages if it's still using old ones (PRE_CHECK, SUBMITTED, COMPLETED)
  const isCompleted = caseData.stage === "COMPLETED" || caseData.stage === "COMPLETED_HANDOVER";
  
  // For old ENUMs, map them approximately
  let mappedIndex = currentStageIndex;
  if (mappedIndex === -1) {
    if (caseData.stage === "PRE_CHECK") mappedIndex = 0;
    else if (caseData.stage === "SUBMITTED") mappedIndex = 2;
    else if (caseData.stage === "COMPLETED") mappedIndex = 5;
  }

  const coordinatorPhone = "971501234567"; // Fallback, could be fetched from User model if added

  const needsClientAction = caseData.stage === "DRAFT_INTAKE";
  const statusBadge = isCompleted
    ? { label: "Completed", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" }
    : needsClientAction
      ? { label: "Action Required by Client", className: "bg-amber-500/10 text-amber-400 border-amber-500/30" }
      : { label: "In Progress", className: "bg-[#98682E]/10 text-[#98682E] border-[#98682E]/30" };

  const downloadableFiles = [
    ...(caseData.client?.vaultDocuments || []).map((d: any) => ({ id: d.id, title: d.title, href: d.fileUrl })),
    ...(caseData.billingDocuments || [])
      .filter((d: any) => d.type === "INVOICE")
      .map((d: any) => ({ id: d.id, title: `Tax Invoice ${d.reference}`, href: `/documents/${d.id}` })),
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#98682E]/30">
      {/* Brand Header */}
      <div className="bg-[#0F172A] text-white py-6 px-4 md:px-8 border-b-4 border-[#98682E]">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-6 h-6 text-[#98682E]" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide uppercase">Zyra Documents</h1>
              <p className="text-xs text-slate-400 font-medium">Clearance Services — Dubai, UAE</p>
              <div className="flex flex-col sm:flex-row gap-x-4 gap-y-0.5 mt-1.5 text-[11px] text-slate-300">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {COMPANY_PHONE}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {COMPANY_ADDRESS}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="text-center md:text-right bg-white/5 p-3 rounded-lg border border-white/10">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Secure Tracking Ref</p>
              <p className="font-mono font-bold text-[#98682E] tracking-wider">{caseData.reference}</p>
            </div>
            <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full border ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Applicant Overview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Application Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-500 mb-1">Applicant Name</p>
              <p className="font-bold text-lg">{caseData.applicantName || caseData.client?.name}</p>
              {caseData.client?.type === 'CORPORATE' && (
                <p className="text-xs text-slate-500 mt-1">Sponsor: {caseData.client.name}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Service Requested</p>
              <p className="font-bold text-lg">{caseData.serviceType}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Submission Date</p>
              <p className="font-semibold">{format(new Date(caseData.createdAt), "dd MMMM yyyy")}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Last Updated</p>
              <p className="font-semibold text-emerald-600 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {format(new Date(caseData.stageUpdatedAt), "dd MMM yyyy, hh:mm a")}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Live Application Progress</h2>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {STAGES.map((stage, idx) => {
              const isPast = idx < mappedIndex || isCompleted;
              const isCurrent = idx === mappedIndex && !isCompleted;
              
              let statusColor = "bg-slate-100 border-slate-200 text-slate-400";
              let icon = <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />;
              
              if (isPast) {
                statusColor = "bg-emerald-500 border-emerald-500 text-white";
                icon = <CheckCircle className="w-4 h-4" />;
              } else if (isCurrent) {
                statusColor = "bg-[#98682E] border-[#98682E] text-white ring-4 ring-[#98682E]/20";
                icon = <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />;
              }

              return (
                <div key={stage.key} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${statusColor}`}>
                    {icon}
                  </div>
                  <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border ${isCurrent ? 'bg-[#98682E]/5 border-[#98682E]/20 shadow-sm' : 'bg-white border-slate-100'}`}>
                    <h3 className={`font-bold text-sm ${isCurrent ? 'text-[#98682E]' : isPast ? 'text-slate-900' : 'text-slate-400'}`}>
                      {stage.label}
                    </h3>
                    {isCurrent && (
                      <p className="text-xs text-slate-500 mt-1 font-medium">Currently processing...</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Download Vault -- final documents only surface once the case is fully complete */}
        {isCompleted && downloadableFiles.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Secure Download Vault</h2>
            <p className="text-sm text-slate-500 mb-4">Your final documents are ready for secure download below.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {downloadableFiles.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-[#98682E] hover:bg-[#98682E]/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 group-hover:bg-white rounded-lg text-[#98682E]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm text-slate-700 group-hover:text-[#98682E]">{doc.title}</span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-[#98682E]" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Contact WhatsApp */}
        <div className="bg-[#25D366]/10 rounded-2xl p-6 border border-[#25D366]/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center justify-center sm:justify-start gap-2">
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
              Need Assistance?
            </h3>
            <p className="text-sm text-slate-600 mt-1">Your assigned PRO ({caseData.coordinator?.name}) is available on WhatsApp.</p>
          </div>
          <a
            href={`https://wa.me/${coordinatorPhone}?text=Hi, I am checking the status of my application Ref: ${caseData.reference}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] hover:bg-[#1EBE5C] text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-sm shadow-[#25D366]/20"
          >
            Chat with PRO
          </a>
        </div>
        
        <div className="text-center pb-8 pt-4">
          <p className="text-xs text-slate-400">Powered by Zyra Operations Platform</p>
        </div>
      </main>
    </div>
  );
}
