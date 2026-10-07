import React, { useEffect, useState } from "react";
import { TrackingRow } from "./DisputeTrackingTable";
import { getTypeLabel, ItemTypeIcon } from "./ItemTypeIcon";
import { getPdfBlob } from "@/lib/pdfGenerator";
import { useUserDocumentsQuery } from "@/hooks/document";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { StatutoryDeadlineBar } from "./StatutoryDeadlineBar";
import { ResponseLetterUploadModal } from "./ResponseLetterUploadModal";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface Props {
  row: TrackingRow;
  onClose: () => void;
  userId: string;
}

export function DisputeDetailsModal({ row, onClose, userId }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { userDocuments } = useUserDocumentsQuery({ userId });

  useEffect(() => {
    let url: string | null = null;

    if (row.letter) {
      if ((row.letter as any).url) {
        setPdfUrl((row.letter as any).url);
      } else if (userDocuments && row.letter.lobId) {
        // If no direct URL, find the document by lobId in metadata
        const doc = userDocuments.find(
          (d: any) => d.metadata?.lobId === row.letter.lobId,
        );
        if (doc) {
          setPdfUrl(doc.signedUrl);
        } else if (row.letter.content) {
          // Fallback to generating from content if available
          const blob = getPdfBlob(row.letter);
          url = URL.createObjectURL(blob);
          setPdfUrl(url);
        }
      } else if (row.letter.content) {
        // Fallback to generating from content if available
        const blob = getPdfBlob(row.letter);
        url = URL.createObjectURL(blob);
        setPdfUrl(url);
      }
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [row.letter, userDocuments]);

  return (
    <ResponsiveDialog
      isOpen={true}
      setIsOpen={(open) => {
        if (!open) onClose();
      }}
      title="Dispute Details"
      className="w-[95vw] md:max-w-4xl h-[90dvh]"
      onEscapeAttempt={onClose}
    >
      <div className="flex flex-col md:grid md:grid-cols-2 gap-6 h-full">
        <div className="min-h-[50vh] md:min-h-0 md:h-full order-2 md:order-1">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="Dispute Letter"
              className="w-full h-full border rounded-md"
            />
          ) : (
            <div className="w-full h-full border rounded-md flex items-center justify-center text-gray-500">
              Letter preview not available.
            </div>
          )}
        </div>
        <div className="order-1 md:order-2">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Item</h3>
              <div className="flex items-center gap-3 mt-1">
                <ItemTypeIcon type={row.item.type} size="sm" />
                <div>
                  <div className="font-semibold text-gray-900">
                    {row.item.creditor}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getTypeLabel(row.item.type)} · {row.item.accountNumber}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Agency</h3>
              <p className="mt-1 text-gray-900">{row.agencyName}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1 text-gray-900">{row.status}</p>
            </div>

            {row.letter.trackingNumber && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Tracking Number
                </h3>
                <p className="mt-1 font-mono text-sm text-blue-600">
                  {row.letter.trackingNumber}
                </p>
              </div>
            )}

            {row.letter.mailedAt && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Sent Time</h3>
                <p className="mt-1 text-gray-900">
                  {new Date(row.letter.mailedAt).toLocaleString()}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Last Updated
              </h3>
              <p className="mt-1 text-gray-900">
                {new Date(row.lastUpdatedAt).toLocaleString()}
              </p>
            </div>

            {/* Statutory FCRA Timeline Clock */}
            <div className="pt-2">
              <StatutoryDeadlineBar
                d0_mailedAt={row.letter.mailedAt}
                r_receivedAt={row.letter.mailedAt}
                c_investigationDue={
                  row.letter.mailedAt
                    ? new Date(
                        new Date(row.letter.mailedAt).getTime() +
                          30 * 24 * 60 * 60 * 1000,
                      ).toISOString()
                    : null
                }
                n_resultsDue={
                  row.letter.mailedAt
                    ? new Date(
                        new Date(row.letter.mailedAt).getTime() +
                          35 * 24 * 60 * 60 * 1000,
                      ).toISOString()
                    : null
                }
              />
            </div>

            {/* Bureau Response Upload Action */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => setShowUploadModal(true)}
              >
                <Upload className="w-4 h-4" />
                Upload Investigation Response Letter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showUploadModal && (
        <ResponseLetterUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          userId={userId}
          lineId={(row as any).id || (row as any).lineId || ""}
          creditor={row.item.creditor}
          bureau={row.agencyName}
        />
      )}
    </ResponsiveDialog>
  );
}
