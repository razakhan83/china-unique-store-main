# China Unique — store and admin excellence plan

Reviewed against the live codebase on 26 Sep 2026. This is a code audit, not a browser pass of the production site.

Skills used:

- [Vercel Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) — motion, type, focus, forms, touch, images
- Vercel React best practices — waterfalls, bundle size, server cache, client fetching, re-renders
- Next.js best practices — RSC boundaries, cache, loading states, route handlers
- Archify review — value, cost, and impact, so the plan stays proportional

Existing notes in `docs/TODO.md` still apply (regex search, PascalCase product fields, rate limits, guest token lifetime, `data.js` size). This plan adds what that file does not cover: checkout bugs, layout scale, motion on weak phones, admin reloads, and Mongo/Vercel load.

---

## What already matches a serious shop

Keep these. Do not rewrite them while fixing the items below.

- Next.js 16 App Router, React Compiler, and `'use cache'` on the store layout, home, and policy pages.
- Cart is split into three contexts with optimistic updates and `localStorage`.
- Checkout recalculates price on the server, supports an idempotency key, and decrements stock.
- Store routes that matter have `loading.js` skeletons (home catalog, product, checkout, orders, wishlist, and most admin lists).
- `router.refresh()` on the admin is the right *idea* after a mutation. The cost is that some screens are too large to refresh as one block.
- Duplicate public URLs already redirect: `/faq`, `/contact-us`, `/privacy-policy`, `/terms-of-service`.

---

## Priority

| Priority | Item | Who feels it | Cost |
|---|---|---|---|
| P0 | Checkout name is capped at 20 letters | Customers with normal Pakistani names cannot place an order | Small |
| P0 | Checkout inputs are 15px | iPhone zooms the page on every field | Small |
| P0 | Abandoned-cart sync writes Mongo on every field change | Extra DB + Vercel invocations during checkout | Small |
| P1 | Admin dashboard scans the whole orders collection with no cache | Slow admin home, high Mongo and function time | Medium |
| P1 | Admin mutations call `router.refresh()` on giant clients | Orders and invoices feel like a full reload | Medium |
| P1 | `transition-all` and hover scale on the store chrome | Jank on low-end Android | Medium |
| P1 | Page width and type size are not one system | Desktop looks uneven; mobile type is too small | Medium |
| P2 | Search is `$regex`, reviews auto-approve, wishlist has no cap | Already in `docs/TODO.md` | Medium |
| P2 | Dead loaders and duplicate data functions | Maintenance cost | Low |
| P3 | High-end commerce gaps (addresses, card pay, returns, search quality) | Conversion vs Shopify-class shops | Large, do later |

---

## Bugs

### Checkout blocks real names

`CheckoutClient.jsx` treats a name as valid only when it matches `^[a-zA-Z\s]{2,20}$`. The error copy says the name must not exceed 20 characters. A name like “Muhammad Abdullah Khan” fails. High-end checkout accepts a full name (typically 2–80 characters), including spaces, hyphens, and apostrophes.

Same file caps the address at 100 characters. A house plus area plus landmark in Karachi often needs more. Raise the address cap to at least 240 and keep the landmark field separate.

The submit button copy checks `paymentMethod === 'card'`, but the only methods the UI can set are `cod` and `bank`. Card is dead copy.

### Mobile zoom on checkout

Floating inputs use `text-[15px]`. iOS Safari zooms the viewport when a focused field is under 16px. Set checkout inputs, textareas, and the city combobox to `text-base` (16px) on touch devices. Desktop can stay 14px.

### Abandoned cart hammers the database

After the phone has 8 characters, this effect posts `/api/cart/sync` 1.5 seconds after every change to name, email, city, address, landmark, cart, or total:

```776:798:src/app/(store)/(checkout-shell)/checkout/CheckoutClient.jsx
  useEffect(() => {
    const phone = formData.phone?.trim();
    if (!phone || phone.length < 8 || !cart || cart.length === 0) return;
    const timer = setTimeout(() => {
      fetch('/api/cart/sync', { /* ... */ }).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [formData.phone, formData.fullName, formData.email, formData.city, formData.address, formData.landmark, cart, pricing.total]);
```

`/api/cart/sync` then runs `AbandonedCart.findOneAndUpdate` with `upsert`. One customer typing an address can write the database many times. Sync once when the phone becomes valid, again on blur of address, and once on `pagehide`. Skip the write when the payload has not changed.

### Admin feels like a reload

`AdminOrdersClient.jsx` is about 4,000 lines and calls `router.refresh()` after status changes, deletes, drafts, and quick views. Each refresh re-runs the server page and re-hydrates that client. The same pattern is in product, review, coupon, invoice, and order-detail screens.

Replace list-row mutations with `useOptimistic` (or a local patch) and refresh only the changed row. Keep `router.refresh()` for creates that change pagination totals.

There is no `src/app/admin/loading.js`. The dashboard awaits `getAdminDashboardData()` before the page can paint. Wrap the KPI block and the chart in their own `Suspense` boundaries. A skeleton component already exists.

### Order flow gaps that lose orders

What works: guest checkout, COD, optional bank deposit, server-side totals, coupon check, idempotency, stock decrement, invoice created in `after()`, WhatsApp handoff.

What a high-end shop still has, in the order a customer expects:

1. Cart drawer shows live price, delivery estimate, and a single primary “Checkout” action.
2. Checkout is one column on mobile, summary sticky on desktop, 16px fields, inline errors, first invalid field focused.
3. Payment choice is only what you can actually charge. Hide the unused card label until a gateway exists.
4. Success is a real URL (`/orders/[id]?token=`) that survives refresh, with the order id, items, total, and “track on WhatsApp”. The modal can stay as a layer on top of that URL.
5. Status page shows the same pipeline the admin uses (`Order Confirmed` → `Packed` → `Shipped` → `Out For Delivery` → `Delivered`), with a timestamp per step.
6. Guest lookup asks for order id **and** phone. `secureToken` alone, stored forever, is called out in `docs/TODO.md` item 10.

Stock is decremented after `Order.create`. Two checkouts of the last unit can both succeed. For the current catalog size this is acceptable. Add a conditional stock update (`Stock` greater than quantity) before you advertise tight inventory.

---

## Low-end phones, motion, and transitions

The navbar, product cards, wishlist heart, and add-to-cart buttons use `transition-all` plus `hover:scale`, `hover:-translate-y`, and shadows. `transition-all` also animates color, shadow, and border, which makes the main thread paint on cheap GPUs. The Web Interface Guidelines allow `transform` and `opacity` only, and they require an explicit property list.

`prefers-reduced-motion` is handled for the announcement marquee, hero fade, skeleton shimmer, and a few home components. It is not handled for navbar hover-lift, card scale, cart bump, map pulse, or the many `transition-all` buttons. Under reduced motion, those should snap with no scale and no translate.

Concrete motion rules for the next pass:

- Replace `transition-all` with `transition-[transform,opacity,background-color,border-color]`.
- Drop hover lift (`-translate-y`) on the navbar and bottom nav. Keep a color change. Lift is invisible on touch and costs a composite on desktop.
- Pause or disable marquees, testimonial autoplay, and category sliders when `prefers-reduced-motion: reduce`, and also when `navigator.hardwareConcurrency <= 4` if you want a cheap-phone mode.
- Do not animate `height` on accordions for large panels. Use a grid-template-rows trick or an opacity fade.
- Remove `will-change` except during an active animation. `animate-fadeInHero` sets `will-change` permanently.
- `SplashScreen.jsx` is unused and would block the first view for 2 seconds with a Font Awesome icon the app does not load. Delete it. A splash is the opposite of a fast shop.

`NavigationProgressBar` is fine. Do not add page transition libraries.

---

## Design consistency, size, and type

### One width

| Surface | Current max width |
|---|---|
| Navbar and announcement | `1440px` |
| Product, category, wishlist | `max-w-7xl` (1280px) |
| Orders | `max-w-6xl` (1152px) |
| FAQ and contact | `max-w-4xl` / `max-w-5xl` |

On a 1440px laptop the header is wider than the product grid, so the logo and the first card do not share an edge. Pick **1280px** for catalog, product, cart page, and the navbar content. Keep reading pages (FAQ, policies, contact) at **720–768px**. Orders can match the catalog at 1280px.

### One type scale

The font is Plus Jakarta Sans with `display: swap`. That is a good single family. The sizes are not a scale. Store and admin use `text-[9px]`, `text-[10px]`, `text-[11px]`, `13px`, and `15px` next to Tailwind steps.

Target scale:

| Role | Mobile | Desktop |
|---|---|---|
| Body and inputs | 16px | 16px body, 14px dense admin tables |
| Secondary / meta | 14px | 14px |
| Captions, badges, nav labels | 12px minimum | 12px |
| Section title | `clamp(1.5rem, 1.15rem + 1vw, 2rem)` (already in `.section-title`) | same |
| Price | 16–18px, `tabular-nums` | same |

`MobileBottomNav` labels are `text-[10px]`. Raise them to 12px. Invoice form labels at 9–10px fail on a phone held at arm’s length; admin invoice editing is often done on a phone in a shop.

Use `font-variant-numeric: tabular-nums` on prices, order totals, and admin KPI numbers so columns do not jitter.

Headings should use `text-wrap: balance`. Loading copy should end with `…` (the checkout button already does this).

### Color

Tokens set primary to `#064e3b`. The navbar hover state hardcodes `#015347` and `#E3FCEF`. Those greens will drift. Use `primary` and a tint from the token (`color-mix`) everywhere, including badges that are now raw `emerald-500` and `red-500`.

Buttons in `src/components/ui/button.jsx` already list transition properties and use `focus-visible`. Store buttons that duplicate that styling with `outline-none` and `transition-all` should use the shared button or match it.

### PC overview

At 1440×900 the shop should show:

- Header 64px, content aligned to 1280px, 24–40px side padding.
- Product grid: 4 columns, cards with a fixed image ratio (already partly done) and a 2-line title.
- No hover animation that moves layout. Hover may darken the image and show the cart control.

### Mobile

- Header 56px. Bottom nav with safe-area padding (product pages already add `--mobile-bottom-nav-offset`; audit pages that do not).
- Product grid: 2 columns, gap 12px, image ratio locked so the page does not jump.
- Thumb targets at least 44px. Several icon buttons are 32px (`h-8`, `size-8`).
- `touch-action: manipulation` on the bottom nav and checkout button so the double-tap delay is gone.

---

## Reloading, database, Vercel, and API

### Storefront cache (keep)

`getLiveProductsRaw` is cached for hours and tagged `products`. Settings and categories are cached on the store layout. That is the right shape. Do not fetch the catalog from the client on the home page.

The cost: the cached function loads **every** live product. That is fine for a few hundred items. When the catalog passes roughly 1,000 live products, page the storefront query and stop building the Facebook/catalog feed from the full in-memory list (`getCatalogFeed` maps every live product).

### Admin dashboard (fix)

`getAdminDashboardData` in `src/lib/data.js` is **not** cached. Every visit runs one orders `$facet` that counts drafts, confirmed, shipped, out-for-delivery, totals, unique customers, recent orders, today’s orders, top products, and top customers, plus a products facet and a reviews query. The customer facet groups the whole non-draft order set.

Cache it for 60 seconds with `cacheTag('admin-dashboard')`. Mutations already call `revalidateTag('admin-dashboard')` in several product and order routes. Confirm every order status change revalidates that tag, or the cache will lie.

Add indexes that match the filters: `{ isDraft: 1, isDeleted: 1, status: 1, createdAt: -1 }` and `{ isDraft: 1, createdAt: -1 }`.

`getOrdersList()` and `getAdminProducts()` load entire collections and have **no callers**. Delete them so nobody wires a page to an unbounded query. `getAllProductsRaw()` is also unused outside its definition.

### Public writes

| Route | Issue |
|---|---|
| `POST /api/cart/sync` | Upsert on each checkout keystroke. No rate limit. |
| `POST /api/tracking/meta`, `/api/stock-requests`, `/api/reviews`, `/api/search-products` | Public, noted in `docs/TODO.md` item 9. |
| `GET /api/geo` | Called once per storefront session by the visitor tracker, then cached in `sessionStorage`. Acceptable. |
| Pusher presence | Every shopper opens a websocket after idle. The key falls back to a hardcoded public key in `use-visitor-tracker.js` and `live-traffic/page.jsx`. Remove the fallback so a missing env var does not connect to a real app. Skip Pusher on save-data / slow connections. |

Search stays `$regex` on `Name` (`docs/TODO.md` item 2). That is the API to replace with Atlas Search before you add instant-search UI.

### Trash and duplicate code

Safe to remove after a quick import check:

- `src/components/SplashScreen.jsx` — no imports.
- `getOrdersList` and `getAdminProducts` in `src/lib/data.js`.
- Root one-off scripts called out in `docs/TODO.md` items 23–24, if the migrations already ran.
- Cover photo model and `/api/cover-photos` only after the home builder no longer reads them (`docs/TODO.md` item 12). `getCoverPhotosRaw` is still on the home data path, so do not delete it in the first pass.

Do not split `data.js` until the dead exports are gone. A file split with the same queries does not make the site faster.

`AdminOrdersClient.jsx`, `CheckoutClient.jsx`, `InvoiceFormClient.jsx`, and `AddProductClient.jsx` / `EditProductClient.jsx` are the files that hide bugs. Split orders into list, filters, and row actions when you touch refresh behavior. Do not split them as a drive-by.

---

## Comparison with a high-end shop

Use this as a checklist, not a rewrite. Shopify, SSENSE, and Apple-style stores win on speed and trust, not on more animation.

| Area | This store | High-end baseline | Do now? |
|---|---|---|---|
| First view | Cached RSC home, progress bar, no splash in use | Content in the first paint, no interstitial | Delete unused splash only |
| Type | One good font, many ad-hoc sizes | One scale, 16px inputs, tabular prices | Yes |
| Layout | 1152 / 1280 / 1440 mixed | One content width | Yes |
| Motion | Hover lift, `transition-all`, partial reduced-motion | Almost still; motion only for feedback | Yes |
| Catalog | Cached cards, infinite grid | Same, plus virtualized admin lists | Store later; admin if lists exceed ~50 rows |
| Search | Regex | Typo-tolerant, instant, highlighted | After Atlas Search |
| Cart | Optimistic, local | Same, plus price revalidated before pay | You already revalidate in `submitOrderAction` |
| Checkout | COD + bank, strict name rules, 15px fields | 16px, full name, address book, one payment path that works | Fix bugs first |
| Confirmation | Modal + WhatsApp | Durable order URL, email, status timeline | Add the URL |
| Account | Google sign-in, wishlist sync | Saved address, order history, one review per delivered item | Address later; review rule is in TODO |
| Admin | Full refresh, uncached dashboard aggregate | Optimistic rows, cached KPIs, skeletons | Yes |
| Trust | Policies exist | Same policies, plus visible delivery promise on the product page and checkout | Copy pass, low cost |

---

## Implementation order

### Phase 1 — checkout trust (1–2 days)

1. Relax name to 2–80 characters. Allow letters, spaces, `.` `'` `-`. Relax address to 240.
2. Checkout fields at 16px on viewports under `md`.
3. Abandoned-cart sync: phone-valid, address blur, `pagehide`, and skip identical payloads.
4. Remove the card-payment label until a gateway exists.
5. After a successful order, `router.push` to the order page and keep the success modal as optional chrome.

Verify in the browser: a 30-character name submits, iPhone-width checkout does not zoom, typing the address does not fire `/api/cart/sync` on every word, and refresh on the success URL still shows the order.

### Phase 2 — admin load (1–2 days)

1. Cache `getAdminDashboardData` for about 60 seconds and tag `admin-dashboard`.
2. `Suspense` around dashboard stats and the chart.
3. On the orders list, patch the row locally and stop refreshing the whole page for a status change.
4. Delete unused `getOrdersList` and `getAdminProducts`.
5. Remove the hardcoded Pusher key fallback.

### Phase 3 — feel on weak phones and desktop alignment (2–3 days)

1. One content width: 1280px navbar + catalog + product + orders.
2. Type scale above. Bottom nav labels 12px. Prices `tabular-nums`.
3. Strip `transition-all` and hover-lift from `Navbar.jsx`, `MobileBottomNav.jsx`, product card buttons, and wishlist.
4. Reduced-motion disables marquees, autoplay, and scale animations.
5. Token greens only. No `#015347` / `#E3FCEF` in components.

Verify at 390×844 and 1440×900: header aligns with the product grid, bottom nav clears the home indicator, reduced-motion stops marquees, and adding to cart still gives feedback without a layout jump.

### Phase 4 — already listed, do when Phase 1–3 are stable

From `docs/TODO.md`, in this order: rate limits on public POSTs, guest order token plus phone, review requires a delivered order, Atlas Search, wishlist cap, product JSON-LD, then the PascalCase product field migration (high cost, do it as its own project).

---

## Explicitly later

These are real gaps versus a premium shop and they are the wrong first spend:

- Card payments and saved cards
- Multiple saved addresses
- A full returns portal
- Virtualizing the storefront grid
- Splitting `data.js` for style
- New animation libraries
- Rebuilding the admin visual language

Each of those is high cost. Phases 1–3 change conversion, phone smoothness, and Vercel/Mongo load without a new architecture.
