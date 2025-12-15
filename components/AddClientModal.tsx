"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { CustomFormField } from "@/components/CustomFormField";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { US_STATES } from "@/constant/common";
import {
  dateOfBirthSchema,
  GenderEnum,
  genderTypes,
  ROLESEnum,
} from "@/schema";
import { ssnSchema } from "@/schema/registration";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, SaveIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ClientApplicationForm,
  clientApplicationSchema,
} from "@/schema/client-application";
import { useAuth } from "@/provider/AuthContext";
import { useStateMachine } from "little-state-machine";
import {
  updateClientApplicationAction,
  clearClientApplicationAction,
} from "@/store/client-application";
import { useDebounce } from "use-debounce";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";

interface AddClientModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSubmit: (data: ClientApplicationForm) => Promise<void>;
  isSubmitting?: boolean;
}

export function AddClientModal({
  isOpen,
  setIsOpen,
  onSubmit,
  isSubmitting = false,
}: AddClientModalProps) {
  const { user } = useAuth();
  const { state, actions } = useStateMachine({
    actions: {
      updateClientApplicationAction,
      clearClientApplicationAction,
    },
  });

  const savedDraft = user ? state.clientApplication?.[user.uid] : undefined;

  const defaultValues = useMemo(() => {
    if (savedDraft && Object.keys(savedDraft).length > 0) {
      // Ensure dates are converted back to Date objects if they were serialized as strings
      const restored = { ...savedDraft };
      if (typeof restored.birthdate === "string") {
        restored.birthdate = new Date(restored.birthdate);
      }
      if (typeof restored.registrationDate === "string") {
        restored.registrationDate = new Date(restored.registrationDate);
      }
      return restored;
    }
    return {
      middleName: "",
    };
  }, [savedDraft]);

  const form = useForm<ClientApplicationForm>({
    resolver: zodResolver(clientApplicationSchema),
    defaultValues,
  });

  const { isDirty, dirtyFields } = form.formState;

  // Reset form when defaultValues change (e.g. when draft is loaded)
  useEffect(() => {
    if (savedDraft && Object.keys(savedDraft).length > 0 && !isDirty) {
      const restored = { ...savedDraft };
      // Handle date restoration
      if (restored.birthdate && typeof restored.birthdate === "string") {
        restored.birthdate = new Date(restored.birthdate);
      }
      if (
        restored.registrationDate &&
        typeof restored.registrationDate === "string"
      ) {
        restored.registrationDate = new Date(restored.registrationDate);
      }
      form.reset(restored);
    }
  }, [savedDraft, form, isDirty]);

  const [debouncedFormValues] = useDebounce(form.watch(), 1000);

  useEffect(() => {
    if (
      user &&
      isDirty &&
      Object.keys(dirtyFields).length > 0 &&
      !isSubmitting
    ) {
      const hasValues = Object.values(debouncedFormValues).some(
        (val) => val !== "" && val !== undefined && val !== null
      );
      if (hasValues) {
        actions.updateClientApplicationAction({
          userId: user.uid,
          data: debouncedFormValues,
        });
      }
    }
  }, [debouncedFormValues, isDirty, dirtyFields, isSubmitting, user, actions]);

  const handleSubmit = async (data: ClientApplicationForm) => {
    await onSubmit(data);
    if (user) {
      actions.clearClientApplicationAction({ userId: user.uid });
    }
    form.reset();
  };

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Client Registration"
      description="Register a new client"
      className="max-w-[95vw] sm:max-w-[600px] lg:max-w-[900px]"
    >
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <fieldset disabled={isSubmitting}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <CustomFormField
                      name={"firstName"}
                      placeholder={""}
                      label="* First Name"
                    />
                    <CustomFormField
                      name={"middleName"}
                      placeholder={""}
                      label="Middle Name"
                    />
                    <CustomFormField
                      name={"lastName"}
                      placeholder={""}
                      label="* Last Name"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CustomFormField
                      name={"email"}
                      type="email"
                      placeholder=""
                      label="* Email Address"
                    />
                    <CustomFormField
                      name={"phoneNumber"}
                      placeholder=""
                      label="* Phone Number"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CustomFormField
                      name={"birthdate"}
                      type="date-picker"
                      placeholder=""
                      label="* Birthdate"
                      dateAfterHidden={new Date()}
                    />
                    <CustomFormField
                      name={"gender"}
                      type="select"
                      placeholder=" "
                      label="* Gender"
                      options={genderTypes()}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <CustomFormField
                      name={"addressStreet"}
                      label={"Street Address"}
                    />
                    <CustomFormField
                      name={"houseNumber"}
                      label={"Apartment/Suite/Unit/House Number"}
                    />
                  </div>

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

                  <div className="grid grid-cols-2 gap-4">
                    <CustomFormField
                      name={"employmentPayPerMonth"}
                      type="number"
                      label={"Monthly income"}
                    />

                    <CustomFormField
                      name={"payPerMonth"}
                      type="number"
                      label={"Rent/Mortgage payment"}
                    />
                    {/* <CustomFormField
                      name={"rentOrMortgage"}
                      label={"Is it rent or mortgage? If else, please specify"}
                    /> */}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CustomFormField
                      name={"ssn"}
                      type="ssn"
                      placeholder="xxx-xx-xxxx"
                      label="* Social Security Number"
                    />
                  </div>
                </div>
              </fieldset>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            onClick={form.handleSubmit(handleSubmit)}
            className="w-full sm:w-auto bg-green-400 hover:bg-green-500 text-black-100"
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <SaveIcon className="mr-2 h-4 w-4" />
                Register Client
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </ResponsiveDialog>
  );
}
