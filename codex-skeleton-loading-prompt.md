# Global Skeleton Loading & Data Fetching Guidelines

This document outlines the standard rules and best practices for creating skeleton loading UI states and handling data fetching transitions across the **entire application** (including product listing, product detail, cart, checkout, orders, and admin dashboard).

## Core Principles

1. **One Unified Primitive (`src/components/ui/skeleton.jsx`)**
   - **Rule:** Every skeleton anywhere in the app MUST reuse or extend `src/components/ui/skeleton.jsx`. 
   - **Anti-pattern:** Do not create separate skeleton primitives per page. Always compose complex skeletons using the base UI skeleton component.

2. **Match the Real Layout Exactly**
   - **Rule:** Skeleton loading states must be a 1:1 structural representation of the actual component that will eventually render.
   - **Reference Pattern:** `AdminDashboardSkeleton.jsx` is the canonical example of matching the real layout exactly. The padding, gap, border-radius, and flex/grid alignment of the skeletons must perfectly match the final component to prevent cumulative layout shift (CLS). This rule applies everywhere, not just the admin panel.

3. **Next.js App Router Data Fetching & Streaming**
   - **Rule:** Leverage per-route `loading.jsx` (or `loading.tsx`) to stream loading UI immediately from the server while data fetches.
   - **Suspense Boundaries:** Use `<Suspense fallback={<SkeletonComponent />}>` around individual slow-loading components instead of blocking the entire page layout.
   - **Cache-first Rendering:** Ensure static parts of the layout load instantly, while dynamic sections are wrapped in Suspense with appropriate skeletons.

4. **Image Loading UX (Blur + Shimmer)**
   - **Rule:** Images should use a combination of blur placeholders and shimmer skeleton effects before the image is fully loaded. This is especially important for Product Listings and Product Detail pages.

5. **Smooth Transitions (No-Flicker Navigation & Staggered Reveal)**
   - **Rule:** Fast navigations should avoid flashing skeletons if data resolves immediately. 
   - **Rule:** For lists (like product grids), use staggered lazy-load reveals. Skeletons in a grid should ideally fade in sequence, and the actual content should replace them smoothly rather than popping in aggressively.

6. **Order Page Border Fix & Table Consistency**
   - **Rule:** When rendering skeletons in tables or lists (like the orders page), ensure borders and separators are consistent between the loading state and the final state. Do not drop table borders during the loading phase, otherwise the UI structure will collapse and shift upon data load.

---

## Implementation Example: `ProductCard`

To illustrate how the `AdminDashboardSkeleton.jsx` layout-matching pattern translates to other components, here is an example of composing a `ProductCardSkeleton` using the single base primitive:

```jsx
// Example: src/components/ProductCardSkeleton.jsx
import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    // Must match the actual ProductCard padding, gap, and borders exactly
    <div className="flex flex-col gap-4 p-4 border rounded-xl h-full shadow-sm">
      {/* Image Skeleton (Blur+Shimmer concept applied here) */}
      <Skeleton className="w-full aspect-[4/5] rounded-lg" />
      
      <div className="flex flex-col gap-2">
        {/* Title Skeleton */}
        <Skeleton className="h-5 w-3/4" />
        
        {/* Price Skeleton */}
        <Skeleton className="h-6 w-1/4" />
        
        {/* Category/Badge Skeleton */}
        <Skeleton className="h-4 w-1/3 mt-2" />
      </div>

      <div className="mt-auto pt-4">
        {/* Button Skeleton */}
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}
```

### Usage with Suspense (Per-Route Loading or Streaming)

```jsx
import { Suspense } from "react";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
// ProductListFetcher would be a Server Component that fetches the actual products
import { ProductListFetcher } from "@/components/ProductListFetcher"; 

export default function ProductListing() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {/* Show skeletons while loading products */}
      <Suspense fallback={
        <>
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </>
      }>
        <ProductListFetcher />
      </Suspense>
    </div>
  );
}
```
