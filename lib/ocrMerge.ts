/**
 * Non-destructive merge for OCR scan results into an already-populated form.
 * Scanning a second document (e.g. Emirates ID after Passport) must not wipe
 * out fields the first scan (or the user) already filled in -- each field is
 * only written if it is currently blank.
 */
export type MergeResult<T extends Record<string, any>> = {
  merged: T;
  addedFields: (keyof T)[];
  preservedFields: (keyof T)[];
};

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

/**
 * `updates` maps form field keys to an incoming scanned value (or undefined
 * to skip that field entirely, e.g. a field this document type doesn't carry).
 */
export function mergeScanFields<T extends Record<string, any>>(
  current: T,
  updates: Partial<Record<keyof T, string | null | undefined>>
): MergeResult<T> {
  const merged = { ...current };
  const addedFields: (keyof T)[] = [];
  const preservedFields: (keyof T)[] = [];

  for (const key of Object.keys(updates) as (keyof T)[]) {
    const incoming = updates[key];
    if (isBlank(incoming)) continue;

    if (isBlank(current[key])) {
      merged[key] = incoming as T[keyof T];
      addedFields.push(key);
    } else {
      preservedFields.push(key);
    }
  }

  return { merged, addedFields, preservedFields };
}

/** Builds the "Merged X details: Added A & B. N existing fields preserved." toast copy. */
export function describeScanMerge(documentLabel: string, addedLabels: string[], preservedCount: number): string {
  if (addedLabels.length === 0) {
    return preservedCount > 0
      ? `${documentLabel} scanned -- all ${preservedCount} matching field${preservedCount === 1 ? "" : "s"} already filled, nothing overwritten.`
      : `${documentLabel} scanned -- no new fields detected.`;
  }
  const addedText = addedLabels.length === 1
    ? addedLabels[0]
    : `${addedLabels.slice(0, -1).join(", ")} & ${addedLabels[addedLabels.length - 1]}`;
  const preservedText = preservedCount > 0 ? ` ${preservedCount} existing field${preservedCount === 1 ? "" : "s"} preserved.` : "";
  return `Merged ${documentLabel} details: Added ${addedText}.${preservedText}`;
}
