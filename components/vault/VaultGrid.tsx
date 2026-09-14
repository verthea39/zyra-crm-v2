"use client";

import { File, Download, ShieldCheck } from "lucide-react";

export function VaultGrid({ documents }: { documents: any[] }) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-card border border-border border-dashed rounded-xl">
        <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-foreground font-medium">No documents found in the vault.</p>
        <p className="text-xs text-muted-foreground mt-1">Upload a document to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {documents.map(doc => (
        <div key={doc.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 group relative overflow-hidden transition-all duration-150 hover:border-slate-300 hover:shadow-md">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-30"></div>
          
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
              <File className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-slate-600">
              {doc.category}
            </span>
          </div>
          
          <div className="mt-2">
            <h3 className="font-bold text-foreground text-sm truncate tracking-tight">{doc.title}</h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {doc.employee ? doc.employee.name : doc.client?.name}
            </p>
            {doc.employee && doc.employee.corporate && (
              <p className="text-[10px] text-slate-400 truncate mt-0.5">@ {doc.employee.corporate.name}</p>
            )}
          </div>
          
          <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
            <div className="text-[11px] font-medium text-slate-500 tracking-wide">
              EXP: {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'N/A'}
            </div>
            <button className="text-slate-400 hover:text-primary transition-colors p-1.5 hover:bg-primary/10 rounded-lg">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
