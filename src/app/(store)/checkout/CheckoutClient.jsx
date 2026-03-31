'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { startTransition, useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Clock3,
  Copy,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  Truck,
  Wallet,
} from 'lucide-react';

import { getLastOrderDetailsAction, submitOrderAction } from '@/app/actions';
import AuthModal from '@/components/AuthModal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useCartActions, useCartItems } from '@/context/CartContext';
import { PAKISTAN_CITIES } from '@/lib/cities';
import { trackInitiateCheckoutEvent, trackPurchaseEvent } from '@/lib/clientTracking';
import { getBlurPlaceholderProps } from '@/lib/imagePlaceholder';
import { getPrimaryProductImage } from '@/lib/productImages';
import { cn } from '@/lib/utils';
import styles from './CheckoutClient.module.css';

const formatPrice = (raw) => Number(raw || 0);
const formatPriceLabel = (raw) => `Rs. ${formatPrice(raw).toLocaleString('en-PK')}`;

export default function CheckoutClient({ settings }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { cart } = useCartItems();
  const { clearCart } = useCartActions();
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    landmark: '',
    instructions: '',
  });
  const [cityOpen, setCityOpen] = useState(false);
  const [orderPopupShown, setOrderPopupShown] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [orderState, setOrderState] = useState({ orderId: '', whatsappUrl: '' });
  const [copied, setCopied] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasTrackedCheckoutView, setHasTrackedCheckoutView] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const syncData = async (isInitial = false) => {
      if (status !== 'authenticated' || !session?.user) return;

      try {
        const [settingsRes, lastOrder] = await Promise.all([
          fetch('/api/user/settings').then((res) => (res.ok ? res.json() : null)),
          getLastOrderDetailsAction(),
        ]);

        if (!isMounted) return;

        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || settingsRes?.name || session.user.name || '',
          email: settingsRes?.email || session.user.email || prev.email,
          phone: prev.phone || settingsRes?.phone || lastOrder?.phone || '',
          city: prev.city || settingsRes?.city || lastOrder?.city || '',
          address: prev.address || settingsRes?.address || lastOrder?.address || '',
          landmark: prev.landmark || settingsRes?.landmark || lastOrder?.landmark || '',
        }));

        if (isInitial) setHasAutoFilled(true);
      } catch (error) {
        console.error('Auto-fill sync error:', error);
      }
    };

    if (status === 'authenticated' && !hasAutoFilled) {
      syncData(true);
    }

    function handleFocus() {
      syncData();
    }

    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
    };
  }, [hasAutoFilled, session, status]);

  const subtotal = useMemo(
    () =>
      cart.reduce((total, item) => {
        const itemPrice = item.discountedPrice != null ? item.discountedPrice : formatPrice(item.Price || item.price);
        return total + itemPrice * item.quantity;
      }, 0),
    [cart]
  );

  const isKarachi = formData.city === 'Karachi';
  const shippingBase = isKarachi
    ? Number(settings.karachiDeliveryFee || 0)
    : Number(settings.outsideKarachiDeliveryFee || 0);
  const freeShippingThreshold = Number(settings.freeShippingThreshold || 0);
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const shipping = isFreeShipping ? 0 : shippingBase;
  const total = subtotal + shipping;
  const shippingStatusLabel = isFreeShipping
    ? 'Free delivery unlocked'
    : `Delivery estimate ${formatPriceLabel(shipping)}`;
  const shippingSupportLabel = isFreeShipping
    ? `Orders above ${formatPriceLabel(freeShippingThreshold)} ship free.`
    : isKarachi
      ? 'Karachi delivery keeps the fastest turnaround.'
      : 'Outside Karachi rates are shown before confirmation.';

  useEffect(() => {
    if (hasTrackedCheckoutView || cart.length === 0) return;
    trackInitiateCheckoutEvent({ cart, total });
    setHasTrackedCheckoutView(true);
  }, [cart, hasTrackedCheckoutView, total]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (errors[name]) {
      setErrors((previous) => ({ ...previous, [name]: '' }));
    }
  }

  function validateForm() {
    const nextErrors = {};
    if (!formData.fullName.trim()) nextErrors.fullName = 'Full Name is required.';
    if (!formData.phone.trim()) nextErrors.phone = 'Phone Number is required.';
    if (!formData.city.trim()) nextErrors.city = 'City is required.';
    if (!formData.address.trim()) nextErrors.address = 'Complete Address is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function copyToClipboard() {
    if (orderState.orderId) {
      navigator.clipboard.writeText(orderState.orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleModalClose() {
    if (orderState.orderId) {
      sessionStorage.setItem(`order-popup-shown-${orderState.orderId}`, 'true');
      setOrderPopupShown(true);
    }
    router.push('/');
  }

  function handleViewOrders() {
    if (session) {
      router.push('/orders');
    } else {
      setShowAuthModal(true);
    }
  }

  function handlePlaceOrder(event) {
    event.preventDefault();
    if (!validateForm() || cart.length === 0) return;

    setSubmitting(true);
    startTransition(async () => {
      try {
        const result = await submitOrderAction({
          customerEmail: formData.email,
          customerName: formData.fullName,
          customerPhone: formData.phone,
          customerAddress: formData.address,
          customerCity: formData.city,
          customerAddressOnly: formData.address,
          landmark: formData.landmark,
          notes: formData.instructions,
          updateProfile: true,
          totalAmount: total,
          whatsappNumber: settings.whatsappNumber,
          items: cart.map((item) => ({
            productId: item.id || item._id || item.slug,
            name: item.Name || item.name,
            price: item.discountedPrice != null ? item.discountedPrice : item.Price || item.price,
            quantity: item.quantity,
            image: getPrimaryProductImage(item)?.url || '',
          })),
        });

        trackPurchaseEvent({ orderId: result.orderId, cart, total });
        setOrderState(result);
        clearCart();
      } catch (error) {
        setErrors((previous) => ({
          ...previous,
          submit: error.message || 'Unable to place the order right now.',
        }));
      } finally {
        setSubmitting(false);
      }
    });
  }

  if (cart.length === 0 && !orderState.orderId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <Empty className="surface-card w-full max-w-md rounded-[1.4rem] border border-border/80 py-10 shadow-[0_24px_60px_-42px_color-mix(in_oklab,var(--color-primary)_28%,transparent)]">
          <EmptyHeader>
            <EmptyTitle className="text-2xl font-bold text-foreground [text-wrap:balance]">Your cart is empty</EmptyTitle>
            <EmptyDescription className="[text-wrap:pretty]">
              Add a few products before heading to checkout.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => router.push('/products')} className="min-h-12 rounded-xl px-5 active:scale-[0.96]">
              Continue Shopping
            </Button>
          </EmptyContent>
        </Empty>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-16 pt-8">
      <Dialog open={!!orderState.orderId && !orderPopupShown} onOpenChange={(open) => !open && handleModalClose()}>
        <DialogContent className={cn('p-8 text-center sm:max-w-md', styles.dialogPanel)} hideClose>
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-[1.35rem] bg-success/10 text-success shadow-[0_18px_32px_-26px_color-mix(in_oklab,var(--color-success)_52%,transparent)]">
            <CheckCircle2 className="size-10" />
          </div>

          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground [text-wrap:balance]">Thank You for Your Order!</DialogTitle>
            <DialogDescription className="pt-2 text-base text-muted-foreground [text-wrap:pretty]">
              Your order will be delivered within 2 to 3 working days.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <div className={cn('p-4', styles.orderIdPanel)}>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order ID</span>
              <div className="flex items-center justify-center gap-3">
                <span className={cn('font-mono text-lg font-bold text-foreground', styles.orderIdValue)}>{orderState.orderId}</span>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="icon-sm"
                  className="text-muted-foreground transition-[transform,color,background-color] duration-200 ease-out hover:text-foreground active:scale-[0.96]"
                  title="Copy Order ID"
                >
                  {copied ? <Check className="text-success" /> : <Copy />}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 pt-2">
              <Button size="lg" className={cn('w-full font-semibold active:scale-[0.96]', styles.ctaButton)} onClick={handleViewOrders}>
                View My Orders
              </Button>
              <Button variant="outline" size="lg" className="w-full active:scale-[0.96]" onClick={handleModalClose}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} callbackUrl="/orders" />

      <div className={cn('container mx-auto max-w-6xl px-4', styles.pageShell)}>
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/products">Products</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Checkout</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <section className={cn('mb-8 md:mb-10', styles.intro, styles.enter)} style={{ '--checkout-delay': '40ms' }}>
          <span className={styles.eyebrow}>Final step</span>
          <div className="space-y-3">
            <h1 className={cn('text-3xl font-bold tracking-tight text-foreground sm:text-4xl', styles.title)}>Secure Checkout</h1>
            <p className={styles.lede}>
              Review your delivery details, confirm cash on delivery, and place your order with a clear breakdown before we finalize it.
            </p>
          </div>
          <div className={styles.factGrid}>
            <div className={styles.factCard}>
              <span className={styles.factLabel}>Payment</span>
              <span className={styles.factValue}>Cash on delivery</span>
            </div>
            <div className={styles.factCard}>
              <span className={styles.factLabel}>Delivery</span>
              <span className={styles.factValue}>2 to 3 working days</span>
            </div>
            <div className={styles.factCard}>
              <span className={styles.factLabel}>Support</span>
              <span className={styles.factValue}>Server-side order confirmation</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <Card className={cn(styles.sectionCard, styles.enter)} style={{ '--checkout-delay': '90ms' }}>
              <CardHeader className={styles.sectionHeader}>
                <span className={styles.sectionKicker}>Delivery details</span>
                <CardTitle className={cn('flex items-center gap-2 text-xl', styles.sectionTitle)}>
                  <MapPin className="size-5 text-primary" />
                  Shipping Information
                </CardTitle>
                <CardDescription className={styles.sectionDescription}>
                  Enter your contact details and delivery address for this order.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePlaceOrder} className="space-y-6">
                  <FieldGroup>
                    <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="email" className="flex items-center gap-2">
                          Email Address
                          {session?.user ? <Lock className="size-3 text-muted-foreground/60" title="Locked to your account" /> : null}
                        </FieldLabel>
                        <Input
                          id="email"
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          readOnly={!!session?.user}
                          className={session?.user ? 'cursor-not-allowed bg-muted/30' : ''}
                        />
                      </Field>
                      <Field data-invalid={errors.phone ? 'true' : undefined}>
                        <FieldLabel htmlFor="phone">Phone Number *</FieldLabel>
                        <Input
                          id="phone"
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="e.g. 0300 1234567"
                          aria-invalid={Boolean(errors.phone)}
                        />
                        <FieldError>{errors.phone}</FieldError>
                      </Field>
                    </FieldGroup>

                    <Separator />

                    <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field data-invalid={errors.fullName ? 'true' : undefined}>
                        <FieldLabel htmlFor="fullName">Full Name *</FieldLabel>
                        <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} aria-invalid={Boolean(errors.fullName)} />
                        <FieldError>{errors.fullName}</FieldError>
                      </Field>
                      <Field data-invalid={errors.city ? 'true' : undefined}>
                        <FieldLabel htmlFor="city">City *</FieldLabel>
                        <Popover open={cityOpen} onOpenChange={setCityOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={cityOpen}
                              aria-invalid={Boolean(errors.city)}
                              className={cn(
                                'h-11 w-full justify-between rounded-xl border px-3.5 text-sm font-normal transition-[border-color,background-color,box-shadow,color] duration-200',
                                'border-[color:color-mix(in_oklab,var(--color-border)_82%,white)] bg-[color:color-mix(in_oklab,var(--color-input)_88%,white)] text-foreground',
                                'hover:border-[color:color-mix(in_oklab,var(--color-primary)_16%,var(--color-border))] hover:bg-[color:color-mix(in_oklab,var(--color-input)_94%,white)]',
                                'focus-visible:border-[color:color-mix(in_oklab,var(--color-primary)_34%,var(--color-border))] focus-visible:bg-[color:color-mix(in_oklab,var(--color-input)_96%,white)] focus-visible:ring-4 focus-visible:ring-[color:color-mix(in_oklab,var(--color-primary)_14%,transparent)] focus-visible:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-primary)_18%,transparent),0_10px_24px_-18px_color-mix(in_oklab,var(--color-primary)_45%,transparent)]',
                                !formData.city && 'text-muted-foreground',
                                errors.city && 'border-destructive bg-[color:color-mix(in_oklab,var(--color-destructive)_6%,white)] ring-4 ring-[color:color-mix(in_oklab,var(--color-destructive)_16%,transparent)]'
                              )}
                            >
                              {formData.city || 'Select City'}
                              <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[var(--radix-popover-trigger-width)] rounded-xl border border-[color:color-mix(in_oklab,var(--color-border)_82%,white)] bg-[color:color-mix(in_oklab,var(--color-popover)_96%,white)] p-0"
                            align="start"
                            sideOffset={8}
                          >
                            <Command className="rounded-xl! bg-transparent p-2">
                              <CommandInput placeholder="Search city..." className="text-sm" />
                              <CommandList className="max-h-60 overflow-y-auto pt-2">
                                <CommandEmpty>No city found.</CommandEmpty>
                                <CommandGroup className="flex flex-col gap-1.5 p-1">
                                  {PAKISTAN_CITIES.map((city) => (
                                    <CommandItem
                                      key={city}
                                      value={city}
                                      className="justify-between rounded-lg px-3.5 py-2.5 text-sm font-semibold tracking-[-0.01em] text-foreground transition-[background-color,color] duration-200 data-selected:bg-[color:color-mix(in_oklab,var(--color-muted)_58%,white)]"
                                      onSelect={(currentValue) => {
                                        const exactCity =
                                          PAKISTAN_CITIES.find((candidate) => candidate.toLowerCase() === currentValue.toLowerCase()) || currentValue;
                                        handleChange({ target: { name: 'city', value: exactCity === formData.city ? '' : exactCity } });
                                        setCityOpen(false);
                                      }}
                                    >
                                      <span className="truncate leading-5">{city}</span>
                                      <span
                                        className={cn(
                                          'inline-flex size-5 items-center justify-center rounded-full border transition-[opacity,transform,background-color,border-color,color] duration-200',
                                          formData.city === city
                                            ? 'scale-100 border-[color:color-mix(in_oklab,var(--color-primary)_20%,white)] bg-primary/10 text-primary opacity-100'
                                            : 'scale-75 border-transparent bg-transparent text-transparent opacity-0'
                                        )}
                                      >
                                        <Check className="size-3.5" />
                                      </span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FieldError>{errors.city}</FieldError>
                      </Field>
                    </FieldGroup>

                    <FieldGroup>
                      <Field data-invalid={errors.address ? 'true' : undefined}>
                        <FieldLabel htmlFor="address">Complete Address (Street/Area) *</FieldLabel>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="House, Street, Sector/Area"
                          aria-invalid={Boolean(errors.address)}
                        />
                        <FieldError>{errors.address}</FieldError>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="landmark">Nearest Landmark</FieldLabel>
                        <Input id="landmark" name="landmark" value={formData.landmark} onChange={handleChange} placeholder="e.g. Near ABC School" />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="instructions">Special Notes</FieldLabel>
                        <FieldContent>
                          <Textarea id="instructions" name="instructions" value={formData.instructions} onChange={handleChange} rows={3} />
                          <FieldDescription>Optional delivery notes, landmarks, or timing preferences.</FieldDescription>
                        </FieldContent>
                      </Field>
                    </FieldGroup>
                  </FieldGroup>

                  {errors.submit ? (
                    <Alert variant="destructive">
                      <AlertTitle>Unable to place order</AlertTitle>
                      <AlertDescription>{errors.submit}</AlertDescription>
                    </Alert>
                  ) : null}

                  <button type="submit" id="checkout-submit" className="hidden" />
                </form>
              </CardContent>
            </Card>

            <Card className={cn(styles.sectionCard, styles.enter)} style={{ '--checkout-delay': '150ms' }}>
              <CardHeader className={styles.sectionHeader}>
                <span className={styles.sectionKicker}>Payment</span>
                <CardTitle className={cn('flex items-center gap-2 text-xl', styles.sectionTitle)}>
                  <Wallet className="size-5 text-primary" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="rounded-[1.15rem] border-border/70 bg-[color:color-mix(in_oklab,var(--color-card)_92%,white)] shadow-[0_18px_28px_-30px_color-mix(in_oklab,var(--color-primary)_28%,transparent)]">
                  <Wallet className="text-primary" />
                  <AlertTitle>Cash on Delivery</AlertTitle>
                  <AlertDescription className="[text-wrap:pretty]">
                    Pay with cash when your order reaches you. We confirm everything server-side before it is locked in.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card className={cn('surface-panel sticky top-24', styles.sectionCard, styles.summaryCard, styles.enter)} style={{ '--checkout-delay': '120ms' }}>
              <CardHeader className={cn('mb-2', styles.summaryHeader)}>
                <div className={styles.summaryMeta}>
                  <div>
                    <p className={styles.sectionKicker}>Order summary</p>
                    <CardTitle className={cn('mt-2 text-xl', styles.sectionTitle)}>Everything in your cart</CardTitle>
                  </div>
                  <span className={styles.summaryPill}>
                    <strong>{cart.length}</strong>
                    {cart.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <CardDescription className={styles.sectionDescription}>
                  <span className={cn(isFreeShipping ? styles.shippingFree : styles.shippingTone)}>{shippingStatusLabel}</span>{' '}
                  {shippingSupportLabel}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className={cn('mb-6 max-h-[320px] overflow-y-auto pr-1', styles.summaryItems)}>
                  {cart.map((item, index) => {
                    const itemPrice = item.discountedPrice != null ? item.discountedPrice : item.Price || item.price;
                    const lineTotal = formatPrice(itemPrice) * item.quantity;

                    return (
                      <div key={`${item.id}-${index}`} className={styles.summaryItem}>
                        <div className={styles.summaryImage}>
                          {getPrimaryProductImage(item)?.url ? (
                            <Image
                              src={getPrimaryProductImage(item).url}
                              alt={item.Name || item.name}
                              fill
                              className="object-cover"
                              {...getBlurPlaceholderProps(getPrimaryProductImage(item).blurDataURL)}
                            />
                          ) : null}
                        </div>
                        <div className={styles.summaryText}>
                          <h4 className={cn('line-clamp-2 text-sm font-semibold text-foreground', styles.summaryName)}>{item.Name || item.name}</h4>
                          <div className={styles.summaryBottom}>
                            <span className={styles.qtyBadge}>Qty {item.quantity}</span>
                            <div className={styles.priceStack}>
                              <div className={styles.unitPrice}>{formatPriceLabel(itemPrice)} each</div>
                              <div className={styles.linePrice}>{formatPriceLabel(lineTotal)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator className="mb-4" />

                <div className={cn('mb-6 space-y-3', styles.totalsPanel)}>
                  <div className={cn('flex justify-between text-sm text-muted-foreground', styles.totalRow)}>
                    <span>Subtotal</span>
                    <span className="font-semibold text-foreground">Rs. {subtotal.toLocaleString('en-PK')}</span>
                  </div>
                  <div className={cn('flex justify-between text-sm text-muted-foreground', styles.totalRow)}>
                    <span>Shipping Estimate</span>
                    <span className="font-semibold text-foreground">{isFreeShipping ? 'FREE' : `Rs. ${shipping.toLocaleString('en-PK')}`}</span>
                  </div>
                </div>

                <Separator className="mb-4" />

                <div className={cn('mb-8 flex items-center justify-between text-xl font-bold text-foreground', styles.totalRow)}>
                  <span>Total</span>
                  <span>Rs. {total.toLocaleString('en-PK')}</span>
                </div>

                <Button className={cn('w-full', styles.ctaButton)} size="lg" onClick={() => document.getElementById('checkout-submit')?.click()} disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
                  {submitting ? 'Placing Order...' : 'Complete Order'}
                </Button>

                <div className="mt-4 grid gap-2 text-xs font-medium text-muted-foreground">
                  <p className={cn('flex items-center justify-center gap-1.5 text-center', styles.trustNote)}>
                    <ShieldCheck className="size-3.5 text-primary" />
                    Securing your order with server-side confirmation
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex items-center justify-center gap-1.5 rounded-full bg-background/70 px-3 py-2">
                      <Truck className="size-3.5 text-primary" />
                      Nationwide delivery
                    </div>
                    <div className="flex items-center justify-center gap-1.5 rounded-full bg-background/70 px-3 py-2">
                      <Clock3 className="size-3.5 text-primary" />
                      2 to 3 working days
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
