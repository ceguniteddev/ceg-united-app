"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubmitClientApplication } from "@/hooks/broker";
import {
  Loader2,
  UserPlus,
  ArrowLeft,
  Loader2Icon,
  SaveIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CustomFormField } from "@/components/CustomFormField";
import {
  dateOfBirthSchema,
  GenderEnum,
  genderTypes,
  ROLESEnum,
} from "@/schema";
import { Form } from "@/components/ui/form";
import { passwordSchema, ssnSchema } from "@/schema/registration";

// Client application schema
const clientApplicationSchema = z.object({
  // Client Information
  firstName: z.string().min(1, { error: "Required" }),
  middleName: z.string().optional(),
  lastName: z.string().min(1, { error: "Required" }),
  email: z.email().min(1, { error: "Required" }),
  // password: passwordSchema,
  birthdate: dateOfBirthSchema,
  gender: GenderEnum,
  phoneNumber: z.string().min(1, { error: "Required" }),
  role: ROLESEnum.optional(),
  isOnboarded: z.boolean().optional(),
  registrationDate: z.date().optional(),
  ssn: ssnSchema,

  // Business Information (Optional)
  // businessName: z.string().optional(),
  // businessDescription: z.string().optional(),

  // Funding Request
  // fundingType: z.string().min(1, { message: "Required" }),
  // requestedAmount: z
  //   .number()
  //   .min(1, { message: "Amount must be greater than 0" }),
  // fundingPurpose: z
  //   .string()
  //   .min(10, { message: "Please provide details (min 10 characters)" }),
});

type ClientApplicationForm = z.infer<typeof clientApplicationSchema>;

export default function SubmitApplicationPage() {
  const router = useRouter();
  const mutation = useSubmitClientApplication();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientApplicationForm>({
    resolver: zodResolver(clientApplicationSchema),
    defaultValues: {
      middleName: "",
      // businessName: "",
      // businessDescription: "",
    },
  });

  const onSubmit = async (data: ClientApplicationForm) => {
    setIsSubmitting(true);

    try {
      await mutation.mutateAsync({ ...data, password: data.email });
      toast.success("Application submitted successfully!", {
        description:
          "Your client will receive an invitation email to create their account.",
      });
      form.reset();
      // router.push("/broker/my-clients");
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/broker/home">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Client Registration
            </h1>
            <p className="text-muted-foreground">
              Register your client and process their funding application.
            </p>
          </div>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <fieldset disabled={isSubmitting}>
            <Card className="w-[800px]">
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                    name={"ssn"}
                    placeholder="xxx-xx-xxxx"
                    label="* Social Security Number"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex space-x-4 w-full">
                  <Button
                    size="lg"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-green-400 hover:bg-green-500 text-black-100 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <SaveIcon /> Register
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </fieldset>
        </form>
      </Form>
    </div>
  );
}
