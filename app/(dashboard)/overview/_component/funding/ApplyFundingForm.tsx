"use client";
import { CustomFormField } from "@/components/CustomFormField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ApplyFunding, applyFundingSchema } from "@/schema/apply-funding";
import { zodResolver } from "@hookform/resolvers/zod";
import { BanknoteIcon, Loader2Icon } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

import { useRegistration } from "@/hooks/registration";
import { getCaptchaTokenRegistration } from "@/lib/captcha";
import { useState } from "react";
import { useAuth } from "@/provider/AuthContext";
import { useApplyFunding } from "@/hooks/apply-funding";

const interestedProduct: DropdownOption[] = [
  { value: "Personal & Business Funding", label: "Personal & Business Funding" },
  { value: "Personal Funding", label: "Personal Funding" },
  { value: "Business Funding", label: "Business Funding" },

  { value: "Personal Tradelines", label: "Personal Tradelines" },
  { value: "Business Tradelines", label: "Business Tradelines" },
  { value: "Personal & Business Tradelines", label: "Personal & Business Tradelines" },
  { value: "Aged Shelf Corporation", label: "Aged Shelf Corporation" },
  { value: "Knowledge Community", label: "Knowledge Community" },

  { value: "Auto Loan", label: "Auto Loan" },
  { value: "Equipment Financing", label: "Equipment Financing" },
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
  setCongratsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const ApplyFundingForm = ({ setOpen, setCongratsOpen }: Props) => {
  const { user } = useAuth();
  const { applyFunding, isRecording } = useApplyFunding();
  const [showLegalResidentOther, setShowLegalResidentOther] = useState(false);

  const form = useForm<ApplyFunding>({
    resolver: zodResolver(applyFundingSchema),
  });

  const onSubmit: SubmitHandler<ApplyFunding> = async (values) => {
    const token = await getCaptchaTokenRegistration("applyFunding");
    await applyFunding({ token, values });
    setOpen(false);
    setCongratsOpen(true);
  };

  const handleLegalResidentChange = (value: string) => {
    if (value === "Other") {
      setShowLegalResidentOther(true);
    } else {
      setShowLegalResidentOther(false);
    }
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <fieldset disabled={isRecording}>
            <div>
              <Card>
                <CardContent className="space-y-4">
                  <input
                    type="hidden"
                    {...form.register("userId")}
                    defaultValue={user?.uid ?? ""}
                  />
                  <input type="hidden" {...form.register("status")} defaultValue={"New"} />
                  <div className="grid grid-cols-2 gap-4">
                    <CustomFormField
                      name={"interestedProduct"}
                      label="* Please Select The Product You're Most Interested In"
                      type="select"
                      options={interestedProduct}
                    />
                    <CustomFormField
                      name={"amountFunding"}
                      label="* How Much Funding Are You Looking For?"
                      type="number"
                    />
                  </div>
                  <div>
                    <CustomFormField
                      name={"currentSituation"}
                      type="textarea"
                      label="* Please explain your current situation"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <CustomFormField
                      name={"legalResident"}
                      onSelectValue={handleLegalResidentChange}
                      label={"* Are you a legal resident or citizen of the United Sates?"}
                      type="select"
                      options={legalResident}
                    />
                    {showLegalResidentOther && (
                      <CustomFormField name={"legalResidentOther"} label={"Other"} />
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
                    <CustomFormField name={"addressState"} label={"* State"} />
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
                      label={"* How much do you pay a month? Your portion only"}
                    />
                    <CustomFormField
                      name={"rentOrMortgage"}
                      label={"* Is it rent or mortgage? If else, please specify"}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex space-x-4 w-full">
                    <Button
                      size="lg"
                      type="submit"
                      disabled={isRecording}
                      className="w-full bg-green-400 hover:bg-green-500 text-black-100"
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
