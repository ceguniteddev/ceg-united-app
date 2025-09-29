import { CustomFormField } from "@/components/CustomFormField";
import IconMenu from "@/components/icon-menu";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useFundingProducts } from "@/hooks/admin/funding-product";
import { US_STATES, yesNo } from "@/constant/common";
import {
  ApplicationMethodEnum,
  bankDataSchema,
  BankFormData,
  CreditBureauEnum,
} from "@/schema/bank-products";
import { Loader2Icon, SaveIcon, XCircleIcon } from "lucide-react";
import { useBankProductsMutation } from "@/hooks/admin/bank-products";
import { toast } from "sonner";
import { useFundingApplicationsMappedFundsMutation } from "@/hooks/admin/funding-application/fund-mapping";

type Props = {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data?: BankFormData;
  isAdminViewing?: boolean;
  referenceNumber?: string;
};

const BankProductsForm = ({ setOpen, data, isAdminViewing, referenceNumber }: Props) => {
  const { products, isLoading } = useFundingProducts();
  const [interestedProducts, setInterestedProducts] = useState<DropdownOption[]>([]);

  const { createBankProduct, updateBankProduct, isCreating, isUpdating } =
    useBankProductsMutation();
  const { approveMappedFund, isApproving } = useFundingApplicationsMappedFundsMutation();

  const form = useForm<BankFormData>({
    resolver: zodResolver(bankDataSchema),
    defaultValues: {
      ...data,
    },
  });
  // if (Object.keys(form.formState.errors).length > 0) {
  //   console.log("There are validation errors:", form.formState.errors);
  // }

  useEffect(() => {
    if (products) {
      const dropdownOptions: DropdownOption[] = [];

      products.forEach((product) => {
        dropdownOptions.push({
          value: product.productName,
          label: product.productName,
          category: product.fundingType,
        });
      });
      setInterestedProducts(dropdownOptions);
    }
  }, [products]);

  const onSubmit: SubmitHandler<BankFormData> = useCallback(
    async (values) => {
      if (data) {
        if (isAdminViewing && referenceNumber) {
          await approveMappedFund({
            bankProductId: data.id!,
            referenceNumber: referenceNumber,
          });
        } else {
          await updateBankProduct({ id: data.id!, values });
        }
        form.reset();
      } else {
        await createBankProduct(values);
        form.reset();
      }
      setOpen(false);
    },
    [
      createBankProduct,
      updateBankProduct,
      form,
      setOpen,
      data,
      isAdminViewing,
      referenceNumber,
      approveMappedFund,
    ]
  );

  // const handleSelectFundingProduct = (value: string) => {
  //   const product = products?.find((p) => p.productName === value);
  //   if (product) {
  //     form.setValue("productType", product.fundingType, { shouldValidate: true });
  //   }
  // };

  const isSubmitting = isCreating || isUpdating || isApproving;
  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} aria-busy={isSubmitting}>
          <fieldset disabled={isSubmitting}>
            <Card>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <CustomFormField name="bankName" placeholder="Chase" label="* Bank Name" />

                  <CustomFormField
                    name="productName"
                    placeholder=""
                    label="* Product Name"
                    type="multi-select"
                    options={interestedProducts}
                    // onSelectValue={handleSelectFundingProduct}
                  />

                  <CustomFormField
                    name="financingTerm"
                    placeholder="12-60 months"
                    label="* Financing Term"
                  />
                </div>
                <CustomFormField
                  name="underwritingNotes"
                  placeholder=""
                  type="textarea"
                  label="Underwriting Notes"
                />
                <div className="grid grid-cols-3 gap-4">
                  <CustomFormField
                    name="maximumFundingAmount"
                    placeholder="250,000.00"
                    label="* Maximum Funding Amount"
                    type="number"
                  />
                  <CustomFormField
                    name="averageApprovalAmount"
                    placeholder="250,000.00"
                    label="* Average Approval Amount"
                    type="number"
                  />
                  <CustomFormField
                    name="grossFundingPercentage"
                    placeholder="100"
                    label="* Gross Funding %"
                    type="number"
                    decimalScale={0}
                  />

                  <CustomFormField
                    name="doubleDipAllowed"
                    placeholder=""
                    label="* Double Dip Allowed"
                    type="select"
                    options={yesNo}
                  />
                  <CustomFormField
                    name="creditBureauPulled"
                    placeholder=""
                    label="* Credit Bureau Pulled"
                    type="multi-select"
                    options={CreditBureauEnum.options.map((c) => ({ value: c, label: c }))}
                  />
                  <CustomFormField
                    name="minimumCreditAgeRequired"
                    placeholder=""
                    label="* Minimum Credit Age Required"
                    type="select"
                    options={[
                      { value: "1", label: "1 Year" },
                      { value: "2", label: "2 Years" },
                      { value: "3", label: "3 Years" },
                      { value: "4", label: "4 Years" },
                      { value: "5", label: "5 Years" },
                    ]}
                  />

                  <CustomFormField
                    name="minimumFicoScore"
                    placeholder="680"
                    label="* Minimum FICO Score"
                    type="number"
                  />

                  <CustomFormField
                    name="maximumInquiriesAllowed"
                    placeholder="5"
                    label="* Maximum Inquiries Allowed"
                    type="number"
                    decimalScale={0}
                  />
                  <CustomFormField
                    name="minimumNumberOfAccountsOnCredit"
                    placeholder=""
                    label="* Minimum Number of Accounts on Credit"
                    type="number"
                    decimalScale={0}
                  />
                  <CustomFormField
                    name="minimumIncomeRequired"
                    placeholder=""
                    label="* Minimum Income Required"
                    type="number"
                    decimalScale={2}
                  />
                  <CustomFormField
                    name="maximumDebtToIncomeRatio"
                    placeholder="50"
                    label="* Maximum Debt to Income Ratio %"
                    type="number"
                    decimalScale={0}
                  />
                  <CustomFormField
                    name="maximumDebtServiceRatio"
                    placeholder="1.35"
                    label="* Maximum Debt Service Ratio"
                    type="number"
                    decimalScale={2}
                  />
                  <CustomFormField
                    name="personalVerifiableIncomeRequired"
                    placeholder=""
                    label="* Personal Verifiable Income Required"
                    type="select"
                    options={yesNo}
                  />
                  <CustomFormField
                    name="noDocumentationRequired"
                    placeholder=""
                    label="* No Documentation Required"
                    type="select"
                    options={yesNo}
                  />
                  <CustomFormField
                    name="businessBankStatementsRequired"
                    placeholder=""
                    label="* Business Bank Statements Required"
                    type="select"
                    options={yesNo}
                  />
                  <CustomFormField
                    name="profitAndLossStatementRequired"
                    placeholder=""
                    label="* Profit and Loss Statement Required"
                    type="select"
                    options={yesNo}
                  />
                  <CustomFormField
                    name="balanceSheetRequired"
                    placeholder=""
                    label="* Balance Sheet Required"
                    type="select"
                    options={yesNo}
                  />
                  <CustomFormField
                    name="businessPlanRequired"
                    placeholder=""
                    label="* Business Plan Required"
                    type="select"
                    options={yesNo}
                  />
                  <CustomFormField
                    name="oneYearBusinessTaxes"
                    placeholder=""
                    label="* 1 Year Business Taxes"
                    type="select"
                    options={yesNo}
                  />
                  <CustomFormField
                    name="twoYearBusinessTaxes"
                    placeholder=""
                    label="* 2 Years Business Taxes"
                    type="select"
                    options={yesNo}
                  />
                  <CustomFormField
                    name="threeYearBusinessTaxes"
                    placeholder=""
                    label="* 3 Years Business Taxes"
                    type="select"
                    options={yesNo}
                  />
                  <CustomFormField
                    name="oneYearPersonalTaxes"
                    placeholder=""
                    label="* 1 Year Personal Taxes"
                    type="select"
                    options={yesNo}
                  />
                  <CustomFormField
                    name="twoYearPersonalTaxes"
                    placeholder=""
                    label="* 2 Years Personal Taxes"
                    type="select"
                    options={yesNo}
                  />
                  <CustomFormField
                    name="threeYearPersonalTaxes"
                    placeholder=""
                    label="* 3 Years Personal Taxes"
                    type="select"
                    options={yesNo}
                  />
                  <CustomFormField
                    name="immigrationStatusRequirement"
                    placeholder="SSN or ITIN"
                    label="* Immigration Status Requirement"
                  />
                  <CustomFormField
                    name="stateAvailability"
                    placeholder="FL, NY"
                    type="multi-select"
                    options={US_STATES}
                    label="* State Availability"
                  />
                  <CustomFormField
                    name="applicationMethod"
                    placeholder="Online"
                    label="* Application Method"
                    type="multi-select"
                    options={ApplicationMethodEnum.options.map((type) => ({
                      value: type,
                      label: type,
                    }))}
                  />
                  <CustomFormField
                    name="allowsForwardingViaEmail"
                    placeholder=""
                    label="* Allows Forwarding via Email"
                    type="select"
                    options={yesNo}
                  />
                  <CustomFormField
                    name="canBeFinalizedOnline"
                    placeholder=""
                    label="* Can be finalized online"
                    type="select"
                    options={yesNo}
                  />
                  <CustomFormField
                    name="clientNeedsToGoToBranch"
                    placeholder=""
                    label="* Client needs to go to Branch"
                    type="select"
                    options={yesNo}
                  />
                  <CustomFormField name="contactName" placeholder="" label="* Contact Name" />
                  <CustomFormField
                    name="contactPhoneNumber"
                    placeholder=""
                    label="* Contact Phone Number"
                  />
                  <CustomFormField name="contactEmail" placeholder="" label="* Contact Email" />
                </div>
                <CustomFormField name="webUrl" placeholder="" label="* Web URL" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => setOpen(false)}
                >
                  <XCircleIcon className="h-4 w-4" color="red" />
                  Close
                </Button>
                {!isAdminViewing ? (
                  <Button
                    type="submit"
                    variant="outline"
                    className="cursor-pointer bg-green-200 hover:bg-green-300"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <SaveIcon className="h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="outline"
                    className="cursor-pointer bg-green-200 hover:bg-green-300"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <SaveIcon className="h-4 w-4" />
                        Approve
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </fieldset>
        </form>
      </Form>
    </div>
  );
};

export default BankProductsForm;
