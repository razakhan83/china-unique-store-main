'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, ShieldCheck, Truck, BadgeCheck } from 'lucide-react';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';

import { useCartActions, useCartItems } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { CLOUDINARY_IMAGE_PRESETS, optimizeCloudinaryUrl } from '@/lib/cloudinaryImage';
import { getPrimaryProductImage } from '@/lib/productImages';
import { getBlurPlaceholderProps } from '@/lib/imagePlaceholder';
import { buildCartWhatsAppMessage, createWhatsAppUrl } from '@/lib/whatsapp';
import { formatPrice, getSellingPrice } from '@/lib/pricing';

export default function CartPageClient({ whatsappNumber = '', storeName = 'China Unique Store' }) {
  const router = useRouter();
  const { cart = [] } = useCartItems() || {};
  const { updateQuantity, removeFromCart, clearCart } = useCartActions() || {};
  const [isClearingAll, setIsClearingAll] = useState(false);

  const subtotal = cart.reduce((total, item) => {
    return total + getSellingPrice(item) * item.quantity;
  }, 0);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  function handleClearCart() {
    if (!cart.length || isClearingAll) return;
    setIsClearingAll(true);
    clearCart();
    setIsClearingAll(false);
  }

  function handleWhatsAppCheckout() {
    if (!cart.length) return;
    const message = buildCartWhatsAppMessage({ items: cart, subtotal, storeName });
    const whatsappUrl = createWhatsAppUrl(whatsappNumber, message);
    if (!whatsappUrl) return;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  if (!cart.length) {
    return (
      <Empty className="surface-card mx-auto max-w-2xl rounded-2xl border border-dashed border-border py-16 px-4 text-center">
        <EmptyHeader>
          <div className="mx-auto mb-4 flex items-center justify-center">
            <Image
              src="/undraw_empty-cart_574u.svg"
              alt="Empty cart illustration"
              width={160}
              height={160}
              className="h-auto w-[140px] sm:w-[160px] select-none object-contain"
              priority
            />
          </div>
          <EmptyTitle className="text-xl sm:text-2xl font-bold text-foreground">Your cart is empty</EmptyTitle>
          <EmptyDescription className="max-w-md mx-auto text-sm text-muted-foreground mt-2">
            You haven't added any products to your cart yet. Explore our curated catalog of unique kitchenware and home finds.
          </EmptyDescription>
        </EmptyHeader>
        <div className="mt-6 flex justify-center">
          <Button
            render={<Link href="/products" />}
            nativeButton={false}
            className="rounded-xl px-8 h-12 text-sm font-semibold"
          >
            Start Shopping
          </Button>
        </div>
      </Empty>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Shopping Cart
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClearCart}
          disabled={isClearingAll}
          className="self-start sm:self-auto rounded-xl text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border"
        >
          <Trash2 className="size-3.5 mr-1.5" />
          {isClearingAll ? 'Clearing...' : 'Clear Cart'}
        </Button>
      </div>

      {/* Main Cart Grid: Items (8 cols) + Summary (4 cols) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Cart Items List */}
        <div className="space-y-4 lg:col-span-8">
          {cart.map((item, index) => {
            const primaryImage = getPrimaryProductImage(item);
            const primaryImageSrc = primaryImage?.url
              ? optimizeCloudinaryUrl(primaryImage.url, CLOUDINARY_IMAGE_PRESETS.cartItem)
              : '';
            const itemPrice = getSellingPrice(item);
            const itemTotal = itemPrice * item.quantity;
            const productHref = `/products/${item.slug || item.id || item._id}`;

            return (
              <Card
                key={item.id || item.slug || item._id || index}
                className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-all hover:border-border"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-4 sm:gap-5">
                    {/* Thumbnail */}
                    <Link
                      href={productHref}
                      className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-xl bg-muted outline outline-1 outline-black/5 hover:opacity-90 transition-opacity flex items-center justify-center"
                    >
                      {primaryImageSrc ? (
                        <Image
                          src={primaryImageSrc}
                          alt={item.Name || item.name || 'product'}
                          fill
                          sizes="96px"
                          className="object-cover"
                          {...getBlurPlaceholderProps(primaryImage?.blurDataURL)}
                        />
                      ) : (
                        <ShoppingBag className="size-6 text-muted-foreground/40" />
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 self-stretch">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={productHref}
                            className="font-semibold text-foreground text-sm sm:text-base hover:text-primary transition-colors line-clamp-2"
                          >
                            {item.Name || item.name}
                          </Link>
                          {item.packLabel && (
                            <span className="mt-0.5 inline-block text-xs text-muted-foreground">
                              Option: {item.packLabel}
                            </span>
                          )}
                          <p className="mt-1 text-sm font-bold text-primary tabular-nums">
                            {formatPrice(itemPrice)}
                          </p>
                        </div>

                        {/* Remove button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeFromCart(item)}
                          className="size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label={`Remove ${item.Name || item.name} from cart`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      {/* Quantity & Row Total */}
                      <div className="flex items-center justify-between border-t border-border/50 pt-2.5">
                        <div className="inline-flex h-9 items-center rounded-lg border border-border bg-background">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item, item.quantity - 1)}
                            className="inline-flex size-8 items-center justify-center rounded-l-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="inline-flex min-w-8 items-center justify-center text-xs sm:text-sm font-semibold tabular-nums text-foreground px-1">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item, item.quantity + 1)}
                            className="inline-flex size-8 items-center justify-center rounded-r-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-muted-foreground mr-1.5 hidden sm:inline">Item Total:</span>
                          <span className="text-sm sm:text-base font-extrabold text-foreground tabular-nums">
                            {formatPrice(itemTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Right Column: Order Summary (Sticky) */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-4">
            <Card className="rounded-2xl border border-border/80 bg-card shadow-sm">
              <CardHeader className="border-b border-border/60 pb-4 pt-5 px-5">
                <CardTitle className="text-lg font-bold text-foreground">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                {/* Cost Breakdown */}
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
                    <span className="font-semibold text-foreground tabular-nums">{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex items-start justify-between text-muted-foreground">
                    <div>
                      <span>Delivery</span>
                      <p className="text-[11px] text-muted-foreground/80">Calculated by city</p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Karachi Rs 200 / Nationwide Rs 300
                    </span>
                  </div>
                </div>

                <div className="border-t border-border pt-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-foreground">Estimated Total</span>
                    <span className="text-xl font-extrabold text-foreground tabular-nums">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Standard shipping added upon city selection at checkout.
                  </p>
                </div>

                {/* Action CTAs */}
                <div className="space-y-2.5 pt-2">
                  <Button
                    render={<Link href="/checkout" />}
                    nativeButton={false}
                    className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold shadow-sm transition-all"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="ml-2 size-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleWhatsAppCheckout}
                    className="h-12 w-full rounded-xl border border-border bg-card hover:bg-muted/60 text-foreground text-sm font-bold shadow-none transition-all cursor-pointer"
                  >
                    <WhatsAppIcon className="size-4.5 mr-2 text-[#25D366]" />
                    <span>Order via WhatsApp</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Trust Assurance Card */}
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2.5 text-xs">
                <Truck className="size-4 text-primary shrink-0" />
                <span className="text-foreground font-medium">Fast 2–4 days express delivery across Pakistan</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <BadgeCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-foreground font-medium">Cash on Delivery available nationwide</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <ShieldCheck className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-foreground font-medium">7-day replacement guarantee • Inspect before paying</span>
              </div>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/products"
                className="text-xs font-semibold text-primary hover:underline"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
