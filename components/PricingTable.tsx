"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SaveIcon, Loader2Icon } from "lucide-react";
import {
  useMarkupPercentage,
  useSetMarkupPercentage,
} from "@/hooks/tradelines";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import SortableHeader from "@/components/SortableHeader";
import { DataTablePagination } from "@/components/funding/pagination";
import { NumberInput } from "./input-number";

interface PricingItem {
  image: string;
  bank_name: string;
  card_id: number | string;
  credit_limit: string;
  credit_limit_original: number | string;
  date_opened: string;
  date_opened_original: number | string;
  purchase_deadline: string;
  purchase_deadline_original: number | string;
  reporting_period: string;
  reporting_period_original: number | string;
  stock: number | string;
  price: number | string;
}

function stripHtml(html: string): string {
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, "");
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.textContent ?? el.innerText ?? html;
}

const columnHelper = createColumnHelper<PricingItem>();

export default function PricingTable() {
  const [items, setItems] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "price", desc: false },
  ]);

  const { markupPercentage, isLoading: isLoadingMarkup } =
    useMarkupPercentage();
  const { saveMarkup, isPending } = useSetMarkupPercentage();
  const [markupInput, setMarkupInput] = useState<number>(0);

  useEffect(() => {
    setMarkupInput(markupPercentage);
  }, [markupPercentage]);

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed: ${r.status}`);
        return r.json();
      })
      .then((data) => setItems(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const columns = useMemo(
    () => [
      columnHelper.accessor("image", {
        header: () => null,
        cell: (info) =>
          info.getValue() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={info.getValue()}
              alt={info.row.original.bank_name}
              style={{ width: 50 }}
            />
          ) : null,
        enableSorting: false,
      }),
      columnHelper.accessor("bank_name", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Bank Name" />
        ),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("card_id", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Card ID" />
        ),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("credit_limit_original", {
        id: "credit_limit",
        header: ({ column }) => (
          <SortableHeader column={column} title="Credit Limit" />
        ),
        cell: (info) => stripHtml(String(info.row.original.credit_limit)),
      }),
      columnHelper.accessor("date_opened_original", {
        id: "date_opened",
        header: ({ column }) => (
          <SortableHeader column={column} title="Date Opened" />
        ),
        cell: (info) => info.row.original.date_opened,
      }),
      columnHelper.accessor("purchase_deadline_original", {
        id: "purchase_deadline",
        header: ({ column }) => (
          <SortableHeader column={column} title="Purchase By Date" />
        ),
        cell: (info) => info.row.original.purchase_deadline,
      }),
      columnHelper.accessor("reporting_period_original", {
        id: "reporting_period",
        header: ({ column }) => (
          <SortableHeader column={column} title="Reporting Date" />
        ),
        cell: (info) => info.row.original.reporting_period,
      }),
      columnHelper.accessor("stock", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Stock" />
        ),
        cell: (info) => {
          const val = info.getValue();
          const isOut = Number(val) === 0;
          return (
            <span
              className={
                isOut
                  ? "text-red-500 font-medium"
                  : "text-green-600 font-medium"
              }
            >
              {val}
            </span>
          );
        },
      }),
      columnHelper.accessor("price", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Price" />
        ),
        cell: (info) => `$${info.getValue()}`,
      }),
      columnHelper.display({
        id: "final_price",
        header: "Final Price",
        cell: (info) => {
          const price = Number(info.row.original.price);
          if (isNaN(price)) return `$${info.row.original.price}`;
          const markup = (price * markupPercentage) / 100;
          return `$${(price + markup).toFixed(2)}`;
        },
      }),
    ],
    [markupPercentage],
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Pricing Table</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">
            Mark-up Percentage:
          </label>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <NumberInput
              className="w-14"
              value={markupInput}
              onChange={(e) => setMarkupInput(Number(e.target.value))}
              disabled={isLoadingMarkup || isPending}
              allowNegative={false}
              min={1}
            />
            <span className="text-sm font-medium">%</span>
            <Button
              size="sm"
              onClick={() => saveMarkup(markupInput)}
              disabled={isLoadingMarkup || isPending}
            >
              {isPending ? (
                <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <SaveIcon className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </div>
      </div>
      {loading && <p className="text-center text-gray-500">Loading…</p>}
      {error && <p className="text-center text-red-600">Error: {error}</p>}
      {!loading && !error && (
        <>
          <div className="rounded-md border hidden md:flex">
            <ScrollArea
              type="always"
              className="w-1 flex-1 h-[calc(100vh-280px)] min-h-[400px]"
            >
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="bg-gray-100">
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="whitespace-nowrap"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No data.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-gray-50">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="whitespace-nowrap"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" className="w-full" />
            </ScrollArea>
          </div>
          <DataTablePagination table={table} />
        </>
      )}
    </div>
  );
}
