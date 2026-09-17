"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { advanceCaseStage, deleteCase } from "@/app/actions/pipeline";
import { toast } from "sonner";
import { Clock, MessageCircle, MoveRight, Receipt, FileText, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { CaseDetailsSheet } from "./CaseDetailsSheet";
import { EditCaseModal } from "./EditCaseModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STAGES = [
  { id: "DRAFT_INTAKE", label: "Draft / Intake", short: "Draft" },
  { id: "OFFER_LETTER_MOHRE", label: "Offer Letter & MOHRE", short: "MOHRE" },
  { id: "ENTRY_PERMIT", label: "Entry Permit", short: "Entry" },
  { id: "MEDICAL_BIOMETRICS", label: "Medical & Biometrics", short: "Medical" },
  { id: "VISA_STAMPING_EID", label: "Visa Stamping / EID", short: "Visa" },
  { id: "COMPLETED_HANDOVER", label: "Completed", short: "Done" },
];

const STAGE_IDS = new Set(STAGES.map((s) => s.id));

// Legacy CaseStage values (PRE_CHECK/SUBMITTED/COMPLETED) predate the 6-column
// pipeline and never match a column id by strict equality -- that silently
// dropped any case still sitting on one of them from the board entirely.
// Map them onto the nearest sensible column, and anything still unrecognized
// falls back to the first column so no active case ever goes invisible.
const LEGACY_STAGE_MAP: Record<string, string> = {
  PRE_CHECK: "DRAFT_INTAKE",
  SUBMITTED: "OFFER_LETTER_MOHRE",
  COMPLETED: "COMPLETED_HANDOVER",
};

function resolveStage(stage: string | null | undefined): string {
  if (stage && STAGE_IDS.has(stage)) return stage;
  if (stage && LEGACY_STAGE_MAP[stage]) return LEGACY_STAGE_MAP[stage];
  return STAGES[0].id;
}

export function KanbanBoard({ cases, onCasesChange, clients = [], coordinators = [] }: { cases: any[], onCasesChange: React.Dispatch<React.SetStateAction<any[]>>, clients?: any[], coordinators?: any[] }) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState(STAGES[0].id);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [editingCase, setEditingCase] = useState<any | null>(null);

  const handleDelete = async (c: any) => {
    if (!confirm(`Delete case ${c.reference} (${c.applicantName || "Unnamed Applicant"})? This cannot be undone.`)) return;

    setDeletingId(c.id);
    const previous = cases;
    onCasesChange(prev => prev.filter(x => x.id !== c.id));

    const res = await deleteCase(c.id);
    setDeletingId(null);

    if (res.success) {
      toast.success("Case deleted successfully");
    } else {
      onCasesChange(previous);
      toast.error(res.error || "Failed to delete case");
    }
  };

  const moveCase = async (caseId: string, newStage: string, previousStage?: string) => {
    setUpdating(caseId);

    // Optimistic update for local state
    onCasesChange(prev => prev.map(c => c.id === caseId ? { ...c, stage: newStage, stageUpdatedAt: new Date() } : c));

    const result = await advanceCaseStage(caseId, newStage);
    setUpdating(null);

    if (result.success) {
      toast.success("Case moved to next stage");
    } else {
      // Revert the optimistic update
      if (previousStage) {
        onCasesChange(prev => prev.map(c => c.id === caseId ? { ...c, stage: previousStage } : c));
      }
      toast.error(result.error || "Failed to move case");
    }
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    if (source.droppableId === destination.droppableId) return;

    moveCase(draggableId, destination.droppableId, source.droppableId);
  };

  const getSponsorBadge = (type: string | undefined) => {
    if (type === "CORPORATE") return "bg-indigo-100 text-indigo-700  ";
    return "bg-sky-100 text-sky-700  ";
  };

  const getTimeInStage = (dateStr: string | Date | undefined) => {
    if (!dateStr) return "Just now";
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "1 day";
    return `${diff} days`;
  };

  const generateWhatsAppLink = (c: any, nextStage: any) => {
    const phone = c.client?.phone;
    if (!phone) return "#";
    const cleanPhone = phone.replace(/\D/g, "");
    const msg = `Hi ${c.client?.name}, an update on your application (${c.reference}): It has now progressed to the ${nextStage ? nextStage.label : 'Completed'} stage.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  // --- Mobile Tab View Render ---
  const renderMobileView = () => (
    <div className="md:hidden flex flex-col h-full overflow-hidden">
      <div className="flex overflow-x-auto scrollbar-hide gap-2 p-1 mb-4 border-b border-border shrink-0">
        {STAGES.map(stage => {
          const count = cases.filter(c => resolveStage(c.stage) === stage.id).length;
          const isActive = activeMobileTab === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveMobileTab(stage.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {stage.short} <span className="ml-1 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {renderCards(cases.filter(c => resolveStage(c.stage) === activeMobileTab), STAGES.find(s => s.id === activeMobileTab)!, false)}
      </div>
    </div>
  );

  // --- Desktop Kanban Render ---
  const renderDesktopView = () => (
    <div className="hidden md:flex gap-4 h-full overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const stageCases = cases.filter(c => resolveStage(c.stage) === stage.id);

        return (
          <div key={stage.id} className="flex flex-col min-w-[320px] w-[320px] bg-slate-50/50 rounded-xl overflow-hidden border border-border shrink-0 h-[calc(100vh-180px)] min-h-[600px] backdrop-blur-sm">
            <div className="p-4 border-b border-border bg-slate-100/60 font-bold flex justify-between items-center text-sm shrink-0">
              <span className="text-foreground tracking-wide uppercase text-xs">{stage.label}</span>
              <span className="bg-white text-slate-600 px-2 py-0.5 rounded-full text-xs font-mono border border-slate-200">
                {stageCases.length}
              </span>
            </div>

            <Droppable droppableId={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 overflow-y-auto p-3 space-y-3 min-h-[250px] transition-colors ${
                    snapshot.isDraggingOver ? "bg-primary/5" : ""
                  }`}
                >
                  {renderCards(stageCases, stage, true)}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        );
      })}
    </div>
  );

  // --- Common Card Renderer ---
  const renderCards = (stageCases: any[], stage: typeof STAGES[0], draggable: boolean) => {
    const stageIndex = STAGES.findIndex(s => s.id === stage.id);
    const nextStage = STAGES[stageIndex + 1];

    if (stageCases.length === 0) {
      return (
        <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-sm italic bg-slate-50/50">
          No active cases
        </div>
      );
    }

    return stageCases.map((c, index) => {
      const isUrgent = c.stageUpdatedAt && Math.floor((new Date().getTime() - new Date(c.stageUpdatedAt).getTime()) / (1000 * 3600 * 24)) >= 5;

      const cardBody = (dragHandleProps?: any, isDragging?: boolean) => (
        <div
          className={`bg-card border border-border rounded-lg shadow-sm relative group flex flex-col transition-all duration-150 hover:border-slate-300 hover:shadow-md overflow-hidden cursor-pointer ${
            isDragging ? "scale-105 shadow-xl rotate-1 border-primary/50" : ""
          }`}
          onClick={() => setSelectedCase(c.id)}
          {...(dragHandleProps || {})}
        >
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-30"></div>

          {(updating === c.id || deletingId === c.id) && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[2px]">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          <div className="p-4 flex-1">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded tracking-widest">
                {c.reference}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase tracking-widest border ${
                  c.client?.type === 'CORPORATE' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-sky-50 border-sky-200 text-sky-800'
                }`}>
                  {c.client?.type === 'CORPORATE' ? 'Corporate' : 'Individual'}
                </span>
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => setEditingCase(c)} className="cursor-pointer">
                        <Pencil className="w-3.5 h-3.5 mr-2" />
                        <span>Edit Case</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(c)} className="cursor-pointer text-rose-600 focus:text-rose-600">
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        <span>Delete Case</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <h3 className="font-bold text-foreground text-sm mb-1 leading-tight tracking-tight">
              {c.applicantName || "Unnamed Applicant"}
            </h3>
            <p className="text-xs text-muted-foreground mb-4 line-clamp-1">
              Sponsor: <span className="font-medium text-slate-700">{c.client?.name}</span>
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground bg-slate-50 p-2 rounded-lg border border-slate-200">
              <div className="flex items-center gap-1.5" title="Time in current stage">
                <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-500' : 'text-slate-400'}`} />
                <span className={isUrgent ? 'text-rose-600 font-medium' : ''}>
                  {getTimeInStage(c.stageUpdatedAt)}
                </span>
              </div>
              {(c.mohreAppNo || c.gdrfaRequestNo) && (
                <div className="flex items-center gap-1.5 text-slate-500 truncate" title="Gov App Reference">
                  <FileText className="w-3.5 h-3.5 opacity-70" />
                  <span className="truncate font-mono">{c.mohreAppNo || c.gdrfaRequestNo}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex border-t border-slate-200 bg-slate-50/50 overflow-hidden shrink-0" onClick={e => e.stopPropagation()}>
            <a
              href={generateWhatsAppLink(c, nextStage)}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex justify-center items-center py-2.5 hover:bg-[#25D366]/10 text-slate-400 hover:text-[#25D366] transition-colors border-r border-slate-200"
              title="WhatsApp Client Update"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <button
              className="flex-1 flex justify-center items-center py-2.5 hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors border-r border-slate-200"
              title="View Gov Receipt"
            >
              <Receipt className="w-4 h-4" />
            </button>
            {nextStage && (
              <button
                onClick={() => moveCase(c.id, nextStage.id, c.stage)}
                disabled={!!updating}
                className="flex-[2] flex justify-center items-center gap-1.5 py-2.5 bg-white hover:bg-primary/10 text-slate-600 hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
              >
                Forward <MoveRight className="w-3.5 h-3.5" />
              </button>
            )}
            {!nextStage && (
              <div className="flex-[2] flex justify-center items-center py-2.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                Completed
              </div>
            )}
          </div>
        </div>
      );

      if (!draggable) {
        return <div key={c.id}>{cardBody()}</div>;
      }

      return (
        <Draggable key={c.id} draggableId={c.id} index={index}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              style={provided.draggableProps.style}
            >
              {cardBody(provided.dragHandleProps, snapshot.isDragging)}
            </div>
          )}
        </Draggable>
      );
    });
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        {renderMobileView()}
        {renderDesktopView()}
      </DragDropContext>

      {selectedCase && (
        <CaseDetailsSheet
          caseId={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}

      {editingCase && (
        <EditCaseModal
          caseData={editingCase}
          clients={clients}
          coordinators={coordinators}
          onClose={() => setEditingCase(null)}
          onSaved={(updated) => {
            onCasesChange(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated, client: clients.find(cl => cl.id === updated.clientId) || x.client } : x));
          }}
        />
      )}
    </>
  );
}
