"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ApplyFunding } from "@/schema/apply-funding";
import { CircleXIcon } from "lucide-react";
import { format } from "date-fns";
import * as React from "react";

type Props = {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
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

const Field = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
    <span className="text-sm">{value ?? "—"}</span>
  </div>
);

export default function FundingApplicationView({ setOpen, data }: Props) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funding Application</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No application data to display.</p>
        </CardContent>
        <CardFooter>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setOpen(false)}
            className="w-full bg-red-200 hover:bg-red-300 text-black-100"
          >
            <CircleXIcon className="mr-2 h-4 w-4" /> Close
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const isBusinessFunding = (data.fundingType ?? "").toLowerCase().includes("business");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funding Application</CardTitle>
        <div className="text-sm text-muted-foreground">
          Submitted: {fmtDate(data.appliedDate) || "—"} • Status: {data.status || "—"}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Product & Amount */}
        <section>
          <h3 className="text-sm font-semibold mb-3">Product</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Interested Product" value={data.interestedProduct} />
            <Field label="Requested Amount" value={currency(data.amountFunding)} />
            <Field label="Funding Type" value={data.fundingType || "All"} />
          </div>
        </section>

        <Separator />

        <section className="space-y-3">
          <h3 className="text-sm font-semibold mb-3">Income</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Personal Income" value={currency(data.personalIncome)} />
            <Field label="Frequency of Income" value={data.frequencyOfIncome} />
            <Field label="Payment Type" value={data.paymentType} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Business Gross" value={currency(data.businessGross)} />
            <Field label="Business Net" value={currency(data.businessNet)} />
          </div>
        </section>

        <Separator />

        {/* Business (only if present / business funding) */}
        {(isBusinessFunding || data.businessName) && (
          <>
            <section>
              <h3 className="text-sm font-semibold mb-3">Business</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Business Name" value={data.businessName} />
                <Field label="EIN" value={data.employerIdentificationNumber} />
                <Field label="Last Year Taxes" value={currency(data.lastYearTaxes)} />
                <Field label="Current Year Taxes" value={currency(data.currentYearTaxes)} />
                <Field label="Website" value={data.businessWebsite} />
                <Field label="Email" value={data.businessEmail} />
                <Field label="Phone" value={data.businessPhoneNumber} />
                <Field label="Social Media" value={data.socialMedia} />
                <Field label="Street" value={data.businessStreetAddress} />
                <Field label="City" value={data.businessCityAddress} />
                <Field label="State" value={data.businessStateAddress} />
                <Field label="Postal" value={data.businessPostalAddress} />
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
            <Field label="City" value={data.addressCity} />
            <Field label="State" value={data.addressState} />
            <Field label="Postal" value={data.addressPostal} />
            <Field label="Move-in Date" value={data.moveInCurrentAddress} />
          </div>
        </section>

        <Separator />

        {/* Household / Expenses */}
        <section>
          <h3 className="text-sm font-semibold mb-3">Household</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Monthly Housing Cost" value={currency(data.payPerMonth as any)} />
            <Field label="Rent/Mortgage/Other" value={data.rentOrMortgage} />
            <Field label="Married" value={data.isMarried} />
            <Field label="Mother's Maiden Name" value={data.motherMaidenName} />
          </div>
        </section>
      </CardContent>

      <CardFooter>
        <Button
          size="lg"
          variant="outline"
          onClick={() => setOpen(false)}
          className="w-full bg-red-200 hover:bg-red-300 text-black-100"
        >
          <CircleXIcon className="mr-2 h-4 w-4" /> Close
        </Button>
      </CardFooter>
    </Card>
  );
}
