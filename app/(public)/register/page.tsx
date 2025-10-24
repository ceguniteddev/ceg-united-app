"use client";
import { CustomFormField } from "@/components/CustomFormField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { User, registrationSchema } from "@/schema/registration";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, SaveIcon } from "lucide-react";
import {
  useForm,
  useWatch,
} from "react-hook-form";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { genderTypes } from "@/schema";
import { useRegistration } from "@/hooks/registration";
import { PasswordStrength } from "@/components/PasswordStrength";
import Link from "next/link";
import { getCaptchaTokenRegistration } from "@/lib/captcha";
import Image from "next/image";
// import { frequencyOfIncome, US_STATES } from "@/constant/common";
const RegistrationPage = () => {
  const { recordRegistration, isRecording } = useRegistration();

  const form = useForm<User>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      password: "",
    } as Partial<User>,
  });

  const password = useWatch({
    control: form.control,
    name: "password",
    defaultValue: "",
  });

  const onSubmit = async (values: User) => {
    const token = await getCaptchaTokenRegistration("registration");

    values = {
      ...values,
      role: "Client",
      isOnboarded: false,
      registrationDate: new Date(),
    };
    await recordRegistration({ token, values });
  };

  return (
    <div>
      <div className="flex justify-center items-center">
        <Image
          src="/icon.png"
          alt={process.env.NEXT_PUBLIC_APP_NAME as string}
          width={100}
          height={100}
        />
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <fieldset disabled={isRecording}>
            <div className="flex justify-center">
              <Card className="w-[800px]">
                <CardHeader>
                  <CardTitle className="text-center flex flex-col">
                    <span className="text-2xl font-bold">
                      {"Register your account"}
                    </span>
                    <span>{"It's quick and easy."}</span>
                  </CardTitle>
                </CardHeader>
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

                  {/* <div className="grid grid-cols-3 gap-4">
                    <CustomFormField
                      name={"personalIncome"}
                      label="Personal Income?"
                      type="number"
                    />
                    <CustomFormField
                      name={"frequencyOfIncome"}
                      label="Frequency of Income?"
                      type="select"
                      placeholder="Select frequency"
                      options={frequencyOfIncome}
                    />
                    <CustomFormField
                      name={"paymentType"}
                      label="Payment Type?"
                      placeholder="Select payment type"
                      type="select"
                      options={[
                        { value: "Cash", label: "Cash" },
                        { value: "Check to Cash", label: "Check to Cash" },
                        { value: "Check to Deposit", label: "Check to Deposit" },
                        { value: "Direct Deposit", label: "Direct Deposit" },
                      ]}
                    />
                  </div> */}
                  {/* <div className="grid grid-cols-2 gap-4">
                    <CustomFormField name={"businessGross"} label="Business Gross?" type="number" />
                    <CustomFormField name={"businessNet"} label="Business Net?" type="number" />
                  </div> */}

                  {/* <CustomFormField
                    name={"addressStreet"}
                    label={"* Street Address"}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <CustomFormField name={"addressCity"} label={"* City"} />
                    <CustomFormField
                      name={"addressState"}
                      label={"* State"}
                      type="select"
                      placeholder="Select a state"
                      options={US_STATES}
                    />
                    <CustomFormField
                      name={"addressPostal"}
                      label={"* Zip Code"}
                    />
                  </div> */}
                  <div className="grid grid-cols-2 gap-4">
                    <CustomFormField
                      name={"ssn"}
                      placeholder="xxx-xx-xxxx"
                      label="* Social Security Number"
                    />
                    <CustomFormField
                      name={"password"}
                      type="password"
                      label="* Password"
                      placeholder=""
                    />
                  </div>
                  <PasswordStrength password={password ?? ""} />
                </CardContent>
                <CardFooter>
                  <div className="flex space-x-4 w-full">
                    <Button
                      size="lg"
                      type="submit"
                      disabled={isRecording}
                      className="w-full bg-green-400 hover:bg-green-500 text-black-100 cursor-pointer"
                    >
                      {isRecording ? (
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
            </div>
          </fieldset>
        </form>
      </Form>
      <div className="text-sm text-gray-600 text-center mt-4">
        Already have an account?{" "}
        <Link
          href="/"
          className="font-medium underline underline-offset-4 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          Signin here
        </Link>
      </div>
    </div>
  );
};

export default RegistrationPage;
