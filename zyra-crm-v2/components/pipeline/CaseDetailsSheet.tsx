"use client";

import { useState, useEffect } from "react";
import { getCaseDetails, updateCaseGovRef, updateDocumentStatus, addCaseDocument } from "@/app/actions/pipeline";
import { X, Save, FileText, CheckCircle2, Clock, Plus, Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CaseDetailsSheet({ caseId, onClose }: { caseId: string, onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Local state for Gov Refs
  const [mohreRef, setMohreRef] = useState("");
  const [gdrfaRef, setGdrfaRef] = useState("");
  const [savingRef, setSavingRef] = useState(false);

  const [newDoc, setNewDoc] = useState("");

  useEffect(() => {
    let isMounted = true;
    getCaseDetails(caseId).then((res) => {
      if (isMounted && res) {
        setData(res);
        setMohreRef(res.mohreAppNo || "");
        setGdrfaRef(res.gdrfaRequestNo || "");
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [caseId]);

  const handleSaveRefs = async () => {
    setSavingRef(true);
    let success = true;
    
    if (mohreRef !== (data.mohreAppNo || "")) {
      const res1 = await updateCaseGovRef(caseId, 'mohreAppNo', mohreRef);
      if (!res1.success) success = false;
    }
    if (gdrfaRef !== (data.gdrfaRequestNo || "")) {
      const res2 = await updateCaseGovRef(caseId, 'gdrfaRequestNo', gdrfaRef);
      if (!res2.success) success = false;
    }

    setSavingRef(false);
    if (success) {
      toast.success("Tracking numbers saved.");
      setData({ ...data, mohreAppNo: mohreRef, gdrfaRequestNo: gdrfaRef });
    } else {
      toast.error("Failed to save tracking numbers.");
    }
  };

  const handleAddDoc = async () => {
    if (!newDoc.trim()) return;
    const res = await addCaseDocument(caseId, newDoc);
    if (res.success && res.document) {
      toast.success("Document requirement added.");
      setData({ ...data, documents: [...data.documents, res.document] });
      setNewDoc("");
    } else {
      toast.error(res.error || "Failed to add document");
    }
  };

  const handleDocStatus = async (docId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    const res = await updateDocumentStatus(docId, status);
    if (res.success) {
      setData({
        ...data,
        documents: data.documents.map((d: any) => d.id === docId ? { ...d, status } : d)
      });
    } else {
      toast.error(res.error || "Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm">
        <div className="w-full max-w-md bg-white h-full shadow-2xl flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#98682E]" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm transition-all">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-[#FDF8F0] relative shrink-0">
          <button onClick={onClose} className="absolute top-5 right-5 p-2 text-[#98682E] hover:bg-[#EADBC8] rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
          
          <div className="pr-8">
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded tracking-widest mb-2 inline-block">
              {data.reference}
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight mb-1">
              {data.applicantName}
            </h2>
            <p className="text-sm text-[#98682E] font-semibold">{data.serviceType}</p>
            <p className="text-xs text-slate-600 mt-2">Sponsor: <span className="font-medium text-slate-900">{data.client?.name}</span></p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
          
          {/* Government Tracking */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#98682E]" /> Gov Tracking
              </h3>
              <button 
                onClick={handleSaveRefs}
                disabled={savingRef}
                className="text-[#98682E] hover:text-[#7D5321] text-xs font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" /> {savingRef ? "Saving" : "Save"}
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">MOHRE App No.</Label>
                <Input 
                  value={mohreRef} 
                  onChange={e => setMohreRef(e.target.value)} 
                  placeholder="MB-xxxxxxx"
                  className="font-mono text-sm bg-slate-50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">GDRFA Request No.</Label>
                <Input 
                  value={gdrfaRef} 
                  onChange={e => setGdrfaRef(e.target.value)} 
                  placeholder="GDRFA-xxxxxxx"
                  className="font-mono text-sm bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Medical & Biometrics Checklists */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Requirements Checklist
              </h3>
              <p className="text-xs text-slate-500 mt-1">Medical, biometrics, and signatures.</p>
            </div>
            
            <div className="space-y-3">
              {data.documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between group">
                  <span className={`text-sm ${doc.status === 'APPROVED' ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                    {doc.title}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    {doc.status !== 'APPROVED' ? (
                      <button 
                        onClick={() => handleDocStatus(doc.id, 'APPROVED')}
                        className="p-1.5 rounded bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                        title="Mark Complete"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleDocStatus(doc.id, 'PENDING')}
                        className="text-xs text-emerald-600 font-bold uppercase"
                      >
                        Done
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {data.documents.length === 0 && (
                <p className="text-xs text-slate-400 italic py-2">No documents requested yet.</p>
              )}
            </div>

            <div className="pt-3 flex items-center gap-2">
              <Input 
                value={newDoc} 
                onChange={e => setNewDoc(e.target.value)} 
                placeholder="e.g. DHA Medical Test Result" 
                className="h-8 text-xs"
                onKeyDown={e => e.key === 'Enter' && handleAddDoc()}
              />
              <button 
                onClick={handleAddDoc}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Associated Transactions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-sky-600" /> Case Transactions
              </h3>
            </div>
            
            <div className="space-y-3">
              {data.transactions.length > 0 ? data.transactions.map((t: any) => (
                <div key={t.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <div>
                    <span className="font-mono text-[10px] text-slate-500 block mb-0.5">{t.reference}</span>
                    <span className="font-medium text-slate-800">{t.category}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold block ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-700'}`}>
                      AED {(t.amountTotal || 0).toFixed(2)}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${t.status === 'PAID' ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-400 italic py-2">No invoices or expenses logged for this case.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
