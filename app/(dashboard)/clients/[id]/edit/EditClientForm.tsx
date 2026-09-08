"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FormState = { error?: string } | null;

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function EditClientForm({
  client,
  sponsors,
  action,
}: {
  client: any;
  sponsors: { id: string; companyNameEn: string }[];
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const corp = client.corporateProfile;
  const ind = client.individualProfile;
  const isCorporate = client.clientType === "CORPORATE";

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Lead source</Label>
            <Select name="leadSource" defaultValue={client.leadSource}>
              <option value="WALK_IN">Walk-in</option>
              <option value="REFERRAL">Referral</option>
              <option value="PORTAL">Portal</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="FIELD_AGENT">Field Agent</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
          <div>
            <Label>Account status</Label>
            <Select name="accountStatus" defaultValue={client.accountStatus}>
              <option value="ACTIVE">Active</option>
              <option value="PROSPECT">Prospect</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </div>
          <div>
            <Label>Client code</Label>
            <Input name="code" defaultValue={client.code ?? ""} placeholder="ZC-0001" />
          </div>
          <div>
            <Label>VAT TRN</Label>
            <Input name="trn" defaultValue={client.trn ?? ""} />
          </div>
          <div className="sm:col-span-2">
            <Label>Notes</Label>
            <Textarea name="notes" rows={3} defaultValue={client.notes ?? ""} />
          </div>
        </CardContent>
      </Card>

      {isCorporate ? (
        <Card>
          <CardHeader>
            <CardTitle>Corporate / Company Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Company name (EN)</Label>
              <Input name="companyNameEn" defaultValue={corp?.companyNameEn ?? ""} required />
            </div>
            <div>
              <Label>Company name (AR)</Label>
              <Input name="companyNameAr" dir="rtl" defaultValue={corp?.companyNameAr ?? ""} />
            </div>
            <div>
              <Label>Trade license number</Label>
              <Input
                name="tradeLicenseNumber"
                defaultValue={corp?.tradeLicenseNumber ?? ""}
                required
              />
            </div>
            <div>
              <Label>Trade license expiry</Label>
              <Input
                type="date"
                name="tradeLicenseExpiry"
                defaultValue={toDateInput(corp?.tradeLicenseExpiry)}
              />
            </div>
            <div>
              <Label>License type</Label>
              <Select name="licenseType" defaultValue={corp?.licenseType ?? ""}>
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
              <Select
                name="issuingAuthority"
                defaultValue={corp?.issuingAuthority ?? "DED"}
                required
              >
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
              <Select name="legalType" defaultValue={corp?.legalType ?? ""}>
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
              <Input name="vatTrn" defaultValue={corp?.vatTrn ?? ""} placeholder="15-digit VAT TRN" />
            </div>
            <div>
              <Label>Corporate Tax TRN</Label>
              <Input
                name="corporateTaxTrn"
                defaultValue={corp?.corporateTaxTrn ?? ""}
                placeholder="15-digit Corporate Tax TRN"
              />
            </div>
            <div>
              <Label>Ejari number</Label>
              <Input name="ejariNumber" defaultValue={corp?.ejariNumber ?? ""} />
            </div>
            <div>
              <Label>Ejari expiry</Label>
              <Input type="date" name="ejariExpiry" defaultValue={toDateInput(corp?.ejariExpiry)} />
            </div>
            <div>
              <Label>Establishment card (IMM) number</Label>
              <Input
                name="establishmentCardImmNumber"
                defaultValue={corp?.establishmentCardImmNumber ?? ""}
              />
            </div>
            <div>
              <Label>Establishment card (IMM) expiry</Label>
              <Input
                type="date"
                name="establishmentCardImmExpiry"
                defaultValue={toDateInput(corp?.establishmentCardImmExpiry)}
              />
            </div>
            <div>
              <Label>Establishment card (MOHRE) number</Label>
              <Input
                name="establishmentCardMohreNumber"
                defaultValue={corp?.establishmentCardMohreNumber ?? ""}
              />
            </div>
            <div>
              <Label>Establishment card (MOHRE) expiry</Label>
              <Input
                type="date"
                name="establishmentCardMohreExpiry"
                defaultValue={toDateInput(corp?.establishmentCardMohreExpiry)}
              />
            </div>
            <div>
              <Label>Authorized signatory name</Label>
              <Input
                name="authorizedSignatoryName"
                defaultValue={corp?.authorizedSignatoryName ?? ""}
              />
            </div>
            <div>
              <Label>Authorized signatory passport</Label>
              <Input
                name="authorizedSignatoryPassport"
                defaultValue={corp?.authorizedSignatoryPassport ?? ""}
              />
            </div>
            <div>
              <Label>Authorized signatory Emirates ID</Label>
              <Input
                name="authorizedSignatoryEid"
                defaultValue={corp?.authorizedSignatoryEid ?? ""}
              />
            </div>
            <div>
              <Label>Authorized signatory mobile</Label>
              <Input
                name="authorizedSignatoryMobile"
                defaultValue={corp?.authorizedSignatoryMobile ?? ""}
              />
            </div>
            <div>
              <Label>Authorized signatory email</Label>
              <Input
                type="email"
                name="authorizedSignatoryEmail"
                defaultValue={corp?.authorizedSignatoryEmail ?? ""}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Individual / Employee Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Full name (EN)</Label>
              <Input name="fullNameEn" defaultValue={ind?.fullNameEn ?? ""} required />
            </div>
            <div>
              <Label>Full name (AR)</Label>
              <Input name="fullNameAr" dir="rtl" defaultValue={ind?.fullNameAr ?? ""} />
            </div>
            <div>
              <Label>Passport number</Label>
              <Input name="passportNumber" defaultValue={ind?.passportNumber ?? ""} required />
            </div>
            <div>
              <Label>Nationality</Label>
              <Input name="nationality" defaultValue={ind?.nationality ?? ""} required />
            </div>
            <div>
              <Label>Passport expiry</Label>
              <Input
                type="date"
                name="passportExpiry"
                defaultValue={toDateInput(ind?.passportExpiry)}
              />
            </div>
            <div>
              <Label>Emirates ID number</Label>
              <Input
                name="emiratesIdNumber"
                defaultValue={ind?.emiratesIdNumber ?? ""}
                placeholder="784-XXXX-XXXXXXX-X"
              />
            </div>
            <div>
              <Label>Emirates ID expiry</Label>
              <Input
                type="date"
                name="emiratesIdExpiry"
                defaultValue={toDateInput(ind?.emiratesIdExpiry)}
              />
            </div>
            <div>
              <Label>Unified ID number</Label>
              <Input name="unifiedIdNumber" defaultValue={ind?.unifiedIdNumber ?? ""} />
            </div>
            <div>
              <Label>Visa type</Label>
              <Select name="visaType" defaultValue={ind?.visaType ?? ""}>
                <option value="">—</option>
                <option value="INVESTOR_PARTNER">Investor / Partner</option>
                <option value="EMPLOYMENT">Employment</option>
                <option value="GOLDEN_VISA">Golden Visa</option>
                <option value="GREEN_VISA">Green Visa</option>
                <option value="DEPENDENT">Dependent</option>
                <option value="VISIT">Visit</option>
              </Select>
            </div>
            <div>
              <Label>Visa expiry</Label>
              <Input type="date" name="visaExpiry" defaultValue={toDateInput(ind?.visaExpiry)} />
            </div>
            <div>
              <Label>Sponsor company</Label>
              <Select name="sponsorCompanyId" defaultValue={ind?.sponsorCompanyId ?? ""}>
                <option value="">—</option>
                {sponsors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyNameEn}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
