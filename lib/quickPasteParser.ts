export type ParsedLineItem = {
  description: string;
  price: number;
};

export type QuickPasteResult = {
  clientName: string | null;
  items: ParsedLineItem[];
  skippedLines: string[];
};

const CLIENT_LINE_RE = /^(?:name|client|company|customer)\s*[:=-]\s*(.+)$/i;
const ITEM_LINE_RE = /^(.*?)\s*(?:[-:=]|\s{2,}|\s)\s*(?:AED|DHS)?\s*([0-9]+(?:\.[0-9]{1,2})?)\s*(?:AED|DHS)?\s*$/i;

/** Strip leading bullets/numbering and trailing separators left over after pulling the price off a line. */
function cleanDescription(raw: string): string {
  return raw
    .replace(/^[\s•*\-–—]+/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/[\s:=\-–—]+$/, "")
    .trim();
}

export function parseQuickPasteText(text: string): QuickPasteResult {
  const lines = text.split("\n");
  let clientName: string | null = null;
  const items: ParsedLineItem[] = [];
  const skippedLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const clientMatch = line.match(CLIENT_LINE_RE);
    if (clientMatch) {
      if (!clientName) clientName = clientMatch[1].trim();
      continue;
    }

    const itemMatch = line.match(ITEM_LINE_RE);
    if (itemMatch) {
      const description = cleanDescription(itemMatch[1]);
      const price = parseFloat(itemMatch[2]);
      if (description && Number.isFinite(price) && price >= 0) {
        items.push({ description, price });
        continue;
      }
    }

    skippedLines.push(line);
  }

  return { clientName, items, skippedLines };
}
