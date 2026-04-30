import { useState } from "react";
import {
  Eye,
  Mail,
  Send,
  FileText,
  Building,
  Receipt,
  IdCard,
  Landmark,
} from "lucide-react";
import { GradeBadge } from "@/components/income-funding/GradeBadge";
import { DealOfferForm } from "./DealOfferForm";
import { ExistingOffersList } from "./ExistingOffersList";
import type {
  AdminClient,
  DealOffer,
  DocumentRecord,
} from "@/lib/income-funding-types";
import { formatUSD } from "@/lib/underwriting";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ImageZoom } from "@/components/ui/shadcn-io/image-zoom";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClientDetailProps {
  client: AdminClient;
  onAddOffer: (offer: DealOffer) => void;
  onDeleteOffer: (id: string) => void;
  onNotify: () => void;
}

const docIconMap = {
  ein: FileText,
  articles: Building,
  voidedCheck: Receipt,
  id: IdCard,
  bankStatements: Landmark,
};

function DocumentTile({
  doc,
  onView,
}: {
  doc: DocumentRecord;
  onView: (url: string, title: string, contentType?: string) => void;
}) {
  const Icon = docIconMap[doc.key];
  const isDone = doc.status === "uploaded" || doc.status === "synced";

  if (isDone && doc.files && doc.files.length > 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-emerald-50 text-emerald-600">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-semibold text-gray-900 truncate">
            {doc.title}
          </div>
        </div>
        {doc.files.map((file, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-2 text-[11px] bg-gray-50 rounded-lg p-2 border border-gray-100"
          >
            <div className="flex-1 min-w-0">
              <div className="text-gray-700 truncate">{file.fileName}</div>
              <div className="text-gray-400">{file.fileSize}</div>
            </div>
            {file.signedUrl && (
              <button
                onClick={() =>
                  onView(file.signedUrl!, file.fileName, file.contentType)
                }
                className="p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition cursor-pointer shrink-0"
                title="View"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-3 flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          isDone ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-gray-900 truncate">
          {doc.title}
        </div>
        <div className="text-[11px] text-gray-500 truncate">
          {isDone ? doc.fileName || "Provided" : "Not uploaded"}
        </div>
      </div>
      {isDone && doc.signedUrl && (
        <button
          onClick={() =>
            onView(doc.signedUrl!, doc.fileName || doc.title, doc.contentType)
          }
          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition cursor-pointer"
          title="View"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
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

  const handleSaveOffer = (offer: DealOffer) => {
    onAddOffer(offer);
    setEditingOffer(null);
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
            <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">
              <Mail className="w-3.5 h-3.5" />
              Email
            </button>
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
                  <DocumentTile
                    key={d.key}
                    doc={d}
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
