import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatUSD } from "@/lib/underwriting";
import {
  useUserPsfInvoicesQuery,
  useSignPsfInvoiceMutation,
  useSendPsfInvoiceMutation,
} from "@/hooks/psf-invoices";
import { PsfInvoice } from "@/schema/psf-invoice";
import {
  CheckCircle2,
  FileSignature,
  CreditCard,
  Building,
  Loader2,
  Plus,
  FilePenLine,
  Send,
  CalendarClock,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { PsfAcceptanceView } from "./PsfAcceptanceView";
import { Button } from "../ui/button";

/** Format currency with 2 decimal places for invoice items */
function formatInvoiceUSD(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface PsfInvoicesSectionProps {
  userId: string;
  /** When true, shows admin-only controls like "Send Custom Invoice" */
  isAdminView?: boolean;
}

export function PsfInvoicesSection({
  userId,
  isAdminView = false,
}: PsfInvoicesSectionProps) {
  const { data: invoices = [], isLoading } = useUserPsfInvoicesQuery(userId);
  const router = useRouter();
  const signMutation = useSignPsfInvoiceMutation(userId);
  const sendMutation = useSendPsfInvoiceMutation(userId);
  const [selectedInvoice, setSelectedInvoice] = useState<PsfInvoice | null>(
    null,
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-card">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="mt-4 text-sm text-gray-500 font-medium">
          Loading invoices...
        </p>
      </div>
    );
  }

  // Filter out voided invoices
  const activeInvoices = invoices.filter((inv) => inv.status !== "void");

  const hasPending = activeInvoices.some((inv) => inv.status === "pending");
  const hasCustomInvoices = activeInvoices.some((inv) => inv.type === "custom");

  const handleSign = async (signature: any) => {
    if (!selectedInvoice) return;
    await signMutation.mutateAsync({
      invoiceId: selectedInvoice.id!,
      signature,
      ipAddress: signature.ipAddress,
    });
    // Delay slightly to show success state before closing
    setTimeout(() => {
      setSelectedInvoice(null);
    }, 2000);
  };

  const handleSend = async (invoiceId: string) => {
    await sendMutation.mutateAsync({ invoiceId });
  };

  const emptyState = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 md:p-12 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
        <FileSignature className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        No Invoices Found
      </h3>
      <p className="text-gray-500 max-w-md">
        You do not have any pending or settled Performance Success Fee invoices
        at this time.
      </p>
      {isAdminView && (
        <Button
          onClick={() =>
            router.push(`/admin/clients/${userId}/invoices/create`)
          }
          className="mt-6 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Send Custom Invoice
        </Button>
      )}
    </div>
  );

  return (
    <>
      {activeInvoices.length === 0 ? (
        emptyState
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          {/* Header */}
          <div
            className={`p-5 md:p-6 border-b border-gray-100 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4 ${hasPending ? "bg-blue-50/30" : "bg-gray-50/30"}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <FileSignature className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {hasCustomInvoices
                    ? "Invoices"
                    : "Performance Success Fee Invoices"}
                </h2>
                <p className="text-sm text-gray-500">
                  View and pay your invoices to proceed with your funding.
                </p>
              </div>
            </div>
            {isAdminView && (
              <Button
                onClick={() =>
                  router.push(`/admin/clients/${userId}/invoices/create`)
                }
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Send Custom Invoice
              </Button>
            )}
          </div>

          {/* Invoice List */}
          <div className="divide-y divide-gray-100">
            {activeInvoices.map((invoice) => (
              <InvoiceRow
                key={invoice.id}
                invoice={invoice}
                isAdminView={isAdminView}
                onSign={() => setSelectedInvoice(invoice)}
                onSend={handleSend}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sign Dialog */}
      <Dialog
        open={!!selectedInvoice}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
      >
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-gray-50/50">
          <VisuallyHidden>
            <DialogTitle>Sign Invoice</DialogTitle>
          </VisuallyHidden>
          {selectedInvoice && (
            <div className="p-6 md:p-8 max-h-[85vh] overflow-y-auto">
              <PsfAcceptanceView
                invoice={selectedInvoice}
                onAccept={handleSign}
                isSubmitting={signMutation.isPending}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Renders a single invoice row, handling both PSF and custom types */
function InvoiceRow({
  invoice,
  isAdminView = false,
  onSign,
  onSend,
}: {
  invoice: PsfInvoice;
  isAdminView?: boolean;
  onSign: () => void;
  onSend: (invoiceId: string) => void;
}) {
  const isCustom = invoice.type === "custom";
  const [expanded, setExpanded] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const displayTitle = isCustom
    ? invoice.title || "Custom Invoice"
    : invoice.bankName || "Unknown Bank";
  const displayAmount = isCustom
    ? (invoice.amount ?? 0)
    : (invoice.successFeeAmount ?? 0);
  const secondaryAmount = isCustom ? undefined : invoice.approvedAmount;
  const secondaryLabel = isCustom ? undefined : "Approved Amount";
  const Icon = isCustom ? FilePenLine : Building;

  const hasItems = isCustom && (invoice.items?.length ?? 0) > 0;

  return (
    <div className="flex flex-col hover:bg-gray-50/20 transition-colors divide-y divide-gray-100/50">
      <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4 md:space-y-0 md:flex md:items-center md:gap-8 flex-1">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCustom ? "bg-amber-50" : "bg-gray-100"}`}
            >
              <Icon
                className={`w-5 h-5 ${isCustom ? "text-amber-600" : "text-gray-500"}`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">{displayTitle}</p>
                {isCustom && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
                    Custom
                  </span>
                )}
              </div>
              {hasItems ? (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 font-normal">
                    {invoice.items?.[0]?.description}
                    {invoice.description && ` — ${invoice.description}`}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded(!expanded);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium underline flex items-center gap-1 cursor-pointer"
                  >
                    {expanded
                      ? "Hide items"
                      : `View ${invoice.items?.length ?? 0} items`}
                  </button>
                </div>
              ) : (
                isCustom &&
                invoice.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {invoice.description}
                  </p>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:items-center gap-4 md:gap-8">
            {secondaryAmount !== undefined && secondaryLabel && (
              <div>
                <p className="text-xs text-gray-500 mb-1">{secondaryLabel}</p>
                <p className="font-medium text-gray-900">
                  {formatUSD(secondaryAmount)}
                </p>
              </div>
            )}
            {invoice.invoiceDate && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Invoice Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(invoice.invoiceDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {isCustom ? "Amount Due" : "Success Fee"}
              </p>
              <p className="font-semibold text-blue-600">
                {hasItems ? (
                  <span>
                    {invoice.items?.length ?? 0} item
                    {(invoice.items?.length ?? 0) > 1 ? "s" : ""} &middot;{" "}
                    {formatInvoiceUSD(displayAmount)}
                  </span>
                ) : (
                  formatInvoiceUSD(displayAmount)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <StatusBadge status={invoice.status} />

          {isAdminView ? (
            <>
              {/* Admin view: no Sign button, use Send instead */}
              {invoice.status === "pending" && !invoice.sentAt && (
                <button
                  onClick={async () => {
                    setIsSending(true);
                    try {
                      await onSend(invoice.id!);
                    } finally {
                      setIsSending(false);
                    }
                  }}
                  disabled={isSending}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Invoice
                    </>
                  )}
                </button>
              )}

              {invoice.status === "pending" && invoice.sentAt && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>
                    Sent:{" "}
                    {new Date(invoice.sentAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}

              {invoice.status === "signed" && invoice.whopCheckoutUrl && (
                <>
                  {invoice.sentAt && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>
                        Sent:{" "}
                        {new Date(invoice.sentAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  <Button
                    onClick={() =>
                      window.open(invoice.whopCheckoutUrl!, "_blank")
                    }
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Complete Payment
                  </Button>
                </>
              )}

              {invoice.status === "paid" && (
                <button
                  disabled
                  className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Settled
                </button>
              )}
            </>
          ) : (
            <>
              {/* Client view: existing Sign/Settle/Pay flow */}
              {invoice.status === "pending" && (
                <button
                  onClick={onSign}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FileSignature className="w-4 h-4" />
                  Sign and Settle Fee
                </button>
              )}

              {invoice.status === "signed" && invoice.whopCheckoutUrl && (
                <Button
                  onClick={() =>
                    window.open(invoice.whopCheckoutUrl!, "_blank")
                  }
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Complete Payment
                </Button>
              )}

              {invoice.status === "paid" && (
                <button
                  disabled
                  className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Settled
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Expanded Items Section */}
      {hasItems && expanded && (
        <div className="px-5 pb-5 md:px-12 md:pb-6 pt-2 bg-gray-50/30 animate-fade-in">
          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Itemized Breakdown
            </p>
            <div className="divide-y divide-gray-100">
              {invoice.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="py-2.5 flex items-center justify-between text-sm"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-gray-800">
                      {item.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      Qty {item.quantity} &times; {formatInvoiceUSD(item.rate)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatInvoiceUSD(item.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200/50">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Awaiting Signature
        </span>
      );
    case "signed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200/50">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Signed - Unpaid
        </span>
      );
    case "paid":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200/50">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Paid
        </span>
      );
    default:
      return null;
  }
}
