"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

// Sits inside the (main) segment, below (main)/layout.tsx -- so when a page
// under the app shell throws, only this content area is replaced. The
// sidebar/topbar in (main)/layout.tsx stay mounted instead of the whole
// shell unmounting, which is what happens when the root app/error.tsx is
// the only boundary in the tree (it sits above (main)/layout.tsx).
export default function MainSegmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[client-error]", { message: error.message, digest: error.digest, stack: error.stack });
  }, [error]);

  return (
    <div className="w-full h-full min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-5">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 mb-2">This section couldn't load</h1>
        <p className="text-sm text-slate-500 mb-2">
          Something went wrong loading this page. It has been logged for review.
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-slate-400 mb-6">Incident Ref: {error.digest}</p>
        )}
        {!error.digest && <div className="mb-6" />}
        <button
          type="button"
          onClick={() => reset()}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#98682E] text-white font-semibold text-sm hover:bg-[#98682E]/90 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Try Again
        </button>
      </div>
    </div>
  );
}
