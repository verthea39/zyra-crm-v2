"use client";

import { useState } from "react";
import { exportDatabase, importDatabase } from "@/app/actions/backup";
import { motion } from "framer-motion";
import { HardDriveDownload, HardDriveUpload, AlertTriangle, ShieldCheck } from "lucide-react";

export default function BackupPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportDatabase();
      if (!result.success) {
        throw new Error(result.error);
      }

      // Create a blob and trigger download
      const blob = new Blob([result.data!], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zyra-crm-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert("Export Successful: Your database backup has been downloaded.");
    } catch (error: any) {
      alert(`Export Failed: ${error.message || "An error occurred during export."}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("WARNING: This will replace ALL existing data in your database. This action cannot be undone. Are you sure you want to proceed?")) {
      e.target.value = "";
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const result = await importDatabase(text);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      alert("Import Successful: Your database has been restored from the backup.");
    } catch (error: any) {
      alert(`Import Failed: ${error.message || "An error occurred during import."}`);
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Database Backup & Restore</h1>
        <p className="text-muted-foreground mt-2">
          Safeguard your CRM data by exporting to a local JSON file, or restore data from a previous backup.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <HardDriveDownload className="size-24" />
          </div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <HardDriveDownload className="size-6" />
              </div>
              <h2 className="text-xl font-semibold">Export Backup</h2>
            </div>
            
            <p className="text-muted-foreground mb-6 flex-1">
              Download a complete JSON snapshot of all your database records. Keep this file safe as a disaster recovery option.
            </p>
            
            <div className="mt-auto pt-4 border-t border-border/50">
              <button
                onClick={handleExport}
                disabled={isExporting || isImporting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExporting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Exporting...
                  </span>
                ) : (
                  <>
                    <HardDriveDownload className="size-4" />
                    Download JSON Backup
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Import Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-xl p-6 relative overflow-hidden border border-destructive/20"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <AlertTriangle className="size-24 text-destructive" />
          </div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-destructive/10 rounded-lg text-destructive">
                <HardDriveUpload className="size-6" />
              </div>
              <h2 className="text-xl font-semibold text-destructive">Restore Backup</h2>
            </div>
            
            <div className="space-y-4 mb-6 flex-1">
              <p className="text-muted-foreground">
                Upload a previously exported JSON backup file to restore your database.
              </p>
              
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-3 text-sm text-destructive-foreground">
                <AlertTriangle className="size-5 shrink-0 text-destructive mt-0.5" />
                <p>
                  <strong className="font-semibold text-destructive">Warning:</strong> Restoring a backup will securely erase all current data in the database and replace it with the data from the uploaded file.
                </p>
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-border/50">
              <label className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-medium border-2 cursor-pointer ${
                isExporting || isImporting 
                  ? "opacity-50 cursor-not-allowed border-destructive/20 text-destructive/50" 
                  : "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              }`}>
                {isImporting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Restoring...
                  </span>
                ) : (
                  <>
                    <HardDriveUpload className="size-4" />
                    Select & Upload Backup
                  </>
                )}
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={handleImport}
                  disabled={isExporting || isImporting}
                />
              </label>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Security Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-4 rounded-xl flex gap-4 items-start bg-muted/30"
      >
        <ShieldCheck className="size-6 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-medium">Data Integrity Assurance</h3>
          <p className="text-sm text-muted-foreground">
            The restore process runs inside a secure transaction. If any data validation error occurs during the import, the entire operation is automatically rolled back, ensuring your active database is never left in a corrupted state.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
