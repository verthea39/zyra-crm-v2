"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Client } from "@prisma/client";
import { toast } from "sonner";
import { createClient } from "@/app/actions/clients";

export function QuickAddClientModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (client: Client) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [trn, setTrn] = useState("");

  const reset = () => {
    setName("");
    setPhone("");
    setEmail("");
    setTrn("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Full name / company name is required.");
      return;
    }
    setSaving(true);
    try {
      const result = await createClient({
        type: "INDIVIDUAL",
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        tradeLicenseNo: trn.trim() || undefined,
      });
      if (!result.success || !result.client) {
        toast.error(result.error || "Failed to create client.");
        return;
      }
      toast.success(`Client "${result.client.name}" added.`);
      onCreated(result.client);
      reset();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Client</DialogTitle>
          <DialogDescription>Create a client record without leaving this form.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label>Full Name / Company Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ahmed Al Maktoum" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +971 50 123 4567" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. client@email.com" />
          </div>
          <div className="space-y-2">
            <Label>TRN / Tax ID (optional)</Label>
            <Input value={trn} onChange={(e) => setTrn(e.target.value)} placeholder="e.g. 100123456700003" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
