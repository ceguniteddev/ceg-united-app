"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/provider/AuthContext";
import { useWalletQuery, WalletTransaction } from "@/hooks/wallet";
import { createWalletCheckoutConfig } from "@/service/dodo";
import { DodoCheckoutView } from "@/components/funding/DodoCheckoutView";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/forms/input-number";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Info,
  ShoppingCart,
  CheckCircle2,
} from "lucide-react";
import IconMenu from "@/components/icon-menu";
import EmptyState from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useQueryClient } from "@tanstack/react-query";
import { GET_WALLET } from "@/constant/react-query-keys";

// Set to true to view gorgeous mock transaction data, or false to use live Firestore data
const USE_MOCK_DATA = false;

const MOCK_TRANSACTION_TEMPLATES = [
  {
    description: "Wallet Top-up via Dodo Payments",
    type: "credit" as const,
    amount: 50.0,
  },
  {
    description: "Mailed letter to Experian (Certified Mail)",
    type: "debit" as const,
    amount: 7.0,
  },
  {
    description: "Mailed letter to Equifax (First-Class Mail)",
    type: "debit" as const,
    amount: 1.95,
  },
  {
    description:
      "Mailed letter to TransUnion (Certified Mail + Return Receipt)",
    type: "debit" as const,
    amount: 11.5,
  },
  {
    description: "Wallet Top-up via Dodo Payments",
    type: "credit" as const,
    amount: 25.0,
  },
  {
    description: "Mailed letter to Experian (First-Class Mail)",
    type: "debit" as const,
    amount: 1.95,
  },
  {
    description: "Mailed letter to TransUnion (Certified Mail)",
    type: "debit" as const,
    amount: 7.0,
  },
  {
    description: "Mailed letter to Equifax (Certified Mail + Return Receipt)",
    type: "debit" as const,
    amount: 11.5,
  },
  {
    description: "Wallet Top-up via Dodo Payments",
    type: "credit" as const,
    amount: 15.0,
  },
  {
    description: "Mailed letter to LexisNexis (Certified Mail)",
    type: "debit" as const,
    amount: 7.0,
  },
  {
    description: "Mailed letter to Innovis (First-Class Mail)",
    type: "debit" as const,
    amount: 1.95,
  },
];

const MOCK_TRANSACTIONS: WalletTransaction[] = Array.from(
  { length: 50 },
  (_, i) => {
    const template =
      MOCK_TRANSACTION_TEMPLATES[i % MOCK_TRANSACTION_TEMPLATES.length];
    let amount = template.amount;
    if (template.description === "Wallet Top-up via Dodo Payments") {
      const packages = [15.0, 25.0, 50.0, 100.0];
      amount = packages[(i + 3) % packages.length];
    }

    return {
      id: `mock-txn-${i}`,
      description: template.description,
      type: template.type,
      amount: amount,
      timestamp: new Date(Date.now() - i * 6.5 * 3600 * 1000).toISOString(),
    };
  },
);

const PACKAGES = [
  { id: "starter", name: "Starter", amount: 15, tag: null },
  { id: "standard", name: "Standard", amount: 25, tag: "Popular" },
  { id: "pro", name: "Pro", amount: 50, tag: "Best Value" },
  { id: "custom", name: "Custom Amount", amount: 0, tag: null },
];

const parseDate = (ts: any) => {
  if (!ts) return new Date();
  if (typeof ts === "string") return new Date(ts);
  if (ts._seconds) return new Date(ts._seconds * 1000);
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date();
};

export default function WalletPage() {
  const queryClient = useQueryClient();
  const { userData, loading: authLoading } = useAuth();
  const { data: wallet, isLoading: walletLoading } = useWalletQuery(
    userData?.id || "",
  );

  const displayBalance = USE_MOCK_DATA ? 185.25 : wallet?.balance || 0;
  const displayTransactions = USE_MOCK_DATA
    ? MOCK_TRANSACTIONS
    : wallet?.transactions || [];
  const displayWalletLoading = USE_MOCK_DATA ? false : walletLoading;

  const [selectedPackage, setSelectedPackage] = useState<string>("standard");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);
  const [isPollingBalance, setIsPollingBalance] = useState(false);
  const [lastPurchasedAmount, setLastPurchasedAmount] = useState<number>(0);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string>("");
  const [checkoutUrl, setCheckoutUrl] = useState("");

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialBalanceRef = useRef<number>(0);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleCheckoutComplete = useCallback(
    (paymentId?: string) => {
      setIsCheckoutSuccess(true);
      setIsPollingBalance(true);

      const startBalance = initialBalanceRef.current;
      const targetMinBalance = startBalance + lastPurchasedAmount;
      let attempts = 0;
      const maxAttempts = 15; // 15 attempts * 1.5s = ~22.5 seconds max

      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }

      // Start polling for webhook to update Firestore balance
      pollingTimerRef.current = setInterval(async () => {
        attempts += 1;
        try {
          const res = await queryClient.fetchQuery({
            queryKey: [GET_WALLET, userData?.id],
          });
          const currentBalance = (res as any)?.balance || 0;
          const transactions = (res as any)?.transactions || [];
          const hasNewTx = paymentId
            ? transactions.some((t: any) => t.paymentId === paymentId)
            : false;

          if (
            currentBalance >= targetMinBalance ||
            hasNewTx ||
            attempts >= maxAttempts
          ) {
            if (pollingTimerRef.current) {
              clearInterval(pollingTimerRef.current);
              pollingTimerRef.current = null;
            }
            setIsPollingBalance(false);
            if (currentBalance >= targetMinBalance || hasNewTx) {
              toast.success("Wallet balance updated!");
            }
          }
        } catch {
          if (attempts >= maxAttempts) {
            if (pollingTimerRef.current) {
              clearInterval(pollingTimerRef.current);
              pollingTimerRef.current = null;
            }
            setIsPollingBalance(false);
          }
        }
      }, 1500);

      // Auto close the Sheet after brief celebration
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      closeTimeoutRef.current = setTimeout(() => {
        setIsCheckoutOpen(false);
        setIsCheckoutSuccess(false);
        setCheckoutSessionId("");
      }, 2200);
    },
    [lastPurchasedAmount, queryClient, userData?.id],
  );

  if (authLoading) {
    return (
      <div className="flex flex-col gap-6 w-full h-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6 pb-28">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!userData) return null;

  const handlePurchase = async () => {
    let finalAmount = 0;
    if (selectedPackage === "custom") {
      finalAmount = parseFloat(customAmount);
      if (isNaN(finalAmount) || finalAmount < 5) {
        toast.error("Please enter a valid amount (minimum $5).");
        return;
      }
    } else {
      const pkg = PACKAGES.find((p) => p.id === selectedPackage);
      if (pkg) finalAmount = pkg.amount;
    }

    if (finalAmount <= 0) return;

    try {
      setIsPurchasing(true);
      setLastPurchasedAmount(finalAmount);
      initialBalanceRef.current = wallet?.balance || 0;
      setIsCheckoutSuccess(false);

      const { checkoutId, url } = await createWalletCheckoutConfig({
        userId: userData?.id,
        amount: Math.round(finalAmount * 100),
      });
      if (checkoutId) {
        setCheckoutSessionId(checkoutId);
        setCheckoutUrl(url || "");
        setIsCheckoutOpen(true);
        setIsPurchasing(false); // Stop loading indicator on standard purchase button since modal is now open!
      } else if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout session returned");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate purchase.");
      setIsPurchasing(false);
    }
  };

  const getAmountToPurchase = () => {
    if (selectedPackage === "custom") {
      const val = parseFloat(customAmount);
      return isNaN(val) ? 0 : val;
    }
    return PACKAGES.find((p) => p.id === selectedPackage)?.amount || 0;
  };

  const currentSelectionAmount = getAmountToPurchase();

  return (
    <div className="flex flex-col gap-6 w-full h-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6 pb-28">
      {/* Header Block */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
          CREDIT REPAIR WALLET
        </p>
        <h1 className="text-xl font-bold text-gray-900 mt-0.5">My Wallet</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your balance and purchase mailing credits for dispute letters.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="w-full md:w-96 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white border-none shadow-md relative overflow-hidden transition-all duration-300 hover:shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Wallet className="w-32 h-32 text-white" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/10 text-white rounded-lg backdrop-blur-sm">
                <Wallet className="w-5 h-5" />
              </div>
              <Badge
                variant="outline"
                className="bg-white/15 text-white border-white/20 backdrop-blur-sm px-2.5 py-0.5"
              >
                {isPollingBalance ? (
                  <span className="flex items-center gap-1.5 text-blue-100">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Syncing...
                  </span>
                ) : (
                  "Active"
                )}
              </Badge>
            </div>
            <p className="text-sm font-medium text-blue-100/90 mb-1">
              Available Balance
            </p>
            {displayWalletLoading ? (
              <Skeleton className="h-10 w-32 bg-white/10" />
            ) : (
              <h2 className="text-4xl font-bold text-white tracking-tight flex items-center gap-2">
                ${displayBalance.toFixed(2)}
                {isPollingBalance && (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-200" />
                )}
              </h2>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Top-Up Credits */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg">Top-Up Credits</CardTitle>
              <CardDescription>
                Select a package to add funds to your wallet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedPackage}
                onValueChange={setSelectedPackage}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {PACKAGES.map((pkg) => (
                  <Label
                    key={pkg.id}
                    htmlFor={pkg.id}
                    className={`relative flex flex-col items-start p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedPackage === pkg.id
                        ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem
                          value={pkg.id}
                          id={pkg.id}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPackage === pkg.id ? "border-blue-600" : "border-gray-300"}`}
                        >
                          {selectedPackage === pkg.id && (
                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <span className="font-semibold text-gray-900">
                          {pkg.name}
                        </span>
                      </div>
                      {pkg.tag && (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] uppercase tracking-wider py-0 leading-tight">
                          {pkg.tag}
                        </Badge>
                      )}
                    </div>
                    {pkg.id !== "custom" ? (
                      <span className="text-2xl font-bold text-gray-900 pl-7">
                        ${pkg.amount.toFixed(2)}
                      </span>
                    ) : (
                      <div className="pl-7 w-full mt-1">
                        <NumberInput
                          placeholder="Amount (Min $5)"
                          className="bg-white"
                          prefix="$"
                          decimalScale={0}
                          fixedDecimalScale={true}
                          min={5}
                          value={
                            customAmount ? parseFloat(customAmount) : undefined
                          }
                          onValueChange={(val) => {
                            setCustomAmount(
                              val !== undefined ? String(val) : "",
                            );
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedPackage("custom");
                          }}
                        />
                      </div>
                    )}
                  </Label>
                ))}
              </RadioGroup>

              <div className="mt-8 pt-6 border-t">
                <Button
                  className="w-full sm:w-auto min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={
                    isPurchasing ||
                    (selectedPackage === "custom" &&
                      (!customAmount || parseFloat(customAmount) < 5))
                  }
                >
                  {isPurchasing ? (
                    <IconMenu
                      icon={<Loader2 className="h-4 w-4 animate-spin" />}
                      text="Processing..."
                    />
                  ) : (
                    <IconMenu
                      icon={<ShoppingCart className="h-4 w-4" />}
                      text={`Purchase $${currentSelectionAmount.toFixed(2)}`}
                    />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50/30 border border-blue-100/60 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-full mt-1">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    How Wallet Credits Work
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-2 list-disc pl-4">
                    <li>
                      Add funds to your wallet to easily pay for USPS mailing
                      fees when sending dispute letters.
                    </li>
                    <li>
                      Skip entering your credit card details every time you want
                      to mail a letter.
                    </li>
                    <li>
                      Credits never expire and can be used for any future
                      mailings.
                    </li>
                    <li>
                      All transactions are secure and powered by our payment
                      partner, Dodo Payments.
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Transaction History */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm border-gray-100 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-500" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <div className="max-h-[500px] lg:max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {displayWalletLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center py-3 border-b border-gray-50"
                      >
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-5 w-16" />
                      </div>
                    ))}
                  </div>
                ) : displayTransactions && displayTransactions.length > 0 ? (
                  <div className="space-y-0">
                    {[...displayTransactions]
                      .sort((a, b) => {
                        const dateA = parseDate(a.timestamp).getTime();
                        const dateB = parseDate(b.timestamp).getTime();
                        return dateB - dateA;
                      })
                      .map((txn, idx) => (
                        <div
                          key={txn.id || idx}
                          className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-full ${txn.type === "credit" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-600"}`}
                            >
                              {txn.type === "credit" ? (
                                <ArrowDownLeft className="w-4 h-4" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {txn.description}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(
                                  parseDate(txn.timestamp),
                                  "MMM d, yyyy • h:mm a",
                                )}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`text-sm font-semibold ${txn.type === "credit" ? "text-green-600" : "text-gray-900"}`}
                          >
                            {txn.type === "credit" ? "+" : "-"}$
                            {txn.amount.toFixed(2)}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No Transactions"
                    description="Your transaction history is empty."
                    icon={<CreditCard className="w-10 h-10 text-gray-400" />}
                    className="shadow-none border-dashed bg-transparent p-6 my-2"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dodo Checkout Sheet */}
      <Sheet
        open={isCheckoutOpen}
        onOpenChange={(open) => {
          setIsCheckoutOpen(open);
          if (!open) {
            setIsCheckoutSuccess(false);
            if (closeTimeoutRef.current) {
              clearTimeout(closeTimeoutRef.current);
            }
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl p-0 flex flex-col gap-0 overflow-hidden"
        >
          <SheetHeader className="px-6 py-4 border-b border-gray-200 flex flex-row items-center justify-between space-y-0">
            <div>
              <SheetTitle className="text-xl font-bold">
                {isCheckoutSuccess ? "Payment Confirmed" : "Secure Checkout"}
              </SheetTitle>
              <SheetDescription className="hidden sm:block">
                {isCheckoutSuccess
                  ? "Your transaction has been processed successfully."
                  : "Please complete your payment using the secure Dodo checkout form below."}
              </SheetDescription>
            </div>
            {checkoutUrl && !isCheckoutSuccess && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(checkoutUrl, "_blank")}
                className="text-xs flex items-center gap-1.5 shrink-0"
              >
                Open in New Tab ↗
              </Button>
            )}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 relative flex flex-col">
            {isCheckoutSuccess ? (
              <div className="flex flex-col items-center justify-center my-auto p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-5 shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Successful!
                </h2>
                <p className="text-sm text-gray-600 max-w-sm mb-5">
                  Your payment of{" "}
                  <span className="font-semibold text-gray-900">
                    ${lastPurchasedAmount.toFixed(2)}
                  </span>{" "}
                  was received. Adding funds to your wallet...
                </p>
                <div className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-3.5 py-2 rounded-full shadow-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  Updating your balance...
                </div>
              </div>
            ) : (
              checkoutSessionId && (
                <DodoCheckoutView
                  checkoutId={checkoutSessionId}
                  checkoutDetails={{
                    url: checkoutUrl,
                    checkout_url: checkoutUrl,
                    amount: Math.round(getAmountToPurchase() * 100),
                  }}
                  onComplete={handleCheckoutComplete}
                />
              )
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
