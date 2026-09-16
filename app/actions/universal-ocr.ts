"use server";

import { GoogleGenAI, Type } from "@google/genai";

export type UniversalDocumentType =
  | "PASSPORT"
  | "EMIRATES_ID"
  | "RESIDENCE_VISA"
  | "TRADE_LICENSE"
  | "EJARI"
  | "UNKNOWN";

export type UniversalDocumentFields = {
  documentType: UniversalDocumentType;
  fullName: string | null;
  documentNumber: string | null;
  expiryDate: string | null;
  dob: string | null;
  nationality: string | null;
  companyName: string | null;
  sponsorName: string | null;
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    documentType: {
      type: Type.STRING,
      enum: ["PASSPORT", "EMIRATES_ID", "RESIDENCE_VISA", "TRADE_LICENSE", "EJARI", "UNKNOWN"],
    },
    fullName: { type: Type.STRING, nullable: true },
    documentNumber: { type: Type.STRING, nullable: true },
    expiryDate: { type: Type.STRING, nullable: true, description: "YYYY-MM-DD" },
    dob: { type: Type.STRING, nullable: true, description: "YYYY-MM-DD" },
    nationality: { type: Type.STRING, nullable: true },
    companyName: { type: Type.STRING, nullable: true },
    sponsorName: { type: Type.STRING, nullable: true },
  },
  required: ["documentType"],
};

const PROMPT = `You are a document data extraction engine for a UAE PRO services company. You will be shown an image of ONE of the following document types: a Passport, a UAE Emirates ID, a UAE Residence Visa page/sticker, a UAE Trade License, or an Ejari tenancy contract.

Identify which document type it is, then extract the fields below exactly as printed. Use null for any field that is not present or not legible -- never guess or fabricate a value.

- documentType: one of PASSPORT, EMIRATES_ID, RESIDENCE_VISA, TRADE_LICENSE, EJARI, or UNKNOWN if the image doesn't match any of these.
- fullName: the individual's full name as printed (not applicable for Trade License/Ejari unless a signatory name is clearly the main subject).
- documentNumber: passport number, Emirates ID number, visa file number, trade license number, or Ejari contract number, matching the document type.
- expiryDate: expiry date in YYYY-MM-DD format.
- dob: date of birth in YYYY-MM-DD format (passport/Emirates ID/visa only).
- nationality: nationality as printed.
- companyName: the company/establishment name (Trade License, Ejari, or sponsor company on a residence visa).
- sponsorName: sponsor's name if printed on a residence visa or Emirates ID.

Respond with ONLY the JSON object matching the schema. No extra commentary.`;

export async function parseDocumentWithAI(
  base64Image: string,
  mimeType: string
): Promise<{ success: true; data: UniversalDocumentFields } | { success: false; error: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY is not configured" };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [{ inlineData: { mimeType, data: base64Image } }, { text: PROMPT }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) {
      return { success: false, error: "Empty response from Gemini" };
    }

    const parsed = JSON.parse(text) as UniversalDocumentFields;
    return { success: true, data: parsed };
  } catch (error: any) {
    console.error("Gemini document parse failed:", error);
    return { success: false, error: error?.message || "Failed to parse document with AI" };
  }
}
