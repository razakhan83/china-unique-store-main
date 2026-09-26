# Limited-time offers and dual discount

## Goal

An admin can mark a product discount as either a normal sale with no end date, or a flash sale that ends at an exact date and time. The store shows a live countdown on cards and on the product page. When the timer hits zero, the sale price disappears and the base price is what the customer pays.

Separately, Marketing has a Limited Time Offers list of 8 to 10 products. Home Page Builder can place that list on the homepage.

Existing fields stay: `discountPercentage`, `isDiscounted`, `discountedPrice`, and the Special Offers collection. They are not replaced.

## Rules

A discount is active only when all of these are true:

- `discountPercentage` is greater than 0
- `discountType` is `no-time`, or `discountType` is `time-based` and `discountEndsAt` is still in the future

`discountType: 'none'` means no sale, even if an old percentage is stored.

When a flash sale expires:

- The badge, sale price, and timer unmount
- The price shown is `Price`
- Checkout, cart, and order creation use `Price`, calculated on the server at submit time
- The client timer is only for display. It must not be the source of the charged price

Old products with `isDiscounted: true` and no `discountType` are treated as `no-time` so current sales do not turn off.

## 1. Database

File: `src/models/Product.js`

Add next to the current discount fields:

- `discountType`: String, enum `['none', 'no-time', 'time-based']`, default `'none'`
- `discountEndsAt`: Date, default `null`

Index: `{ showOnStore: 1, discountType: 1, discountEndsAt: 1 }`

Saving a product keeps today’s behavior for the percentage:

- Percentage above 0 and type `no-time` or `time-based` sets `isDiscounted: true` and stores `discountedPrice`
- Type `none`, or percentage 0, sets `isDiscounted: false`, `discountedPrice: null`, `discountEndsAt: null`
- Type `time-based` requires `discountEndsAt`
- Type `no-time` always stores `discountEndsAt: null`

One shared helper, `src/lib/discount.js`:

- `isDiscountActive(product, now)`
- `getActiveSellingPrice(product, now)`

Use it in `src/lib/data.js` (cards, catalog, special offers, product page, feed), `src/lib/orderFulfillment.js`, and the product API save path. Do not copy the date check into each screen.

Special Offers (`isDiscounted: true`) must exclude expired flash sales at read time, not only in the database flag. A product can stay `isDiscounted: true` in Mongo until the next save; the helper decides what the shopper sees.

## 2. Admin product form

Files: `src/app/admin/products/add/AddProductClient.jsx`, `src/app/admin/products/edit/[id]/EditProductClient.jsx`, and the product create/update API.

Wrap the new UI in:

```js
/* --- [DISCOUNT_CONFIG] START --- */
/* --- [DISCOUNT_CONFIG] END --- */
```

Keep the percentage input. Under it, two choices:

1. Standard Discount. Sends `discountType: 'no-time'` and `discountEndsAt: null`.
2. Flash Sale / Limited Time. Sends `discountType: 'time-based'` and `discountEndsAt` as an ISO date from a date-and-time picker.

If the percentage is empty or 0, the choice is hidden and the save sends `discountType: 'none'`.

Flash Sale cannot be saved without a future deadline. Show the resulting sale price next to the choice so the admin sees the number before saving.

Same block on create and edit. Edit loads `discountType` and `discountEndsAt` from the product.

## 3. Marketing: Limited Time Offers

New admin page: `src/app/admin/marketing/limited-offers`

Add it to `marketingNavItems` in `src/app/admin/AdminLayoutShell.jsx`, next to Featured and Special Offers.

The page works like Featured Products:

- Search live products
- Add or remove them from a curated list
- Reorder the list
- Hard cap of 10 products
- Empty state when none are selected

Store the ordered product ids on the existing settings document, for example `limitedOfferProductIds`, max length 10. Do not invent a second product flag for “show in this row” unless the list needs a priority field. Order is the array order.

Only products with an active time-based discount can be added. If a selected product expires or its discount is removed, it drops out of the storefront list and the admin row shows it as expired.

API: admin-only route to read and save the id list. Call `revalidateTag('home-page')` and `revalidateTag('products')` after save.

## 4. Home Page Builder

Files: `src/lib/homePageSections.js`, `src/app/admin/home-page/HomePageBuilderClient.jsx`, `src/components/home/HomeSectionRenderer.jsx`, `src/lib/data.js` (`getStorefrontHomePage` / home section products).

Add a section type the builder can drop on the homepage:

- Type: `LimitedTimeOffers`
- Builder label: Limited Time Offers
- Fields the admin can edit: title, short description, enabled, order
- Products are not picked again in the builder. The section reads the Marketing list.

`getStorefrontHomePage` loads those ids in order, keeps only active flash-sale products, and passes each card `discountEndsAt`, base price, and sale price.

Renderer shows 8 to 10 cards in the existing product carousel. If the list is empty, the section does not render.

Special Offers in the builder stays as it is. It is every active discount. Limited Time Offers is only the curated flash-sale list.

## 5. Countdown

New client component: `src/components/FlashSaleTimer.jsx`

```jsx
<FlashSaleTimer targetDate={product.discountEndsAt} variant="compact" | "full" />
```

Behavior:

- Renders nothing when `targetDate` is missing or already past
- Ticks every second with `tabular-nums`
- Shows days only when days are greater than 0, then hours, minutes, and seconds
- `compact`: one pill, used on `ProductCard` above the price
- `full`: four boxes, Days, Hrs, Min, Sec, used on the product page directly under the price
- At 00:00:00 the timer unmounts. No error, no jump. A reserved min-height on the slot is only used while the timer is visible; after expiry the slot is gone and the price row is the base price
- `prefers-reduced-motion` still shows the numbers, without a pulsing animation

Price on the card and product page:

- Pass both prices into the client price row when `discountType === 'time-based'`
- While the deadline is in the future, show the sale price and the percent badge
- When the local timer hits zero, show `Price` and hide the badge
- Server render uses `getActiveSellingPrice` so the first HTML is already correct

Checkout and `orderFulfillment.js` call the same helper with the server clock. An expired flash sale cannot be purchased at the sale price.

## 6. What not to change

- Coupon codes stay separate
- Compare-at price behavior stays
- Email templates stay
- Do not public-cache a shopper’s cart or order around this
- Product pages can stay on the long cache. The client timer corrects an expired price without waiting for a rebuild. The next product save or limited-offer save still revalidates `products` and `home-page`

## Build order

1. Schema, `src/lib/discount.js`, and product API save rules
2. Create and edit forms, inside the `DISCOUNT_CONFIG` markers
3. Storefront price helper on cards, product page, catalog, and checkout
4. `FlashSaleTimer` compact, then full
5. Marketing page, nav item, and settings list
6. Home section type, builder template, and homepage render

Each step should be its own change so one part can be reverted without undoing the rest.
