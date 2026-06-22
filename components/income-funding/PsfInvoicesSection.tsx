import { useState } from "react";
import { formatUSD } from "@/lib/underwriting";
import {
  useUserPsfInvoicesQuery,
  useSignPsfInvoiceMutation,
} from "@/hooks/psf-invoices";
import { useAuth } from "@/provider/AuthContext";
import { PsfInvoice } from "@/schema/psf-invoice";
import {
  AlertCircle,
  CheckCircle2,
  FileSignature,
  CreditCard,
  Building,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { PsfAcceptanceView } from "./PsfAcceptanceView";

export function PsfInvoicesSection() {
  const { user } = useAuth();
  const { data: invoices = [], isLoading } = useUserPsfInvoicesQuery(
    user?.uid || "",
  );
  const signMutation = useSignPsfInvoiceMutation(user?.uid || "");
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

  if (activeInvoices.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 md:p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
          <FileSignature className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          No Invoices Found
        </h3>
        <p className="text-gray-500 max-w-md">
          You do not have any pending or settled Performance Success Fee
          invoices at this time.
        </p>
      </div>
    );
  }

  const hasPending = activeInvoices.some((inv) => inv.status === "pending");

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

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        {/* Header */}
        <div
          className={`p-5 md:p-6 border-b border-gray-100 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4 ${hasPending ? "bg-amber-50/50" : "bg-gray-50/30"}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${hasPending ? "bg-amber-100 text-amber-600" : "bg-blue-50 text-blue-600"}`}
            >
              {hasPending ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <FileSignature className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Performance Success Fee Invoices
              </h2>
              <p className="text-sm text-gray-500">
                {hasPending
                  ? "You have invoices awaiting your signature and payment."
                  : "View your success fee invoices and payment status."}
              </p>
            </div>
          </div>
        </div>

        {/* Invoice List */}
        <div className="divide-y divide-gray-100">
          {activeInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors"
            >
              <div className="space-y-4 md:space-y-0 md:flex md:items-center md:gap-8 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Building className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {invoice.bankName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Ref: {invoice.referenceNumber}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-8">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Approved Amount
                    </p>
                    <p className="font-medium text-gray-900">
                      {formatUSD(invoice.approvedAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Success Fee</p>
                    <p className="font-semibold text-blue-600">
                      {formatUSD(invoice.successFeeAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <StatusBadge status={invoice.status} />

                {invoice.status === "pending" && (
                  <button
                    onClick={() => setSelectedInvoice(invoice)}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FileSignature className="w-4 h-4" />
                    Sign and Settle Fee
                  </button>
                )}

                {invoice.status === "signed" && invoice.whopCheckoutUrl && (
                  <button
                    onClick={() =>
                      window.open(invoice.whopCheckoutUrl, "_blank")
                    }
                    className="w-full sm:w-auto px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Complete Payment on Whop
                  </button>
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
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog
        open={!!selectedInvoice}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
      >
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-gray-50/50">
          <VisuallyHidden>
            <DialogTitle>Sign Performance Success Fee</DialogTitle>
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

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200/50">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Awaiting Signature
        </span>
      );
    case "signed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium border border-yellow-200/50">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
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
