"use client";

import Image from "next/image";
import { useUserDocumentsQuery } from "@/hooks/user";
import Spinner from "@/components/Spinner";

export default function DocumentsPage() {
  const { userDocuments, isLoading } = useUserDocumentsQuery();

  if (isLoading) return <Spinner displayText="Loading documents..." />;
  if (!userDocuments?.length) return <div className="p-6">No documents found.</div>;

  return (
    <main className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {userDocuments.map((doc) => (
        <article key={doc.path} className="rounded-2xl border shadow p-4">
          <header className="mb-2">
            <h2 className="font-semibold break-words">{doc.name}</h2>
            <p className="text-sm opacity-70">
              {doc.contentType ?? "unknown"} • {(doc.size / 1024).toFixed(1)} KB
            </p>
          </header>

          {doc.contentType?.startsWith("image/") ? (
            <Image
              src={doc.signedUrl}
              alt={doc.name}
              className="w-full h-48 object-cover rounded-lg"
            />
          ) : doc.contentType === "application/pdf" ? (
            <iframe src={doc.signedUrl} className="w-full h-48 rounded-lg" title={doc.name} />
          ) : (
            <div className="text-sm opacity-70">Preview unavailable</div>
          )}

          <footer className="mt-3 flex gap-3">
            <a
              href={doc.signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl border"
            >
              View
            </a>
          </footer>
        </article>
      ))}
    </main>
  );
}
