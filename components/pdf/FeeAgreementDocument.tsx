import React from "react";
import { Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";
import { format } from "date-fns";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#334155",
    lineHeight: 1.5,
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 15,
    marginBottom: 20,
    textAlign: "center",
  },
  mainTitle: {
    fontSize: 20,
    color: "#0f172a",
    fontWeight: "bold",
    marginBottom: 4,
  },
  subHeader: {
    fontSize: 10,
    color: "#64748b",
  },
  content: {
    marginBottom: 20,
  },
  paragraph: {
    marginBottom: 10,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  signatureContainer: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingTop: 10,
    width: 250,
  },
  signatureLabel: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 10,
  },
  signatureImage: {
    width: 200,
    height: 80,
    objectFit: "contain",
  },
  signatureText: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 18,
    color: "#0f172a",
    paddingVertical: 10,
  },
  dateText: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 10,
  },
  callout: {
    backgroundColor: "#eff6ff",
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
    marginBottom: 10,
  },
});

export const formatUSD = (val: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);
};

interface FeeAgreementProps {
  referenceNumber: string;
  clientName: string;
  fundingAmount: number;
  feeAmount: number;
  signature: {
    type: "type" | "draw";
    value: string;
  };
  acceptedAt: string;
}

export const FeeAgreementDocument = ({
  referenceNumber,
  clientName,
  fundingAmount,
  feeAmount,
  signature,
  acceptedAt,
}: FeeAgreementProps) => {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerContainer}>
        <Text style={styles.mainTitle}>
          CEG Performance Success Fee Agreement
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.paragraph}>
          This Performance Success Fee Agreement ("Agreement") is entered into
          between the Client ({clientName}) and Credit Experts Group LLC ("CEG")
          as of the date of execution.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>1. Success Fee. </Text>
          Client agrees to pay CEG a success fee equal to{" "}
          <Text style={styles.bold}>5%</Text> of the gross funding amount
          approved and accepted through CEG's lender network.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>2. Payment. </Text>
          The fee becomes due upon disbursement of funds from the lender to the
          Client and shall be paid via the same banking instrument used for
          funding receipt.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>3. Disclosure. </Text>
          CEG is a consulting and brokerage firm and is not a lender. Final
          approval, terms, and disbursement are subject to the lender's
          underwriting standards.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>4. Termination. </Text>
          This Agreement remains in effect for the duration of the active
          funding cycle.
        </Text>
      </View>

      <View style={styles.callout}>
        <Text>
          You agree to pay a success fee of <Text style={styles.bold}>5%</Text>{" "}
          based on the approved funding amount of{" "}
          <Text style={styles.bold}>{formatUSD(fundingAmount)}</Text> ={" "}
          <Text style={styles.bold}>{formatUSD(feeAmount)}</Text> fee.
        </Text>
      </View>

      <View style={styles.signatureContainer}>
        <Text style={styles.signatureLabel}>Client E-Signature</Text>
        {signature.type === "draw" &&
        signature.value.startsWith("data:image") ? (
          <Image src={signature.value} style={styles.signatureImage} />
        ) : (
          <Text style={styles.signatureText}>{signature.value}</Text>
        )}
        <Text style={styles.dateText}>
          Date: {format(new Date(acceptedAt), "MMM d, yyyy h:mm a")}
        </Text>
      </View>
    </Page>
  );
};
