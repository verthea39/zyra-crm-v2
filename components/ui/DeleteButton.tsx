"use client";

import { useTransition } from "react";
import { Button } from "./button";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteButtonProps {
  onDelete: () => Promise<void>;
  itemName?: string;
}

export function DeleteButton({ onDelete, itemName = "this item" }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${itemName}? This action cannot be undone.`)) {
      startTransition(async () => {
        await onDelete();
      });
    }
  };

  return (
    <Button 
      variant="destructive" 
      size="sm" 
      onClick={handleDelete}
      disabled={isPending}
      className="gap-2"
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      Delete
    </Button>
  );
}
