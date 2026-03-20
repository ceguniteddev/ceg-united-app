"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplyFunding } from "@/schema/apply-funding";
import {
  Briefcase,
  Building2,
  Car,
  CircleXIcon,
  CreditCard,
  FileText,
  HandCoins,
  Home,
  IdCard,
  Landmark,
  MapPin,
  Package,
  User,
  Users,
  FileDown,
  Loader2Icon,
} from "lucide-react";
import { format, formatDate } from "date-fns";
import * as React from "react";
import {
  businessTaxes,
  howDoYouGetPaid,
  personalTaxes,
} from "@/constant/common";
import CategoryBadge from "../CategoryBadge";
import { IconBadge } from "@/components/icon-badge";
import { useUserQuery } from "@/hooks/user";
import { useSaveApplicationPdf } from "@/hooks/admin/funding-application/application-pdf";

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
  className,
}: {
  label: string;
  value?: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col gap-1.5 ${className || ""}`}>
    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
    <span className="text-sm font-medium text-foreground break-words">
      {value ?? "—"}
    </span>
  </div>
);

export default function FundingApplicationView({ data }: Props) {
  const { userData } = useUserQuery(data?.userId ?? "");
  const user = userData as any;
  const name = user
    ? [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ")
    : "—";

  const { savePdf, isSaving } = useSaveApplicationPdf(
    data?.referenceNumber ?? "",
  );

  const handleSavePdf = async () => {
    try {
      await savePdf();
    } catch (e) {
      console.error(e);
    }
  };

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
    (x) => x.value === data.howDoYouGetPaid,
  );

  const personalTaxesOption = personalTaxes.find(
    (x) => x.value === data.personalTaxes,
  );

  return (
    <Card className="border-none shadow-none sm:border-solid sm:shadow-sm">
      <CardHeader className="flex flex-col gap-4 border-b bg-muted/20 pb-6 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6">
        <div>
          <CardTitle className="text-xl sm:text-2xl">
            Funding Application
          </CardTitle>
          <div className="mt-2 text-sm text-muted-foreground">
            Reference: {data.referenceNumber || "—"}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center text-sm font-medium">
          <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-md border shadow-sm">
            <span className="text-muted-foreground">Submitted:</span>
            <span>{fmtDate(data.appliedDate) || "—"}</span>
          </div>
          <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-md border shadow-sm">
            <span className="text-muted-foreground">Status:</span>
            <CategoryBadge category={data.status} />
          </div>
          <Button
            variant="ghost"
            className="cursor-pointer bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto h-10 sm:h-9"
            onClick={handleSavePdf}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Save to My Documents
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 p-4 sm:p-6 sm:gap-8">
        {/* Client Information */}
        {user && (
          <section className="bg-slate-50/50 dark:bg-slate-900/50 border border-border/50 rounded-xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <IconBadge icon={User} size="sm" variant="default" />
              <h3 className="text-base font-semibold">Client Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Field label="Name" value={name} />
              <Field label="Email" value={user.email} />
              <Field label="Phone" value={user.phoneNumber} />
              <Field label="SSN" value={user.ssn} />
              <Field
                label="Birthdate"
                value={user.birthdate ? fmtDate(user.birthdate) : "—"}
              />
              <Field label="Gender" value={user.gender} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-2 pt-6 border-t border-border/50">
              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Home className="w-4 h-4 text-muted-foreground" /> Residency
                </h4>
                <div className="grid grid-cols-1 gap-4 bg-background rounded-lg p-4 border shadow-sm">
                  <Field label="Legal Resident" value={data.legalResident} />
                  {data.legalResident === "Other" && (
                    <Field
                      label="Current Situation"
                      value={data.currentSituation}
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" /> Household
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-background rounded-lg p-4 border shadow-sm h-full">
                  <Field
                    label="Monthly Housing Cost"
                    value={currency(data.payPerMonth as any)}
                  />
                  <Field
                    label="Rent/Mortgage/Other"
                    value={data.rentOrMortgage}
                  />
                  <Field
                    label="Married"
                    value={data.isMarried}
                    className="sm:col-span-2"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:col-span-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" /> Current
                  Address
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-background rounded-lg p-4 border shadow-sm">
                  <Field
                    label="Street"
                    value={data.addressStreet}
                    className="sm:col-span-2 lg:col-span-3"
                  />
                  <Field label="Apt/Suite/Unit" value={data.houseNumber} />
                  <Field label="City" value={data.addressCity} />
                  <Field label="State" value={data.addressState} />
                  <Field label="Zip Code" value={data.addressPostal} />
                  {data.moveInCurrentAddress &&
                    data.moveInCurrentAddress instanceof Date && (
                      <Field
                        label="Move-in Date"
                        value={formatDate(
                          data.moveInCurrentAddress,
                          "MM/dd/yyyy",
                        )}
                      />
                    )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Product & Amount */}
        <section className="bg-slate-50/50 dark:bg-slate-900/50 border border-border/50 rounded-xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <IconBadge icon={Package} size="sm" variant="default" />
            <h3 className="text-base font-semibold">Product Details</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Field label="Funding Category" value={data.interestedProduct} />
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
          {data.fundingProducts && data.fundingProducts.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Selected Products
              </span>
              <div className="flex flex-wrap gap-2">
                {data.fundingProducts.map((product) => (
                  <span
                    key={product}
                    className="text-xs font-medium bg-background border shadow-sm rounded-full px-3 py-1.5"
                  >
                    {product}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Driver's License - only show if has values */}
        {(data.driverLicenseNumber ||
          data.driverLicenseState ||
          data.driverLicenseIssueDate ||
          data.driverLicenseIssueExpiryDate) && (
          <section className="bg-slate-50/50 dark:bg-slate-900/50 border border-border/50 rounded-xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <IconBadge icon={IdCard} size="sm" variant="default" />
              <h3 className="text-base font-semibold">{"Driver's License"}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
          </section>
        )}

        {/* Auto Loan Specific Fields */}
        {data.fundingProducts?.some((p) => p.includes("Auto Loan")) && (
          <section className="bg-slate-50/50 dark:bg-slate-900/50 border border-border/50 rounded-xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <IconBadge icon={Car} size="sm" variant="default" />
              <h3 className="text-base font-semibold">Auto Loan Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Field
                label="Vehicle Price"
                value={currency(data.vehiclePrice)}
              />
              <Field
                label="Purchase Source"
                value={data.vehiclePurchaseSource}
              />
              <Field label="VIN Number" value={data.vehicleVIN} />
              <Field label="Financing Type" value={data.vehicleFinancingType} />
            </div>
          </section>
        )}

        {/* Community Specific Fields */}
        {data.fundingType?.includes("Community") && (
          <section className="bg-slate-50/50 dark:bg-slate-900/50 border border-border/50 rounded-xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <IconBadge icon={Users} size="sm" variant="default" />
              <h3 className="text-base font-semibold">Community</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <Field
                label="Reason for Joining Community"
                value={data.reasonForJoiningCommunity}
              />
            </div>
          </section>
        )}

        {/* Tradelines Specific Fields */}
        {data.interestedProduct?.includes("Tradelines") && (
          <section className="bg-slate-50/50 dark:bg-slate-900/50 border border-border/50 rounded-xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <IconBadge icon={CreditCard} size="sm" variant="default" />
              <h3 className="text-base font-semibold">
                Tradelines Credentials
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Field label="Experian Username" value={data.experianUsername} />
              <Field
                label="Experian Password"
                value={data.experianPassword ? "••••••••" : "—"}
              />
              <Field
                label="Credit Karma Username"
                value={data.creditKarmaUsername}
              />
              <Field
                label="Credit Karma Password"
                value={data.creditKarmaPassword ? "••••••••" : "—"}
              />
            </div>
          </section>
        )}

        {(isBusinessFunding || data.businessName) && (
          <div className="flex flex-col gap-6 sm:gap-8">
            <section className="bg-slate-50/50 dark:bg-slate-900/50 border border-border/50 rounded-xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <IconBadge icon={Building2} size="sm" variant="default" />
                <h3 className="text-base font-semibold">Business Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Field label="Business Name" value={data.businessName} />
                <Field label="EIN" value={data.employerIdentificationNumber} />

                <Field
                  label="State of Incorporation"
                  value={data.stateOfIncorporation}
                />
                {data.dateOfIncorporation &&
                data.dateOfIncorporation instanceof Date ? (
                  <Field
                    label="Date of Incorporation"
                    value={formatDate(data.dateOfIncorporation, "MM/dd/yyyy")}
                  />
                ) : (
                  <Field label="Date of Incorporation" value={null} />
                )}

                <Field label="Industry Field" value={data.industryField} />
                {data.ownershipPercentage !== undefined && (
                  <Field
                    label="Ownership Percentage"
                    value={`${data.ownershipPercentage}%`}
                  />
                )}

                <Field
                  label="Website"
                  value={data.businessWebsite}
                  className="sm:col-span-2 lg:col-span-1"
                />
                <Field label="Email" value={data.businessEmail} />
                <Field label="Phone" value={data.businessPhoneNumber} />

                <Field
                  label="Social Media"
                  className="sm:col-span-2 lg:col-span-3"
                  value={
                    data.socialMedia
                      ?.map((sm, idx) =>
                        sm?.platform && sm?.handle
                          ? `${sm.platform}: ${sm.handle}`
                          : null,
                      )
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />

                <div className="col-span-1 sm:col-span-2 lg:col-span-3 mt-2">
                  <h4 className="text-sm font-semibold mb-4 text-foreground">
                    Business Address
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 bg-background rounded-lg p-4 border shadow-sm">
                    <Field
                      label="Street"
                      value={data.businessStreetAddress}
                      className="sm:col-span-2 lg:col-span-3"
                    />
                    <Field
                      label="Apt/Suite/Unit"
                      value={data.businessStreetHouseNumber}
                    />
                    <Field label="City" value={data.businessCityAddress} />
                    <Field label="State" value={data.businessStateAddress} />
                    <Field
                      label="Zip Code"
                      value={data.businessPostalAddress}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-slate-50/50 dark:bg-slate-900/50 border border-border/50 rounded-xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <IconBadge icon={Landmark} size="sm" variant="default" />
                <h3 className="text-base font-semibold">Business Financials</h3>
              </div>

              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 bg-background rounded-lg p-4 border shadow-sm">
                  <div className="flex flex-col gap-2 border-b sm:border-b-0 pb-4 sm:pb-0">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Year 1
                    </h4>
                    <Field
                      label="Gross Projected Revenue"
                      value={currency(data.businessGrossProjectedRevenue1)}
                    />
                    <Field
                      label="Projected Profit"
                      value={currency(data.businessProjectedProfit1)}
                    />
                    <Field
                      label="Filed with IRS"
                      value={data.businessFiledWithIRS1 ? "Yes" : "No"}
                    />
                  </div>
                  <div className="flex flex-col gap-2 border-b sm:border-b-0 sm:border-l sm:pl-6 pb-4 sm:pb-0">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Year 2
                    </h4>
                    <Field
                      label="Gross Projected Revenue"
                      value={currency(data.businessGrossProjectedRevenue2)}
                    />
                    <Field
                      label="Projected Profit"
                      value={currency(data.businessProjectedProfit2)}
                    />
                    <Field
                      label="Filed with IRS"
                      value={data.businessFiledWithIRS2 ? "Yes" : "No"}
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:border-l sm:pl-6">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Year 3
                    </h4>
                    <Field
                      label="Gross Projected Revenue"
                      value={currency(data.businessGrossProjectedRevenue3)}
                    />
                    <Field
                      label="Projected Profit"
                      value={currency(data.businessProjectedProfit3)}
                    />
                    <Field
                      label="Filed with IRS"
                      value={data.businessFiledWithIRS3 ? "Yes" : "No"}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Bridge Loan Application (Business Income Based Funding) */}
            {data.fundingProducts?.includes(
              "Business Income Based Funding",
            ) && (
              <section className="bg-slate-50/50 dark:bg-slate-900/50 border border-border/50 rounded-xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
                <div className="flex items-center gap-3">
                  <IconBadge icon={HandCoins} size="sm" variant="default" />
                  <h3 className="text-base font-semibold">
                    Bridge Loan Application
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <Field
                    label="Use of Funds"
                    value={data.useOfFunds}
                    className="sm:col-span-2 lg:col-span-3"
                  />
                  <Field
                    label="Annual Business Revenue"
                    value={currency(data.annualBusinessRevenue)}
                  />
                  <Field
                    label="Avg. Monthly CC Sales"
                    value={currency(data.avgMonthlyCreditCardSales)}
                  />
                  <Field
                    label="Avg. Daily Bank Balance"
                    value={currency(data.avgDailyBankBalance)}
                  />
                  <Field
                    label="Business Property Type"
                    value={data.businessPropertyType}
                  />
                  <Field label="Landlord Name" value={data.landlordName} />
                  <Field label="Landlord Phone" value={data.landlordPhone} />
                  <Field
                    label="Monthly Payment"
                    value={currency(data.monthlyPayment)}
                  />
                  <Field
                    label="Seasonal Business?"
                    value={data.isSeasonalBusiness}
                  />
                  <Field
                    label="Outstanding Advances?"
                    value={data.hasOutstandingAdvances}
                  />
                  <Field
                    label="Who Referred You?"
                    value={data.whoReferredYou}
                    className="sm:col-span-2 lg:col-span-3"
                  />
                </div>
              </section>
            )}
          </div>
        )}

        {/* Employment - only show if employment status indicates employed */}
        {howDoYouGetPaidOption &&
          howDoYouGetPaidOption.type === "yes" &&
          (data.employmentEmployerName ||
            data.employmentPayPerMonth ||
            data.employmentOccupation) && (
            <section className="bg-slate-50/50 dark:bg-slate-900/50 border border-border/50 rounded-xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <IconBadge icon={Briefcase} size="sm" variant="default" />
                <h3 className="text-base font-semibold">Employment</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Field
                  label="How are you paid?"
                  value={howDoYouGetPaidOption?.label}
                />
                <Field
                  label="Pay Per Month"
                  value={currency(data.employmentPayPerMonth)}
                />
                <Field
                  label="Date of Hire"
                  value={fmtDate(data.employmentDateOfHire)}
                />
                <Field
                  label="Employer Name"
                  value={data.employmentEmployerName}
                  className="sm:col-span-2 lg:col-span-1"
                />
                <Field
                  label="Employer Phone"
                  value={data.employmentEmployerPhoneNumber}
                />
                <Field label="Occupation" value={data.employmentOccupation} />
              </div>

              {(data.employmentEmployerAddressStreet ||
                data.employmentEmployerAddressCity ||
                data.employmentEmployerAddressState) && (
                <div className="mt-2">
                  <h4 className="text-sm font-semibold mb-4 text-foreground">
                    Employer Address
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 bg-background rounded-lg p-4 border shadow-sm">
                    <Field
                      label="Street"
                      value={data.employmentEmployerAddressStreet}
                      className="sm:col-span-2 lg:col-span-3"
                    />
                    <Field
                      label="Apt/Suite/Unit"
                      value={data.employmentEmployerHouseNumber}
                    />
                    <Field
                      label="City"
                      value={data.employmentEmployerAddressCity}
                    />
                    <Field
                      label="State"
                      value={data.employmentEmployerAddressState}
                    />
                    <Field
                      label="Zip Code"
                      value={data.employmentEmployerAddressPostal}
                    />
                  </div>
                </div>
              )}
            </section>
          )}

        {/* Additional Employments */}
        {data.employments && data.employments.length > 0 && (
          <section className="bg-slate-50/50 dark:bg-slate-900/50 border border-border/50 rounded-xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <IconBadge icon={Briefcase} size="sm" variant="default" />
              <h3 className="text-base font-semibold">
                Additional Employments
              </h3>
            </div>
            <div className="flex flex-col gap-4">
              {data.employments.map((emp, index) => {
                const empPaidOption = howDoYouGetPaid.find(
                  (x) => x.value === emp.howDoYouGetPaid,
                );
                return (
                  <div
                    key={index}
                    className="bg-background rounded-lg p-4 sm:p-5 border shadow-sm flex flex-col gap-4"
                  >
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">
                      Employment {index + 1}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                      <Field
                        label="How are you paid?"
                        value={empPaidOption?.label}
                      />
                      <Field
                        label="Pay Per Month"
                        value={currency(emp.employmentPayPerMonth)}
                      />
                      <Field
                        label="Employer Name"
                        value={emp.employmentEmployerName}
                      />
                      <Field
                        label="Occupation"
                        value={emp.employmentOccupation}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Personal Taxes - only show if filed */}
        {personalTaxesOption &&
          (data.personalTaxes1 ||
            data.personalTaxes2 ||
            data.personalTaxes3) && (
            <section className="bg-slate-50/50 dark:bg-slate-900/50 border border-border/50 rounded-xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <IconBadge icon={FileText} size="sm" variant="default" />
                <h3 className="text-base font-semibold">Personal Taxes</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Field
                  label="Filed Personal Taxes"
                  value={personalTaxesOption?.label}
                  className="sm:col-span-2 lg:col-span-1"
                />
                <Field
                  label="Taxes Year 1"
                  value={currency(data.personalTaxes1)}
                />
                <Field
                  label="Taxes Year 2"
                  value={currency(data.personalTaxes2)}
                />
                <Field
                  label="Taxes Year 3"
                  value={currency(data.personalTaxes3)}
                />
              </div>
            </section>
          )}
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
