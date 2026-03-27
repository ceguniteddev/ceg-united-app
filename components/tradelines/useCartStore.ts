// ============================================
// useCartStore — Zustand shopping cart state
// ============================================
// Manages tradeline cart items with add, remove,
// update quantity, and clear operations.

import { create } from "zustand";
import type { AvailableTradeline, CartItem } from "@/types/tradelines";

interface CartStore {
  items: CartItem[];
  addItem: (tradeline: AvailableTradeline) => void;
  removeItem: (tradelineId: string) => void;
  updateQuantity: (tradelineId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
  isInCart: (tradelineId: string) => boolean;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (tradeline) => {
    const { items } = get();
    const existingItem = items.find(
      (item) => item.tradeline.id === tradeline.id,
    );

    if (existingItem) {
      // Increment quantity if already in cart
      set({
        items: items.map((item) =>
          item.tradeline.id === tradeline.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, tradeline.stock),
              }
            : item,
        ),
      });
    } else {
      // Add new item to cart
      set({
        items: [...items, { tradeline, quantity: 1 }],
      });
    }
  },

  removeItem: (tradelineId) => {
    set({
      items: get().items.filter((item) => item.tradeline.id !== tradelineId),
    });
  },

  updateQuantity: (tradelineId, quantity) => {
    const { items } = get();
    const item = items.find((i) => i.tradeline.id === tradelineId);

    if (!item) return;

    // Ensure quantity is within valid range
    const validQuantity = Math.max(1, Math.min(quantity, item.tradeline.stock));

    set({
      items: items.map((i) =>
        i.tradeline.id === tradelineId ? { ...i, quantity: validQuantity } : i,
      ),
    });
  },

  clearCart: () => {
    set({ items: [] });
  },

  getTotalPrice: () => {
    return get().items.reduce((total, item) => {
      return total + item.tradeline.price * item.quantity;
    }, 0);
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },

  isInCart: (tradelineId) => {
    return get().items.some((item) => item.tradeline.id === tradelineId);
  },
}));
