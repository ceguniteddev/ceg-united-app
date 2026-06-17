import React, { useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  CheckCircle2,
  Eye,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Mail,
} from "lucide-react";
import type {
  GeneratedLetter,
  NegativeItem,
  NegativeItemStatus,
} from "@/lib/credit-repair/credit-repair-types";
import { uspsTrackingUrl } from "@/lib/credit-repair/lobMailing";
import { ItemTypeIcon, getTypeLabel } from "./ItemTypeIcon";

export interface TrackingRow {
  itemId: string;
  item: NegativeItem;
  agencyKey: string;
  agencyName: string;
  letter: GeneratedLetter;
  status: NegativeItemStatus | "submitted" | "under-review";
  submittedAt: string;
  lastUpdatedAt: string;
}

interface Props {
  rows: TrackingRow[];
  onView: (row: TrackingRow) => void;
  onEscalate: (row: TrackingRow) => void;
}

const STATUS_LABEL: Record<
  string,
  { label: string; tone: string; icon?: any }
> = {
  submitted: {
    label: "Submitted",
    tone: "bg-gray-100 text-gray-700 border-gray-200",
  },
  "under-review": {
    label: "Under Review",
    tone: "bg-brand-50 text-brand-700 border-brand-100",
  },
  verified: {
    label: "Verified",
    tone: "bg-amber-50 text-amber-700 border-amber-100",
  },
  updated: {
    label: "Updated",
    tone: "bg-violet-50 text-violet-700 border-violet-100",
  },
  deleted: {
    label: "Deleted",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
};

function daysSince(iso: string): number {
  return Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );
}

const columnHelper = createColumnHelper<TrackingRow>();

export function DisputeTrackingTable({ rows, onView, onEscalate }: Props) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("item", {
        header: "Item",
        cell: (info) => {
          const item = info.getValue();
          return (
            <div className="flex items-center gap-3">
              <ItemTypeIcon type={item.type} size="sm" />
              <div className="min-w-0">
                <div className="font-semibold text-sm text-gray-900 truncate">
                  {item.creditor}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {getTypeLabel(item.type)} · {item.accountNumber}
                </div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("agencyName", {
        header: "Agency",
        cell: (info) => (
          <span className="text-sm text-gray-700">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const status = info.getValue();
          const row = info.row.original;
          const isDeleted = status === "deleted";
          return (
            <div>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md border ${
                  STATUS_LABEL[status]?.tone ||
                  STATUS_LABEL["under-review"].tone
                }`}
              >
                {isDeleted && <CheckCircle2 className="w-3 h-3" />}
                {STATUS_LABEL[status]?.label || status}
              </span>
              {row.letter.mailedAt && (
                <div className="mt-1">
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700">
                    <Mail className="w-2.5 h-2.5" />
                    Mailed
                  </span>
                </div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("letter", {
        header: "Tracking",
        cell: (info) => {
          const letter = info.getValue();
          const isMailed = !!letter.mailedAt;
          const hasTracking = !!letter.trackingNumber;

          if (hasTracking) {
            return (
              <a
                href={uspsTrackingUrl(letter.trackingNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10.5px] font-mono tabular-nums text-brand-700 hover:text-brand-800 hover:underline whitespace-nowrap"
              >
                {letter.trackingNumber}
                <ExternalLink className="w-3 h-3" />
              </a>
            );
          }

          if (isMailed) {
            return (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                First-Class (No Tracking)
              </span>
            );
          }

          return (
            <span className="text-[11px] text-gray-400 italic">Not mailed</span>
          );
        },
      }),
      columnHelper.accessor("submittedAt", {
        header: "Days / Deadline",
        cell: (info) => {
          const submittedAt = info.getValue();
          const status = info.row.original.status;
          const days = daysSince(submittedAt);
          const remaining = Math.max(0, 30 - days);
          const isDeleted = status === "deleted";
          const isVerified = status === "verified";
          const isUpdated = status === "updated";
          return (
            <div>
              <div className="font-mono tabular-nums text-gray-900">
                Day {days} of 30
              </div>
              {!isDeleted && !isVerified && !isUpdated && (
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {remaining} days remaining
                </div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("lastUpdatedAt", {
        header: "Last Update",
        cell: (info) => (
          <span className="text-xs text-gray-600">
            {new Date(info.getValue()).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        ),
      }),
      columnHelper.display({
        id: "action",
        header: () => <div className="text-right">Action</div>,
        cell: (info) => {
          const row = info.row.original;
          const isVerified = row.status === "verified";
          return (
            <div className="flex items-center justify-end gap-2">
              {isVerified && (
                <button
                  onClick={() => onEscalate(row)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold transition-colors"
                >
                  <AlertTriangle className="w-3 h-3" />
                  Escalate
                </button>
              )}
              <button
                onClick={() => onView(row)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                aria-label="View letter"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        },
      }),
    ],
    [onEscalate, onView],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-10 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="text-base font-bold text-gray-900">
          No active disputes yet
        </div>
        <div className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
          Once you mark letters as sent, each dispute lands here with a 30-day
          countdown.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="text-left bg-gray-50 border-b border-gray-100"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const status = row.original.status;
              const isDeleted = status === "deleted";
              const isUpdated = status === "updated";

              return (
                <tr
                  key={row.id}
                  className={`border-b border-gray-50 last:border-0 transition-colors ${
                    isDeleted
                      ? "bg-emerald-50/40 animate-fade-in"
                      : isUpdated
                        ? "bg-amber-50/30"
                        : "hover:bg-gray-50/60"
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3.5">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden p-4 space-y-4 bg-gray-50/50">
        {rows.map((row) => {
          const days = daysSince(row.submittedAt);
          const remaining = Math.max(0, 30 - days);
          const isDeleted = row.status === "deleted";
          const isVerified = row.status === "verified";
          const isUpdated = row.status === "updated";

          return (
            <div
              key={`${row.itemId}-${row.agencyKey}`}
              className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${
                isDeleted
                  ? "border-emerald-100/50 ring-1 ring-inset ring-emerald-50"
                  : ""
              }`}
            >
              <div className={`p-4 ${isDeleted ? "bg-emerald-50/20" : ""}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ItemTypeIcon type={row.item.type} size="sm" />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-gray-900 truncate">
                        {row.item.creditor}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{getTypeLabel(row.item.type)}</span>
                        <span className="text-gray-300">•</span>
                        <span className="font-mono text-[10px]">
                          {row.item.accountNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md border ${
                        STATUS_LABEL[row.status]?.tone ||
                        STATUS_LABEL["under-review"].tone
                      }`}
                    >
                      {isDeleted && <CheckCircle2 className="w-3 h-3" />}
                      {STATUS_LABEL[row.status]?.label || row.status}
                    </span>
                    {row.letter.mailedAt && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700">
                        <Mail className="w-2.5 h-2.5" />
                        Mailed
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-4 py-3 border-t border-gray-50">
                  <div>
                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                      Agency
                    </div>
                    <div className="text-xs font-medium text-gray-700">
                      {row.agencyName}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                      Tracking
                    </div>
                    {row.letter.trackingNumber ? (
                      <a
                        href={uspsTrackingUrl(row.letter.trackingNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono text-brand-600 hover:text-brand-800"
                      >
                        {row.letter.trackingNumber}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <div className="text-xs text-gray-400 italic">
                        Not mailed
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                      Timeline
                    </div>
                    <div className="text-xs text-gray-700">
                      Day {days} of 30
                      {!isDeleted && !isVerified && !isUpdated && (
                        <span className="text-gray-400 ml-1">
                          ({remaining} left)
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                      Last Update
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(row.lastUpdatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-50 flex items-center justify-end gap-2">
                  {isVerified && (
                    <button
                      onClick={() => onEscalate(row)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors flex-1 justify-center"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Escalate
                    </button>
                  )}
                  <button
                    onClick={() => onView(row)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold transition-colors flex-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
