"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteStaffAction } from "@/app/actions/staff";

export function DeleteStaffButton({ userId, disabled }: { userId: string, disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) {
      startTransition(async () => {
        const result = await deleteStaffAction(userId);
        if (result?.error) {
          alert(result.error);
        }
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={disabled || isPending}
      className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 transition-colors"
      title="Delete Staff"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
