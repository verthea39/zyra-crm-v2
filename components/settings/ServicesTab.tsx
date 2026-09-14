"use client";

import { useState } from "react";
import { Plus, Search, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { createServiceItem, deleteServiceItem } from "@/app/actions/settings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ServicesTab({ initialServices }: { initialServices: any[] }) {
  const [services, setServices] = useState(initialServices);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newService, setNewService] = useState({
    name: "", category: "Employment Visa Stages", govFee: "", agencyFee: "", isVatExempt: false
  });

  const filteredServices = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All Categories" || s.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || !newService.category) return;
    
    const govFee = parseFloat(newService.govFee || "0");
    const agencyFee = parseFloat(newService.agencyFee || "0");

    const res = await createServiceItem({
      name: newService.name,
      category: newService.category,
      govFee,
      agencyFee,
      isVatExempt: newService.isVatExempt
    });

    if (res.success) {
      toast.success("Service added successfully!");
      setServices([...services, res.service]);
      setIsAddOpen(false);
      setNewService({ name: "", category: "Employment Visa Stages", govFee: "", agencyFee: "", isVatExempt: false });
    } else {
      toast.error(res.error || "Failed to add service");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    const res = await deleteServiceItem(id);
    if (res.success) {
      toast.success("Service deleted.");
      setServices(services.filter(s => s.id !== id));
    } else {
      toast.error(res.error || "Failed to delete");
    }
  };

  const categories = ["Employment Visa Stages", "Investor / Golden Visa", "Corporate / Licensing", "Attestation / Typing", "Other"];

  return (
    <div className="h-full flex flex-col">
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search services..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm shadow-sm focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E]" 
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm shadow-sm focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E]"
          >
            <option value="All Categories">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        
        <button 
          onClick={() => setIsAddOpen(true)}
          className="bg-[#98682E] hover:bg-[#7D5321] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-[#0F172A] text-slate-300 text-xs uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 font-semibold">Service Name</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold text-right">Gov Fee (AED)</th>
              <th className="px-6 py-4 font-semibold text-right">Zyra Fee (AED)</th>
              <th className="px-6 py-4 font-semibold text-center">VAT Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredServices.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{s.name}</td>
                <td className="px-6 py-4">
                  <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                    {s.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-slate-600">{s.govFee.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-mono font-medium text-[#98682E]">{s.agencyFee.toFixed(2)}</td>
                <td className="px-6 py-4 text-center">
                  {s.isVatExempt ? (
                    <span className="text-xs text-slate-400">Exempt</span>
                  ) : (
                    <span className="text-xs text-emerald-600 font-medium">Standard (5%)</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(s.id)} className="text-slate-400 hover:text-rose-600 p-1 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredServices.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-500 italic">No services found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[450px] bg-white">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>Create a preset service for fast invoicing.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Service Name</Label>
              <Input required value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} placeholder="e.g. Quota Application" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select 
                required 
                className="w-full flex h-10 rounded-xl border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:border-[#98682E] focus:ring-1 focus:ring-[#98682E]"
                value={newService.category} 
                onChange={e => setNewService({...newService, category: e.target.value})}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gov Fee (AED)</Label>
                <Input type="number" required min="0" step="0.01" value={newService.govFee} onChange={e => setNewService({...newService, govFee: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Zyra Fee (AED)</Label>
                <Input type="number" required min="0" step="0.01" value={newService.agencyFee} onChange={e => setNewService({...newService, agencyFee: e.target.value})} />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="vatExempt" checked={newService.isVatExempt} onChange={e => setNewService({...newService, isVatExempt: e.target.checked})} className="rounded border-slate-300" />
              <Label htmlFor="vatExempt" className="cursor-pointer">Service is VAT Exempt (0%)</Label>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button type="submit" className="bg-[#98682E] text-white px-5 py-2 rounded-lg text-sm font-semibold">Save Service</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
