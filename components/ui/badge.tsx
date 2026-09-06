import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Tone = "default" | "warning" | "success" | "destructive" | "muted";

const toneStyles: Record<Tone, string> = {
  default: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function Badge({
  tone = "muted",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        toneStyles[tone],
        className
      )}
      {...props}
    />
  );
}
