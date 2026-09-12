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
  page: { paddingTop: 30, paddingBottom: 80, paddingLeft: 45, paddingRight: 45, fontFamily: "Poppins", fontSize: 9, color: "#333" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  companyInfo: { flexDirection: "column" },
  title: { fontSize: 20, fontWeight: 700, color: "#b68d40", marginBottom: 2 },
  logo: { width: 220, marginBottom: 12 },
  text: { fontSize: 9, marginBottom: 1, fontWeight: 400 },
  textBold: { fontSize: 9, fontWeight: 600, marginBottom: 1 },
  iconRow: { flexDirection: "row", marginBottom: 2 },
  iconWrap: { width: 12, marginRight: 4, paddingTop: 1, alignItems: "center" },
  
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
  
  totalsContainer: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  totalsBox: { width: "50%" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalsRowBold: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderTopWidth: 1, borderTopColor: "#b68d40", marginTop: 2 },
  
  sectionTitle: { fontSize: 9, fontWeight: 700, color: "#b68d40", marginTop: 10, marginBottom: 3, textTransform: "uppercase" },
  listItem: { fontSize: 8, marginBottom: 2, marginLeft: 10 },
  
  signaturesContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 50 },
  signatureBox: { width: "40%", borderTopWidth: 1, borderTopColor: "#333", paddingTop: 12, alignItems: "center" },
});

export type QuotationPdfLineItem = {
  description: string;
  type: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
  lineTotal: string;
  govReceiptRef?: string | null;
};

type Props = {
  logoUrl: string;
  quotationNumber: string;
  issueDate: string;
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
  customerPhone?: string;
  customerEmail?: string;
  lineItems: QuotationPdfLineItem[];
  subtotalServiceFees: string;
  vatAmount: string;
  subtotalGovDisbursements: string;
  totalPayable: string;
};

export const QuotationDocument = (props: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          {props.logoUrl && <Image style={styles.logo} src={props.logoUrl} />}
          <Text style={{ fontSize: 10, fontWeight: 600, color: "#555" }}>TRN: {props.supplierTrn}</Text>
        </View>
      </View>

      <View style={styles.invoiceInfo}>
        <View style={styles.col}>
          <Text style={{ fontSize: 10, color: "#777", marginBottom: 4 }}>CLIENT DETAILS</Text>
          <Text style={styles.textBold}>{props.customerName}</Text>
          {props.customerContact && <Text style={styles.text}>Contact: {props.customerContact}</Text>}
          {props.customerPhone && <Text style={styles.text}>Phone: {props.customerPhone}</Text>}
          {props.customerEmail && <Text style={styles.text}>Email: {props.customerEmail}</Text>}
          {props.customerTrn && <Text style={styles.text}>TRN: {props.customerTrn}</Text>}
        </View>
        <View style={styles.col}>
          <Text style={{ fontSize: 10, color: "#777", marginBottom: 4 }}>QUOTATION DETAILS</Text>
          <Text style={styles.text}>Quote No: {props.quotationNumber}</Text>
          <Text style={styles.text}>Date: {props.issueDate}</Text>
          <Text style={styles.text}>Valid Until: 14 Days from issue</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>SCOPE OF SERVICES & COST BREAKDOWN</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.textBold, styles.col1]}>Description</Text>
          <Text style={[styles.textBold, styles.col2]}>Qty</Text>
          <Text style={[styles.textBold, styles.col3]}>Unit Price</Text>
          <Text style={[styles.textBold, styles.col4]}>Total ({props.currency})</Text>
        </View>

        {props.lineItems.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <View style={styles.col1}>
              <Text style={styles.text}>{item.description}</Text>
            </View>
            <Text style={[styles.text, styles.col2]}>{item.quantity}</Text>
            <Text style={[styles.text, styles.col3]}>{item.unitPrice}</Text>
            <Text style={[styles.text, styles.col4]}>{item.lineTotal}</Text>
          </View>
        ))}
      </View>

      <View style={styles.totalsContainer}>
        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={styles.text}>Total Govt Fees (0% VAT):</Text>
            <Text style={styles.text}>{props.subtotalGovDisbursements}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.text}>Total Service Charges:</Text>
            <Text style={styles.text}>{props.subtotalServiceFees}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.text}>VAT on Services (5%):</Text>
            <Text style={styles.text}>{props.vatAmount}</Text>
          </View>
          
          <View style={styles.totalsRowBold}>
            <Text style={styles.textBold}>GRAND TOTAL ({props.currency}):</Text>
            <Text style={styles.textBold}>{props.totalPayable}</Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 15 }}>
        <View style={{ width: "45%" }}>
          <Text style={styles.sectionTitle}>TERMS & CONDITIONS:</Text>
          <Text style={styles.listItem}>1. Government fees are billed at actual cost and are non-refundable once submitted.</Text>
          <Text style={styles.listItem}>2. Any sudden changes or revisions in official government tariffs will be adjusted on the final invoice.</Text>
          <Text style={styles.listItem}>3. 100% of the estimated government fees plus 50% of the service charges are payable in advance to initiate applications.</Text>
          <Text style={styles.listItem}>4. Client is responsible for the provision and accuracy of all required legal documents.</Text>
        </View>

        <View style={{ width: "50%" }}>
          {/* Bank details removed per request */}
        </View>
      </View>

    <View style={styles.signaturesContainer}>
        <View style={styles.signatureBox}>
          <Text style={styles.textBold}>Authorized Signatory</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.textBold}>Client Approval</Text>
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
