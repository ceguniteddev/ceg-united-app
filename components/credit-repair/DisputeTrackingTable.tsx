import React, { useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  CheckCircle2,
  RefreshCw,
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
          return letter.trackingNumber ? (
            <a
              href={uspsTrackingUrl(letter.trackingNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10.5px] font-mono tabular-nums text-brand-700 hover:text-brand-800 hover:underline whitespace-nowrap"
            >
              {letter.trackingNumber}
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
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

      {/* Mobile cards remain using raw row data for simpler layout */}
      <div className="md:hidden divide-y divide-gray-100">
        {rows.map((row) => {
          const days = daysSince(row.submittedAt);
          const isDeleted = row.status === "deleted";
          return (
            <div
              key={`${row.itemId}-${row.agencyKey}`}
              className={`p-4 ${isDeleted ? "bg-emerald-50/40" : ""}`}
            >
              <div className="flex items-start gap-3">
                <ItemTypeIcon type={row.item.type} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm text-gray-900 truncate">
                      {row.item.creditor}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md border ${
                        STATUS_LABEL[row.status]?.tone ||
                        STATUS_LABEL["under-review"].tone
                      } shrink-0`}
                    >
                      {isDeleted && <CheckCircle2 className="w-3 h-3" />}
                      {STATUS_LABEL[row.status]?.label || row.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {row.agencyName} · Day {days} of 30
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
