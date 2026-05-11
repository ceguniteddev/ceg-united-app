import { useState } from "react";
import { Mail, Send, Calculator, Loader2, X, Check } from "lucide-react";
import { GradeBadge } from "@/components/income-funding/GradeBadge";
import { DealOfferForm } from "./DealOfferForm";
import { ExistingOffersList } from "./ExistingOffersList";
import type {
  AdminClient,
  DealOffer,
  DocumentRecord,
} from "@/types/income-funding-types";
import { formatUSD } from "@/lib/underwriting";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ImageZoom } from "@/components/ui/shadcn-io/image-zoom";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { DocumentUploadCard } from "@/components/income-funding/DocumentUploadCard";

interface ClientDetailProps {
  client: AdminClient;
  onAddOffer: (offer: DealOffer) => void;
  onDeleteOffer: (id: string) => void;
  onNotify: () => void;
}

export function ClientDetail({
  client,
  onAddOffer,
  onDeleteOffer,
  onNotify,
}: ClientDetailProps) {
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    title: string;
    contentType?: string;
  } | null>(null);
  const [editingOffer, setEditingOffer] = useState<DealOffer | null>(null);
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>(
    {},
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const queryClient = useQueryClient();

  const handleSaveOffer = (offer: DealOffer) => {
    onAddOffer(offer);
    setEditingOffer(null);
  };

  const handleCalculateIncome = async () => {
    if (!client.uid || !client.referenceNumber) return;

    try {
      setIsCalculating(true);
      const response = await fetch(
        `/api/user/${client.uid}/funding-application/${client.referenceNumber}/calculate-income`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to calculate business income.");
      }

      toast.success("Business income pre-approval calculated successfully!");

      queryClient.invalidateQueries({
        queryKey: ["GET_ADMIN_INCOME_FUNDING"],
      });
    } catch (error: any) {
      toast.error(error.message || "An error occurred.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleUpload = async (
    key: DocumentRecord["key"],
    file: File,
    fileName: string,
    fileSize: string,
  ) => {
    if (!client.uid) return;

    setUploadingState((prev) => ({ ...prev, [key]: true }));

    // Map key to DocumentType ID
    let documentTypeId = "OTHER";
    if (key === "ein") documentTypeId = "EIN_LETTER";
    else if (key === "articles") documentTypeId = "ARTICLES_OF_ORGANIZATION";
    else if (key === "id") documentTypeId = "DRIVERS_LICENSE";
    else if (key === "bankStatements") documentTypeId = "BANK_STATEMENTS";
    else if (key === "voidedCheck") documentTypeId = "VOIDED_CHECK";

    const formData = new FormData();
    formData.append("userId", client.uid);
    if (documentTypeId !== "OTHER") {
      formData.append("documentType", documentTypeId);
    }
    formData.append("files", file);

    try {
      const response = await fetch(`/api/user/${client.uid}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Upload failed");
      }

      queryClient.invalidateQueries({
        queryKey: ["GET_ADMIN_INCOME_FUNDING"],
      });

      toast.success("Document uploaded successfully");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploadingState((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="space-y-5">
      {/* Header / summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 md:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <GradeBadge grade={client.grade} size="lg" />
            <div>
              <div className="text-lg md:text-xl font-bold text-gray-900">
                {client.firstName} {client.lastName}
              </div>
              <div className="text-sm text-gray-500">{client.businessName}</div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>
                  <span className="font-semibold text-gray-700">
                    Monthly revenue:
                  </span>{" "}
                  {formatUSD(client.monthlyRevenue)}
                </span>
                <span>
                  <span className="font-semibold text-gray-700">
                    Pre-approved:
                  </span>{" "}
                  {formatUSD(client.preApprovedAmount)}
                </span>
                <span>
                  <span className="font-semibold text-gray-700">
                    Submitted:
                  </span>{" "}
                  {client.submittedAt
                    ? new Date(client.submittedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={isCalculating}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer"
                >
                  {isCalculating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Calculator className="w-3.5 h-3.5" />
                  )}
                  {isCalculating ? "Calculating..." : "Calculate Income"}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Calculate Income Pre-Approval
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to run the automated AI income
                    computation? This will analyze the submitted documents and
                    automatically generate pre-approval offers based on the
                    client's risk profile.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="inline-flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCalculateIncome}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Proceed
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <button
              onClick={onNotify}
              className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Notify Client
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="offers" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="space-y-6">
          {client.backendStatus !== "New" &&
          client.backendStatus !== "Processing" ? (
            <>
              {/* Offer form */}
              <DealOfferForm
                onSave={handleSaveOffer}
                initialData={editingOffer}
                onCancelEdit={() => setEditingOffer(null)}
                userId={client.uid}
                referenceNumber={client.referenceNumber}
              />

              {/* Existing offers */}
              <ExistingOffersList
                offers={client.offers}
                onDelete={onDeleteOffer}
                onEdit={setEditingOffer}
              />
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-500">
                Offers cannot be added yet. Wait until the client has submitted
                documents.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 md:p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">
              Submitted Documents
            </h3>
            {client.documents && client.documents.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {client.documents.map((d) => (
                  <DocumentUploadCard
                    key={d.key}
                    doc={d}
                    onUpload={handleUpload}
                    isUploading={uploadingState[d.key]}
                    onView={(url, title, contentType) =>
                      setPreviewDoc({ url, title, contentType })
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-xl">
                No documents submitted yet.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

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
