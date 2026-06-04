import { supabase } from '../lib/supabase'

const BUCKET = 'product-images'

/**
 * Sube un archivo de imagen al bucket de Supabase Storage.
 * Devuelve la URL pública para usar en <img src={url}>.
 */
export async function uploadProductImage(file: File): Promise<string> {
  // Nombre único: timestamp + parte aleatoria + extensión original
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file)

  if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`)

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName)

  return data.publicUrl
}
