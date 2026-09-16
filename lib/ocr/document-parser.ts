/**
 * Client-side only. Never import this from a server component -- it pulls in
 * tesseract.js (a WASM/worker library) via dynamic import so it never touches
 * the SSR bundle. Callers must always run recognizeText/parseDocumentText
 * from inside a browser event handler.
 */

export type ParsedDocumentKind = "EMIRATES_ID" | "PASSPORT" | "UNKNOWN";

export type ParsedDocumentFields = {
  kind: ParsedDocumentKind;
  fullName?: string;
  documentNumber?: string; // Emirates ID number or Passport number
  nationality?: string;
  dob?: string; // ISO yyyy-mm-dd
  expiryDate?: string; // ISO yyyy-mm-dd
  sex?: string;
  countryCode?: string;
  rawText: string;
};

/** Runs Tesseract OCR on an image/PDF file and returns the raw recognized text. */
export async function recognizeText(
  file: File,
  onProgress?: (status: string, progress: number) => void
): Promise<string> {
  const Tesseract = await import("tesseract.js");
  const { data } = await Tesseract.recognize(file, "eng", {
    logger: (m: { status: string; progress: number }) => {
      if (onProgress) onProgress(m.status, m.progress);
    },
  });
  return data.text;
}

const EID_REGEX = /784-?\d{4}-?\d{7}-?\d{1}/;

function normalizeEid(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 15) return raw;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 14)}-${digits.slice(14)}`;
}

/** Pulls a labeled value from OCR text, e.g. "Nationality: India" or a value on the next line. */
function extractAfterLabel(text: string, labels: RegExp): string | undefined {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(labels);
    if (match) {
      const sameLine = lines[i].slice(match.index! + match[0].length).replace(/^[:\s]+/, "").trim();
      if (sameLine) return sameLine;
      const nextLine = lines[i + 1]?.trim();
      if (nextLine) return nextLine;
    }
  }
  return undefined;
}

function extractDate(text: string, labels: RegExp): string | undefined {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (labels.test(lines[i])) {
      const window = `${lines[i]} ${lines[i + 1] || ""}`;
      const m = window.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
      if (m) return toIsoDate(m[1], m[2], m[3]);
    }
  }
  return undefined;
}

function toIsoDate(day: string, month: string, year: string): string {
  let y = year;
  if (y.length === 2) y = (Number(y) > 50 ? "19" : "20") + y;
  return `${y.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/** MRZ date fields are YYMMDD -- convert with the standard passport-era pivot. */
function mrzDateToIso(yymmdd: string | null | undefined, isExpiry: boolean): string | undefined {
  if (!yymmdd || yymmdd.length !== 6) return undefined;
  const yy = Number(yymmdd.slice(0, 2));
  const mm = yymmdd.slice(2, 4);
  const dd = yymmdd.slice(4, 6);
  // Expiry dates are always future-pivoted; birth dates past-pivoted.
  const century = isExpiry ? (yy < 80 ? "20" : "19") : (yy > new Date().getFullYear() % 100 ? "19" : "20");
  return `${century}${String(yy).padStart(2, "0")}-${mm}-${dd}`;
}

function parseEmiratesId(text: string): ParsedDocumentFields {
  const idMatch = text.match(EID_REGEX);
  const nameRaw = extractAfterLabel(text, /name/i);
  const nationality = extractAfterLabel(text, /nationality/i);
  const expiryDate = extractDate(text, /expiry|exp\.?\s*date/i);
  const dob = extractDate(text, /date of birth|dob/i);

  return {
    kind: "EMIRATES_ID",
    documentNumber: idMatch ? normalizeEid(idMatch[0]) : undefined,
    fullName: nameRaw,
    nationality,
    expiryDate,
    dob,
    rawText: text,
  };
}

/** Finds two adjacent lines that look like a TD3 passport MRZ (44 chars, starts with P<). */
function findMrzLines(text: string): string[] | null {
  const candidates = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, "").toUpperCase())
    .filter((l) => l.length >= 30);

  for (let i = 0; i < candidates.length - 1; i++) {
    if (/^P[A-Z<]/.test(candidates[i]) && /^[A-Z0-9<]+$/.test(candidates[i + 1])) {
      // Pad/truncate to the standard 44-char TD3 line length so minor OCR
      // character drops don't break the checksum-based parser entirely.
      const pad = (l: string) => (l.length >= 44 ? l.slice(0, 44) : l.padEnd(44, "<"));
      return [pad(candidates[i]), pad(candidates[i + 1])];
    }
  }
  return null;
}

async function parsePassport(text: string): Promise<ParsedDocumentFields> {
  const mrzLines = findMrzLines(text);
  if (!mrzLines) {
    return { kind: "UNKNOWN", rawText: text };
  }

  const { parse } = await import("mrz");
  const result = parse(mrzLines, { autocorrect: true });
  const f = result.fields;

  const fullName = [f.firstName, f.lastName].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

  return {
    kind: "PASSPORT",
    documentNumber: f.documentNumber || undefined,
    fullName: fullName || undefined,
    nationality: f.nationality || undefined,
    countryCode: f.issuingState || undefined,
    sex: f.sex || undefined,
    dob: mrzDateToIso(f.birthDate, false),
    expiryDate: mrzDateToIso(f.expirationDate, true),
    rawText: text,
  };
}

/** Detects document type from OCR text and extracts structured fields. */
export async function parseDocumentText(text: string): Promise<ParsedDocumentFields> {
  if (findMrzLines(text)) {
    return parsePassport(text);
  }
  if (EID_REGEX.test(text)) {
    return parseEmiratesId(text);
  }
  return { kind: "UNKNOWN", rawText: text };
}
