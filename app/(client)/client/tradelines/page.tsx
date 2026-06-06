"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { withClientGuard } from "@/components/wrapper";
import { useAuth } from "@/provider/AuthContext";
import { toast } from "sonner";
import {
  CreditCard,
  Package,
  User,
  Building2,
  Zap,
  ShoppingCart,
  Search,
  ArrowUpDown,
  TrendingUp,
} from "lucide-react";
import type {
  AvailableTradeline,
  CartItem,
  PurchasedTradeline,
  TradelineCategory,
} from "@/types/tradelines";
import { TradelineCard } from "@/components/tradelines/TradelineCard";
import { PurchasedTradelineCard } from "@/components/tradelines/PurchasedTradelineCard";
import { CartDrawer } from "@/components/tradelines/CartDrawer";
import { CheckoutModal } from "@/components/tradelines/CheckoutModal";
import { TradelineCheckoutView } from "@/components/tradelines/TradelineCheckoutView";
import { CreditBuilderSection } from "@/components/tradelines/CreditBuilderSection";
import { SpecialDealsSection } from "@/components/tradelines/SpecialDealsSection";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TradelineGridSkeleton } from "@/components/tradelines/TradelineCardSkeleton";
import { useCartStore } from "@/components/tradelines/useCartStore";
import {
  mockPersonalCreditBuilders,
  mockBusinessCreditBuilders,
} from "@/lib/tradelineMockData";
import {
  useUserRecentTradelines,
  useUserTradelines,
  USER_ALL_TRADELINES_KEY,
} from "@/hooks/tradelines";
import { useSystemConfig } from "@/hooks/system-config";
import { useActiveSpecialDeals } from "@/hooks/special-deals";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { stripHtml } from "@/lib/utils";

type TabId =
  | "available"
  | "purchased"
  | "personal-builder"
  | "business-builder"
  | "special-deals";

interface TabDef {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: typeof TrendingUp;
  count?: number;
}

type SortField =
  | "price-asc"
  | "price-desc"
  | "limit-desc"
  | "limit-asc"
  | "stock-desc";

// Convert API PricingItem to AvailableTradeline
interface PricingItem {
  image: string;
  bank_name: string;
  card_id: number | string;
  credit_limit: string;
  credit_limit_original: number | string;
  date_opened: string;
  date_opened_original: number | string;
  purchase_deadline: string;
  reporting_period: string;
  stock: number | string;
  price: number | string;
}

function convertToAvailableTradeline(
  item: PricingItem,
  markupPercentage: number,
): AvailableTradeline {
  const rawPrice = Number(item.price);
  const markup = (rawPrice * markupPercentage) / 100;
  const finalPrice = rawPrice + markup;
  const stock = Number(item.stock);

  return {
    id: String(item.card_id),
    bankName: item.bank_name,
    cardId: String(item.card_id),
    creditLimit: Number(item.credit_limit_original),
    dateOpened: stripHtml(item.date_opened),
    purchaseByDate: stripHtml(item.purchase_deadline),
    reportingDate: stripHtml(item.reporting_period),
    stock: stock,
    price: finalPrice,
    status:
      stock === 0 ? "out-of-stock" : stock <= 2 ? "low-stock" : "in-stock",
    image: item.image,
  };
}

function TradelinesPage() {
  const { user } = useAuth();
  const cart = useCartStore();

  // Data state
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    initialTab &&
      [
        "available",
        "purchased",
        "personal-builder",
        "business-builder",
        "special-deals",
      ].includes(initialTab)
      ? initialTab
      : "available",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("price-asc");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [checkoutSheetOpen, setCheckoutSheetOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{
    checkoutId: string;
    items: CartItem[];
    totalPrice: number;
  } | null>(null);

  // Fetch data
  const { config } = useSystemConfig();
  const markupPercentage = config?.markupPercentage ?? 0;
  const { recentTradelines, refetch: refetchRecent } = useUserRecentTradelines(
    user?.uid,
  );
  const { tradelines: purchasedTradelines, isLoading: purchasedLoading } =
    useUserTradelines(user?.uid);
  const { data: specialDeals } = useActiveSpecialDeals();

  // Set userId and load cart from Firestore when user is authenticated
  useEffect(() => {
    if (user?.uid) {
      cart.setUserId(user.uid);
      if (!cart.isInitialized) {
        cart.loadCart();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, cart.isInitialized]);

  // Fetch available tradelines
  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed: ${r.status}`);
        return r.json();
      })
      .then((data) => setPricingItems(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Convert pricing items to available tradelines
  const availableTradelines = useMemo(() => {
    return pricingItems
      .map((item) => convertToAvailableTradeline(item, markupPercentage))
      .filter((tradeline) => {
        // Filter out recently purchased tradelines (60-day cooldown)
        const hasPurchasedRecently = recentTradelines.some(
          (rt) => rt.card_id === tradeline.cardId,
        );
        return !hasPurchasedRecently;
      });
  }, [pricingItems, markupPercentage, recentTradelines]);

  // Convert purchased tradelines to display format
  const purchasedTradelinesDisplay: PurchasedTradeline[] = useMemo(() => {
    return (purchasedTradelines || []).map((item: any) => ({
      id: item.id,
      bankName: item.bank_name,
      cardId: String(item.card_id),
      creditLimit: Number(item.credit_limit_original),
      purchasedOn: new Date(item.createdAt).toLocaleDateString(),
      quantity: item.quantity || 1,
      totalPaid: Number(item.grandTotal?.replace(/[^0-9.-]+/g, "") || 0),
      status: item.status || "pending",
      image: item.image,
    }));
  }, [purchasedTradelines]);

  // Tab definitions
  const tabs: TabDef[] = useMemo(
    () => [
      {
        id: "available",
        label: "Available Tradelines",
        shortLabel: "Available",
        icon: CreditCard,
        count: availableTradelines.length,
      },
      {
        id: "purchased",
        label: "Purchased Tradelines",
        shortLabel: "Purchased",
        icon: Package,
        count: purchasedTradelinesDisplay.length,
      },
      {
        id: "personal-builder",
        label: "Personal Credit Builder",
        shortLabel: "Personal",
        icon: User,
      },
      {
        id: "business-builder",
        label: "Business Credit Builder",
        shortLabel: "Business",
        icon: Building2,
      },
      {
        id: "special-deals",
        label: "Special Deals",
        shortLabel: "Deals",
        icon: Zap,
        count: specialDeals?.length ?? 0,
      },
    ],
    [
      availableTradelines.length,
      purchasedTradelinesDisplay.length,
      specialDeals?.length,
    ],
  );

  // Filtered + sorted available tradelines
  const filteredAvailable = useMemo(() => {
    let list = [...availableTradelines];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.bankName.toLowerCase().includes(q) ||
          t.cardId.includes(q) ||
          t.creditLimit.toString().includes(q),
      );
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "limit-desc":
        list.sort((a, b) => b.creditLimit - a.creditLimit);
        break;
      case "limit-asc":
        list.sort((a, b) => a.creditLimit - b.creditLimit);
        break;
      case "stock-desc":
        list.sort((a, b) => b.stock - a.stock);
        break;
    }

    return list;
  }, [availableTradelines, searchQuery, sortBy]);

  // Handle checkout
  const handleCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  // Handle checkout confirmation
  const handleCheckoutConfirm = async () => {
    if (!user) {
      toast.error("You must be logged in to purchase.");
      return;
    }

    try {
      setIsPurchasing(true);

      // Create Whop checkout session
      const totalPrice = cart.getTotalPrice();
      const response = await fetch(
        `/api/user/${user.uid}/tradelines/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart.items,
            totalPrice,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { checkoutId } = await response.json();

      // Store cart data in sessionStorage for backup
      sessionStorage.setItem(
        "tradeline_checkout_data",
        JSON.stringify({
          items: cart.items,
          totalPrice,
        }),
      );

      // Open checkout sheet inline
      setCheckoutData({
        checkoutId,
        items: cart.items,
        totalPrice,
      });
      setCheckoutSheetOpen(true);
      setCheckoutOpen(false);
      setIsPurchasing(false);
    } catch (err: any) {
      toast.error("Failed to initiate checkout: " + err.message);
      setIsPurchasing(false);
    }
  };

  // Handle payment completion
  const handlePaymentComplete = () => {
    setCheckoutData(null);
    setCheckoutSheetOpen(false);
    setActiveTab("purchased");
  };

  return (
    <div className="container mx-auto px-4 py-4 space-y-4 md:py-6 md:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Tradelines
          </h1>
          <p className="text-sm text-gray-500 mt-1 md:text-base">
            Browse and purchase authorized user tradelines
          </p>
        </div>

        {/* Cart button */}
        <Button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 right-4 z-50 sm:relative sm:bottom-auto sm:right-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg sm:shadow-sm h-14 sm:h-auto rounded-full sm:rounded-xl px-6"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          <span className="font-semibold">
            Cart {cart.getItemCount() > 0 && `(${cart.getItemCount()})`}
          </span>
        </Button>
      </div>

      {/* Tab navigation */}
      <div className="mb-6">
        {/* Mobile dropdown */}
        <div className="md:hidden">
          <Select
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabId)}
          >
            <SelectTrigger className="w-full h-12 bg-white">
              <div className="flex items-center gap-2">
                {(() => {
                  const activeTabDef = tabs.find((t) => t.id === activeTab);
                  if (!activeTabDef) return null;
                  const Icon = activeTabDef.icon;
                  return (
                    <>
                      <Icon className="w-4 h-4 flex-shrink-0 text-blue-600" />
                      <span className="font-medium">{activeTabDef.label}</span>
                      {activeTabDef.count !== undefined && (
                        <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700">
                          {activeTabDef.count}
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <SelectItem key={tab.id} value={tab.id}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                          {tab.count}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop tabs */}
        <div className="hidden md:block border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`cursor-pointer flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`ml-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search and Sort (Available tab only) */}
      {activeTab === "available" && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by bank, card ID, or limit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <div className="relative sm:w-64">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="w-full h-11 pl-10 pr-4 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="limit-desc">Limit: High to Low</option>
              <option value="limit-asc">Limit: Low to High</option>
              <option value="stock-desc">Stock: High to Low</option>
            </select>
          </div>
        </div>
      )}

      {/* Tab content */}
      {activeTab === "available" && (
        <div>
          {loading ? (
            <TradelineGridSkeleton count={6} />
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-500">Error loading tradelines: {error}</p>
            </div>
          ) : filteredAvailable.length === 0 ? (
            <div className="text-center py-16">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No tradelines found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAvailable.map((tradeline) => (
                <TradelineCard
                  key={tradeline.id}
                  tradeline={tradeline}
                  isInCart={cart.isInCart(tradeline.id)}
                  onAddToCart={(t) => {
                    cart.addItem(t);
                    toast.success(`${t.bankName} added to cart`);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "purchased" && (
        <div>
          {purchasedLoading ? (
            <TradelineGridSkeleton count={6} />
          ) : purchasedTradelinesDisplay.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                No purchased tradelines yet
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Browse available tradelines to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {purchasedTradelinesDisplay.map((tradeline) => (
                <PurchasedTradelineCard
                  key={tradeline.id}
                  tradeline={tradeline}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "personal-builder" && (
        <CreditBuilderSection
          accounts={mockPersonalCreditBuilders}
          type="personal"
        />
      )}

      {activeTab === "business-builder" && (
        <CreditBuilderSection
          accounts={mockBusinessCreditBuilders}
          type="business"
        />
      )}

      {activeTab === "special-deals" && (
        <SpecialDealsSection
          isInCart={cart.isInCart}
          onAddToCart={(t) => {
            cart.addItem(t);
            toast.success(`${t.bankName} deal added to cart`);
          }}
        />
      )}

      {/* Cart drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart.items}
        totalPrice={cart.getTotalPrice()}
        onRemove={(id) => {
          cart.removeItem(id);
          toast.success("Item removed from cart");
        }}
        onUpdateQuantity={cart.updateQuantity}
        onCheckout={handleCheckout}
      />

      {/* Checkout modal */}
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cart.items}
        totalPrice={cart.getTotalPrice()}
        onConfirm={handleCheckoutConfirm}
        isLoading={isPurchasing}
      />

      {/* Checkout sheet */}
      <Sheet open={checkoutSheetOpen} onOpenChange={setCheckoutSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl p-0 flex flex-col gap-0 overflow-hidden"
        >
          <SheetHeader className="px-6 py-4 border-b border-gray-200">
            <SheetTitle className="text-xl font-bold">
              Secure Checkout
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {checkoutData && (
              <TradelineCheckoutView
                checkoutId={checkoutData.checkoutId}
                items={checkoutData.items}
                totalPrice={checkoutData.totalPrice}
                prefillEmail={user?.email || ""}
                userId={user?.uid || ""}
                onPaymentCompleteAction={handlePaymentComplete}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default withClientGuard(TradelinesPage);
