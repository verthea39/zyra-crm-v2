"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteServiceTemplateAction } from "@/app/actions/services";

export function DeleteServiceButton({ templateId }: { templateId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this template? This will also remove its step definitions.")) {
      startTransition(async () => {
        const result = await deleteServiceTemplateAction(templateId);
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
      disabled={isPending}
      className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 transition-colors"
      title="Delete Template"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
