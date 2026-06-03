// src/context/FavoritesContext.tsx
import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '../types';
import { supabase } from '../lib/supabase';

// ─── State ───────────────────────────────────────────────────────────────────
interface FavoritesState {
  items: Product[];
  isOpen: boolean;
}

type FavoritesAction =
  | { type: 'ADD_FAVORITE';    product: Product }
  | { type: 'REMOVE_FAVORITE'; productId: string | number }
  | { type: 'SET_FAVORITES';   products: Product[] }
  | { type: 'OPEN_DRAWER' }
  | { type: 'CLOSE_DRAWER' }
  | { type: 'TOGGLE_DRAWER' };

const favoritesReducer = (state: FavoritesState, action: FavoritesAction): FavoritesState => {
  switch (action.type) {
    case 'ADD_FAVORITE':
      if (state.items.some(p => String(p.id) === String(action.product.id))) return state;
      return { ...state, items: [...state.items, action.product] };
    case 'REMOVE_FAVORITE':
      return { ...state, items: state.items.filter(p => String(p.id) !== String(action.productId)) };
    case 'SET_FAVORITES':
      return { ...state, items: action.products };
    case 'OPEN_DRAWER':
      return { ...state, isOpen: true };
    case 'CLOSE_DRAWER':
      return { ...state, isOpen: false };
    case 'TOGGLE_DRAWER':
      return { ...state, isOpen: !state.isOpen };
    default:
      return state;
  }
};

// ─── Context ─────────────────────────────────────────────────────────────────
interface FavoritesContextValue {
  items: Product[];
  isOpen: boolean;
  totalFavorites: number;
  addFavorite:    (product: Product) => void;
  removeFavorite: (productId: string | number) => void;
  isFavorite:     (productId: string | number) => boolean;
  openDrawer:     () => void;
  closeDrawer:    () => void;
  toggleDrawer:   () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state,  dispatch]  = useReducer(favoritesReducer, { items: [], isOpen: false });
  const [userId, setUserId] = useState<string | null>(null);

  // ── Load from Supabase when user logs in ──────────────────────────────────
  const loadFromDB = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('favorites')
      .select('product_data')
      .eq('user_id', uid);

    if (error || !data) return;
    dispatch({ type: 'SET_FAVORITES', products: data.map(row => row.product_data as Product) });
  }, []);

  // ── Track auth session ────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        loadFromDB(uid);
      } else {
        // No session: restore from localStorage
        const saved = localStorage.getItem('favorites');
        if (saved) {
          try {
            const items = JSON.parse(saved) as Product[];
            if (Array.isArray(items)) dispatch({ type: 'SET_FAVORITES', products: items });
          } catch { /* ignore */ }
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) loadFromDB(uid);
    });

    return () => subscription.unsubscribe();
  }, [loadFromDB]);

  // ── Persist to localStorage as local cache ────────────────────────────────
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(state.items));
  }, [state.items]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addFavorite = useCallback((product: Product) => {
    dispatch({ type: 'ADD_FAVORITE', product });
    if (userId) {
      supabase.from('favorites').upsert(
        { user_id: userId, product_id: String(product.id), product_data: product as unknown as Record<string, unknown> },
        { onConflict: 'user_id,product_id' }
      ).then();
    }
  }, [userId]);

  const removeFavorite = useCallback((productId: string | number) => {
    dispatch({ type: 'REMOVE_FAVORITE', productId });
    if (userId) {
      supabase.from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', String(productId))
        .then();
    }
  }, [userId]);

  const isFavorite  = useCallback((productId: string | number) =>
    state.items.some(p => String(p.id) === String(productId)), [state.items]);

  const openDrawer   = useCallback(() => dispatch({ type: 'OPEN_DRAWER' }),   []);
  const closeDrawer  = useCallback(() => dispatch({ type: 'CLOSE_DRAWER' }),  []);
  const toggleDrawer = useCallback(() => dispatch({ type: 'TOGGLE_DRAWER' }), []);

  return (
    <FavoritesContext.Provider value={{
      items: state.items,
      isOpen: state.isOpen,
      totalFavorites: state.items.length,
      addFavorite,
      removeFavorite,
      isFavorite,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextValue => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside <FavoritesProvider>');
  return ctx;
};
