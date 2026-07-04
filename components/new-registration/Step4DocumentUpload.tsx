"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import UploadFile from "@/components/UploadFileV2";
import { useAuth } from "@/provider/AuthContext";
import { DOCUMENT_TYPES, DocumentType } from "@/lib/document-types";
import {
  useUserDocumentMutation,
  useUserDocumentsQuery,
} from "@/hooks/document";
import { Button } from "@/components/ui/button";
import { Trash2Icon, Loader2, FileText } from "lucide-react";
import React, { useMemo, useState } from "react";
import { ImageZoom } from "@/components/ui/shadcn-io/image-zoom";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getCaptchaTokenRegistration } from "@/lib/captcha";
import { toast } from "sonner";

// Reusing some UI from existing FundingApplicationFields if possible, or build simple ones
import { FormInput } from "../forms/form-input";
import { FormSSNInput } from "../forms/form-ssn-input";
import { FormSelect } from "../forms/form-select";
import { US_STATES } from "@/constant/common";

function cleanFileName(fileName: string) {
  const matchingDocType = DOCUMENT_TYPES.find((dt) =>
    fileName.startsWith(dt.id + "_"),
  );
  if (matchingDocType) {
    fileName = fileName.substring((matchingDocType.id + "_").length);
  }
  fileName = fileName.replace(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[_-]/i,
    "",
  );
  // Replace hyphens with spaces for readability
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot !== -1) {
    fileName =
      fileName.substring(0, lastDot).replace(/-/g, " ") +
      fileName.substring(lastDot);
  } else {
    fileName = fileName.replace(/-/g, " ");
  }
  return fileName;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const DocumentList = ({
  userId,
  documentType,
  onDocumentStateChange,
}: {
  userId: string;
  documentType?: DocumentType;
  onDocumentStateChange?: (count: number) => void;
}) => {
  const { userDocuments, isLoading } = useUserDocumentsQuery({ userId });
  const { deleteDocument, isDeleting } = useUserDocumentMutation();
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const matchedDocs = useMemo(() => {
    if (!userDocuments) return [];
    return userDocuments.filter((doc: any) => {
      const fileName = doc.name.split("/").pop() || "";
      if (documentType) {
        return fileName.startsWith(documentType.id + "_");
      }
      return false;
    });
  }, [userDocuments, documentType]);

  // Sync form state when documents are fetched or deleted
  React.useEffect(() => {
    if (!isLoading && onDocumentStateChange) {
      onDocumentStateChange(matchedDocs.length);
    }
  }, [matchedDocs.length, isLoading, onDocumentStateChange]);

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 flex items-center">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading uploaded
        documents...
      </div>
    );
  }

  if (matchedDocs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mt-4 border-t border-slate-100 pt-4">
      <h4 className="text-sm font-semibold text-gray-700">
        Uploaded {documentType?.title}
      </h4>
      <div className="space-y-2">
        {matchedDocs.map((doc: any) => {
          const rawName = doc.name.split("/").pop() || "";
          const displayName = cleanFileName(rawName);
          const Icon = documentType?.icon || FileText;

          return (
            <div
              key={doc.path}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border shadow-sm"
            >
              <div
                className="flex items-center gap-3 cursor-pointer overflow-hidden mb-2 sm:mb-0"
                onClick={() => setPreviewDoc(doc)}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate pr-4">
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
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteDocument({ path: doc.path })}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2Icon className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

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
            {previewDoc?.contentType?.startsWith("image/") ? (
              <ImageZoom>
                <Image
                  src={previewDoc.signedUrl}
                  alt={previewDoc.name}
                  className="w-full h-full object-contain"
                  width={800}
                  height={600}
                  unoptimized
                />
              </ImageZoom>
            ) : previewDoc?.contentType === "application/pdf" ? (
              <iframe
                src={`${previewDoc.signedUrl}#toolbar=1&view=FitH`}
                title={previewDoc.name}
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
};

export function Step4DocumentUpload() {
  const { watch, setValue, control, getValues } = useFormContext();
  const { user } = useAuth();
  const interestedProduct = watch("interestedProduct");
  const employmentType = watch("employmentType");

  const isBusiness =
    interestedProduct === "Business Funding" ||
    interestedProduct === "Personal & Business Funding";
  const isPersonal =
    interestedProduct === "Personal Funding" ||
    interestedProduct === "Personal & Business Funding";

  const handleSmartAutoFill = async (files: File[], addressPrefix: string) => {
    try {
      toast.info("Analyzing document to auto-fill address...", {
        duration: 3000,
      });
      const captchaToken = await getCaptchaTokenRegistration("ocr");

      const newDocs = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          base64: await fileToBase64(file),
        })),
      );

      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: newDocs, captchaToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to process document");
      }

      const { data } = await response.json();

      // Auto-populate based on returned data
      if (data.personal) {
        if (data.personal.addressStreet)
          setValue(
            addressPrefix ? `${addressPrefix}.addressStreet` : "addressStreet",
            data.personal.addressStreet,
            {
              shouldDirty: true,
              shouldValidate: true,
            },
          );
        if (data.personal.addressCity)
          setValue(
            addressPrefix ? `${addressPrefix}.addressCity` : "addressCity",
            data.personal.addressCity,
            {
              shouldDirty: true,
              shouldValidate: true,
            },
          );
        if (data.personal.addressState)
          setValue(
            addressPrefix ? `${addressPrefix}.addressState` : "addressState",
            data.personal.addressState,
            {
              shouldDirty: true,
              shouldValidate: true,
            },
          );
        if (data.personal.addressPostal)
          setValue(
            addressPrefix ? `${addressPrefix}.addressPostal` : "addressPostal",
            data.personal.addressPostal,
            {
              shouldDirty: true,
              shouldValidate: true,
            },
          );

        toast.success("Address fields auto-filled successfully!");
      } else {
        toast.warning(
          "Could not clearly read the address from the document. Please fill manually.",
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to extract data. Please fill out manually.");
    }
  };

  const handleUploadComplete = (fieldName: string, files?: File[]) => {
    const currentVal = getValues(fieldName);
    const existingCount = currentVal?.count || 0;
    const newFilesCount = files ? files.length : 1;

    setValue(
      fieldName,
      {
        uploaded: true,
        count: existingCount + newFilesCount,
      },
      { shouldValidate: true, shouldDirty: true },
    );

    if (files && files.length > 0 && fieldName.includes("driverLicense")) {
      // If the fieldName is nested (e.g., "businessDocs.driverLicense"), extract the prefix.
      // Otherwise, if it's at the root (e.g., "driverLicense"), the prefix is empty.
      const parts = fieldName.split(".");
      const addressPrefix = parts.length > 1 ? parts[0] : "";
      handleSmartAutoFill(files, addressPrefix);
    }
  };

  const handleDocumentStateChange = React.useCallback(
    (fieldName: string, count: number) => {
      const currentVal = getValues(fieldName);
      if (!currentVal || currentVal.count !== count) {
        setValue(
          fieldName,
          {
            uploaded: count > 0,
            count: count,
          },
          { shouldValidate: true, shouldDirty: true },
        );
      }
    },
    [getValues, setValue],
  );

  const driversLicenseType = DOCUMENT_TYPES.find(
    (dt) => dt.id === "DRIVERS_LICENSE",
  );
  const bankStatementsType = DOCUMENT_TYPES.find(
    (dt) => dt.id === "BANK_STATEMENTS",
  );
  const paystubsType = DOCUMENT_TYPES.find((dt) => dt.id === "PAYSTUBS");

  return (
    <Card className="bg-slate-100 border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📄</span> Document Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* UNIVERSAL IDENTITY & ADDRESS */}
        {(isBusiness || isPersonal) && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-semibold">Identity & Address</h3>

            <div className="space-y-2">
              <UploadFile
                userId={user?.uid || ""}
                documentType={driversLicenseType}
                titleOverride="Upload Driver's License"
                descriptionOverride="Upload a clear image or PDF of your Driver's License."
                onUploadComplete={(files) =>
                  handleUploadComplete("driverLicense", files)
                }
              />
              <DocumentList
                userId={user?.uid || ""}
                documentType={driversLicenseType}
                onDocumentStateChange={(uploaded) =>
                  handleDocumentStateChange("driverLicense", uploaded)
                }
              />
            </div>

            <FormSSNInput
              control={control}
              name="ssn"
              label="SSN"
              required
              placeholder="XXX-XX-XXXX"
            />

            <div className="space-y-4 pt-2">
              <h4 className="text-sm font-semibold text-gray-700">
                Personal Address
              </h4>
              <FormInput
                control={control}
                name="addressStreet"
                label="Street Address"
                placeholder="123 Main St"
                required
              />
              <FormInput
                control={control}
                name="houseNumber"
                label="Apt/Suite/Unit (Optional)"
                placeholder="Apt 4B"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormInput
                  control={control}
                  name="addressCity"
                  label="City"
                  placeholder="New York"
                  required
                />
                <FormSelect
                  control={control}
                  name="addressState"
                  label="State"
                  placeholder="Select a state"
                  options={US_STATES}
                  required
                />
                <FormInput
                  control={control}
                  name="addressPostal"
                  label="Zip Code"
                  placeholder="10001"
                  required
                />
              </div>
            </div>
            <Separator className="my-6" />
          </div>
        )}

        {/* BUSINESS FUNDING DOCUMENTS */}
        {isBusiness && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-semibold">Business Requirements</h3>

            <div className="space-y-4">
              {/* 4 Months Bank Statements */}
              <div className="space-y-2">
                <UploadFile
                  userId={user?.uid || ""}
                  documentType={bankStatementsType}
                  titleOverride="4 Months of Bank Statements"
                  descriptionOverride="Upload your most recent 4 months of business bank statements."
                  onUploadComplete={(files) =>
                    handleUploadComplete("businessDocs.bankStatements", files)
                  }
                />
                <DocumentList
                  userId={user?.uid || ""}
                  documentType={bankStatementsType}
                  onDocumentStateChange={(uploaded) =>
                    handleDocumentStateChange(
                      "businessDocs.bankStatements",
                      uploaded,
                    )
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* <CustomFormField
                  name="businessDocs.ein"
                  label="EIN (Number)"
                  placeholder="Enter your EIN"
                /> */}
                <FormInput
                  control={control}
                  name="businessDocs.ein"
                  label="EIN (Number)"
                  placeholder="Enter your EIN"
                  required
                />
              </div>
            </div>
            {isPersonal && <Separator className="my-6" />}
          </div>
        )}

        {/* PERSONAL FUNDING DOCUMENTS */}
        {isPersonal && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-semibold">Personal Requirements</h3>

            <FormSelect
              control={control}
              name="employmentType"
              label="Employment Status"
              placeholder="Select employment status"
              options={[
                { value: "W2 Employed", label: "W2 Employed" },
                { value: "Self Employed", label: "Self Employed" },
              ]}
              required
            />

            {employmentType === "W2 Employed" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 pt-4 border-t border-slate-200">
                <div className="space-y-2">
                  <UploadFile
                    userId={user?.uid || ""}
                    documentType={paystubsType}
                    titleOverride="Last 2 Recent Paystubs"
                    descriptionOverride="Click to upload your paystubs."
                    onUploadComplete={(files) =>
                      handleUploadComplete("personalDocs.paystubs", files)
                    }
                  />
                  <DocumentList
                    userId={user?.uid || ""}
                    documentType={paystubsType}
                    onDocumentStateChange={(uploaded) =>
                      handleDocumentStateChange(
                        "personalDocs.paystubs",
                        uploaded,
                      )
                    }
                  />
                </div>
              </div>
            )}

            {employmentType === "Self Employed" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 pt-4 border-t border-slate-200">
                <div className="space-y-2">
                  <UploadFile
                    userId={user?.uid || ""}
                    documentType={DOCUMENT_TYPES.find(
                      (dt) => dt.id === "PERSONAL_BANK_STATEMENTS",
                    )}
                    titleOverride="3 Months Bank Statements"
                    descriptionOverride="Click to upload your recent personal bank statements."
                    onUploadComplete={(files) =>
                      handleUploadComplete("personalDocs.bankStatements", files)
                    }
                  />
                  <DocumentList
                    userId={user?.uid || ""}
                    documentType={DOCUMENT_TYPES.find(
                      (dt) => dt.id === "PERSONAL_BANK_STATEMENTS",
                    )}
                    onDocumentStateChange={(uploaded) =>
                      handleDocumentStateChange(
                        "personalDocs.bankStatements",
                        uploaded,
                      )
                    }
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
