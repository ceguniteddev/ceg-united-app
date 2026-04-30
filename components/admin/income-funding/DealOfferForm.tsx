import { useEffect } from "react";
import { Plus, Save } from "lucide-react";
import type { DealOffer } from "@/lib/income-funding-types";
import { factorRateOf } from "@/lib/underwriting";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { CustomFormField } from "@/components/CustomFormField";

interface DealOfferFormProps {
  onSave: (offer: DealOffer) => void;
  initialData?: DealOffer | null;
  onCancelEdit?: () => void;
}

const DEAL_TYPES = [
  "MCA",
  "LOC",
  "Revenue-Based",
  "Term Loan",
  "Equipment Finance",
] as const;
const TERM_UNITS = ["days", "weeks", "months"] as const;
const FREQS = ["daily", "weekly", "biweekly", "monthly"] as const;
const LIKELIHOOD = ["most-likely", "likely", "possible"] as const;

const labelize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ");

const dealOfferSchema = z.object({
  dealType: z.enum(DEAL_TYPES),
  lenderName: z.string().min(1, "Lender name is required"),
  fundingAmount: z.number().min(1, "Amount must be > 0"),
  paybackAmount: z.number().min(1, "Amount must be > 0"),
  termLength: z.number().min(1, "Term length must be > 0"),
  termUnit: z.enum(TERM_UNITS),
  paymentFrequency: z.enum(FREQS),
  estimatedPayment: z.number().min(0),
  approvalLikelihood: z.enum(LIKELIHOOD),
  notes: z.string().optional().default(""),
});

type DealOfferFormValues = z.infer<typeof dealOfferSchema>;

export function DealOfferForm({
  onSave,
  initialData,
  onCancelEdit,
}: DealOfferFormProps) {
  const form = useForm<DealOfferFormValues>({
    resolver: zodResolver(dealOfferSchema) as any,
    defaultValues:
      initialData ||
      ({
        dealType: "MCA",
        lenderName: "",
        fundingAmount: undefined,
        paybackAmount: undefined,
        termLength: undefined,
        termUnit: "months",
        paymentFrequency: "daily",
        estimatedPayment: 0,
        approvalLikelihood: "likely",
        notes: "",
      } as any),
  });

  useEffect(() => {
    form.reset(
      initialData || {
        dealType: "MCA",
        lenderName: "",
        fundingAmount: 0 as any,
        paybackAmount: 0 as any,
        termLength: 0 as any,
        termUnit: "months",
        paymentFrequency: "daily",
        estimatedPayment: 0,
        approvalLikelihood: "likely",
        notes: "",
      },
    );
  }, [initialData, form]);

  const { control, setValue } = form;

  const fundingAmount = useWatch({ control, name: "fundingAmount" }) || 0;
  const paybackAmount = useWatch({ control, name: "paybackAmount" }) || 0;
  const termLength = useWatch({ control, name: "termLength" }) || 0;
  const termUnit = useWatch({ control, name: "termUnit" });
  const paymentFrequency = useWatch({ control, name: "paymentFrequency" });

  const factorRate = factorRateOf(fundingAmount, paybackAmount);

  // auto-calc estimated payment when relevant fields change & user hasn't manually edited
  useEffect(() => {
    if (!fundingAmount || !paybackAmount || !termLength) return;
    let totalPayments = termLength;
    if (termUnit === "months") {
      if (paymentFrequency === "daily") totalPayments = termLength * 22;
      if (paymentFrequency === "weekly") totalPayments = termLength * 4;
      if (paymentFrequency === "biweekly") totalPayments = termLength * 2;
    }
    if (termUnit === "weeks") {
      if (paymentFrequency === "daily") totalPayments = termLength * 5;
      if (paymentFrequency === "biweekly")
        totalPayments = Math.ceil(termLength / 2);
      if (paymentFrequency === "monthly")
        totalPayments = Math.max(1, Math.floor(termLength / 4));
    }
    if (totalPayments > 0) {
      setValue("estimatedPayment", Math.round(paybackAmount / totalPayments), {
        shouldValidate: true,
      });
    }
  }, [
    fundingAmount,
    paybackAmount,
    termLength,
    termUnit,
    paymentFrequency,
    setValue,
  ]);

  const onSubmit = (values: DealOfferFormValues) => {
    onSave({
      id: initialData?.id || `offer_${Date.now()}`,
      dealType: values.dealType,
      lenderName: values.lenderName,
      fundingAmount: values.fundingAmount,
      paybackAmount: values.paybackAmount,
      factorRate,
      termLength: values.termLength,
      termUnit: values.termUnit,
      paymentFrequency: values.paymentFrequency,
      estimatedPayment: values.estimatedPayment,
      notes: values.notes,
      approvalLikelihood: values.approvalLikelihood,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    });

    setTimeout(() => {
      form.reset({
        dealType: "MCA",
        lenderName: "",
        fundingAmount: 0 as any, // 0 to avoid undefined warning, but invalidates form until filled
        paybackAmount: 0 as any,
        termLength: 0 as any,
        termUnit: "months",
        paymentFrequency: "daily",
        estimatedPayment: 0,
        approvalLikelihood: "likely",
        notes: "",
      });
      if (onCancelEdit) onCancelEdit();
    }, 0);
  };

  const isValid = form.formState.isValid;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
          <Plus className="w-[18px] h-[18px]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            {initialData ? "Edit deal offer" : "Add new deal offer"}
          </h3>
          <p className="text-xs text-gray-500">
            {initialData
              ? "Modify existing offer details."
              : "Create an offer to send to the client."}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit as any)}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {/* Deal type */}
          <CustomFormField
            name="dealType"
            label="Deal type"
            type="select"
            labelClassName="text-[11px] font-semibold uppercase tracking-wide text-gray-500"
            options={DEAL_TYPES.map((d) => ({ value: d, label: d }))}
          />

          {/* Lender */}
          <CustomFormField
            name="lenderName"
            label="Lender name"
            placeholder="e.g. Rapid Capital"
            labelClassName="text-[11px] font-semibold uppercase tracking-wide text-gray-500"
          />

          {/* Funding */}
          <CustomFormField
            name="fundingAmount"
            label="Funding amount ($)"
            type="number"
            allowNegative={false}
            labelClassName="text-[11px] font-semibold uppercase tracking-wide text-gray-500"
          />

          {/* Payback */}
          <CustomFormField
            name="paybackAmount"
            label="Payback amount ($)"
            type="number"
            allowNegative={false}
            labelClassName="text-[11px] font-semibold uppercase tracking-wide text-gray-500"
          />

          {/* Factor (auto) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Factor rate (auto)
            </span>
            <input
              value={factorRate ? factorRate.toFixed(2) : ""}
              readOnly
              placeholder="—"
              className="flex h-9 w-full min-w-0 rounded-md border border-input bg-gray-50 px-3 py-1 text-sm shadow-xs font-mono text-gray-700 pointer-events-none"
            />
          </div>

          {/* Term + unit */}
          <div className="grid grid-cols-2 gap-2">
            <CustomFormField
              name="termLength"
              label="Term length"
              type="number"
              allowNegative={false}
              labelClassName="text-[11px] font-semibold uppercase tracking-wide text-gray-500"
            />
            <CustomFormField
              name="termUnit"
              label="Unit"
              type="select"
              labelClassName="text-[11px] font-semibold uppercase tracking-wide text-gray-500"
              options={TERM_UNITS.map((u) => ({
                value: u,
                label: labelize(u),
              }))}
            />
          </div>

          {/* Frequency */}
          <CustomFormField
            name="paymentFrequency"
            label="Payment frequency"
            type="select"
            labelClassName="text-[11px] font-semibold uppercase tracking-wide text-gray-500"
            options={FREQS.map((f) => ({ value: f, label: labelize(f) }))}
          />

          {/* Estimated payment */}
          <CustomFormField
            name="estimatedPayment"
            label="Estimated payment ($)"
            type="number"
            allowNegative={false}
            labelClassName="text-[11px] font-semibold uppercase tracking-wide text-gray-500"
          />

          {/* Likelihood */}
          <div className="md:col-span-2">
            <FormField
              control={control as any}
              name="approvalLikelihood"
              render={({ field }) => (
                <FormItem>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Approval likelihood
                  </span>
                  <FormControl>
                    <div className="mt-1 flex gap-2">
                      {LIKELIHOOD.map((l) => (
                        <button
                          type="button"
                          key={l}
                          onClick={() => field.onChange(l)}
                          className={`flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                            field.value === l
                              ? "bg-brand-50 border-brand-300 text-brand-700"
                              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {labelize(l)}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <CustomFormField
              name="notes"
              label="Notes / stips / conditions"
              type="textarea"
              placeholder="e.g. Requires 4 months bank statements verified."
              labelClassName="text-[11px] font-semibold uppercase tracking-wide text-gray-500"
            />
          </div>

          <div className="md:col-span-2 mt-2 flex justify-end gap-2">
            {initialData && onCancelEdit && (
              <button
                type="button"
                onClick={() => {
                  form.reset({
                    dealType: "MCA",
                    lenderName: "",
                    fundingAmount: 0 as any,
                    paybackAmount: 0 as any,
                    termLength: 0 as any,
                    termUnit: "months",
                    paymentFrequency: "daily",
                    estimatedPayment: 0,
                    approvalLikelihood: "likely",
                    notes: "",
                  });
                  onCancelEdit();
                }}
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!isValid}
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {initialData ? "Update offer" : "Save offer"}
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}
