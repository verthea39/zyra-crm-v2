"use client";

import { useState, useActionState } from "react";
import { createClient } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewClientPage() {
  const [clientType, setClientType] = useState<"CORPORATE" | "INDIVIDUAL">("INDIVIDUAL");
  const [state, formAction, pending] = useActionState(createClient, null);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">New Client</h1>
        <p className="text-sm text-muted-foreground">
          Create an individual or corporate client master record.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setClientType("INDIVIDUAL")}
          className={`rounded-md border px-4 py-2 text-sm font-medium ${
            clientType === "INDIVIDUAL"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground"
          }`}
        >
          Individual Client
        </button>
        <button
          type="button"
          onClick={() => setClientType("CORPORATE")}
          className={`rounded-md border px-4 py-2 text-sm font-medium ${
            clientType === "CORPORATE"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground"
          }`}
        >
          Corporate Account
        </button>
      </div>

      <form action={formAction}>
        <input type="hidden" name="clientType" value={clientType} />

        {state?.error && (
          <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Lead source</CardTitle>
          </CardHeader>
          <CardContent>
            <Select name="leadSource" defaultValue="WALK_IN">
              <option value="WALK_IN">Walk-in</option>
              <option value="REFERRAL">Referral</option>
              <option value="PORTAL">Portal</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="FIELD_AGENT">Field Agent</option>
              <option value="OTHER">Other</option>
            </Select>
          </CardContent>
        </Card>

        {clientType === "CORPORATE" ? (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Corporate / Company Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Company name (EN)</Label>
                <Input name="companyNameEn" required />
              </div>
              <div>
                <Label>Company name (AR)</Label>
                <Input name="companyNameAr" dir="rtl" />
              </div>
              <div>
                <Label>Trade license number</Label>
                <Input name="tradeLicenseNumber" required />
              </div>
              <div>
                <Label>Trade license expiry</Label>
                <Input type="date" name="tradeLicenseExpiry" />
              </div>
              <div>
                <Label>License type</Label>
                <Select name="licenseType" defaultValue="">
                  <option value="">—</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="INDUSTRIAL">Industrial</option>
                  <option value="FREELANCE">Freelance</option>
                  <option value="TOURISM">Tourism</option>
                </Select>
              </div>
              <div>
                <Label>Issuing authority</Label>
                <Select name="issuingAuthority" defaultValue="DED" required>
                  <option value="DED">DED</option>
                  <option value="DIFC">DIFC</option>
                  <option value="ADGM">ADGM</option>
                  <option value="DMCC">DMCC</option>
                  <option value="MEYDAN">Meydan</option>
                  <option value="SHAMS">Shams</option>
                  <option value="IFZA">IFZA</option>
                  <option value="RAKEZ">RAKEZ</option>
                  <option value="JAFZA">JAFZA</option>
                  <option value="SPC">SPC</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>
              <div>
                <Label>Legal type</Label>
                <Select name="legalType" defaultValue="">
                  <option value="">—</option>
                  <option value="LLC">LLC</option>
                  <option value="SOLE_ESTABLISHMENT">Sole Establishment</option>
                  <option value="FREE_ZONE_ENTITY">Free Zone Entity</option>
                  <option value="CIVIL_COMPANY">Civil Company</option>
                  <option value="BRANCH">Branch</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>
              <div>
                <Label>VAT TRN</Label>
                <Input name="vatTrn" placeholder="15-digit VAT TRN" />
              </div>
              <div>
                <Label>Corporate Tax TRN</Label>
                <Input name="corporateTaxTrn" placeholder="15-digit Corporate Tax TRN" />
              </div>
              <div>
                <Label>Ejari number</Label>
                <Input name="ejariNumber" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Individual / Employee Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Full name (EN)</Label>
                <Input name="fullNameEn" required />
              </div>
              <div>
                <Label>Place</Label>
                <Input name="fullNameAr" />
              </div>
              <div>
                <Label>Passport number</Label>
                <Input name="passportNumber" required />
              </div>
              <div>
                <Label>Nationality</Label>
                <Input name="nationality" required />
              </div>
              <div>
                <Label>Passport expiry</Label>
                <Input type="date" name="passportExpiry" />
              </div>
              <div>
                <Label>Emirates ID number</Label>
                <Input name="emiratesIdNumber" placeholder="784-XXXX-XXXXXXX-X" />
              </div>
              <div>
                <Label>Emirates ID expiry</Label>
                <Input type="date" name="emiratesIdExpiry" />
              </div>
              <div>
                <Label>Visa type</Label>
                <Select name="visaType" defaultValue="">
                  <option value="">—</option>
                  <option value="INVESTOR_PARTNER">Investor / Partner</option>
                  <option value="EMPLOYMENT">Employment</option>
                  <option value="GOLDEN_VISA">Golden Visa</option>
                  <option value="GREEN_VISA">Green Visa</option>
                  <option value="DEPENDENT">Dependent</option>
                  <option value="VISIT">Visit</option>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create Client"}
          </Button>
        </div>
      </form>
    </div>
  );
}
