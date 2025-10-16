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
} from "lucide-react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { fa } from "zod/v4/locales";
import { set } from "zod";
import ClientBusinessManagement from "../ClientBusinessManagement";
import IconMenu from "../icon-menu";
import { ResponsiveDialog } from "../responsive-dialog";
import { Business } from "@/schema";
import {
  useGetPlaidAccounts,
  useHasIncomeBankVerificationQuery,
  useHasPayrollBankVerificationQuery,
} from "@/hooks/plaid";
import NoBankLinked from "../NoBankLinked";
import PlaidLink from "../PlaidLink";
import PlaidIncomeLinkBank from "../PlaidLinkIncomeBank";
import PlaidIncomeLinkPayroll from "../PlaidLinkIncomePayroll";

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
  userId: string;
};

const ApplyFundingForm = ({
  setOpen,
  setCongratsOpen,
  data,
  isViewing,
  userId,
}: Props) => {
  const { incomeBankItem, isLoading: incomeBankItemLoading } =
    useHasIncomeBankVerificationQuery();
  const { incomePayrollItem, isLoading: payrollBankItemLoading } =
    useHasPayrollBankVerificationQuery();
  const { applyFunding, isRecording } = useApplyFunding();
  const [showLegalResidentOther, setShowLegalResidentOther] = useState(false);
  const [openBusinessModal, setOpenBusinessModal] = useState(false);
  const [interestedProductSelected, setInterestedProductSelected] = useState<
    FundingProductEnumType | undefined
  >(undefined);
  const [tradelinesOrShelf, setTradelinesOrShelf] = useState<boolean>(false);
  const [community, setCommunity] = useState<boolean>(false);

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

  const [businessIdSelected, setBusinessIdSelected] = useState<
    string | undefined
  >(undefined);

  const { businessData, isLoading: isBusinessLoading } =
    useBusinessQuery(userId);

  const businessOptions = useMemo<DropdownOption[]>(
    () =>
      (businessData ?? []).map((b) => ({
        value: b.businessName,
        label: `${b.businessName} (${b.employerIdentificationNumber})`,
      })),
    [businessData]
  );

  const form = useForm<ApplyFunding>({
    resolver: zodResolver(applyFundingSchema),
    mode: "onChange",
    defaultValues: {
      ...data,
      appliedDate: data?.appliedDate ?? new Date(),
      userId: userId,
      status: data?.status ?? "New",
      fundingType: "Personal",
      employmentStatus: "",
      personalTaxesStatus: "",
      businessTaxesStatus: "",
    },
  });

  // if (Object.keys(form.formState.errors).length > 0) {
  //   console.log("There are validation errors:", form.formState.errors);
  // }

  const handleBusinessSelect = useCallback(
    (value: string) => {
      form.setValue("businessName", value, { shouldValidate: true });

      const b = businessData?.find((x) => x.businessName === value);
      if (b) {
        setBusinessIdSelected(b.id);
        form.setValue("businessId", b.id ?? "", { shouldValidate: false });
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
        form.setValue("businessEmail", b.businessEmail ?? "", {
          shouldValidate: false,
        });
        form.setValue("businessWebsite", b.businessWebsite ?? "", {
          shouldValidate: false,
        });
        // form.setValue("socialMedia", b.socialMedia ?? [], {
        //   shouldValidate: false,
        // });
        form.setValue(
          "employerIdentificationNumber",
          b.employerIdentificationNumber ?? "",
          {
            shouldValidate: false,
          }
        );
        form.setValue("lastYearTaxes", b.lastYearTaxes ?? 0, {
          shouldValidate: false,
        });
        form.setValue("currentYearTaxes", b.currentYearTaxes ?? 0, {
          shouldValidate: false,
        });
      }
    },
    [businessData, form]
  );

  useEffect(() => {
    if (interestedProductSelected) {
      setTradelinesOrShelf(
        interestedProductSelected.value.includes("Shelf") ||
          interestedProductSelected.value.includes("Tradelines")
      );

      setCommunity(interestedProductSelected.value.includes("Community"));
    }
  }, [interestedProductSelected]);

  const onSubmit = useCallback(async () => {
    const values = form.getValues();
    await applyFunding({ values });
    setOpen(false);
    if (setCongratsOpen) setCongratsOpen(true);
  }, [setOpen, setCongratsOpen, applyFunding, form]);

  const handleApproveClickCapture: React.MouseEventHandler<
    HTMLSpanElement
  > = async (e) => {
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
      const selectedProduct = FundingProductTypeEnum.find(
        (product) => product.value === value
      );
      if (selectedProduct) {
        setInterestedProductSelected(selectedProduct);
        form.setValue("fundingType", selectedProduct.type, {
          shouldValidate: true,
        });
      }
    },
    [form]
  );

  const handleDoYouHaveAJobChange = useCallback(
    (value: string) => {
      const selectedValue = howDoYouGetPaid.find((x) => x.value === value);
      if (selectedValue) {
        setHowDoYouGetPaidSelected(selectedValue);
        form.setValue("employmentStatus", selectedValue.type!, {
          shouldValidate: true,
        });
        console.log("selectedValue.value", selectedValue.value);
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
        });
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
        className="w-3/6"
      >
        <ClientBusinessManagement
          userId={userId}
          editingBusiness={null}
          setEditingBusiness={() => {}}
          isModal
          setOpen={setOpenBusinessModal}
        />
      </ResponsiveDialog>
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset disabled={isRecording}>
            <input type="hidden" {...form.register("fundingType")} />
            <div>
              <Card>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
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
                      !tradelinesOrShelf && (
                        <CustomFormField
                          name={"personalAmountFunding"}
                          label="How Much Personal Funding Are You Looking For?"
                          type="number"
                        />
                      )}
                    {interestedProductSelected?.type?.includes("Business") &&
                      !tradelinesOrShelf && (
                        <CustomFormField
                          name={"businessAmountFunding"}
                          label="How Much Business Funding Are You Looking For?"
                          type="number"
                        />
                      )}
                  </div>

                  <Card className="bg-cyan-50">
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 items-start">
                        {!tradelinesOrShelf && false && (
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
                      {!tradelinesOrShelf && false && (
                        <div className="grid grid-cols-2 gap-4">
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

                      <CustomFormField
                        name={"addressStreet"}
                        label={"Street Address"}
                      />
                      <div className="grid grid-cols-3 gap-4">
                        <CustomFormField name={"addressCity"} label={"City"} />
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
                      <div className="grid grid-cols-3 gap-4">
                        <CustomFormField
                          name={"moveInCurrentAddress"}
                          label={
                            "When did you move in to your current address?"
                          }
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
                  {!tradelinesOrShelf && (
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
                    !tradelinesOrShelf && (
                      <Card className="bg-blue-50">
                        <CardHeader>
                          <CardTitle className="flex flex-row justify-between">
                            <div>Employment Information</div>
                            {howDoYouGetPaidSelectedBank && (
                              <PlaidLink displayText="Link Personal Account" />
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <CustomFormField
                              name={"employmentPayPerMonth"}
                              type="number"
                              label={"How much money do you make per month?"}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <CustomFormField
                              name={"employmentEmployerName"}
                              label={"Employer Name?"}
                            />
                            <CustomFormField
                              name={"employmentEmployerPhoneNumber"}
                              label={"Employer Phone Number?"}
                            />
                          </div>
                          <CustomFormField
                            name={"employmentEmployerAddress"}
                            label={"Employer Address?"}
                          />
                          <div className="grid grid-cols-2 gap-4">
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
                          <CustomFormField
                            name={"personalTaxes"}
                            label={"Did you file your personal taxes?"}
                            type="select"
                            options={personalTaxes}
                            onSelectValue={handlePersonalTaxesChange}
                          />
                          {personalTaxesSelected?.type === "yes" && (
                            <div className="grid grid-cols-3 gap-4">
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

                  {interestedProductSelected?.type?.includes("Business") &&
                    !tradelinesOrShelf && (
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
                          className="justify-self-start md:justify-self-end"
                          onClick={() => setOpenBusinessModal(true)}
                        >
                          <IconMenu text="Add Business" icon={<Plus />} />
                        </Button>
                      </div>
                    )}

                  {businessIdSelected &&
                    interestedProductSelected?.type?.includes("Business") &&
                    !tradelinesOrShelf && (
                      <Card className="bg-orange-50">
                        <CardHeader>
                          <CardTitle className="flex flex-row justify-between">
                            <div>Business Information</div>
                            <PlaidLink displayText="Link Business Acount" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <CustomFormField
                              name={"businessGrossProjectedRevenue1"}
                              type="number"
                              label={`${currentYear} (gross projected revenue)?`}
                            />
                            <CustomFormField
                              name={"businessProjectedProfit1"}
                              type="number"
                              label={`${currentYear} (projected profit)?`}
                            />
                            <CustomFormField
                              name={"businessGrossProjectedRevenue2"}
                              type="number"
                              label={`${
                                currentYear - 1
                              } (gross projected revenue)?`}
                            />
                            <CustomFormField
                              name={"businessProjectedProfit2"}
                              type="number"
                              label={`${currentYear - 1} (projected profit)?`}
                            />
                            <CustomFormField
                              name={"businessGrossProjectedRevenue3"}
                              type="number"
                              label={`${
                                currentYear - 2
                              } (gross projected revenue)?`}
                            />
                            <CustomFormField
                              name={"businessProjectedProfit3"}
                              type="number"
                              label={`${currentYear - 2} (projected profit)?`}
                            />
                          </div>
                          <CustomFormField
                            name={"businessTaxes"}
                            label={
                              "How much did you report on your business taxes?"
                            }
                            type="select"
                            options={businessTaxes}
                            onSelectValue={handleBusinessTaxesChange}
                          />
                          {businessTaxesSelected?.type === "yes" && (
                            <div className="grid grid-cols-3 gap-4">
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
                        </CardContent>
                      </Card>
                    )}
                </CardContent>

                <CardFooter className="flex justify-end">
                  {!data ? (
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
                      <div className="flex gap-4">
                        <Button
                          size="lg"
                          variant={"outline"}
                          type="button"
                          disabled={isRecording}
                          onClick={() => setOpen(false)}
                          className=" bg-red-200 hover:bg-red-300 text-black-100 cursor-pointer"
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
                            isLoading={form.formState.isSubmitting}
                            trigger={
                              <Button
                                size="lg"
                                type="submit"
                                disabled={isRecording}
                                className=" bg-green-400 hover:bg-green-500 text-black-100 cursor-pointer"
                              >
                                {isRecording ? (
                                  <>
                                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                                    Applying...
                                  </>
                                ) : (
                                  <>
                                    <BanknoteIcon className="mr-2 h-4 w-4" />{" "}
                                    Apply Funding
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
