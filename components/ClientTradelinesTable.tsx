"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShoppingCartIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  useMarkupPercentage,
  useUserRecentTradelines,
  USER_ALL_TRADELINES_KEY,
} from "@/hooks/tradelines";
import { ConfirmModal } from "@/components/confirm-modal";
import { purchaseTradeline } from "@/service/tradelines";
import { useAuth } from "@/provider/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
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
import Spinner from "./Spinner";

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

function formatCurrency(value: number | string | undefined | null): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    if (!/\d/.test(value)) return value;
    const num = Number(value.replace(/[^0-9.-]+/g, ""));
    if (isNaN(num)) return value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

const columnHelper = createColumnHelper<PricingItem>();

function ActionCell({
  item,
  markupPercentage,
  isPurchasing,
  onPurchase,
  recentTradelines,
}: {
  item: PricingItem;
  markupPercentage: number;
  isPurchasing: boolean;
  onPurchase: (item: PricingItem, quantity: number) => void;
  recentTradelines: any[];
}) {
  const [quantity, setQuantity] = useState<number>(1);
  const stock = Number(item.stock);
  const isOut = stock === 0;

  const hasPurchasedRecently = recentTradelines.some(
    (rt) => rt.card_id === item.card_id,
  );

  let formattedPrice = formatCurrency(item.price);
  const rawPrice = Number(item.price);
  let finalRawPrice = rawPrice;

  if (!isNaN(rawPrice)) {
    const markup = (rawPrice * markupPercentage) / 100;
    finalRawPrice = rawPrice + markup;
    formattedPrice = formatCurrency(finalRawPrice);
  }

  const grandTotal = formatCurrency(finalRawPrice * quantity);

  const descriptionNode = (
    <div className="space-y-2 mt-4 text-left">
      <div className="font-medium text-foreground">
        Are you sure you want to purchase the following tradeline?
      </div>
      <ul className="text-sm space-y-1 list-none p-0">
        <li>
          <span className="font-semibold text-foreground">Bank Name:</span>{" "}
          {item.bank_name}
        </li>
        <li>
          <span className="font-semibold text-foreground">Card ID:</span>{" "}
          {item.card_id}
        </li>
        <li>
          <span className="font-semibold text-foreground">Credit Limit:</span>{" "}
          {formatCurrency(item.credit_limit_original)}
        </li>
        <li>
          <span className="font-semibold text-foreground">Date Opened:</span>{" "}
          {item.date_opened}
        </li>
        <li>
          <span className="font-semibold text-foreground">Purchase By:</span>{" "}
          {item.purchase_deadline}
        </li>
        <li>
          <span className="font-semibold text-foreground">Reporting Date:</span>{" "}
          {item.reporting_period}
        </li>
        <li>
          <span className="font-semibold text-foreground">
            Available Stock:
          </span>{" "}
          <span
            className={
              stock === 0
                ? "text-red-500 font-medium"
                : "text-green-600 font-medium"
            }
          >
            {item.stock}
          </span>
        </li>
        <li className="pt-4 flex items-center space-x-3">
          <span className="font-semibold text-foreground">Quantity:</span>
          <Input
            type="number"
            min={1}
            max={stock > 0 ? stock : 1}
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (isNaN(val) || val < 1) {
                setQuantity(1);
              } else if (val > stock) {
                setQuantity(stock);
              } else {
                setQuantity(val);
              }
            }}
            className="w-24"
          />
        </li>
        <li className="pt-2 mt-2 border-t">
          <span className="font-semibold text-foreground">Total Price:</span>{" "}
          <span className="text-green-600 font-bold">{grandTotal}</span>
        </li>
      </ul>
    </div>
  );

  return (
    <ConfirmModal
      onConfirm={() => {
        onPurchase(item, quantity);
        setQuantity(1);
      }}
      description={descriptionNode}
    >
      <Button
        size="icon"
        variant="ghost"
        disabled={isOut || isPurchasing || hasPurchasedRecently}
        title={
          isOut
            ? "Out of Stock"
            : hasPurchasedRecently
              ? "Purchased recently (60 days)"
              : "Purchase"
        }
      >
        {isPurchasing ? (
          <Loader2Icon className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCartIcon className="h-4 w-4" />
        )}
      </Button>
    </ConfirmModal>
  );
}

export default function ClientTradelinesTable() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [purchasingId, setPurchasingId] = useState<string | number | null>(
    null,
  );

  const { markupPercentage } = useMarkupPercentage();
  const { recentTradelines, refetch: refetchRecent } = useUserRecentTradelines(
    user?.uid,
  );

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

  const handlePurchase = async (item: PricingItem, quantity: number) => {
    if (!user) {
      toast.error("You must be logged in to purchase.");
      return;
    }

    try {
      setPurchasingId(item.card_id);

      let formattedPrice = formatCurrency(item.price);
      let grandTotalFormatted = formatCurrency(item.price);
      const rawPrice = Number(item.price);
      if (!isNaN(rawPrice)) {
        const markup = (rawPrice * markupPercentage) / 100;
        formattedPrice = formatCurrency(rawPrice + markup);
        grandTotalFormatted = formatCurrency((rawPrice + markup) * quantity);
      }

      await purchaseTradeline(user.uid, {
        ...item,
        quantity,
        finalPrice: formattedPrice,
        grandTotal: grandTotalFormatted,
        status: "pending",
      });

      toast.success(
        `Purchase successfully recorded for ${item.bank_name} - ${item.card_id}`,
      );
      refetchRecent();
      queryClient.invalidateQueries({
        queryKey: [...USER_ALL_TRADELINES_KEY, user.uid],
      });
    } catch (err: any) {
      toast.error("Failed to process purchase: " + err.message);
    } finally {
      setPurchasingId(null);
    }
  };

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
        cell: (info) => formatCurrency(info.row.original.credit_limit_original),
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
      columnHelper.display({
        id: "final_price",
        header: "Price",
        cell: (info) => {
          const price = Number(info.row.original.price);
          if (isNaN(price)) return formatCurrency(info.row.original.price);
          const markup = (price * markupPercentage) / 100;
          return formatCurrency(price + markup);
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <ActionCell
            item={info.row.original}
            markupPercentage={markupPercentage}
            isPurchasing={purchasingId === info.row.original.card_id}
            onPurchase={handlePurchase}
            recentTradelines={recentTradelines}
          />
        ),
      }),
    ],
    [markupPercentage, purchasingId, user, recentTradelines],
  );

  const filteredItems = useMemo(() => {
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    return items.filter((item) => {
      // Find all purchases for this specific card_id

      const purchases = recentTradelines.filter(
        (rt) => rt.card_id === item.card_id,
      );

      // console.log(purchases);

      // If never purchased, it's available
      if (purchases.length === 0) return true;

      // Find the most recent purchase date for this card
      const mostRecentPurchaseMs = Math.max(
        ...purchases.map((rt) => new Date(rt.createdAt).getTime()),
      );

      // It is available if the most recent purchase was > 60 days ago
      return now - mostRecentPurchaseMs > sixtyDaysMs;
    });
  }, [items, recentTradelines]);

  const table = useReactTable({
    data: filteredItems,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      {loading && <Spinner displayText="Loading data..." />}
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
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {table.getRowModel().rows.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No data.
                </CardContent>
              </Card>
            ) : (
              table.getRowModel().rows.map((row) => {
                const mobileLabels: Record<string, string> = {
                  bank_name: "Bank Name",
                  card_id: "Card ID",
                  credit_limit: "Credit Limit",
                  date_opened: "Date Opened",
                  purchase_deadline: "Purchase By Date",
                  reporting_period: "Reporting Date",
                  stock: "Stock",
                  final_price: "Price",
                  actions: "Actions",
                };

                return (
                  <Card key={row.id}>
                    <CardContent className="p-4 flex flex-col gap-3">
                      {row.getVisibleCells().map((cell) => {
                        const columnId = cell.column.id;

                        if (columnId === "image") {
                          return null;
                        }

                        return (
                          <div
                            key={cell.id}
                            className="flex justify-between items-center py-2 border-b last:border-0 last:pb-0"
                          >
                            <span className="text-sm font-medium text-muted-foreground mr-4">
                              {mobileLabels[columnId] || columnId}
                            </span>
                            <span className="text-sm font-medium text-right break-words">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
          <DataTablePagination table={table} />
        </>
      )}
    </div>
  );
}
