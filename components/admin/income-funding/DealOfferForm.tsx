import { useEffect, useState } from "react";
import { Plus, Save, UploadIcon, X, FileText } from "lucide-react";
import type { DealOffer, DealOfferDocument } from "@/lib/income-funding-types";
import { factorRateOf, formatUSD } from "@/lib/underwriting";
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
import { useQuery } from "@tanstack/react-query";
import { BankManagement } from "@/schema/bank-management";
import { useBankManagementQuery } from "@/hooks/admin/bank-management";
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
import type { ApprovalLikelihood } from "@/lib/income-funding-types";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface DealOfferFormProps {
  onSave: (offer: DealOffer) => void;
  initialData?: DealOffer | null;
  onCancelEdit?: () => void;
  userId?: string;
  referenceNumber?: string;
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
const LIKELIHOOD: ApprovalLikelihood[] = ["most-likely", "likely", "possible"];

const likelihoodMap: Record<
  ApprovalLikelihood,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  "most-likely": {
    label: "Most likely",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
  },
  likely: {
    label: "Likely",
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-300",
  },
  possible: {
    label: "Possible",
    dot: "bg-blue-500",
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-300",
  },
};

const labelize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ");

const UUID_PREFIX_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[_-]/i;

const cleanFileName = (fileName: string) => {
  if (fileName.startsWith("OFFER_DOCUMENT_")) {
    fileName = fileName.replace(/^OFFER_DOCUMENT_\d+_/, "");
  }
  fileName = fileName.replace(UUID_PREFIX_RE, "");
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot !== -1) {
    fileName =
      fileName.substring(0, lastDot).replace(/[-_]/g, " ") +
      fileName.substring(lastDot);
  } else {
    fileName = fileName.replace(/[-_]/g, " ");
  }
  return fileName;
};

const dealOfferSchema = z.object({
  dealType: z.enum(DEAL_TYPES),
  lenderName: z.string().min(1, "Lender name is required"),
  brokerageId: z.string().min(1, "Brokerage is required"),
  fundingAmount: z.number().min(1, "Amount must be > 0"),
  paybackAmount: z.number().min(1, "Amount must be > 0"),
  termLength: z.number().min(1, "Term length must be > 0"),
  termUnit: z.enum(TERM_UNITS),
  paymentFrequency: z.enum(FREQS),
  estimatedPayment: z.number().min(0),
  approvalLikelihood: z.enum(LIKELIHOOD),
  notes: z.string().optional().default(""),
  percentageFee: z.number().min(0).max(100).default(15),
});

type DealOfferFormValues = z.infer<typeof dealOfferSchema>;

export function DealOfferForm({
  onSave,
  initialData,
  onCancelEdit,
  userId,
  referenceNumber,
}: DealOfferFormProps) {
  const [pendingValues, setPendingValues] =
    useState<DealOfferFormValues | null>(null);

  const [previewDoc, setPreviewDoc] = useState<DealOfferDocument | null>(null);

  const LOCAL_STORAGE_KEY = `deal_offer_docs_${userId || "no_user"}_${initialData?.id || "new"}`;

  const [uploadedDocs, setUploadedDocs] = useState<DealOfferDocument[]>(() => {
    if (initialData?.documents && initialData.documents.length > 0) {
      return initialData.documents;
    }
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved docs", e);
        }
      }
    }
    return [];
  });

  const [isUploading, setIsUploading] = useState(false);

  const { banks: allBanks = [] } = useBankManagementQuery();
  const brokerages = allBanks.filter((b) => b.isBrokerage);

  const form = useForm<DealOfferFormValues>({
    resolver: zodResolver(dealOfferSchema) as any,
    defaultValues: initialData
      ? {
          ...initialData,
          percentageFee: initialData.percentageFee ?? 15,
        }
      : ({
          dealType: "MCA",
          lenderName: "",
          brokerageId: undefined,
          fundingAmount: undefined,
          paybackAmount: undefined,
          termLength: undefined,
          termUnit: "months",
          paymentFrequency: "daily",
          estimatedPayment: 0,
          approvalLikelihood: "likely",
          notes: "",
          percentageFee: 15,
        } as any),
  });

  useEffect(() => {
    form.reset(
      initialData
        ? {
            ...initialData,
            percentageFee: initialData.percentageFee ?? 15,
          }
        : {
            dealType: "MCA",
            lenderName: "",
            brokerageId: undefined,
            fundingAmount: 0 as any,
            paybackAmount: 0 as any,
            termLength: 0 as any,
            termUnit: "months",
            paymentFrequency: "daily",
            estimatedPayment: 0,
            approvalLikelihood: "likely",
            notes: "",
            percentageFee: 15,
          },
    );

    if (initialData?.documents && initialData.documents.length > 0) {
      setUploadedDocs(initialData.documents);
    } else {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          setUploadedDocs(JSON.parse(saved));
        } catch (e) {
          setUploadedDocs([]);
        }
      } else {
        setUploadedDocs([]);
      }
    }
  }, [initialData, form, LOCAL_STORAGE_KEY]);

  const { control, setValue } = form;

  const handleDrop = async (droppedFiles: File[]) => {
    if (!userId || !referenceNumber) return;
    if (!droppedFiles || droppedFiles.length === 0) return;

    const validFiles = droppedFiles.filter((f) => f.type === "application/pdf");

    if (validFiles.length === 0) {
      alert("Only PDF files are allowed!");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("referenceNumber", referenceNumber);
    formData.append("documentType", "OFFER_DOCUMENT");

    validFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch(`/api/user/${userId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      const newDocs = result.data.map((d: any) => ({
        name: d.originalFilename || "Document",
        url: d.signedUrl || d.url || d.gcsPath,
      }));

      setUploadedDocs((prev) => {
        const next = [...prev, ...newDocs];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeDoc = async (idx: number) => {
    const docToRemove = uploadedDocs[idx];
    setUploadedDocs((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
      return next;
    });

    // Cleanup from storage if it's an uploaded file (has gcsPath)
    if (docToRemove.url && docToRemove.url.startsWith("documents/")) {
      try {
        await fetch(`/api/documents/delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: docToRemove.url }),
        });
      } catch (e) {
        console.error("Failed to delete document from storage", e);
      }
    }
  };

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
    setPendingValues(values);
  };

  const handleConfirmSave = () => {
    if (!pendingValues) return;
    const values = pendingValues;

    const actualBrokerageId =
      values.brokerageId === "none" ? undefined : values.brokerageId;
    const brokerageName =
      brokerages.find((b) => b.id === actualBrokerageId)?.bankName || "";

    onSave({
      id: initialData?.id || `offer_${Date.now()}`,
      dealType: values.dealType,
      lenderName: values.lenderName,
      brokerageId: actualBrokerageId,
      brokerageName,
      fundingAmount: values.fundingAmount,
      paybackAmount: values.paybackAmount,
      factorRate,
      termLength: values.termLength,
      termUnit: values.termUnit,
      paymentFrequency: values.paymentFrequency,
      estimatedPayment: values.estimatedPayment,
      notes: values.notes,
      approvalLikelihood: values.approvalLikelihood,
      percentageFee: values.percentageFee,
      documents: uploadedDocs,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    });

    setPendingValues(null);
    setUploadedDocs([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setTimeout(() => {
      form.reset({
        dealType: "MCA",
        lenderName: "",
        brokerageId: "none",
        fundingAmount: 0 as any, // 0 to avoid undefined warning, but invalidates form until filled
        paybackAmount: 0 as any,
        termLength: 0 as any,
        termUnit: "months",
        paymentFrequency: "daily",
        estimatedPayment: 0,
        approvalLikelihood: "likely",
        notes: "",
        percentageFee: 15,
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

          {/* Brokerage */}
          <CustomFormField
            name="brokerageId"
            label="Brokerage"
            type="select"
            labelClassName="text-[11px] font-semibold uppercase tracking-wide text-gray-500"
            options={[
              { value: "none", label: "Select Brokerage" },
              ...brokerages.map((b) => ({
                value: b.id || "none",
                label: b.bankName,
              })),
            ]}
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

          {/* Percentage Fee */}
          <CustomFormField
            name="percentageFee"
            label="Percentage Fee (%)"
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
                      {LIKELIHOOD.map((l) => {
                        const style = likelihoodMap[l];
                        return (
                          <button
                            type="button"
                            key={l}
                            onClick={() => field.onChange(l)}
                            className={`flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                              field.value === l
                                ? `${style.bg} ${style.border} ${style.text}`
                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {style.label}
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Documents */}
          <div className="md:col-span-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5 block">
              Offer Documents (PDFs only)
            </span>
            <Dropzone
              maxFiles={10}
              className="cursor-pointer"
              onDrop={handleDrop}
              disabled={isUploading || !userId || !referenceNumber}
              accept={{
                "application/pdf": [".pdf"],
              }}
            >
              <DropzoneEmptyState>
                <div className="flex flex-col items-center gap-1.5">
                  <UploadIcon className="h-6 w-6 text-brand-400" />
                  <p className="text-xs font-medium text-gray-500">
                    {isUploading
                      ? "Uploading..."
                      : !userId || !referenceNumber
                        ? "Save client application first before uploading docs"
                        : "Click or drag to upload PDFs"}
                  </p>
                </div>
              </DropzoneEmptyState>
              <DropzoneContent />
            </Dropzone>

            {/* List uploaded docs */}
            {uploadedDocs.length > 0 && (
              <div className="mt-3 grid gap-2">
                {uploadedDocs.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg p-2 px-3 text-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="text-gray-700 hover:text-brand-600 hover:underline truncate"
                      >
                        {cleanFileName(doc.name.split("/").pop() || "")}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDoc(idx)}
                      className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                onClick={async () => {
                  // Clean up any newly uploaded documents
                  const initialDocUrls = new Set(
                    (initialData?.documents || []).map((d) => d.url),
                  );
                  const newDocs = uploadedDocs.filter(
                    (d) => !initialDocUrls.has(d.url),
                  );
                  for (const doc of newDocs) {
                    if (doc.url.startsWith("documents/")) {
                      try {
                        await fetch(`/api/documents/delete`, {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ path: doc.url }),
                        });
                      } catch (e) {
                        console.error("Cleanup failed", e);
                      }
                    }
                  }

                  localStorage.removeItem(LOCAL_STORAGE_KEY);

                  form.reset({
                    dealType: "MCA",
                    lenderName: "",
                    brokerageId: "none",
                    fundingAmount: 0 as any,
                    paybackAmount: 0 as any,
                    termLength: 0 as any,
                    termUnit: "months",
                    paymentFrequency: "daily",
                    estimatedPayment: 0,
                    approvalLikelihood: "likely",
                    notes: "",
                    percentageFee: 15,
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

      <Sheet
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      >
        <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
          <SheetHeader className="p-4 pb-2 border-b flex-shrink-0">
            <SheetTitle className="text-sm break-words text-left leading-snug">
              {previewDoc &&
                cleanFileName(previewDoc.name.split("/").pop() || "")}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden p-2">
            {previewDoc && (
              <iframe
                src={`${previewDoc.url.startsWith("http") ? previewDoc.url : `/api/documents/preview?path=${encodeURIComponent(previewDoc.url)}`}#toolbar=1&view=FitH`}
                title={previewDoc.name}
                className="w-full h-full"
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={pendingValues !== null}
        onOpenChange={(open) => {
          if (!open) setPendingValues(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Offer Details</AlertDialogTitle>
            <AlertDialogDescription>
              Please review the offer details before saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingValues && (
            <div className="my-4 grid grid-cols-2 gap-3 text-sm text-gray-700 p-4 bg-gray-50 rounded-xl border border-gray-100 text-left">
              <div>
                <span className="font-semibold block text-xs text-gray-500 uppercase tracking-wide">
                  Deal Type
                </span>
                {pendingValues.dealType}
              </div>
              <div>
                <span className="font-semibold block text-xs text-gray-500 uppercase tracking-wide">
                  Brokerage
                </span>
                {brokerages.find(
                  (b) =>
                    b.id ===
                    (pendingValues.brokerageId === "none"
                      ? undefined
                      : pendingValues.brokerageId),
                )?.bankName || "None"}
              </div>
              <div>
                <span className="font-semibold block text-xs text-gray-500 uppercase tracking-wide">
                  Lender Name
                </span>
                {pendingValues.lenderName}
              </div>
              <div>
                <span className="font-semibold block text-xs text-gray-500 uppercase tracking-wide">
                  Funding Amount
                </span>
                {formatUSD(pendingValues.fundingAmount)}
              </div>
              <div>
                <span className="font-semibold block text-xs text-gray-500 uppercase tracking-wide">
                  Payback Amount
                </span>
                {formatUSD(pendingValues.paybackAmount)}
              </div>
              <div>
                <span className="font-semibold block text-xs text-gray-500 uppercase tracking-wide">
                  Term Length
                </span>
                {pendingValues.termLength} {pendingValues.termUnit}
              </div>
              <div>
                <span className="font-semibold block text-xs text-gray-500 uppercase tracking-wide">
                  Percentage Fee
                </span>
                {pendingValues.percentageFee}%
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingValues(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              Confirm & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
