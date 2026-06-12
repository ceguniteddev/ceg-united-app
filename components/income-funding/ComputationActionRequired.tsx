"use client";

import React, { useState } from "react";
import { Bot, FileText, Trash2, Eye, Loader2, Calculator } from "lucide-react";
import UploadFileV2 from "@/components/UploadFileV2";
import { DOCUMENT_TYPES } from "@/lib/document-types";
import {
  useUserDocumentsQuery,
  useUserDocumentMutation,
} from "@/hooks/document";
import { useAuth } from "@/provider/AuthContext";
import { ApplyFunding } from "@/schema/apply-funding";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ImageZoom } from "@/components/ui/shadcn-io/image-zoom";
import Image from "next/image";
import IconMenu from "@/components/icon-menu";

interface ComputationActionRequiredProps {
  realDeal?: ApplyFunding;
  isCalculating: boolean;
  onCalculate: () => void;
  userIdOverride?: string;
}

export function ComputationActionRequired({
  realDeal,
  isCalculating,
  onCalculate,
  userIdOverride,
}: ComputationActionRequiredProps) {
  const { user } = useAuth();
  const userId = userIdOverride || user?.uid || "";
  const { userDocuments, isLoading: isDocsLoading } = useUserDocumentsQuery({
    userId,
  });
  const { deleteDocument, isDeleting } = useUserDocumentMutation();

  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    title: string;
    contentType?: string;
  } | null>(null);

  // Determine required documents based on registration logic
  const fundingType = realDeal?.fundingType || "";
  const howDoYouGetPaid = realDeal?.howDoYouGetPaid || "";

  const isPersonal =
    fundingType === "Personal" || fundingType === "Personal And Business";
  const isBusiness =
    fundingType === "Business" || fundingType === "Personal And Business";

  const isW2 = isPersonal && howDoYouGetPaid === "W2";
  const isSelfEmployed = isPersonal && howDoYouGetPaid === "Self-employed";

  const requiresPaystubs = isW2;
  const requiresPersonalBankStatements = isSelfEmployed;
  const requiresBusinessBankStatements = isBusiness;

  const getDocType = (id: string) => DOCUMENT_TYPES.find((dt) => dt.id === id);

  const bankStatementsType = getDocType("BANK_STATEMENTS");
  const personalBankStatementsType = getDocType("PERSONAL_BANK_STATEMENTS");
  const paystubsType = getDocType("PAYSTUBS");

  const handleDelete = async (docPath: string) => {
    try {
      await deleteDocument({ path: docPath });
    } catch (e) {
      console.error(e);
    }
  };

  const renderUploadedFiles = (typeId: string) => {
    if (!userDocuments || userDocuments.length === 0) return null;

    const matchedDocs = userDocuments.filter((doc: any) => {
      const fileName = doc.name.split("/").pop() || "";
      return fileName.startsWith(typeId + "_");
    });

    if (matchedDocs.length === 0) return null;

    return (
      <div className="space-y-2 mt-4 text-left">
        <h4 className="text-sm font-semibold text-gray-700">
          Uploaded Documents
        </h4>
        {matchedDocs.map((doc: any, index: number) => {
          const displayName = doc.name.split("/").pop() || "Document";
          const docUrl = doc.signedUrl || doc.downloadUrl;

          return (
            <div
              key={index}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border shadow-sm"
            >
              <div
                className="flex items-center gap-3 cursor-pointer overflow-hidden mb-2 sm:mb-0 w-full sm:w-auto hover:bg-gray-50 transition p-1 rounded"
                onClick={() =>
                  setPreviewDoc({
                    url: docUrl,
                    title: displayName,
                    contentType: doc.contentType,
                  })
                }
              >
                <div className="flex-shrink-0 w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="truncate pr-4 flex-1">
                  <p
                    className="text-sm font-medium text-gray-900 truncate"
                    title={displayName}
                  >
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(doc.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                {docUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewDoc({
                        url: docUrl,
                        title: displayName,
                        contentType: doc.contentType,
                      })
                    }
                    className="p-2 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleDelete(doc.path)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                  title="Delete"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-red-100 shadow-card p-6 md:p-10 text-center flex flex-col items-center justify-center animate-fade-in-up">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <Bot className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
        Action Required: Calculate Business Income
      </h2>
      <p className="text-sm text-gray-500 max-w-2xl mx-auto mb-8">
        We noticed that your business income computation is missing. Please
        ensure the required documents are uploaded below, then calculate your
        pre-approved business income to proceed with your application.
      </p>

      {/* Document Upload Sections */}
      <div className="w-full max-w-2xl text-left space-y-6 mb-10">
        {requiresPaystubs && paystubsType && (
          <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Personal Requirements
            </h3>
            <UploadFileV2
              userId={userId}
              documentType={paystubsType}
              titleOverride="Last 2 Recent Paystubs"
              descriptionOverride="Upload your paystubs to verify personal income. (PDF or Image only)"
            />
            {isDocsLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading
                documents...
              </div>
            ) : (
              renderUploadedFiles("PAYSTUBS")
            )}
          </div>
        )}

        {requiresPersonalBankStatements && personalBankStatementsType && (
          <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Personal Requirements
            </h3>
            <UploadFileV2
              userId={userId}
              documentType={personalBankStatementsType}
              titleOverride="3 Months Personal Bank Statements"
              descriptionOverride="Upload your recent personal bank statements. (PDF only)"
              pdfOnly
            />
            {isDocsLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading
                documents...
              </div>
            ) : (
              renderUploadedFiles("PERSONAL_BANK_STATEMENTS")
            )}
          </div>
        )}

        {requiresBusinessBankStatements && bankStatementsType && (
          <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Business Requirements
            </h3>
            <UploadFileV2
              userId={userId}
              documentType={bankStatementsType}
              titleOverride="4 Months of Bank Statements"
              descriptionOverride="Upload your most recent 4 months of business bank statements. (PDF only)"
              pdfOnly
            />
            {isDocsLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading
                documents...
              </div>
            ) : (
              renderUploadedFiles("BANK_STATEMENTS")
            )}
          </div>
        )}
      </div>

      <button
        onClick={onCalculate}
        disabled={isCalculating}
        className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-8 py-3.5 rounded-xl font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <IconMenu
          text={
            isCalculating
              ? "Calculating..."
              : "Calculate Pre-Approved Business Income"
          }
          icon={
            isCalculating ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Calculator className="mr-2 h-5 w-5" />
            )
          }
        />
      </button>

      {/* Document Preview Sheet */}
      <Sheet
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      >
        <SheetContent
          side="bottom"
          className="h-[85vh] flex flex-col p-0 z-[100]"
        >
          <SheetHeader className="p-4 pb-2 border-b flex-shrink-0">
            <SheetTitle className="text-sm break-words text-left leading-snug">
              {previewDoc?.title}
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
            ) : previewDoc?.contentType === "application/pdf" ||
              previewDoc?.url?.includes(".pdf") ? (
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
