// src/services/productService.ts
import { supabase } from '../lib/supabase';
import type { Product } from '../types';

type Row = Record<string, unknown>;

export function mapProductRow(row: Row): Product {
  return {
    id:              row.id              as string,
    name:            row.name            as string,
    slug:            row.slug            as string | undefined,
    brand:           row.brand           as string,
    price:           row.price           as number,
    originalPrice:   row.original_price  as number | undefined,
    image:           (row.image_url      as string) ?? '',
    category:        row.category        as string,
    subcategory:     row.subcategory     as string | undefined,
    rating:          (row.rating         as number) ?? 0,
    reviewCount:     (row.review_count   as number) ?? 0,
    stock:           (row.stock          as number) ?? 0,
    isTrending:      (row.is_trending    as boolean) ?? false,
    isOnSale:        (row.is_on_sale     as boolean) ?? false,
    discount:        (row.discount_percent as number) ?? 0,
    discountPercent: (row.discount_percent as number) ?? 0,
    color:           row.color           as string | undefined,
    specs:           (row.specs          as Product['specs']) ?? {},
    badges:          (row.badges         as string[]) ?? [],
    description:     row.description     as string | undefined,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const { data } = await supabase.from('products').select('*');
  return (data ?? []).map(mapProductRow);
}

export async function getSaleProducts(): Promise<Product[]> {
  const { data } = await supabase
    .from('products').select('*').eq('is_on_sale', true);
  return (data ?? []).map(mapProductRow);
}

export async function getTrendingProducts(): Promise<Product[]> {
  const { data } = await supabase
    .from('products').select('*').eq('is_trending', true).limit(6);
  return (data ?? []).map(mapProductRow);
}

export async function getProductBySlugOrId(slugOrId: string): Promise<Product | null> {
  const { data: bySlug } = await supabase
    .from('products').select('*').eq('slug', slugOrId).maybeSingle();
  if (bySlug) return mapProductRow(bySlug);

  const { data: byId } = await supabase
    .from('products').select('*').eq('id', slugOrId).maybeSingle();
  return byId ? mapProductRow(byId) : null;
}

export async function getRelatedProducts(category: string, excludeId: string): Promise<Product[]> {
  const { data } = await supabase
    .from('products').select('*')
    .eq('category', category)
    .neq('id', excludeId)
    .limit(4);
  return (data ?? []).map(mapProductRow);
}

export const formatPrice = (price: number): string =>
  `$ ${price.toLocaleString('es-CO')}`;
