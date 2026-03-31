// ============================================
// useCartStore — Zustand shopping cart state
// ============================================
// Manages tradeline cart items with add, remove,
// update quantity, and clear operations.
// Syncs to Firestore for cross-device persistence.

import { create } from "zustand";
import type { AvailableTradeline, CartItem } from "@/types/tradelines";

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  isInitialized: boolean;
  userId: string | null;
  setUserId: (userId: string | null) => void;
  addItem: (tradeline: AvailableTradeline) => void;
  removeItem: (tradelineId: string) => void;
  updateQuantity: (tradelineId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
  isInCart: (tradelineId: string) => boolean;
  loadCart: () => Promise<void>;
  syncToFirestore: () => Promise<void>;
}

// Debounce helper for sync operations
let syncTimeout: NodeJS.Timeout | null = null;
const debouncedSync = (syncFn: () => Promise<void>) => {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncFn();
  }, 500); // Wait 500ms after last change before syncing
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isLoading: false,
  isInitialized: false,
  userId: null,

  setUserId: (userId) => {
    set({ userId });
  },

  loadCart: async () => {
    const { userId } = get();
    if (!userId) {
      console.warn("Cannot load cart: userId is not set");
      return;
    }

    try {
      set({ isLoading: true });
      const response = await fetch(`/api/user/${userId}/tradelines/cart`);

      if (response.ok) {
        const data = await response.json();
        set({ items: data.items || [], isInitialized: true });
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  syncToFirestore: async () => {
    const { userId, items } = get();
    if (!userId) {
      console.warn("Cannot sync cart: userId is not set");
      return;
    }

    try {
      await fetch(`/api/user/${userId}/tradelines/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
    } catch (error) {
      console.error("Failed to sync cart:", error);
    }
  },

  addItem: (tradeline) => {
    const { items, syncToFirestore } = get();
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

    // Debounced sync to Firestore
    debouncedSync(syncToFirestore);
  },

  removeItem: (tradelineId) => {
    const { syncToFirestore } = get();
    set({
      items: get().items.filter((item) => item.tradeline.id !== tradelineId),
    });

    // Debounced sync to Firestore
    debouncedSync(syncToFirestore);
  },

  updateQuantity: (tradelineId, quantity) => {
    const { items, syncToFirestore } = get();
    const item = items.find((i) => i.tradeline.id === tradelineId);

    if (!item) return;

    // Ensure quantity is within valid range
    const validQuantity = Math.max(1, Math.min(quantity, item.tradeline.stock));

    set({
      items: items.map((i) =>
        i.tradeline.id === tradelineId ? { ...i, quantity: validQuantity } : i,
      ),
    });

    // Debounced sync to Firestore
    debouncedSync(syncToFirestore);
  },

  clearCart: async () => {
    const { userId } = get();
    set({ items: [] });

    if (!userId) {
      console.warn("Cannot clear cart in Firestore: userId is not set");
      return;
    }

    try {
      await fetch(`/api/user/${userId}/tradelines/cart`, { method: "DELETE" });
    } catch (error) {
      console.error("Failed to clear cart in Firestore:", error);
    }
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
