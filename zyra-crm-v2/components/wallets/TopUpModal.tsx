import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, X, Landmark } from "lucide-react";
import { topUpWallet } from "@/app/actions/wallets";

export function TopUpModal({ onClose, wallets, defaultWalletId }: { onClose: () => void; wallets: any[]; defaultWalletId?: string }) {
  const [loading, setLoading] = useState(false);
  const [walletId, setWalletId] = useState(defaultWalletId || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptRef, setReceiptRef] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletId || !amount || parseFloat(amount) <= 0) {
      toast.error("Please provide a valid wallet and amount.");
      return;
    }
    
    setLoading(true);
    try {
      await topUpWallet({
        walletId,
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        receiptRef: receiptRef || null,
        description: description || "Wallet Top-up"
      });
      toast.success("Wallet topped up successfully!");
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to top up wallet.");
    } finally {
      setLoading(false);
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
            <div className="bg-emerald-50 border border-emerald-200 text-[#007A55] p-2.5 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">Top-Up Portal Wallet</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Record a deposit into a government portal.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:px-6 flex flex-col gap-5">
          <div className="space-y-2">
            <Label className="text-slate-700">Select Portal *</Label>
            <div className="relative">
              <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                required
                className="w-full flex h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1 text-sm text-slate-900 shadow-sm focus:border-[#007A55] focus:ring-1 focus:ring-[#007A55] transition-colors"
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
              >
                <option value="" disabled>-- Choose Portal --</option>
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.entityName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Amount (AED) *</Label>
              <Input 
                type="number" 
                inputMode="decimal"
                required 
                min="1" 
                step="0.01" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="h-10 border-slate-200 rounded-xl focus:border-[#007A55] focus:ring-[#007A55] text-slate-900"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Date *</Label>
              <Input 
                type="date" 
                required 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="h-10 border-slate-200 rounded-xl focus:border-[#007A55] focus:ring-[#007A55] text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Payment Reference</Label>
            <Input 
              type="text" 
              value={receiptRef} 
              onChange={(e) => setReceiptRef(e.target.value)} 
              placeholder="e.g. Card TXN-12345" 
              className="h-10 border-slate-200 rounded-xl focus:border-[#007A55] focus:ring-[#007A55] text-slate-900"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Description / Notes</Label>
            <Input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="e.g. Monthly Top Up for Visas" 
              className="h-10 border-slate-200 rounded-xl focus:border-[#007A55] focus:ring-[#007A55] text-slate-900"
            />
          </div>

          <div className="sticky bottom-0 -mx-5 -mb-5 sm:mx-0 sm:mb-0 p-5 bg-white border-t border-slate-200 mt-auto z-10 pb-safe sm:rounded-b-2xl">
            <div className="flex justify-end gap-3">
              <button type="button" className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className="bg-[#007A55] hover:bg-[#006244] text-white font-semibold text-sm rounded-xl px-6 py-2.5 shadow-sm active:scale-95 transition-all">
                {loading ? "Processing..." : "Confirm Top-Up"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
