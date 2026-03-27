// ============================================
// CheckoutModal — Checkout confirmation dialog
// ============================================
// Displays cart summary and confirms purchase
// before processing payment.

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, ShoppingBag, X } from "lucide-react";
import type { CartItem } from "@/types/tradelines";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  totalPrice: number;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function CheckoutModal({
  open,
  onClose,
  items,
  totalPrice,
  onConfirm,
  isLoading = false,
}: CheckoutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
            Confirm Purchase
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Order Summary
            </h4>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.tradeline.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center">
                      <CreditCard className="w-3 h-3 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.tradeline.bankName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 font-mono">
                    $
                    {(item.tradeline.price * item.quantity).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                      },
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between py-4 border-t border-gray-200">
            <span className="text-base font-semibold text-gray-700">
              Total Amount
            </span>
            <span className="text-2xl font-bold text-gray-900 font-mono">
              $
              {totalPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Important notice */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-xs text-blue-900">
              <strong>Important:</strong> All tradeline purchases are subject to
              admin approval. You will receive a confirmation email once your
              order is processed.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>Processing...</>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Confirm Purchase
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
