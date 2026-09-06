"use client";

import { useActionState } from "react";
import { createStaffAction } from "@/app/actions/staff";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewStaffPage() {
  const [state, formAction, isPending] = useActionState(createStaffAction, undefined);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/staff" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Add New Staff</h1>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <form action={formAction} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-card-foreground">Full Name</label>
            <input
              type="text"
              name="name"
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="John Doe"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-card-foreground">Email</label>
            <input
              type="email"
              name="email"
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="john@agency.ae"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-card-foreground">Password</label>
            <input
              type="password"
              name="password"
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-card-foreground">Role</label>
            <select
              name="role"
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="OPERATIONS_MANAGER">Operations Manager</option>
              <option value="PRO_AGENT">PRO Agent</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>

          {state?.error && (
            <p className="text-sm text-red-500 font-medium">{state.error}</p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Link 
              href="/staff"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Saving..." : "Save Staff Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
