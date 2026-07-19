'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  Lock,
  ShoppingBag,
  Tag,
  Truck,
  Banknote,
  CreditCard,
  HelpCircle,
} from 'lucide-react';

import { getLastOrderDetailsAction, submitOrderAction, validateCouponAction } from '@/app/actions';

import AuthModal from '@/components/AuthModal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CheckoutPageSkeleton from '@/components/CheckoutPageSkeleton';
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
import { Skeleton } from '@/components/ui/skeleton';
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
const formatPriceLabel = (raw) => `Rs.\u00A0${formatPrice(raw).toLocaleString('en-PK')}`;
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

async function safeReadJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON response', error);
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

// ─── Order Summary Panel (shared by mobile accordion + desktop sidebar) ────────
function OrderSummaryContent({ cart, pricing, appliedCoupon, couponCodeInput, setCouponCodeInput, couponError, setCouponError, couponLoading, handleApplyCoupon, handleRemoveCoupon, relatedProducts = [], addToCart }) {
  const { subtotal, shipping, total, isFreeShipping, discountAmount } = pricing;

  const availableRelated = relatedProducts
    ?.filter((p) => !cart.some((item) => String(item.id || item._id) === String(p.id || p._id)))
    ?.slice(0, 3);

  return (
    <>
      {/* Product list */}
      <div className={styles.summaryProductList}>
        {cart.map((item, index) => {
          const itemPrice = item.discountedPrice != null ? item.discountedPrice : item.Price || item.price;
          const lineTotal = formatPrice(itemPrice) * item.quantity;
          const imgUrl = getPrimaryProductImage(item)?.url;

          return (
            <div key={`${item.id}-${index}`} className={styles.summaryProduct}>
              <div className={styles.summaryProductThumbWrapper}>
                <div className={styles.summaryProductThumb}>
                  {imgUrl ? (
                    <Image
                      src={imgUrl}
                      alt={item.Name || item.name}
                      fill
                      className="object-cover"
                      {...getBlurPlaceholderProps(getPrimaryProductImage(item).blurDataURL)}
                    />
                  ) : null}
                </div>
                <span className={styles.summaryProductQtyBadge}>{item.quantity}</span>
              </div>
              <span className={styles.summaryProductName}>{item.Name || item.name}</span>
              <span className={styles.summaryProductPrice}>{formatPriceLabel(lineTotal)}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.summaryDivider} />

      {/* Discount code */}
      <div className="mb-3">
        {appliedCoupon ? (
          <div className={styles.couponApplied}>
            <div className={styles.couponAppliedLeft}>
              <Tag className="size-3.5 text-success" />
              <span className={styles.couponCode}>{appliedCoupon.code}</span>
              <span className="text-success text-xs font-semibold">Applied</span>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-xs text-destructive hover:underline font-medium"
            >
              Remove
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} className={styles.discountRow}>
            <Input
              id="coupon-code"
              placeholder="Discount code"
              value={couponCodeInput}
              onChange={(e) => {
                setCouponCodeInput(e.target.value.toUpperCase());
                setCouponError('');
              }}
              className={cn('flex-1', couponError && 'border-destructive')}
            />
            <Button
              type="submit"
              variant="outline"
              disabled={!couponCodeInput.trim() || couponLoading}
              className="shrink-0"
            >
              {couponLoading ? <Loader2 className="size-4 animate-spin" /> : 'Apply'}
            </Button>
          </form>
        )}
        {couponError && <p className="mt-1 text-xs text-destructive">{couponError}</p>}
      </div>

      <div className={styles.summaryDivider} />

      {/* Totals */}
      <div className={styles.totalsGrid}>
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Subtotal</span>
          <span className={styles.totalValue}>Rs.&nbsp;{subtotal.toLocaleString('en-PK')}</span>
        </div>
        {discountAmount > 0 && (
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Discount ({appliedCoupon?.code})</span>
            <span className={styles.totalValueDiscount}>−Rs.&nbsp;{discountAmount.toLocaleString('en-PK')}</span>
          </div>
        )}
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Shipping</span>
          <span className={isFreeShipping ? styles.totalValueFree : styles.totalValue}>
            {isFreeShipping ? 'Free' : `Rs.\u00A0${shipping.toLocaleString('en-PK')}`}
          </span>
        </div>
      </div>

      <div className={styles.summaryDivider} />

      {/* Grand total */}
      <div className={styles.grandTotalRow}>
        <span className={styles.grandTotalLabel}>Total</span>
        <span>
          <span className={styles.grandTotalCurrency}>PKR</span>
          <span className={styles.grandTotalValue}>Rs.&nbsp;{total.toLocaleString('en-PK')}</span>
        </span>
      </div>

      {/* Cross-sell */}
      {availableRelated?.length > 0 && (
        <div className="mt-8">
          <h3 className="text-[0.95rem] font-bold text-foreground mb-3">You might also like</h3>
          <div className="flex flex-col gap-3">
            {availableRelated.map((product) => {
              const img = getPrimaryProductImage(product);
              const price = product.discountedPrice || product.Price;
              return (
                <div key={product.id} className="flex items-center gap-3.5 bg-background border border-border/60 rounded-md p-2.5 shadow-sm">
                  <div className={styles.summaryProductThumbWrapper} style={{ transform: 'none', margin: 0 }}>
                    <div className={styles.summaryProductThumb}>
                      {img && <Image src={img.url} alt={product.Name} fill className="object-cover" />}
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 justify-center">
                    <span className="text-[13px] font-semibold text-foreground/90 line-clamp-1">{product.Name}</span>
                    <span className="text-[13px] text-muted-foreground font-medium mt-0.5">Rs.&nbsp;{price.toLocaleString('en-PK')}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (addToCart) {
                        addToCart(product, 1);
                      }
                    }}
                    className="shrink-0 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md shadow-sm transition-colors mr-0.5"
                  >
                    Add
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export default function CheckoutClient({ settings, relatedProducts = [] }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { cart, isInitialized } = useCartItems();
  const { clearCart, addToCart } = useCartActions();
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const [hasHydratedCachedProfile, setHasHydratedCachedProfile] = useState(false);
  const [hasCachedProfile, setHasCachedProfile] = useState(false);
  const [isHydratingProfile, setIsHydratingProfile] = useState(false);
  const [saveInfo, setSaveInfo] = useState(true);
  const [mobileOrderOpen, setMobileOrderOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    landmark: '',
    instructions: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [orderState, setOrderState] = useState(() => readStoredSuccessfulOrder() || { orderId: '', whatsappUrl: '' });
  const [copied, setCopied] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasTrackedCheckoutView, setHasTrackedCheckoutView] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const submissionLockRef = useRef(false);

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__addToCart = addToCart;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.__addToCart;
      }
    };
  }, [addToCart]);

  useEffect(() => {
    if (hasHydratedCachedProfile) return;

    const cachedProfile = readCachedCheckoutProfile();
    if (cachedProfile) {
      setFormData((prev) => mergeCheckoutProfile(prev, cachedProfile));
      setHasCachedProfile(true);
    }

    setHasHydratedCachedProfile(true);
  }, [hasHydratedCachedProfile]);

  useEffect(() => {
    let isMounted = true;

    const syncData = async () => {
      if (status !== 'authenticated' || !session?.user) return;

      const shouldShowLoader = !hasCachedProfile;
      if (shouldShowLoader) {
        setIsHydratingProfile(true);
      }

      const profileRequest = fetch('/api/user/settings', { cache: 'no-store' })
        .then(async (res) => (res.ok ? safeReadJson(res) : null))
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
          if (shouldShowLoader) {
            setIsHydratingProfile(false);
          }
        }
      }
    };

    if (status === 'authenticated' && !hasAutoFilled) {
      syncData();
    } else if (status !== 'loading' && !hasAutoFilled) {
      setHasAutoFilled(true);
    }

    return () => {
      isMounted = false;
    };
  }, [hasAutoFilled, hasCachedProfile, session, status]);

  useEffect(() => {
    if (!hasHydratedCachedProfile || !saveInfo) return;

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
    saveInfo,
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
    appliedCoupon,
  });
  const { shipping, total, isFreeShipping, freeShippingThreshold, isKarachi, discountAmount } = pricing;

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
    
    const cleanPhone = formData.phone.replace(/\s+/g, '');
    if (!cleanPhone) {
      nextErrors.phone = 'Phone Number is required.';
    } else if (!/^03\d{9}$/.test(cleanPhone)) {
      nextErrors.phone = 'Enter a valid 11-digit number (e.g. 03001234567).';
    }

    if (!formData.city.trim()) nextErrors.city = 'City is required.';
    if (!formData.address.trim()) nextErrors.address = 'Complete Address is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleApplyCoupon(e) {
    e.preventDefault();
    if (!couponCodeInput.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const res = await validateCouponAction(
        couponCodeInput,
        subtotal,
        formData.email || session?.user?.email || '',
        formData.phone || ''
      );

      if (res.success) {
        setAppliedCoupon(res.coupon);
        setCouponCodeInput('');
      } else {
        setCouponError(res.message || 'Invalid coupon.');
      }
    } catch (error) {
      setCouponError('Error validating coupon.');
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponError('');
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
    setOrderState({ orderId: '', whatsappUrl: '' });
    router.replace('/');
    router.refresh();
  }

  function handleViewOrders() {
    clearStoredSuccessfulOrder();
    setOrderState({ orderId: '', whatsappUrl: '' });
    if (session) {
      router.push('/orders');
    } else {
      setShowAuthModal(true);
    }
  }

  function handlePlaceOrder(event) {
    event?.preventDefault?.();
    if (submissionLockRef.current || submitting || !isInitialized || !validateForm() || cart.length === 0) return;

    submissionLockRef.current = true;
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
          couponCode: appliedCoupon?.code,
          items: cart.map((item) => ({
            productId: item.id || item._id || item.slug,
            slug: item.slug,
            packLabel: item.packLabel || '',
            name: item.Name || item.name,
            price: item.discountedPrice != null ? item.discountedPrice : item.Price || item.price,
            quantity: item.quantity,
            image: getPrimaryProductImage(item)?.url || '',
          })),
        });

        if (!result?.success) {
          setErrors((previous) => ({
            ...previous,
            submit: result?.error || 'Unable to place the order right now.',
          }));
          return;
        }

        trackPurchaseEvent({ orderId: result.orderId, cart, total: result.totalAmount || total });
        setOrderState(result);
        persistSuccessfulOrder(result);
        clearCart();
        router.refresh();
      } catch (error) {
        setErrors((previous) => ({
          ...previous,
          submit: error.message || 'Unable to place the order right now.',
        }));
      } finally {
        submissionLockRef.current = false;
        setSubmitting(false);
      }
    })();
  }

  // ─── Loading / empty states ────────────────────────────────────────────────

  if (!isInitialized && !orderState.orderId) {
    return <CheckoutPageSkeleton />;
  }

  if (cart.length === 0 && !orderState.orderId) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4">
        <Empty className="w-full max-w-md rounded-2xl border border-border/80 bg-card py-10">
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

  const shouldShowCentralCheckoutLoader =
    !orderState.orderId &&
    isInitialized &&
    cart.length > 0 &&
    hasHydratedCachedProfile &&
    status === 'authenticated' &&
    !hasCachedProfile &&
    (isHydratingProfile || !hasAutoFilled);

  if (shouldShowCentralCheckoutLoader) {
    return <CheckoutPageSkeleton />;
  }

  if (orderState.orderId) {
    return (
      <div className="flex min-h-[90vh] items-center justify-center bg-gray-50/50 px-4 py-12">
        <Dialog open={!!orderState.orderId} onOpenChange={(open) => !open && handleModalClose()}>
          <DialogContent className={cn('p-6 text-center sm:p-8 sm:max-w-md', styles.dialogPanel)} hideClose>
            {/* Happy Illustration (increased size, floating background-free) */}
            <div className="mx-auto mb-5 flex h-36 sm:h-56 w-full max-w-[220px] sm:max-w-[340px] items-center justify-center bg-transparent pt-3">
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes slowFloat {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-7px); }
                }
                .animate-slow-float {
                  animation: slowFloat 4.5s ease-in-out infinite;
                }
              `}} />
              <Image
                src="/undraw_happy_fsrv.svg"
                alt="Order Confirmed Successfully"
                width={300}
                height={300}
                className="h-full w-full object-contain select-none animate-slow-float"
                priority
              />
            </div>

            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold text-foreground tracking-tight sm:text-3xl [text-wrap:balance]">
                Order Confirmed! 🎉
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm text-muted-foreground sm:text-base [text-wrap:pretty] leading-relaxed">
                Your order has been placed! Delivery takes <span className="font-semibold text-foreground">2 to 3 working days</span>.
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
                    aria-label="Copy Order ID"
                    title="Copy Order ID"
                  >
                    {copied ? <Check className="text-success" /> : <Copy />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  size="lg"
                  className={cn('flex-1 px-2.5 text-xs sm:text-sm font-bold active:scale-[0.96] h-11 sm:h-12 rounded-xl', styles.dialogCtaButton)}
                  onClick={handleViewOrders}
                >
                  View My Orders
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex-1 px-2.5 text-xs sm:text-sm font-semibold active:scale-[0.96] h-11 sm:h-12 rounded-xl" 
                  onClick={handleModalClose}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const summaryProps = {
    cart,
    pricing,
    appliedCoupon,
    couponCodeInput,
    setCouponCodeInput,
    couponError,
    setCouponError,
    couponLoading,
    handleApplyCoupon,
    handleRemoveCoupon,
    addToCart,
    relatedProducts: relatedProducts.map((p) => ({ ...p, id: p._id || p.id })),
  };

  return (
    <>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} callbackUrl="/orders" />

      {/* ══════════════════════════════════════════════
          MOBILE ORDER SUMMARY ACCORDION
      ══════════════════════════════════════════════ */}
      <div className={styles.mobileOrderSummary}>
        <button
          type="button"
          id="mobile-order-summary-toggle"
          className={styles.mobileOrderSummaryTrigger}
          onClick={() => setMobileOrderOpen((v) => !v)}
          aria-expanded={mobileOrderOpen}
        >
          <span className={styles.mobileOrderSummaryTriggerLeft}>
            <ShoppingBag className="size-4" />
            {mobileOrderOpen ? 'Hide order summary' : 'Show order summary'}
            <ChevronDown
              className={cn(styles.mobileOrderSummaryChevron, mobileOrderOpen && styles.mobileOrderSummaryChevronOpen)}
              aria-hidden
            />
          </span>
          <span className={styles.mobileOrderSummaryTotal}>Rs.&nbsp;{total.toLocaleString('en-PK')}</span>
        </button>

        {mobileOrderOpen && (
          <div className={styles.mobileOrderSummaryBody}>
            <div className={styles.mobileOrderSummaryBodyInner}>
              <OrderSummaryContent {...summaryProps} />
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          TWO-PANEL CHECKOUT SHELL
      ══════════════════════════════════════════════ */}
      <div className={styles.checkoutShell}>

        {/* ── LEFT PANEL (forms) ── */}
        <div className={styles.leftPanel}>
          <div className={cn(styles.leftPanelInner, styles.enter)} style={{ '--checkout-delay': '60ms' }}>

            {/* ── CONTACT ── */}
            <div className={styles.sectionBlock}>
              <div className={styles.sectionTitleRow}>
                <h2 className={styles.sectionTitle}>Contact</h2>
                {!session?.user ? (
                  <button
                    type="button"
                    className={styles.signInLink}
                    onClick={() => setShowAuthModal(true)}
                  >
                    Sign in
                  </button>
                ) : null}
              </div>

              <FieldGroup className="gap-3">
                <Field>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    spellCheck={false}
                    aria-label="Email or mobile phone number"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email or mobile phone number"
                    readOnly={!!session?.user}
                    className={session?.user ? 'cursor-not-allowed bg-muted/30' : ''}
                  />
                </Field>

                <div className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    id="email-offers"
                    className="size-4 rounded accent-primary"
                    defaultChecked={false}
                  />
                  <label htmlFor="email-offers">Email me with news and offers</label>
                </div>
              </FieldGroup>
            </div>

            {/* ── DELIVERY ── */}
            <div className={styles.sectionBlock}>
              <h2 className={styles.sectionTitle}>Delivery</h2>

              <FieldGroup className="gap-3">

                {/* Name / Phone row */}
                <div className={styles.inputRow2}>
                  <Field data-invalid={errors.fullName ? 'true' : undefined}>
                    <Input
                      id="fullName"
                      name="fullName"
                      autoComplete="name"
                      spellCheck={false}
                      aria-label="Full name"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Full name *"
                      aria-invalid={Boolean(errors.fullName)}
                    />
                    <FieldError>{errors.fullName}</FieldError>
                  </Field>
                  <Field data-invalid={errors.phone ? 'true' : undefined}>
                    <Input
                      id="phone"
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      aria-label="Phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone *"
                      aria-invalid={Boolean(errors.phone)}
                    />
                    <FieldError>{errors.phone}</FieldError>
                  </Field>
                </div>

                {/* Address */}
                <Field data-invalid={errors.address ? 'true' : undefined}>
                  <Input
                    id="address"
                    name="address"
                    autoComplete="street-address"
                    aria-label="Complete address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Complete address *"
                    aria-invalid={Boolean(errors.address)}
                  />
                  <FieldError>{errors.address}</FieldError>
                </Field>

                {/* Apartment */}
                <Field>
                  <Input
                    id="landmark"
                    name="landmark"
                    aria-label="Apartment, suite, etc. (optional)"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="Apartment, suite, etc. (optional)"
                  />
                </Field>

                {/* City / Postal row */}
                <div className={styles.inputRow2}>
                  <Field data-invalid={errors.city ? 'true' : undefined}>
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
                        placeholder="City *"
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
                                    'rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-[background-color,color] duration-200 data-highlighted:bg-[color:color-mix(in_oklab,var(--color-muted)_58%,white)] sm:px-3.5',
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
                  <Field>
                    <Input id="postal" placeholder="Postal code (optional)" />
                  </Field>
                </div>

                {/* Save for next time */}
                <div className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    id="save-info"
                    checked={saveInfo}
                    onChange={(e) => setSaveInfo(e.target.checked)}
                    className="size-4 rounded accent-primary"
                  />
                  <label htmlFor="save-info">Save this information for next time</label>
                </div>
              </FieldGroup>
            </div>



            {/* ── PAYMENT ── */}
            <div className={styles.sectionBlock}>
              <h2 className={styles.sectionTitle}>Payment</h2>
              <p className={styles.sectionSubtitle}>All transactions are secure and encrypted.</p>

              <div className={styles.paymentOptions}>

                {/* Credit card — coming soon */}
                <div className={cn(styles.paymentOption, styles.paymentOptionDisabled)}>
                  <div className={styles.paymentOptionHeader}>
                    <div className={styles.paymentOptionLeft}>
                      <div className={styles.radioCircle} />
                      <CreditCard className="size-4 text-muted-foreground" aria-hidden />
                      <span className={styles.paymentOptionLabel}>Credit card</span>
                      <span className={styles.comingSoonBadge}>Coming soon</span>
                    </div>
                    <div className={styles.paymentCardLogos}>
                      <Image src="/VISA-logo.png" alt="Visa" width={36} height={24} className={styles.paymentCardLogo} style={{ width: 'auto' }} />
                      <Image src="/Mastercard-Logo.png" alt="Mastercard" width={36} height={24} className={styles.paymentCardLogo} style={{ width: 'auto' }} />
                    </div>
                  </div>
                </div>

                {/* Cash on Delivery */}
                <div
                  id="payment-cod"
                  role="radio"
                  aria-checked={paymentMethod === 'cod'}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPaymentMethod('cod'); } }}
                  className={styles.paymentOption}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <div className={cn(styles.paymentOptionHeader, paymentMethod === 'cod' && styles.paymentOptionSelectedBg)}>
                    <div className={styles.paymentOptionLeft}>
                      <div className={cn(styles.radioCircle, paymentMethod === 'cod' && styles.radioCircleActive)}>
                        {paymentMethod === 'cod' && <div className={styles.radioDot} />}
                      </div>
                      <Banknote className="size-4 text-muted-foreground" aria-hidden />
                      <span className={styles.paymentOptionLabel}>Cash on Delivery (COD)</span>
                    </div>
                  </div>
                </div>

                {/* Bank Deposit */}
                {settings?.bankDepositEnabled && (
                  <div
                    id="payment-bank"
                    role="radio"
                    aria-checked={paymentMethod === 'bank'}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPaymentMethod('bank'); } }}
                    className={styles.paymentOption}
                    onClick={() => setPaymentMethod('bank')}
                  >
                    <div className={cn(styles.paymentOptionHeader, paymentMethod === 'bank' && styles.paymentOptionSelectedBg)}>
                      <div className={styles.paymentOptionLeft}>
                        <div className={cn(styles.radioCircle, paymentMethod === 'bank' && styles.radioCircleActive)}>
                          {paymentMethod === 'bank' && <div className={styles.radioDot} />}
                        </div>
                        <span className={styles.paymentOptionLabel}>Bank Deposit</span>
                      </div>
                    </div>

                    {paymentMethod === 'bank' && (
                      <div className={styles.bankInfo}>
                        <p className="font-semibold">
                          Send payment slip to:{' '}
                          <a
                            href={`https://wa.me/${settings?.whatsappNumber?.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {settings?.whatsappNumber}
                          </a>
                        </p>
                        <div className={styles.bankInfoCode}>
                          {settings?.bankDepositAccountDetails || 'Account details will appear here.'}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Billing address row */}
              <div className={styles.billingRow}>
                <input
                  type="checkbox"
                  id="billing-same"
                  defaultChecked
                  className="size-4 rounded accent-primary"
                />
                <label htmlFor="billing-same" className="cursor-pointer text-sm">
                  Use shipping address as billing address
                </label>
              </div>
            </div>

            {/* Special instructions */}
            <div className={styles.sectionBlock}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="instructions">Special Notes (optional)</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="instructions"
                      name="instructions"
                      value={formData.instructions}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Any special delivery instructions…"
                    />
                    <FieldDescription>Optional delivery notes.</FieldDescription>
                  </FieldContent>
                </Field>
              </FieldGroup>
            </div>

            {/* Submit error */}
            {errors.submit ? (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Unable to place order</AlertTitle>
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            ) : null}

            {/* Hidden submit trigger for form */}
            <form onSubmit={handlePlaceOrder}>
              <button type="submit" id="checkout-submit" className="hidden" />
            </form>

            {/* Desktop CTA */}
            <button
              id="place-order-desktop"
              className={cn(styles.ctaButton, 'hidden md:flex items-center justify-center gap-2')}
              onClick={() => document.getElementById('checkout-submit')?.click()}
              disabled={submitting || !isInitialized}
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? 'Placing Order…' : paymentMethod === 'card' ? 'Pay now' : 'Complete order'}
            </button>

            {/* Footer links */}
            <div className={styles.trustLinks}>
              <a href="/refund-policy" className={styles.trustLink}>Refund policy</a>
              <a href="/shipping-policy" className={styles.trustLink}>Shipping</a>
              <a href="/privacy-policy" className={styles.trustLink}>Privacy policy</a>
              <a href="/terms-of-service" className={styles.trustLink}>Terms of service</a>
              <a href="/contact" className={styles.trustLink}>Contact</a>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL (order summary — desktop only) ── */}
        <div className={styles.rightPanel}>
          <div className={cn(styles.rightPanelInner, styles.enter)} style={{ '--checkout-delay': '120ms' }}>
            <OrderSummaryContent {...summaryProps} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MOBILE STICKY BOTTOM BAR
      ══════════════════════════════════════════════ */}
      <div className={styles.mobileCheckoutBar}>
        <div className={styles.mobileCheckoutInner}>
          <div className={styles.mobileAmount}>
            <span className={styles.mobileAmountLabel}>Total</span>
            <strong>Rs.&nbsp;{total.toLocaleString('en-PK')}</strong>
          </div>
          <button
            id="place-order-mobile"
            className={styles.mobilePlaceOrderBtn}
            onClick={() => document.getElementById('checkout-submit')?.click()}
            disabled={submitting || !isInitialized}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? 'Placing…' : paymentMethod === 'card' ? 'Pay now' : 'Complete order'}
          </button>
        </div>
      </div>
    </>
  );
}
