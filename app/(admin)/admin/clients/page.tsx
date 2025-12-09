"use client";
import ClientsList from "@/app/(admin)/admin/clients/list";
import HeaderBox from "@/components/HeaderBox";
import { withAdminGuard } from "@/components/wrapper";
import { Button } from "@/components/ui/button";
import { Plus, Loader2Icon, SaveIcon } from "lucide-react";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CustomFormField } from "@/components/CustomFormField";
import {
  dateOfBirthSchema,
  GenderEnum,
  genderTypes,
  ROLESEnum,
} from "@/schema";
import { ssnSchema } from "@/schema/registration";
import { useAdminAddClientMutation } from "@/hooks/user";
import { toast } from "sonner";
import { US_STATES } from "@/constant/common";

// Client application schema
const clientApplicationSchema = z.object({
  // Client Information
  firstName: z.string().min(1, { message: "Required" }),
  middleName: z.string().optional(),
  lastName: z.string().min(1, { message: "Required" }),
  email: z.string().min(1, { message: "Required" }),
  birthdate: dateOfBirthSchema,
  gender: GenderEnum,
  phoneNumber: z.string().min(1, { message: "Required" }),
  role: ROLESEnum.optional(),
  isOnboarded: z.boolean().optional(),
  registrationDate: z.date().optional(),
  ssn: ssnSchema,

  addressStreet: z.string().min(1, { error: "Required" }),
  houseNumber: z.string().optional(),
  addressCity: z.string().min(1, { error: "Required" }),
  addressState: z.string().min(1, { error: "Required" }),
  addressPostal: z.string().min(1, { error: "Required" }),
});

type ClientApplicationForm = z.infer<typeof clientApplicationSchema>;

const ClientsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mutation = useAdminAddClientMutation();

  const form = useForm<ClientApplicationForm>({
    resolver: zodResolver(clientApplicationSchema),
  });

  const onSubmit = async (data: ClientApplicationForm) => {
    setIsSubmitting(true);

    try {
      await mutation.mutateAsync({ ...data, password: data.email });
      toast.success("Client registered successfully!", {
        description:
          "The client will receive an invitation email to create their account.",
      });
      form.reset();
      setIsModalOpen(false);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <div className="flex flex-row justify-between items-center w-full">
            <HeaderBox title="Clients" />
            <Button
              variant={"outline"}
              className="bg-blue-200 hover:bg-blue-300 cursor-pointer"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add New Client
            </Button>
          </div>
        </header>

        <ClientsList />

        {/* Add Client Modal */}
        <ResponsiveDialog
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          title="Client Registration"
          description="Register a new client"
          className="max-w-[95vw] sm:max-w-[600px] lg:max-w-[900px]"
        >
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <fieldset disabled={isSubmitting}>
                    <div className="space-y-2">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CustomFormField
                          name={"ssn"}
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
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={form.handleSubmit(onSubmit)}
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
      </div>
    </section>
  );
};

export default withAdminGuard(ClientsPage);
