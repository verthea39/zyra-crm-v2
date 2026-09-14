"use client";

import { useState } from "react";
import { Plus, Download } from "lucide-react";
import { AddClientModal } from "./AddClientModal";
import { AddIncomeModal } from "./AddIncomeModal";
import { AddExpenseModal } from "./AddExpenseModal";
import { QuotationModal } from "./modals/QuotationModal";
import { TaxInvoiceModal } from "./modals/TaxInvoiceModal";
import { PaymentReceiptModal } from "./modals/PaymentReceiptModal";
import { Client } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Receipt, FileSignature, Lock } from "lucide-react";

export function CockpitHeader({ 
  onExport,
  clients 
}: { 
  onExport: () => void;
  clients: Client[];
}) {
  const [showClientModal, setShowClientModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  
  const [showQuotation, setShowQuotation] = useState(false);
  const [showTaxInvoice, setShowTaxInvoice] = useState(false);
  const [showPaymentReceipt, setShowPaymentReceipt] = useState(false);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          AED Live Finance — Dubai PRO Standard
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Executive Cash Flow Cockpit
        </h1>
        <p className="text-sm text-slate-500 font-normal mt-1">
          Live bi-directional sync with master ledger & clearance pipeline
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={() => {
            window.location.reload();
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md shadow-sm h-9">
          <Lock className="w-4 h-4" />
          Lock Session
        </button>

        <button 
          onClick={onExport}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-md shadow-sm h-9">
          <Download className="w-4 h-4" />
          Export Data
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-[#EADBC8] bg-[#FDF8F0] text-[#98682E] hover:bg-[#F7EEDB] rounded-md shadow-sm h-9">
            <FileText className="w-4 h-4" />
            + Create Document
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setShowQuotation(true)} className="cursor-pointer">
              <FileSignature className="w-4 h-4 mr-2" />
              <span>Quotation</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowTaxInvoice(true)} className="cursor-pointer">
              <FileText className="w-4 h-4 mr-2" />
              <span>Tax Invoice</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowPaymentReceipt(true)} className="cursor-pointer">
              <Receipt className="w-4 h-4 mr-2" />
              <span>Payment Receipt</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button 
          onClick={() => setShowClientModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-[#98682E] text-white hover:bg-[#7D5321] shadow-sm rounded-md h-9">
          <Plus className="w-4 h-4" />
          Add Client
        </button>
        <button 
          onClick={() => setShowIncomeModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm rounded-md h-9">
          <Plus className="w-4 h-4" />
          Add Income
        </button>
        <button 
          onClick={() => setShowExpenseModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-rose-700 hover:bg-rose-800 text-white shadow-sm rounded-md h-9">
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      <AddClientModal open={showClientModal} onOpenChange={setShowClientModal} />
      <AddIncomeModal open={showIncomeModal} onOpenChange={setShowIncomeModal} />
      <AddExpenseModal open={showExpenseModal} onOpenChange={setShowExpenseModal} />

      <QuotationModal open={showQuotation} onOpenChange={setShowQuotation} clients={clients} />
      <TaxInvoiceModal open={showTaxInvoice} onOpenChange={setShowTaxInvoice} clients={clients} />
      <PaymentReceiptModal open={showPaymentReceipt} onOpenChange={setShowPaymentReceipt} clients={clients} />
    </div>
  );
}
