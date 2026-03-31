'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';

import { useCartActions, useCartItems, useCartUi } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CLOUDINARY_IMAGE_PRESETS, optimizeCloudinaryUrl } from '@/lib/cloudinaryImage';
import { getPrimaryProductImage } from '@/lib/productImages';
import { getBlurPlaceholderProps } from '@/lib/imagePlaceholder';
import { buildCartWhatsAppMessage, createWhatsAppUrl } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';

const formatPrice = (raw) => {
  const clean = String(raw).replace(/[^\d.]/g, '');
  return clean ? Number(clean) : 0;
};

const formatPriceLabel = (raw) => `Rs. ${formatPrice(raw).toLocaleString('en-PK')}`;
const EXIT_ANIMATION_MS = 180;

export default function CartDrawer({ whatsappNumber = '', storeName = 'China Unique Store' }) {
  const { cart } = useCartItems();
  const { isCartOpen } = useCartUi();
  const { updateQuantity, removeFromCart, clearCart, setIsCartOpen } = useCartActions();
  const [exitingItems, setExitingItems] = useState({});
  const [isClearingAll, setIsClearingAll] = useState(false);
  const removeTimersRef = useRef({});
  const clearTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      Object.values(removeTimersRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  const subtotal = cart.reduce((total, item) => {
    const itemPrice = item.discountedPrice != null ? item.discountedPrice : formatPrice(item.Price || item.price);
    return total + itemPrice * item.quantity;
  }, 0);

  function continueShopping() {
    setIsCartOpen(false);
  }

  function scheduleRemove(item) {
    const itemId = item.id;
    if (!itemId || exitingItems[itemId] || isClearingAll) return;

    setExitingItems((current) => ({ ...current, [itemId]: true }));
    removeTimersRef.current[itemId] = setTimeout(() => {
      removeFromCart(item);
      setExitingItems((current) => {
        const next = { ...current };
        delete next[itemId];
        return next;
      });
      delete removeTimersRef.current[itemId];
    }, EXIT_ANIMATION_MS);
  }

  function handleClearCart() {
    Object.values(removeTimersRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
    removeTimersRef.current = {};
    if (!cart.length || isClearingAll) return;

    setIsClearingAll(true);
    clearCart();
    setExitingItems({});
    setIsClearingAll(false);
    clearTimerRef.current = null;
  }

  function handleWhatsAppDirectCheckout() {
    if (!cart.length) return;
    const message = buildCartWhatsAppMessage({ items: cart, subtotal, storeName });
    const whatsappUrl = createWhatsAppUrl(whatsappNumber, message);
    if (!whatsappUrl) return;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent side="right" className="w-screen min-w-0 max-w-none gap-0 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_97%,white),color-mix(in_oklab,var(--color-muted)_38%,white))] p-0 sm:max-w-none md:w-[min(70vw,28rem)] md:min-w-[18rem] md:max-w-[28rem]">
        <SheetHeader className="border-b border-border/70 px-5 pb-3 pt-5">
          <SheetTitle className="[text-wrap:balance]">Your Cart</SheetTitle>
          <SheetDescription className="[text-wrap:pretty]">
            {cart.length ? `${cart.length} item${cart.length > 1 ? 's' : ''} ready for checkout.` : 'Add products to start your order.'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-4 py-3 md:px-5 md:py-4">
          <div className="flex flex-col gap-1.5">
            {cart.length ? (
              <>
                <div className="flex items-center justify-between gap-3 px-1 py-0.5">
                  <p className="text-sm font-semibold text-foreground">Cart items</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-md px-2 text-xs font-medium text-muted-foreground transition-[transform,color,background-color] duration-150 hover:bg-muted hover:text-destructive active:scale-[0.96]"
                    onClick={handleClearCart}
                    disabled={isClearingAll}
                  >
                    {isClearingAll ? 'Clearing...' : 'Clear All'}
                  </Button>
                </div>
                {cart.map((item, index) => {
                  const primaryImage = getPrimaryProductImage(item);
                  const primaryImageSrc = primaryImage?.url
                    ? optimizeCloudinaryUrl(primaryImage.url, CLOUDINARY_IMAGE_PRESETS.cartItem)
                    : '';
                  const isExiting = Boolean(exitingItems[item.id]);

                  return (
                    <div
                      key={item.id || item.slug || item._id || item.Name || item.name || index}
                      className={cn(
                        'grid overflow-hidden transition-[grid-template-rows,opacity,margin] ease-[cubic-bezier(0.2,0,0,1)]',
                        isExiting
                          ? 'pointer-events-none opacity-0 [grid-template-rows:0fr] duration-200'
                          : 'opacity-100 [grid-template-rows:1fr] duration-200'
                      )}
                    >
                      <div className="min-h-0">
                        <Card
                          className={cn(
                            'gap-0 py-0 border-[color:color-mix(in_oklab,var(--color-border)_82%,white)] bg-[color:color-mix(in_oklab,var(--color-card)_94%,white)] shadow-[0_1px_0_color-mix(in_oklab,white_72%,transparent),0_14px_24px_-34px_color-mix(in_oklab,black_18%,transparent)] transition-[transform,opacity,filter,background-color,border-color,box-shadow] duration-180 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-[color:color-mix(in_oklab,var(--color-card)_98%,white)]',
                            isCartOpen && !isExiting && 'animate-fadeInUp',
                            isExiting ? 'translate-x-6 opacity-0' : 'translate-x-0 opacity-100'
                          )}
                          style={isCartOpen && !isExiting ? { animationDelay: `${Math.min(index * 70, 210)}ms` } : undefined}
                        >
                          <CardContent className="px-2.5 py-2">
                          <div className="flex items-stretch gap-2.5">
                            <div className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-muted outline outline-1 outline-black/5 md:size-[4.75rem]">
                              {primaryImageSrc ? (
                                <Image
                                  src={primaryImageSrc}
                                  alt={item.Name || item.name || 'product'}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                  {...getBlurPlaceholderProps(primaryImage?.blurDataURL)}
                                />
                              ) : null}
                            </div>
                            <div className="flex min-w-0 flex-1 items-stretch justify-between gap-2">
                              <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                                <div className="min-w-0">
                                  <p className="line-clamp-2 text-[0.85rem] font-semibold leading-[1.05rem] text-foreground [text-wrap:pretty]">{item.Name || item.name}</p>
                                  <p className="mt-0.5 text-[0.88rem] font-medium leading-none text-primary tabular-nums">{formatPriceLabel(item.discountedPrice != null ? item.discountedPrice : item.Price || item.price)}</p>
                                </div>
                                <div className="inline-flex h-7 items-stretch gap-0.5 self-start">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => {
                                      updateQuantity(item, item.quantity - 1);
                                    }}
                                    className="h-full min-h-0 w-7 rounded-[var(--radius-md)] bg-muted/70 px-0 text-muted-foreground transition-[transform,color,background-color] duration-150 hover:bg-muted hover:text-foreground active:scale-[0.96]"
                                    disabled={isExiting}
                                  >
                                    <Minus />
                                  </Button>
                                  <span className="inline-flex h-full w-7 items-center justify-center px-0 text-[0.84rem] font-semibold leading-none tabular-nums">{item.quantity}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => updateQuantity(item, item.quantity + 1)}
                                    className="h-full min-h-0 w-7 rounded-[var(--radius-md)] bg-muted/70 px-0 text-muted-foreground transition-[transform,color,background-color] duration-150 hover:bg-muted hover:text-foreground active:scale-[0.96]"
                                    disabled={isExiting}
                                  >
                                    <Plus />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex min-h-full flex-col items-end justify-between py-0.5 text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => scheduleRemove(item)}
                                  className="size-7 rounded-[var(--radius-lg)] text-muted-foreground transition-[transform,color] duration-150 hover:text-destructive active:scale-[0.96] [&_svg]:size-3.5"
                                  aria-label="Remove item"
                                  disabled={isExiting}
                                >
                                  <Trash2 />
                                </Button>
                                <div className="flex flex-col items-end gap-1">
                                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground/90">
                                    Total
                                  </p>
                                  <p className="text-[0.92rem] font-semibold leading-none text-foreground tabular-nums">
                                    Rs. {(formatPrice(item.discountedPrice != null ? item.discountedPrice : item.Price || item.price) * item.quantity).toLocaleString('en-PK')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <Empty className="surface-card min-h-[16rem] rounded-[1.35rem] px-6 py-12 shadow-[0_24px_44px_-38px_color-mix(in_oklab,var(--color-primary)_26%,transparent)]">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="size-16 rounded-[1.1rem] bg-primary/10 text-primary shadow-[0_16px_28px_-24px_color-mix(in_oklab,var(--color-primary)_42%,transparent)]">
                    <ShoppingBag className="size-7" />
                  </EmptyMedia>
                  <EmptyTitle className="text-lg font-semibold text-foreground [text-wrap:balance]">Your cart is empty</EmptyTitle>
                  <EmptyDescription className="max-w-xs [text-wrap:pretty]">
                    Start adding premium kitchenware and decor to build your order.
                  </EmptyDescription>
                </EmptyHeader>
                <div className="mt-6 flex justify-center">
                  <Link href="/products" onClick={continueShopping}>
                    <Button className="min-h-11 rounded-xl px-5 active:scale-[0.96]">Continue Shopping</Button>
                  </Link>
                </div>
              </Empty>
            )}
          </div>
        </ScrollArea>

        {cart.length ? (
          <SheetFooter className="gap-3 border-t border-border/70 bg-card/95 px-5 pb-5 pt-4">
            <div className="flex items-center justify-between rounded-[1.1rem] border border-border/70 bg-muted/30 px-4 py-3 shadow-[inset_0_1px_0_color-mix(in_oklab,white_72%,transparent)]">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Subtotal</p>
                <p className="mt-1 text-sm text-muted-foreground [text-wrap:pretty]">Final charges appear at checkout.</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-foreground tabular-nums">
                  Rs. {subtotal.toLocaleString('en-PK')}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="h-11 w-full rounded-xl border-[color:color-mix(in_oklab,var(--color-primary)_16%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-input)_92%,white)] text-foreground shadow-[0_1px_0_color-mix(in_oklab,var(--color-background)_65%,white)] transition-[transform,border-color,background-color,box-shadow,color] duration-200 hover:bg-[color:color-mix(in_oklab,var(--color-muted)_74%,white)] hover:text-foreground active:scale-[0.96]"
              onClick={handleWhatsAppDirectCheckout}
            >
              <WhatsAppIcon className="size-5" />
              Order on WhatsApp
            </Button>
            <Link href="/checkout" onClick={() => setIsCartOpen(false)} className="w-full">
              <Button className="h-11 w-full rounded-xl active:scale-[0.96]">
                Checkout
                <ArrowRight data-icon="inline-end" />
              </Button>
            </Link>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
