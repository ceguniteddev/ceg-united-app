"use client";
import { CustomFormField } from "@/components/CustomFormField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { User, registrationSchema } from "@/schema/registration";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, SaveIcon } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
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
import { US_STATES } from "@/constant/common";
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
      denefitsSignedUp: false,
      isBrokerInvite: false,
      isPremiumClient: false,
      activeStatus: "Active",
    };
    await recordRegistration({ token, values });
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 ">
      <div className="flex justify-center items-center mb-4 sm:mb-6">
        <Image
          src="/icon.png"
          alt={process.env.NEXT_PUBLIC_APP_NAME as string}
          width={80}
          height={80}
          className="sm:w-[100px] sm:h-[100px]"
        />
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <fieldset disabled={isRecording}>
            <div className="flex justify-center">
              <Card className="w-full max-w-4xl">
                <CardHeader>
                  <CardTitle className="text-center flex flex-col">
                    <span className="text-xl sm:text-2xl font-bold">
                      {"Register your account"}
                    </span>
                    <span className="text-sm sm:text-base">
                      {"It's quick and easy."}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CustomFormField
                      name={"ssn"}
                      type="ssn"
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
                      className="w-full bg-green-400 hover:bg-green-500 text-black-100 cursor-pointer text-sm sm:text-base"
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
      <div className="text-sm text-gray-600 text-center mt-4 mb-8">
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
