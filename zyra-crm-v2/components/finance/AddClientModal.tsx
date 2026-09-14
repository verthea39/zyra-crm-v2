"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, User, FileText, Shield, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/app/actions/clients";
import { toast } from "sonner"; // Assuming sonner is used, if not, we can remove it or use native alert for now

const clientSchema = z.object({
  type: z.enum(["INDIVIDUAL", "CORPORATE"]),
  leadSource: z.string().min(1, "Lead Source is required"),
  name: z.string().min(1, "Full Name is required"),
  place: z.string().min(1, "Place is required"),
  phone: z.string().min(1, "Phone number is required"),
  nationality: z.string().min(1, "Nationality is required"),
  visaType: z.string().min(1, "Visa Type is required"),
  passportNo: z.string().optional(),
  passportExpiry: z.string().optional(),
  emiratesIdNo: z.string().optional(),
  tradeLicenseNo: z.string().optional(),
  tradeLicenseExpiry: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export function AddClientModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      type: "INDIVIDUAL",
      leadSource: "",
      name: "",
      place: "",
      phone: "",
      nationality: "",
      visaType: "",
      passportNo: "",
      passportExpiry: "",
      emiratesIdNo: "",
      tradeLicenseNo: "",
      tradeLicenseExpiry: "",
    },
  });

  const clientType = form.watch("type");

  async function onSubmit(data: ClientFormValues) {
    setIsSubmitting(true);
    const result = await createClient(data);
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Client Profile Created Successfully");
      form.reset();
      onOpenChange(false);
    } else {
      toast.error(result.error || "Failed to create client");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-slate-50 border-b border-border text-foreground -mx-6 -mt-6 p-6 rounded-t-lg">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="w-5 h-5 text-blue-400" />
            Add Client Profile
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Separate client registry with full identification, UAE visa, and contact records
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            
            {/* Type Selector Tabs */}
            <div className="flex gap-4 border-b pb-4">
              <button
                type="button"
                onClick={() => form.setValue("type", "INDIVIDUAL")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  clientType === "INDIVIDUAL" 
                    ? "bg-blue-50 text-blue-700 ring-2 ring-blue-600  " 
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <User className="w-4 h-4" />
                Individual Client
              </button>
              <button
                type="button"
                onClick={() => form.setValue("type", "CORPORATE")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  clientType === "CORPORATE" 
                    ? "bg-purple-50 text-purple-700 ring-2 ring-purple-600  " 
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Building2 className="w-4 h-4" />
                Corporate
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="leadSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Source *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Walk-in">Walk-in</SelectItem>
                        <SelectItem value="WhatsApp Ad">WhatsApp Ad</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Meta Ad">Meta Ad</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name (EN) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="place"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Place *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Emirate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Dubai">Dubai</SelectItem>
                        <SelectItem value="Sharjah">Sharjah</SelectItem>
                        <SelectItem value="Ajman">Ajman</SelectItem>
                        <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
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
                    <FormLabel>Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="0555143132" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. UAE, India, UK" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visaType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visa Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Visa Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Employment Visa">Employment Visa</SelectItem>
                        <SelectItem value="Family Visa">Family Visa</SelectItem>
                        <SelectItem value="Golden Visa">Golden Visa</SelectItem>
                        <SelectItem value="Visit Visa">Visit Visa</SelectItem>
                        <SelectItem value="Partner/Investor">Partner/Investor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {clientType === "CORPORATE" && (
              <div className="p-4 border rounded-lg bg-slate-50  space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 ">
                  <Building2 className="w-4 h-4 text-purple-500" />
                  COMPANY DETAILS
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tradeLicenseNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trade License No</FormLabel>
                        <FormControl>
                          <Input placeholder="TL-XXXXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tradeLicenseExpiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trade License Expiry (dd-mm-yyyy)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <div className="p-4 border rounded-lg bg-slate-50  space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 ">
                <FileText className="w-4 h-4 text-blue-500" />
                PASSPORT DETAILS
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="passportNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passport Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Passport No" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passportExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passport Expiry (dd-mm-yyyy)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-slate-50  space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 ">
                <Shield className="w-4 h-4 text-emerald-500" />
                EMIRATES ID DETAILS
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emiratesIdNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emirates ID Number</FormLabel>
                      <FormControl>
                        <Input placeholder="784-XXXX-XXXXXXX-X" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-md font-medium text-slate-600 hover:bg-slate-100   transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Client Profile
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
