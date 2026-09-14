"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateFinancePin } from "@/app/actions/settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert } from "lucide-react";

export function SecurityTab() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmPin) {
      toast.error("New PINs do not match!");
      return;
    }
    if (newPin.length !== 4) {
      toast.error("PIN must be exactly 4 digits.");
      return;
    }

    setLoading(true);
    const res = await updateFinancePin(currentPin, newPin);
    if (res.success) {
      toast.success("Finance Master PIN updated successfully.");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    } else {
      toast.error(res.error || "Failed to update PIN.");
    }
    setLoading(false);
  };

  return (
    <div className="p-6 flex flex-col gap-8 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Security & Access Controls</h2>
        <p className="text-sm text-slate-500">Manage critical security settings and system PINs.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
          <div className="bg-rose-50 text-rose-600 p-2 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Finance Master PIN</h3>
            <p className="text-xs text-slate-500">Required to unlock `/finance/cockpit`</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePin} className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label>Current PIN</Label>
            <Input 
              type="password" 
              maxLength={4} 
              inputMode="numeric" 
              value={currentPin}
              onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••" 
              required
              className="text-center tracking-widest text-lg font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label>New 4-Digit PIN</Label>
            <Input 
              type="password" 
              maxLength={4} 
              inputMode="numeric" 
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••" 
              required
              className="text-center tracking-widest text-lg font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm New PIN</Label>
            <Input 
              type="password" 
              maxLength={4} 
              inputMode="numeric" 
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••" 
              required
              className="text-center tracking-widest text-lg font-mono"
            />
          </div>
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              {loading ? "Updating..." : "Update Master PIN"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
