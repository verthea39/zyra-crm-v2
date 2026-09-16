"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateFinancePin } from "@/app/actions/settings";
import { exportDatabaseBackup, restoreFromBackup, resetToCleanDemoState } from "@/app/actions/admin-tools";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Download, Upload, RotateCcw, Loader2 } from "lucide-react";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export function SecurityTab({ team = [] }: { team?: any[] }) {
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

      <DangerZone team={team} />
    </div>
  );
}

function DangerZone({ team }: { team: any[] }) {
  const admins = team.filter((u: any) => ADMIN_ROLES.includes(u.role) && u.isActive !== false);
  const [actorId, setActorId] = useState(admins[0]?.id || "");
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const handleExport = async () => {
    if (!actorId) {
      toast.error("Select an Admin user first");
      return;
    }
    setExporting(true);
    const res = await exportDatabaseBackup(actorId);
    setExporting(false);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    const blob = new Blob([JSON.stringify(res.backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `zyra-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  };

  const handleRestoreFile = async (file: File) => {
    if (!actorId) {
      toast.error("Select an Admin user first");
      return;
    }
    if (!confirm("Restore from this backup file? Existing records with matching IDs will be overwritten.")) return;
    setRestoring(true);
    const text = await file.text();
    const res = await restoreFromBackup(actorId, text);
    setRestoring(false);
    if (res.success) {
      toast.success(`Restored: ${res.counts.clients} clients, ${res.counts.documents} documents, ${res.counts.transactions} transactions`);
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="bg-white border border-rose-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4 border-b border-rose-100 pb-4">
        <div className="bg-rose-50 text-rose-600 p-2 rounded-lg">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Danger Zone</h3>
          <p className="text-xs text-slate-500">Database backup, restore, and demo reset -- Admin only</p>
        </div>
      </div>

      <div className="max-w-sm mb-6">
        <Label>Acting As (must be Admin)</Label>
        <select
          value={actorId}
          onChange={(e) => setActorId(e.target.value)}
          className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none"
        >
          {admins.length === 0 ? (
            <option value="">-- No Admin users found --</option>
          ) : (
            admins.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)
          )}
        </select>
        {admins.length === 0 && (
          <p className="text-xs text-rose-600 mt-1">No Admin/Super Admin users exist -- add one under Team & Roles first.</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || !actorId}
          className="flex items-center justify-center gap-2 h-11 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export Backup
        </button>

        <label className="flex items-center justify-center gap-2 h-11 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 cursor-pointer disabled:opacity-50">
          {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Restore from Backup
          <input
            type="file"
            accept="application/json"
            className="hidden"
            disabled={restoring || !actorId}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleRestoreFile(file);
              e.target.value = "";
            }}
          />
        </label>

        <button
          type="button"
          onClick={() => setResetOpen(true)}
          disabled={!actorId}
          className="flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" /> Reset to Clean Demo State
        </button>
      </div>

      {resetOpen && <ResetConfirmModal actorId={actorId} onClose={() => setResetOpen(false)} />}
    </div>
  );
}

function ResetConfirmModal({ actorId, onClose }: { actorId: string; onClose: () => void }) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    const res = await resetToCleanDemoState(actorId, confirmText);
    setLoading(false);
    if (res.success) {
      toast.success("Database reset to clean demo state");
      onClose();
      window.location.reload();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-rose-200">
        <div className="p-5 border-b border-rose-100 bg-rose-50">
          <div className="flex items-center gap-2 text-rose-700 font-bold">
            <ShieldAlert className="w-5 h-5" /> This will permanently wipe live data
          </div>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600">
            All clients, cases, documents, transactions, and employees will be <strong>permanently deleted</strong> and
            replaced with clean demo records (2 B2B companies, 3 individual visa cases, preset line items, and funded
            portal wallets). This cannot be undone -- export a backup first if you need to keep current data.
          </p>
          <div>
            <Label>Type <span className="font-mono font-bold">RESET</span> to confirm</Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET"
              className="mt-1.5 font-mono"
              autoFocus
            />
          </div>
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-lg border border-slate-200 bg-white text-slate-600 font-semibold text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmText !== "RESET" || loading}
            className="flex-1 h-11 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Confirm Reset
          </button>
        </div>
      </div>
    </div>
  );
}
