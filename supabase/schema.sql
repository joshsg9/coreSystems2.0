-- coreSystems2.0 — Tablas

CREATE TABLE profiles (
  id         UUID PRIMARY KEY,
  name       TEXT,
  phone      TEXT,
  avatar_url TEXT,
  role       TEXT DEFAULT 'buyer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sellers (
  id         UUID PRIMARY KEY,
  username   TEXT UNIQUE NOT NULL,
  store_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE,
  brand            TEXT NOT NULL,
  price            NUMERIC NOT NULL,
  original_price   NUMERIC,
  image_url        TEXT,
  category         TEXT NOT NULL,
  rating           NUMERIC DEFAULT 0,
  stock            INT DEFAULT 0,
  is_on_sale       BOOLEAN DEFAULT false,
  discount_percent INT DEFAULT 0,
  specs            JSONB DEFAULT '{}',
  description      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE favorites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  product_id   TEXT NOT NULL,
  product_data JSONB NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  product_id TEXT NOT NULL,
  quantity   INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
