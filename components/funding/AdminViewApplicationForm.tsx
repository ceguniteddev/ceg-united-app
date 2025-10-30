"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ApplyFunding } from "@/schema/apply-funding";
import { CircleXIcon } from "lucide-react";
import { format, formatDate } from "date-fns";
import * as React from "react";
import {
  businessTaxes,
  howDoYouGetPaid,
  personalTaxes,
} from "@/constant/common";
import CategoryBadge from "../CategoryBadge";

type Props = {
  data?: ApplyFunding;
};

const currency = (v: number | string | undefined) => {
  if (v === undefined || v === null || v === "" || isNaN(Number(v))) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(v));
};

const fmtDate = (value?: Date | string) => {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return isNaN(d.getTime()) ? "" : format(d, "MMM d, yyyy");
};

const Field = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
    <span className="text-sm">{value ?? "—"}</span>
  </div>
);

export default function FundingApplicationView({ data }: Props) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funding Application</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No application data to display.
          </p>
        </CardContent>
        {/* <CardFooter>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setOpen(false)}
            className="w-full bg-red-200 hover:bg-red-300 text-black-100"
          >
            <CircleXIcon className="mr-2 h-4 w-4" /> Close
          </Button>
        </CardFooter> */}
      </Card>
    );
  }

  const isBusinessFunding = (data.fundingType ?? "").includes("business");

  const howDoYouGetPaidOption = howDoYouGetPaid.find(
    (x) => x.value === data.howDoYouGetPaid
  );

  const personalTaxesOption = personalTaxes.find(
    (x) => x.value === data.personalTaxes
  );

  const businessTaxesOption = businessTaxes.find(
    (x) => x.value === data.businessTaxes
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funding Application</CardTitle>
        <div className="flex flex-col text-sm text-muted-foreground">
          <div>
            <span>Submitted: {fmtDate(data.appliedDate) || "—"}</span>
          </div>
          <div className="flex items-center">
            <span>Status:</span>
            <div className="ml-1.5">
              <CategoryBadge category={data.status} />
            </div>
          </div>
          <div>
            <span>Reference: {data.referenceNumber || "—"}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Product & Amount */}
        <section>
          <h3 className="text-sm font-semibold mb-3">Product</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Interested Product" value={data.interestedProduct} />
            <Field label="Funding Type" value={data.fundingType || "All"} />
            <Field
              label="Personal Requested Amount"
              value={currency(data.personalAmountFunding)}
            />
            <Field
              label="Business Requested Amount"
              value={currency(data.businessAmountFunding)}
            />
          </div>
        </section>

        <Separator />

        {/* Driver's License */}
        {/* <section>
          <h3 className="text-sm font-semibold mb-3">{"Driver's License"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="License Number" value={data.driverLicenseNumber} />
            <Field label="State" value={data.driverLicenseState} />
            <Field
              label="Issue Date"
              value={fmtDate(data.driverLicenseIssueDate)}
            />
            <Field
              label="Expiry Date"
              value={fmtDate(data.driverLicenseIssueExpiryDate)}
            />
          </div>
        </section> */}

        <Separator />

        {(isBusinessFunding || data.businessName) && (
          <>
            <section>
              <h3 className="text-sm font-semibold mb-3">Business</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Business Name" value={data.businessName} />
                <Field label="EIN" value={data.employerIdentificationNumber} />
                {/* <Field
                  label="Last Year Taxes"
                  value={currency(data.lastYearTaxes)}
                />
                <Field
                  label="Current Year Taxes"
                  value={currency(data.currentYearTaxes)}
                /> */}
                <Field label="Website" value={data.businessWebsite} />
                <Field label="Email" value={data.businessEmail} />
                <Field label="Phone" value={data.businessPhoneNumber} />
                <Field label="Social Media" value={data.socialMedia} />
                <Field label="Street" value={data.businessStreetAddress} />
                <Field
                  label="Apartment/Suite/Unit/House Number"
                  value={data.businessStreetHouseNumber}
                />
                <Field label="City" value={data.businessCityAddress} />
                <Field label="State" value={data.businessStateAddress} />
                <Field label="Zip Code" value={data.businessPostalAddress} />
              </div>
            </section>
            <Separator />
            <section>
              <h3 className="text-sm font-semibold mb-3">
                Business Financials
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field
                  label="Gross Projected Revenue (Year 1)"
                  value={currency(data.businessGrossProjectedRevenue1)}
                />
                <Field
                  label="Gross Projected Revenue (Year 2)"
                  value={currency(data.businessGrossProjectedRevenue2)}
                />
                <Field
                  label="Gross Projected Revenue (Year 3)"
                  value={currency(data.businessGrossProjectedRevenue3)}
                />
                <Field
                  label="Projected Profit (Year 1)"
                  value={currency(data.businessProjectedProfit1)}
                />
                <Field
                  label="Projected Profit (Year 2)"
                  value={currency(data.businessProjectedProfit2)}
                />
                <Field
                  label="Projected Profit (Year 3)"
                  value={currency(data.businessProjectedProfit3)}
                />
              </div>
            </section>
            <Separator />
            <section>
              <h3 className="text-sm font-semibold mb-3">Business Taxes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Filed Business Taxes"
                  value={businessTaxesOption?.label}
                />
                <Field
                  label="Taxes Year 1"
                  value={currency(data.businessTaxes1)}
                />
                <Field
                  label="Taxes Year 2"
                  value={currency(data.businessTaxes2)}
                />
                <Field
                  label="Taxes Year 3"
                  value={currency(data.businessTaxes3)}
                />
              </div>
            </section>
            <Separator />
          </>
        )}

        {/* Residency */}
        <section>
          <h3 className="text-sm font-semibold mb-3">Residency</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Legal Resident" value={data.legalResident} />
            {data.legalResident === "Other" && (
              <Field label="Current Situation" value={data.currentSituation} />
            )}
          </div>
        </section>

        <Separator />

        {/* Address */}
        <section>
          <h3 className="text-sm font-semibold mb-3">Current Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Street" value={data.addressStreet} />
            <Field
              label="Apartment/Suite/Unit/House Number"
              value={data.houseNumber}
            />
            <Field label="City" value={data.addressCity} />
            <Field label="State" value={data.addressState} />
            <Field label="Zip Code" value={data.addressPostal} />
            {data.moveInCurrentAddress &&
              data.moveInCurrentAddress instanceof Date && (
                <Field
                  label="Move-in Date"
                  value={formatDate(data.moveInCurrentAddress, "MM/dd/yyyy")}
                />
              )}
          </div>
        </section>

        <Separator />

        {/* Household / Expenses */}
        <section>
          <h3 className="text-sm font-semibold mb-3">Household</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Monthly Housing Cost"
              value={currency(data.payPerMonth as any)}
            />
            <Field label="Rent/Mortgage/Other" value={data.rentOrMortgage} />
            <Field label="Married" value={data.isMarried} />
            {/* <Field label="Mother's Maiden Name" value={data.motherMaidenName} /> */}
          </div>
        </section>

        <Separator />

        {/* Employment */}
        <section>
          <h3 className="text-sm font-semibold mb-3">Employment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="How are you paid?"
              value={howDoYouGetPaidOption?.label}
            />
            <Field
              label="Pay Per Month"
              value={currency(data.employmentPayPerMonth)}
            />
            <Field label="Employer Name" value={data.employmentEmployerName} />
            <Field
              label="Employer Phone"
              value={data.employmentEmployerPhoneNumber}
            />
            {/* <Field
              label="Employer Address"
              value={data.employmentEmployerAddress}
            /> */}
            <Field label="Occupation" value={data.employmentOccupation} />
            <Field
              label="Date of Hire"
              value={fmtDate(data.employmentDateOfHire)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Street"
              value={data.employmentEmployerAddressStreet}
            />
            <Field
              label="Apartment/Suite/Unit/House Number"
              value={data.employmentEmployerHouseNumber}
            />
            <Field label="City" value={data.employmentEmployerAddressCity} />
            <Field label="State" value={data.employmentEmployerAddressState} />
            <Field
              label="Zip Code"
              value={data.employmentEmployerAddressPostal}
            />
          </div>
        </section>

        <Separator />

        {/* Personal Taxes */}
        <section>
          <h3 className="text-sm font-semibold mb-3">Personal Taxes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Filed Personal Taxes"
              value={personalTaxesOption?.label}
            />
            <Field label="Taxes Year 1" value={currency(data.personalTaxes1)} />
            <Field label="Taxes Year 2" value={currency(data.personalTaxes2)} />
            <Field label="Taxes Year 3" value={currency(data.personalTaxes3)} />
          </div>
        </section>
      </CardContent>

      {/* <CardFooter>
        <Button
          size="lg"
          variant="outline"
          onClick={() => setOpen(false)}
          className="w-full bg-red-200 hover:bg-red-300 text-black-100"
        >
          <CircleXIcon className="mr-2 h-4 w-4" /> Close
        </Button>
      </CardFooter> */}
    </Card>
  );
}
