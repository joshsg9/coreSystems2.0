// src/context/CartContext.tsx
import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useState } from 'react';
import type { Product } from '../types';
import { supabase } from '../lib/supabase';

export interface CartItem {
  product:  Product;
  quantity: number;
}

interface CartState {
  items:  CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM';    product: Product; quantity?: number }
  | { type: 'REMOVE_ITEM'; productId: number | string }
  | { type: 'UPDATE_QTY';  productId: number | string; quantity: number }
  | { type: 'SET_CART';    items: CartItem[] }
  | { type: 'CLEAR' }
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE' };

interface CartContextValue {
  items:          CartItem[];
  isOpen:         boolean;
  totalItems:     number;
  totalPrice:     number;
  addItem:        (product: Product, quantity?: number) => void;
  removeItem:     (productId: number | string) => void;
  updateQuantity: (productId: number | string, quantity: number) => void;
  clearCart:      () => void;
  openCart:       () => void;
  closeCart:      () => void;
  toggleCart:     () => void;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const idx = state.items.findIndex(i => String(i.product.id) === String(action.product.id));
      if (idx >= 0) {
        const updated = [...state.items];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + (action.quantity ?? 1) };
        return { ...state, items: updated };
      }
      return { ...state, items: [...state.items, { product: action.product, quantity: action.quantity ?? 1 }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => String(i.product.id) !== String(action.productId)) };
    case 'UPDATE_QTY': {
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter(i => String(i.product.id) !== String(action.productId)) };
      }
      return {
        ...state,
        items: state.items.map(i =>
          String(i.product.id) === String(action.productId) ? { ...i, quantity: action.quantity } : i
        ),
      };
    }
    case 'SET_CART':  return { ...state, items: action.items };
    case 'CLEAR':     return { ...state, items: [] };
    case 'OPEN':      return { ...state, isOpen: true };
    case 'CLOSE':     return { ...state, isOpen: false };
    case 'TOGGLE':    return { ...state, isOpen: !state.isOpen };
    default:          return state;
  }
}

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state,  dispatch]  = useReducer(cartReducer, { items: [], isOpen: false });
  const [userId, setUserId] = useState<string | null>(null);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const loadFromDB = async (uid: string) => {
    const { data } = await supabase
      .from('cart_items').select('product_data, quantity').eq('user_id', uid);
    if (data) {
      const items = data
        .filter(r => r.product_data)
        .map(r => ({ product: r.product_data as Product, quantity: r.quantity as number }));
      dispatch({ type: 'SET_CART', items });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) loadFromDB(uid);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) loadFromDB(uid);
      else dispatch({ type: 'CLEAR' });
    });

    return () => subscription.unsubscribe();
  }, []);

  const addItem = useCallback((product: Product, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', product, quantity });
    if (userId) {
      const current = stateRef.current.items.find(i => String(i.product.id) === String(product.id));
      const newQty  = (current?.quantity ?? 0) + quantity;
      supabase.from('cart_items').upsert(
        { user_id: userId, product_id: String(product.id), quantity: newQty, product_data: product as unknown as Record<string, unknown> },
        { onConflict: 'user_id,product_id' }
      ).then();
    }
  }, [userId]);

  const removeItem = useCallback((productId: number | string) => {
    dispatch({ type: 'REMOVE_ITEM', productId });
    if (userId) {
      supabase.from('cart_items').delete()
        .eq('user_id', userId).eq('product_id', String(productId)).then();
    }
  }, [userId]);

  const updateQuantity = useCallback((productId: number | string, quantity: number) => {
    dispatch({ type: 'UPDATE_QTY', productId, quantity });
    if (userId) {
      if (quantity <= 0) {
        supabase.from('cart_items').delete()
          .eq('user_id', userId).eq('product_id', String(productId)).then();
      } else {
        supabase.from('cart_items').update({ quantity })
          .eq('user_id', userId).eq('product_id', String(productId)).then();
      }
    }
  }, [userId]);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' });
    if (userId) {
      supabase.from('cart_items').delete().eq('user_id', userId).then();
    }
  }, [userId]);

  const openCart   = useCallback(() => dispatch({ type: 'OPEN' }),   []);
  const closeCart  = useCallback(() => dispatch({ type: 'CLOSE' }),  []);
  const toggleCart = useCallback(() => dispatch({ type: 'TOGGLE' }), []);

  return (
    <CartContext.Provider value={{
      items: state.items, isOpen: state.isOpen,
      totalItems: state.items.reduce((s, i) => s + i.quantity, 0),
      totalPrice: state.items.reduce((s, i) => s + i.product.price * i.quantity, 0),
      addItem, removeItem, updateQuantity, clearCart,
      openCart, closeCart, toggleCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
