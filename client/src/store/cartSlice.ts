import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  image: string;
  priceCents: number;
  stock: number;
  quantity: number;
  storeId: string;
  storeName: string;
  storeSlug: string;
}

interface CartState {
  items: CartItem[];
}

const CART_STORAGE_KEY = 'ac_cart_v1';

function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

const initialState: CartState = {
  items: loadCartFromStorage(),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const incoming = action.payload;
      const existing = state.items.find(
        (item) => item.productId === incoming.productId
      );
      if (existing) {
        existing.quantity = Math.min(
          incoming.stock,
          existing.quantity + incoming.quantity
        );
        existing.priceCents = incoming.priceCents;
        existing.stock = incoming.stock;
      } else {
        state.items.push({
          ...incoming,
          quantity: Math.min(incoming.stock, Math.max(1, incoming.quantity)),
        });
      }
      saveCartToStorage(state.items);
    },
    updateCartQuantity(
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) {
      const target = state.items.find(
        (item) => item.productId === action.payload.productId
      );
      if (!target) return;
      if (action.payload.quantity <= 0) {
        state.items = state.items.filter(
          (item) => item.productId !== action.payload.productId
        );
      } else {
        target.quantity = Math.min(target.stock, action.payload.quantity);
      }
      saveCartToStorage(state.items);
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload
      );
      saveCartToStorage(state.items);
    },
    syncValidatedCart(
      state,
      action: PayloadAction<
        Array<{
          productId: string;
          title: string;
          slug: string;
          image: string;
          unitPriceCents: number;
          quantity: number;
          stock: number;
          storeId: string;
          storeName: string;
          storeSlug: string;
        }>
      >
    ) {
      state.items = action.payload.map((v) => ({
        productId: v.productId,
        slug: v.slug,
        title: v.title,
        image: v.image,
        priceCents: v.unitPriceCents,
        stock: v.stock,
        quantity: v.quantity,
        storeId: v.storeId,
        storeName: v.storeName,
        storeSlug: v.storeSlug,
      }));
      saveCartToStorage(state.items);
    },
    clearCart(state) {
      state.items = [];
      saveCartToStorage([]);
    },
  },
});

export const {
  addToCart,
  updateCartQuantity,
  removeFromCart,
  syncValidatedCart,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;

