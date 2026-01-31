"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FundingApplicationFields } from "@/components/registration/FundingApplicationFields";
import { useBusinessQuery } from "@/hooks/business";
import { FormControl, FormField, FormItem } from "../ui/form";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { useFormContext } from "react-hook-form";

interface Step2FundingInfoProps {
  userId: string;
}

export function Step2FundingInfo({ userId }: Step2FundingInfoProps) {
  const { control } = useFormContext();

  const {
    businessData,
    isLoading: isBusinessLoading,
    refetch: refetchBusinesses,
  } = useBusinessQuery(userId, false);

  return (
    <div>
      <Card>
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
          <CardTitle className="text-lg sm:text-xl md:text-2xl">
            Step 2: Funding Application
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
          <FundingApplicationFields
            userId={userId}
            businessData={businessData}
            isBusinessLoading={isBusinessLoading}
            refetchBusinesses={refetchBusinesses}
            isViewing={false}
          />

          <FormField
            control={control}
            name="consentConfirmPrivacy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-4 space-y-0 rounded-lg border border-slate-200/80 p-4 bg-slate-50 shadow-sm">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    // disabled={!field.value}
                    className="mt-1 h-5 w-5 border-blue-500 rounded-md focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 hover:cursor-pointer hover:border-blue-900"
                  />
                </FormControl>

                <div className="grid gap-2">
                  <Label
                    htmlFor="terms-2"
                    className="cursor-pointer"
                    // onClick={() => setIsConsentPrivacyModalOpen(true)}
                    onClick={() =>
                      window.open("https://www.cegunited.com/privacy", "_blank")
                    }
                  >
                    Accept Privacy Policy
                  </Label>
                  <div className="text-muted-foreground text-sm">
                    By clicking this checkbox, you agree to the Privacy Policy.
                  </div>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="consentConfirmTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-4 space-y-0 rounded-lg border border-slate-200/80 p-4 bg-slate-50 shadow-sm">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    // disabled={!field.value}
                    className="mt-1 h-5 w-5 border-blue-500 rounded-md focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 hover:cursor-pointer hover:border-blue-900"
                  />
                </FormControl>

                <div className="grid gap-2">
                  <Label
                    htmlFor="terms-2"
                    className="cursor-pointer"
                    // onClick={() => setIsConsentModalOpen(true)}
                    onClick={() =>
                      window.open("https://www.cegunited.com/terms", "_blank")
                    }
                  >
                    Accept Authorization & Disclosure Agreement
                  </Label>
                  <div className="text-muted-foreground text-sm">
                    By clicking this checkbox, you agree to the Authorization &
                    Disclosure Agreement.
                  </div>
                </div>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
