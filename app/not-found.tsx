"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CompassIcon, ArrowLeft, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-6">
          <CompassIcon className="w-8 h-8" />
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">404</p>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Page Not Found</h1>
        <p className="text-sm text-slate-500 mb-8">
          The portal record, case file, or link you are trying to access does not exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-[#98682E] text-white font-semibold text-sm hover:bg-[#98682E]/90 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
