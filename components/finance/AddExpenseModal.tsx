"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createExpense } from "@/app/actions/finance";
import { toast } from "sonner";

const expenseSchema = z.object({
  vendor: z.string().min(1, "Vendor / Counterparty is required"),
  category: z.string().min(1, "Category is required"),
  paymentMode: z.string().min(1, "Payment Mode is required"),
  phone: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be positive"),
  amountPaid: z.number().min(0, "Must be positive or zero"),
  issueDate: z.string().min(1, "Issue Date is required"),
  dueDate: z.string().optional(),
  description: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export function AddExpenseModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      vendor: "",
      category: "",
      paymentMode: "",
      phone: "",
      amount: 0,
      amountPaid: 0,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      description: "",
    },
  });

  const amount = form.watch("amount") || 0;
  const amountPaid = form.watch("amountPaid") || 0;
  const balance = Number(amount) - Number(amountPaid);

  async function onSubmit(data: ExpenseFormValues) {
    setIsSubmitting(true);
    const result = await createExpense(data);
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Expense recorded successfully");
      form.reset();
      onOpenChange(false);
    } else {
      toast.error(result.error || "Failed to add expense");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full h-[100dvh] sm:h-auto max-w-full m-0 p-0 sm:p-6 sm:rounded-xl rounded-none flex flex-col overflow-hidden">
        <DialogHeader className="bg-slate-50 border-b border-border text-foreground sm:-m-6 sm:mb-0 p-4 sm:p-6 sm:rounded-t-lg shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plus className="w-5 h-5 text-rose-500" />
            Add New Expense
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Record operational outflow with bi-directional spreadsheet sync.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-4 sm:p-4 space-y-6 flex flex-col">
            
            <div className="flex gap-4 border-b pb-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-rose-50 text-rose-700 ring-2 ring-rose-600  ">
                Expense (Operational Outflow)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Invoice / Ref ID</FormLabel>
                <FormControl>
                  <Input value="Auto-generated (e.g. EXP-2026-019)" disabled className="bg-slate-50" />
                </FormControl>
              </FormItem>

              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor / Counterparty *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. MOHRE Direct, Office Rent, Meta Ads" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Government Pass-through Outflow">Government Pass-through Outflow</SelectItem>
                        <SelectItem value="Office Lease & Rent">Office Lease & Rent</SelectItem>
                        <SelectItem value="Meta Ad Spend">Meta Ad Spend</SelectItem>
                        <SelectItem value="Salaries">Salaries</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paymentMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Mode *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Card">Card</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="p-4 border-2 border-rose-100  rounded-lg bg-rose-50/30  space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-rose-600">Amount (AED) *</FormLabel>
                      <FormControl>
                        <Input type="number" inputMode="decimal" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="border-rose-200 focus-visible:ring-rose-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amountPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paid Amount (AED)</FormLabel>
                      <FormControl>
                        <Input type="number" inputMode="decimal" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Remaining Balance</FormLabel>
                  <FormControl>
                    <Input value={balance.toFixed(2)} disabled className={`font-bold ${balance > 0 ? 'text-rose-600 bg-rose-50' : 'text-slate-600'}`} />
                  </FormControl>
                </FormItem>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice / Issue Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Milestone Reference</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter reference notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="sticky bottom-0 -mx-4 -mb-4 sm:mx-0 sm:mb-0 p-4 bg-white  border-t sm:rounded-lg sm:border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sm:shadow-none mt-auto z-10 pb-safe">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="hidden sm:flex px-4 py-2 rounded-md font-medium text-slate-600 hover:bg-slate-100   transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-md font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors flex justify-center items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Expense
                </button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
