// =============================================================================
// WERA — Cart Store (Zustand)
// Section 6.4 — Persisted via localStorage for guests
// =============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartState } from "@/types";

interface CartStore extends CartState {
  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  setCouponCode: (code: string | null) => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  // Computed
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      isOpen: false,

      addItem: (newItem) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.variantId === newItem.variantId
          );

          if (existingIndex >= 0) {
            // Update quantity if item already in cart
            const updatedItems = [...state.items];
            const existing = updatedItems[existingIndex]!;
            const newQty = Math.min(
              existing.quantity + newItem.quantity,
              existing.maxStock
            );
            updatedItems[existingIndex] = { ...existing, quantity: newQty };
            return { items: updatedItems, isOpen: true };
          }

          // Add new item
          return { items: [...state.items, newItem], isOpen: true };
        });
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        }));
      },

      updateQuantity: (variantId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId
              ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxStock)) }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [], couponCode: null }),

      setCouponCode: (code) => set({ couponCode: code }),

      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      subtotal: () =>
        get().items.reduce(
          (sum, item) => sum + parseFloat(item.price) * item.quantity,
          0
        ),
    }),
    {
      name: "wera-cart",
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
      }),
    }
  )
);
