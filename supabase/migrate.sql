-- coreSystems2.0 — Migración
-- Corre esto en: Supabase > SQL Editor > New query

-- Columnas que faltaban en products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS badges       TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS color        TEXT,
  ADD COLUMN IF NOT EXISTS subcategory  TEXT,
  ADD COLUMN IF NOT EXISTS review_count INT     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_trending  BOOLEAN DEFAULT false;

-- Columna para restaurar el carrito al volver a iniciar sesión
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS product_data JSONB;

-- Habilitar Realtime para el chat
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
