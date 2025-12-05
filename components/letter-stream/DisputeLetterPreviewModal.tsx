"use client";

import { useState, useEffect } from "react";
import { DisputeLetter } from "@/schema/dispute-letter";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { PDFDownloadLink } from "@react-pdf/renderer";
import DisputeLetterDocument from "@/components/pdf/DisputeLetterDocument";
import { Download, Printer, Save, Loader } from "lucide-react";
import dynamic from "next/dynamic";
import { useUpdateDisputeLetter } from "@/hooks/dispute-letter";

const EditorQuill = dynamic(() => import("@/components/editor/EditorQuill"), {
  ssr: false,
});

interface DisputeLetterPreviewModalProps {
  letter: DisputeLetter | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DisputeLetterPreviewModal({
  letter,
  isOpen,
  onClose,
}: DisputeLetterPreviewModalProps) {
  const [isClient, setIsClient] = useState(false);
  const [content, setContent] = useState("");
  const { mutate: updateLetter, isPending: isUpdating } =
    useUpdateDisputeLetter(letter?.id || "");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (letter) {
      setContent(letter.letterContent || "");
    }
  }, [letter?.id]);

  const handleSave = () => {
    updateLetter({ letterContent: content });
  };

  if (!letter) return null;

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      setIsOpen={(open) => !open && onClose()}
      title={letter.letterTitle}
      description={`Created on ${
        letter.createdAt ? new Date(letter.createdAt).toLocaleDateString() : ""
      }`}
      className="sm:max-w-4xl"
    >
      <div className="flex flex-col gap-4 h-[70vh]">
        <div className="flex justify-end gap-2 border-b pb-4">
          {isClient && (
            <PDFDownloadLink
              document={
                <DisputeLetterDocument
                  letter={{ ...letter, letterContent: content }}
                />
              }
              fileName={`${letter.letterTitle.replace(/\s+/g, "_")}.pdf`}
            >
              {({ blob, url, loading, error }) => (
                <Button disabled={loading} variant="outline">
                  {loading ? (
                    "Preparing PDF..."
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
              )}
            </PDFDownloadLink>
          )}

          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 border rounded-md bg-white print:border-none print:p-0">
          <div className="prose max-w-none print:block">
            {/* Render HTML content for preview */}
            <EditorQuill
              value={content}
              onChange={setContent}
              readOnly={false}
              placeholder="Type your letter content here..."
            />
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .prose,
          .prose * {
            visibility: visible;
          }
          .prose {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          /* Hide modal overlay and other UI elements */
          div[role="dialog"] > button {
            display: none;
          }
        }
      `}</style>
    </ResponsiveDialog>
  );
}
