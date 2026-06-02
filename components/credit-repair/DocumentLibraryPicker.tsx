import { useMemo, useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Search,
  Upload,
  Check,
  Plus,
} from "lucide-react";
import {
  CATEGORY_LABEL,
  formatFileSize,
  formatUploadDate,
  MOCK_USER_DOCUMENTS,
  type DocumentCategory,
  type MyDocument,
} from "@/lib/credit-repair/myDocuments";

// ============================================
// DocumentLibraryPicker
// ============================================
// The "From My Documents Library" section of Step A. Shows uploaded files
// in a responsive grid with search + category filters. Selection is
// controlled — parent owns the selected-id state.

interface Props {
  selectedIds: string[];
  onToggle: (id: string) => void;
}

const FILTERS: { key: "all" | DocumentCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "identity", label: "Identity" },
  { key: "address", label: "Address" },
  { key: "financial", label: "Financial" },
  { key: "other", label: "Other" },
];

export function DocumentLibraryPicker({ selectedIds, onToggle }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | DocumentCategory>("all");
  // Locally append "uploaded" docs when user clicks the simulated upload CTA.
  const [docs, setDocs] = useState<MyDocument[]>(MOCK_USER_DOCUMENTS);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) => {
      if (
        filter !== "all" &&
        d.category !== filter &&
        !(filter === "other" && d.category === "legal")
      ) {
        return false;
      }
      if (!q) return true;
      return (
        d.filename.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [docs, filter, query]);

  const handleSimulatedUpload = () => {
    const next: MyDocument = {
      id: `doc-uploaded-${Date.now()}`,
      filename: `new-document-${docs.length + 1}.pdf`,
      sizeBytes: 524_288,
      mimeType: "application/pdf",
      category: "other",
      uploadedAt: new Date().toISOString(),
      tags: ["new"],
    };
    setDocs((prev) => [next, ...prev]);
    onToggle(next.id);
  };

  return (
    <div>
      {/* Search + Upload row */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-colors"
          />
        </div>
        <button
          onClick={handleSimulatedUpload}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-dashed border-brand-300 hover:border-brand-500 hover:bg-brand-50/40 text-brand-700 text-xs font-semibold transition-colors shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload New Document
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Document grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-gray-200 bg-gray-50">
          <div className="text-sm font-semibold text-gray-700">
            No documents match your filter
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Try a different search term, or upload a new document.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filtered.map((d) => {
            const isSelected = selectedIds.includes(d.id);
            const isImage = d.mimeType.startsWith("image/");
            return (
              <button
                key={d.id}
                onClick={() => onToggle(d.id)}
                className={`group relative text-left rounded-xl border p-3 transition-all ${
                  isSelected
                    ? "border-brand-500 bg-brand-50/50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isImage
                        ? "bg-violet-50 text-violet-700"
                        : "bg-brand-50 text-brand-700"
                    }`}
                  >
                    {isImage ? (
                      <ImageIcon className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-gray-900 truncate">
                      {d.filename}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {formatFileSize(d.sizeBytes)} ·{" "}
                      {formatUploadDate(d.uploadedAt)}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {CATEGORY_LABEL[d.category]}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-brand-600 border-brand-600 text-white"
                        : "border-gray-300 bg-white group-hover:border-gray-400"
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Plus className="w-3 h-3 text-transparent" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
