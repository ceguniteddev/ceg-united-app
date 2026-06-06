import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DocCheckRow } from "./AttachDocumentsStep";
import UploadFile from "@/components/UploadFileV2";

interface Props {
  userId: string;
  docs: any[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onPreview: (doc: any) => void;
  onDelete: (doc: any) => void;
}

export function DocumentLibraryPicker({
  userId,
  docs,
  selectedIds,
  onToggle,
  onPreview,
  onDelete,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((d) => {
      const rawName = d.name.split("/").pop() || "";
      return rawName.toLowerCase().includes(q);
    });
  }, [docs, query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your library…"
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-colors"
        />
      </div>

      <div className="border border-dashed border-gray-200 bg-gray-50 rounded-xl p-4">
        <UploadFile
          userId={userId}
          titleOverride="Upload New Document"
          descriptionOverride="Upload a file from your computer (PDF or Image only)"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-6 px-4">
          <div className="text-sm font-semibold text-gray-700">
            No documents found
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
          {filtered.map((d) => (
            <DocCheckRow
              key={d.path}
              doc={d}
              checked={selectedIds.includes(d.path)}
              onToggle={() => onToggle(d.path)}
              onDelete={() => onDelete(d)}
              onPreview={() => onPreview(d)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
