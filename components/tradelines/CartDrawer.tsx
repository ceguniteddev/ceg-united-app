// ============================================
// CartDrawer — Slide-in shopping cart panel
// ============================================
// Shows cart items with quantity controls,
// subtotal, and checkout button.

import { Minus, Plus, Trash2, ShoppingBag, CreditCard } from "lucide-react";
import type { CartItem } from "@/types/tradelines";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  totalPrice: number;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  onCheckout: () => void;
}

export function CartDrawer({
  open,
  onClose,
  items,
  totalPrice,
  onRemove,
  onUpdateQuantity,
  onCheckout,
}: CartDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-full max-w-[420px] p-0 flex flex-col gap-0 overflow-hidden h-full"
      >
        {/* Header */}
        <SheetHeader className="flex-row items-center gap-2.5 px-5 py-4 border-b border-gray-100 space-y-0">
          <ShoppingBag className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <SheetTitle className="text-lg font-semibold text-gray-900">
            Your Cart
          </SheetTitle>
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </SheetHeader>

        {/* Cart items */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 font-medium">
                Your cart is empty
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Add tradelines to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.tradeline.id}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {item.tradeline.bankName}
                        </p>
                        <p className="text-[11px] text-gray-500 font-mono">
                          ID: {item.tradeline.cardId}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemove(item.tradeline.id)}
                      className="cursor-pointer p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>
                      Limit:{" "}
                      <span className="font-mono font-medium text-gray-700">
                        ${item.tradeline.creditLimit.toLocaleString()}
                      </span>
                    </span>
                    <span>Opened: {item.tradeline.dateOpened}</span>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.tradeline.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      <span className="text-sm font-semibold text-gray-900 w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.tradeline.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.tradeline.stock}
                        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                    </div>
                    <p className="text-base font-bold text-gray-900 font-mono">
                      $
                      {(item.tradeline.price * item.quantity).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                        },
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with subtotal and checkout */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-2xl font-bold text-gray-900 font-mono">
                $
                {totalPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <Button
              onClick={onCheckout}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 rounded-xl transition-colors"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Proceed to Checkout
            </Button>
            <p className="text-xs text-center text-gray-500">
              Secure payment processing. You&apos;ll be redirected to complete
              your purchase.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
