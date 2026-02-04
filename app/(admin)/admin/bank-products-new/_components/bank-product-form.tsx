import { CustomFormField } from "@/components/CustomFormField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFundingProducts } from "@/hooks/admin/funding-product";
import { yesNo, US_STATES } from "@/constant/common";
import {
  bankDataSchema,
  BankFormData,
  CreditBureauEnum,
  TaxYearsEnum,
  ApplicationMethodEnum,
  BankProductCriteria,
} from "@/schema/bank-products";
import {
  Loader2Icon,
  SaveIcon,
  CheckCircle2,
  Circle,
  XIcon,
} from "lucide-react";
import { useBankProductsMutation } from "@/hooks/admin/bank-products";
import { useFundingApplicationsMappedFundsMutation } from "@/hooks/admin/funding-application/fund-mapping";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import IconMenu from "@/components/icon-menu";
import { useBankManagementQuery } from "@/hooks/admin/bank-management";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data?: any; // Relaxed type to handle migration from old data
  isAdminViewing?: boolean;
  referenceNumber?: string;
};

const BankProductsForm = ({
  setOpen,
  data,
  isAdminViewing,
  referenceNumber,
}: Props) => {
  const { products: allFundingProducts } = useFundingProducts();
  const [selectedProductIndex, setSelectedProductIndex] = useState<
    number | null
  >(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [productsToApprove, setProductsToApprove] = useState<
    BankProductCriteria[]
  >([]);

  const handleToggleApproveProduct = (product: BankProductCriteria) => {
    setProductsToApprove((prev) => {
      const isAlreadySelected = prev.some(
        (p) => p.productName === product.productName,
      );
      if (isAlreadySelected) {
        return prev.filter((p) => p.productName !== product.productName);
      } else {
        return [...prev, product];
      }
    });
  };

  const { createBankProduct, updateBankProduct, isCreating, isUpdating } =
    useBankProductsMutation();
  const { approveMappedFund, isApproving } =
    useFundingApplicationsMappedFundsMutation();
  const { banks } = useBankManagementQuery();

  // Migration / Default Values Logic
  const defaultValues = useMemo(() => {
    if (!data) return { bankName: "", underwritingNotes: "", products: [] };

    // If already in new format
    if (data.products && Array.isArray(data.products)) {
      return data;
    }

    // Attempt to migrate old format to new format
    const migratedProducts = (data.productName || []).map((name: string) => ({
      productName: name,
      // Map shared fields from old schema to new product schema
      financingTerm: data.financingTerm || "",
      maximumFundingAmount: data.maximumFundingAmount,
      // averageApprovalAmount: data.averageApprovalAmount,
      grossFundingPercentage: data.grossFundingPercentage,
      doubleDipAllowed: data.doubleDipAllowed || "No",
      minimumFicoScore: data.minimumFicoScore,
      creditBureauPulled: data.creditBureauPulled || [],
      maximumInquiriesAllowed: data.maximumInquiriesAllowed,
      minimumNumberOfAccountsOnCredit: data.minimumNumberOfAccountsOnCredit,
      // minimumCreditAgeRequired: data.minimumCreditAgeRequired || "",
      minimumIncomeRequired: data.minimumIncomeRequired,
      maximumDebtToIncomeRatio: data.maximumDebtToIncomeRatio,
      maximumDebtServiceRatio: data.maximumDebtServiceRatio,
      personalVerifiableIncomeRequired:
        data.personalVerifiableIncomeRequired || "No",
      // noDocumentationRequired: data.noDocumentationRequired || "No",

      // Business fields
      businessBankStatementsRequired: data.businessBankStatementsRequired,
      profitAndLossStatementRequired: data.profitAndLossStatementRequired,
      balanceSheetRequired: data.balanceSheetRequired,
      businessPlanRequired: data.businessPlanRequired,

      // Map old tax fields to new Enum
      businessTaxesRequired:
        data.oneYearBusinessTaxes === "Yes"
          ? "1 Year"
          : data.twoYearBusinessTaxes === "Yes"
            ? "2 Years"
            : data.threeYearBusinessTaxes === "Yes"
              ? "3 Years"
              : "None",
      personalTaxesRequired:
        data.oneYearPersonalTaxes === "Yes"
          ? "1 Year"
          : data.twoYearPersonalTaxes === "Yes"
            ? "2 Years"
            : data.threeYearPersonalTaxes === "Yes"
              ? "3 Years"
              : "None",

      immigrationStatusRequirement: data.immigrationStatusRequirement || "",
      stateAvailability: data.stateAvailability || [],
      applicationMethod: data.applicationMethod || [],
      allowsForwardingViaEmail: data.allowsForwardingViaEmail || "No",
      canBeFinalizedOnline: data.canBeFinalizedOnline || "No",
      clientNeedsToGoToBranch: data.clientNeedsToGoToBranch || "No",
      webUrl: data.webUrl || "",
      priorityLevel: data.priorityLevel,
    }));

    return {
      ...data,
      products: migratedProducts,
    };
  }, [data]);

  const form = useForm<BankFormData>({
    resolver: zodResolver(bankDataSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products",
  });

  const handleToggleProduct = (productName: string, category: string) => {
    const existingIndex = fields.findIndex(
      (p) => p.productName === productName,
    );

    if (existingIndex >= 0) {
      // Remove
      remove(existingIndex);
      if (selectedProductIndex === existingIndex) {
        setSelectedProductIndex(null);
      } else if (
        selectedProductIndex !== null &&
        selectedProductIndex > existingIndex
      ) {
        setSelectedProductIndex(selectedProductIndex - 1);
      }
    } else {
      // Calculate the new index BEFORE appending
      const newIndex = fields.length;

      // Add new product with all fields initialized as empty
      // Create a fresh object to ensure no reference sharing
      const newProduct: BankProductCriteria = {
        productName: productName,
        category: category,
        financingTerm: "",
        creditBureauPulled: [],
        stateAvailability: [],
        applicationMethod: [],
        immigrationStatusRequirement: "",
        // minimumCreditAgeRequired: "",
        minimumFicoScore: undefined,
        maximumFundingAmount: undefined,
        // averageApprovalAmount: undefined,
        grossFundingPercentage: undefined,
        maximumInquiriesAllowed: undefined,
        minimumNumberOfAccountsOnCredit: undefined,
        // minimumIncomeRequired: undefined,
        maximumDebtToIncomeRatio: undefined,
        maximumDebtServiceRatio: undefined,
        priorityLevel: undefined,
        doubleDipAllowed: "No",
        personalVerifiableIncomeRequired: "No",
        // noDocumentationRequired: "No",
        businessTaxesRequired: undefined,
        personalTaxesRequired: "None",
        allowsForwardingViaEmail: "No",
        canBeFinalizedOnline: "No",
        clientNeedsToGoToBranch: "No",
        membershipRequiredBeforeApplicationRequired: "No",
        membershipRequiredUponApprovalRequired: "No",
        accountOpeningBeforeApplicationRequired: "No",
        accountOpeningAfterApprovalRequired: "No",
        businessBankStatementsRequired: "No",
        profitAndLossStatementRequired: "No",
        balanceSheetRequired: "No",
        businessPlanRequired: "No",
      };

      append(newProduct);
      // Select the newly added product using the pre-calculated index
      setSelectedProductIndex(newIndex);
    }
  };

  const handleOnApprove = async () => {
    if (data && isAdminViewing && referenceNumber) {
      if (productsToApprove.length === 0) {
        toast.error("Please select at least one product to approve.");
        return;
      }
      await approveMappedFund({
        bankProductId: data.id!,
        referenceNumber: referenceNumber,
        products: productsToApprove,
      });

      setOpen(false);
    }
  };

  const onSubmit: SubmitHandler<BankFormData> = useCallback(
    async (values) => {
      try {
        if (data && data.id) {
          await updateBankProduct({ id: data.id!, values });
          form.reset();
          toast.success("Bank product updated successfully!");
        } else {
          await createBankProduct(values);
          form.reset();
          toast.success("Bank product created successfully!");
        }
        setOpen(false);
      } catch (error: any) {
        toast.error(error?.message || "Failed to save bank product");
      }
    },
    [createBankProduct, updateBankProduct, form, setOpen, data],
  );

  const isSubmitting = isCreating || isUpdating || isApproving;

  // Watch products to determine category of current selection
  const watchedProducts = form.watch("products");
  const activeProduct =
    selectedProductIndex !== null
      ? watchedProducts?.[selectedProductIndex]
      : null;
  const activeCategory = activeProduct?.category?.toLowerCase() || "";
  const isPersonalProduct = activeCategory.includes("personal");
  const isBusinessProduct = activeCategory.includes("business");

  return (
    <div className="w-full max-w-full mx-auto px-2 sm:px-4 pb-4 h-full flex flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="h-full flex flex-col"
        >
          <Card className="mb-3 sm:mb-4 flex-shrink-0 gap-1">
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="text-base sm:text-lg">
                Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:gap-4 p-3 sm:p-4">
              <CustomFormField
                name="bankName"
                placeholder="Select Bank"
                label="* Bank Name"
                type="select"
                options={
                  banks?.map((b) => ({
                    value: b.bankName,
                    label: b.bankName,
                  })) || []
                }
              />
              <div className="sm:col-span-1">
                <CustomFormField
                  name="underwritingNotes"
                  placeholder="e.g. Requires manual review for scores under 700..."
                  type="textarea"
                  label="Underwriting Notes"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:gap-2 md:gap-4 min-h-0 overflow-hidden">
            {/* Sidebar: Product List */}
            <Card className="w-full sm:w-1/3 md:w-1/4 lg:w-1/3 flex flex-col overflow-hidden max-h-[380px] sm:max-h-full gap-1">
              <CardHeader className="px-3 sm:px-4 border-b">
                <CardTitle className="text-sm sm:text-base">Products</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto flex-1">
                <div className="divide-y">
                  {allFundingProducts
                    ?.sort((a, b) => a.fundingType.localeCompare(b.fundingType))
                    .map((fp) => {
                      const fieldIndex = fields.findIndex(
                        (f) => f.productName === fp.productName,
                      );
                      const isSelected = fieldIndex >= 0;
                      const isActive = selectedProductIndex === fieldIndex;

                      return (
                        <div
                          key={fp.productName}
                          className={cn(
                            "flex items-center gap-3 p-3 transition-colors hover:bg-muted/50 cursor-pointer",
                            isActive &&
                              "bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-500",
                          )}
                          onClick={(e) => {
                            // Only handle clicks on the div itself, not on checkbox or button
                            const target = e.target as HTMLElement;
                            if (
                              target.tagName !== "BUTTON" &&
                              !target.closest("button")
                            ) {
                              if (isSelected) {
                                setSelectedProductIndex(fieldIndex);
                              }
                            }
                          }}
                        >
                          <Checkbox
                            checked={
                              isAdminViewing
                                ? productsToApprove.some(
                                    (p) => p.productName === fp.productName,
                                  )
                                : isSelected
                            }
                            onCheckedChange={() => {
                              if (isAdminViewing) {
                                if (isSelected) {
                                  const product = fields[
                                    fieldIndex
                                  ] as unknown as BankProductCriteria;
                                  handleToggleApproveProduct(product);
                                }
                              } else {
                                handleToggleProduct(
                                  fp.productName,
                                  fp.fundingType,
                                );
                              }
                            }}
                            disabled={isAdminViewing && !isSelected}
                            className="translate-y-[2px]"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm leading-none">
                              {fp.productName}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {fp.fundingType}
                            </div>
                          </div>
                          {isSelected && isActive && (
                            <CheckCircle2 className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Main: Product Details Form */}
            <Card className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              <CardHeader className="px-3 sm:px-4 border-b bg-white">
                <CardTitle className="text-sm sm:text-base flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  {activeProduct ? (
                    <span className="break-words">
                      Editing:{" "}
                      <span className="text-blue-600">
                        {activeProduct.productName}
                      </span>
                    </span>
                  ) : (
                    "Product Details"
                  )}
                  {activeProduct && activeProduct.category && (
                    <span className="text-xs font-normal px-2 py-1 bg-slate-100 rounded-full border whitespace-nowrap">
                      {activeProduct.category}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 overflow-y-auto flex-1">
                {activeProduct && selectedProductIndex !== null ? (
                  <div
                    key={selectedProductIndex}
                    className="space-y-4 sm:space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <CustomFormField
                        name={`products.${selectedProductIndex}.financingTerm`}
                        placeholder="12-60 months"
                        label="* Financing Term"
                      />
                      <CustomFormField
                        name={`products.${selectedProductIndex}.minimumFicoScore`}
                        placeholder="650"
                        label="Min FICO"
                        type="number"
                        allowNegative={false}
                      />
                      <CustomFormField
                        name={`products.${selectedProductIndex}.priorityLevel`}
                        placeholder="Select Priority"
                        label="Priority"
                        type="select"
                        options={[
                          { value: "1", label: "1 - Highest" },
                          { value: "2", label: "2 - High" },
                          { value: "3", label: "3 - Medium" },
                          { value: "4", label: "4 - Low" },
                          { value: "5", label: "5 - Lowest" },
                        ]}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <CustomFormField
                        name={`products.${selectedProductIndex}.maximumFundingAmount`}
                        placeholder="250,000.00"
                        label="Max Funding Amount"
                        type="number"
                        allowNegative={false}
                      />
                      {/* <CustomFormField
                        name={`products.${selectedProductIndex}.averageApprovalAmount`}
                        placeholder="100,000.00"
                        label="Avg Approval Amount"
                        type="number"
                        allowNegative={false}
                      /> */}
                      <CustomFormField
                        name={`products.${selectedProductIndex}.grossFundingPercentage`}
                        placeholder="100"
                        label="Gross Funding %"
                        type="number"
                        decimalScale={0}
                        allowNegative={false}
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                      <CustomFormField
                        name={`products.${selectedProductIndex}.creditBureauPulled`}
                        label="* Credit Bureau Pulled"
                        type="multi-select"
                        options={CreditBureauEnum.options.map((c) => ({
                          value: c,
                          label: c,
                        }))}
                      />
                      <CustomFormField
                        name={`products.${selectedProductIndex}.applicationMethod`}
                        label="* Application Method"
                        type="multi-select"
                        options={ApplicationMethodEnum.options.map((c) => ({
                          value: c,
                          label: c,
                        }))}
                      />
                      <CustomFormField
                        name={`products.${selectedProductIndex}.stateAvailability`}
                        label="* State Availability"
                        type="multi-select"
                        options={US_STATES.map((c) => ({
                          value: c.value,
                          label: c.label,
                        }))}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      <CustomFormField
                        name={`products.${selectedProductIndex}.immigrationStatusRequirement`}
                        placeholder="US Citizen"
                        label="* Immigration Status"
                      />
                    </div>

                    <div className="border-t pt-3 sm:pt-4">
                      <h4 className="text-sm font-semibold mb-2 sm:mb-3">
                        Requirements & Policies
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <CustomFormField
                          name={`products.${selectedProductIndex}.doubleDipAllowed`}
                          label="Double Dip Allowed"
                          type="select"
                          options={yesNo}
                        />
                        <CustomFormField
                          name={`products.${selectedProductIndex}.allowsForwardingViaEmail`}
                          label="Forward Via Email"
                          type="select"
                          options={yesNo}
                        />
                        <CustomFormField
                          name={`products.${selectedProductIndex}.canBeFinalizedOnline`}
                          label="Finalize Online"
                          type="select"
                          options={yesNo}
                        />
                        <CustomFormField
                          name={`products.${selectedProductIndex}.clientNeedsToGoToBranch`}
                          label="Visit Branch Required"
                          type="select"
                          options={yesNo}
                        />
                        <CustomFormField
                          name={`products.${selectedProductIndex}.personalVerifiableIncomeRequired`}
                          label="Verifiable Income Req"
                          type="select"
                          options={yesNo}
                        />
                        {/* <CustomFormField
                          name={`products.${selectedProductIndex}.noDocumentationRequired`}
                          label="No Doc Required"
                          type="select"
                          options={yesNo}
                        /> */}
                      </div>
                    </div>

                    {/* Conditional Fields for Personal/Business Products */}
                    {(isPersonalProduct || isBusinessProduct) && (
                      <div className="border-t pt-3 sm:pt-4 bg-blue-50/50 p-2 sm:p-3 rounded-md">
                        <h4 className="text-sm font-semibold mb-2 sm:mb-3 text-blue-800 flex items-center gap-2">
                          General Requirements
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          <CustomFormField
                            name={`products.${selectedProductIndex}.businessBankStatementsRequired`}
                            label="Bank Statements"
                            type="select"
                            options={yesNo}
                          />
                          <CustomFormField
                            name={`products.${selectedProductIndex}.membershipRequiredBeforeApplicationRequired`}
                            label="Membership Required Before Application"
                            type="select"
                            options={yesNo}
                          />
                          <CustomFormField
                            name={`products.${selectedProductIndex}.membershipRequiredUponApprovalRequired`}
                            label="Membership Required Upon Application"
                            type="select"
                            options={yesNo}
                          />
                          <CustomFormField
                            name={`products.${selectedProductIndex}.accountOpeningBeforeApplicationRequired`}
                            label="Account Opening Before Application"
                            type="select"
                            options={yesNo}
                          />
                          <CustomFormField
                            name={`products.${selectedProductIndex}.accountOpeningAfterApprovalRequired`}
                            label="Account Opening After Application"
                            type="select"
                            options={yesNo}
                          />
                        </div>
                      </div>
                    )}

                    {isBusinessProduct && (
                      <div className="border-t pt-3 sm:pt-4 bg-yellow-50/50 p-2 sm:p-3 rounded-md">
                        <h4 className="text-sm font-semibold mb-2 sm:mb-3 text-yellow-800 flex items-center gap-2">
                          Business-Specific Requirements
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          <CustomFormField
                            name={`products.${selectedProductIndex}.profitAndLossStatementRequired`}
                            label="Profit & Loss Statement"
                            type="select"
                            options={yesNo}
                          />
                          <CustomFormField
                            name={`products.${selectedProductIndex}.balanceSheetRequired`}
                            label="Balance Sheet"
                            type="select"
                            options={yesNo}
                          />
                          <CustomFormField
                            name={`products.${selectedProductIndex}.businessPlanRequired`}
                            label="Business Plan"
                            type="select"
                            options={yesNo}
                          />
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-3 sm:pt-4">
                      <h4 className="text-sm font-semibold mb-2 sm:mb-3">
                        Tax Requirements
                      </h4>
                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        <CustomFormField
                          name={`products.${selectedProductIndex}.personalTaxesRequired`}
                          label="Personal Taxes Required"
                          type="select"
                          options={TaxYearsEnum.options.map((o) => ({
                            value: o,
                            label: o,
                          }))}
                        />
                        {isBusinessProduct && (
                          <CustomFormField
                            name={`products.${selectedProductIndex}.businessTaxesRequired`}
                            label="Business Taxes Required"
                            type="select"
                            options={TaxYearsEnum.options.map((o) => ({
                              value: o,
                              label: o,
                            }))}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 sm:p-8 text-center">
                    <Circle className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 opacity-20" />
                    <p className="text-base sm:text-lg font-medium">
                      No Product Selected
                    </p>
                    <p className="text-xs sm:text-sm mt-1 max-w-xs">
                      Select a product from the list on the left to edit its
                      specific details. Toggle the checkbox to enable/disable a
                      product for this bank.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t bg-gradient-to-r from-slate-50 to-white sticky bottom-0 -mx-2 sm:-mx-4 px-2 sm:px-4 pb-3 shadow-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto border-2 hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 font-semibold"
            >
              <span className="flex items-center gap-2">
                <XIcon className="h-4 w-4" />
                <span>Cancel</span>
              </span>
            </Button>
            <Button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                // Trigger validation
                const isValid = await form.trigger();
                if (!isValid) {
                  const errors = form.formState.errors;
                  const errorMessages: string[] = [];

                  // Collect all error messages
                  if (errors.bankName) {
                    errorMessages.push("• Bank Name is required");
                  }
                  if (errors.underwritingNotes) {
                    errorMessages.push("• Underwriting Notes error");
                  }
                  if (errors.products) {
                    if (Array.isArray(errors.products)) {
                      errors.products.forEach((productError, idx) => {
                        if (productError) {
                          const productName =
                            watchedProducts?.[idx]?.productName ||
                            `Product ${idx + 1}`;
                          Object.keys(productError).forEach((field) => {
                            const fieldName = field
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase());
                            errorMessages.push(
                              `• ${productName}: ${fieldName}`,
                            );
                          });
                        }
                      });
                    } else if (errors.products.message) {
                      errorMessages.push(`• ${errors.products.message}`);
                    }
                  }

                  // Display all errors
                  if (errorMessages.length > 0) {
                    toast.error(
                      <div>
                        <div className="font-semibold mb-1">
                          Validation Errors:
                        </div>
                        <div className="text-sm space-y-0.5">
                          {errorMessages.map((msg, i) => (
                            <div key={i}>{msg}</div>
                          ))}
                        </div>
                      </div>,
                      { duration: 5000 },
                    );
                  } else {
                    toast.error(
                      "Please fix all validation errors before saving",
                    );
                  }
                  return;
                }
                setShowConfirmation(true);
              }}
              disabled={isSubmitting}
              //   className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 font-semibold min-h-[40px]"
              className="w-full md:w-auto bg-green-400 hover:bg-green-500 text-black-100 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <SaveIcon className="h-4 w-4" />
                  <span>Save Bank Profile</span>
                </span>
              )}
            </Button>
            {isAdminViewing && referenceNumber && (
              <Button
                type="button"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleOnApprove}
                disabled={isApproving}
              >
                {isApproving ? "Approving..." : "Approve & Map"}
              </Button>
            )}
          </div>
        </form>
      </Form>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="h-6 w-6 text-blue-600" />
              Confirm Save
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base pt-2">
              Are you sure you want to save this bank profile? This will{" "}
              {data?.id ? "update the existing" : "create a new"} bank product
              configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel
              disabled={isSubmitting}
              className="border-2 hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 font-semibold"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                form.handleSubmit(onSubmit)();
                setShowConfirmation(false);
              }}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <SaveIcon className="h-4 w-4" />
                  <span>Confirm & Save</span>
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BankProductsForm;
