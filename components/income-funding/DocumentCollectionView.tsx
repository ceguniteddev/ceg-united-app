import { useState } from "react";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { DocumentUploadCard } from "./DocumentUploadCard";
import type {
  DocumentRecord,
  IncomeFundingDeal,
} from "@/types/income-funding-types";
import { useAuth } from "@/provider/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { GET_USER_DOCUMENTS } from "@/constant/react-query-keys";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ImageZoom } from "@/components/ui/shadcn-io/image-zoom";
import Image from "next/image";
import { requestMapBankProductsN8nNewRegistration } from "@/service/crs";
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

interface DocumentCollectionViewProps {
  deal: IncomeFundingDeal;
  realDeal?: any;
  onUpload: (
    key: DocumentRecord["key"],
    fileName: string,
    fileSize: string,
  ) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  selectedPathwayId?: string;
}

export function DocumentCollectionView({
  deal,
  realDeal,
  onUpload,
  onSubmit,
  isSubmitting = false,
  selectedPathwayId = "income_based",
}: DocumentCollectionViewProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>(
    {},
  );
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    title: string;
    contentType?: string;
  } | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const displayDocuments = deal.documents
    .filter((doc) => {
      if (
        selectedPathwayId === "personal_credit_card" ||
        selectedPathwayId === "personal_loan"
      ) {
        if (
          doc.key === "ein" ||
          doc.key === "articles" ||
          doc.key === "voidedCheck"
        ) {
          return false;
        }
      }
      return true;
    })
    .map((doc) => {
      let required = doc.required;

      if (selectedPathwayId === "income_based") {
        if (doc.key === "ein") required = true;
        if (doc.key === "voidedCheck") required = true;
        if (doc.key === "bankStatements") required = true;
        if (doc.key === "id") required = true;
        if (doc.key === "articles") required = false;
      } else if (
        selectedPathwayId === "business_credit_card_stacking" ||
        selectedPathwayId === "business_lines_of_credit"
      ) {
        if (doc.key === "ein") required = true;
        if (doc.key === "bankStatements") required = true;
        if (doc.key === "id") required = true;
        if (doc.key === "articles") required = false;
        if (doc.key === "voidedCheck") required = false;
      } else if (
        selectedPathwayId === "personal_loan" ||
        selectedPathwayId === "personal_credit_card"
      ) {
        if (doc.key === "id") required = true;
        if (doc.key === "bankStatements") required = true;
      }

      if (
        selectedPathwayId === "personal_credit_card" ||
        selectedPathwayId === "personal_loan"
      ) {
        if (doc.key === "bankStatements") {
          return {
            ...doc,
            required,
            title: "Personal Bank Statements",
            description: "Recent personal bank statements.",
            documentTypeId: "PERSONAL_BANK_STATEMENTS",
          };
        }
      }

      if (doc.key === "ein" && realDeal?.employerIdentificationNumber) {
        return {
          ...doc,
          required: false,
          providedValue: realDeal.employerIdentificationNumber,
          description: "Your EIN was successfully retrieved from your profile.",
        };
      }

      return {
        ...doc,
        required,
      };
    });

  const requiredDocs = displayDocuments.filter((d) => d.required);
  const allRequiredDone = requiredDocs.every(
    (d) => d.status === "uploaded" || d.status === "synced",
  );

  // Count EIN as "done" if provided, even if not uploaded
  const totalDone = displayDocuments.filter(
    (d) =>
      d.status === "uploaded" ||
      d.status === "synced" ||
      (d.key === "ein" && realDeal?.employerIdentificationNumber),
  ).length;

  const handleUpload = async (
    key: DocumentRecord["key"],
    file: File,
    fileName: string,
    fileSize: string,
  ) => {
    if (!user) return;

    setUploadingState((prev) => ({ ...prev, [key]: true }));

    // Map key to DocumentType ID
    let documentTypeId = "OTHER";
    if (key === "ein") documentTypeId = "EIN_LETTER";
    else if (key === "articles") documentTypeId = "ARTICLES_OF_ORGANIZATION";
    else if (key === "id") documentTypeId = "DRIVERS_LICENSE";
    else if (key === "bankStatements") {
      documentTypeId =
        selectedPathwayId === "personal_credit_card" ||
        selectedPathwayId === "personal_loan"
          ? "PERSONAL_BANK_STATEMENTS"
          : "BANK_STATEMENTS";
    } else if (key === "voidedCheck") documentTypeId = "VOIDED_CHECK";

    const formData = new FormData();
    formData.append("userId", user.uid);
    if (documentTypeId !== "OTHER") {
      formData.append("documentType", documentTypeId);
    }
    formData.append("files", file);

    try {
      const response = await fetch(`/api/user/${user.uid}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Upload failed");
      }

      // Invalidate queries to refetch the document list in other parts of the app
      queryClient.invalidateQueries({
        queryKey: [GET_USER_DOCUMENTS, user.uid],
      });

      // Update local state to show it's uploaded
      onUpload(key, fileName, fileSize);
      toast.success("Document uploaded successfully");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploadingState((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleSubmit = async () => {
    if (
      selectedPathwayId !== "income_based" &&
      user?.uid &&
      realDeal?.referenceNumber
    ) {
      try {
        await requestMapBankProductsN8nNewRegistration({
          userId: user.uid,
          referenceNumber: realDeal.referenceNumber,
          selectedPathwayId,
        });
        toast.success("Application submitted successfully!");
      } catch (error) {
        console.error("Failed to map bank products:", error);
        toast.error(
          "There was an issue processing your submission, but your documents were saved.",
        );
      }
    } else {
      toast.success("Application submitted successfully!");
    }
    onSubmit();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 md:p-7 animate-fade-in-up">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Upload required documents
            </h1>
            <p className="mt-1 text-sm text-gray-500 max-w-xl">
              We need a few more files to send your deal to underwriting. Drag
              and drop or click to upload.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Bank-level encryption
          </div>
        </div>

        {/* Progress */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>
              {totalDone} of {displayDocuments.length} documents ready
            </span>
            <span className="font-semibold text-gray-700">
              {Math.round((totalDone / displayDocuments.length) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
              style={{
                width: `${(totalDone / displayDocuments.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayDocuments.map((doc, i) => (
          <div
            key={doc.key}
            className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}
          >
            <DocumentUploadCard
              doc={doc}
              onUpload={handleUpload}
              isUploading={uploadingState[doc.key]}
              onView={(url, title, contentType) =>
                setPreviewDoc({ url, title, contentType })
              }
            />
          </div>
        ))}
      </div>

      {/* Submit footer */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-gray-400 shrink-0" />
          <p className="text-xs text-gray-500 max-w-md">
            By submitting, you confirm the uploaded documents are accurate. Your
            file is sent to a CEG underwriter for review.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
          <button
            disabled={!allRequiredDone || isSubmitting}
            onClick={() => setIsAlertOpen(true)}
            className="w-full md:w-auto inline-flex justify-center items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            {isSubmitting ? "Submitting..." : "Submit for Underwriting"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Application?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your application for underwriting?
              Please confirm that all uploaded documents are accurate and
              complete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                setIsAlertOpen(false);
                handleSubmit();
              }}
              disabled={isSubmitting}
              className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-2"
            >
              Confirm Submission
              <ArrowRight className="w-4 h-4" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Sheet */}
      <Sheet
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      >
        <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0 z-50">
          <SheetHeader className="p-4 pb-2 border-b flex-shrink-0">
            <SheetTitle className="text-sm break-words text-left leading-snug">
              {previewDoc && previewDoc.title}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden p-2">
            {previewDoc?.contentType?.startsWith("image/") ? (
              <ImageZoom>
                <Image
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="w-full h-full object-contain"
                  width={800}
                  height={600}
                  unoptimized
                />
              </ImageZoom>
            ) : previewDoc?.contentType === "application/pdf" ? (
              <iframe
                src={`${previewDoc.url}#toolbar=1&view=FitH`}
                title={previewDoc.title}
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">
                  Preview unavailable for this file type
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
