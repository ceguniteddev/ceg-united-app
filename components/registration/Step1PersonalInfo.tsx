"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomFormField } from "@/components/CustomFormField";
import { PasswordStrength } from "@/components/PasswordStrength";
import { genderTypes } from "@/schema";
import { useFormContext, useWatch } from "react-hook-form";

export function Step1PersonalInfo() {
  const { control, register } = useFormContext();
  const password = useWatch({
    control,
    name: "password",
    defaultValue: "",
  });

  return (
    <Card className="bg-slate-100 border-slate-200">
      <CardHeader>
        <CardTitle>Step 1: Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="hidden"
          {...register("role")}
          defaultValue="Client"
          value={"Client"}
        />
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

        {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomFormField name={"addressStreet"} label={"Street Address"} />
          <CustomFormField
            name={"houseNumber"}
            label={"Apartment/Suite/Unit/House Number"}
          />
        </div> */}

        {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CustomFormField name={"addressCity"} label={"City"} />
          <CustomFormField
            name={"addressState"}
            label={"State"}
            type="select"
            placeholder="Select a state"
            options={US_STATES}
          />
          <CustomFormField name={"addressPostal"} label={"Zip Code"} />
        </div> */}

        {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div> */}

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
    </Card>
  );
}
