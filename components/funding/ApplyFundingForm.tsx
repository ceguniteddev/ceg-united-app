"use client";
import { CustomFormField } from "@/components/CustomFormField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ApplyFunding, applyFundingSchema, FundingApplicationType } from "@/schema/apply-funding";
import { zodResolver } from "@hookform/resolvers/zod";
import { BanknoteIcon, CircleXIcon, Loader2Icon } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

import { getCaptchaTokenRegistration } from "@/lib/captcha";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/provider/AuthContext";
import { useApplyFunding } from "@/hooks/apply-funding";
import { US_STATES } from "@/constant/common";

const interestedProduct: DropdownOption[] = [
  {
    value: "Personal & Business Funding",
    label: "Personal & Business Funding",
    category: "Personal And Business",
  },
  { value: "Personal Funding", label: "Personal Funding", category: "Personal" },
  { value: "Business Funding", label: "Business Funding", category: "Business" },
  { value: "Personal Tradelines", label: "Personal Tradelines", category: "Personal" },
  { value: "Business Tradelines", label: "Business Tradelines", category: "Business" },
  {
    value: "Personal & Business Tradelines",
    label: "Personal & Business Tradelines",
    category: "Personal And Business",
  },
  { value: "Aged Shelf Corporation", label: "Aged Shelf Corporation", category: "All" },
  { value: "Knowledge Community", label: "Knowledge Community", category: "All" },
  { value: "Auto Loan", label: "Auto Loan", category: "All" },
  { value: "Equipment Financing", label: "Equipment Financing", category: "All" },
];

const businessProducts = [
  "Personal & Business Funding",
  "Personal & Business Tradelines",
  "Business Funding",
  "Business Tradelines",
];

const legalResident: DropdownOption[] = [
  { value: "Yes, I'm a citizen", label: "Yes, I'm a citizen" },
  { value: "Yes, I have green card", label: "Yes, I have green card" },
  { value: "No, I don't have legal status", label: "No, I don't have legal status" },
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
};

const getCategory = (value?: string) =>
  (interestedProduct.find((p) => p.value === value)?.category ?? undefined) as
    | FundingApplicationType
    | undefined;

const ApplyFundingForm = ({ setOpen, setCongratsOpen, data }: Props) => {
  const { user } = useAuth();
  const { applyFunding, isRecording } = useApplyFunding();
  const [showLegalResidentOther, setShowLegalResidentOther] = useState(false);
  const [interestedProductSelected, setInterestedProductSelected] = useState<
    DropdownOption | undefined
  >(undefined);

  const form = useForm<ApplyFunding>({
    resolver: zodResolver(applyFundingSchema),
    defaultValues: {
      ...data,
      appliedDate: data?.appliedDate ?? new Date(),
      userId: user?.uid ?? "",
      status: data?.status ?? "New",
      fundingType: data?.fundingType ?? getCategory(data?.interestedProduct) ?? "Personal",
    },
  });

  const interested = form.watch("interestedProduct");
  useEffect(() => {
    const cat = getCategory(interested);
    if (cat) {
      form.setValue("fundingType", cat, { shouldValidate: true, shouldDirty: true });
    }
  }, [interested, form]);

  const onSubmit: SubmitHandler<ApplyFunding> = useCallback(
    async (values) => {
      const token = await getCaptchaTokenRegistration("applyFunding");
      await applyFunding({ token, values });
      setOpen(false);
      if (setCongratsOpen) setCongratsOpen(true);
    },
    [setOpen, setCongratsOpen, applyFunding]
  );

  const handleLegalResidentChange = useCallback((value: string) => {
    if (value === "Other") {
      setShowLegalResidentOther(true);
    } else {
      setShowLegalResidentOther(false);
    }
  }, []);

  const handleInterestedProductChange = useCallback((value: string) => {
    const selectedProduct = interestedProduct.find((product) => product.value === value);
    if (selectedProduct) {
      setInterestedProductSelected(selectedProduct);
    }
  }, []);

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <fieldset disabled={isRecording}>
            <input type="hidden" {...form.register("fundingType")} />
            <div>
              <Card>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <CustomFormField
                      name={"interestedProduct"}
                      label="* The Product You're Most Interested In"
                      type="select"
                      placeholder=" "
                      options={interestedProduct}
                      onSelectValue={handleInterestedProductChange}
                    />
                    <CustomFormField
                      name={"amountFunding"}
                      label="* How Much Funding Are You Looking For?"
                      type="number"
                    />
                  </div>
                  {interestedProductSelected &&
                    interestedProductSelected.category?.includes("Business") && (
                      <CustomFormField
                        name={"businessName"}
                        label="* Enter Business name (Business Funding Only)"
                      />
                    )}

                  <div className="grid grid-cols-2 gap-4 items-start">
                    <CustomFormField
                      name={"legalResident"}
                      onSelectValue={handleLegalResidentChange}
                      label={"* Are you a legal resident of the United Sates?"}
                      type="select"
                      options={legalResident}
                    />
                    {showLegalResidentOther && (
                      <CustomFormField
                        name={"currentSituation"}
                        type="textarea"
                        label="* Please explain your current situation"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <CustomFormField
                      name={"motherMaidenName"}
                      label={"* What is your mother's maiden name?"}
                    />
                    <CustomFormField
                      name={"isMarried"}
                      label={"* Are you married?"}
                      type="select"
                      options={isMarried}
                    />
                  </div>
                  <CustomFormField name={"addressStreet"} label={"* Street Address"} />
                  <div className="grid grid-cols-3 gap-4">
                    <CustomFormField name={"addressCity"} label={"* City"} />
                    <CustomFormField
                      name={"addressState"}
                      label={"* State"}
                      type="select"
                      placeholder="Select a state"
                      options={US_STATES}
                    />
                    <CustomFormField name={"addressPostal"} label={"* Postal"} />
                  </div>
                  <CustomFormField
                    name={"moveInCurrentAddress"}
                    label={"* When did you move in to your current address?"}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <CustomFormField
                      name={"payPerMonth"}
                      type="number"
                      label={"* How much do you pay a month?"}
                    />
                    <CustomFormField
                      name={"rentOrMortgage"}
                      label={"* Is it rent or mortgage? If else, please specify"}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  {!data ? (
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <Button
                        size="lg"
                        variant={"outline"}
                        type="button"
                        disabled={isRecording}
                        onClick={() => setOpen(false)}
                        className=" bg-red-200 hover:bg-red-300 text-black-100"
                      >
                        <CircleXIcon className="mr-2 h-4 w-4" /> Close
                      </Button>
                      <Button
                        size="lg"
                        type="submit"
                        disabled={isRecording}
                        className=" bg-green-400 hover:bg-green-500 text-black-100"
                      >
                        {isRecording ? (
                          <>
                            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          <>
                            <BanknoteIcon className="mr-2 h-4 w-4" /> Apply Funding
                          </>
                        )}
                      </Button>
                    </div>
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
