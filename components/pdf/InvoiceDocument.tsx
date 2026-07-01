import React from "react";
import { Page, Text, View, StyleSheet, Document } from "@react-pdf/renderer";
import { format } from "date-fns";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#334155", // slate-700
    lineHeight: 1.5,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb", // blue-600
    paddingBottom: 15,
    marginBottom: 25,
  },
  companyLogoText: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af", // blue-800
  },
  companySub: {
    fontSize: 8,
    color: "#64748b", // slate-500
    marginTop: 2,
  },
  invoiceTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a", // slate-900
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 10,
    color: "#475569", // slate-600
    textAlign: "right",
    marginTop: 4,
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  infoBlock: {
    width: "48%",
  },
  infoTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af", // blue-800
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 4,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  infoText: {
    fontSize: 10,
    color: "#334155",
    marginBottom: 3,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  table: {
    width: "auto",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9", // slate-100
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRowAlternate: {
    flexDirection: "row",
    backgroundColor: "#f8fafc", // slate-50
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colDesc: {
    width: "55%",
    textAlign: "left",
  },
  colQty: {
    width: "12%",
    textAlign: "center",
  },
  colRate: {
    width: "15%",
    textAlign: "right",
  },
  colAmount: {
    width: "18%",
    textAlign: "right",
  },
  headerCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#475569",
  },
  bodyCell: {
    fontSize: 9,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    marginBottom: 25,
  },
  totalContainer: {
    width: "40%",
    borderTopWidth: 2,
    borderTopColor: "#2563eb", // blue-600
    paddingTop: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
  },
  totalAmountText: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
  },
  callout: {
    backgroundColor: "#eff6ff", // blue-50
    borderLeftWidth: 3,
    borderLeftColor: "#2563eb", // blue-600
    padding: 12,
    borderRadius: 4,
    marginBottom: 20,
  },
  calloutTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
    marginBottom: 4,
  },
  calloutText: {
    fontSize: 9,
    color: "#1e40af",
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
    textAlign: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#94a3b8",
  },
});

const formatInvoiceUSD = (val: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

const formatDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "MMM d, yyyy");
  } catch (e) {
    return dateStr;
  }
};

interface InvoiceDocumentProps {
  invoiceTitle: string;
  clientName: string;
  invoiceDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  totalAmount: number;
  memo?: string;
  invoiceId: string;
}

export const InvoiceDocument = ({
  invoiceTitle,
  clientName,
  invoiceDate,
  dueDate,
  items,
  totalAmount,
  memo,
  invoiceId,
}: InvoiceDocumentProps) => {
  const shortInvoiceId = invoiceId
    ? invoiceId.substring(invoiceId.length - 8).toUpperCase()
    : "";

  return (
    <Page size="A4" style={styles.page}>
      {/* Header section */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.companyLogoText}>CEG United LLC</Text>
          <Text style={styles.companySub}>
            Financial Advisory & Business Funding
          </Text>
        </View>
        <View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>Invoice #: {shortInvoiceId}</Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        {/* Bill To */}
        <View style={styles.infoBlock}>
          <Text style={styles.infoTitle}>Bill To</Text>
          <Text style={[styles.infoText, styles.bold]}>{clientName}</Text>
        </View>

        {/* Invoice details */}
        <View style={styles.infoBlock}>
          <Text style={styles.infoTitle}>Details</Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>Invoice Date: </Text>
            {formatDate(invoiceDate)}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>Due Date: </Text>
            {formatDate(dueDate)}
          </Text>
          {invoiceTitle && (
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Type: </Text>
              {invoiceTitle}
            </Text>
          )}
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        {/* Header */}
        <View style={styles.tableHeader}>
          <View style={styles.colDesc}>
            <Text style={styles.headerCell}>Description</Text>
          </View>
          <View style={styles.colQty}>
            <Text style={styles.headerCell}>Qty</Text>
          </View>
          <View style={styles.colRate}>
            <Text style={styles.headerCell}>Rate</Text>
          </View>
          <View style={styles.colAmount}>
            <Text style={styles.headerCell}>Amount</Text>
          </View>
        </View>

        {/* Rows */}
        {items.map((item, idx) => {
          const rowStyle =
            idx % 2 === 0 ? styles.tableRow : styles.tableRowAlternate;
          return (
            <View key={idx} style={rowStyle}>
              <View style={styles.colDesc}>
                <Text style={styles.bodyCell}>{item.description}</Text>
              </View>
              <View style={styles.colQty}>
                <Text style={styles.bodyCell}>{item.quantity}</Text>
              </View>
              <View style={styles.colRate}>
                <Text style={styles.bodyCell}>
                  {formatInvoiceUSD(item.rate)}
                </Text>
              </View>
              <View style={styles.colAmount}>
                <Text style={styles.bodyCell}>
                  {formatInvoiceUSD(item.amount)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Total Section */}
      <View style={styles.totalSection}>
        <View style={styles.totalContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Due:</Text>
            <Text style={styles.totalAmountText}>
              {formatInvoiceUSD(totalAmount)}
            </Text>
          </View>
        </View>
      </View>

      {/* Optional Memo Section */}
      {memo && (
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>Memo / Notes</Text>
          <Text style={styles.calloutText}>{memo}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Thank you for your business!</Text>
        <Text style={styles.footerText}>
          CEG United LLC • info@cegunited.com • cegunited.com
        </Text>
      </View>
    </Page>
  );
};
