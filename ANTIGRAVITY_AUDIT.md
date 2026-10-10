# CHINA UNIQUE STORE — COMPLETE ANTIGRAVITY AUDIT & EXECUTION ROADMAP
## Verified Master Audit + Step-by-Step Task Specifications

**Store:** https://www.chinauniquestore.com  
**Repo:** https://github.com/razakhan83/china-unique-store-main  
**Stack:** Next.js 16.3 App Router (`src/app`), React 19, JavaScript (NOT TypeScript), MongoDB Atlas + Mongoose 9, NextAuth 4, Tailwind 4, Cloudinary, Vercel  
**Source:** Audit & Verification from `public/CHINA-UNIQUE-STORE-ANTIGRAVITY-FULL.md`

---

## EXECUTION RULES & ARCHITECTURAL INVARIANTS

1. **Pre-read requirement:** Read existing code in mentioned files BEFORE modifying. Match existing conventions, patterns, naming, and architecture.
2. **Cache architecture preservation:** Do NOT alter the `'use cache'` architecture with `cacheLife` defined in `next.config.mjs`.
3. **Cloudinary presets:** Do NOT modify Cloudinary presets or folder signing logic.
4. **Order pricing integrity:** Never break server-side order re-pricing and idempotency in `src/app/actions/order.actions.js`.
5. **Single pricing source:** Currency is always PKR. Display prices strictly follow `Rs X,XXX` format from `src/lib/pricing.js`.
6. **Zero hardcoded secrets:** All credentials must come strictly from `process.env`. No hardcoded fallback strings.
7. **Strict phased commits:** One task at a time. Each task comes with files changed, rationale, and manual test steps.

---

## EXECUTION ORDER

`TASK 0 (Master Context)` → `TASK 1 (Security)` → `TASK 3 (Pricing Source of Truth)` → `TASK 2 (Buy Now)` → `TASK 4 (Checkout Summary)` → `TASK 5 (Quick Wins & Formatting)` → `TASK 11 (60FPS Mobile Performance)` → `TASK 6 (Database Full-Scan Fixes)` → `TASK 7 (Vercel Load Optimization)` → `TASK 8 (Wishlist & Cart Completion)` → `TASK 9 (Admin Correctness)` → `TASK 10 (SEO & Repository Cleanup)`

---

## TASK BREAKDOWN & AUDIT MAPPING

### TASK 1 — [P0 CRITICAL] Admin Security Fix
- **Targets:** `src/lib/auth.js`, `src/lib/pusher-server.js`, `src/lib/requireAdmin.js`, `src/hooks/use-visitor-tracker.js`, `src/app/api/pusher/auth/route.js`, `src/app/api/admin/traffic/history/route.js`.
- **Issues:**
  1. Plaintext admin password comparison: Replace with `bcryptjs` comparing against `process.env.ADMIN_PASSWORD_HASH`.
  2. Hardcoded Pusher secrets: Strip all fallback credentials (`2191144`, `0bba93dfa3f84352ac50`, `b91551dde2e7a9d77437`). Fail gracefully or throw if missing in server. Remind Ahmed to rotate keys in Pusher console.
  3. Demo guest privilege leak: Ensure demo sessions (`isDemo: true`) cannot view customer PII across admin API routes. Guard routes with `requireApiAdmin()`.

### TASK 3 — [P0 CRITICAL] Single Price Source of Truth
- **Targets:** `src/lib/pricing.js` (create), `src/components/product/ProductCard.jsx`, product page, cart drawer, `CheckoutClient.jsx`.
- **Issues:**
  - Inconsistent calculations across cards, listings, and checkout.
  - Implement unified `getSellingPrice`, `getComparePrice`, `getDiscountPercent`, and `formatPrice` (`Rs X,XXX`).
  - Standardize all currency strings and fix layout heights for zero/missing prices.

### TASK 2 — [P0 CRITICAL] Buy It Now Flow
- **Targets:** Product detail page CTA handlers, `CartContext`, checkout redirection.
- **Issues:**
  - "Buy It Now" currently behaves like "Add to Cart" and only opens the drawer or toast without navigating to `/checkout`.
  - Fix: Add item with selected quantity, prevent drawer opening, and immediately `router.push('/checkout')`.

### TASK 4 — [P0] Checkout Summary & Shipping Clarity
- **Targets:** `src/app/(store)/(checkout-shell)/checkout/CheckoutClient.jsx`, `src/lib/checkoutPricing.js`.
- **Issues:**
  - Misleading subtotal/shipping labels (shipping showing under subtotal).
  - Double currency strings (`PKRRs.1,590`).
  - Silent shipping jump between Karachi (Rs 200) and other cities (Rs 300).
  - Remove distraction upsell modal/section from checkout tunnel.

### TASK 5 — [P0] Missing Prices, 0 Counters & Trust Polish
- **Targets:** Homepage trust counters, ProductCard layout, Footer social links, URL parameter handlers.
- **Issues:**
  - Cards missing prices rendered with empty gaps.
  - Trust strip showing `0+ HAPPY CUSTOMERS / 0+ ORDERS` despite 390+ orders in DB; pull real cached counts or hide if unavailable.
  - Fix typography spacing: `"SaveRs."` -> `"Save Rs"`, `"©2026China"` -> `"© 2026 China Unique Store."`.
  - Fix Dollar Store page title when `?price=under300`.

### TASK 11 — [P1] 60 FPS Mobile Performance
- **Targets:** `src/components/home/CategoryProductSlider.jsx`, `HeroSlider.jsx`, `HomeTestimonialsCarousel.jsx`, `globals.css`.
- **Issues:**
  - 11 carousel timers running simultaneously offscreen causing frame drops on budget mobile devices.
  - Continuous marquee `will-change`.
  - Heavy `backdrop-blur` in mobile viewports.
  - Implement `useAutoplayInView` (IntersectionObserver) to pause offscreen sliders.

### TASK 6 — [P1] Database Full-Scan Fixes
- **Targets:** `src/lib/data.js` (`getOrdersList`, `getAdminProducts`, `getAllProductsRaw`), `src/app/api/products/route.js`, `src/models/Order.js`.
- **Issues:**
  - Migrate uncapped `.find({})` calls to paginated queries (`getOrdersListPage`, `getAdminProductsPage`).
  - Restrict `/api/products` public route: filter by `showOnStore: true`, paginate max 100, projection without full markdown description, escape search regex.
  - Clean up dead index on `Order.js` (`normalizedPhone`).

### TASK 7 — [P1] Vercel Load & Serverless Cost Optimization
- **Targets:** `src/app/api/geo/route.js`, `src/app/api/courier/track/route.js`, `src/proxy.js`.
- **Issues:**
  - `/api/geo` hitting MongoDB and external IP service on every single bot/human pageview. Introduce 10% sampling, skip bot user-agents.
  - `/api/courier/track` scraping on every reload. Cache results using `nocLastTrackedAt` (10 min TTL) and rate limit.

### TASK 8 — [P1] Wishlist, /cart Page & Product Page Trust
- **Targets:** `WishlistContext`, `src/app/(store)/wishlist/page.jsx`, `src/app/(store)/cart/page.jsx`, product page detail view.
- **Issues:**
  - Wishlist button currently disabled/non-functional; wire local storage optimistic updates.
  - `/cart` route currently returns 404 (only drawer exists); build dedicated `/cart` page with line items and WhatsApp order CTA.
  - Add product trust badge (stock, delivery timeline, returns) and sticky mobile bottom bar.

### TASK 9 — [P1/P2] Admin Correctness Pack
- **Targets:** `src/app/admin/orders`, `src/app/api/admin/orders/bulk-delete/route.js`, time zone formatting, dashboard stats.
- **Issues:**
  - Add missing bulk soft-delete route for orders with confirmation.
  - Fix order total mismatch in admin order table.
  - Format all admin dates in PKT (`Asia/Karachi`).
  - Correct dashboard user count vs customer count labels.

### TASK 10 — [P2] SEO, Catalog Feed & Cleanup
- **Targets:** `src/app/api/google-feed/route.js`, root cleanup scripts, `HeroSlider.jsx`, `StoreCustomPage.jsx`.
- **Issues:**
  - Correct feed product links from `/product/[slug]` to `/products/[slug]`.
  - Cache catalog feed queries with tag `feeds`.
  - Remove unreferenced scratch scripts (`fix.js`, `fix3.js`, etc.) and sensitive test dumps from `public/`.
  - Ensure semantic `<h1>` on Hero section and sanitize custom rich text content.
