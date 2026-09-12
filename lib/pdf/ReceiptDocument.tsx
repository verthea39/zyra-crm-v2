import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";
import { format } from "date-fns";

Font.register({
  family: "Poppins",
  fonts: [
    { src: "https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrJJfedw.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z1xlEA.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7Z1xlEA.ttf", fontWeight: 700 }
  ]
});

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 80, paddingLeft: 45, paddingRight: 45, fontFamily: "Poppins", fontSize: 10, color: "#333" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30, borderBottomWidth: 2, borderBottomColor: "#b68d40", paddingBottom: 15 },
  companyInfo: { flexDirection: "column" },
  title: { fontSize: 24, fontWeight: 700, color: "#b68d40", marginBottom: 5 },
  logo: { width: 180, marginBottom: 12 },
  text: { fontSize: 10, marginBottom: 2, fontWeight: 400 },
  textBold: { fontSize: 10, fontWeight: 600, marginBottom: 2 },
  
  receiptInfoBox: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 25, 
    backgroundColor: "#f8f9fa", 
    padding: 15, 
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0"
  },
  col: { flexDirection: "column", width: "45%" },
  
  amountBox: {
    backgroundColor: "#b68d40",
    padding: 15,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 30,
    color: "#fff"
  },
  amountTitle: { fontSize: 12, fontWeight: 600, marginBottom: 5, color: "#fff" },
  amountValue: { fontSize: 24, fontWeight: 700, color: "#fff" },

  detailsTable: { width: "100%", marginBottom: 30 },
  detailsRow: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
  detailsLabel: { width: "30%", fontWeight: 600, color: "#555" },
  detailsValue: { width: "70%" },
  
  footer: {
    position: "absolute",
    bottom: 30,
    left: 45,
    right: 45,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 10
  },
  footerText: { fontSize: 9, color: "#666", marginBottom: 2 },
  
  signaturesContainer: { flexDirection: "row", justifyContent: "flex-end", marginTop: 60 },
  signatureBox: { width: "40%", borderTopWidth: 1, borderTopColor: "#333", paddingTop: 12, alignItems: "center" },
});

type Props = {
  logoUrl: string;
  receiptNumber: string;
  paymentDate: string;
  clientName: string;
  amount: string;
  paymentMode: string;
  chequeNo?: string;
  notes?: string;
  companyName: string;
  companyTrn: string;
  companyAddress: string;
};

export default function ReceiptDocument({
  logoUrl,
  receiptNumber,
  paymentDate,
  clientName,
  amount,
  paymentMode,
  chequeNo,
  notes,
  companyName,
  companyTrn,
  companyAddress
}: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Image src={logoUrl} style={styles.logo} />
            <Text style={styles.textBold}>{companyName}</Text>
            <Text style={styles.text}>{companyAddress}</Text>
            <Text style={styles.text}>TRN: {companyTrn}</Text>
          </View>
          <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
            <Text style={styles.title}>PAYMENT RECEIPT</Text>
            <Text style={styles.textBold}>Receipt #: {receiptNumber}</Text>
            <Text style={styles.text}>Date: {paymentDate}</Text>
          </View>
        </View>

        {/* Big Amount Box */}
        <View style={styles.amountBox}>
          <Text style={styles.amountTitle}>AMOUNT RECEIVED</Text>
          <Text style={styles.amountValue}>AED {amount}</Text>
        </View>

        {/* Details Table */}
        <View style={styles.detailsTable}>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Received From:</Text>
            <Text style={styles.detailsValue}>{clientName}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Payment Mode:</Text>
            <Text style={styles.detailsValue}>{paymentMode}</Text>
          </View>
          {chequeNo && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Cheque/Ref No:</Text>
              <Text style={styles.detailsValue}>{chequeNo}</Text>
            </View>
          )}
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Remarks:</Text>
            <Text style={styles.detailsValue}>{notes || "Payment received with thanks."}</Text>
          </View>
        </View>

        {/* Signature */}
        <View style={styles.signaturesContainer}>
          <View style={styles.signatureBox}>
            <Text style={styles.textBold}>Authorized Signatory</Text>
            <Text style={styles.text}>{companyName}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business!</Text>
          <Text style={styles.footerText}>This is a computer-generated receipt and does not require a physical signature.</Text>
        </View>
      </Page>
    </Document>
  );
}
