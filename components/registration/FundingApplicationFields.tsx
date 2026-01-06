"use client";

import React, { useCallback, useState, useEffect, useMemo } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomFormField } from "@/components/CustomFormField";
import {
  ApplyFunding,
  FundingProductTypeEnum,
  FundingProductEnumType,
} from "@/schema/apply-funding";
import {
  businessTaxes,
  howDoYouGetPaid,
  personalTaxes,
  US_STATES,
} from "@/constant/common";
import { Plus, Trash2, CircleX } from "lucide-react";
import IconMenu from "../icon-menu";
import { Business } from "@/schema";
import PlaidLink from "../PlaidLink";
import { Separator } from "../ui/separator";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { FileText, Upload } from "lucide-react";

const legalResident: DropdownOption[] = [
  { value: "Yes, I'm a citizen", label: "Yes, I'm a citizen" },
  { value: "Yes, I have green card", label: "Yes, I have green card" },
  {
    value: "No, I don't have legal status",
    label: "No, I don't have legal status",
  },
  { value: "Other", label: "Other" },
];

const isMarried: DropdownOption[] = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

interface FundingApplicationFieldsProps {
  userId: string;
  businessData?: Business[];
  isBusinessLoading?: boolean;
  refetchBusinesses?: () => void;
  isViewing?: boolean;
}

export function FundingApplicationFields({
  userId,
  businessData = [],
  isBusinessLoading = false,
  refetchBusinesses = () => {},
  isViewing = false,
}: FundingApplicationFieldsProps) {
  const form = useFormContext<ApplyFunding>();

  const [showLegalResidentOther, setShowLegalResidentOther] = useState(false);
  const [interestedProductSelected, setInterestedProductSelected] = useState<
    FundingProductEnumType | undefined
  >(undefined);
  const [isCommunity, setIsCommunity] = useState<boolean>(false);
  const [isEquipmentFinancing, setIsEquipmentFinancing] =
    useState<boolean>(false);
  const [isTradeLines, setIsTradeLines] = useState<boolean>(false);
  const [isAutoLoan, setIsAutoLoan] = useState<boolean>(false);
  const [vehicleFinancingType, setVehicleFinancingType] = useState<
    string | undefined
  >(undefined);

  // Document upload states - now using form state
  const bankStatementsFromForm = form.watch("bankStatements") || [];
  const driverLicenseDocsFromForm = form.watch("driverLicenseDocuments") || [];

  const [howDoYouGetPaidSelected, setHowDoYouGetPaidSelected] = useState<
    DropdownOption | undefined
  >(undefined);
  const [howDoYouGetPaidSelectedBank, setHowDoYouGetPaidSelectedBank] =
    useState<boolean>(false);

  const [personalTaxesSelected, setPersonalTaxesSelected] = useState<
    DropdownOption | undefined
  >(undefined);

  const [businessTaxesSelected, setBusinessTaxesSelected] = useState<
    DropdownOption | undefined
  >(undefined);

  const [isBusinessIncomeBased, setIsBusinessIncomeBased] = useState(false);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "employments",
  });

  // Initialize state from form values (for saved drafts)
  useEffect(() => {
    const formValues = form.getValues();

    if (formValues.interestedProduct) {
      const product = FundingProductTypeEnum.find(
        (p) => p.value === formValues.interestedProduct
      );
      if (product) {
        setInterestedProductSelected(product);
        setIsBusinessIncomeBased(
          formValues.interestedProduct === "Business Income Based Funding"
        );
        setIsAutoLoan(formValues.interestedProduct === "Auto Loan");
        setIsEquipmentFinancing(product.type.includes("Equipment Financing"));
        if (product.type.includes("Business")) {
          refetchBusinesses();
        }
      }
    }

    if (formValues.vehicleFinancingType) {
      setVehicleFinancingType(formValues.vehicleFinancingType);
    }

    if (formValues.howDoYouGetPaid) {
      const option = howDoYouGetPaid.find(
        (x) => x.value === formValues.howDoYouGetPaid
      );
      if (option) {
        setHowDoYouGetPaidSelected(option);
        if (
          option.value === "yes_direct_deposit" ||
          option.value === "yes_checks"
        ) {
          setHowDoYouGetPaidSelectedBank(true);
        }
      }
    }

    if (formValues.legalResident === "Other") {
      setShowLegalResidentOther(true);
    }

    if (formValues.personalTaxes) {
      const option = personalTaxes.find(
        (x) => x.value === formValues.personalTaxes
      );
      if (option) setPersonalTaxesSelected(option);
    }

    if (formValues.businessTaxes) {
      const option = businessTaxes.find(
        (x) => x.value === formValues.businessTaxes
      );
      if (option) setBusinessTaxesSelected(option);
    }
  }, [form, refetchBusinesses]);

  const SOCIAL_MEDIA_PLATFORMS = [
    { value: "TikTok", label: "TikTok" },
    { value: "Youtube", label: "Youtube" },
    { value: "Instagram", label: "Instagram" },
    { value: "Facebook", label: "Facebook" },
    { value: "X", label: "X" },
  ];

  useEffect(() => {
    if (interestedProductSelected) {
      setIsCommunity(interestedProductSelected.type.includes("Community"));
      setIsEquipmentFinancing(
        interestedProductSelected.type.includes("Equipment Financing")
      );
      setIsTradeLines(interestedProductSelected.type.includes("Tradelines"));
    }
  }, [interestedProductSelected]);

  const handleLegalResidentChange = useCallback((value: string) => {
    if (value === "Other") {
      setShowLegalResidentOther(true);
    } else {
      setShowLegalResidentOther(false);
    }
  }, []);

  const handleInterestedProductChange = useCallback(
    (value: string) => {
      const selectedProduct = FundingProductTypeEnum.find(
        (product) => product.value === value
      );
      if (selectedProduct) {
        setInterestedProductSelected(selectedProduct);
        form.setValue("fundingType", selectedProduct.type, {
          shouldValidate: true,
          shouldDirty: true,
        });

        // Check if it's Business Income Based Funding
        setIsBusinessIncomeBased(value === "Business Income Based Funding");

        // Check if it's Auto Loan
        setIsAutoLoan(value === "Auto Loan");

        if (selectedProduct.type.includes("Business")) {
          refetchBusinesses();
        }
      }
    },
    [form, refetchBusinesses]
  );

  const handleDoYouHaveAJobChange = useCallback(
    (value: string) => {
      const selectedValue = howDoYouGetPaid.find((x) => x.value === value);
      if (selectedValue) {
        setHowDoYouGetPaidSelected(selectedValue);
        form.setValue("employmentStatus", selectedValue.type!, {
          shouldValidate: true,
          shouldDirty: true,
        });
        if (
          selectedValue.value === "yes_direct_deposit" ||
          selectedValue.value === "yes_checks"
        ) {
          setHowDoYouGetPaidSelectedBank(true);
        } else {
          setHowDoYouGetPaidSelectedBank(false);
        }
      }
    },
    [form]
  );

  const handlePersonalTaxesChange = useCallback(
    (value: string) => {
      const selectedValue = personalTaxes.find((x) => x.value === value);
      if (selectedValue) {
        setPersonalTaxesSelected(selectedValue);
        form.setValue("personalTaxesStatus", selectedValue.type!, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    },
    [form]
  );

  const handleBusinessTaxesChange = useCallback(
    (value: string) => {
      const selectedValue = businessTaxes.find((x) => x.value === value);
      if (selectedValue) {
        setBusinessTaxesSelected(selectedValue);
        form.setValue("businessTaxesStatus", selectedValue.type!, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    },
    [form]
  );

  const handleVehicleFinancingTypeChange = useCallback((value: string) => {
    setVehicleFinancingType(value);
  }, []);

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle bank statements upload
  const handleBankStatementsUpload = useCallback(
    async (files: File[]) => {
      try {
        const currentDocs = form.getValues("bankStatements") || [];
        const newDocs = await Promise.all(
          files.map(async (file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
            base64: await fileToBase64(file),
          }))
        );
        form.setValue("bankStatements", [...currentDocs, ...newDocs], {
          shouldDirty: true,
        });
      } catch (error) {
        console.error("Error converting files to base64:", error);
        alert("Failed to process files. Please try again.");
      }
    },
    [form]
  );

  // Handle driver license upload
  const handleDriverLicenseUpload = useCallback(
    async (files: File[]) => {
      try {
        const currentDocs = form.getValues("driverLicenseDocuments") || [];
        const newDocs = await Promise.all(
          files.map(async (file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
            base64: await fileToBase64(file),
          }))
        );
        form.setValue("driverLicenseDocuments", [...currentDocs, ...newDocs], {
          shouldDirty: true,
        });
      } catch (error) {
        console.error("Error converting files to base64:", error);
        alert("Failed to process files. Please try again.");
      }
    },
    [form]
  );

  // Remove bank statement
  const removeBankStatement = useCallback(
    (index: number) => {
      const currentDocs = form.getValues("bankStatements") || [];
      const updatedDocs = currentDocs.filter((_, i) => i !== index);
      form.setValue("bankStatements", updatedDocs, { shouldDirty: true });
    },
    [form]
  );

  // Remove driver license document
  const removeDriverLicense = useCallback(
    (index: number) => {
      const currentDocs = form.getValues("driverLicenseDocuments") || [];
      const updatedDocs = currentDocs.filter((_, i) => i !== index);
      form.setValue("driverLicenseDocuments", updatedDocs, {
        shouldDirty: true,
      });
    },
    [form]
  );

  const currentYear = new Date().getFullYear();

  return (
    <>
      <input type="hidden" {...form.register("fundingType")} />
      <input type="hidden" {...form.register("userId")} />
      <input type="hidden" {...form.register("status")} />

      <div className="space-y-6">
        <Card className="bg-slate-100 border-slate-200">
          <CardHeader className="px-4 md:px-6">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <span>💼</span> Product Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <CustomFormField
                name={"interestedProduct"}
                label="The Product You're Most Interested In"
                type="select"
                placeholder=" "
                options={FundingProductTypeEnum.map((type) => ({
                  value: type.value,
                  label: type.label,
                }))}
                onSelectValue={handleInterestedProductChange}
              />
              {interestedProductSelected?.type?.includes("Personal") &&
                !isTradeLines && (
                  <CustomFormField
                    name={"personalAmountFunding"}
                    label="How Much Personal Funding Are You Looking For?"
                    type="number"
                  />
                )}
              {(isCommunity || isAutoLoan) && (
                <CustomFormField
                  name={"personalAmountFunding"}
                  label="How much funding are you looking for?"
                  type="number"
                />
              )}
              {isEquipmentFinancing && !isAutoLoan && (
                <CustomFormField
                  className="col-span-2"
                  name={"personalAmountFunding"}
                  label="How much in equipment financing are you looking for?"
                  type="number"
                />
              )}
              {isTradeLines && (
                <CustomFormField
                  name={"personalAmountFunding"}
                  label="How much funding are you looking for?"
                  type="number"
                />
              )}
              {interestedProductSelected?.type?.includes("Business") &&
                !isTradeLines && (
                  <CustomFormField
                    name={"businessAmountFunding"}
                    label="How Much Business Funding Are You Looking For?"
                    type="number"
                  />
                )}
            </div>
          </CardContent>
        </Card>

        {/* Auto Loan Specific Fields */}
        {isAutoLoan && (
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-orange-200">
            <CardHeader className="px-4 md:px-6 py-4">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <span>🚗</span> Auto Loan Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-4 md:px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <CustomFormField
                  name="vehiclePrice"
                  label="What's the price of the vehicle you want to purchase?"
                  type="number"
                />
                <CustomFormField
                  name="vehiclePurchaseSource"
                  label="Where are you buying the car from?"
                  type="select"
                  options={[
                    {
                      value: "Independent Dealer",
                      label: "Independent Dealer",
                    },
                    { value: "Franchise Dealer", label: "Franchise Dealer" },
                    { value: "Private Party", label: "Private Party" },
                    {
                      value: "Refinancing Current Auto",
                      label: "Refinancing Current Auto",
                    },
                  ]}
                />
              </div>

              <CustomFormField
                name="vehicleVIN"
                label="Do you know VIN# of the vehicle you want to finance? (Optional)"
                placeholder="Enter VIN number"
              />

              <CustomFormField
                name="vehicleFinancingType"
                label="Are you financing the vehicle under your business or personal credit?"
                type="select"
                onSelectValue={handleVehicleFinancingTypeChange}
                options={[
                  { value: "Personal", label: "Personal" },
                  { value: "Business", label: "Business" },
                ]}
              />
            </CardContent>
          </Card>
        )}

        {!isCommunity && !isTradeLines && (
          <Card className="bg-slate-100 border-slate-200">
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <span>👤</span> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-4 md:px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
                {!isTradeLines && false && (
                  <CustomFormField
                    name={"isMarried"}
                    label={"Are you married?"}
                    type="select"
                    options={isMarried}
                  />
                )}

                <CustomFormField
                  name={"legalResident"}
                  onSelectValue={handleLegalResidentChange}
                  label={"Immigration Status?"}
                  type="select"
                  options={legalResident}
                />
                {showLegalResidentOther && (
                  <CustomFormField
                    name={"currentSituation"}
                    type="textarea"
                    label="Please explain your current situation"
                  />
                )}
              </div>
              {!isTradeLines && false && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomFormField
                    name={"driverLicenseNumber"}
                    label={"Driver's License Number?"}
                  />
                  <CustomFormField
                    name={"driverLicenseState"}
                    label={"State?"}
                    type="select"
                    placeholder="Select a state"
                    options={US_STATES}
                  />
                  <CustomFormField
                    name={"driverLicenseIssueDate"}
                    label={"Issue Date?"}
                    type="date-picker"
                    dateAfterHidden={new Date()}
                  />
                  <CustomFormField
                    name={"driverLicenseIssueExpiryDate"}
                    label={"Expiry Date?"}
                    type="date-picker"
                    // dateBeforeHidden={new Date()}
                  />
                  <Separator />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CustomFormField
                  className="md:col-span-2"
                  name={"addressStreet"}
                  label={"Street Address"}
                />
                <CustomFormField
                  name={"houseNumber"}
                  label={"Apartment/Suite/Unit/House Number"}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CustomFormField name={"addressCity"} label={"City"} />
                <CustomFormField
                  name={"addressState"}
                  label={"State"}
                  type="select"
                  placeholder="Select a state"
                  options={US_STATES}
                />
                <CustomFormField name={"addressPostal"} label={"Zip Code"} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CustomFormField
                  name={"moveInCurrentAddress"}
                  label={"When did you move in to your current address?"}
                  type="date-picker"
                />
                <CustomFormField
                  name={"payPerMonth"}
                  type="number"
                  label={"How much do you pay a month?"}
                />
                <CustomFormField
                  name={"rentOrMortgage"}
                  label={"Is it rent or mortgage? If else, please specify"}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {isCommunity && (
          <Card className="bg-slate-100 border-slate-200">
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <span>🤝</span> Community Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-4 md:px-6">
              <CustomFormField
                name={"reasonForJoiningCommunity"}
                label={"What's the most important reason for joining?"}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CustomFormField
                  className="md:col-span-2"
                  name={"addressStreet"}
                  label={"Street Address"}
                />
                <CustomFormField
                  name={"houseNumber"}
                  label={"Apartment/Suite/Unit/House Number"}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CustomFormField name={"addressCity"} label={"City"} />
                <CustomFormField
                  name={"addressState"}
                  label={"State"}
                  type="select"
                  placeholder="Select a state"
                  options={US_STATES}
                />
                <CustomFormField name={"addressPostal"} label={"Zip Code"} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CustomFormField
                  name={"moveInCurrentAddress"}
                  label={"When did you move in to your current address?"}
                  type="date-picker"
                />
                <CustomFormField
                  name={"payPerMonth"}
                  type="number"
                  label={"How much do you pay a month?"}
                />
                <CustomFormField
                  name={"rentOrMortgage"}
                  label={"Is it rent or mortgage? If else, please specify"}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {isTradeLines && (
          <Card className="bg-slate-100 border-slate-200">
            <CardHeader className="px-4 md:px-6 py-4">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <span>💳</span> Tradelines Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-4 md:px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <CustomFormField
                  className="md:col-span-2"
                  name={"addressStreet"}
                  label={"Street Address"}
                />
                <CustomFormField
                  name={"houseNumber"}
                  label={"Apartment/Suite/Unit/House Number"}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CustomFormField name={"addressCity"} label={"City"} />
                <CustomFormField
                  name={"addressState"}
                  label={"State"}
                  type="select"
                  placeholder="Select a state"
                  options={US_STATES}
                />
                <CustomFormField name={"addressPostal"} label={"Zip Code"} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomFormField
                  name={"experianUsername"}
                  label={"Experian Username"}
                />
                <CustomFormField
                  name={"experianPassword"}
                  label={"Experian Password"}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomFormField
                  name={"creditKarmaUsername"}
                  label={"Credit Karma Username"}
                />
                <CustomFormField
                  name={"creditKarmaPassword"}
                  label={"Credit Karma Password"}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {!isTradeLines &&
          interestedProductSelected &&
          (!isAutoLoan ||
            (isAutoLoan && vehicleFinancingType === "Personal")) && (
            <Card className="bg-slate-100 border-slate-200">
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="flex flex-col md:flex-row justify-between gap-3 md:gap-2 text-base md:text-lg">
                  <div className="flex items-center gap-2">
                    <span>💼</span> Employment Information
                  </div>
                  {howDoYouGetPaidSelectedBank && (
                    <PlaidLink displayText="Link Personal Account" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 px-4 md:px-6">
                <CustomFormField
                  name={"howDoYouGetPaid"}
                  label={"Do you have a job?"}
                  type="select"
                  options={howDoYouGetPaid}
                  onSelectValue={handleDoYouHaveAJobChange}
                />

                {howDoYouGetPaidSelected?.type === "yes" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                      <CustomFormField
                        name={"employmentPayPerMonth"}
                        type="number"
                        label={"How much money do you make per month?"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CustomFormField
                        name={"employmentEmployerName"}
                        label={"Employer Name?"}
                      />
                      <CustomFormField
                        name={"employmentEmployerPhoneNumber"}
                        label={"Employer Phone Number?"}
                      />
                    </div>
                    {/* <CustomFormField
                            name={"employmentEmployerAddress"}
                            label={"Employer Address?"}
                          /> */}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <CustomFormField
                        className="md:col-span-2"
                        name={"employmentEmployerAddressStreet"}
                        label={"Street Address"}
                      />
                      <CustomFormField
                        name={"employmentEmployerHouseNumber"}
                        label={"Apartment/Suite/Unit/House Number"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <CustomFormField
                        name={"employmentEmployerAddressCity"}
                        label={"City"}
                      />
                      <CustomFormField
                        name={"employmentEmployerAddressState"}
                        label={"State"}
                        type="select"
                        placeholder="Select a state"
                        options={US_STATES}
                      />
                      <CustomFormField
                        name={"employmentEmployerAddressPostal"}
                        label={"Zip Code"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CustomFormField
                        name={"employmentOccupation"}
                        label={"Your Occupation?"}
                      />
                      <CustomFormField
                        name={"employmentDateOfHire"}
                        type="date-picker"
                        label={"Date of Hire?"}
                        // dateAfterHidden={new Date()}
                      />
                    </div>

                    {fields.map((field, index) => {
                      const colors = [
                        "bg-blue-50 border-blue-200",
                        "bg-green-50 border-green-200",
                        "bg-orange-50 border-orange-200",
                        "bg-purple-50 border-purple-200",
                      ];
                      const colorClass = colors[index % colors.length];

                      return (
                        <div
                          key={field.id}
                          className={`space-y-4 border rounded-md p-4 mt-4 ${colorClass}`}
                        >
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium">
                              Additional Employment {index + 1}
                            </h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CustomFormField
                              name={`employments.${index}.howDoYouGetPaid`}
                              label={"Do you have a job?"}
                              type="select"
                              options={howDoYouGetPaid.filter(
                                (x) => x.value !== "no_work"
                              )}
                            />
                            <CustomFormField
                              name={`employments.${index}.employmentPayPerMonth`}
                              type="number"
                              label={"How much money do you make per month?"}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CustomFormField
                              name={`employments.${index}.employmentEmployerName`}
                              label={"Employer Name?"}
                            />
                            <CustomFormField
                              name={`employments.${index}.employmentOccupation`}
                              label={"Your Occupation?"}
                            />
                          </div>
                        </div>
                      );
                    })}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full md:w-fit min-h-[44px]"
                      onClick={() =>
                        append({
                          howDoYouGetPaid: "",
                          employmentPayPerMonth: 0,
                          employmentEmployerName: "",
                          employmentOccupation: "",
                        })
                      }
                    >
                      <Plus className="h-4 w-4" /> Add Another Employment
                    </Button>

                    <CustomFormField
                      name={"personalTaxes"}
                      label={"Did you file your personal taxes?"}
                      type="select"
                      options={personalTaxes}
                      onSelectValue={handlePersonalTaxesChange}
                    />
                    {personalTaxesSelected?.type === "yes" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <CustomFormField
                          name={"personalTaxes1"}
                          type="number"
                          label={`Gross Revenue ${currentYear - 1}?`}
                        />
                        <CustomFormField
                          name={"personalTaxes2"}
                          type="number"
                          label={`Gross Revenue ${currentYear - 2}?`}
                        />
                        <CustomFormField
                          name={"personalTaxes3"}
                          type="number"
                          label={`Gross Revenue ${currentYear - 3}?`}
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

        {(interestedProductSelected?.type?.includes("Business") ||
          isCommunity ||
          (!isAutoLoan && isEquipmentFinancing) ||
          (isAutoLoan && vehicleFinancingType === "Business")) &&
          !isTradeLines && (
            <Card className="bg-slate-100 border-slate-200">
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <span>🏢</span> Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <CustomFormField
                    name="businessName"
                    label="* Business Name"
                  />
                  <CustomFormField
                    name="employerIdentificationNumber"
                    label="* Employer Identification Number"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomFormField
                    name="businessEmail"
                    type="email"
                    label="* Email Address"
                  />
                  <CustomFormField
                    name="businessPhoneNumber"
                    label="* Phone Number"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CustomFormField
                    className="md:col-span-2"
                    name="businessStreetAddress"
                    label="* Street Address"
                  />
                  <CustomFormField
                    name="businessStreetHouseNumber"
                    label="Apartment/Suite/Unit/House Number"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CustomFormField name="businessCityAddress" label="* City" />
                  <CustomFormField
                    name="businessStateAddress"
                    label="* State"
                    type="select"
                    placeholder="Select a state"
                    options={US_STATES}
                  />
                  <CustomFormField
                    name="businessPostalAddress"
                    label="* Zip Code"
                  />
                </div>

                <CustomFormField name="businessWebsite" label="Website" />

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <span>📱</span> Social Media Handles
                  </label>
                  <div className="space-y-3">
                    {SOCIAL_MEDIA_PLATFORMS.map((platform, index) => (
                      <div
                        key={platform.value}
                        className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3"
                      >
                        <label
                          htmlFor={`socialMedia.${index}.handle`}
                          className="text-sm text-muted-foreground md:w-24"
                        >
                          {platform.label}
                        </label>
                        <div className="flex-1">
                          <CustomFormField
                            name={`socialMedia.${index}.handle`}
                            placeholder={`Enter ${platform.label} handle`}
                          />
                        </div>
                        <input
                          type="hidden"
                          {...form.register(`socialMedia.${index}.platform`)}
                          value={platform.value}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <span>📊</span> Financial Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomFormField
                      name="dateOfIncorporation"
                      type="date-picker"
                      label="Date of Incorporation?"
                    />
                    <CustomFormField
                      name="stateOfIncorporation"
                      label="State of Incorporation?"
                      type="select"
                      placeholder="Select a state"
                      options={US_STATES}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomFormField
                      name="businessGrossProjectedRevenue1"
                      type="number"
                      label={`${currentYear} Gross Projected Revenue?`}
                    />
                    <CustomFormField
                      name="businessProjectedProfit1"
                      type="number"
                      label={`${currentYear} Projected Profit?`}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomFormField
                      name="businessGrossProjectedRevenue2"
                      type="number"
                      label={`${currentYear - 1} Gross Revenue?`}
                    />
                    <CustomFormField
                      name="businessProjectedProfit2"
                      type="number"
                      label={`${currentYear - 1} Net Revenue?`}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomFormField
                      name="businessGrossProjectedRevenue3"
                      type="number"
                      label={`${currentYear - 2} Gross Revenue?`}
                    />
                    <CustomFormField
                      name="businessProjectedProfit3"
                      type="number"
                      label={`${currentYear - 2} Net Revenue?`}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomFormField
                      name="industryField"
                      label="Industry Field?"
                    />
                    <CustomFormField
                      name="businessTaxes"
                      label="Did you report on your business taxes?"
                      type="select"
                      options={businessTaxes}
                      onSelectValue={handleBusinessTaxesChange}
                    />
                  </div>

                  {businessTaxesSelected?.type === "yes" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <CustomFormField
                        name="businessTaxes1"
                        type="number"
                        label={`in ${currentYear - 1}?`}
                      />
                      <CustomFormField
                        name="businessTaxes2"
                        type="number"
                        label={`in ${currentYear - 2}?`}
                      />
                      <CustomFormField
                        name="businessTaxes3"
                        type="number"
                        label={`in ${currentYear - 3}?`}
                      />
                    </div>
                  )}

                  {/* Bridge Loan Application Form (Business Income Based Funding) */}
                  {isBusinessIncomeBased && (
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200">
                      <CardContent className="space-y-6 px-4 md:px-6">
                        {/* Use of Funds */}
                        <CustomFormField
                          name="useOfFunds"
                          label="Use of Funds"
                        />

                        {/* Financial Metrics */}
                        <Separator className="my-4" />
                        <h4 className="font-medium text-indigo-900 flex items-center gap-2">
                          <span>💰</span> Financial Information
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <CustomFormField
                            name="annualBusinessRevenue"
                            type="number"
                            label="Annual Business Revenue"
                          />
                          <CustomFormField
                            name="avgMonthlyCreditCardSales"
                            type="number"
                            label="Avg. Monthly Credit Card Sales"
                          />
                          <CustomFormField
                            name="avgDailyBankBalance"
                            type="number"
                            label="Avg. Daily Bank Balance"
                          />
                        </div>

                        {/* Business Property Information */}
                        <Separator className="my-4" />
                        <h4 className="font-medium text-indigo-900 flex items-center gap-2">
                          <span>🏠</span> Business Property Information
                        </h4>

                        <CustomFormField
                          name="businessPropertyType"
                          label="* Business Property Type"
                          type="select"
                          placeholder="Select type"
                          options={[
                            { value: "Lease", label: "Lease" },
                            { value: "Own", label: "Own" },
                          ]}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <CustomFormField
                            name="landlordName"
                            label="Landlord Name"
                          />
                          <CustomFormField
                            name="landlordPhone"
                            label="Landlord Phone"
                          />
                          <CustomFormField
                            name="monthlyPayment"
                            type="number"
                            label="Monthly Payment"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <CustomFormField
                            name="isSeasonalBusiness"
                            label="* Is this a seasonal business?"
                            type="select"
                            placeholder="Select option"
                            options={[
                              { value: "No", label: "No" },
                              { value: "Yes", label: "Yes" },
                            ]}
                          />
                          <CustomFormField
                            name="hasOutstandingAdvances"
                            label="* Any outstanding advances?"
                            type="select"
                            placeholder="Select option"
                            options={[
                              { value: "No", label: "No" },
                              { value: "Yes", label: "Yes" },
                            ]}
                          />
                        </div>

                        {/* Additional Information */}
                        <Separator className="my-4" />
                        <h4 className="font-medium text-indigo-900 flex items-center gap-2">
                          <span>ℹ️</span> Additional Information
                        </h4>

                        {/* Referral */}
                        <CustomFormField
                          name="whoReferredYou"
                          label="Who Referred You?"
                        />

                        {/* Document Upload Section */}
                        <Separator className="my-4" />
                        <h4 className="font-medium text-indigo-900 flex items-center gap-2 mb-4">
                          <span>📄</span> Required Documents
                        </h4>

                        {/* No documents uploaded message */}
                        {bankStatementsFromForm.length === 0 &&
                          driverLicenseDocsFromForm.length === 0 && (
                            <div className="mb-4 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
                              <div className="flex items-start gap-2 sm:gap-3">
                                <svg
                                  className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 flex-shrink-0 mt-0.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                  />
                                </svg>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs sm:text-sm font-medium text-amber-900 mb-1">
                                    No Documents Uploaded Yet
                                  </p>
                                  <p className="text-xs sm:text-sm text-amber-700">
                                    Please upload the required documents below
                                    to complete your Business Income Based
                                    Funding application. You'll need your bank
                                    statements and driver's license.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Bank Statements Upload - PDF Only */}
                        <div className="border-2 border-dashed border-indigo-300 rounded-lg p-3 sm:p-4 md:p-6 lg:p-8 bg-white mb-3 sm:mb-4">
                          <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 flex-shrink-0 mt-0.5 sm:mt-1" />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-indigo-900 mb-1">
                                4 Months Bank Statements
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                                Upload your last 4 months of bank statements
                                (PDF only, multiple files allowed)
                              </p>
                              {bankStatementsFromForm.length > 0 && (
                                <div className="mb-2 sm:mb-3">
                                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1.5 sm:mb-2">
                                    {bankStatementsFromForm.length} file(s)
                                    selected:
                                  </p>
                                  <ul className="space-y-1.5 sm:space-y-2 max-w-full">
                                    {bankStatementsFromForm.map((file, idx) => (
                                      <li
                                        key={idx}
                                        className="text-xs sm:text-sm text-gray-700 flex items-center gap-1.5 sm:gap-2 bg-gray-50 p-1.5 sm:p-2 rounded min-h-[36px] sm:min-h-[40px] w-full min-w-0"
                                      >
                                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0" />
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                          <span className="block truncate text-ellipsis overflow-hidden whitespace-nowrap">
                                            {file.name}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                                          <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap hidden sm:inline">
                                            ({(file.size / 1024).toFixed(1)} KB)
                                          </span>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              removeBankStatement(idx)
                                            }
                                            className="h-7 w-7 min-w-[28px] p-0 hover:bg-red-100 cursor-pointer touch-manipulation"
                                          >
                                            <CircleX className="h-4 w-4 text-red-500" />
                                          </Button>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                          <Dropzone
                            maxFiles={10}
                            accept={{
                              "application/pdf": [".pdf"],
                            }}
                            className="cursor-pointer"
                            onDrop={async (files) => {
                              const pdfFiles = files.filter(
                                (f) => f.type === "application/pdf"
                              );
                              if (pdfFiles.length !== files.length) {
                                alert("Only PDF files are allowed!");
                                return;
                              }
                              await handleBankStatementsUpload(pdfFiles);
                            }}
                          >
                            <DropzoneEmptyState>
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-400" />
                                <p className="text-sm sm:text-base font-medium">
                                  Drop PDF files here or click to browse
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  PDF only, up to 10 files
                                </p>
                              </div>
                            </DropzoneEmptyState>
                            <DropzoneContent />
                          </Dropzone>
                          {bankStatementsFromForm.length > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                form.setValue("bankStatements", [], {
                                  shouldDirty: true,
                                })
                              }
                              className="mt-2 sm:mt-3 cursor-pointer min-h-[36px] sm:min-h-[40px] touch-manipulation"
                            >
                              Clear All
                            </Button>
                          )}
                        </div>

                        {/* Driver License Upload - PDF or Images */}
                        <div className="border-2 border-dashed border-indigo-300 rounded-lg p-3 sm:p-4 md:p-6 lg:p-8 bg-white">
                          <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 flex-shrink-0 mt-0.5 sm:mt-1" />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-indigo-900 mb-1">
                                Copy of Driver License
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                                Upload front and back of your driver license
                                (PDF or Images, multiple files allowed)
                              </p>
                              {driverLicenseDocsFromForm.length > 0 && (
                                <div className="mb-2 sm:mb-3">
                                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1.5 sm:mb-2">
                                    {driverLicenseDocsFromForm.length} file(s)
                                    selected:
                                  </p>
                                  <ul className="space-y-1.5 sm:space-y-2 max-w-full">
                                    {driverLicenseDocsFromForm.map(
                                      (file, idx) => (
                                        <li
                                          key={idx}
                                          className="text-xs sm:text-sm text-gray-700 flex items-center gap-1.5 sm:gap-2 bg-gray-50 p-1.5 sm:p-2 rounded min-h-[36px] sm:min-h-[40px] w-full min-w-0"
                                        >
                                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0" />
                                          <div className="flex-1 min-w-0 overflow-hidden">
                                            <span className="block truncate text-ellipsis overflow-hidden whitespace-nowrap">
                                              {file.name}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                                            <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap hidden sm:inline">
                                              ({(file.size / 1024).toFixed(1)}{" "}
                                              KB)
                                            </span>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                removeDriverLicense(idx)
                                              }
                                              className="h-7 w-7 min-w-[28px] p-0 hover:bg-red-100 cursor-pointer touch-manipulation"
                                            >
                                              <CircleX className="h-4 w-4 text-red-500" />
                                            </Button>
                                          </div>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                          <Dropzone
                            maxFiles={10}
                            accept={{
                              "application/pdf": [".pdf"],
                              "image/*": [".png", ".jpg", ".jpeg", ".gif"],
                            }}
                            className="cursor-pointer"
                            onDrop={async (files) => {
                              const validFiles = files.filter(
                                (f) =>
                                  f.type === "application/pdf" ||
                                  f.type.startsWith("image/")
                              );
                              if (validFiles.length !== files.length) {
                                alert("Only PDF and image files are allowed!");
                                return;
                              }
                              await handleDriverLicenseUpload(validFiles);
                            }}
                          >
                            <DropzoneEmptyState>
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-400" />
                                <p className="text-sm sm:text-base font-medium">
                                  Drop PDF or image files here or click to
                                  browse
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  PDF or Images (PNG, JPG, JPEG, GIF), up to 10
                                  files
                                </p>
                              </div>
                            </DropzoneEmptyState>
                            <DropzoneContent />
                          </Dropzone>
                          {driverLicenseDocsFromForm.length > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                form.setValue("driverLicenseDocuments", [], {
                                  shouldDirty: true,
                                })
                              }
                              className="mt-2 sm:mt-3 cursor-pointer min-h-[36px] sm:min-h-[40px] touch-manipulation"
                            >
                              Clear All
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </>
  );
}
