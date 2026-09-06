import QRCode from "qrcode";

export type QRData = {
  sellerName: string;
  trn: string;
  timestampIso: string;
  totalWithVat: number;
  vatAmount: number;
};

// FTA TLV format for e-receipts/invoices
function toTlv(tag: number, value: string): Buffer {
  const valueBuffer = Buffer.from(value, "utf8");
  const tagBuffer = Buffer.from([tag]);
  const lengthBuffer = Buffer.from([valueBuffer.length]);
  return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]);
}

export async function buildInvoiceQrDataUrl(data: QRData): Promise<string> {
  const tlvs = [
    toTlv(1, data.sellerName),
    toTlv(2, data.trn),
    toTlv(3, data.timestampIso),
    toTlv(4, data.totalWithVat.toFixed(2)),
    toTlv(5, data.vatAmount.toFixed(2)),
  ];

  const combined = Buffer.concat(tlvs);
  const base64String = combined.toString("base64");

  return QRCode.toDataURL(base64String, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 250,
  });
}
