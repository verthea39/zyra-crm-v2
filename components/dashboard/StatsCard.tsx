import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "warning" | "success" | "destructive";
  hint?: string;
}

const toneStyles: Record<NonNullable<StatsCardProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatsCard({ label, value, icon: Icon, tone = "default", hint }: StatsCardProps) {
  return (
    <div className="relative group overflow-hidden rounded-xl border border-border/50 glass-panel p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-border">
      {/* Subtle background glow effect based on tone */}
      <div className={cn("absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity duration-300 group-hover:opacity-40", toneStyles[tone])} />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("rounded-xl p-3 shadow-sm", toneStyles[tone].replace("text-", "bg-opacity-20 text-").replace("/10", "/20"))}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
