import { NextRequest, NextResponse } from "next/server";
import { getQuotation } from "@/lib/actions/quotations";
import { calculateInvoiceTotals } from "@/lib/invoice-utils";

function numberToWordsAED(amount: number): string {
  // A very basic English number to words converter for AED (just a placeholder since a full one is complex)
  // For production, a proper library like `number-to-words` should be used.
  return `Amount ${amount} UAE Dirhams`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const quotation = await getQuotation(id);

  if (!quotation) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  const totals = calculateInvoiceTotals(quotation.lineItems.map(item => ({
    type: item.type,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPriceMinor) / 100,
  })));

  const disbursements = quotation.lineItems
    .filter(li => li.type === "GOVERNMENT_CHARGE")
    .map((li, idx) => ({
      id: idx + 1,
      authority: "OTHER", // Defaulting to OTHER as we don't store authority yet
      description: li.description,
      voucherRef: li.govReceiptRef || "",
      amount: (Number(li.unitPriceMinor) / 100) * Number(li.quantity),
    }));

  const services = quotation.lineItems
    .filter(li => li.type === "AGENCY_SERVICE_FEE")
    .map((li, idx) => {
      const up = Number(li.unitPriceMinor) / 100;
      const qty = Number(li.quantity);
      return {
        id: idx + 1,
        description: li.description,
        quantity: qty,
        unitPrice: up,
        vatRatePercent: 5.0,
        vatAmount: (up * qty * 0.05),
        totalAmount: (up * qty * 1.05),
      };
    });

  const issueDateStr = quotation.createdAt.toISOString().split("T")[0];

  const jsonPayload = {
    documentType: "QUOTATION",
    documentNumber: quotation.reference,
    issueDate: issueDateStr,
    dueDate: issueDateStr,
    referenceNumber: quotation.reference,
    currency: "AED",
    issuer: {
      companyName: "ZYRA Documents Clearance Services",
      tradeLicenseNo: "1234567",
      trn: process.env.COMPANY_TRN ?? "100000000000003",
      address: {
        unit: "Shop / Office G-12",
        building: "Burj Nahar Mall",
        area: "Al Muteena, Deira",
        city: "Dubai",
        country: "United Arab Emirates"
      },
      phones: [
        "+971 54 782 4637",
        "+971 50 722 8583"
      ],
      email: "zyrabusinesshub@gmail.com",
      website: "https://zyrabusinesshub.com"
    },
    client: {
      name: quotation.client.corporateProfile?.companyNameEn ?? quotation.client.individualProfile?.fullNameEn ?? "Unknown Client",
      contactPerson: quotation.client.corporateProfile?.authorizedSignatoryName ?? quotation.client.individualProfile?.fullNameEn ?? "Contact",
      trn: quotation.client.corporateProfile?.vatTrn ?? "UNREGISTERED",
      phone: quotation.client.corporateProfile?.authorizedSignatoryMobile ?? "N/A",
      email: quotation.client.corporateProfile?.authorizedSignatoryEmail ?? "N/A",
      address: {
        unit: "",
        building: "",
        area: "",
        city: "Dubai",
        country: "United Arab Emirates"
      }
    },
    disbursements,
    services,
    totals: {
      totalDisbursements: totals.subtotalGovDisbursements,
      totalServicesExclusive: totals.subtotalServiceFees,
      totalVat: totals.vatAmount,
      grandTotal: totals.totalPayable,
      paidAdvance: 0,
      balanceDue: totals.totalPayable,
      amountInWords: numberToWordsAED(totals.totalPayable)
    },
    bankDetails: {
      bankName: "Emirates NBD",
      accountName: "ZYRA DOCUMENTS CLEARANCE SERVICES",
      accountNumber: "1012345678901",
      iban: "AE230260001012345678901",
      swiftCode: "EBILAEADXXX"
    },
    termsAndConditions: [
      "Disbursement fees paid to government bodies (DED, GDRFA, MOHRE) are non-refundable once processed.",
      "Official receipt vouchers will be attached along with the settlement invoice upon task completion.",
      "Any variance in actual government tariffs will be credited or debited on the final closing invoice."
    ]
  };

  return NextResponse.json(jsonPayload, { status: 200 });
}
