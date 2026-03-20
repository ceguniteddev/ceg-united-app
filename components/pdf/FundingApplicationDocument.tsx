import React from "react";
import { Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { ApplyFunding } from "@/schema/apply-funding";
import { format } from "date-fns";
import {
  businessTaxes,
  howDoYouGetPaid,
  personalTaxes,
} from "@/constant/common";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#334155",
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 15,
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 24,
    color: "#0f172a",
    fontWeight: "bold",
    marginBottom: 4,
  },
  subHeader: {
    fontSize: 10,
    color: "#64748b",
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "bold",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  column: {
    width: "50%",
    paddingRight: 10,
    marginBottom: 8,
  },
  columnThird: {
    width: "33.33%",
    paddingRight: 10,
    marginBottom: 8,
  },
  columnFull: {
    width: "100%",
    marginBottom: 8,
  },
  label: {
    fontSize: 9,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 2,
    fontWeight: "bold",
  },
  value: {
    fontSize: 11,
    color: "#0f172a",
  },
});

interface Props {
  application: ApplyFunding;
  user?: any;
}

const currency = (v: number | string | undefined) => {
  if (v === undefined || v === null || v === "" || isNaN(Number(v))) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(v));
};

const fmtDate = (value?: Date | string) => {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return isNaN(d.getTime()) ? "—" : format(d, "MMM d, yyyy");
};

export const FundingApplicationDocument = ({ application, user }: Props) => {
  const name = user
    ? [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ")
    : "—";

  const isBusinessFunding = (application.fundingType ?? "").includes(
    "business",
  );

  const howDoYouGetPaidOption = howDoYouGetPaid.find(
    (x) => x.value === application.howDoYouGetPaid,
  );

  const personalTaxesOption = personalTaxes.find(
    (x) => x.value === application.personalTaxes,
  );

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerContainer}>
        <Text style={styles.mainTitle}>Funding Application</Text>
      </View>

      {/* Client Information */}
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>Client Information</Text>
        <View style={styles.row}>
          <View style={styles.columnThird}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{name}</Text>
          </View>
          <View style={styles.columnThird}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email || "—"}</Text>
          </View>
          <View style={styles.columnThird}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{user?.phoneNumber || "—"}</Text>
          </View>
          <View style={styles.columnThird}>
            <Text style={styles.label}>SSN</Text>
            <Text style={styles.value}>{user?.ssn || "—"}</Text>
          </View>
          <View style={styles.columnThird}>
            <Text style={styles.label}>Birthdate</Text>
            <Text style={styles.value}>
              {user?.birthdate ? fmtDate(user.birthdate) : "—"}
            </Text>
          </View>
          <View style={styles.columnThird}>
            <Text style={styles.label}>Gender</Text>
            <Text style={styles.value}>{user?.gender || "—"}</Text>
          </View>
        </View>

        {/* Residency */}
        <Text style={[styles.sectionTitle, { fontSize: 12, marginTop: 10 }]}>
          Residency
        </Text>
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Legal Resident</Text>
            <Text style={styles.value}>{application.legalResident || "—"}</Text>
          </View>
          {application.legalResident === "Other" && (
            <View style={styles.column}>
              <Text style={styles.label}>Current Situation</Text>
              <Text style={styles.value}>
                {application.currentSituation || "—"}
              </Text>
            </View>
          )}
        </View>

        {/* Household */}
        <Text style={[styles.sectionTitle, { fontSize: 12, marginTop: 10 }]}>
          Household
        </Text>
        <View style={styles.row}>
          <View style={styles.columnThird}>
            <Text style={styles.label}>Monthly Housing Cost</Text>
            <Text style={styles.value}>
              {currency(application.payPerMonth as any)}
            </Text>
          </View>
          <View style={styles.columnThird}>
            <Text style={styles.label}>Rent/Mortgage/Other</Text>
            <Text style={styles.value}>
              {application.rentOrMortgage || "—"}
            </Text>
          </View>
          <View style={styles.columnThird}>
            <Text style={styles.label}>Married</Text>
            <Text style={styles.value}>{application.isMarried || "—"}</Text>
          </View>
        </View>

        {/* Current Address */}
        <Text style={[styles.sectionTitle, { fontSize: 12, marginTop: 10 }]}>
          Current Address
        </Text>
        <View style={styles.row}>
          <View style={styles.columnFull}>
            <Text style={styles.label}>Street</Text>
            <Text style={styles.value}>
              {application.addressStreet || "—"}{" "}
              {application.houseNumber
                ? `Apt/Unit ${application.houseNumber}`
                : ""}
            </Text>
          </View>
          <View style={styles.columnThird}>
            <Text style={styles.label}>City</Text>
            <Text style={styles.value}>{application.addressCity || "—"}</Text>
          </View>
          <View style={styles.columnThird}>
            <Text style={styles.label}>State</Text>
            <Text style={styles.value}>{application.addressState || "—"}</Text>
          </View>
          <View style={styles.columnThird}>
            <Text style={styles.label}>Zip Code</Text>
            <Text style={styles.value}>{application.addressPostal || "—"}</Text>
          </View>
          <View style={styles.columnThird}>
            <Text style={styles.label}>Move-in Date</Text>
            <Text style={styles.value}>
              {fmtDate(application.moveInCurrentAddress)}
            </Text>
          </View>
        </View>
      </View>

      {/* Product Details */}
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>Product Details</Text>
        <View style={styles.row}>
          <View style={styles.columnThird}>
            <Text style={styles.label}>Category</Text>
            <Text style={styles.value}>
              {application.interestedProduct || "—"}
            </Text>
          </View>
          <View style={styles.columnThird}>
            <Text style={styles.label}>Personal Request</Text>
            <Text style={styles.value}>
              {currency(application.personalAmountFunding)}
            </Text>
          </View>
          <View style={styles.columnThird}>
            <Text style={styles.label}>Business Request</Text>
            <Text style={styles.value}>
              {currency(application.businessAmountFunding)}
            </Text>
          </View>
        </View>
        {application.fundingProducts &&
          application.fundingProducts.length > 0 && (
            <View style={styles.columnFull}>
              <Text style={styles.label}>Selected Products</Text>
              <Text style={styles.value}>
                {application.fundingProducts.join(", ")}
              </Text>
            </View>
          )}
      </View>

      {/* Driver's License */}
      {(application.driverLicenseNumber ||
        application.driverLicenseState ||
        application.driverLicenseIssueDate ||
        application.driverLicenseIssueExpiryDate) && (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Driver's License</Text>
          <View style={styles.row}>
            <View style={styles.columnThird}>
              <Text style={styles.label}>License Number</Text>
              <Text style={styles.value}>
                {application.driverLicenseNumber || "—"}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>State</Text>
              <Text style={styles.value}>
                {application.driverLicenseState || "—"}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Issue Date</Text>
              <Text style={styles.value}>
                {fmtDate(application.driverLicenseIssueDate)}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Expiry Date</Text>
              <Text style={styles.value}>
                {fmtDate(application.driverLicenseIssueExpiryDate)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Auto Loan Details */}
      {application.fundingProducts?.some((p) => p.includes("Auto Loan")) && (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Auto Loan Details</Text>
          <View style={styles.row}>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Vehicle Price</Text>
              <Text style={styles.value}>
                {currency(application.vehiclePrice)}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Purchase Source</Text>
              <Text style={styles.value}>
                {application.vehiclePurchaseSource || "—"}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>VIN Number</Text>
              <Text style={styles.value}>{application.vehicleVIN || "—"}</Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Financing Type</Text>
              <Text style={styles.value}>
                {application.vehicleFinancingType || "—"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Community */}
      {application.fundingType?.includes("Community") && (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Community</Text>
          <View style={styles.row}>
            <View style={styles.columnFull}>
              <Text style={styles.label}>Reason for Joining Community</Text>
              <Text style={styles.value}>
                {application.reasonForJoiningCommunity || "—"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Tradelines Credentials */}
      {application.interestedProduct?.includes("Tradelines") && (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Tradelines Credentials</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Experian Username</Text>
              <Text style={styles.value}>
                {application.experianUsername || "—"}
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Experian Password</Text>
              <Text style={styles.value}>
                {application.experianPassword ? "••••••••" : "—"}
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Credit Karma Username</Text>
              <Text style={styles.value}>
                {application.creditKarmaUsername || "—"}
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Credit Karma Password</Text>
              <Text style={styles.value}>
                {application.creditKarmaPassword ? "••••••••" : "—"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Business Details */}
      {(application.businessName || isBusinessFunding) && (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Business Details</Text>
          <View style={styles.row}>
            <View style={styles.columnFull}>
              <Text style={styles.label}>Business Name</Text>
              <Text style={styles.value}>
                {application.businessName || "—"}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>EIN</Text>
              <Text style={styles.value}>
                {application.employerIdentificationNumber || "—"}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>State of Incorporation</Text>
              <Text style={styles.value}>
                {application.stateOfIncorporation || "—"}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Date of Incorporation</Text>
              <Text style={styles.value}>
                {fmtDate(application.dateOfIncorporation)}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Industry</Text>
              <Text style={styles.value}>
                {application.industryField || "—"}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Ownership</Text>
              <Text style={styles.value}>
                {application.ownershipPercentage !== undefined
                  ? `${application.ownershipPercentage}%`
                  : "—"}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Website</Text>
              <Text style={styles.value}>
                {application.businessWebsite || "—"}
              </Text>
            </View>

            <View style={styles.columnThird}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>
                {application.businessPhoneNumber || "—"}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>
                {application.businessEmail || "—"}
              </Text>
            </View>
            <View style={styles.columnFull}>
              <Text style={styles.label}>Social Media</Text>
              <Text style={styles.value}>
                {application.socialMedia
                  ?.map((sm) =>
                    sm?.platform && sm?.handle
                      ? `${sm.platform}: ${sm.handle}`
                      : null,
                  )
                  .filter(Boolean)
                  .join(", ") || "—"}
              </Text>
            </View>

            <View style={styles.columnFull}>
              <Text
                style={[styles.sectionTitle, { fontSize: 12, marginTop: 10 }]}
              >
                Business Address
              </Text>
            </View>
            <View style={styles.columnFull}>
              <Text style={styles.label}>Street</Text>
              <Text style={styles.value}>
                {application.businessStreetAddress || "—"}{" "}
                {application.businessStreetHouseNumber
                  ? `Apt/Unit ${application.businessStreetHouseNumber}`
                  : ""}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>City</Text>
              <Text style={styles.value}>
                {application.businessCityAddress || "—"}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>State</Text>
              <Text style={styles.value}>
                {application.businessStateAddress || "—"}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Zip Code</Text>
              <Text style={styles.value}>
                {application.businessPostalAddress || "—"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Business Financials */}
      {(application.businessGrossProjectedRevenue1 ||
        application.businessProjectedProfit1) && (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Business Financials</Text>
          <View style={styles.row}>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Year 1 Revenue</Text>
              <Text style={styles.value}>
                {currency(application.businessGrossProjectedRevenue1)}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Year 1 Profit</Text>
              <Text style={styles.value}>
                {currency(application.businessProjectedProfit1)}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Year 1 Filed with IRS</Text>
              <Text style={styles.value}>
                {application.businessFiledWithIRS1 ? "Yes" : "No"}
              </Text>
            </View>

            <View style={styles.columnThird}>
              <Text style={styles.label}>Year 2 Revenue</Text>
              <Text style={styles.value}>
                {currency(application.businessGrossProjectedRevenue2)}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Year 2 Profit</Text>
              <Text style={styles.value}>
                {currency(application.businessProjectedProfit2)}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Year 2 Filed with IRS</Text>
              <Text style={styles.value}>
                {application.businessFiledWithIRS2 ? "Yes" : "No"}
              </Text>
            </View>

            <View style={styles.columnThird}>
              <Text style={styles.label}>Year 3 Revenue</Text>
              <Text style={styles.value}>
                {currency(application.businessGrossProjectedRevenue3)}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Year 3 Profit</Text>
              <Text style={styles.value}>
                {currency(application.businessProjectedProfit3)}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Year 3 Filed with IRS</Text>
              <Text style={styles.value}>
                {application.businessFiledWithIRS3 ? "Yes" : "No"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Bridge Loan Application */}
      {application.fundingProducts?.includes(
        "Business Income Based Funding",
      ) && (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Bridge Loan Application</Text>
          <View style={styles.row}>
            <View style={styles.columnFull}>
              <Text style={styles.label}>Use of Funds</Text>
              <Text style={styles.value}>{application.useOfFunds || "—"}</Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Annual Bus. Revenue</Text>
              <Text style={styles.value}>
                {currency(application.annualBusinessRevenue)}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Avg. Monthly CC Sales</Text>
              <Text style={styles.value}>
                {currency(application.avgMonthlyCreditCardSales)}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Avg. Daily Bank Bal.</Text>
              <Text style={styles.value}>
                {currency(application.avgDailyBankBalance)}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Business Property Type</Text>
              <Text style={styles.value}>
                {application.businessPropertyType || "—"}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Landlord Name</Text>
              <Text style={styles.value}>
                {application.landlordName || "—"}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Landlord Phone</Text>
              <Text style={styles.value}>
                {application.landlordPhone || "—"}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Monthly Payment</Text>
              <Text style={styles.value}>
                {currency(application.monthlyPayment)}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Seasonal Business?</Text>
              <Text style={styles.value}>
                {application.isSeasonalBusiness || "—"}
              </Text>
            </View>
            <View style={styles.columnThird}>
              <Text style={styles.label}>Outstanding Advances?</Text>
              <Text style={styles.value}>
                {application.hasOutstandingAdvances || "—"}
              </Text>
            </View>
            <View style={styles.columnFull}>
              <Text style={styles.label}>Who Referred You?</Text>
              <Text style={styles.value}>
                {application.whoReferredYou || "—"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Employment */}
      {howDoYouGetPaidOption &&
        howDoYouGetPaidOption.type === "yes" &&
        (application.employmentEmployerName ||
          application.employmentOccupation) && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Primary Employment</Text>
            <View style={styles.row}>
              <View style={styles.columnThird}>
                <Text style={styles.label}>How are you paid?</Text>
                <Text style={styles.value}>
                  {howDoYouGetPaidOption?.label || "—"}
                </Text>
              </View>
              <View style={styles.columnThird}>
                <Text style={styles.label}>Pay Per Month</Text>
                <Text style={styles.value}>
                  {currency(application.employmentPayPerMonth)}
                </Text>
              </View>
              <View style={styles.columnThird}>
                <Text style={styles.label}>Date of Hire</Text>
                <Text style={styles.value}>
                  {fmtDate(application.employmentDateOfHire)}
                </Text>
              </View>
              <View style={styles.columnThird}>
                <Text style={styles.label}>Employer Name</Text>
                <Text style={styles.value}>
                  {application.employmentEmployerName || "—"}
                </Text>
              </View>
              <View style={styles.columnThird}>
                <Text style={styles.label}>Employer Phone</Text>
                <Text style={styles.value}>
                  {application.employmentEmployerPhoneNumber || "—"}
                </Text>
              </View>
              <View style={styles.columnThird}>
                <Text style={styles.label}>Occupation</Text>
                <Text style={styles.value}>
                  {application.employmentOccupation || "—"}
                </Text>
              </View>

              {(application.employmentEmployerAddressStreet ||
                application.employmentEmployerAddressCity ||
                application.employmentEmployerAddressState) && (
                <>
                  <View style={styles.columnFull}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { fontSize: 12, marginTop: 10 },
                      ]}
                    >
                      Employer Address
                    </Text>
                  </View>
                  <View style={styles.columnFull}>
                    <Text style={styles.label}>Street</Text>
                    <Text style={styles.value}>
                      {application.employmentEmployerAddressStreet || "—"}{" "}
                      {application.employmentEmployerHouseNumber
                        ? `Apt/Unit ${application.employmentEmployerHouseNumber}`
                        : ""}
                    </Text>
                  </View>
                  <View style={styles.columnThird}>
                    <Text style={styles.label}>City</Text>
                    <Text style={styles.value}>
                      {application.employmentEmployerAddressCity || "—"}
                    </Text>
                  </View>
                  <View style={styles.columnThird}>
                    <Text style={styles.label}>State</Text>
                    <Text style={styles.value}>
                      {application.employmentEmployerAddressState || "—"}
                    </Text>
                  </View>
                  <View style={styles.columnThird}>
                    <Text style={styles.label}>Zip Code</Text>
                    <Text style={styles.value}>
                      {application.employmentEmployerAddressPostal || "—"}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

      {/* Additional Employments */}
      {application.employments && application.employments.length > 0 && (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Additional Employments</Text>
          {application.employments.map((emp, index) => {
            const empPaidOption = howDoYouGetPaid.find(
              (x) => x.value === emp.howDoYouGetPaid,
            );
            return (
              <View
                key={index}
                style={[
                  styles.row,
                  {
                    marginBottom: 15,
                    borderBottomWidth: 1,
                    borderBottomColor: "#e2e8f0",
                    paddingBottom: 10,
                  },
                ]}
              >
                <View style={styles.columnFull}>
                  <Text style={[styles.sectionTitle, { fontSize: 12 }]}>
                    Employment {index + 1}
                  </Text>
                </View>
                <View style={styles.columnThird}>
                  <Text style={styles.label}>How are you paid?</Text>
                  <Text style={styles.value}>
                    {empPaidOption?.label || "—"}
                  </Text>
                </View>
                <View style={styles.columnThird}>
                  <Text style={styles.label}>Pay Per Month</Text>
                  <Text style={styles.value}>
                    {currency(emp.employmentPayPerMonth)}
                  </Text>
                </View>
                <View style={styles.columnThird}>
                  <Text style={styles.label}>Employer Name</Text>
                  <Text style={styles.value}>
                    {emp.employmentEmployerName || "—"}
                  </Text>
                </View>
                <View style={styles.columnThird}>
                  <Text style={styles.label}>Occupation</Text>
                  <Text style={styles.value}>
                    {emp.employmentOccupation || "—"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Personal Taxes */}
      {personalTaxesOption &&
        (application.personalTaxes1 ||
          application.personalTaxes2 ||
          application.personalTaxes3) && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Personal Taxes</Text>
            <View style={styles.row}>
              <View style={styles.columnThird}>
                <Text style={styles.label}>Filed Personal Taxes</Text>
                <Text style={styles.value}>
                  {personalTaxesOption?.label || "—"}
                </Text>
              </View>
              <View style={styles.columnThird}>
                <Text style={styles.label}>Taxes Year 1</Text>
                <Text style={styles.value}>
                  {currency(application.personalTaxes1)}
                </Text>
              </View>
              <View style={styles.columnThird}>
                <Text style={styles.label}>Taxes Year 2</Text>
                <Text style={styles.value}>
                  {currency(application.personalTaxes2)}
                </Text>
              </View>
              <View style={styles.columnThird}>
                <Text style={styles.label}>Taxes Year 3</Text>
                <Text style={styles.value}>
                  {currency(application.personalTaxes3)}
                </Text>
              </View>
            </View>
          </View>
        )}
    </Page>
  );
};
