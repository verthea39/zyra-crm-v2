import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { createPortalWallet } from "@/app/actions/wallets";

export function AddWalletModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [entityName, setEntityName] = useState("");
  const [portalType, setPortalType] = useState("GENERAL");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState("500");
  const [accountNumber, setAccountNumber] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityName.trim()) {
      toast.error("Portal name is required.");
      return;
    }

    setLoading(true);
    const res = await createPortalWallet({
      entityName: entityName.trim(),
      portalType,
      openingBalance: parseFloat(openingBalance || "0"),
      lowBalanceThreshold: parseFloat(lowBalanceThreshold || "500"),
      accountNumber: accountNumber || undefined,
    });
    setLoading(false);

    if (res.success) {
      toast.success("Portal wallet added.");
      onClose();
    } else {
      toast.error(res.error || "Failed to add portal wallet.");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] w-full h-[100dvh] sm:h-auto max-w-full m-0 p-0 sm:rounded-2xl rounded-none bg-white border-none shadow-2xl flex flex-col overflow-hidden">
        <DialogHeader className="bg-white border-b border-slate-200 p-5 sm:p-6 sm:rounded-t-2xl shrink-0 relative">
          <button onClick={onClose} className="absolute right-5 top-5 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-[#FDF8F0] border border-[#EADBC8] text-[#98682E] p-2.5 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">Add Portal Wallet</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Register a new government portal escrow account.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:px-6 flex flex-col gap-5">
          <div className="space-y-2">
            <Label className="text-slate-700">Portal Name / Provider *</Label>
            <Input
              required
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              placeholder="e.g. GDRFA / Amer Wallet"
              className="h-10 border-slate-200 rounded-xl focus:border-[#98682E] focus:ring-[#98682E] text-slate-900"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Portal Type</Label>
            <select
              value={portalType}
              onChange={(e) => setPortalType(e.target.value)}
              className="w-full flex h-10 rounded-xl border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-colors"
            >
              <option value="IMMIGRATION">Immigration</option>
              <option value="LABOUR">Labour</option>
              <option value="ECONOMIC">Economic</option>
              <option value="GENERAL">General</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Opening Balance (AED)</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="h-10 border-slate-200 rounded-xl focus:border-[#98682E] focus:ring-[#98682E] text-slate-900"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Low Balance Alert (AED)</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={lowBalanceThreshold}
                onChange={(e) => setLowBalanceThreshold(e.target.value)}
                className="h-10 border-slate-200 rounded-xl focus:border-[#98682E] focus:ring-[#98682E] text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Reference / Portal Login ID</Label>
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Optional"
              className="h-10 border-slate-200 rounded-xl focus:border-[#98682E] focus:ring-[#98682E] text-slate-900"
            />
          </div>

          <div className="sticky bottom-0 -mx-5 -mb-5 sm:mx-0 sm:mb-0 p-5 bg-white border-t border-slate-200 mt-auto z-10 pb-safe sm:rounded-b-2xl">
            <div className="flex justify-end gap-3">
              <button type="button" className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className="bg-[#98682E] hover:bg-[#7D5321] text-white font-semibold text-sm rounded-xl px-6 py-2.5 shadow-sm active:scale-95 transition-all">
                {loading ? "Saving..." : "Add Wallet"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
