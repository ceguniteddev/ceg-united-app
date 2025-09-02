"use client";

import { useGetClientDocuments } from "@/hooks/documents";
import React from "react";

type Props = { userId: string };

const formatSize = (bytes: number) => (bytes ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : "—");

const DocumentsDisplay: React.FC<Props> = ({ userId }) => {
  const { documents, isLoading, error } = useGetClientDocuments(userId);

  if (isLoading) return <div className="p-4">Loading documents…</div>;
  if (error) return <div className="p-4 text-red-600">Failed to load.</div>;

  const items = documents?.items ?? [];
  if (items.length === 0) return <div className="p-4">No documents found.</div>;

  return (
    <div className="space-y-3 p-4">
      {items.map((d) => (
        <div key={d.path} className="flex items-center justify-between rounded-md border p-3">
          <div>
            <div className="font-medium">{d.name}</div>
            <div className="text-sm text-muted-foreground">
              {formatSize(d.size)} · {d.contentType ?? "unknown"} ·{" "}
              {d.updatedAt ? new Date(d.updatedAt).toLocaleString() : "—"}
            </div>
          </div>
          <a
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
          >
            Download
          </a>
        </div>
      ))}
    </div>
  );
};

export default DocumentsDisplay;
