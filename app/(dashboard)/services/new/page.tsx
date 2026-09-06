"use client";

import { useActionState, useState } from "react";
import { createServiceTemplateAction } from "@/app/actions/services";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

export default function NewServicePage() {
  const [state, formAction, isPending] = useActionState(createServiceTemplateAction, undefined);
  const [steps, setSteps] = useState([{ id: 1, name: "", description: "" }]);

  const addStep = () => {
    setSteps([...steps, { id: Date.now(), name: "", description: "" }]);
  };

  const removeStep = (id: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter(step => step.id !== id));
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/services" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Create Service Template</h1>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <form action={formAction} className="divide-y divide-border">
          <div className="p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-card-foreground">Template Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="e.g. Golden Visa"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-card-foreground">Category</label>
                <input
                  type="text"
                  name="category"
                  required
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="e.g. VISA_PROCESSING"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-card-foreground">Base Price (AED)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="basePrice"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="e.g. 500.00"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground">Description (Optional)</label>
              <textarea
                name="description"
                rows={2}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Brief description of this service..."
              />
            </div>
          </div>

          <div className="p-6 bg-muted/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-card-foreground">Workflow Steps</h3>
                <p className="text-sm text-muted-foreground">Define the sequence of tasks required for this service.</p>
              </div>
              <button
                type="button"
                onClick={addStep}
                className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <Plus className="size-4" />
                Add Step
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col gap-2 p-3 rounded-md border border-border/50 bg-background/50">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted font-medium text-sm text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        name={`step_${index}_name`}
                        required
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-medium"
                        placeholder={`Step ${index + 1} name...`}
                      />
                      <textarea
                        name={`step_${index}_description`}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
                        placeholder="Description (optional)"
                        rows={1}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStep(step.id)}
                      disabled={steps.length === 1}
                      className="flex size-9 items-center justify-center shrink-0 rounded-md border border-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            {state?.error && (
              <p className="mb-4 text-sm text-red-500 font-medium">{state.error}</p>
            )}

            <div className="flex justify-end gap-3">
              <Link 
                href="/services"
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Creating..." : "Create Template"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
