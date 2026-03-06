"use client";

import React, {
  useCallback,
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomFormField } from "@/components/CustomFormField";
import {
  ApplyFunding,
  FUNDING_PRODUCTS_BY_CATEGORY,
  FundingProductTypeEnum,
  FundingProductEnumType,
} from "@/schema/apply-funding";
import {
  businessTaxes,
  howDoYouGetPaid,
  legalResident,
  personalTaxes,
  US_STATES,
} from "@/constant/common";
import { Plus, Trash2, CircleX } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Business } from "@/schema";
import PlaidLink from "../PlaidLink";
import { Separator } from "../ui/separator";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { FileText, Upload } from "lucide-react";

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
  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState<
    string | undefined
  >(undefined);
  const [socialMediaHandles, setSocialMediaHandles] = useState<
    Record<string, string>
  >({});
  const socialMediaInitialized = useRef(false);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "employments",
  });

  const updateDerivedStates = useCallback((products: string[]) => {
    setIsAutoLoan(products.some((p) => p.includes("Auto Loan")));
    setIsEquipmentFinancing(products.includes("Business Equipment Financing"));
    setIsBusinessIncomeBased(
      products.includes("Business Income Based Funding"),
    );
  }, []);

  // Initialize state from form values (for saved drafts)
  useEffect(() => {
    const formValues = form.getValues();

    if (formValues.interestedProduct) {
      const product = FundingProductTypeEnum.find(
        (p) => p.value === formValues.interestedProduct,
      );
      if (product) {
        setInterestedProductSelected(product);
        if (product.type.includes("Business")) {
          refetchBusinesses();
        }
      }
    }

    if (formValues.fundingProducts) {
      updateDerivedStates(formValues.fundingProducts);
    }

    if (formValues.vehicleFinancingType) {
      setVehicleFinancingType(formValues.vehicleFinancingType);
    }

    if (formValues.howDoYouGetPaid) {
      const option = howDoYouGetPaid.find(
        (x) => x.value === formValues.howDoYouGetPaid,
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
        (x) => x.value === formValues.personalTaxes,
      );
      if (option) setPersonalTaxesSelected(option);
    }

    // Initialize social media handles from form (only once)
    if (
      formValues.socialMedia &&
      formValues.socialMedia.length > 0 &&
      !socialMediaInitialized.current
    ) {
      const handles: Record<string, string> = {};
      formValues.socialMedia.forEach((item) => {
        if (item?.platform && item?.handle) {
          handles[item.platform] = item.handle;
        }
      });
      setSocialMediaHandles(handles);

      // Set the first platform as selected if exists
      if (formValues.socialMedia[0]?.platform) {
        setSelectedSocialPlatform(formValues.socialMedia[0].platform);
      }

      socialMediaInitialized.current = true;
    }
  }, [form, refetchBusinesses]);

  const SOCIAL_MEDIA_PLATFORMS = [
    { value: "Instagram", label: "Instagram" },
    { value: "Facebook", label: "Facebook" },
    { value: "YouTube", label: "YouTube" },
    { value: "TikTok", label: "TikTok" },
  ];

  useEffect(() => {
    if (interestedProductSelected) {
      setIsCommunity(interestedProductSelected.type.includes("Community"));
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
        (product) => product.value === value,
      );
      if (selectedProduct) {
        setInterestedProductSelected(selectedProduct);
        form.setValue("fundingType", selectedProduct.type, {
          shouldValidate: true,
          shouldDirty: true,
        });

        // Clear product checkboxes and reset derived states when category changes
        form.setValue("fundingProducts", [], { shouldDirty: true });
        updateDerivedStates([]);

        if (selectedProduct.type.includes("Business")) {
          refetchBusinesses();
        }
      }
    },
    [form, refetchBusinesses, updateDerivedStates],
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
    [form],
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
    [form],
  );

  const handleVehicleFinancingTypeChange = useCallback((value: string) => {
    setVehicleFinancingType(value);
  }, []);

  // Handle social media platform change
  const handleSocialPlatformChange = useCallback(
    (platform: string) => {
      setSelectedSocialPlatform(platform);

      // Get the handle for the newly selected platform, or empty string if none exists
      const currentHandle = socialMediaHandles[platform] || "";
      form.setValue("socialMedia.0.handle", currentHandle, {
        shouldDirty: true,
      });
    },
    [socialMediaHandles, form],
  );

  // Handle social media handle change
  const handleSocialHandleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newHandle = e.target.value;

      if (selectedSocialPlatform) {
        // Update local state
        setSocialMediaHandles((prev) => ({
          ...prev,
          [selectedSocialPlatform]: newHandle,
        }));

        // Update form with all social media entries
        // Make sure current platform is always at index 0
        const updatedHandles = {
          ...socialMediaHandles,
          [selectedSocialPlatform]: newHandle,
        };

        const allEntries = Object.entries(updatedHandles)
          .filter(([_, handle]) => handle.trim() !== "") // Only include non-empty handles
          .map(([platform, handle]) => ({
            platform,
            handle,
          }));

        // Sort to put selected platform first
        const sortedEntries = [
          ...allEntries.filter(
            (entry) => entry.platform === selectedSocialPlatform,
          ),
          ...allEntries.filter(
            (entry) => entry.platform !== selectedSocialPlatform,
          ),
        ];

        form.setValue("socialMedia", sortedEntries, {
          shouldDirty: true,
        });

        // Explicitly set the platform field to ensure it doesn't change
        form.setValue("socialMedia.0.platform", selectedSocialPlatform, {
          shouldDirty: true,
        });
      }
    },
    [selectedSocialPlatform, socialMediaHandles, form],
  );

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
          })),
        );
        form.setValue("bankStatements", [...currentDocs, ...newDocs], {
          shouldDirty: true,
        });
      } catch (error) {
        console.error("Error converting files to base64:", error);
        alert("Failed to process files. Please try again.");
      }
    },
    [form],
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
          })),
        );
        form.setValue("driverLicenseDocuments", [...currentDocs, ...newDocs], {
          shouldDirty: true,
        });
      } catch (error) {
        console.error("Error converting files to base64:", error);
        alert("Failed to process files. Please try again.");
      }
    },
    [form],
  );

  // Remove bank statement
  const removeBankStatement = useCallback(
    (index: number) => {
      const currentDocs = form.getValues("bankStatements") || [];
      const updatedDocs = currentDocs.filter((_, i) => i !== index);
      form.setValue("bankStatements", updatedDocs, { shouldDirty: true });
    },
    [form],
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
    [form],
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <CustomFormField
                name={"interestedProduct"}
                label="Type of Funding"
                type="select"
                placeholder="Select funding category"
                options={FundingProductTypeEnum.map((type) => ({
                  value: type.value,
                  label: type.label,
                }))}
                onSelectValue={handleInterestedProductChange}
              />
              {interestedProductSelected?.type?.includes("Personal") && (
                <CustomFormField
                  name={"personalAmountFunding"}
                  label="How Much Personal Funding Are You Looking For?"
                  type="number"
                />
              )}
              {interestedProductSelected?.type?.includes("Business") && (
                <CustomFormField
                  name={"businessAmountFunding"}
                  label="How Much Business Funding Are You Looking For?"
                  type="number"
                />
              )}
              {isCommunity && (
                <CustomFormField
                  name={"personalAmountFunding"}
                  label="How much funding are you looking for?"
                  type="number"
                />
              )}
            </div>

            {interestedProductSelected &&
              (FUNDING_PRODUCTS_BY_CATEGORY[interestedProductSelected.value]
                ?.length ?? 0) > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    Select the specific products you&apos;re interested in:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {FUNDING_PRODUCTS_BY_CATEGORY[
                      interestedProductSelected.value
                    ].map((product) => {
                      const checked =
                        form.watch("fundingProducts")?.includes(product) ??
                        false;
                      return (
                        <label
                          key={product}
                          className="flex items-center gap-2 cursor-pointer rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(val) => {
                              const current =
                                form.getValues("fundingProducts") ?? [];
                              const updated = val
                                ? [...current, product]
                                : current.filter((p) => p !== product);
                              form.setValue("fundingProducts", updated, {
                                shouldDirty: true,
                              });
                              updateDerivedStates(updated);
                            }}
                          />
                          <span className="text-sm">{product}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
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

        {!isCommunity && !false && (
          <Card className="bg-slate-100 border-slate-200">
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <span>👤</span> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-4 md:px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
                {!false && false && (
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
              {!false && false && (
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
                  label={"Apartment/Suite/Unit"}
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
              {!isCommunity && (
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
              )}
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
                  label={"Apartment/Suite/Unit"}
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
            </CardContent>
          </Card>
        )}

        {false && (
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
                  label={"Apartment/Suite/Unit"}
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

        {!isCommunity &&
          interestedProductSelected &&
          !(form.watch("fundingProducts")?.length === 1 &&
            form.watch("fundingProducts")?.includes("Business Income Based Funding")) &&
          (!isAutoLoan ||
            (isAutoLoan && vehicleFinancingType === "Personal")) && (
            <Card className="bg-slate-100 border-slate-200">
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="flex flex-col md:flex-row justify-between gap-3 md:gap-2 text-base md:text-lg">
                  <div className="flex items-center gap-2">
                    <span>💼</span> Employment Information
                  </div>
                  {howDoYouGetPaidSelectedBank && false && (
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <CustomFormField
                        className="md:col-span-2"
                        name={"employmentEmployerAddressStreet"}
                        label={"Street Address"}
                      />
                      <CustomFormField
                        name={"employmentEmployerHouseNumber"}
                        label={"Apartment/Suite/Unit"}
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
                                (x) => x.value !== "no_work",
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

        {isCommunity && (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <CustomFormField
                      name={"employmentPayPerMonth"}
                      type="number"
                      label={"How much money do you make per month?"}
                    />
                    <CustomFormField
                      name={"employmentOccupation"}
                      label={"Your Occupation?"}
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

                        <CustomFormField
                          name={`employments.${index}.howDoYouGetPaid`}
                          label={"Do you have a job?"}
                          type="select"
                          options={howDoYouGetPaid.filter(
                            (x) => x.value !== "no_work",
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <CustomFormField
                            name={`employments.${index}.employmentPayPerMonth`}
                            type="number"
                            label={"How much money do you make per month?"}
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
                </>
              )}
            </CardContent>
          </Card>
        )}

        {(interestedProductSelected?.type?.includes("Business") ||
          isCommunity ||
          isEquipmentFinancing ||
          (isAutoLoan && vehicleFinancingType === "Business")) && (
          <Card className="bg-slate-100 border-slate-200">
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <span>🏢</span> Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-4 md:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <CustomFormField name="businessName" label="* Business Name" />
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
                  label="Apartment/Suite/Unit"
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
                  <span>📱</span> Social Media Handle
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomFormField
                    name="socialMedia.0.platform"
                    label="Platform"
                    type="select"
                    placeholder="Select platform"
                    options={SOCIAL_MEDIA_PLATFORMS}
                    onSelectValue={handleSocialPlatformChange}
                  />
                  <CustomFormField
                    name="socialMedia.0.handle"
                    label="Username/Handle"
                    placeholder="Enter your username"
                    onChange={handleSocialHandleChange}
                    value={
                      selectedSocialPlatform
                        ? socialMediaHandles[selectedSocialPlatform] || ""
                        : ""
                    }
                  />
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

                {/* 2026 Gross Revenue */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomFormField
                    name="businessGrossProjectedRevenue1"
                    type="number"
                    placeholder="Enter amount"
                    label={`${currentYear} Gross Revenue`}
                  />

                  <CustomFormField
                    type="checkbox"
                    label="Filed with IRS?"
                    name="businessFiledWithIRS1"
                  />
                </div>

                {/* 2025 Gross Revenue */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomFormField
                    name="businessGrossProjectedRevenue2"
                    type="number"
                    placeholder="Enter amount"
                    label={`${currentYear - 1} Gross Revenue`}
                  />

                  <CustomFormField
                    type="checkbox"
                    name="businessFiledWithIRS2"
                    label="Filed with IRS?"
                  />
                </div>
                {/* 2024 Gross Revenue */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomFormField
                    name="businessGrossProjectedRevenue3"
                    type="number"
                    placeholder="Enter amount"
                    label={`${currentYear - 2} Gross Revenue`}
                  />

                  <CustomFormField
                    type="checkbox"
                    label="Filed with IRS?"
                    name="businessFiledWithIRS3"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomFormField
                    name="industryField"
                    label="Industry Field?"
                  />
                  <CustomFormField
                    name="ownershipPercentage"
                    type="number"
                    label="Ownership Percentage (%)"
                    placeholder="0-100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200">
          <CardContent className="space-y-6 px-4 md:px-6">
            {/* Bridge Loan Application Form (Business Income Based Funding) */}
            {isBusinessIncomeBased && (
              <>
                {/* Use of Funds */}
                <CustomFormField name="useOfFunds" label="Use of Funds" />

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
                  <CustomFormField name="landlordName" label="Landlord Name" />
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
                <Separator className="my-3 sm:my-4" />
                <h4 className="font-medium text-indigo-900 flex items-center gap-2 mb-3 text-sm sm:text-base">
                  <span>📄</span> Required Documents
                </h4>

                {/* No documents uploaded message */}
                {bankStatementsFromForm.length === 0 &&
                  driverLicenseDocsFromForm.length === 0 && (
                    <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg
                          className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0 mt-0.5"
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
                          <p className="text-[10px] sm:text-xs font-medium text-amber-900 mb-1">
                            No Documents Uploaded Yet
                          </p>
                          <p className="text-[10px] sm:text-xs text-amber-700 leading-tight">
                            Upload bank statements and driver's license below
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Bank Statements Upload - PDF Only */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                    <h3 className="text-xs sm:text-sm font-semibold text-indigo-900">
                      4 Months Bank Statements (PDF only)
                    </h3>
                  </div>
                  {bankStatementsFromForm.length > 0 && (
                    <div className="space-y-1.5">
                      {bankStatementsFromForm.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-gray-50 p-2 rounded text-xs overflow-hidden"
                        >
                          <span className="flex-1 truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBankStatement(idx)}
                            className="h-6 w-6 p-0 hover:bg-red-100 flex-shrink-0"
                          >
                            <CircleX className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Dropzone
                    maxFiles={10}
                    accept={{
                      "application/pdf": [".pdf"],
                    }}
                    className={`cursor-pointer w-full ${
                      form.formState.errors.bankStatements
                        ? "border-red-500 bg-red-50"
                        : ""
                    }`}
                    onDrop={async (files) => {
                      const pdfFiles = files.filter(
                        (f) => f.type === "application/pdf",
                      );
                      if (pdfFiles.length !== files.length) {
                        alert("Only PDF files are allowed!");
                        return;
                      }
                      await handleBankStatementsUpload(pdfFiles);
                    }}
                  >
                    <DropzoneEmptyState>
                      <div className="flex flex-col items-center gap-1.5">
                        <Upload
                          className={`h-6 w-6 ${
                            form.formState.errors.bankStatements
                              ? "text-red-400"
                              : "text-indigo-400"
                          }`}
                        />
                        <p
                          className={`text-xs font-medium ${
                            form.formState.errors.bankStatements
                              ? "text-red-500"
                              : ""
                          }`}
                        >
                          Click to upload
                        </p>
                      </div>
                    </DropzoneEmptyState>
                    <DropzoneContent />
                  </Dropzone>
                  {form.formState.errors.bankStatements && (
                    <p className="text-xs text-red-500 mt-1 font-medium">
                      {form.formState.errors.bankStatements.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Driver License Upload - PDF or Images */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                <h3 className="text-xs sm:text-sm font-semibold text-indigo-900">
                  Driver License (PDF or Images)
                </h3>
              </div>
              {driverLicenseDocsFromForm.length > 0 && (
                <div className="space-y-1.5">
                  {driverLicenseDocsFromForm.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-gray-50 p-2 rounded text-xs overflow-hidden"
                    >
                      <span className="flex-1 truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDriverLicense(idx)}
                        className="h-6 w-6 p-0 hover:bg-red-100 flex-shrink-0"
                      >
                        <CircleX className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Dropzone
                maxFiles={10}
                accept={{
                  "application/pdf": [".pdf"],
                  "image/*": [".png", ".jpg", ".jpeg", ".gif"],
                }}
                className={`cursor-pointer w-full ${
                  form.formState.errors.driverLicenseDocuments
                    ? "border-red-500 bg-red-50"
                    : ""
                }`}
                onDrop={async (files) => {
                  const validFiles = files.filter(
                    (f) =>
                      f.type === "application/pdf" ||
                      f.type.startsWith("image/"),
                  );
                  if (validFiles.length !== files.length) {
                    alert("Only PDF and image files are allowed!");
                    return;
                  }
                  await handleDriverLicenseUpload(validFiles);
                }}
              >
                <DropzoneEmptyState>
                  <div className="flex flex-col items-center gap-1.5">
                    <Upload
                      className={`h-6 w-6 ${
                        form.formState.errors.driverLicenseDocuments
                          ? "text-red-400"
                          : "text-indigo-400"
                      }`}
                    />
                    <p
                      className={`text-xs font-medium ${
                        form.formState.errors.driverLicenseDocuments
                          ? "text-red-500"
                          : ""
                      }`}
                    >
                      Click to upload
                    </p>
                  </div>
                </DropzoneEmptyState>
                <DropzoneContent />
              </Dropzone>
              {form.formState.errors.driverLicenseDocuments && (
                <p className="text-xs text-red-500 mt-1 font-medium">
                  {form.formState.errors.driverLicenseDocuments.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
