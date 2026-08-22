"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, DollarSign, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormCheckbox } from "@/components/forms/form-checkbox";
import { FormNumberInput } from "@/components/forms/form-number-input";
import { FormInput } from "@/components/forms/form-input";
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
});

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
    <div className="mt-6 border bg-slate-100 dark:bg-slate-900 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600" />
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
            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
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
                  <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded text-xs">
                    $
                    {initialData.discountPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    USD
                  </span>
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
            <div className="rounded-md border p-2 bg-white dark:bg-slate-950">
              <FormCheckbox
                control={form.control}
                name="isFree"
                label={
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 block">
                      Make this course Free
                    </span>
                    <span className="text-xs text-gray-500 block">
                      Students will be able to enroll immediately without Dodo
                      Payments checkout.
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
              </>
            )}

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
