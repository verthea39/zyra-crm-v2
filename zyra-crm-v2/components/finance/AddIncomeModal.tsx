"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createIncome } from "@/app/actions/finance";
import { toast } from "sonner";

const incomeSchema = z.object({
  clientName: z.string().min(1, "Client Name is required"),
  category: z.string().min(1, "Category is required"),
  paymentMode: z.string().min(1, "Payment Mode is required"),
  phone: z.string().optional(),
  govFees: z.number().min(0, "Must be positive"),
  serviceFee: z.number().min(0, "Must be positive"),
  amountPaid: z.number().min(0, "Must be positive"),
  issueDate: z.string().min(1, "Issue Date is required"),
  dueDate: z.string().optional(),
  description: z.string().optional(),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

export function AddIncomeModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      clientName: "",
      category: "",
      paymentMode: "",
      phone: "",
      govFees: 0,
      serviceFee: 0,
      amountPaid: 0,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      description: "",
    },
  });

  const govFees = form.watch("govFees") || 0;
  const serviceFee = form.watch("serviceFee") || 0;
  const amountPaid = form.watch("amountPaid") || 0;
  
  const totalBilled = Number(govFees) + Number(serviceFee);
  const outstanding = totalBilled - Number(amountPaid);

  async function onSubmit(data: IncomeFormValues) {
    setIsSubmitting(true);
    const result = await createIncome(data);
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Income recorded successfully");
      form.reset();
      onOpenChange(false);
    } else {
      toast.error(result.error || "Failed to add income");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full h-[100dvh] sm:h-auto max-w-full m-0 p-0 sm:p-6 sm:rounded-xl rounded-none flex flex-col overflow-hidden">
        <DialogHeader className="bg-slate-50 border-b border-border text-foreground sm:-m-6 sm:mb-0 p-4 sm:p-6 sm:rounded-t-lg shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plus className="w-5 h-5 text-emerald-400" />
            Add Income
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Record income invoice, payment received, and automated balance.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-4 sm:p-4 space-y-6 flex flex-col">
            
            <div className="flex gap-4 border-b pb-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-emerald-50 text-emerald-700 ring-2 ring-emerald-600  ">
                Income (Client Inflow)
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-rose-500 border border-rose-200  opacity-50 cursor-not-allowed">
                Expense (Operational Outflow)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Invoice / Ref ID</FormLabel>
                <FormControl>
                  <Input value="Auto-generated (e.g. INV-2026-019)" disabled className="bg-slate-50" />
                </FormControl>
              </FormItem>

              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Client Name" {...field} />
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
                        <SelectItem value="Visa & Immigration Services">Visa & Immigration Services</SelectItem>
                        <SelectItem value="Trade License & Formation">Trade License & Formation</SelectItem>
                        <SelectItem value="MOHRE & Labour">MOHRE & Labour</SelectItem>
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
                      <FormLabel>Client Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone (Optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="p-4 border-2 border-emerald-100  rounded-lg bg-emerald-50/30  space-y-4">
              <h4 className="font-bold text-emerald-800  text-sm tracking-tight">DUAL-BUCKET FINANCIALS</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="govFees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-500">Government Fees (AED) *</FormLabel>
                      <FormControl>
                        <Input type="number" inputMode="decimal" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serviceFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-emerald-600">Zyra Service Fee (AED) *</FormLabel>
                      <FormControl>
                        <Input type="number" inputMode="decimal" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="border-emerald-200 focus-visible:ring-emerald-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-500">Total Billed (AED)</FormLabel>
                  <FormControl>
                    <Input value={totalBilled.toFixed(2)} disabled className="bg-slate-100 font-bold text-slate-900" />
                  </FormControl>
                </FormItem>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <FormField
                  control={form.control}
                  name="amountPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Paid by Client (AED)</FormLabel>
                      <FormControl>
                        <Input type="number" inputMode="decimal" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Outstanding Balance</FormLabel>
                  <FormControl>
                    <Input value={outstanding.toFixed(2)} disabled className={`font-bold ${outstanding > 0 ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`} />
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
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-md font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Income
                </button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
