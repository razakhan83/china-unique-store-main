# 🔍 Full System Audit — China Unique Store

> **Scope**: Home Store (Storefront) + Admin Panel — PC & Mobile  
> **Date**: April 16, 2026  
> **Mode**: Analysis only — zero code changes

---

## Table of Contents

1. [Layout Issues (PC & Mobile)](#1-layout-issues-pc--mobile)
2. [Hydration Errors — White Spots & Layout Shifts](#2-hydration-errors--white-spots--layout-shifts)
3. [Depth Check — Every Child Page & Form](#3-depth-check--every-child-page--form)
4. [Backend Gaps — Product/Vendor Fulfillment Logic](#4-backend-gaps--productvendor-fulfillment-logic)
5. [Summary Severity Matrix](#5-summary-severity-matrix)

---

## 1. Layout Issues (PC & Mobile)

### 🖥️ PC — Full-Width & Wasted Space

| Area | Issue | Severity |
|------|-------|----------|
| **Homepage hero** | Fixed height (`h-[460px] lg:h-[560px]`) doesn't scale for ultra-wide monitors (1440p+). The `54vh` mobile height is fine, but the desktop capping means wasted vertical real estate on premium displays. | ⚠️ Medium |
| **Product grid** | `max-w-7xl` (80rem) is correct, but the 4-column cap at `lg:grid-cols-4` wastes ~30% of horizontal space on displays > 1600px. No `xl:grid-cols-5` or `2xl:grid-cols-6` breakpoint. | ⚠️ Medium |
| **Navbar centering** | Desktop nav uses `absolute left-1/2 -translate-x-1/2` centering. If the logo or right-side actions grow too wide, the nav can overlap. No `clamp()` or container query safety. | 🟡 Low |
| **Footer** | `grid-cols-1 md:grid-cols-3` — no `lg` or `xl` treatment. At 1440px+ the three columns are excessively wide. The footer description text `max-w-sm` helps but the grid cells themselves aren't constrained. | 🟡 Low |
| **Admin dashboard** | The `xl:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.8fr)]` layout works, but the stat cards section (`sm:grid-cols-2 xl:grid-cols-4`) at very wide screens has excessive horizontal padding between cards — no `max-w` constraint on the section itself. | 🟡 Low |
| **Admin sidebar** | Collapsed width `5.25rem` is good, expanded `17rem` is fine. BUT: no `xl:20rem` treatment — on ultra-wide the sidebar feels cramped relative to the content area. | 🟡 Low |

### 📱 Mobile — App-Feel Gaps

| Area | Issue | Severity |
|------|-------|----------|
| **Product detail — sticky add-to-cart bar** | The mobile fixed bar sits at `bottom-[calc(env(safe-area-inset-bottom)+3.5rem)]`. But the MobileBottomNav also has `pb-[calc(env(safe-area-inset-bottom)+0.7rem)]`. On some devices (especially iPhones with dynamic island), these two fixed bars **visually collide** or leave an awkward gap. The ATC bar's `3.5rem` offset doesn't precisely account for the MobileBottomNav's variable height. | 🔴 High |
| **CartDrawer on mobile** | `w-full min-w-0 max-w-none` on the Sheet makes it full screen — good for mobile feel. BUT: there's **no visual back-navigation affordance** (swipe-to-dismiss works via Sheet, but no visible drag handle or back arrow). On iOS this feels non-native. | ⚠️ Medium |
| **Mobile sidebar (Sheet)** | `w-screen ... sm:max-w-none md:w-[min(76vw,22rem)]` — on mobile this is **full screen width**, which is correct. However, the `sm:max-w-none` means on a landscape tablet the sidebar covers the entire screen even at `sm` breakpoint. | ⚠️ Medium |
| **Footer bottom padding** | `pb-[calc(env(safe-area-inset-bottom)+5.5rem)]` accounts for the mobile bottom nav. But `5.5rem` is a magic number that breaks if the bottom nav height changes. | 🟡 Low |
| **Search overlay on mobile** | When `isSearchOpen` is true, the search shell uses `absolute inset-x-0 top-full` positioning. On short viewports, the suggestion dropdown can overflow below the fold with no `max-h` or `ScrollArea`. | ⚠️ Medium |
| **Hero slider touch** | Custom touch handling (`touchStart`/`touchEnd`) with a `40px` threshold. Modern browsers handle this fine, but there's **no passive event listener optimization**, and the slider doesn't use CSS `scroll-snap` — it's entirely JS-driven. On low-end Android devices, this can feel sluggish. | 🟡 Low |
| **Checkout page** | `pb-36 md:pb-16` — the `pb-36` (9rem) on mobile is to clear the bottom nav, but it's an over-estimate that creates excessive whitespace at the page bottom on phones without a bottom nav bar (web browsers without safe-area). | 🟡 Low |

### 🔄 Overflow / Breaking Issues

| Area | Issue | Severity |
|------|-------|----------|
| **Announcement marquee** | 6 repetitions × all messages creates a very wide `width: max-content` track. On pages where the marquee renders before CSS loads, you get a momentary horizontal scrollbar flash (`overflow-x: hidden` is on the container, but `overflow-x: clip` on body catches it — still a paint issue). | 🟡 Low |
| **Product card title** | `line-clamp-2 min-h-9` on mobile, `sm:line-clamp-1 sm:min-h-5` on desktop. Long product names in Arabic/Urdu script can break the `min-h` constraint because of different line-height metrics. | ⚠️ Medium |
| **Admin orders client** | The `AdminOrdersClient.jsx` file is **49KB** — this is a massive client component. On mobile with slow 3G, this entire bundle must download before the orders page becomes interactive. | 🔴 High |
| **Admin products client** | Similarly, `AdminProductsClient.jsx` is **45KB**. Same concern. | 🔴 High |

---

## 2. Hydration Errors — White Spots & Layout Shifts

> [!IMPORTANT]
> The `suppressHydrationWarning={true}` on both `<html>` and `<body>` **masks** hydration mismatches silently. This means errors exist but are hidden. The "white spots" you're seeing are the **visual symptoms** of these suppressed mismatches.

### Root Cause #1: `'use cache'` on Root Layout

```
src/app/layout.js → line 48: 'use cache'
src/app/(store)/layout.js → line 11: 'use cache'
```

The **root layout** is cached with `cacheLife('foreverish')` (30-day stale). This means the `settings` object (tracking IDs, store name, etc.) is baked into the cached HTML. When settings change in the DB, the cached layout still serves the old HTML, but client components hydrate with fresh data from context providers → **mismatch**.

**Visual symptom**: The `TrackingScripts` component may render different pixel IDs than what the cached HTML expected. The `Toaster` position and the `storeName` in the navbar can flash to the correct value.

### Root Cause #2: Cart State from localStorage

[CartContext.jsx](file:///c:/Users/razak/Main%20Projects/China-Unique-Main-1.0-stable-original/src/context/CartContext.jsx) — Lines 65-78:

```jsx
useEffect(() => {
  const savedCart = localStorage.getItem(CART_STORAGE_KEY);
  // ...sets cart state
  setIsInitialized(true);
}, []);
```

The cart count badge in the Navbar (`{cartCount > 0 ? <span>...{cartCount}</span> : null}`) **renders `null` on the server** (cart is empty), then **pops in with the real count** after the `useEffect` fires on the client.

**Visual symptom**: The cart badge "white spots" — a blank area where the badge should be, then a flash-in of the number. This is the classic FOUC (Flash of Unstyled/Unhydrated Content).

### Root Cause #3: Session-dependent Rendering

[Navbar.jsx](file:///c:/Users/razak/Main%20Projects/China-Unique-Main-1.0-stable-original/src/components/Navbar.jsx) — Lines 441-505:

```jsx
{session ? (
  <div className="hidden md:block">
    <DropdownMenu>...avatar...</DropdownMenu>
  </div>
) : (
  <div className="hidden md:block">
    <Button>...user icon...</Button>
  </div>
)}
```

`useSession()` starts as `{ data: null, status: 'loading' }` on first render, then transitions. The server-rendered HTML has `null` session, so it renders the login button. On the client, if the user is logged in, NextAuth hydrates the session → the avatar replaces the login button → **layout shift**.

**Visual symptom**: The right side of the navbar "jumps" as the user icon swaps to the avatar.

### Root Cause #4: Wishlist State Hydration

[WishlistContext.jsx](file:///c:/Users/razak/Main%20Projects/China-Unique-Main-1.0-stable-original/src/context/WishlistContext.jsx) — Lines 124-207:

The wishlist loads from localStorage (guest) or API (authenticated). During SSR, all wishlist states are empty. On the client, heart icons that should be "filled" suddenly animate in → **flash/white-spot on every ProductCard's wishlist button**.

### Root Cause #5: `formatDistanceToNow` in Admin Dashboard

[Admin page.js](file:///c:/Users/razak/Main%20Projects/China-Unique-Main-1.0-stable-original/src/app/admin/page.js) — Line 187:

```jsx
{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
```

This is rendered in a **Server Component** with `'use cache'`. The "3 minutes ago" text is computed at cache-time and served stale. When the page is viewed hours later, the text doesn't match reality. This isn't a hydration error per se (it's a stale cache issue), but it creates **perceived incorrect data**.

### Root Cause #6: `date-fns` formatDistanceToNow Timezone Mismatch

Even without caching, `date-fns` uses the system timezone. If the server is in UTC and the client is in UTC+5 (Pakistan), the "time ago" text computed on the server will differ from what the client would compute → hydration mismatch. The `suppressHydrationWarning` hides this.

### Summary of White Spot Locations

| Page | Element | Cause |
|------|---------|-------|
| **All pages** | Cart badge (top-right) | localStorage cart initialization |
| **All pages** | Navbar user/avatar area | Session status transition |
| **Product pages** | Wishlist heart buttons | Wishlist state initialization |
| **Homepage** | Hero slider first frame | Client-side `useState(0)` for `activeIndex` after SSR |
| **Admin dashboard** | "X minutes ago" timestamps | Stale cache / timezone mismatch |
| **Product detail** | Mobile fixed ATC bar | Renders server-side with `quantity=1`, same on client — no mismatch here actually, but the fixed position bar's appearance is jarring |

---

## 3. Depth Check — Every Child Page & Form

### 🏪 Storefront Pages

| Page | Route | Status | Issues |
|------|-------|--------|--------|
| **Homepage** | `/` | ✅ Solid | Home section renderer is clean. `content-visibility: auto` on lazy sections is good. |
| **Products listing** | `/products` | ✅ Good | Suspense boundaries correct, skeleton fallbacks present, pagination works. The `ProductCardPlaceholder` for layout stability is smart. |
| **Product detail** | `/products/[id]` | ⚠️ Issues | Three redundant calls to `getProductBySlug(slug)` (breadcrumb, hero, reviews). Should be a single data fetch passed down. SEO/JSON-LD is comprehensive. |
| **Checkout** | `/checkout` | ⚠️ Issues | 31KB `CheckoutClient.jsx` — massive single component. The CSS module (`CheckoutClient.module.css` at 7.8KB) is well-scoped. But the form structure uses raw `<div>` + `space-y-*` instead of shadcn `FieldGroup + Field`. |
| **Wishlist** | `/wishlist` | ⚠️ Unknown | Directory exists but no page file was inspected — could be empty or placeholder. |
| **Orders** | `/orders` | ⚠️ Unknown | Same — directory exists, needs content verification. |
| **Auth** | `/auth` | 🟡 Minimal | Auth is Google-only via `next-auth`. No fallback for non-Google users. |
| **About Us** | `/about-us` | 🟡 Unknown | Directory exists — likely static content page. |
| **Refund Policy** | `/refund-policy` | 🟡 Unknown | Same — likely static. |
| **Privacy Policy** | `/privacy-policy` | 🟡 Unknown | Same. |
| **Shipping Policy** | `/shipping-policy` | 🟡 Unknown | Same. |
| **Settings** | `/settings` | ⚠️ Unknown | User-facing account settings page — needs inspection. |

### 🛡️ Admin Pages

| Page | Route | Status | Issues |
|------|-------|--------|--------|
| **Dashboard** | `/admin` | ✅ Good | Clean server component. Stat cards, recent orders, top vendors. `requireAdmin()` gate is correct. |
| **Login** | `/admin/login` | ✅ Works | Bypasses layout shell (`if (pathname === '/admin/login') return children`). |
| **Products list** | `/admin/products` | 🔴 Heavy | 45KB client component. Should be split into table/filters/modals. |
| **Add product** | `/admin/products/add` | ⚠️ Check | Exists as directory — likely a large form component. |
| **Edit product** | `/admin/products/edit` | ⚠️ Check | Exists as directory. |
| **Orders** | `/admin/orders` | 🔴 Heavy | 49KB client component. Most complex admin page. |
| **Order detail** | `/admin/orders/[id]` | ⚠️ Check | Exists — likely an order detail/edit view. |
| **Vendors** | `/admin/vendors` | 🟡 Basic | Simple CRUD — vendor name + shop number only. |
| **Categories** | `/admin/categories` | 🟡 Basic | Standard category management. |
| **Reviews** | `/admin/reviews` | 🟡 Basic | Review moderation. |
| **Users** | `/admin/users` | 🟡 Basic | User/customer listing. |
| **Shipping** | `/admin/shipping` | 🟡 Basic | Shipping rate configuration. |
| **Home Layout** | `/admin/home-page` | ✅ Good | Homepage section ordering via drag-and-drop (`@dnd-kit` in dependencies). |
| **Cover Photos** | `/admin/cover-photos` | ✅ Good | Hero slider management. |
| **Settings** | `/admin/settings` | ✅ Comprehensive | Store config, tracking pixels, social links, announcement bar, logos. |

### 🔎 Form/Component Consistency Issues

| Component | Issue |
|-----------|-------|
| **ProductActions notify form** | Uses raw `<Label>` + `<Input>` + `space-y-*` divs instead of shadcn `FieldGroup + Field`. Validation uses `toast.error()` — no inline field-level validation with `data-invalid`. |
| **CheckoutClient form** | 31KB client component — likely has the same raw div-based form pattern. Not using `FieldGroup`/`Field` from shadcn. |
| **AdminOrdersClient** | At 49KB, this almost certainly has inline form patterns for order editing, status updates, etc. — needs component extraction. |
| **AdminProductsClient** | At 45KB, same concern — product add/edit forms, bulk actions, filters all in one file. |
| **LinkOrdersForm** | 4.4KB — smaller but same pattern risk. |
| **Navbar dropdown items** | Using `<ShoppingBag className="mr-2 h-4 w-4" />` inside DropdownMenuItems — should use `data-icon` prop, not manual sizing (`h-4 w-4` → remove per shadcn rules). |
| **CartDrawer** | Icons like `<Minus />`, `<Plus />`, `<Trash2 />` inside buttons have no `data-icon` attribute. |

---

## 4. Backend Gaps — Product/Vendor Fulfillment Logic

### 🔴 Critical: No Inventory Decrement on Order

The `Order` model tracks items with `productId`, `name`, `price`, `quantity`, but **there is no mechanism to decrement `Product.stockQuantity`** when an order is placed. The `stockQuantity` field exists on the Product model (line 113: `stockQuantity: { type: Number, default: 0, min: 0 }`) but it's never updated by the order flow.

**Impact**: You can't trust `StockStatus` or `stockQuantity` for fulfillment because they're manually set, not automatically updated.

### 🔴 Critical: No Order-to-Vendor Link

The order flow captures which *products* were ordered, but there's **no reverse lookup from order items to vendor source**. The `Order.items` schema stores:

```js
{ productId, name, price, quantity, image, isReviewed }
```

But NOT: `vendorId`, `vendorName`, `vendorPrice`, `vendorProductName`.

**Impact**: When fulfilling an order, the admin must:
1. Open the order → see the product names
2. Manually go to each product → find which vendor supplies it
3. Note the vendor's shop number and product name
4. Manually contact the vendor

This is **not scalable** for fast fulfillment.

### 🔴 Critical: No Vendor Contact Information

The `Vendor` model only stores:

```js
{ name, shopNumber }
```

There is **no phone number, WhatsApp, email, or address** field. For fast order fulfillment, the admin needs to contact vendors directly — but the system doesn't store how.

### ⚠️ Medium: Vendor-Product Price Gap

The `ProductVendorSchema` stores `vendorPrice` (what you pay the vendor) and the `Product.Price` (what you sell for). But there's **no margin calculation, no cost-of-goods tracking, and no profit reporting** in the admin dashboard. The `totalRevenue` on the dashboard is gross revenue, not profit.

### ⚠️ Medium: No Purchase Order / Vendor Order System

There's no mechanism to:
- Generate a purchase order for a vendor
- Track which items have been sourced from which vendor
- Batch vendor orders (e.g., "I need 5 items from Vendor A, 3 from Vendor B")
- Mark vendor sourcing status per order item

### ⚠️ Medium: No Order Status Granularity for Fulfillment

Current order statuses: `Pending → Confirmed → In Process → Delivery Address Issue → Delivered → Returned`

Missing for fast fulfillment:
- `Sourcing` (items being collected from vendors)
- `Packed` (items ready for shipping)
- `Shipped` (handed to courier)
- `Out for Delivery`

The gap between "In Process" and "Delivered" is too wide for operational visibility.

### 🟡 Low: No Multi-Vendor Order Splitting

If an order has items from 3 different vendors, there's no system to:
- Split the order into vendor-specific sub-orders
- Track fulfillment per vendor
- Handle partial shipments

### 🟡 Low: `StockStatus` is a Manual Enum, Not Computed

```js
StockStatus: {
    type: String,
    enum: ['In Stock', 'Out of Stock'],
    required: true,
}
```

This is set manually. It's not derived from `stockQuantity > 0`. If someone forgets to toggle it, an out-of-stock product stays "In Stock" on the storefront.

### 🟡 Low: No Bulk Product Update for Vendors

When a vendor's shop number or name changes, the `vendors` array snapshot on every product must be updated manually. There's no cascading update from the Vendor document to all Product vendor snapshots.

---

## 5. Summary Severity Matrix

### 🔴 Critical (Must Fix)

| # | Area | Issue |
|---|------|-------|
| 1 | **Mobile layout** | Product detail ATC bar collides with MobileBottomNav on certain devices |
| 2 | **Performance** | `AdminOrdersClient.jsx` (49KB) and `AdminProductsClient.jsx` (45KB) — single client components too large for mobile |
| 3 | **Backend** | No inventory decrement on order placement |
| 4 | **Backend** | No vendor info in order items — manual cross-referencing required for fulfillment |
| 5 | **Backend** | No vendor contact details (phone/WhatsApp/email) in Vendor model |

### ⚠️ Medium (Should Fix)

| # | Area | Issue |
|---|------|-------|
| 6 | **Hydration** | Cart badge flash-in from localStorage |
| 7 | **Hydration** | Session-dependent navbar layout shift |
| 8 | **Hydration** | Wishlist heart button flash-in |
| 9 | **Layout** | Hero slider fixed heights wasting space on large screens |
| 10 | **Layout** | Product grid capped at 4 columns |
| 11 | **Mobile** | CartDrawer has no visible drag/dismiss affordance |
| 12 | **Mobile** | Sidebar covers full screen on landscape tablet |
| 13 | **Mobile** | Search suggestions can overflow viewport |
| 14 | **Product detail** | Three redundant `getProductBySlug()` calls |
| 15 | **Forms** | Not using shadcn `FieldGroup + Field` pattern |
| 16 | **Backend** | No margin/profit tracking |
| 17 | **Backend** | No purchase order system for vendors |
| 18 | **Backend** | Missing fulfillment-specific order statuses |

### 🟡 Low (Nice to Have)

| # | Area | Issue |
|---|------|-------|
| 19 | **Layout** | Footer columns too wide at 1440px+ |
| 20 | **Layout** | Admin sidebar doesn't scale to XL |
| 21 | **Mobile** | Footer `pb-5.5rem` is a fragile magic number |
| 22 | **Mobile** | Hero slider custom touch not using passive listeners |
| 23 | **Mobile** | Checkout page excessive bottom padding |
| 24 | **Backend** | `StockStatus` is manual, not computed from `stockQuantity` |
| 25 | **Backend** | No cascading vendor name/shop updates to product snapshots |
| 26 | **Backend** | No multi-vendor order splitting |
| 27 | **Hydration** | Admin dashboard stale "X minutes ago" from cache |
| 28 | **Navbar** | Icon sizing uses manual `h-4 w-4` instead of shadcn conventions |

---

> [!CAUTION]
> The combination of **suppressed hydration warnings** + **`'use cache'` on layouts** + **localStorage-driven cart/wishlist** creates a system where the UI **appears** to work but silently accumulates visual debt. The "white spots" are not random — they are predictable, reproducible artifacts of client-side state initializing after server-rendered HTML. Removing `suppressHydrationWarning` will surface the exact mismatches in the dev console.

> [!TIP]
> For fastest ROI on professional feel:
> 1. Fix the mobile ATC bar collision (immediate user-facing bug)
> 2. Split the 45-49KB admin client components (performance)
> 3. Add `vendorId` + `vendorPrice` + `vendorName` to `Order.items` schema (fulfillment)
> 4. Add contact fields to `Vendor` model (fulfillment)
> 5. Wrap cart badge in a client-only boundary that renders a `Skeleton` until initialized (hydration)
