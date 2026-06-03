// src/services/searchService.ts
import searchData from '../data/searchData.json';
import { supabase } from '../lib/supabase';
import { mapProductRow } from './productService';
import type { Product, SearchFilters, SortOption, SearchResult, PriceRange } from '../types';

export interface SearchProduct {
  id: string | number;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  badge: string | null;
  isOnSale: boolean;
}

// ── Cache — evita re-fetching en cada keystroke ──────────────────────────────
let productCache: Product[] | null = null;

async function getCached(): Promise<Product[]> {
  if (productCache) return productCache;
  const { data } = await supabase.from('products').select('*');
  productCache = (data ?? []).map(mapProductRow);
  return productCache;
}

function toSearchProduct(p: Product): SearchProduct {
  return {
    id:          p.id,
    name:        p.name,
    price:       p.price,
    image:       p.image,
    category:    p.category,
    rating:      p.rating      ?? 0,
    reviewCount: p.reviewCount ?? 0,
    badge:       p.badges?.[0] ?? null,
    isOnSale:    p.isOnSale    ?? false,
  };
}

// ── Búsqueda rápida (overlay) ────────────────────────────────────────────────
export const getPopularSearches = (): string[] => searchData.popularSearches;

export async function getRecommendedProducts(): Promise<SearchProduct[]> {
  const all = await getCached();
  return all.filter(p => p.isTrending).slice(0, 5).map(toSearchProduct);
}

export async function searchProducts(query: string): Promise<SearchProduct[]> {
  if (!query.trim()) return getRecommendedProducts();
  const all = await getCached();
  const q = query.toLowerCase();
  return all
    .filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    )
    .slice(0, 5)
    .map(toSearchProduct);
}

export const formatPrice = (price: number): string =>
  `$${price.toLocaleString('es-CO')}`;

// ── Búsqueda completa (SearchResultsPage) ────────────────────────────────────
function matchesQuery(p: Product, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  const text = [
    p.name, p.brand, p.category, p.subcategory ?? '',
    p.description ?? '', ...(p.badges ?? []),
    ...Object.values(p.specs ?? {}),
  ].join(' ').toLowerCase();
  return q.split(/\s+/).every(w => text.includes(w));
}

function applyFilters(products: Product[], f: SearchFilters): Product[] {
  return products.filter(p => {
    if (f.category && p.category !== f.category) return false;
    if (f.brand    && p.brand    !== f.brand)    return false;
    if (f.colors?.length && (!p.color || !f.colors.includes(p.color))) return false;
    if (f.minPrice !== undefined && p.price < f.minPrice) return false;
    if (f.maxPrice !== undefined && p.price > f.maxPrice) return false;
    return true;
  });
}

function sortBy(products: Product[], sort: SortOption): Product[] {
  const arr = [...products];
  switch (sort) {
    case 'price_asc':  return arr.sort((a, b) => a.price - b.price);
    case 'price_desc': return arr.sort((a, b) => b.price - a.price);
    case 'rating':     return arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case 'newest':     return arr.sort((a, b) => String(b.id).localeCompare(String(a.id)));
    default:           return arr.sort((a, b) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0));
  }
}

function buildFacets(products: Product[]): SearchResult['filters'] {
  const brandMap = new Map<string, number>();
  products.forEach(p => brandMap.set(p.brand, (brandMap.get(p.brand) ?? 0) + 1));

  const colorMap = new Map<string, number>();
  products.forEach(p => {
    if (p.color) colorMap.set(p.color, (colorMap.get(p.color) ?? 0) + 1);
  });

  const priceRanges: (PriceRange & { count: number })[] = [
    { label: 'Below $500,000',          min: 0,         max: 500_000,   count: 0 },
    { label: '$500,000 – $1,000,000',   min: 500_000,   max: 1_000_000, count: 0 },
    { label: '$1,000,000 – $3,000,000', min: 1_000_000, max: 3_000_000, count: 0 },
    { label: '$3,000,000 – $5,000,000', min: 3_000_000, max: 5_000_000, count: 0 },
    { label: '$5,000,000+',             min: 5_000_000, max: null,      count: 0 },
  ];
  products.forEach(p => {
    const r = priceRanges.find(r => p.price >= r.min && (r.max === null || p.price <= r.max));
    if (r) r.count++;
  });

  return {
    brands:      Array.from(brandMap.entries()).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
    colors:      Array.from(colorMap.entries()).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
    priceRanges,
  };
}

export async function searchProductsFull(filters: SearchFilters): Promise<SearchResult> {
  const all      = await getCached();
  const matched  = all.filter(p => matchesQuery(p, filters.query));
  const facets   = buildFacets(matched);
  const filtered = applyFilters(matched, filters);
  const sorted   = sortBy(filtered, filters.sortBy ?? 'relevance');
  return { products: sorted, total: filtered.length, filters: facets };
}

export const EMPTY_FILTERS: SearchFilters = { query: '', sortBy: 'relevance' };
