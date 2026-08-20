import { useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createWalletCheckoutConfig } from "@/service/dodo";
import { DodoCheckoutView } from "@/components/funding/DodoCheckoutView";
import { GET_WALLET } from "@/constant/react-query-keys";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail?: string;
  onComplete?: () => void;
}

export function TopUpModal({
  isOpen,
  onClose,
  userId,
  onComplete,
}: TopUpModalProps) {
  const [selectedPack, setSelectedPack] = useState<number | "custom">(25);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isPurchasing, setIsPurchasing] = useState(false);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutSessionId, setCheckoutSessionId] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");

  const queryClient = useQueryClient();

  const packs = [
    { id: 15, label: "Standard Pack", price: 15, desc: "Good for 1-2 letters" },
    {
      id: 25,
      label: "Recommended Pack",
      price: 25,
      desc: "Best for 3 Certified letters",
      badge: "Most Popular",
    },
    { id: 50, label: "Pro Pack", price: 50, desc: "Multiple rounds" },
  ];

  const handleTopUp = async () => {
    const amount =
      selectedPack === "custom" ? parseFloat(customAmount) : selectedPack;
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    try {
      setIsPurchasing(true);
      const { checkoutId, url } = await createWalletCheckoutConfig({
        userId,
        amount: Math.round(amount * 100),
      });
      if (checkoutId) {
        setCheckoutSessionId(checkoutId);
        setCheckoutUrl(url || "");
        setIsCheckoutOpen(true);
      } else {
        throw new Error("Failed to generate checkout session");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate top up.");
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleCheckoutComplete = () => {
    toast.success(
      "Wallet top-up completed successfully! Your balance has been updated.",
    );
    setIsCheckoutOpen(false);
    setCheckoutSessionId("");
    setCheckoutUrl("");
    queryClient.invalidateQueries({ queryKey: [GET_WALLET, userId] });
    onComplete?.();
    onClose();
  };

  return (
    <>
      {/* Selection Modal */}
      {isOpen && !isCheckoutOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          {/* Background overlay with click-to-close */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={onClose}
          />

          {/* Modal Card */}
          <div className="relative bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-md w-full p-6 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 leading-none tracking-tight">
                Top Up Wallet
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                You need more funds in your wallet to send this letter. Choose a
                top-up amount below.
              </p>
            </div>

            <div className="space-y-3 py-2">
              {packs.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => setSelectedPack(pack.id)}
                  type="button"
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    selectedPack === pack.id
                      ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">
                        ${pack.price}
                      </span>
                      {pack.badge && (
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {pack.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {pack.desc}
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedPack === pack.id
                        ? "border-brand-600"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedPack === pack.id && (
                      <div className="w-2 h-2 rounded-full bg-brand-600" />
                    )}
                  </div>
                </button>
              ))}

              <button
                onClick={() => setSelectedPack("custom")}
                type="button"
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  selectedPack === "custom"
                    ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div>
                  <div className="font-bold text-gray-900">Custom Amount</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Enter your own amount
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedPack === "custom"
                      ? "border-brand-600"
                      : "border-gray-300"
                  }`}
                >
                  {selectedPack === "custom" && (
                    <div className="w-2 h-2 rounded-full bg-brand-600" />
                  )}
                </div>
              </button>

              {selectedPack === "custom" && (
                <div className="pt-2 pl-1">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Enter Amount ($)
                  </label>
                  <Input
                    type="number"
                    min="5"
                    step="1"
                    placeholder="0.00"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
              <button
                onClick={onClose}
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTopUp}
                disabled={isPurchasing}
                type="button"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-sm font-bold transition-colors shadow-sm cursor-pointer"
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Confirm Top Up</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Sheet */}
      <Sheet
        open={isCheckoutOpen}
        onOpenChange={(open) => {
          setIsCheckoutOpen(open);
          if (!open) {
            setCheckoutSessionId("");
            setCheckoutUrl("");
            onClose();
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl p-0 flex flex-col gap-0 overflow-hidden z-[80]"
        >
          <SheetHeader className="px-6 py-4 border-b border-gray-200 flex flex-row items-center justify-between space-y-0">
            <div>
              <SheetTitle className="text-xl font-bold">
                Secure Checkout
              </SheetTitle>
              <SheetDescription className="hidden sm:block text-gray-500 mt-1">
                Please complete your top-up payment using the secure Dodo
                checkout form below.
              </SheetDescription>
            </div>
            {checkoutUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(checkoutUrl, "_blank")}
                className="text-xs flex items-center gap-1.5 shrink-0 bg-white"
              >
                Open in New Tab ↗
              </Button>
            )}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 relative">
            {checkoutSessionId && (
              <DodoCheckoutView
                checkoutId={checkoutSessionId}
                checkoutDetails={{
                  url: checkoutUrl,
                  checkout_url: checkoutUrl,
                  amount: Math.round(
                    (selectedPack === "custom"
                      ? Number(customAmount)
                      : selectedPack) * 100,
                  ),
                }}
                onComplete={handleCheckoutComplete}
              />
            )}
          </div>
          {checkoutUrl && (
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-gray-500 text-center sm:text-left">
                Having trouble with the secure form? You can complete payment in
                a new window.
              </span>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-center gap-1 shrink-0"
                onClick={() =>
                  window.open(checkoutUrl, "_blank", "noopener,noreferrer")
                }
              >
                Open in New Tab <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
