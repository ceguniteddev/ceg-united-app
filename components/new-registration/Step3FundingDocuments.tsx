"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DOCUMENT_TYPES, DocumentType } from "@/lib/document-types";
import { Button } from "@/components/ui/button";
import { Trash2Icon, Loader2, FileText, InfoIcon } from "lucide-react";
import React, { useState } from "react";
import { ImageZoom } from "@/components/ui/shadcn-io/image-zoom";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FundingType } from "@/schema/new-registration";
import { useNewRegistrationStore } from "@/store/new-registration-store";
import { toast } from "sonner";
import { getCaptchaTokenRegistration } from "@/lib/captcha";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { CustomFormField } from "@/components/CustomFormField";

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ALLOWED_EXTENSIONS = [".pdf", ".jpeg", ".jpg", ".png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const validateFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) {
    return `File "${file.name}" is too large. Maximum size is 10MB.`;
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `File "${file.name}" has an invalid format. Only PDF, JPEG, and PNG are allowed.`;
  }

  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
    fileName.endsWith(ext),
  );
  if (!hasValidExtension) {
    return `File "${file.name}" has an invalid extension. Only .pdf, .jpg, .jpeg, and .png are allowed.`;
  }

  // Explicitly block known executable/script extensions as an extra precaution
  const blockedExtensions = [
    ".exe",
    ".sh",
    ".bat",
    ".js",
    ".cmd",
    ".ps1",
    ".vbs",
    ".msi",
    ".py",
  ];
  if (blockedExtensions.some((ext) => fileName.endsWith(ext))) {
    return `File "${file.name}" is a restricted file type and cannot be uploaded.`;
  }

  return null;
};

const PublicFileUpload = ({
  documentType,
  onUploadComplete,
  titleOverride,
  descriptionOverride,
  maxFiles = 4,
}: {
  documentType?: DocumentType;
  onUploadComplete?: (
    files: {
      name: string;
      size: number;
      type: string;
      base64: string;
      docType?: string;
    }[],
  ) => void;
  titleOverride?: string;
  descriptionOverride?: string;
  maxFiles?: number;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDrop = async (droppedFiles: File[]) => {
    if (!droppedFiles || droppedFiles.length === 0) return;

    const validFiles: File[] = [];

    // Perform security checks on each file
    for (const file of droppedFiles) {
      const errorMsg = validateFile(file);
      if (errorMsg) {
        toast.error(errorMsg);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    setIsLoading(true);

    try {
      const processedFiles = await Promise.all(
        validFiles.map(async (file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          base64: await fileToBase64(file),
          docType: documentType?.id,
        })),
      );

      if (onUploadComplete) {
        onUploadComplete(processedFiles);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const title =
    titleOverride ||
    (documentType ? `Upload: ${documentType.title}` : "Upload Document");
  const description =
    descriptionOverride ||
    (documentType
      ? `${documentType.description} (PDF or Image only)`
      : "Upload documents (PDF or Image only)");

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 mb-4 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <span className="text-sm font-medium text-gray-700">
            Processing Document...
          </span>
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <Dropzone
        maxFiles={maxFiles}
        className="cursor-pointer"
        onDrop={handleDrop}
        disabled={isLoading}
        accept={{
          "application/pdf": [".pdf"],
          "image/*": [".png", ".jpg", ".jpeg", ".gif"],
        }}
      >
        <DropzoneEmptyState />
        <DropzoneContent />
      </Dropzone>
    </div>
  );
};

const LocalDocumentList = ({
  fieldName,
  documentType,
}: {
  fieldName: string;
  documentType?: DocumentType;
}) => {
  const { watch, setValue } = useFormContext();
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const fieldData = watch(fieldName);
  const files = fieldData?.files || [];

  if (!files || files.length === 0) {
    return null;
  }

  const handleDelete = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);

    setValue(
      fieldName,
      {
        uploaded: updatedFiles.length > 0,
        count: updatedFiles.length,
        files: updatedFiles,
      },
      { shouldValidate: true, shouldDirty: true },
    );
  };

  return (
    <div className="space-y-2 mt-4 border-t border-slate-100 pt-4">
      <h4 className="text-sm font-semibold text-gray-700">
        Uploaded {documentType?.title || "Documents"}
      </h4>
      <div className="space-y-2">
        {files.map((doc: any, index: number) => {
          const displayName = doc.name;
          const Icon = documentType?.icon || FileText;

          return (
            <div
              key={`${doc.name}-${index}`}
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
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(index)}
                >
                  <Trash2Icon className="w-4 h-4" />
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
              {previewDoc && previewDoc.name}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden p-2">
            {previewDoc?.type?.startsWith("image/") ? (
              <ImageZoom>
                <Image
                  src={previewDoc.base64}
                  alt={previewDoc.name}
                  className="w-full h-full object-contain"
                  width={800}
                  height={600}
                  unoptimized
                />
              </ImageZoom>
            ) : previewDoc?.type === "application/pdf" ? (
              <iframe
                src={`${previewDoc.base64}#toolbar=1&view=FitH`}
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

export function Step3Funding() {
  const { watch, setValue, getValues } = useFormContext();
  const { businessDetailsData, authData, updateAuthData } =
    useNewRegistrationStore();

  const fundingType = watch("fundingType") || businessDetailsData.fundingType;
  const employmentType =
    watch("employmentType") || businessDetailsData.employmentType;

  const isBusiness =
    fundingType === FundingType.Business || fundingType === FundingType.Both;
  const isPersonal =
    fundingType === FundingType.Personal || fundingType === FundingType.Both;

  // Sync address fields to the store when user edits them
  const addressStreet = watch("addressStreet");
  const addressCity = watch("addressCity");
  const addressState = watch("addressState");
  const addressPostal = watch("addressPostal");

  React.useEffect(() => {
    if (
      addressStreet !== undefined ||
      addressCity !== undefined ||
      addressState !== undefined ||
      addressPostal !== undefined
    ) {
      updateAuthData({
        ...(addressStreet !== undefined && { addressStreet }),
        ...(addressCity !== undefined && { addressCity }),
        ...(addressState !== undefined && { addressState }),
        ...(addressPostal !== undefined && { addressPostal }),
      });
    }
  }, [addressStreet, addressCity, addressState, addressPostal, updateAuthData]);

  // Set initial values from store if not already set (e.g. going back/forth)
  React.useEffect(() => {
    if (authData.addressStreet && !getValues("addressStreet"))
      setValue("addressStreet", authData.addressStreet);
    if (authData.addressCity && !getValues("addressCity"))
      setValue("addressCity", authData.addressCity);
    if (authData.addressState && !getValues("addressState"))
      setValue("addressState", authData.addressState);
    if (authData.addressPostal && !getValues("addressPostal"))
      setValue("addressPostal", authData.addressPostal);
  }, []);

  const handleUploadComplete = async (fieldName: string, newFiles: any[]) => {
    const currentVal = getValues(fieldName);
    const existingFiles = currentVal?.files || [];
    const allFiles = [...existingFiles, ...newFiles];

    setValue(
      fieldName,
      {
        uploaded: true,
        count: allFiles.length,
        files: allFiles,
      },
      { shouldValidate: true, shouldDirty: true },
    );

    if (fieldName === "driverLicense" && allFiles.length > 0) {
      extractDriverLicenseData(allFiles);
    }
  };

  const extractDriverLicenseData = async (files: any[]) => {
    try {
      toast.info("Extracting data from driver's license...", {
        id: "ocr-toast",
      });
      const captchaToken = await getCaptchaTokenRegistration("ocr");
      if (!captchaToken) {
        throw new Error("Could not verify CAPTCHA");
      }

      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: files, captchaToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract data");
      }

      const { data } = await response.json();
      if (data?.personal) {
        const { updateAuthData } = useNewRegistrationStore.getState();

        const newData: any = {};
        if (data.personal.addressStreet)
          newData.addressStreet = data.personal.addressStreet;
        if (data.personal.addressCity)
          newData.addressCity = data.personal.addressCity;
        if (data.personal.addressState)
          newData.addressState = data.personal.addressState;
        if (data.personal.addressPostal)
          newData.addressPostal = data.personal.addressPostal;

        // Let's only update fields that were actually found
        if (Object.keys(newData).length > 0) {
          // Update react-hook-form values so UI reflects the changes immediately
          Object.entries(newData).forEach(([key, value]) => {
            setValue(key, value, { shouldValidate: true, shouldDirty: true });
          });

          updateAuthData(newData);

          // Instantly sync the newly extracted address to the user-lead collection
          const { leadId, authData } = useNewRegistrationStore.getState();
          if (leadId) {
            try {
              const updatedAuthData = { ...authData, ...newData };
              const encodedData = btoa(JSON.stringify(updatedAuthData));
              await fetch("/api/leads", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ leadId, data: encodedData }),
              });
            } catch (syncErr) {
              console.error("Failed to sync OCR data to lead", syncErr);
            }
          }
        }

        toast.success("Driver's license data extracted successfully", {
          id: "ocr-toast",
        });
      } else {
        toast.dismiss("ocr-toast");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to extract data from driver's license", {
        id: "ocr-toast",
      });
    }
  };

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
        {/* DRIVERS LICENSE (FOR ALL) */}
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 border border-slate-200 bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold">Identity</h3>
          <div className="space-y-4">
            <PublicFileUpload
              documentType={driversLicenseType}
              titleOverride="Upload Driver's License"
              descriptionOverride="Upload a clear image or PDF of your Driver's License."
              onUploadComplete={(files) =>
                handleUploadComplete("driverLicense", files)
              }
              maxFiles={2}
            />
            <LocalDocumentList
              fieldName="driverLicense"
              documentType={driversLicenseType}
            />

            <div className="mt-8 border border-blue-200 bg-blue-50/60 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-3 mb-5">
                <div className="mt-0.5 bg-blue-100 p-1.5 rounded-full text-blue-700 flex-shrink-0">
                  <InfoIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-blue-900 mb-1">
                    Verify Your Address for Credit Report
                  </h4>
                  <p className="text-sm text-blue-800/90 leading-relaxed">
                    This address will auto-populate once you upload your
                    Driver&apos;s License.{" "}
                    <strong>
                      Please carefully review and correct any errors.
                    </strong>{" "}
                    We use this address to pull your credit report, so accuracy
                    is critical to process your funding application
                    successfully.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-lg border border-blue-100 shadow-sm">
                <CustomFormField
                  name="addressStreet"
                  label="Street Address"
                  placeholder="123 Main St"
                />
                <CustomFormField
                  name="addressCity"
                  label="City"
                  placeholder="New York"
                />
                <CustomFormField
                  name="addressState"
                  label="State"
                  placeholder="NY"
                />
                <CustomFormField
                  name="addressPostal"
                  label="Zip / Postal Code"
                  placeholder="10001"
                />
              </div>
            </div>
          </div>
        </div>

        {/* PERSONAL FUNDING DOCUMENTS */}
        {isPersonal && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 border border-slate-200 bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold">Personal Requirements</h3>
            {employmentType === "W2" && (
              <div className="space-y-2">
                <PublicFileUpload
                  documentType={paystubsType}
                  titleOverride="Last 2 Recent Paystubs"
                  descriptionOverride="Click to upload your paystubs."
                  onUploadComplete={(files) =>
                    handleUploadComplete("personalDocs.paystubs", files)
                  }
                  maxFiles={2}
                />
                <LocalDocumentList
                  fieldName="personalDocs.paystubs"
                  documentType={paystubsType}
                />
              </div>
            )}
            {employmentType === "Self-employed" && (
              <div className="space-y-2">
                <PublicFileUpload
                  documentType={DOCUMENT_TYPES.find(
                    (dt) => dt.id === "PERSONAL_BANK_STATEMENTS",
                  )}
                  titleOverride="3 Months Bank Statements"
                  descriptionOverride="Click to upload your recent personal bank statements."
                  onUploadComplete={(files) =>
                    handleUploadComplete("personalDocs.bankStatements", files)
                  }
                  maxFiles={3}
                />
                <LocalDocumentList
                  fieldName="personalDocs.bankStatements"
                  documentType={DOCUMENT_TYPES.find(
                    (dt) => dt.id === "PERSONAL_BANK_STATEMENTS",
                  )}
                />
              </div>
            )}
          </div>
        )}

        {/* BUSINESS FUNDING DOCUMENTS */}
        {isBusiness && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 border border-slate-200 bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold">Business Requirements</h3>
            <div className="space-y-2">
              <PublicFileUpload
                documentType={bankStatementsType}
                titleOverride="4 Months of Bank Statements"
                descriptionOverride="Upload your most recent 4 months of business bank statements."
                onUploadComplete={(files) =>
                  handleUploadComplete("businessDocs.bankStatements", files)
                }
                maxFiles={4}
              />
              <LocalDocumentList
                fieldName="businessDocs.bankStatements"
                documentType={bankStatementsType}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
