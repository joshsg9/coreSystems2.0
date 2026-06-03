// supabase/seed.ts — npm run seed
import { createClient } from '@supabase/supabase-js'
import longProducts from '../src/data/longProducts.json'

const supabase = createClient(
  'https://kvygadippiqwiojgyzlg.supabase.co',
  'sb_publishable_dk9-k7gFiEEGuFC1f9-sPg_nkwLVElV'
)

async function seed() {
  const rows = longProducts.map(p => ({
    name:             p.name,
    slug:             p.slug,
    brand:            p.brand,
    price:            p.price,
    original_price:   p.originalPrice   ?? null,
    image_url:        p.image,
    category:         p.category,
    subcategory:      p.subcategory     ?? null,
    rating:           p.rating          ?? 0,
    review_count:     p.reviewCount     ?? 0,
    stock:            p.stock           ?? 0,
    is_trending:      p.isTrending      ?? false,
    is_on_sale:       p.isOnSale        ?? false,
    discount_percent: p.discount        ?? 0,
    color:            p.color           ?? null,
    specs:            p.specs,
    badges:           p.badges          ?? [],
    description:      p.description     ?? null,
  }))

  const { error } = await supabase
    .from('products')
    .upsert(rows, { onConflict: 'slug' })

  if (error) console.error('Error:', error.message)
  else console.log(`✓ ${rows.length} productos insertados/actualizados`)
}

seed()
