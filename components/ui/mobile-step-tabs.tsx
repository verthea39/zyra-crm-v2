"use client";

import { Check } from "lucide-react";

export function MobileStepTabs({
  steps,
  activeStep,
  furthestStep,
  onStepClick,
}: {
  steps: string[];
  activeStep: number;
  furthestStep: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <div className="sm:hidden flex items-center gap-1 px-4 py-3 border-b border-slate-100 overflow-x-auto scrollbar-hide shrink-0">
      {steps.map((label, idx) => {
        const isActive = idx === activeStep;
        const isDone = idx < furthestStep;
        const isReachable = idx <= furthestStep;
        return (
          <button
            key={label}
            type="button"
            disabled={!isReachable}
            onClick={() => isReachable && onStepClick(idx)}
            className={`flex items-center gap-1.5 shrink-0 px-3 h-11 rounded-full text-xs font-semibold transition-all active:scale-95 ${
              isActive
                ? "bg-[#98682E] text-white"
                : isDone
                ? "bg-[#FDF8F0] text-[#98682E] border border-[#EADBC8]"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
              isActive ? "bg-white/20" : isDone ? "bg-[#98682E] text-white" : "bg-slate-200"
            }`}>
              {isDone && !isActive ? <Check className="w-3 h-3" /> : idx + 1}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
