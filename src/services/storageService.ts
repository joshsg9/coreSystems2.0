// src/services/storageService.ts
import { supabase } from '../lib/supabase';

type Bucket = 'avatars' | 'product-images';

export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (error) return null;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProductImage(file: File, fileName: string): Promise<string | null> {
  const { error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, { upsert: true });

  if (error) return null;

  const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
  return data.publicUrl;
}

export function getPublicUrl(bucket: Bucket, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
