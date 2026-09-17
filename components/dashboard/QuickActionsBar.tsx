"use client";

import { useState } from "react";
import { Plus, FileText, Receipt, FileSignature } from "lucide-react";
import type { Client } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// We import the same modals from finance
import { AddClientModal } from "@/components/finance/AddClientModal";
import { AddIncomeModal } from "@/components/finance/AddIncomeModal";
import { AddExpenseModal } from "@/components/finance/AddExpenseModal";
import { QuotationModal } from "@/components/finance/modals/QuotationModal";
import { TaxInvoiceModal } from "@/components/finance/modals/TaxInvoiceModal";
import { PaymentReceiptModal } from "@/components/finance/modals/PaymentReceiptModal";

export function QuickActionsBar({ clients }: { clients: Client[] }) {
  const [showClientModal, setShowClientModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  
  const [showQuotation, setShowQuotation] = useState(false);
  const [showTaxInvoice, setShowTaxInvoice] = useState(false);
  const [showPaymentReceipt, setShowPaymentReceipt] = useState(false);

  return (
    <>
      <div className="flex md:flex-wrap items-center gap-3 mb-8 overflow-x-auto scrollbar-hide py-1">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-[#EADBC8] bg-[#FDF8F0] text-[#98682E] hover:bg-[#F7EEDB] rounded-xl shadow-xs">
            <FileText className="w-4 h-4" />
            + Create Document
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
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
          className="inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-[#98682E] text-white hover:bg-[#7D5321] rounded-xl shadow-sm">
          <Plus className="w-4 h-4" />
          Add Client
        </button>

        <button 
          onClick={() => setShowIncomeModal(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-[#007A55] text-white hover:bg-[#006244] rounded-xl shadow-sm">
          <Plus className="w-4 h-4" />
          Add Income
        </button>

        <button 
          onClick={() => setShowExpenseModal(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-[#C5002F] text-white hover:bg-[#A30026] rounded-xl shadow-sm">
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
    </>
  );
}
