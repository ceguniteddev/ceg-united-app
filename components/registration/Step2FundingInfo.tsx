"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FundingApplicationFields } from "@/components/registration/FundingApplicationFields";
import { useBusinessQuery } from "@/hooks/business";
import { FormControl, FormField, FormItem } from "../ui/form";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { useFormContext } from "react-hook-form";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, FileText, X } from "lucide-react";
interface Step2FundingInfoProps {
  userId: string;
}

export function Step2FundingInfo({ userId }: Step2FundingInfoProps) {
  const { control, setValue } = useFormContext();

  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

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
            name="consentConfirm"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-4 space-y-0 rounded-lg border border-slate-200/80 p-4 bg-slate-50 shadow-sm">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!field.value}
                    className="mt-1 h-5 w-5 border-blue-500 rounded-md focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 hover:cursor-pointer hover:border-blue-900"
                  />
                </FormControl>

                <div className="grid gap-2">
                  <Label
                    htmlFor="terms-2"
                    className="cursor-pointer"
                    onClick={() => setIsConsentModalOpen(true)}
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
      <AlertDialog
        open={isConsentModalOpen}
        onOpenChange={setIsConsentModalOpen}
      >
        <AlertDialogContent className="max-w-lg bg-white rounded-lg shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <FileText className="h-6 w-6 text-blue-600" />
              Authorization and Disclosure Agreement
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="max-h-[50vh] overflow-y-auto pr-4 text-slate-600 text-base py-2 space-y-4">
                <p>
                  I confirm that I have read and agree to the Authorization and
                  Disclosure Agreement. I authorize CEG UNITED LLC to contact me
                  via phone call and/or text message, including through
                  automated systems, for service-related, onboarding, and
                  informational purposes. Message and data rates may apply.
                  Consent to receive calls or texts is not a condition of
                  purchase.
                </p>
                <p>
                  I certify that all information I provide is true, accurate,
                  and complete to the best of my knowledge. I understand that
                  CEG UNITED LLC is not responsible for inaccuracies, omissions,
                  or false information submitted by me and that such information
                  may affect eligibility, results, or outcomes.
                </p>
                <p>
                  I understand and acknowledge that CEG UNITED LLC is not a
                  credit repair organization and not a lender. We do not provide
                  credit repair services as defined under applicable law, and we
                  do not issue loans or extend credit.
                </p>
                <p>
                  I further authorize CEG UNITED LLC to obtain and use my credit
                  and related information solely for pre-qualification purposes,
                  which may include soft credit inquiries that do not impact my
                  credit score. This authorization is provided in compliance
                  with the Fair Credit Reporting Act (FCRA) and applicable
                  credit bureau requirements.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <AlertDialogCancel
              onClick={() => setIsConsentModalOpen(false)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <X className="w-4 h-4" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setValue("consentConfirm", true, { shouldValidate: true });
                setIsConsentModalOpen(false);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Check className="w-4 h-4" />
              Confirm & Agree
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
