const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function chunkToWords(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES[n];
  if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;
  return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? " " + chunkToWords(n % 100) : ""}`;
}

function integerToWords(n: number): string {
  if (n === 0) return "Zero";
  const scales: [number, string][] = [
    [1_000_000_000, "Billion"],
    [1_000_000, "Million"],
    [1_000, "Thousand"],
  ];

  let remaining = n;
  const parts: string[] = [];
  for (const [scale, label] of scales) {
    if (remaining >= scale) {
      parts.push(`${chunkToWords(Math.floor(remaining / scale))} ${label}`);
      remaining %= scale;
    }
  }
  if (remaining > 0) parts.push(chunkToWords(remaining));
  return parts.join(" ");
}

/** e.g. 1700.5 -> "One Thousand Seven Hundred Dirhams and Fifty Fils Only" */
export function amountToWordsAED(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.abs(amount) : 0;
  const rounded = Math.round(safeAmount * 100) / 100;
  const dirhams = Math.floor(rounded);
  const fils = Math.round((rounded - dirhams) * 100);

  const dirhamsWords = `${integerToWords(dirhams)} Dirham${dirhams === 1 ? "" : "s"}`;
  if (fils === 0) return `${dirhamsWords} Only`;

  const filsWords = `${integerToWords(fils)} Fils`;
  return `${dirhamsWords} and ${filsWords} Only`;
}
