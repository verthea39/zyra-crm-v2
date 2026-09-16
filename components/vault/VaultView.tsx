"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Plus, Download, MessageCircle, Trash2, CalendarClock, Loader2 } from "lucide-react";
import { UploadDocumentModal } from "./UploadDocumentModal";
import { deleteVaultDocument, getVaultDocumentFile } from "@/app/actions/vault";
import { toast } from "sonner";
import { format } from "date-fns";

const CATEGORIES = [
  "All Categories",
  "Passport Copy",
  "UAE Visa",
  "Emirates ID",
  "Trade License",
  "Establishment Card",
  "Ejari",
  "Medical / Insurance"
];

const EXPIRY_FILTERS = [
  "All",
  "Expiring in 15 Days",
  "Expiring in 30 Days",
  "Expired"
];

export function VaultView({ initialDocuments, clients }: { initialDocuments: any[], clients: any[] }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [expiryFilter, setExpiryFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (docId: string, title: string) => {
    setDownloadingId(docId);
    const res = await getVaultDocumentFile(docId);
    setDownloadingId(null);
    if (!res.success || !res.fileUrl) {
      toast.error("Could not load the file");
      return;
    }
    // A data: URL opened via window.open() after an await falls outside the
    // browser's "direct user gesture" window and gets popup-blocked on most
    // browsers -- a download-triggering anchor click isn't subject to that.
    const link = document.createElement("a");
    link.href = res.fileUrl;
    link.download = title || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDocs = useMemo(() => {
    const now = new Date().getTime();
    
    return documents.filter((doc: any) => {
      const matchSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.client?.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory = categoryFilter === "All Categories" || doc.category.includes(categoryFilter);

      let matchExpiry = true;
      if (expiryFilter !== "All" && doc.expiryDate) {
        const docTime = new Date(doc.expiryDate).getTime();
        const daysLeft = Math.floor((docTime - now) / (1000 * 3600 * 24));
        
        if (expiryFilter === "Expired") matchExpiry = daysLeft < 0;
        else if (expiryFilter === "Expiring in 15 Days") matchExpiry = daysLeft >= 0 && daysLeft <= 15;
        else if (expiryFilter === "Expiring in 30 Days") matchExpiry = daysLeft >= 0 && daysLeft <= 30;
      }

      return matchSearch && matchCategory && matchExpiry;
    });
  }, [documents, searchQuery, categoryFilter, expiryFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    setDeletingId(id);
    const res = await deleteVaultDocument(id);
    setDeletingId(null);
    
    if (res.success) {
      toast.success("Document deleted");
      setDocuments(prev => prev.filter(d => d.id !== id));
    } else {
      toast.error(res.error);
    }
  };

  const getExpiryStatus = (dateStr: string | null) => {
    if (!dateStr) return { label: "No Expiry", color: "bg-slate-100 text-slate-700" };
    
    const daysLeft = Math.floor((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    
    if (daysLeft < 0) return { label: `Expired (${Math.abs(daysLeft)} days ago)`, color: "bg-red-100 text-red-700 border border-red-200" };
    if (daysLeft <= 15) return { label: `Critical: ${daysLeft} days left`, color: "bg-rose-100 text-rose-700 border border-rose-200 animate-pulse" };
    if (daysLeft <= 30) return { label: `Due Soon: ${daysLeft} days left`, color: "bg-amber-100 text-amber-700 border border-amber-200" };
    
    return { label: `Valid: ${daysLeft} days left`, color: "bg-emerald-100 text-emerald-700 border border-emerald-200" };
  };

  const sendWhatsAppAlert = (doc: any) => {
    const phone = doc.client?.phone;
    if (!phone) {
      toast.error("No phone number found for this client");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    const dateStr = doc.expiryDate ? format(new Date(doc.expiryDate), "dd MMM yyyy") : "soon";
    const msg = `Dear ${doc.client.name}, this is a courtesy reminder from Zyra Documents Clearance that your ${doc.category} (${doc.title}) is expiring on ${dateStr}. Please let us know if you would like our PRO team to initiate the renewal to avoid fines.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Search & Filter Strip */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search document name, number or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border-transparent focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg text-sm transition-all shadow-sm"
          />
        </div>
        
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 md:pb-0 shrink-0">
          <div className="relative min-w-[160px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border-transparent focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg text-sm appearance-none cursor-pointer shadow-sm"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <div className="relative min-w-[160px]">
            <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border-transparent focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E] rounded-lg text-sm appearance-none cursor-pointer shadow-sm"
            >
              {EXPIRY_FILTERS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#98682E] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#7D5321] transition shadow-sm whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" /> Upload Document
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Desktop Table View */}
        <div className="hidden md:block min-w-full">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0F172A] text-slate-300 text-xs uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold">Document & Category</th>
                <th className="px-6 py-4 font-semibold">Belongs To</th>
                <th className="px-6 py-4 font-semibold">Expiry Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredDocs.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-slate-500 italic">No documents found matching your criteria.</td></tr>
              ) : filteredDocs.map((doc: any) => {
                const status = getExpiryStatus(doc.expiryDate);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{doc.title}</div>
                      <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{doc.category}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {doc.client?.name || 'Unknown Client'}
                      {doc.employee && <span className="block text-xs text-slate-500 font-normal mt-0.5">Emp: {doc.employee.name}</span>}
                    </td>
                    <td className="px-6 py-4">
                      {doc.expiryDate && (
                        <div className="font-medium text-slate-900 mb-1.5">
                          {format(new Date(doc.expiryDate), "dd MMM yyyy")}
                        </div>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {doc.hasFile ? (
                          <button
                            type="button"
                            onClick={() => handleDownload(doc.id, doc.title)}
                            disabled={downloadingId === doc.id}
                            className="p-2 text-slate-400 hover:text-[#98682E] bg-white border border-slate-200 rounded-md shadow-sm transition disabled:opacity-50"
                            title="Download / View"
                          >
                            {downloadingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          </button>
                        ) : (
                          <span className="p-2 text-slate-200 bg-white border border-slate-200 rounded-md shadow-sm cursor-not-allowed" title="No file attached">
                            <Download className="w-4 h-4" />
                          </span>
                        )}
                        <button onClick={() => sendWhatsAppAlert(doc)} className="p-2 text-slate-400 hover:text-[#25D366] bg-white border border-slate-200 rounded-md shadow-sm transition" title="WhatsApp Alert">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(doc.id)} disabled={deletingId === doc.id} className="p-2 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded-md shadow-sm transition" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col p-4 gap-3 pb-20">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 italic">No documents found.</div>
          ) : filteredDocs.map((doc: any) => {
            const status = getExpiryStatus(doc.expiryDate);
            return (
              <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                      {doc.category}
                    </span>
                    <h3 className="font-bold text-slate-900 leading-tight">{doc.title}</h3>
                  </div>
                </div>
                
                <div className="text-sm font-medium text-slate-700">
                  {doc.client?.name}
                </div>

                <div className="flex justify-between items-end mt-1">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Expiry Date</div>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                      {doc.expiryDate ? format(new Date(doc.expiryDate), "dd MMM yyyy") : "N/A"} - {status.label}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-2 pt-3 border-t border-slate-100">
                  {doc.hasFile ? (
                    <button
                      type="button"
                      onClick={() => handleDownload(doc.id, doc.title)}
                      disabled={downloadingId === doc.id}
                      className="flex-1 flex justify-center items-center gap-1.5 py-2 min-h-[44px] bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {downloadingId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} View
                    </button>
                  ) : (
                    <span className="flex-1 flex justify-center items-center gap-1.5 py-2 min-h-[44px] bg-slate-50 text-slate-300 rounded-lg text-xs font-bold uppercase cursor-not-allowed">
                      <Download className="w-3.5 h-3.5" /> No File
                    </span>
                  )}
                  <button onClick={() => sendWhatsAppAlert(doc)} className="flex-1 flex justify-center items-center gap-1.5 py-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors rounded-lg text-xs font-bold uppercase">
                    <MessageCircle className="w-3.5 h-3.5" /> Alert
                  </button>
                  <button onClick={() => handleDelete(doc.id)} disabled={deletingId === doc.id} className="w-10 flex justify-center items-center py-2 bg-rose-50 text-rose-600 rounded-lg shrink-0 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <UploadDocumentModal onClose={() => setIsModalOpen(false)} clients={clients} />
      )}
    </div>
  );
}
