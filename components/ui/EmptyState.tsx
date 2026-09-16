import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
};

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, actionHref }: EmptyStateProps) {
  return (
    <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 mx-auto flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description && <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">{description}</p>}
      {actionLabel && (onAction || actionHref) && (
        <div className="mt-5">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#98682E] text-white text-sm font-semibold hover:bg-[#98682E]/90 transition-colors"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#98682E] text-white text-sm font-semibold hover:bg-[#98682E]/90 transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
