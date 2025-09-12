"use client";
import { CustomFormField } from "@/components/CustomFormField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ApplyFunding, applyFundingSchema } from "@/schema/apply-funding";
import { zodResolver } from "@hookform/resolvers/zod";
import { BanknoteIcon, CheckIcon, CircleXIcon, Loader2Icon } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

import { getCaptchaTokenRegistration } from "@/lib/captcha";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/provider/AuthContext";
import { useApplyFunding } from "@/hooks/apply-funding";
import { US_STATES } from "@/constant/common";
import { useFundingProducts } from "@/hooks/admin/funding-product";
import Spinner from "../Spinner";
import { useBusinessQuery } from "@/hooks/business";
import { ConfirmButton } from "../Confirmation";

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
  isViewing?: boolean;
};

const ApplyFundingForm = ({ setOpen, setCongratsOpen, data, isViewing }: Props) => {
  const { user } = useAuth();
  const { applyFunding, isRecording } = useApplyFunding();
  const [showLegalResidentOther, setShowLegalResidentOther] = useState(false);
  const [interestedProductSelected, setInterestedProductSelected] = useState<
    DropdownOption | undefined
  >(undefined);
  const [interestedProducts, setInterestedProducts] = useState<DropdownOption[]>([]);
  const { products, isLoading } = useFundingProducts();
  const [busyStatus, setBusyStatus] = useState<ApplyFunding | null>(null);

  const { businessData, isLoading: isBusinessLoading } = useBusinessQuery(
    (data?.userId || user?.uid) ?? ""
  );

  const businessOptions = useMemo<DropdownOption[]>(
    () =>
      (businessData ?? []).map((b) => ({
        value: b.businessName,
        label: `${b.businessName} (${b.employerIdentificationNumber})`,
      })),
    [businessData]
  );

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

      if (data?.interestedProduct) {
        const selected = dropdownOptions.filter((x) => x.value === data?.interestedProduct);
        setInterestedProductSelected(selected[0]);
      }
    }
  }, [products, data]);

  const form = useForm<ApplyFunding>({
    resolver: zodResolver(applyFundingSchema),
    defaultValues: {
      ...data,
      appliedDate: data?.appliedDate ?? new Date(),
      userId: user?.uid ?? "",
      status: data?.status ?? "New",
      fundingType: data?.fundingType ?? "All",
    },
  });

  const handleBusinessSelect = useCallback(
    (value: string) => {
      form.setValue("businessName", value, { shouldValidate: true });

      const b = businessData?.find((x) => x.businessName === value);
      if (b) {
        form.setValue("businessStreetAddress", b.businessStreetAddress ?? "", {
          shouldValidate: false,
        });
        form.setValue("businessCityAddress", b.businessCityAddress ?? "", {
          shouldValidate: false,
        });
        form.setValue("businessStateAddress", b.businessStateAddress ?? "", {
          shouldValidate: false,
        });
        form.setValue("businessPostalAddress", b.businessPostalAddress ?? "", {
          shouldValidate: false,
        });
        form.setValue("businessPhoneNumber", b.businessPhoneNumber ?? "", {
          shouldValidate: false,
        });
        form.setValue("businessEmail", b.businessEmail ?? "", { shouldValidate: false });
        form.setValue("businessWebsite", b.businessWebsite ?? "", { shouldValidate: false });
        form.setValue("socialMedia", b.socialMedia ?? "", { shouldValidate: false });
        form.setValue("employerIdentificationNumber", b.employerIdentificationNumber ?? "", {
          shouldValidate: false,
        });
        form.setValue("lastYearTaxes", b.lastYearTaxes ?? 0, { shouldValidate: false });
        form.setValue("currentYearTaxes", b.currentYearTaxes ?? 0, { shouldValidate: false });
      }
    },
    [businessData, form]
  );

  const onSubmit = useCallback(async () => {
    const values = form.getValues();
    const token = await getCaptchaTokenRegistration("applyFunding");
    await applyFunding({ token, values });
    setOpen(false);
    if (setCongratsOpen) setCongratsOpen(true);
  }, [setOpen, setCongratsOpen, applyFunding, form]);

  const handleApproveClickCapture: React.MouseEventHandler<HTMLSpanElement> = async (e) => {
    const ok = await form.trigger(); // runs Zod validation and shows errors if any
    if (!ok) {
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
      const selectedProduct = interestedProducts.find((product) => product.value === value);
      if (selectedProduct) {
        setInterestedProductSelected(selectedProduct);
        form.setValue("fundingType", selectedProduct.category, { shouldValidate: true });
      }
    },
    [interestedProducts, form]
  );

  if (isLoading) return <Spinner displayText="Loading data..." />;

  if (!products || products.length === 0) {
    return (
      <div>
        <p className="text-center">
          No funding products available, please contact {process.env.NEXT_PUBLIC_APP_NAME} team.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
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
                      options={interestedProducts}
                      onSelectValue={handleInterestedProductChange}
                    />
                    <CustomFormField
                      name={"amountFunding"}
                      label="* How Much Funding Are You Looking For?"
                      type="number"
                    />
                  </div>
                  {interestedProductSelected?.category?.includes("Business") &&
                    (businessOptions.length > 0 ? (
                      <CustomFormField
                        name="businessName"
                        label="* Select Business (Business Funding Only)"
                        type="select"
                        placeholder="Select your business"
                        options={businessOptions}
                        onSelectValue={handleBusinessSelect}
                      />
                    ) : (
                      // Fallback if the user has no saved businesses yet
                      <CustomFormField
                        name="businessName"
                        label="* Enter Business name (Business Funding Only)"
                      />
                    ))}

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
                <CardFooter className="flex justify-end">
                  {!data ? (
                    <div className="grid grid-cols-2 gap-4">
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

                      <span onClickCapture={handleApproveClickCapture}>
                        <ConfirmButton
                          label="Apply"
                          confirmLabel="Apply"
                          description="Please confirm your application."
                          variant="default"
                          size="sm"
                          icon={<CheckIcon className="h-4 w-4" />}
                          onConfirm={() => onSubmit()}
                          className="bg-green-600 hover:bg-green-700"
                          classNameAction="bg-green-600 hover:bg-green-700"
                          isLoading={form.formState.isSubmitting || busyStatus !== null}
                          trigger={
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
                          }
                        />
                      </span>
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
