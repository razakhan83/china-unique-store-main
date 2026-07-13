'use client';

import { createContext, startTransition, useContext, useEffect, useMemo, useOptimistic, useState } from 'react';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';

import { trackAddToCartEvent } from '@/lib/clientTracking';

const CART_STORAGE_KEY = 'kifayatly_cart_v2';

const CartItemsContext = createContext(null);
const CartUiContext = createContext(null);
const CartActionsContext = createContext(null);

function getCartItemId(item) {
  if (item?.id && item?.packLabel && typeof item.id === 'string' && item.id.endsWith(item.packLabel)) {
    return item.id;
  }
  const baseId = item?.slug || item?._id || item?.id || item?.productId || item?.Name || item?.name;
  return item?.packLabel ? `${baseId}-${item.packLabel}` : baseId;
}

function normalizeCartItem(item) {
  const basePrice = Number(item.Price || item.price || 0);
  const discountPercentage = Math.max(0, Number(item.discountPercentage || 0));
  const isDiscounted = item.isDiscounted === true;
  const discountedPrice = item.discountedPrice != null
    ? Number(item.discountedPrice)
    : isDiscounted && discountPercentage > 0
      ? Math.round(basePrice * (1 - discountPercentage / 100))
      : null;

  const packLabel = item.packLabel || '';
  const originalName = item.originalName || item.Name || item.name || 'Untitled Product';
  const finalName = packLabel && !originalName.includes(`(${packLabel})`) 
      ? `${originalName} (${packLabel})` 
      : originalName;

  return {
    id: getCartItemId(item),
    slug: item.slug || item.id || item._id || '',
    _id: item._id || item.id || item.slug || '',
    Name: finalName,
    originalName,
    packLabel,
    Price: basePrice,
    discountedPrice,
    discountPercentage,
    isDiscounted,
    Category: Array.isArray(item.Category) ? item.Category : item.Category ? [item.Category] : [],
    Images: item.Images || [],
    quantity: Math.max(1, Number(item.quantity || 1)),
  };
}

function mergeCartItems(currentCart, nextItem) {
  const existingIndex = currentCart.findIndex((item) => item.id === nextItem.id);
  if (existingIndex > -1) {
    const nextCart = [...currentCart];
    nextCart[existingIndex] = {
      ...nextCart[existingIndex],
      quantity: nextCart[existingIndex].quantity + nextItem.quantity,
    };
    return nextCart;
  }

  return [...currentCart, nextItem];
}

function applyOptimisticCartMutation(currentCart, mutation) {
  if (!mutation || typeof mutation !== 'object') return currentCart;

  switch (mutation.type) {
    case 'add':
      return mergeCartItems(currentCart, mutation.item);
    default:
      return currentCart;
  }
}

function CartProviderContent({ children }) {
  const [cart, setCart] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [optimisticCart, addOptimisticCart] = useOptimistic(cart, applyOptimisticCartMutation);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        const nextCart = Array.isArray(parsed?.items) ? parsed.items.map(normalizeCartItem) : [];
        setCart(nextCart);
      }
    } catch (error) {
      console.error('Failed to parse cart from local storage', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  function persistCartSnapshot(nextCart) {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          items: nextCart,
        })
      );
      return true;
    } catch (error) {
      console.error('Failed to persist cart to local storage', error);
      return false;
    }
  }

  const actions = useMemo(
    () => ({
      setActiveCategory,
      setIsCartOpen,
      setIsSidebarOpen,
      openCart() {
        setIsSidebarOpen(false);
        setIsCartOpen(true);
      },
      openSidebar() {
        setIsCartOpen(false);
        setIsSidebarOpen(true);
      },
      async addToCart(product, qtyToAdd = 1) {
        const normalized = normalizeCartItem({ ...product, quantity: qtyToAdd });
        if (!normalized.id) {
          toast.error('This item could not be added to the cart.');
          return { success: false, error: 'Invalid product' };
        }

        return new Promise((resolve) => {
          startTransition(async () => {
            addOptimisticCart({ type: 'add', item: normalized });
            const nextCart = mergeCartItems(optimisticCart, normalized);
            const persisted = persistCartSnapshot(nextCart);

            if (!persisted) {
              toast.error(`Could not add ${normalized.Name} to cart. Please try again.`);
              resolve({ success: false, error: 'Failed to persist cart' });
              return;
            }

            setCart(nextCart);

            try {
              trackAddToCartEvent({
                productId: normalized._id || normalized.id || normalized.slug,
                name: normalized.Name,
                category: Array.isArray(normalized.Category) ? normalized.Category.join(', ') : '',
                value: normalized.discountedPrice ?? normalized.Price,
                quantity: normalized.quantity,
              });
            } catch (error) {
              console.error('Failed to track add to cart event', error);
            }

            toast(
                <div className="flex items-center gap-2.5 w-full">
                    <div className="relative size-10 rounded-md overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                        {(normalized.Images?.[0]?.url || normalized.image || normalized.image_url) ? (
                            <img src={normalized.Images?.[0]?.url || normalized.image || normalized.image_url} alt={normalized.Name || 'Product'} className="object-cover w-full h-full" />
                        ) : (
                            <ShoppingCart className="size-4 text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0 pr-1">
                        <p className="font-semibold text-[13px] line-clamp-1 text-foreground leading-snug">{normalized.Name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{normalized.quantity} × Rs. {(normalized.discountedPrice ?? normalized.Price).toLocaleString('en-PK')}</p>
                    </div>
                    <a href="/checkout" className="shrink-0 flex items-center justify-center h-7 px-3 text-[11px] font-bold uppercase tracking-wide bg-primary text-primary-foreground rounded shadow-sm transition-colors hover:bg-primary/90">
                        Checkout
                    </a>
                </div>,
                { position: 'top-center', duration: 6000 }
            );

            resolve({ success: true, item: normalized, cart: nextCart });
          });
        });
      },
      removeFromCart(product) {
        const itemId = getCartItemId(product);
        const nextCart = optimisticCart.filter((item) => item.id !== itemId);
        if (!persistCartSnapshot(nextCart)) {
          toast.error('Could not update your cart right now.');
          return { success: false, error: 'Failed to persist cart' };
        }
        setCart(nextCart);
        return { success: true, cart: nextCart };
      },
      updateQuantity(product, newQuantity) {
        const itemId = getCartItemId(product);
        const safeQuantity = Math.max(0, Number(newQuantity) || 0);

        if (safeQuantity < 1) {
          const itemName = product?.Name || product?.name || 'Item';
          const nextCart = optimisticCart.filter((item) => item.id !== itemId);
          if (!persistCartSnapshot(nextCart)) {
            toast.error('Could not update your cart right now.');
            return { success: false, error: 'Failed to persist cart' };
          }
          setCart(nextCart);
          toast.success(`${itemName} removed from cart`, {
            duration: 2200,
            action: {
              label: 'View Cart',
              onClick: () => {
                setIsSidebarOpen(false);
                setIsCartOpen(true);
              },
            },
          });
          return { success: true, cart: nextCart };
        }

        const nextCart = optimisticCart.map((item) =>
          item.id === itemId ? { ...item, quantity: safeQuantity } : item
        );
        if (!persistCartSnapshot(nextCart)) {
          toast.error('Could not update your cart right now.');
          return { success: false, error: 'Failed to persist cart' };
        }
        setCart(nextCart);
        return { success: true, cart: nextCart };
      },
      replaceCart(items) {
        const nextCart = Array.isArray(items) ? items.map(normalizeCartItem) : [];
        if (!persistCartSnapshot(nextCart)) {
          toast.error('Could not refresh your cart right now.');
          return { success: false, error: 'Failed to persist cart' };
        }
        setCart(nextCart);
        return { success: true, cart: nextCart };
      },
      clearCart() {
        try {
          localStorage.removeItem(CART_STORAGE_KEY);
        } catch (error) {
          console.error('Failed to clear cart from local storage', error);
          toast.error('Could not clear your cart right now.');
          return { success: false, error: 'Failed to clear cart' };
        }
        setCart([]);
        return { success: true, cart: [] };
      },
    }),
    [addOptimisticCart, optimisticCart]
  );

  const cartItemsValue = useMemo(
    () => ({
      cart: optimisticCart,
      cartCount: optimisticCart.reduce((total, item) => total + item.quantity, 0),
      isInitialized,
    }),
    [isInitialized, optimisticCart]
  );

  const cartUiValue = useMemo(
    () => ({
      activeCategory,
      isCartOpen,
      isSidebarOpen,
    }),
    [activeCategory, isCartOpen, isSidebarOpen]
  );

  return (
    <CartActionsContext.Provider value={actions}>
      <CartUiContext.Provider value={cartUiValue}>
        <CartItemsContext.Provider value={cartItemsValue}>{children}</CartItemsContext.Provider>
      </CartUiContext.Provider>
    </CartActionsContext.Provider>
  );
}

export function CartProvider({ children }) {
  return <CartProviderContent>{children}</CartProviderContent>;
}

export function useCartItems() {
  return useContext(CartItemsContext);
}

export function useCartUi() {
  return useContext(CartUiContext);
}

export function useCartActions() {
  return useContext(CartActionsContext);
}

export function useCart() {
  const items = useCartItems();
  const ui = useCartUi();
  const actions = useCartActions();

  return useMemo(
    () => ({
      ...items,
      ...ui,
      ...actions,
    }),
    [actions, items, ui]
  );
}
