"use client";
import { CustomFormField } from "@/components/CustomFormField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Registration, registrationSchema } from "@/schema/registration";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, SaveIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { genderTypes } from "@/schema";

const RegistrationPage = () => {
  const form = useForm<Registration>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (values: Registration) => {
    console.log(values);
  };

  const isSaving = false;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <fieldset disabled={isSaving}>
          <div className="flex justify-center">
            <Card className="w-[600px]">
              <CardHeader>
                <CardTitle className="text-center flex flex-col">
                  <span className="text-2xl font-bold">{"Register your account"}</span>
                  <span>{"It's quick and easy."}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <CustomFormField name={"firstName"} placeholder={"First Name"} />
                  <CustomFormField name={"lastName"} placeholder={"Last Name"} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <CustomFormField
                    name={"birthdate"}
                    type="date-picker"
                    placeholder="Birthdate"
                    dateAfterHidden={new Date()}
                  />
                  <CustomFormField
                    name={"gender"}
                    type="select"
                    placeholder="Gender"
                    options={genderTypes()}
                  />
                </div>
                <div className="grid">
                  <CustomFormField name={"email"} type="email" placeholder="Email Address" />
                </div>
                <CustomFormField name={"password"} type="password" placeholder="New Password" />
              </CardContent>
              <CardFooter>
                <div className="flex space-x-4 w-full">
                  <Button
                    size="lg"
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-green-400 hover:bg-green-500 text-black-100"
                  >
                    {isSaving ? (
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
  );
};

export default RegistrationPage;
