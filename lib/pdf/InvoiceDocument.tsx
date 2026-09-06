import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";

import { PhoneIcon, MailIcon, GlobeIcon, MapPinIcon, BuildingIcon } from "./icons";

Font.register({
  family: "Poppins",
  fonts: [
    { src: "https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrJJfedw.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z1xlEA.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7Z1xlEA.ttf", fontWeight: 700 }
  ]
});

const styles = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 30, paddingLeft: 45, paddingRight: 45, fontFamily: "Poppins", fontSize: 9, color: "#333" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  companyInfo: { flexDirection: "column" },
  title: { fontSize: 20, fontWeight: 700, color: "#b68d40", marginBottom: 2 },
  logo: { width: 220, marginBottom: 12 },
  text: { fontSize: 9, marginBottom: 1, fontWeight: 400 },
  textBold: { fontSize: 9, fontWeight: 600, marginBottom: 1 },
  iconRow: { flexDirection: "row", marginBottom: 2 },
  iconWrap: { width: 12, marginRight: 4, paddingTop: 1, alignItems: "center" },
  qrContainer: { width: 90, height: 90 },
  
  footer: {
    position: "absolute",
    bottom: 25,
    left: 45,
    right: 45,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 10
  },
  footerCol: {
    flexDirection: "row",
    alignItems: "center",
    width: "32%"
  },
  footerIcon: {
    width: 16,
    marginRight: 6
  },
  footerText: {
    fontSize: 9,
    fontWeight: 600,
    color: "#444",
    marginBottom: 1
  },
  
  invoiceInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15, backgroundColor: "#f8f9fa", padding: 10, borderRadius: 4 },
  col: { flexDirection: "column", width: "45%" },
  
  table: { width: "100%", marginBottom: 10 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#b68d40", paddingBottom: 3, marginBottom: 3 },
  tableRow: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: "#eee" },
  col1: { width: "50%" },
  col2: { width: "15%", textAlign: "center" },
  col3: { width: "15%", textAlign: "right" },
  col4: { width: "20%", textAlign: "right" },
  
  totalsContainer: { flexDirection: "row", justifyContent: "flex-end", marginTop: 5 },
  totalsBox: { width: "50%" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalsRowBold: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderTopWidth: 1, borderTopColor: "#b68d40", marginTop: 2 },
  
  sectionTitle: { fontSize: 9, fontWeight: 700, color: "#b68d40", marginTop: 10, marginBottom: 3, textTransform: "uppercase" },
  
  signaturesContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 50 },
  signatureBox: { width: "40%", borderTopWidth: 1, borderTopColor: "#333", paddingTop: 12, alignItems: "center" },
});

export type InvoicePdfLineItem = {
  description: string;
  type: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
  lineTotal: string;
  govReceiptRef?: string | null;
};

type Props = {
  documentType?: "TAX INVOICE" | "QUOTATION";
  logoUrl: string;
  invoiceNumber: string;
  issueDate: string;
  supplyDate: string;
  currency: string;
  supplierName: string;
  supplierAddress: string;
  supplierPhone: string;
  supplierEmail: string;
  supplierWeb: string;
  supplierTrn: string;
  customerName: string;
  customerTrn: string | null;
  customerContact?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  lineItems: InvoicePdfLineItem[];
  subtotalServiceFees: string;
  vatAmount: string;
  subtotalGovDisbursements: string;
  totalPayable: string;
  paidAmount: string;
  balanceDue: string;
  qrDataUrl: string;
  quotationReference?: string | null;
  amountInWords?: string;
};

export const InvoiceDocument = (props: Props) => {
  const govtItems = props.lineItems.filter((i) => i.type === "GOVERNMENT_CHARGE");
  const serviceItems = props.lineItems.filter((i) => i.type === "AGENCY_SERVICE_FEE");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            {props.logoUrl && <Image style={styles.logo} src={props.logoUrl} />}
            <Text style={{ fontSize: 10, fontWeight: 600, color: "#555" }}>TRN: {props.supplierTrn}</Text>
          </View>
          <View style={styles.qrContainer}>
            {props.qrDataUrl && <Image src={props.qrDataUrl} />}
          </View>
        </View>

        <View style={styles.invoiceInfo}>
          <View style={styles.col}>
            <Text style={{ fontSize: 10, color: "#777", marginBottom: 4 }}>BILLED TO</Text>
            <Text style={styles.textBold}>{props.customerName}</Text>
            {props.customerContact && <Text style={styles.text}>Contact: {props.customerContact}</Text>}
            {props.customerAddress && <Text style={styles.text}>Address: {props.customerAddress}</Text>}
            {(props.customerPhone || props.customerEmail) && <Text style={styles.text}>Phone / Email: {props.customerPhone} | {props.customerEmail}</Text>}
            <Text style={styles.text}>Customer TRN: {props.customerTrn || "Unregistered"}</Text>
          </View>
          <View style={styles.col}>
            <Text style={{ fontSize: 10, color: "#777", marginBottom: 4 }}>
              INVOICE DETAILS
            </Text>
            <Text style={styles.text}>Invoice No: {props.invoiceNumber}</Text>
            <Text style={styles.text}>Date: {props.issueDate}</Text>
            {props.quotationReference && <Text style={styles.text}>Reference: Quote # {props.quotationReference}</Text>}
            <Text style={styles.text}>Payment Due: Upon Receipt</Text>
          </View>
        </View>

        {/* PART A: GOVERNMENT DISBURSEMENTS */}
        {govtItems.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>PART A: GOVERNMENT DISBURSEMENTS (Zero-Rated / Out of Scope of VAT)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.textBold, styles.col1]}>Official Fee Item</Text>
                <Text style={[styles.textBold, styles.col2, { width: "30%" }]}>Voucher/Ref #</Text>
                <Text style={[styles.textBold, styles.col4]}>Amount ({props.currency})</Text>
              </View>
              {govtItems.map((item, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.text, styles.col1]}>{item.description}</Text>
                  <Text style={[styles.text, styles.col2, { width: "30%" }]}>{item.govReceiptRef || "-"}</Text>
                  <Text style={[styles.text, styles.col4]}>{item.lineTotal}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <Text style={[styles.textBold, { width: "50%", textAlign: "right", paddingRight: 40 }]}>Subtotal (Govt Fees):</Text>
              <Text style={styles.textBold}>{props.currency} {props.subtotalGovDisbursements}</Text>
            </View>
          </View>
        )}

        {/* PART B: PROFESSIONAL SERVICES */}
        {serviceItems.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>PART B: PROFESSIONAL SERVICES (Subject to Standard 5% UAE VAT)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.textBold, styles.col1]}>Service Description</Text>
                <Text style={[styles.textBold, styles.col2, { width: "10%" }]}>Qty</Text>
                <Text style={[styles.textBold, styles.col3]}>Unit ({props.currency})</Text>
                <Text style={[styles.textBold, styles.col3]}>VAT (5%)</Text>
                <Text style={[styles.textBold, styles.col4, { width: "10%" }]}>Total ({props.currency})</Text>
              </View>
              {serviceItems.map((item, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.text, styles.col1]}>{item.description}</Text>
                  <Text style={[styles.text, styles.col2, { width: "10%" }]}>{item.quantity}</Text>
                  <Text style={[styles.text, styles.col3]}>{item.unitPrice}</Text>
                  <Text style={[styles.text, styles.col3]}>{((parseFloat(item.unitPrice.replace(/,/g, "")) * parseFloat(item.quantity) * 0.05).toFixed(2))}</Text>
                  <Text style={[styles.text, styles.col4, { width: "10%" }]}>{item.lineTotal}</Text>
                </View>
              ))}
            </View>
            
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <View style={{ width: "60%" }}>
                <View style={styles.totalsRow}>
                  <Text style={[styles.text, { textAlign: "right", paddingRight: 40 }]}>Subtotal (Services):</Text>
                  <Text style={styles.text}>{props.currency} {props.subtotalServiceFees}</Text>
                </View>
                <View style={styles.totalsRow}>
                  <Text style={[styles.text, { textAlign: "right", paddingRight: 40 }]}>Total VAT Amount (5%):</Text>
                  <Text style={styles.text}>{props.currency} {props.vatAmount}</Text>
                </View>
                <View style={[styles.totalsRow, { borderTopWidth: 1, borderTopColor: "#eee", marginTop: 4, paddingTop: 4 }]}>
                  <Text style={[styles.textBold, { textAlign: "right", paddingRight: 40 }]}>Subtotal (Part B):</Text>
                  <Text style={styles.textBold}>{props.currency} {(parseFloat(props.subtotalServiceFees.replace(/,/g, "")) + parseFloat(props.vatAmount.replace(/,/g, ""))).toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
          <View style={{ width: "45%" }}>
            <Text style={styles.sectionTitle}>PAYMENT DETAILS:</Text>
            <Text style={styles.text}>Beneficiary Name: ZYRA DOCUMENTS CLEARANCE SERVICES</Text>
            <Text style={styles.text}>Bank Name: Emirates NBD</Text>
            <Text style={styles.text}>Account Number: 1012345678901</Text>
            <Text style={styles.text}>IBAN: AE230260001012345678901</Text>
            
            {props.amountInWords && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.text}>Amount in Words: {props.amountInWords}</Text>
              </View>
            )}
          </View>

          <View style={{ width: "50%" }}>
            <Text style={styles.sectionTitle}>SUMMARY:</Text>
            <View style={styles.totalsRow}>
              <Text style={styles.text}>Total Disbursements (Part A):</Text>
              <Text style={styles.text}>{props.currency} {props.subtotalGovDisbursements}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.text}>Total Professional Services (Part B):</Text>
              <Text style={styles.text}>{props.currency} {(parseFloat(props.subtotalServiceFees.replace(/,/g, "")) + parseFloat(props.vatAmount.replace(/,/g, ""))).toFixed(2)}</Text>
            </View>
            <View style={styles.totalsRowBold}>
              <Text style={styles.textBold}>TOTAL AMOUNT DUE:</Text>
              <Text style={styles.textBold}>{props.currency} {props.totalPayable}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.text}>Advance Received:</Text>
              <Text style={styles.text}>{props.currency} {props.paidAmount}</Text>
            </View>
            <View style={styles.totalsRowBold}>
              <Text style={styles.textBold}>BALANCE PAYABLE:</Text>
              <Text style={styles.textBold}>{props.currency} {props.balanceDue}</Text>
            </View>
          </View>
        </View>

        <View style={styles.signaturesContainer}>
          <View style={styles.signatureBox}>
            <Text style={styles.textBold}>Client Signature & Stamp</Text>
            <Text style={{ fontSize: 8, color: "#777", marginTop: 2 }}>Received in Good Order</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.textBold}>Authorized Signatory / Stamp</Text>
            <Text style={{ fontSize: 8, color: "#777", marginTop: 2 }}>For ZYRA Documents Clearance Services</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <View style={styles.footerCol}>
            <View style={styles.footerIcon}><PhoneIcon /></View>
            <View style={{ flexDirection: "column" }}>
              <Text style={styles.footerText}>{props.supplierPhone.split(' / ')[0]}</Text>
              <Text style={styles.footerText}>{props.supplierPhone.split(' / ')[1] || props.supplierPhone.split(' / ')[0]}</Text>
            </View>
          </View>

          <View style={styles.footerCol}>
            <View style={styles.footerIcon}><MapPinIcon /></View>
            <View style={{ flexDirection: "column" }}>
              <Text style={styles.footerText}>Burj Nahar Mall - Al Muteena</Text>
              <Text style={styles.footerText}>Deira, Dubai</Text>
            </View>
          </View>

          <View style={styles.footerCol}>
            <View style={styles.footerIcon}><MailIcon /></View>
            <View style={{ flexDirection: "column" }}>
              <Text style={styles.footerText}>{props.supplierEmail}</Text>
              <Text style={styles.footerText}>{props.supplierWeb}</Text>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  );
};
