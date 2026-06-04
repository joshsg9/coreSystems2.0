# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server with HMR
npm run build      # TypeScript compile + production build
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

No test runner is configured — there are no test files or testing dependencies.

## Architecture Overview

**React 19 + TypeScript SPA** e-commerce prototype. All data comes from static JSON files in `src/data/` — there is no backend, no API calls, and no environment variables. Auth is fully mocked (800ms simulated delay in `authService`).

### Two User Personas

1. **Buyer** — shopping experience: home, search, product detail, cart, favorites, chat with seller
2. **Seller** — dashboard at `/seller/home` (standalone layout, no shared navbar)

### Routing (`src/App.tsx`)

App wraps authenticated routes in `AppLayout` (with `Navbar`). The catch-all `*` route shows `LoginPage` when unauthenticated or redirects home when authenticated. Seller pages sit outside `AppLayout`.

```
/                  → Home
/search            → SearchResultsPage
/product/:slugOrId → ProductDetailPage
/seller/register   → SellerRegister
/seller/home       → SellerHome (standalone, no AppLayout)
```

### State Management

Three React Contexts handle all global state:

| Context | Pattern | Persistence |
|---------|---------|-------------|
| `CartContext` | `useReducer` | In-memory |
| `FavoritesContext` | `useReducer` | `localStorage` |
| `ChatContext` | `useState` | In-memory |

### Services (`src/services/`)

Pure functions that import JSON data and return typed results — no async except the mocked delay in `authService`.

- **`productService`** — product lookups, filtering by category/sale/trending
- **`searchService`** — full-text search across name, brand, specs, badges; supports facets (brand, color, price bucket), multi-sort (relevance, price, rating, newest), price range bucketing
- **`authService`** — email/phone validation, OAuth mock, dynamic user creation
- **`categoryService`** — hierarchical category tree with brands, filters, accessories

### Data Files (`src/data/`)

- `longProducts.json` — primary product catalog (used by search and detail pages)
- `products.json` — smaller list used on Home (sale/trending carousels)
- `categories.json` — hierarchical categories: smartphones, laptops, tablets, consoles, TVs, smartwatches
- `searchData.json` — popular searches and recommended products for the search overlay
- `sellerData.json` — mock seller profile

### Styling

CSS Modules (`.module.css`) for all components. Global resets in `src/index.css`. No CSS framework, no preprocessors.

### TypeScript

Strict mode with `noUnusedLocals` and `noUnusedParameters`. All `ProductSpec` fields are typed as `string` (no booleans/numbers) for JSON consistency. Core types are in `src/types/index.ts`.
