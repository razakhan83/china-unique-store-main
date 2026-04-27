'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Check,
  Clock3,
  Copy,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Truck,
  Wallet,
} from 'lucide-react';

import { getLastOrderDetailsAction, submitOrderAction } from '@/app/actions';
import AuthModal from '@/components/AuthModal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from '@/components/ui/combobox';
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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useCartActions, useCartItems } from '@/context/CartContext';
import { PAKISTAN_CITIES } from '@/lib/cities';
import { trackInitiateCheckoutEvent, trackPurchaseEvent } from '@/lib/clientTracking';
import { getBlurPlaceholderProps } from '@/lib/imagePlaceholder';
import { getPrimaryProductImage } from '@/lib/productImages';
import { cn } from '@/lib/utils';
import { calculateCheckoutPricing } from '@/lib/checkoutPricing';
import styles from './CheckoutClient.module.css';

const formatPrice = (raw) => Number(raw || 0);
const formatPriceLabel = (raw) => `Rs. ${formatPrice(raw).toLocaleString('en-PK')}`;
const PRIORITY_CITY_KEYS = ['karachi', 'lahore', 'islamabad', 'hyderabad'];
const INITIAL_CITY_COUNT = PRIORITY_CITY_KEYS.length;
const SEARCH_RESULTS_LIMIT = 24;
const CHECKOUT_PROFILE_STORAGE_KEY = 'kifayatly_checkout_profile_v1';
const CHECKOUT_SUCCESS_STORAGE_KEY = 'kifayatly_checkout_success_v1';

function normalizeCitySearchValue(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function formatCityLabel(city) {
  return city
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (!word) return word;
      if (word.startsWith('(') || word.includes('.')) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

const CITY_OPTIONS = Array.from(new Map(PAKISTAN_CITIES.map((city) => [city.toLowerCase(), city])).values())
  .map((city) => ({
    value: formatCityLabel(city),
    label: formatCityLabel(city),
    sortKey: normalizeCitySearchValue(city),
  }))
  .sort((left, right) => {
    const leftPriority = PRIORITY_CITY_KEYS.indexOf(left.sortKey);
    const rightPriority = PRIORITY_CITY_KEYS.indexOf(right.sortKey);
    const normalizedLeftPriority = leftPriority === -1 ? Number.MAX_SAFE_INTEGER : leftPriority;
    const normalizedRightPriority = rightPriority === -1 ? Number.MAX_SAFE_INTEGER : rightPriority;

    if (normalizedLeftPriority !== normalizedRightPriority) {
      return normalizedLeftPriority - normalizedRightPriority;
    }

    return left.label.localeCompare(right.label, 'en-PK');
  });

function readCachedCheckoutProfile() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(CHECKOUT_PROFILE_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    console.error('Failed to read cached checkout profile', error);
    return null;
  }
}

function mergeCheckoutProfile(previous, nextProfile = {}, options = {}) {
  const { overwriteEmail = false } = options;

  return {
    ...previous,
    fullName: previous.fullName || nextProfile.name || nextProfile.fullName || '',
    phone: previous.phone || nextProfile.phone || '',
    email: overwriteEmail
      ? nextProfile.email || previous.email || ''
      : previous.email || nextProfile.email || '',
    city: previous.city || nextProfile.city || '',
    address: previous.address || nextProfile.address || nextProfile.addressOnly || '',
    landmark: previous.landmark || nextProfile.landmark || '',
  };
}

function readStoredSuccessfulOrder() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_SUCCESS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.orderId) return null;

    return {
      orderId: String(parsed.orderId),
      whatsappUrl: String(parsed.whatsappUrl || ''),
    };
  } catch (error) {
    console.error('Failed to restore checkout success state', error);
    return null;
  }
}

function persistSuccessfulOrder(order) {
  if (typeof window === 'undefined' || !order?.orderId) return;

  try {
    window.sessionStorage.setItem(
      CHECKOUT_SUCCESS_STORAGE_KEY,
      JSON.stringify({
        orderId: order.orderId,
        whatsappUrl: order.whatsappUrl || '',
      }),
    );
  } catch (error) {
    console.error('Failed to persist checkout success state', error);
  }
}

function clearStoredSuccessfulOrder() {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(CHECKOUT_SUCCESS_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear checkout success state', error);
  }
}

export default function CheckoutClient({ settings }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { cart, isInitialized } = useCartItems();
  const { clearCart, replaceCart } = useCartActions();
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const [hasHydratedCachedProfile, setHasHydratedCachedProfile] = useState(false);
  const [isHydratingProfile, setIsHydratingProfile] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    landmark: '',
    instructions: '',
  });
  const [orderPopupShown, setOrderPopupShown] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [orderState, setOrderState] = useState({ orderId: '', whatsappUrl: '' });
  const [copied, setCopied] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasTrackedCheckoutView, setHasTrackedCheckoutView] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  useEffect(() => {
    const storedOrder = readStoredSuccessfulOrder();
    if (storedOrder) {
      setOrderState(storedOrder);
    }
  }, []);

  useEffect(() => {
    if (hasHydratedCachedProfile) return;

    const cachedProfile = readCachedCheckoutProfile();
    if (cachedProfile) {
      setFormData((prev) => mergeCheckoutProfile(prev, cachedProfile));
    }

    setHasHydratedCachedProfile(true);
  }, [hasHydratedCachedProfile]);

  useEffect(() => {
    let isMounted = true;

    const syncData = async () => {
      if (status !== 'authenticated' || !session?.user) return;

      setIsHydratingProfile(true);

      const profileRequest = fetch('/api/user/settings', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((settingsRes) => {
          if (!isMounted || !settingsRes) return;

          setFormData((prev) =>
            mergeCheckoutProfile(
              {
                ...prev,
                email: prev.email || session.user.email || '',
              },
              {
                ...settingsRes,
                name: settingsRes?.name || session.user.name || '',
                email: settingsRes?.email || session.user.email || '',
              },
              { overwriteEmail: true },
            )
          );
        });

      const lastOrderRequest = getLastOrderDetailsAction().then((lastOrder) => {
        if (!isMounted || !lastOrder) return;

        setFormData((prev) => mergeCheckoutProfile(prev, lastOrder));
      });

      try {
        await Promise.allSettled([profileRequest, lastOrderRequest]);
      } catch (error) {
        console.error('Auto-fill sync error:', error);
      } finally {
        if (isMounted) {
          setHasAutoFilled(true);
          setIsHydratingProfile(false);
        }
      }
    };

    if (status === 'authenticated' && !hasAutoFilled) {
      syncData();
    } else if (status !== 'loading' && !hasAutoFilled) {
      setHasAutoFilled(true);
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

  useEffect(() => {
    if (!hasHydratedCachedProfile) return;

    try {
      window.localStorage.setItem(
        CHECKOUT_PROFILE_STORAGE_KEY,
        JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          address: formData.address,
          landmark: formData.landmark,
        }),
      );
    } catch (error) {
      console.error('Failed to persist checkout profile', error);
    }
  }, [
    formData.address,
    formData.city,
    formData.email,
    formData.fullName,
    formData.landmark,
    formData.phone,
    hasHydratedCachedProfile,
  ]);

  const subtotal = useMemo(
    () =>
      cart.reduce((total, item) => {
        const itemPrice = item.discountedPrice != null ? item.discountedPrice : formatPrice(item.Price || item.price);
        return total + itemPrice * item.quantity;
      }, 0),
    [cart]
  );

  const selectedCity =
    CITY_OPTIONS.find((city) => normalizeCitySearchValue(city.value) === normalizeCitySearchValue(formData.city)) ?? null;
  const deferredCitySearch = useDeferredValue(citySearch);
  const normalizedCitySearch = normalizeCitySearchValue(deferredCitySearch);
  const visibleCityOptions = useMemo(() => {
    if (!normalizedCitySearch) {
      return CITY_OPTIONS.filter((city) => PRIORITY_CITY_KEYS.includes(city.sortKey)).slice(0, INITIAL_CITY_COUNT);
    }

    return CITY_OPTIONS.filter((city) => city.sortKey.includes(normalizedCitySearch)).slice(0, SEARCH_RESULTS_LIMIT);
  }, [normalizedCitySearch]);
  const pricing = calculateCheckoutPricing({
    subtotal,
    city: formData.city,
    settings,
  });
  const { shipping, total, isFreeShipping, freeShippingThreshold, isKarachi } = pricing;
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
    clearStoredSuccessfulOrder();
    setOrderPopupShown(true);
    router.replace('/');
    router.refresh();
  }

  function handleViewOrders() {
    clearStoredSuccessfulOrder();
    if (session) {
      router.push('/orders');
    } else {
      setShowAuthModal(true);
    }
  }

  function handlePlaceOrder(event) {
    event.preventDefault();
    if (submitting || !isInitialized || !validateForm() || cart.length === 0) return;

    setSubmitting(true);
    setErrors((previous) => ({ ...previous, submit: '' }));

    (async () => {
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

        if (!result?.success) {
          if (result?.code === 'PRICE_MISMATCH' && Array.isArray(result?.cartItems) && result.cartItems.length > 0) {
            replaceCart(result.cartItems);
            setErrors((previous) => ({
              ...previous,
              submit: 'Your cart was updated to the latest product pricing. Please review it and place the order again.',
            }));
            return;
          }
          setErrors((previous) => ({
            ...previous,
            submit: result?.error || 'Unable to place the order right now.',
          }));
          return;
        }

        trackPurchaseEvent({ orderId: result.orderId, cart, total });
        setOrderState(result);
        persistSuccessfulOrder(result);
        clearCart();
      } catch (error) {
        setErrors((previous) => ({
          ...previous,
          submit: error.message || 'Unable to place the order right now.',
        }));
      } finally {
        setSubmitting(false);
      }
    })();
  }

  if (!isInitialized && !orderState.orderId) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="surface-card w-full max-w-md rounded-[1.4rem] border border-border/80 py-10 shadow-[0_24px_60px_-42px_color-mix(in_oklab,var(--color-primary)_28%,transparent)]">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Loading your checkout...</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (cart.length === 0 && !orderState.orderId) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4">
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
      </section>
    );
  }

  return (
    <>
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

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Card className={cn(styles.sectionCard, styles.enter)} style={{ '--checkout-delay': '90ms' }}>
              <CardHeader className={styles.sectionHeader}>
                <span className={styles.sectionKicker}>Delivery details</span>
                <CardTitle className={cn('flex items-center gap-2 text-xl', styles.sectionTitle)}>
                  <MapPin className="size-5 text-primary" />
                  Shipping Information
                </CardTitle>
                <CardDescription className={styles.sectionDescription}>Contact and address information for this order.</CardDescription>
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
                        <Combobox
                          id="city"
                          items={CITY_OPTIONS}
                          filteredItems={visibleCityOptions}
                          value={selectedCity}
                          autoHighlight="always"
                          onInputValueChange={setCitySearch}
                          onValueChange={(city) => {
                            setFormData((previous) => ({ ...previous, city: city?.value || '' }));
                            setCitySearch('');
                            if (errors.city) {
                              setErrors((previous) => ({ ...previous, city: '' }));
                            }
                          }}
                        >
                          <ComboboxInput
                            placeholder="Search city name"
                            aria-invalid={Boolean(errors.city)}
                            showClear={Boolean(formData.city)}
                            inputClassName={cn(
                              'transition-none shadow-none',
                              'hover:border-transparent hover:bg-transparent',
                              'focus-visible:border-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:shadow-none',
                              'data-[pressed]:scale-100 data-[pressed]:translate-y-0'
                            )}
                            triggerClassName="translate-y-0 scale-100 transition-none hover:bg-transparent active:translate-y-0 active:scale-100 data-[pressed]:translate-y-0 data-[pressed]:scale-100"
                            className={cn(
                              'h-11 rounded-xl border-[color:color-mix(in_oklab,var(--color-border)_82%,white)] bg-[color:color-mix(in_oklab,var(--color-input)_88%,white)] shadow-none transition-colors duration-150',
                              'hover:border-[color:color-mix(in_oklab,var(--color-border)_82%,white)] hover:bg-[color:color-mix(in_oklab,var(--color-input)_88%,white)]',
                              'focus-within:border-[color:color-mix(in_oklab,var(--color-primary)_24%,var(--color-border))] focus-within:bg-[color:color-mix(in_oklab,var(--color-input)_92%,white)] focus-within:ring-3 focus-within:ring-[color:color-mix(in_oklab,var(--color-primary)_10%,transparent)]',
                              '[&_[data-slot=input-group-control]]:shadow-none [&_[data-slot=input-group-control]]:ring-0',
                              errors.city && 'border-destructive bg-[color:color-mix(in_oklab,var(--color-destructive)_6%,white)] ring-4 ring-[color:color-mix(in_oklab,var(--color-destructive)_16%,transparent)]'
                            )}
                          />
                          <ComboboxContent
                            className="rounded-xl border border-[color:color-mix(in_oklab,var(--color-border)_82%,white)] bg-[color:color-mix(in_oklab,var(--color-popover)_96%,white)] p-0 shadow-lg"
                            sideOffset={8}
                          >
                            <ComboboxList className="max-h-72 p-2">
                              <ComboboxEmpty className="px-3 py-4 text-sm">No matching city found.</ComboboxEmpty>
                              <ComboboxGroup>
                                <ComboboxLabel>{normalizedCitySearch ? 'Search results' : 'Main cities'}</ComboboxLabel>
                                <ComboboxCollection>
                                  {(city) => (
                                    <ComboboxItem
                                      key={city.value}
                                      value={city}
                                      className={cn(
                                        'rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-[background-color,color] duration-200 data-highlighted:bg-[color:color-mix(in_oklab,var(--color-muted)_58%,white)] sm:px-3.5',
                                        selectedCity?.value === city.value &&
                                          'bg-[color:color-mix(in_oklab,var(--color-primary)_8%,white)] text-primary'
                                      )}
                                    >
                                      <span className="truncate leading-5">{city.label}</span>
                                    </ComboboxItem>
                                  )}
                                </ComboboxCollection>
                              </ComboboxGroup>
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
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
                          <FieldDescription>Optional delivery notes.</FieldDescription>
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

                  {isHydratingProfile ? (
                    <Alert>
                      <AlertTitle>Filling your saved details</AlertTitle>
                      <AlertDescription>Your saved address details are loading in the background.</AlertDescription>
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
                <div className="grid gap-3 md:grid-cols-2">
                  <Alert className="rounded-[1.15rem] border-border/70 bg-[color:color-mix(in_oklab,var(--color-card)_92%,white)] shadow-[0_18px_28px_-30px_color-mix(in_oklab,var(--color-primary)_28%,transparent)]">
                    <Wallet className="text-primary" />
                    <AlertTitle>Cash on Delivery</AlertTitle>
                    <AlertDescription className="[text-wrap:pretty]">Pay when your order arrives.</AlertDescription>
                  </Alert>

                  <Alert
                    aria-disabled="true"
                    className="cursor-not-allowed rounded-[1.15rem] border-border/70 bg-[color:color-mix(in_oklab,var(--color-card)_92%,white)] opacity-50 shadow-none"
                  >
                    <CreditCard className="text-primary" />
                    <div className="flex items-center gap-2">
                      <AlertTitle>Online Payment (Card/Wallet)</AlertTitle>
                      <span className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Coming Soon
                      </span>
                    </div>
                    <AlertDescription className="[text-wrap:pretty]">
                      Secure online checkout will be available in a future update.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className={cn('surface-panel sticky top-24', styles.sectionCard, styles.summaryCard, styles.enter)} style={{ '--checkout-delay': '120ms' }}>
            <CardHeader className={cn('mb-2', styles.summaryHeader)}>
              <div className={styles.summaryMeta}>
                <div>
                  <p className={styles.sectionKicker}>Order summary</p>
                  <CardTitle className={cn('mt-2 text-xl', styles.sectionTitle)}>Your cart</CardTitle>
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
                  <span>Net Amount</span>
                  <span>Rs. {total.toLocaleString('en-PK')}</span>
                </div>

                <Button
                  className={cn('hidden w-full md:inline-flex', styles.ctaButton)}
                  size="lg"
                  onClick={() => document.getElementById('checkout-submit')?.click()}
                  disabled={submitting || !isInitialized}
                >
                  {submitting ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
                  {submitting ? 'Placing Order...' : 'Place Order'}
                </Button>

                <div className="mt-4 grid gap-2 text-xs font-medium text-muted-foreground">
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

      <div className={styles.mobileCheckoutBar}>
        <div className={styles.mobileCheckoutInner}>
          <div className={styles.mobileAmount}>
            <span className={styles.mobileAmountLabel}>Net Amount</span>
            <strong>Rs. {total.toLocaleString('en-PK')}</strong>
          </div>
          <Button
            className={cn('min-w-[10rem]', styles.ctaButton)}
            size="lg"
            onClick={() => document.getElementById('checkout-submit')?.click()}
            disabled={submitting || !isInitialized}
          >
            {submitting ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
            {submitting ? 'Placing...' : 'Place Order'}
          </Button>
        </div>
      </div>
    </>
  );
}
