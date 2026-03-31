'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { trackAddToCartEvent } from '@/lib/clientTracking';

const CART_STORAGE_KEY = 'kifayatly_cart_v2';

const CartItemsContext = createContext(null);
const CartUiContext = createContext(null);
const CartActionsContext = createContext(null);

function getCartItemId(item) {
  return item?.slug || item?._id || item?.id || item?.productId || item?.Name || item?.name;
}

function normalizeCartItem(item) {
  return {
    id: getCartItemId(item),
    slug: item.slug || item.id || item._id || '',
    _id: item._id || item.id || item.slug || '',
    Name: item.Name || item.name || 'Untitled Product',
    Price: Number(item.Price || item.price || 0),
    discountedPrice: item.discountedPrice != null ? Number(item.discountedPrice) : null,
    Category: Array.isArray(item.Category) ? item.Category : item.Category ? [item.Category] : [],
    Images: item.Images || [],
    quantity: Math.max(1, Number(item.quantity || 1)),
  };
}

function CartProviderContent({ children }) {
  const [cart, setCart] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        items: cart,
      })
    );
  }, [cart, isInitialized]);

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

        setCart((current) => {
          const existingIndex = current.findIndex((item) => item.id === normalized.id);
          if (existingIndex > -1) {
            const nextCart = [...current];
            nextCart[existingIndex] = {
              ...nextCart[existingIndex],
              quantity: nextCart[existingIndex].quantity + normalized.quantity,
            };
            return nextCart;
          }

          return [...current, normalized];
        });

        trackAddToCartEvent({
          productId: normalized._id || normalized.id || normalized.slug,
          name: normalized.Name,
          category: Array.isArray(normalized.Category) ? normalized.Category.join(', ') : '',
          value: normalized.discountedPrice ?? normalized.Price,
          quantity: normalized.quantity,
        });

        toast.success(`${normalized.Name} added to cart`, {
          duration: 3000,
          action: {
            label: 'View Cart',
            onClick: () => {
              setIsSidebarOpen(false);
              setIsCartOpen(true);
            },
          },
        });

        return { success: true };
      },
      removeFromCart(product) {
        const itemId = getCartItemId(product);
        setCart((current) => current.filter((item) => item.id !== itemId));
      },
      updateQuantity(product, newQuantity) {
        const itemId = getCartItemId(product);
        const safeQuantity = Math.max(0, Number(newQuantity) || 0);

        if (safeQuantity < 1) {
          const itemName = product?.Name || product?.name || 'Item';
          setCart((current) => current.filter((item) => item.id !== itemId));
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
          return;
        }

        setCart((current) =>
          current.map((item) => (item.id === itemId ? { ...item, quantity: safeQuantity } : item))
        );
      },
      clearCart() {
        try {
          localStorage.removeItem(CART_STORAGE_KEY);
        } catch (error) {
          console.error('Failed to clear cart from local storage', error);
        }
        setCart([]);
      },
    }),
    []
  );

  const cartItemsValue = useMemo(
    () => ({
      cart,
      cartCount: cart.reduce((total, item) => total + item.quantity, 0),
      isInitialized,
    }),
    [cart, isInitialized]
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
