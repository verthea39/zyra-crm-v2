"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import TransactionModal from "./finance/TransactionModal";

export function QuickTransactionButtons() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDirection, setModalDirection] = useState<"INCOME" | "EXPENSE">("INCOME");

  const openModal = (direction: "INCOME" | "EXPENSE") => {
    setModalDirection(direction);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="border-primary/20 hover:bg-primary/5" onClick={() => { window.location.href = "/clients/new"; }}>
          Add Client
        </Button>
        <Button variant="outline" className="border-primary/20 hover:bg-primary/5" onClick={() => openModal("EXPENSE")}>
          Add Expense
        </Button>
        <Button className="shadow-lg shadow-primary/20 transition-transform active:scale-95" onClick={() => openModal("INCOME")}>
          Add Income
        </Button>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        direction={modalDirection} 
      />
    </>
  );
}
