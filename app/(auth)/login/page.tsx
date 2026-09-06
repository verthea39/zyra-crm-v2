"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

import Image from "next/image";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <div className="size-16 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-border/50 bg-black">
            <Image src="/logo-icon.png" alt="Zyra Logo" width={64} height={64} className="object-cover" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-card-foreground text-center">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground text-center">
          ZYRA Documents Clearance CRM
        </p>
        
        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-card-foreground">Email</label>
            <input
              type="email"
              name="email"
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="you@agency.ae"
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

          {state?.error && (
            <p className="text-sm text-red-500 font-medium">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
