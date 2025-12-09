"use client";

import { useState, useEffect } from "react";
import { DisputeLetter } from "@/schema/dispute-letter";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, Save, Loader } from "lucide-react";
import dynamic from "next/dynamic";
import { useUpdateDisputeLetter } from "@/hooks/dispute-letter";

const Editor = dynamic(() => import("@/components/Editor"), {
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
  const [contentExperian, setContentExperian] = useState("");
  const [contentTransunion, setContentTransunion] = useState("");
  const [contentEquifax, setContentEquifax] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { mutate: updateLetter, isPending: isUpdating } =
    useUpdateDisputeLetter(letter?.id || "");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (letter) {
      setContent(letter.letterContent || "");
      setContentExperian(letter.letterContentExperian || "");
      setContentTransunion(letter.letterContentTransunion || "");
      setContentEquifax(letter.letterContentEquifax || "");
    }
  }, [letter]);

  const handleSave = () => {
    updateLetter({
      letterContent: content,
      letterContentExperian: contentExperian,
      letterContentTransunion: contentTransunion,
      letterContentEquifax: contentEquifax,
    });
  };

  const handlePrintPuppeteer = async () => {
    try {
      setIsGeneratingPdf(true);
      const response = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          experian: contentExperian,
          transunion: contentTransunion,
          equifax: contentEquifax,
          letterContent: content,
          title: letter?.letterTitle,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(letter?.letterTitle || "letter").replace(
        /\s+/g,
        "_"
      )}_printed.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!letter) return null;

  const hasBureauSpecificContent =
    contentExperian || contentTransunion || contentEquifax;

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
            <Button
              onClick={handlePrintPuppeteer}
              disabled={isGeneratingPdf || isUpdating}
              variant="outline"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Printing...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </>
              )}
            </Button>
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
          <div className="prose max-w-none print:block space-y-8">
            {hasBureauSpecificContent ? (
              <>
                {contentExperian && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-blue-900">
                      Experian
                    </h3>
                    <Editor
                      content={contentExperian}
                      onContentChange={setContentExperian}
                    />
                  </div>
                )}
                {contentTransunion && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-blue-900">
                      TransUnion
                    </h3>
                    <Editor
                      content={contentTransunion}
                      onContentChange={setContentTransunion}
                    />
                  </div>
                )}
                {contentEquifax && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-blue-900">
                      Equifax
                    </h3>
                    <Editor
                      content={contentEquifax}
                      onContentChange={setContentEquifax}
                    />
                  </div>
                )}
              </>
            ) : (
              <Editor content={content} onContentChange={setContent} />
            )}
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
