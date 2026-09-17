"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateCompanySettings } from "@/app/actions/settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CompanyTab({ initialSettings }: { initialSettings: any }) {
  const [settings, setSettings] = useState(initialSettings || {});
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateCompanySettings(settings);
    if (res.success) {
      toast.success("Company settings saved!");
      setSettings(res.settings);
    } else {
      toast.error(res.error || "Failed to save");
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Corporate Profile & Tax Details</h2>
        <p className="text-sm text-slate-500">Configure official details for invoices and system generated documents.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="space-y-2 col-span-1 md:col-span-2">
            <h3 className="font-semibold text-slate-700 text-sm border-b pb-2 mb-2">General Information</h3>
          </div>
          <div className="space-y-2">
            <Label>Company Name (English)</Label>
            <Input value={settings.companyNameEn || ""} onChange={e => setSettings({...settings, companyNameEn: e.target.value})} placeholder="Zyra Document Clearing Services LLC" />
          </div>
          <div className="space-y-2">
            <Label>Company Name (Arabic)</Label>
            <Input value={settings.companyNameAr || ""} onChange={e => setSettings({...settings, companyNameAr: e.target.value})} placeholder="زايرا لخدمات تخليص المعاملات" dir="rtl" />
          </div>
          <div className="space-y-2">
            <Label>Tax Registration Number (TRN)</Label>
            <Input value={settings.trn || ""} onChange={e => setSettings({...settings, trn: e.target.value})} placeholder="100xxxxxxxxx3" />
          </div>
          <div className="space-y-2">
            <Label>Trade License No.</Label>
            <Input value={settings.tradeLicenseNo || ""} onChange={e => setSettings({...settings, tradeLicenseNo: e.target.value})} placeholder="e.g. 984532" />
          </div>
          <div className="space-y-2 col-span-1 md:col-span-2">
            <Label>Office Address</Label>
            <Input value={settings.address || ""} onChange={e => setSettings({...settings, address: e.target.value})} placeholder="Office 201, Dubai, UAE" />
          </div>
          <div className="space-y-2 col-span-1 md:col-span-2">
            <Label>Company Logo URL</Label>
            <Input value={settings.logoUrl || ""} onChange={e => setSettings({...settings, logoUrl: e.target.value})} placeholder="https://.../logo.png" />
            <p className="text-[11px] text-slate-400">Shown on every Quotation, Tax Invoice, and Payment Receipt header.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="space-y-2 col-span-1 md:col-span-2">
            <h3 className="font-semibold text-slate-700 text-sm border-b pb-2 mb-2">Contact Details</h3>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={settings.phone || ""} onChange={e => setSettings({...settings, phone: e.target.value})} placeholder="+971 4 xxx xxxx" />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input value={settings.whatsapp || ""} onChange={e => setSettings({...settings, whatsapp: e.target.value})} placeholder="+971 5x xxx xxxx" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={settings.email || ""} onChange={e => setSettings({...settings, email: e.target.value})} placeholder="info@company.com" />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={settings.website || ""} onChange={e => setSettings({...settings, website: e.target.value})} placeholder="www.company.com" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="space-y-2 col-span-1 md:col-span-2">
            <h3 className="font-semibold text-slate-700 text-sm border-b pb-2 mb-2">Banking Details (For Invoices)</h3>
          </div>
          <div className="space-y-2">
            <Label>Bank Name</Label>
            <Input value={settings.bankName || ""} onChange={e => setSettings({...settings, bankName: e.target.value})} placeholder="e.g. Emirates NBD" />
          </div>
          <div className="space-y-2">
            <Label>Account Name</Label>
            <Input value={settings.accountName || ""} onChange={e => setSettings({...settings, accountName: e.target.value})} placeholder="Company Account Name" />
          </div>
          <div className="space-y-2">
            <Label>IBAN</Label>
            <Input value={settings.iban || ""} onChange={e => setSettings({...settings, iban: e.target.value})} placeholder="AE00 0000 0000 0000 0000 000" className="font-mono text-sm" />
          </div>
          <div className="space-y-2">
            <Label>SWIFT Code</Label>
            <Input value={settings.swift || ""} onChange={e => setSettings({...settings, swift: e.target.value})} placeholder="EBIXAE" className="font-mono text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-700 text-sm border-b pb-2 mb-2">Document Terms & Footer</h3>
            <p className="text-xs text-slate-400 -mt-1">Default terms shown on each document type's printed/PDF footer -- overridable per document at creation, falls back to these when left blank.</p>
          </div>
          <div className="space-y-2">
            <Label>Quotation Terms & Conditions</Label>
            <Textarea rows={3} value={settings.quotationTerms || ""} onChange={e => setSettings({...settings, quotationTerms: e.target.value})} placeholder="1. Quotation validity...&#10;2. Government fees are estimated..." />
          </div>
          <div className="space-y-2">
            <Label>Tax Invoice Terms & Conditions</Label>
            <Textarea rows={3} value={settings.paymentTerms || ""} onChange={e => setSettings({...settings, paymentTerms: e.target.value})} placeholder="1. Payment due within 7 days...&#10;2. Government fees are non-refundable..." />
          </div>
          <div className="space-y-2">
            <Label>Payment Receipt Footer Disclaimer</Label>
            <Textarea rows={2} value={settings.receiptFooterNote || ""} onChange={e => setSettings({...settings, receiptFooterNote: e.target.value})} placeholder="This is a computer-generated receipt and does not require a physical signature." />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <button
            type="submit" 
            disabled={loading}
            className="bg-[#98682E] hover:bg-[#7D5321] text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            {loading ? "Saving..." : "Save Company Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
