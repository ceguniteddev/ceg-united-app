"use client";
import { CustomFormField } from "@/components/CustomFormField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, Loader2Icon, SaveIcon, XIcon } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { US_STATES } from "@/constant/common";
import { Business, BusinessForm, businessFormSchema } from "@/schema";
import HeaderBox from "@/components/HeaderBox";
import BusinessList from "./list";
import { useCallback, useEffect, useState } from "react";
import { useBusinessMutation } from "@/hooks/business";
import { useAuth } from "@/provider/AuthContext";
import IconMenu from "@/components/icon-menu";
import Spinner from "@/components/Spinner";

const defaultValues: BusinessForm = {
  businessName: "",
  businessStreetAddress: "",
  businessCityAddress: "",
  businessStateAddress: "",
  businessPostalAddress: "",
  businessPhoneNumber: "",
  businessEmail: "",
  businessWebsite: "",
  socialMedia: "",
  employerIdentificationNumber: "",
};

const MyBusinessPage = () => {
  const { user } = useAuth();
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const { recordBusiness, isRecording, updateBusiness, isUpdating } = useBusinessMutation();
  const form = useForm<BusinessForm>({
    resolver: zodResolver(businessFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (editingBusiness) {
      const { userId: _omit, ...formValues } = editingBusiness;
      form.reset(formValues);
    }
  }, [editingBusiness, form]);

  const handleCancelEdit = useCallback(() => {
    setEditingBusiness(null);
    form.reset(defaultValues);
    form.clearErrors();
    setTimeout(() => form.setFocus("businessName"), 0);
  }, [form]);

  const onSubmit: SubmitHandler<BusinessForm> = useCallback(
    async (values) => {
      if (!user?.uid) {
        return;
      }

      const payload: Business = { ...values, userId: user.uid };

      if (editingBusiness?.id) {
        await updateBusiness({ id: editingBusiness.id, values: payload });
        setEditingBusiness(null);
        form.reset(defaultValues);
      } else {
        await recordBusiness({ values: payload });
        form.reset(defaultValues);
      }
    },
    [recordBusiness, updateBusiness, editingBusiness, form, user]
  );

  if (!user) {
    return <Spinner displayText="Loading data..." />;
  }
  const isSubmitting = isRecording || isUpdating;
  const isEditing = !!editingBusiness;
  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox title="My Business" subtext="Manage your business information" />
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <fieldset disabled={isSubmitting}>
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle className="text-center flex flex-col" />
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CustomFormField name="businessName" label="* Business Name" />
                        <CustomFormField
                          name="employerIdentificationNumber"
                          label="* Employer Identification Number"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CustomFormField
                          type="number"
                          name="lastYearTaxes"
                          label="Last Year Taxes"
                        />
                        <CustomFormField
                          name="currentYearTaxes"
                          label="Current Year Taxes"
                          type="number"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CustomFormField
                          name="businessEmail"
                          type="email"
                          label="* Email Address"
                        />
                        <CustomFormField name="businessPhoneNumber" label="* Phone Number" />
                      </div>

                      <CustomFormField name="businessStreetAddress" label="* Street Address" />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <CustomFormField name="businessCityAddress" label="* City" />
                        <CustomFormField
                          name="businessStateAddress"
                          label="* State"
                          type="select"
                          placeholder="Select a state"
                          options={US_STATES}
                        />
                        <CustomFormField name="businessPostalAddress" label="* Postal" />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                        <CustomFormField name="businessWebsite" label="Website" />
                        <CustomFormField name="socialMedia" label="Social Media" />
                      </div>
                    </CardContent>

                    <CardFooter>
                      <div className="flex flex-wrap items-center gap-2">
                        {isEditing && (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isSubmitting}
                            className="disabled:cursor-not-allowed"
                            onClick={handleCancelEdit}
                          >
                            <IconMenu icon={<XIcon className="mr-2 h-4 w-4" />} text="Cancel" />
                          </Button>
                        )}

                        <Button
                          type="submit"
                          variant="outline"
                          disabled={isSubmitting}
                          className="bg-emerald-200 hover:bg-emerald-300 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <IconMenu
                              icon={<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                              text={isEditing ? "Updating..." : "Saving..."}
                            />
                          ) : isEditing ? (
                            <IconMenu icon={<CheckIcon className="mr-2 h-4 w-4" />} text="Update" />
                          ) : (
                            <IconMenu icon={<SaveIcon className="mr-2 h-4 w-4" />} text="Save" />
                          )}
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </fieldset>
              </form>
            </Form>
          </div>

          <aside className="lg:col-span-5 lg:pl-2 lg:sticky lg:top-24">
            <BusinessList onEdit={(business) => setEditingBusiness(business)} />
          </aside>
        </div>
      </div>
    </section>
  );
};

export default MyBusinessPage;
