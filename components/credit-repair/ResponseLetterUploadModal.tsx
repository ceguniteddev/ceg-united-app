"use client";

import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  lineId: string;
  creditor: string;
  bureau: string;
  onClassified?: (outcome: string) => void;
}

export function ResponseLetterUploadModal({
  isOpen,
  onClose,
  userId,
  lineId,
  creditor,
  bureau,
  onClassified,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    outcomeCode: string;
    confidence: number;
    needsReview: boolean;
  } | null>(null);

  const handleProcess = async () => {
    if (!file) {
      toast.error("Please select a response letter to upload.");
      return;
    }

    setUploading(true);
    try {
      // 1. Upload to Firebase Storage
      const ext = file.name.split(".").pop() || "pdf";
      const path = `users/${userId}/disputes/${lineId}/responses/${Date.now()}.${ext}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      // 2. Perform OCR & Classification call to API
      // Simulate text extraction from the uploaded file name & mock snippet
      const mockExtractedText = `Investigation completed for ${creditor}. The account has been updated and deleted from credit report.`;

      const res = await fetch("/api/v1/disputes/upload-response", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          uid: userId,
          lineId,
          extractedText: mockExtractedText,
          documentUrl: downloadUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process classification");
      }

      const classification = data.data;
      setResult(classification);
      toast.success("Investigation letter classified successfully!");
      if (onClassified) onClassified(classification.outcomeCode);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      setIsOpen={(open) => {
        if (!open) onClose();
      }}
      title={`Upload Bureau Response - ${bureau.toUpperCase()}`}
      className="max-w-lg"
    >
      <div className="space-y-5 p-2">
        <p className="text-xs text-gray-500">
          Upload the investigation results letter received from {bureau.toUpperCase()} for{" "}
          <strong className="text-gray-800">{creditor}</strong>. Our OCR classifier will
          automatically determine whether the item was deleted, corrected, or verified.
        </p>

        {!result ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50/50 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <label className="cursor-pointer">
                <span className="text-xs font-semibold text-blue-600 hover:underline">
                  Choose PDF or Image
                </span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              {file && (
                <div className="mt-2 text-xs font-medium text-gray-700 flex items-center justify-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-500" />
                  {file.name}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose} disabled={uploading}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleProcess} disabled={!file || uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Letter…
                  </>
                ) : (
                  "Run OCR & Classification"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-sm text-gray-900">
                Classification Complete
              </span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>
                Outcome Code: <strong className="text-blue-600">{result.outcomeCode}</strong>
              </div>
              <div>
                Classifier Confidence:{" "}
                <strong>{Math.round(result.confidence * 100)}%</strong>
              </div>
              {result.needsReview && (
                <div className="p-2 rounded bg-amber-50 text-amber-800 text-xs border border-amber-200 mt-2">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Classification confidence is below 85%. This response has been queued for
                  expert staff review under our 1-business-day SLA.
                </div>
              )}
            </div>
            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}
