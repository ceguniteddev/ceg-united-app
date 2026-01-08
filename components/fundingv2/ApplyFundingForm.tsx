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
  CircleX,
  CircleXIcon,
  FileText,
  Loader2Icon,
  Plus,
  Trash2,
  Upload,
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
  legalResident,
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
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";

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
  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState<
    string | undefined
  >(undefined);
  const [socialMediaHandles, setSocialMediaHandles] = useState<
    Record<string, string>
  >({});
  const socialMediaInitialized = useRef(false);

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

      if (data.businessId) {
        setBusinessIdSelected(data.businessId);
      }

      if (data.vehicleFinancingType) {
        setVehicleFinancingType(data.vehicleFinancingType);
      }

      // Initialize social media handles from data (only once)
      if (
        data.socialMedia &&
        data.socialMedia.length > 0 &&
        !socialMediaInitialized.current
      ) {
        const handles: Record<string, string> = {};
        data.socialMedia.forEach((item) => {
          if (item?.platform && item?.handle) {
            handles[item.platform] = item.handle;
          }
        });
        setSocialMediaHandles(handles);

        // Set the first platform as selected if exists
        if (data.socialMedia[0]?.platform) {
          setSelectedSocialPlatform(data.socialMedia[0].platform);
        }

        socialMediaInitialized.current = true;
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

  // Validate legalResident value against current dropdown options
  const validatedLegalResident = useMemo(() => {
    if (!defaultValues?.legalResident) return undefined;

    const isValid = legalResident.some(
      (option) => option.value === defaultValues.legalResident
    );

    return isValid ? defaultValues.legalResident : undefined;
  }, [defaultValues?.legalResident]);

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

      // Clear legalResident if value doesn't exist in current dropdown options
      legalResident: validatedLegalResident,

      // Preserve document uploads when editing
      bankStatements: defaultValues?.bankStatements || [],
      driverLicenseDocuments: defaultValues?.driverLicenseDocuments || [],

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

  // Document upload states - must come after form initialization
  const bankStatementsFromForm = form.watch("bankStatements") || [];
  const driverLicenseDocsFromForm = form.watch("driverLicenseDocuments") || [];

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

      // Get error fields
      const errors = form.formState.errors;
      const errorFields = Object.keys(errors);

      if (errorFields.length > 0) {
        // Format field names to be human-readable
        const formatFieldName = (fieldName: string) => {
          return fieldName
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
        };

        // Create error list with clickable items
        const errorList = errorFields.map((fieldName) => (
          <button
            key={fieldName}
            onClick={() => {
              const element = document.querySelector(
                `[name="${fieldName}"]`
              ) as HTMLElement;
              if (element) {
                element.focus();
                element.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }
            }}
            className="text-left hover:underline hover:text-red-700 transition-colors cursor-pointer"
          >
            • {formatFieldName(fieldName)}
          </button>
        ));

        toast.error(
          <div className="flex flex-col gap-2">
            <p className="font-semibold">Please fix the following fields:</p>
            <div className="flex flex-col gap-1 text-sm">{errorList}</div>
          </div>,
          {
            duration: 8000,
          }
        );
      } else {
        toast.error("Please fix the validation errors", {
          description:
            "Please review and correct the highlighted fields in your application.",
        });
      }

      // Block the ConfirmButton from opening its dialog
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Check if Business Income Based Funding requires documents (skip validation when editing)
    if (!isEditing) {
      const formValues = form.getValues();
      if (formValues.interestedProduct === "Business Income Based Funding") {
        const hasBankStatements =
          formValues.bankStatements && formValues.bankStatements.length > 0;
        const hasDriverLicense =
          formValues.driverLicenseDocuments &&
          formValues.driverLicenseDocuments.length > 0;

        if (!hasBankStatements && !hasDriverLicense) {
          toast.warning(
            "Please upload required documents for Business Income Based Funding",
            {
              description:
                "You need to upload your 4 months bank statements and driver's license documents to proceed.",
              duration: 5000,
            }
          );
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        if (!hasBankStatements) {
          toast.warning("Bank statements are required", {
            description: "Please upload your last 4 months of bank statements.",
            duration: 5000,
          });
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        if (!hasDriverLicense) {
          toast.warning("Driver's license is required", {
            description:
              "Please upload front and back of your driver's license.",
            duration: 5000,
          });
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }
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
    <div className="w-full">
      <ResponsiveDialog
        isOpen={openBusinessModal}
        setIsOpen={setOpenBusinessModal}
        title="Manage Business Information"
        description={""}
        descriptionClassName="text-red-500 text-base sm:text-lg font-semibold"
        className="w-[95vw] sm:w-11/12 md:w-3/4 lg:w-3/4 xl:w-2/3 max-w-4xl max-h-[90vh] overflow-y-auto"
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
                <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6">
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
                        {interestedProductSelected?.type?.includes(
                          "Personal"
                        ) &&
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
                        {interestedProductSelected?.type?.includes(
                          "Business"
                        ) &&
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
                      <CardHeader className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                          <span>🚗</span> Auto Loan Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 md:space-y-5 px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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
                      <CardHeader className="px-3 sm:px-4 md:px-6">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                          <span>👤</span> Personal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 md:space-y-5 px-3 sm:px-4 md:px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 items-start">
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
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
                        {!isCommunity && (
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
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {isCommunity && (
                    <Card className="bg-slate-100 border-slate-200">
                      <CardHeader className="px-3 sm:px-4 md:px-6">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                          <span>🤝</span> Community Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 md:px-6">
                        <CustomFormField
                          name={"reasonForJoiningCommunity"}
                          label={
                            "What's the most important reason for joining?"
                          }
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
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
                      </CardContent>
                    </Card>
                  )}

                  {isTradeLines && (
                    <Card className="bg-slate-100 border-slate-200">
                      <CardHeader className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                          <span>💳</span> Tradelines Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                          <CustomFormField
                            name={"experianUsername"}
                            label={"Experian Username"}
                          />
                          <CustomFormField
                            name={"experianPassword"}
                            label={"Experian Password"}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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
                    !isCommunity &&
                    interestedProductSelected &&
                    interestedProductSelected.value !==
                      "Business Income Based Funding" &&
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
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <CustomFormField
                                  name={"employmentPayPerMonth"}
                                  type="number"
                                  label={
                                    "How much money do you make per month?"
                                  }
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
                                const colorClass =
                                  colors[index % colors.length];

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
                                <Plus className="h-4 w-4" /> Add Another
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
                                      (x) => x.value !== "no_work"
                                    )}
                                  />

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CustomFormField
                                      name={`employments.${index}.employmentPayPerMonth`}
                                      type="number"
                                      label={
                                        "How much money do you make per month?"
                                      }
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
                              <Plus className="h-4 w-4" /> Add Another
                              Employment
                            </Button>
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
                        <CardHeader className="px-3 sm:px-4 md:px-6">
                          <CardTitle className="flex flex-col md:flex-row justify-between gap-2 text-base md:text-lg">
                            <div className="flex items-center gap-2">
                              <span>🏢</span> Business Information
                            </div>
                            {businessIdSelected && (
                              <PlaidLink displayText="Link Business Acount" />
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 md:px-6">
                          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-stretch md:items-end gap-3 sm:gap-4">
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

                          {businessIdSelected && (
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
                                name="businessGrossProjectedRevenue1"
                                type="number"
                                placeholder="Enter amount"
                                label={`${currentYear} Gross Revenue`}
                              />

                              <CustomFormField
                                type="checkbox"
                                label={`Filed with IRS?`}
                                name="businessFiledWithIRS1"
                              />
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

                              <CustomFormField
                                name={"industryField"}
                                label={"Industry Field?"}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
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
                        <Separator className="my-3 sm:my-4" />
                        <h4 className="font-medium text-indigo-900 flex items-center gap-2 mb-3 text-sm sm:text-base">
                          <span>📄</span> Required Documents
                        </h4>

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
                                    Upload bank statements and driver's license
                                    below
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

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
                                  <span className="flex-1 truncate">
                                    {file.name}
                                  </span>
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
                            maxSize={2 * 1024 * 1024}
                            className="cursor-pointer w-full"
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
                              <div className="flex flex-col items-center gap-1.5">
                                <Upload className="h-6 w-6 text-indigo-400" />
                                <p className="text-xs font-medium">
                                  Click to upload
                                </p>
                              </div>
                            </DropzoneEmptyState>
                            <DropzoneContent />
                          </Dropzone>
                        </div>

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
                                  <span className="flex-1 truncate">
                                    {file.name}
                                  </span>
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
                            maxSize={2 * 1024 * 1024}
                            className="cursor-pointer w-full"
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
                              <div className="flex flex-col items-center gap-1.5">
                                <Upload className="h-6 w-6 text-indigo-400" />
                                <p className="text-xs font-medium">
                                  Click to upload
                                </p>
                              </div>
                            </DropzoneEmptyState>
                            <DropzoneContent />
                          </Dropzone>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 px-3 sm:px-4 md:px-6 py-4 md:py-6">
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
                      <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full md:w-auto">
                        <Button
                          size="lg"
                          variant={"outline"}
                          type="button"
                          disabled={isRecording}
                          onClick={() => setOpen(false)}
                          className="w-full md:w-auto bg-red-200 hover:bg-red-300 text-black-100 cursor-pointer min-h-[44px]"
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
                                className="w-full md:w-auto bg-green-400 hover:bg-green-500 text-black-100 cursor-pointer min-h-[44px]"
                              >
                                {isRecording || isUpdating ? (
                                  <>
                                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />

                                    {isEditing
                                      ? "Updating..."
                                      : isTradeLines
                                      ? "Boosting..."
                                      : "Applying..."}
                                  </>
                                ) : (
                                  <>
                                    <BanknoteIcon className="mr-2 h-4 w-4" />{" "}
                                    {isEditing
                                      ? "Update Application"
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
                      className="w-full sm:w-auto bg-red-200 hover:bg-red-300 text-black-100 min-h-[44px]"
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
