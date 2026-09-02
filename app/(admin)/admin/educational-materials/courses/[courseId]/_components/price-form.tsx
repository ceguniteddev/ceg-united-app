"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, DollarSign, CheckCircle2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormCheckbox } from "@/components/forms/form-checkbox";
import { FormNumberInput } from "@/components/forms/form-number-input";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { toast } from "sonner";
import { useCourseMutation } from "@/hooks/educational-materials/course";
import { Course } from "@/schema/educational-materials/course";

interface PriceFormProps {
  initialData: Course;
  courseId: string;
}

const formSchema = z.object({
  isFree: z.boolean(),
  price: z.coerce.number().min(0),
  discountPrice: z.coerce.number().min(0).optional(),
  dodoProductId: z.string().optional(),
  luminoCheckoutUrl: z.string().optional(),
  courseKey: z
    .enum([
      "credit_to_capital",
      "first_50k",
      "funding_150k",
      "funding_250k_plus",
    ])
    .optional(),
  capabilityGrant: z
    .enum(["dispute", "legacy_starter", "legacy_pro", "legacy_executive"])
    .optional(),
  grantEnabled: z.boolean(),
});

const courseKeyOptions = [
  { value: "credit_to_capital", label: "Credit to Capital" },
  { value: "first_50k", label: "First $50K" },
  { value: "funding_150k", label: "Up to $150K" },
  { value: "funding_250k_plus", label: "$250K+" },
];

const capabilityOptions = [
  { value: "dispute", label: "Credit dispute module" },
  { value: "legacy_starter", label: "Starter tool set" },
  { value: "legacy_pro", label: "Starter + Pro tool sets" },
  {
    value: "legacy_executive",
    label: "Starter + Pro + Executive tool sets",
  },
];

type FormValues = z.infer<typeof formSchema>;

export const PriceForm = ({ initialData, courseId }: PriceFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const { updateCourse } = useCourseMutation();
  const toggleEdit = () => setIsEditing((current) => !current);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      isFree: Boolean(initialData?.isFree),
      price: initialData?.price || 0,
      discountPrice: initialData?.discountPrice,
      dodoProductId: initialData?.dodoProductId || "",
      luminoCheckoutUrl: initialData?.luminoCheckoutUrl || "",
      courseKey: initialData?.courseKey,
      capabilityGrant: initialData?.capabilityGrant,
      grantEnabled: Boolean(initialData?.grantEnabled),
    },
  });

  const { isSubmitting, isValid } = form.formState;
  const isFreeWatched = form.watch("isFree");

  const onSubmit = async (values: FormValues) => {
    try {
      await updateCourse({
        id: courseId,
        data: {
          isFree: values.isFree,
          price: values.isFree ? 0 : values.price,
          discountPrice:
            values.isFree || !values.discountPrice
              ? undefined
              : values.discountPrice,
          dodoProductId: values.dodoProductId || undefined,
          luminoCheckoutUrl:
            values.isFree || !values.luminoCheckoutUrl
              ? undefined
              : values.luminoCheckoutUrl,
          courseKey: values.courseKey,
          capabilityGrant: values.capabilityGrant,
          grantEnabled: values.grantEnabled,
        },
      });
      toast.success("Pricing updated successfully");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Failed to update pricing");
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-blue-200 bg-white p-4">
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-blue-600" />
          <span>Course Pricing & Monetization</span>
        </div>
        <Button onClick={toggleEdit} variant="ghost" size="sm">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-1" />
              Edit Pricing
            </>
          )}
        </Button>
      </div>

      {!isEditing && (
        <div className="mt-3 space-y-2 text-sm">
          {initialData?.isFree ? (
            <div className="flex items-center gap-2 font-semibold text-blue-700">
              <CheckCircle2 className="w-4 h-4" /> Free Course (No checkout
              required)
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">
                  Standard Price:
                </span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  $
                  {(initialData?.price || 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  USD
                </span>
              </div>
              {initialData?.discountPrice != null && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">
                    Sale / Discount Price:
                  </span>
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                    $
                    {initialData.discountPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    USD
                  </span>
                </div>
              )}
              {initialData?.luminoCheckoutUrl && (
                <div className="flex flex-col gap-1 text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-gray-500 font-medium">
                    Lumino Checkout Link:
                  </span>
                  <a
                    href={initialData.luminoCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 break-all"
                  >
                    <span>{initialData.luminoCheckoutUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
              {initialData?.dodoProductId && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Dodo Product ID:</span>
                  <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">
                    {initialData.dodoProductId}
                  </code>
                </div>
              )}
              {initialData?.courseKey && (
                <div className="mt-2 rounded border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
                  <p className="font-semibold">Capability configuration</p>
                  <p>Course key: {initialData.courseKey}</p>
                  <p>
                    Grant: {initialData.capabilityGrant || "Not configured"} (
                    {initialData.grantEnabled ? "enabled" : "disabled"})
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <div className="rounded-md border border-blue-100 bg-blue-50/40 p-2">
              <FormCheckbox
                control={form.control}
                name="isFree"
                label={
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 block">
                      Make this course Free
                    </span>
                    <span className="text-xs text-gray-500 block">
                      Students will be able to enroll immediately without Lumino
                      checkout.
                    </span>
                  </div>
                }
              />
            </div>

            {!isFreeWatched && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormNumberInput
                    control={form.control}
                    name="price"
                    label="Course Price ($ USD)"
                    prefix="$"
                    decimalScale={2}
                    fixedDecimalScale={true}
                    placeholder="99.00"
                    disabled={isSubmitting}
                    thousandSeparator=","
                  />

                  <FormNumberInput
                    control={form.control}
                    name="discountPrice"
                    label="Discounted Price ($ USD - Optional)"
                    prefix="$"
                    decimalScale={2}
                    fixedDecimalScale={true}
                    placeholder="49.99"
                    disabled={isSubmitting}
                    thousandSeparator=","
                  />
                </div>

                <div className="space-y-1">
                  <FormInput
                    control={form.control}
                    name="luminoCheckoutUrl"
                    label="Lumino Checkout Link (URL)"
                    placeholder="https://lumino.io/checkout/..."
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500">
                    Payment checkout link from Lumino (https://lumino.io) used
                    when clients purchase this course.
                  </p>
                </div>
              </>
            )}

            <div className="space-y-4 rounded-md border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-sm font-semibold text-blue-950">
                Paid course capability grant
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormSelect
                  control={form.control}
                  name="courseKey"
                  label="Stable Course Key"
                  options={courseKeyOptions}
                  placeholder="Select course identity"
                />
                <FormSelect
                  control={form.control}
                  name="capabilityGrant"
                  label="Tool Permission Grant"
                  options={capabilityOptions}
                  placeholder="Select permission set"
                />
              </div>
              <FormCheckbox
                control={form.control}
                name="grantEnabled"
                label="Enable tool grants after verified paid enrollment"
              />
              <p className="text-xs text-blue-800">
                Course assignment alone never grants financial tools. Enable
                only after the payment integration has been verified.
              </p>
            </div>

            <div className="flex items-center gap-x-2">
              <Button
                disabled={!isValid || isSubmitting}
                type="submit"
                size="sm"
              >
                Save Pricing
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
