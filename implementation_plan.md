# Fix MongoDB Query Performance — Skeleton Screen Hangs (10–40s)

## Problem Summary

The application intermittently gets stuck on skeleton screens (loading.tsx) for **10–40 seconds**. Your server-side instrumentation confirmed:
- **Mongoose connection:** Fast (5–10ms) ✅ — singleton + pooling works correctly
- **`getProductBySlug`:** ~27,095ms (27 seconds) ❌
- **`getStoreSettings`:** ~38,961ms (39 seconds) ❌

These timings are consistent with **MongoDB collection scans (COLLSCAN)** — the database has to read every document to find matches when the right indexes are missing.

---

## Investigation Results

### ✅ What's Already Well-Indexed (No Action Needed)

| Model | Existing Indexes | Verdict |
|-------|-----------------|---------|
| **Product** | `{isLive:1, createdAt:-1}`, `{isLive:1, Category:1, createdAt:-1}`, `{isLive:1, slug:1}`, `{isLive:1, isDiscounted:1, createdAt:-1}`, `{isLive:1, isNewArrival:1, createdAt:-1}`, `{isLive:1, isBestSelling:1, createdAt:-1}`, `{vendors.name:1}`, `{vendors.vendorId:1}` | Well covered for most queries |
| **Order** | `{createdAt:-1}`, `{status:1, createdAt:-1}`, `{customerEmail:1, createdAt:-1}`, `{secureToken:1}`, `{status:1, customerEmail:1, items.productId:1, createdAt:-1}` | Good |
| **Category** | `{sortOrder:1, name:1}`, `{isEnabled:1, showOnHome:1, sortOrder:1, name:1}` | Good |
| **Review** | `{productId:1, isApproved:1, createdAt:-1}`, `{userId:1, createdAt:-1}` | Good |
| **User** | `{disabled:1, createdAt:-1}`, `{createdAt:-1}` | Good |
| **Notification** | `{isRead:1, createdAt:-1}`, `{type:1, createdAt:-1}` | Good |
| **OrderLog** | `{orderId:1, createdAt:-1}` | Good |
| **Vendor** | `{name:1}` | Good |
| **StockRequest** | `{productId:1, status:1, email:1}`, `{productId:1, status:1, whatsappNumber:1}`, `{status:1, createdAt:-1}` | Good |

---

### 🔴 Root Cause: `getProductBySlug` Query

[Product.js:L182](file:///c:/Users/razak/Main%20Projects/China-Unique-Main-1.0-stable-original/src/models/Product.js#L182) defines index `{isLive:1, slug:1}` which **should** cover the `getProductBySlug` query at [data.js:L1256](file:///c:/Users/razak/Main%20Projects/China-Unique-Main-1.0-stable-original/src/lib/data.js#L1256):

```js
Product.findOne({ slug: productSlug, isLive: true })
```

> [!IMPORTANT]
> **This is a field-order mismatch issue**. The compound index is `{isLive:1, slug:1}`, but the **ideal** index for this query should be `{slug:1, isLive:1}`. Since `slug` is the **highly selective** field (unique per product) and `isLive` is a **low selectivity** boolean, having `slug` first would allow MongoDB to narrow down to 1 document immediately.
>
> However, MongoDB **can still use** the `{isLive:1, slug:1}` index — it just scans all `isLive:true` entries to find the matching slug. With a compound index present, a 27-second query should NOT happen unless **the index was never actually created in the database**.

### 🔴 Root Cause: `getStoreSettings` Query

[data.js:L409](file:///c:/Users/razak/Main%20Projects/China-Unique-Main-1.0-stable-original/src/lib/data.js#L409):
```js
Settings.findOne({ singletonKey: SETTINGS_KEY })
```

The **Settings model has NO index on `singletonKey`**! While `singletonKey` has `unique: true` in the Mongoose schema ([Settings.js:L31](file:///c:/Users/razak/Main%20Projects/China-Unique-Main-1.0-stable-original/src/models/Settings.js#L31)), Mongoose's `unique: true` **does** create a unique index in MongoDB. So this should be fast.

> [!WARNING]
> **The real issue is likely that the Mongoose schema indexes were never synced to the production database.** Mongoose only auto-creates indexes when `autoIndex: true` (the default in development), but in production environments or when using `bufferCommands: false`, indexes may never have been created. The `unique: true` constraint creates an index, but the compound indexes defined via `Schema.index()` calls may not be present in your actual database.

---

## 🔍 Confirmed Diagnosis

The **most likely root cause** is:

1. **Schema-defined indexes were never created in the production MongoDB database.** Mongoose doesn't auto-create indexes when `autoIndex` is `false` (often the production default) or when the connection options don't trigger `ensureIndexes()`.

2. Your connection config at [mongooseConnect.js:L18](file:///c:/Users/razak/Main%20Projects/China-Unique-Main-1.0-stable-original/src/lib/mongooseConnect.js#L18) uses `bufferCommands: false` but doesn't explicitly set `autoIndex`. The default for `autoIndex` depends on the Mongoose version and environment.

---

## Proposed Changes

### Phase 1: Verify & Create Missing Indexes (Critical — Immediate Fix)

#### Option A: Create Indexes via MongoDB Atlas UI or Shell (Recommended)

Run these commands directly in your MongoDB Atlas console or `mongosh`:

```js
// Products collection — optimize the slug lookup (most critical)
db.products.createIndex({ slug: 1, isLive: 1 }, { name: "slug_1_isLive_1" })

// Verify all expected indexes exist
db.products.getIndexes()
db.settings.getIndexes()
db.categories.getIndexes()
db.orders.getIndexes()
db.reviews.getIndexes()
```

> [!IMPORTANT]
> **Before creating any new indexes, first verify what indexes actually exist in your production database.** If the existing `{isLive:1, slug:1}` compound index is present, the 27s query time points to a different issue (e.g., serverless cold start, network issues, or the Atlas cluster being paused/scaling). If it's missing, that confirms the root cause.

#### Option B: Add a One-Time Index Sync Script

Create a migration script that explicitly ensures all indexes exist.

#### [NEW] [ensure-indexes.mjs](file:///c:/Users/razak/Main%20Projects/China-Unique-Main-1.0-stable-original/scripts/ensure-indexes.mjs)

A standalone Node.js script to run once against the production database that calls `Model.createIndexes()` for every model.

---

### Phase 2: Optimize Index Order for Key Queries

#### [MODIFY] [Product.js](file:///c:/Users/razak/Main%20Projects/China-Unique-Main-1.0-stable-original/src/models/Product.js#L180-L187)

Add a more optimal slug-first index alongside existing indexes:

```diff
 ProductSchema.index({ isLive: 1, createdAt: -1 });
 ProductSchema.index({ isLive: 1, Category: 1, createdAt: -1 });
-ProductSchema.index({ isLive: 1, slug: 1 });
+ProductSchema.index({ slug: 1, isLive: 1 });  // slug is unique — put it first for O(1) lookup
 ProductSchema.index({ isLive: 1, isDiscounted: 1, createdAt: -1 });
 ProductSchema.index({ isLive: 1, isNewArrival: 1, createdAt: -1 });
 ProductSchema.index({ isLive: 1, isBestSelling: 1, createdAt: -1 });
```

**Why:** `slug` is unique per product, so putting it first in the compound index lets MongoDB find the exact document in one B-tree lookup rather than scanning all `isLive:true` entries.

---

### Phase 3: Add `autoIndex` Safety to Connection Config

#### [MODIFY] [mongooseConnect.js](file:///c:/Users/razak/Main%20Projects/China-Unique-Main-1.0-stable-original/src/lib/mongooseConnect.js#L17-L24)

```diff
 const connectionOptions = {
   bufferCommands: false,
+  autoIndex: true,  // Ensure indexes are created on connection — safe for small collections
   maxPoolSize: 10,
   minPoolSize: 0,
   serverSelectionTimeoutMS: 15000,
   connectTimeoutMS: 15000,
   socketTimeoutMS: 45000,
 };
```

> [!WARNING]
> `autoIndex: true` in production can cause a brief performance hit during deployment when Mongoose checks/creates indexes. For your application size (small e-commerce), this is negligible and ensures indexes are always in sync. For large-scale applications, you would use a migration script instead.

---

### Phase 4: Add `singletonKey` Index to Settings (Defensive)

#### [MODIFY] [Settings.js](file:///c:/Users/razak/Main%20Projects/China-Unique-Main-1.0-stable-original/src/models/Settings.js#L139-L143)

While `unique: true` already creates an index, adding an explicit index call makes the intent clearer:

```diff
+SettingsSchema.index({ singletonKey: 1 });
+
 const cachedSettings = mongoose.models.Settings;
```

Similarly for singleton collections:

#### [MODIFY] [CoverPhoto.js](file:///c:/Users/razak/Main%20Projects/China-Unique-Main-1.0-stable-original/src/models/CoverPhoto.js)
#### [MODIFY] [HomePage.js](file:///c:/Users/razak/Main%20Projects/China-Unique-Main-1.0-stable-original/src/models/HomePage.js)

Add explicit `singletonKey` indexes.

---

## Open Questions

> [!IMPORTANT]
> **Q1: Can you verify what indexes actually exist in your production MongoDB database?**
> 
> Run this in MongoDB Atlas (Database → Browse Collections → your database → any collection → Indexes tab), or via `mongosh`:
> ```js
> db.products.getIndexes()
> db.settings.getIndexes()
> ```
> This will confirm whether the Mongoose schema indexes were ever created. If only `{_id: 1}` exists, that's our smoking gun.

> [!IMPORTANT]  
> **Q2: Are you hosting on MongoDB Atlas Free/Shared Tier?**
> 
> Free/Shared tier clusters can **pause after 60 days of inactivity** and have cold-start delays. They also have limited IOPS. This could compound with missing indexes to cause the extreme delays.

> [!IMPORTANT]
> **Q3: Is the app deployed on Vercel or another serverless platform?**
> 
> Serverless cold starts + MongoDB cold starts can stack, but wouldn't explain 27-39 second query times. That's squarely an indexing issue.

---

## Verification Plan

### Step 1: Check Production Indexes
- Run `db.products.getIndexes()` and `db.settings.getIndexes()` in Atlas/mongosh
- Compare against what the Mongoose schemas define

### Step 2: Create Missing Indexes
- Run the `ensure-indexes.mjs` script against the production database
- OR create indexes manually via Atlas UI

### Step 3: Validate Performance
- After indexes are created, run the same server-side timing instrumentation
- `getProductBySlug` should drop from ~27s to <50ms
- `getStoreSettings` should drop from ~39s to <10ms

### Step 4: Monitor
- Watch for any remaining COLLSCAN entries in Atlas Performance Advisor
- Verify skeleton screen delays are eliminated
