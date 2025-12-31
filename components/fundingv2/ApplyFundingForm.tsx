"use client";
import { CustomFormField } from "@/components/CustomFormField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  ApplyFunding,
  applyFundingSchema,
  FundingProductEnumType,
  FundingProductTypeEnum,
} from "@/schema/apply-funding";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BanknoteIcon,
  CheckIcon,
  CircleXIcon,
  Loader2Icon,
  Plus,
  Trash2,
} from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApplyFunding } from "@/hooks/apply-funding";
import {
  businessTaxes,
  howDoYouGetPaid,
  personalTaxes,
  US_STATES,
} from "@/constant/common";
import { useBusinessQuery } from "@/hooks/business";
import { Separator } from "../ui/separator";
import { ConfirmButton } from "../Confirmation";
import ClientBusinessManagement from "../ClientBusinessManagement";
import IconMenu from "../icon-menu";
import { ResponsiveDialog } from "../responsive-dialog";
import { Business } from "@/schema";
import PlaidLink from "../PlaidLink";
import { UserWithId } from "@/schema/registration";
import { toast } from "sonner";
import { useApplyFundingStore } from "@/store/apply-funding-store";

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

type Props = {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCongratsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  data?: ApplyFunding;
  isViewing?: boolean;
  isEditing?: boolean;
  userData: UserWithId;
};

const ApplyFundingForm = ({
  setOpen,
  setCongratsOpen,
  data,
  isViewing,
  isEditing,
  userData,
}: Props) => {
  const { applyFunding, updateApplyFunding, isRecording, isUpdating } =
    useApplyFunding();
  const { updateApplication, clearApplication, getApplication } =
    useApplyFundingStore();

  const [showLegalResidentOther, setShowLegalResidentOther] = useState(false);
  // ...
  const [openBusinessModal, setOpenBusinessModal] = useState(false);
  const [interestedProductSelected, setInterestedProductSelected] = useState<
    FundingProductEnumType | undefined
  >(undefined);
  // const [tradelinesOrShelf, setTradelinesOrShelf] = useState<boolean>(false);
  const [isCommunity, setIsCommunity] = useState<boolean>(false);
  const [isEquipmentFinancing, setIsEquipmentFinancing] =
    useState<boolean>(false);
  const [isTradeLines, setIsTradeLines] = useState<boolean>(false);
  const [isAutoLoan, setIsAutoLoan] = useState<boolean>(false);
  const [vehicleFinancingType, setVehicleFinancingType] = useState<
    string | undefined
  >(undefined);

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

  const [businessIdSelected, setBusinessIdSelected] = useState<
    string | undefined
  >(undefined);

  const {
    businessData,
    isLoading: isBusinessLoading,
    refetch: refetchBusinesses,
  } = useBusinessQuery(userData.id, false);

  useEffect(() => {
    if (data) {
      if (data.interestedProduct) {
        const product = FundingProductTypeEnum.find(
          (p) => p.value === data.interestedProduct
        );
        if (product) {
          setInterestedProductSelected(product);
          setIsBusinessIncomeBased(
            data.interestedProduct === "Business Income Based Funding"
          );
          setIsAutoLoan(data.interestedProduct === "Auto Loan");
          setIsEquipmentFinancing(product.type.includes("Equipment Financing"));
          if (product.type.includes("Business")) {
            refetchBusinesses();
          }
        }
      }

      if (data.howDoYouGetPaid) {
        const option = howDoYouGetPaid.find(
          (x) => x.value === data.howDoYouGetPaid
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

      if (data.personalTaxes) {
        const option = personalTaxes.find(
          (x) => x.value === data.personalTaxes
        );
        if (option) setPersonalTaxesSelected(option);
      }

      if (data.businessTaxes) {
        const option = businessTaxes.find(
          (x) => x.value === data.businessTaxes
        );
        if (option) setBusinessTaxesSelected(option);
      }

      if (data.businessId) {
        setBusinessIdSelected(data.businessId);
      }

      if (data.vehicleFinancingType) {
        setVehicleFinancingType(data.vehicleFinancingType);
      }
    }
  }, [data, refetchBusinesses]);

  const businessOptions = useMemo<DropdownOption[]>(
    () =>
      (businessData ?? []).map((b: Business) => ({
        value: b.businessName,
        label: `${b.businessName} (${b.employerIdentificationNumber})`,
      })),
    [businessData]
  );

  const savedDraft = getApplication(userData.id);
  const defaultValues = useMemo(() => {
    if (data) return data;
    if (isViewing || isEditing) return data;
    if (savedDraft && Object.keys(savedDraft).length > 0) return savedDraft;
    return undefined;
  }, [data, isViewing, isEditing, savedDraft]);

  const form = useForm<ApplyFunding>({
    resolver: zodResolver(applyFundingSchema),
    mode: "onChange",
    defaultValues: {
      ...defaultValues,
      appliedDate: defaultValues?.appliedDate ?? new Date(),
      userId: userData.id,
      status: defaultValues?.status || "New",
      fundingType: defaultValues?.fundingType || "Personal",
      employmentStatus: defaultValues?.employmentStatus || "",
      personalTaxesStatus: defaultValues?.personalTaxesStatus || "",
      businessTaxesStatus: defaultValues?.businessTaxesStatus || "",

      // addressStreet:
      //   defaultValues?.addressStreet || userData.addressStreet || "",
      // houseNumber: defaultValues?.houseNumber || userData.houseNumber || "",
      // addressCity: defaultValues?.addressCity || userData.addressCity || "",
      // addressState: defaultValues?.addressState || userData.addressState || "",
      // addressPostal:
      //   defaultValues?.addressPostal || userData.addressPostal || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "employments",
  });

  // if (Object.keys(form.formState.errors).length > 0) {
  //   console.log("There are validation errors:", form.formState.errors);
  // }

  const { isDirty, dirtyFields } = form.formState;

  // Auto-save form with debounce - uses getValues() to avoid re-render issues
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    if (
      !isViewing &&
      !data &&
      !isEditing &&
      isDirty &&
      Object.keys(dirtyFields).length > 0 &&
      !isRecording &&
      !isUpdating &&
      !form.formState.isSubmitting
    ) {
      const timeoutId = setTimeout(() => {
        const formValues = form.getValues();
        const formValuesStr = JSON.stringify(formValues);

        // Only save if values have changed since last save
        if (formValuesStr !== lastSavedRef.current) {
          const hasValues = Object.values(formValues).some(
            (val) => val !== "" && val !== undefined && val !== null
          );
          if (hasValues) {
            updateApplication(userData.id, formValues);
            lastSavedRef.current = formValuesStr;
          }
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    form.formState,
    isViewing,
    data,
    isEditing,
    isDirty,
    dirtyFields,
    userData.id,
    isRecording,
    isUpdating,
    form,
    updateApplication,
  ]);

  useEffect(() => {
    if (!isViewing && !data && !isEditing && savedDraft) {
      // Check if savedDraft has meaningful data
      if (
        savedDraft.interestedProduct ||
        savedDraft.personalAmountFunding ||
        savedDraft.businessAmountFunding
      ) {
        if (savedDraft.interestedProduct) {
          const product = FundingProductTypeEnum.find(
            (p) => p.value === savedDraft.interestedProduct
          );
          if (product) {
            setInterestedProductSelected(product);
            setIsBusinessIncomeBased(
              savedDraft.interestedProduct === "Business Income Based Funding"
            );
            setIsAutoLoan(savedDraft.interestedProduct === "Auto Loan");
            setIsEquipmentFinancing(
              product.type.includes("Equipment Financing")
            );
          }
        }

        if (savedDraft.howDoYouGetPaid) {
          const option = howDoYouGetPaid.find(
            (x) => x.value === savedDraft.howDoYouGetPaid
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

        if (savedDraft.personalTaxes) {
          const option = personalTaxes.find(
            (x) => x.value === savedDraft.personalTaxes
          );
          if (option) setPersonalTaxesSelected(option);
        }

        if (savedDraft.businessTaxes) {
          const option = businessTaxes.find(
            (x) => x.value === savedDraft.businessTaxes
          );
          if (option) setBusinessTaxesSelected(option);
        }

        if (savedDraft.businessId) {
          setBusinessIdSelected(savedDraft.businessId);
        }

        if (savedDraft.vehicleFinancingType) {
          setVehicleFinancingType(savedDraft.vehicleFinancingType);
        }

        toast("We restored your previous application draft.", {
          action: {
            label: "Start Over",
            onClick: () => {
              form.reset({
                appliedDate: new Date(),
                userId: userData.id,
                status: "New",
                fundingType: "Personal",
                employmentStatus: "",
                personalTaxesStatus: "",
                businessTaxesStatus: "",
                // addressStreet: userData.addressStreet || "",
                // houseNumber: userData.houseNumber || "",
                // addressCity: userData.addressCity || "",
                // addressState: userData.addressState || "",
                // addressPostal: userData.addressPostal || "",
              });
              setInterestedProductSelected(undefined);
              setIsBusinessIncomeBased(false);
              setIsAutoLoan(false);
              setIsEquipmentFinancing(false);
              setVehicleFinancingType(undefined);
              setHowDoYouGetPaidSelected(undefined);
              setHowDoYouGetPaidSelectedBank(false);
              setPersonalTaxesSelected(undefined);
              setBusinessTaxesSelected(undefined);
              setBusinessIdSelected(undefined);
              clearApplication(userData.id);
            },
          },
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewBusinessSaved = async (businessName: string) => {
    // const { data: refreshedBusinessData } = await refetchBusinesses();

    // if (refreshedBusinessData) {
    //   handleBusinessSelect(businessName, refreshedBusinessData);
    // }
    refetchBusinesses();
    setOpenBusinessModal(false);
  };

  const handleBusinessSelect = useCallback(
    (value: string, currentData?: Business[]) => {
      if (!value) {
        return;
      }
      const dataToSearch = currentData || businessData;

      const b = dataToSearch?.find((x: Business) => x.businessName === value);

      if (b) {
        form.setValue("businessName", value, {
          shouldValidate: true,
          shouldDirty: true,
        });
        setBusinessIdSelected(b.id);
        form.setValue("businessId", b.id ?? "", {
          shouldValidate: false,
          shouldDirty: true,
        });
        form.setValue("businessStreetAddress", b.businessStreetAddress ?? "", {
          shouldValidate: false,
          shouldDirty: true,
        });
        form.setValue(
          "businessStreetHouseNumber",
          b.businessStreetHouseNumber ?? "",
          {
            shouldValidate: false,
            shouldDirty: true,
          }
        );
        form.setValue("businessCityAddress", b.businessCityAddress ?? "", {
          shouldValidate: false,
          shouldDirty: true,
        });
        form.setValue("businessStateAddress", b.businessStateAddress ?? "", {
          shouldValidate: false,
          shouldDirty: true,
        });
        form.setValue("businessPostalAddress", b.businessPostalAddress ?? "", {
          shouldValidate: false,
          shouldDirty: true,
        });
        form.setValue("businessPhoneNumber", b.businessPhoneNumber ?? "", {
          shouldValidate: false,
          shouldDirty: true,
        });
        form.setValue("businessEmail", b.businessEmail ?? "", {
          shouldValidate: false,
          shouldDirty: true,
        });
        form.setValue("businessWebsite", b.businessWebsite ?? "", {
          shouldValidate: false,
          shouldDirty: true,
        });
        // form.setValue("socialMedia", b.socialMedia ?? [], {
        //   shouldValidate: false,
        // });
        form.setValue(
          "employerIdentificationNumber",
          b.employerIdentificationNumber ?? "",
          {
            shouldValidate: false,
            shouldDirty: true,
          }
        );
        // form.setValue("lastYearTaxes", b.lastYearTaxes ?? 0, {
        //   shouldValidate: false,
        // });
        // form.setValue("currentYearTaxes", b.currentYearTaxes ?? 0, {
        //   shouldValidate: false,
        // });
      }
    },
    [form, businessData]
  );

  useEffect(() => {
    if (interestedProductSelected) {
      // setTradelinesOrShelf(
      //   interestedProductSelected.value.includes("Shelf") ||
      //     interestedProductSelected.value.includes("Tradelines")
      // );

      setIsCommunity(interestedProductSelected.type.includes("Community"));
      setIsEquipmentFinancing(
        interestedProductSelected.type.includes("Equipment Financing")
      );
      setIsTradeLines(interestedProductSelected.type.includes("Tradelines"));
    }
  }, [interestedProductSelected]);

  const onSubmit = useCallback(async () => {
    const values = form.getValues();
    if (isEditing && data?.referenceNumber) {
      await updateApplyFunding({
        values: { ...values, referenceNumber: data.referenceNumber },
      });
    } else {
      await applyFunding({ values });
    }
    console.log("Clearing saved draft for user:", userData.id);
    clearApplication(userData.id);
    setOpen(false);
    if (setCongratsOpen) setCongratsOpen(true);
  }, [
    setOpen,
    setCongratsOpen,
    applyFunding,
    updateApplyFunding,
    form,
    isEditing,
    data,
    userData.id,
    clearApplication,
  ]);

  const handleApproveClickCapture: React.MouseEventHandler<
    HTMLSpanElement
  > = async (e) => {
    const ok = await form.trigger(); // runs Zod validation and shows errors if any
    if (!ok) {
      // Log validation errors
      console.info("Validation failed:");
      console.info("Form Errors:", form.formState.errors);
      console.info("Form Values:", form.getValues());

      // Show user-friendly error message
      const errorCount = Object.keys(form.formState.errors).length;
      toast.error("Please fix the validation errors", {
        description: `There ${
          errorCount === 1 ? "is" : "are"
        } ${errorCount} error${
          errorCount === 1 ? "" : "s"
        } in your application. Please review and correct the highlighted fields.`,
      });

      // Block the ConfirmButton from opening its dialog
      e.preventDefault();
      e.stopPropagation();
    }
  };

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
        // console.log("selectedValue.value", selectedValue.value);
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
        // Set the 'personalTaxesStatus' field with the type
        form.setValue("personalTaxesStatus", selectedValue.type!, {
          shouldValidate: true, // Trigger validation on change
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
        // Set the 'personalTaxesStatus' field with the type
        form.setValue("businessTaxesStatus", selectedValue.type!, {
          shouldValidate: true, // Trigger validation on change
          shouldDirty: true,
        });
      }
    },
    [form]
  );

  const handleVehicleFinancingTypeChange = useCallback(
    (value: string) => {
      setVehicleFinancingType(value);

      // If switching to Business financing, clear employment fields
      if (value === "Business") {
        form.setValue("howDoYouGetPaid", "", { shouldValidate: false });
        form.setValue("employmentPayPerMonth", 0, { shouldValidate: false });
        form.setValue("employmentEmployerName", "", { shouldValidate: false });
        form.setValue("employmentEmployerPhoneNumber", "", {
          shouldValidate: false,
        });
        form.setValue("employmentEmployerAddressStreet", "", {
          shouldValidate: false,
        });
        form.setValue("employmentEmployerHouseNumber", "", {
          shouldValidate: false,
        });
        form.setValue("employmentEmployerAddressCity", "", {
          shouldValidate: false,
        });
        form.setValue("employmentEmployerAddressState", "", {
          shouldValidate: false,
        });
        form.setValue("employmentEmployerAddressPostal", "", {
          shouldValidate: false,
        });
        form.setValue("employmentOccupation", "", { shouldValidate: false });
        form.setValue("employmentDateOfHire", undefined, {
          shouldValidate: false,
        });
        form.setValue("personalTaxes", "", { shouldValidate: false });
        form.setValue("personalTaxes1", 0, { shouldValidate: false });
        form.setValue("personalTaxes2", 0, { shouldValidate: false });
        form.setValue("personalTaxes3", 0, { shouldValidate: false });
        form.setValue("employments", [], { shouldValidate: false });

        // Reset UI state
        setHowDoYouGetPaidSelected(undefined);
        setHowDoYouGetPaidSelectedBank(false);
        setPersonalTaxesSelected(undefined);
      }
    },
    [form]
  );

  const currentYear = new Date().getFullYear();

  return (
    <div>
      <ResponsiveDialog
        isOpen={openBusinessModal}
        setIsOpen={setOpenBusinessModal}
        title="Manage Business Information"
        description={""}
        descriptionClassName="text-red-500 text-lg font-semibold"
        className="w-11/12 md:w-3/4 lg:w-3/6"
      >
        <ClientBusinessManagement
          userId={userData.id}
          editingBusiness={null}
          setEditingBusiness={() => {}}
          isModal
          setOpen={setOpenBusinessModal}
          onSaveSuccess={handleNewBusinessSaved}
        />
      </ResponsiveDialog>
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset disabled={isRecording}>
            <input type="hidden" {...form.register("fundingType")} />
            <div>
              <Card>
                <CardContent className="space-y-4 pt-6 px-4 md:px-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    {(isCommunity || isEquipmentFinancing) && (
                      <CustomFormField
                        name={"personalAmountFunding"}
                        label="How much funding are you looking for?"
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

                  {/* Auto Loan Specific Fields */}
                  {isAutoLoan && (
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-orange-200">
                      <CardHeader className="px-4 md:px-6">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                          <span>🚗</span> Auto Loan Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 px-4 md:px-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              {
                                value: "Franchise Dealer",
                                label: "Franchise Dealer",
                              },
                              {
                                value: "Private Party",
                                label: "Private Party",
                              },
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
                      <CardContent className="space-y-4 px-4 md:px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
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
                          <CustomFormField
                            name={"addressCity"}
                            label={"City"}
                          />
                          <CustomFormField
                            name={"addressState"}
                            label={"State"}
                            type="select"
                            placeholder="Select a state"
                            options={US_STATES}
                          />
                          <CustomFormField
                            name={"addressPostal"}
                            label={"Zip Code"}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <CustomFormField
                            name={"moveInCurrentAddress"}
                            label={
                              "When did you move in to your current address?"
                            }
                            type="date-picker"
                          />
                          <CustomFormField
                            name={"payPerMonth"}
                            type="number"
                            label={"How much do you pay a month?"}
                          />
                          <CustomFormField
                            name={"rentOrMortgage"}
                            label={
                              "Is it rent or mortgage? If else, please specify"
                            }
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
                      <CardContent className="space-y-4 px-4 md:px-6">
                        <CustomFormField
                          name={"reasonForJoiningCommunity"}
                          label={
                            "What's the most important reason for joining?"
                          }
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
                          <CustomFormField
                            name={"addressCity"}
                            label={"City"}
                          />
                          <CustomFormField
                            name={"addressState"}
                            label={"State"}
                            type="select"
                            placeholder="Select a state"
                            options={US_STATES}
                          />
                          <CustomFormField
                            name={"addressPostal"}
                            label={"Zip Code"}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <CustomFormField
                            name={"moveInCurrentAddress"}
                            label={
                              "When did you move in to your current address?"
                            }
                            type="date-picker"
                          />
                          <CustomFormField
                            name={"payPerMonth"}
                            type="number"
                            label={"How much do you pay a month?"}
                          />
                          <CustomFormField
                            name={"rentOrMortgage"}
                            label={
                              "Is it rent or mortgage? If else, please specify"
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {isTradeLines && (
                    <Card className="bg-slate-100 border-slate-200">
                      <CardHeader className="px-4 md:px-6">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                          <span>💳</span> Tradelines Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 px-4 md:px-6">
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
                          <CustomFormField
                            name={"addressCity"}
                            label={"City"}
                          />
                          <CustomFormField
                            name={"addressState"}
                            label={"State"}
                            type="select"
                            placeholder="Select a state"
                            options={US_STATES}
                          />
                          <CustomFormField
                            name={"addressPostal"}
                            label={"Zip Code"}
                          />
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
                      <div className="flex flex-row items-center gap-4 justify-between">
                        <CustomFormField
                          name={"howDoYouGetPaid"}
                          label={"Do you have a job?"}
                          type="select"
                          options={howDoYouGetPaid}
                          onSelectValue={handleDoYouHaveAJobChange}
                        />
                        {howDoYouGetPaidSelected?.value === "no_assistance" && (
                          <div className="mt-6">
                            <PlaidLink displayText="Link Personal Account" />
                          </div>
                        )}
                      </div>
                    )}

                  {howDoYouGetPaidSelected?.type === "yes" &&
                    (!isAutoLoan ||
                      (isAutoLoan && vehicleFinancingType === "Personal")) &&
                    !isTradeLines && (
                      <Card className="bg-slate-100 border-slate-200">
                        <CardHeader className="px-4 md:px-6">
                          <CardTitle className="flex flex-col md:flex-row justify-between gap-2 text-base md:text-lg">
                            <div className="flex items-center gap-2">
                              <span>💼</span> Employment Information
                            </div>
                            {howDoYouGetPaidSelectedBank && (
                              <PlaidLink displayText="Link Personal Account" />
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 px-4 md:px-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                    label={
                                      "How much money do you make per month?"
                                    }
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
                            className="mt-2 w-fit"
                            onClick={() =>
                              append({
                                howDoYouGetPaid: "",
                                employmentPayPerMonth: 0,
                                employmentEmployerName: "",
                                employmentOccupation: "",
                              })
                            }
                          >
                            <Plus className="mr-2 h-4 w-4" /> Add Another
                            Employment
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
                        </CardContent>
                      </Card>
                    )}

                  {(interestedProductSelected?.type?.includes("Business") ||
                    isCommunity ||
                    (!isAutoLoan && isEquipmentFinancing) ||
                    (isAutoLoan && vehicleFinancingType === "Business")) &&
                    !isTradeLines && (
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-end gap-4">
                        <CustomFormField
                          name="businessName"
                          label="Select Business"
                          type="select"
                          placeholder="Select your business"
                          options={businessOptions}
                          onSelectValue={handleBusinessSelect}
                        />
                        <Button
                          type="button"
                          size="lg"
                          variant="ghost"
                          className="justify-self-start md:justify-self-end cursor-pointer"
                          onClick={() => setOpenBusinessModal(true)}
                        >
                          <IconMenu text="Add Business" icon={<Plus />} />
                        </Button>
                      </div>
                    )}

                  {businessIdSelected &&
                    (interestedProductSelected?.type?.includes("Business") ||
                      isCommunity ||
                      (!isAutoLoan && isEquipmentFinancing) ||
                      (isAutoLoan && vehicleFinancingType === "Business")) &&
                    !isTradeLines && (
                      <Card className="bg-slate-100 border-slate-200">
                        <CardHeader className="px-4 md:px-6">
                          <CardTitle className="flex flex-col md:flex-row justify-between gap-2 text-base md:text-lg">
                            <div className="flex items-center gap-2">
                              <span>🏢</span> Business Information
                            </div>
                            <PlaidLink displayText="Link Business Acount" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 px-4 md:px-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CustomFormField
                              name={"dateOfIncorporation"}
                              type="date-picker"
                              label={`Date of Incorporation?`}
                            />
                            <CustomFormField
                              name={"stateOfIncorporation"}
                              label={`State of Incorporation?`}
                              type="select"
                              placeholder="Select a state"
                              options={US_STATES}
                            />
                            <CustomFormField
                              name={"businessGrossProjectedRevenue1"}
                              type="number"
                              label={`${currentYear} Gross Projected Revenue?`}
                            />
                            <CustomFormField
                              name={"businessProjectedProfit1"}
                              type="number"
                              label={`${currentYear} Projected Profit?`}
                            />
                            <CustomFormField
                              name={"businessGrossProjectedRevenue2"}
                              type="number"
                              label={`${currentYear - 1} Gross Revenue?`}
                            />
                            <CustomFormField
                              name={"businessProjectedProfit2"}
                              type="number"
                              label={`${currentYear - 1} Net Revenue?`}
                            />
                            <CustomFormField
                              name={"businessGrossProjectedRevenue3"}
                              type="number"
                              label={`${currentYear - 2} Gross Revenue?`}
                            />
                            <CustomFormField
                              name={"businessProjectedProfit3"}
                              type="number"
                              label={`${currentYear - 2} Net Revenue?`}
                            />

                            <CustomFormField
                              name={"industryField"}
                              label={"Industry Field?"}
                            />

                            <CustomFormField
                              name={"businessTaxes"}
                              label={"Did you report on your business taxes?"}
                              type="select"
                              options={businessTaxes}
                              onSelectValue={handleBusinessTaxesChange}
                            />
                          </div>
                          {businessTaxesSelected?.type === "yes" && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <CustomFormField
                                name={"businessTaxes1"}
                                type="number"
                                label={`in ${currentYear - 1}?`}
                              />
                              <CustomFormField
                                name={"businessTaxes2"}
                                type="number"
                                label={`in ${currentYear - 2}?`}
                              />
                              <CustomFormField
                                name={"businessTaxes3"}
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
                                <h4 className="font-medium text-indigo-900">
                                  Financial Information
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
                                <h4 className="font-medium text-indigo-900">
                                  Business Property Information
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
                                <h4 className="font-medium text-indigo-900">
                                  Additional Information
                                </h4>

                                {/* Referral */}
                                <CustomFormField
                                  name="whoReferredYou"
                                  label="Who Referred You?"
                                />
                              </CardContent>
                            </Card>
                          )}
                        </CardContent>
                      </Card>
                    )}
                </CardContent>

                <CardFooter className="flex justify-end px-4 md:px-6 py-4">
                  {!isViewing ? (
                    <>
                      {/* <div>
                        {!community && (
                          <div className="space-x-4">
                            <PlaidLink />
                            {!incomeBankItem && <PlaidIncomeLinkBank />}
                            {!incomePayrollItem && <PlaidIncomeLinkPayroll />}
                          </div>
                        )}
                      </div> */}
                      <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <Button
                          size="lg"
                          variant={"outline"}
                          type="button"
                          disabled={isRecording}
                          onClick={() => setOpen(false)}
                          className="w-full md:w-auto bg-red-200 hover:bg-red-300 text-black-100 cursor-pointer"
                        >
                          <CircleXIcon className="mr-2 h-4 w-4" /> Close
                        </Button>

                        <span onClickCapture={handleApproveClickCapture}>
                          <ConfirmButton
                            label={isEditing ? "Update" : "Apply"}
                            confirmLabel={isEditing ? "Update" : "Apply"}
                            description={
                              isEditing
                                ? "Please confirm your update."
                                : "Please confirm your application."
                            }
                            variant="default"
                            size="sm"
                            icon={<CheckIcon className="h-4 w-4" />}
                            onConfirm={() => onSubmit()}
                            className="bg-green-600 hover:bg-green-700"
                            classNameAction="bg-green-600 hover:bg-green-700"
                            isLoading={form.formState.isSubmitting}
                            trigger={
                              <Button
                                size="lg"
                                type="submit"
                                disabled={isRecording || isUpdating}
                                className="w-full md:w-auto bg-green-400 hover:bg-green-500 text-black-100 cursor-pointer"
                              >
                                {isRecording || isUpdating ? (
                                  <>
                                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />

                                    {isEditing
                                      ? "Updating..."
                                      : isCommunity
                                      ? "Joining..."
                                      : isTradeLines
                                      ? "Boosting..."
                                      : "Applying..."}
                                  </>
                                ) : (
                                  <>
                                    <BanknoteIcon className="mr-2 h-4 w-4" />{" "}
                                    {isEditing
                                      ? "Update Application"
                                      : isCommunity
                                      ? "Join Community"
                                      : isTradeLines
                                      ? "Boost My Score"
                                      : "Apply Funding"}
                                  </>
                                )}
                              </Button>
                            }
                          />
                        </span>
                      </div>
                    </>
                  ) : (
                    <Button
                      size="lg"
                      variant={"outline"}
                      type="button"
                      onClick={() => setOpen(false)}
                      className="w-full bg-red-200 hover:bg-red-300 text-black-100"
                    >
                      <CircleXIcon className="mr-2 h-4 w-4" /> Close
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </fieldset>
        </form>
      </Form>
    </div>
  );
};

export default ApplyFundingForm;
