'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ChevronDown,
  LayoutGrid,
  Menu,
  Phone,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  X,
  Heart,
  Home,
  Package,
  MapPin,
} from 'lucide-react';

import { useCartActions, useCartItems, useCartUi } from '@/context/CartContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Sheet,
  SheetContent,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import StoreLogo from '@/components/StoreLogo';
import MobileMenuContent from '@/components/MobileMenuContent';
import { cn } from '@/lib/utils';

const MyOrdersButton = dynamic(() => import('@/components/MyOrdersButton'), {
  ssr: false,
  loading: () => <Skeleton className="hidden md:inline-flex min-h-10 w-10 md:w-[6.5rem] rounded-xl" aria-hidden="true" />,
});

const MyWishlistButton = dynamic(() => import('@/components/MyWishlistButton'), {
  ssr: false,
  loading: () => <Skeleton className="hidden md:inline-flex min-h-10 w-10 md:w-[6.5rem] rounded-xl" aria-hidden="true" />,
});

const AuthModal = dynamic(() => import('@/components/AuthModal'), {
  ssr: false,
  loading: () => null,
});

const NavbarSearchPanel = dynamic(() => import('@/components/NavbarSearchPanel'), {
  loading: () => <Skeleton className="min-h-12 w-full rounded-xl" aria-hidden="true" />,
});

const MobileSearchOverlay = dynamic(() => import('@/components/MobileSearchOverlay'), {
  ssr: false,
});

const NavbarDesktopAccountControl = dynamic(() => import('@/components/NavbarDesktopAccountControl'), {
  ssr: false,
  loading: () => <Skeleton className="hidden md:block md:size-11 md:rounded-2xl" aria-hidden="true" />,
});

const NavbarSidebarFooter = dynamic(() => import('@/components/NavbarSidebarFooter'), {
  ssr: false,
  loading: () => <Skeleton className="min-h-10 w-full rounded-xl" aria-hidden="true" />,
});

const MobileBottomNav = dynamic(() => import('@/components/MobileBottomNav'), {
  ssr: false,
  loading: () => null,
});

function MobileMenuSkeleton() {
  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      {/* Tabs list skeleton */}
      <div className="flex w-full items-center p-4 pb-2">
        <div className="grid h-10 w-full grid-cols-2 gap-2 rounded-lg bg-muted/40 p-1">
          <Skeleton className="h-8 w-full rounded-md bg-muted/60" />
          <Skeleton className="h-8 w-full rounded-md bg-transparent" />
        </div>
      </div>

      {/* Menu items skeleton */}
      <div className="flex-1 px-4 py-2 space-y-2.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex h-9 items-center gap-4 rounded-lg bg-gray-50/50 px-3 py-1.5 border border-transparent">
            <Skeleton className="size-4 rounded bg-muted/65 shrink-0" />
            <Skeleton className="h-3.5 w-24 rounded bg-muted/50" />
          </div>
        ))}
      </div>

      {/* Bottom section skeleton */}
      <div className="mt-auto flex flex-col gap-4 border-t border-border p-4 bg-background">
        <div className="flex justify-center gap-5 pb-5 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="size-[18px] rounded-full bg-muted/60" />
          ))}
        </div>
        <Skeleton className="h-9 w-full rounded-lg bg-muted/50" />
      </div>
    </div>
  );
}

function normalizeAnnouncementItems(messages = [], announcementText = '') {
  const rawMessages = Array.isArray(messages) && messages.length > 0
    ? messages
    : String(announcementText || '')
        .split(/\r?\n|[|•]+/)
        .map((text, index) => ({ id: `legacy-${index + 1}`, text, isActive: true }));

  return rawMessages
    .filter((item) => item?.isActive !== false)
    .map((item) => String(item?.text || '').trim())
    .filter(Boolean);
}

function AnnouncementMarquee({ items = [] }) {
  if (items.length === 0) return null;

  const totalCharacters = items.reduce((count, item) => count + item.length, 0);
  const durationSeconds = Math.min(120, Math.max(56, totalCharacters * 0.7));

  const marqueeItems = Array.from({ length: 4 }, (_, repeatIndex) =>
    items.map((text) => ({
      id: `${repeatIndex}-${text}`,
      text,
    }))
  ).flat();

  return (
    <div
      className="announcement-marquee mask-edge"
      style={{ '--announcement-marquee-duration': `${durationSeconds}s` }}
    >
      <div className="announcement-marquee__track">
        {[0, 1].map((copyIndex) => (
          <div
            key={copyIndex}
            className="announcement-marquee__content"
            aria-hidden={copyIndex === 1 ? 'true' : undefined}
          >
            {marqueeItems.map(({ id, text }, index) => (
              <span key={`${copyIndex}-${id}`} className="announcement-marquee__item">
                <span className="announcement-marquee__label">{text}</span>
                {index < marqueeItems.length - 1 ? (
                  <span className="announcement-marquee__separator" aria-hidden="true">
                    <Sparkles className="size-3.5" />
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function NavbarContent({
  categories,
  storeName = 'China Unique Store',
  lightLogoUrl = '',
  darkLogoUrl = '',
  logoScalePercent = 100,
  announcementBarEnabled = true,
  announcementBarText = '',
  announcementBarMessages = [],
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { cartCount = 0, isInitialized: isCartInitialized = false } = useCartItems() || {};
  const { activeCategory = 'all', isSidebarOpen = false, isCartOpen = false } = useCartUi() || {};
  const {
    setActiveCategory = () => {},
    setIsSidebarOpen = () => {},
    openSidebar = () => {},
    openCart = () => {},
    setIsCartOpen = () => {},
  } = useCartActions() || {};

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [isNavbarHidden, setIsNavbarHidden] = useState(false);
  const { data: session } = useSession() || {};
  
  const searchPlaceholders = categories?.length > 0 
    ? categories.map(c => `What are you finding? ${c.label}`)
    : ["What are you finding? Kitchen Accessories", "What are you finding? Stationeries", "What are you finding? Gadgets"];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const closeCategoriesTimeoutRef = useRef(null);
  const isNavbarHiddenRef = useRef(false);
  const lastScrollYRef = useRef(0);
  const scrollAnchorYRef = useRef(0);

  useEffect(() => {
    return () => {
      if (closeCategoriesTimeoutRef.current) {
        window.clearTimeout(closeCategoriesTimeoutRef.current);
      }
    };
  }, []);

  // Removed artificial 600ms loading skeleton to ensure menu opens instantly

  function revealNavbar() {
    if (isNavbarHiddenRef.current) {
      isNavbarHiddenRef.current = false;
      setIsNavbarHidden(false);
    }

    scrollAnchorYRef.current = window.scrollY;
  }

  useEffect(() => {
    if (isCartOpen) {
      revealNavbar();
    }
  }, [isCartOpen]);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;
    scrollAnchorYRef.current = window.scrollY;

    let frameId = null;

    const updateNavbarVisibility = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;

      if (Math.abs(delta) < 3) {
        lastScrollYRef.current = currentScrollY;
        frameId = null;
        return;
      }

      const distanceFromAnchor = currentScrollY - scrollAnchorYRef.current;

      if (currentScrollY <= 16) {
        if (isNavbarHiddenRef.current) {
          isNavbarHiddenRef.current = false;
          setIsNavbarHidden(false);
        }
        scrollAnchorYRef.current = currentScrollY;
      } else if (!(isSearchOpen || isSidebarOpen || isAccountDrawerOpen || isCartOpen)) {
        if (!isNavbarHiddenRef.current && distanceFromAnchor > 56 && delta > 0 && currentScrollY > 80) {
          isNavbarHiddenRef.current = true;
          setIsNavbarHidden(true);
          scrollAnchorYRef.current = currentScrollY;
        } else if (isNavbarHiddenRef.current && distanceFromAnchor < -12 && delta < 0) {
          isNavbarHiddenRef.current = false;
          setIsNavbarHidden(false);
          scrollAnchorYRef.current = currentScrollY;
        } else if (Math.sign(delta) !== Math.sign(distanceFromAnchor) && Math.abs(distanceFromAnchor) > 6) {
          scrollAnchorYRef.current = lastScrollYRef.current;
        }
      }

      lastScrollYRef.current = currentScrollY;
      frameId = null;
    };

    const handleScroll = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(updateNavbarVisibility);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isAccountDrawerOpen, isSearchOpen, isSidebarOpen]);

  function handleCategoryClick(categoryId) {
    setActiveCategory(categoryId);
    setIsSidebarOpen(false);
    setIsCategoriesOpen(false);
    const url = categoryId === 'all' ? '/products' : `/products?category=${categoryId}`;
    router.push(url, { scroll: true });
  }

  function handleSearchToggle() {
    revealNavbar();
    setIsSidebarOpen(false);
    setIsAccountDrawerOpen(false);
    setIsSearchOpen((value) => !value);
  }

  function handleSearchOpenChange(open) {
    const nextOpen = open === true;

    if (nextOpen) {
      revealNavbar();
      setIsSidebarOpen(false);
      setIsAccountDrawerOpen(false);
    }

    setIsSearchOpen(nextOpen);
  }

  function handleMobileNavigate(href) {
    setIsSearchOpen(false);
    setIsAccountDrawerOpen(false);
    router.push(href);
  }

  function handleDesktopNavigate(href) {
    setIsSearchOpen(false);
    setIsAccountDrawerOpen(false);
    setIsCategoriesOpen(false);
    setIsSidebarOpen(false);
    router.push(href, { scroll: true });
  }

  function handleAccountDrawerChange(open) {
    if (open) {
      revealNavbar();
      setIsSearchOpen(false);
      setIsSidebarOpen(false);
    }
    setIsAccountDrawerOpen(open);
  }

  function handleSidebarOpen() {
    revealNavbar();
    openSidebar();
  }

  function navLinkClass(path) {
    return cn(
      'inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-sm transition-[color,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96]',
      pathname === path
        ? 'font-bold text-primary'
        : 'font-medium text-muted-foreground hover:text-foreground'
    );
  }

  function desktopNavButtonClass(isActive = false) {
    return cn(
      'inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-sm transition-[color,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96]',
      isActive
        ? 'font-bold text-primary'
        : 'font-medium text-muted-foreground hover:text-foreground'
    );
  }

  function cancelCategoriesClose() {
    if (closeCategoriesTimeoutRef.current) {
      window.clearTimeout(closeCategoriesTimeoutRef.current);
      closeCategoriesTimeoutRef.current = null;
    }
  }

  function scheduleCategoriesClose() {
    cancelCategoriesClose();
    closeCategoriesTimeoutRef.current = window.setTimeout(() => {
      setIsCategoriesOpen(false);
      closeCategoriesTimeoutRef.current = null;
    }, 120);
  }

  const mobileItems = [
    { href: '/', label: 'Home', icon: Store },
    { href: '/products', label: 'All Products', icon: LayoutGrid },
  ];
  const mobileMenuButtonClass =
    'min-h-10 rounded-xl px-2.5 py-2 text-sidebar-foreground transition-[background-color,color,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-sidebar-accent/45 hover:text-sidebar-accent-foreground data-[active=true]:text-sidebar-primary-foreground active:scale-[0.99]';
  const navActionButtonClass =
    'nav-icon-button relative rounded-full md:border border-transparent md:border-border/60 bg-transparent md:bg-background p-0 text-foreground transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-110 hover:border-[#E3FCEF] hover:bg-[#E3FCEF] hover:text-[#015347] hover:shadow-[0_8px_25px_rgba(227,252,239,0.8)] active:scale-95 active:translate-y-0';
  const announcementItems = normalizeAnnouncementItems(announcementBarMessages, announcementBarText);
  const showAnnouncementBar = announcementBarEnabled && announcementItems.length > 0;

  return (
    <>
      <div className={cn(
        "navbar-shell sticky top-0 z-[200] overflow-visible bg-card shadow-[0_1px_0_color-mix(in_oklab,var(--color-border)_72%,white)] transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] will-change-transform",
        isNavbarHidden ? '-translate-y-full' : 'translate-y-0'
      )}>
      {showAnnouncementBar ? (
        <div className="relative flex min-h-8 md:min-h-9 items-center bg-primary py-1.5 md:py-2 text-primary-foreground shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)] before:absolute before:-top-px before:left-0 before:right-0 before:h-px before:bg-primary before:content-['']">
          <AnnouncementMarquee items={announcementItems} />
        </div>
      ) : null}

      <div className="relative z-50">
          <header className="relative z-[60] mx-auto flex h-16 md:h-20 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 xl:px-10">
            <div className="flex items-center gap-4 lg:gap-8 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => isSidebarOpen ? setIsSidebarOpen(false) : handleSidebarOpen()} aria-label={isSidebarOpen ? "Close menu" : "Open menu"} className="md:hidden relative">
                <span className="relative flex size-6 items-center justify-center">
                  <Menu strokeWidth={2.2} className={cn('absolute inset-0 size-full transition-all duration-300', isSidebarOpen ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0')} />
                  <X strokeWidth={2.2} className={cn('absolute inset-0 size-full transition-all duration-300', isSidebarOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90')} />
                </span>
              </Button>

              <StoreLogo
                storeName={storeName}
                lightLogoUrl={lightLogoUrl}
                darkLogoUrl={darkLogoUrl}
                logoScalePercent={logoScalePercent * 1.35}
                variant="light-surface"
                priority
                onClick={(event) => {
                  event.preventDefault();
                  handleDesktopNavigate('/');
                }}
                className="absolute left-1/2 -translate-x-1/2 md:static md:left-auto md:translate-x-0 transition-transform duration-300 hover:scale-[1.02] cursor-pointer"
                isLink={false}
              />
            </div>

            {/* Center Zone: Search (Desktop only) */}
            <div className="hidden md:block flex-1 w-full mx-6 xl:mx-10">
              <NavbarSearchPanel
                open={true}
                onOpenChange={() => {}}
                placeholder={searchPlaceholders[placeholderIndex]}
              />
            </div>

            {/* Right Zone: Actions */}
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              {/* Combined Cart Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                onClick={() => isCartOpen ? setIsCartOpen(false) : openCart()}
                className={cn('nav-cart-button overflow-visible rounded-full', navActionButtonClass, 'hover:!bg-[#E3FCEF] hover:!text-[#015347] hover:!border-[#E3FCEF] hover:!shadow-[0_8px_25px_rgba(227,252,239,0.9)]')}
                aria-label="Open cart"
                title="Cart"
              >
                <span className="relative flex size-6 md:size-[1.65rem] items-center justify-center">
                  <ShoppingBag strokeWidth={1.5} className={cn('absolute inset-0 size-full transition-all duration-300', isCartOpen ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0')} />
                  <X strokeWidth={1.5} className={cn('absolute inset-0 size-full transition-all duration-300', isCartOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90')} />
                </span>
                {isCartInitialized ? (
                  cartCount > 0 ? (
                    <span className="absolute -right-2 -top-2 inline-flex size-5 items-center justify-center rounded-full bg-[#015347] text-[11px] font-bold leading-none text-white">
                      {cartCount}
                    </span>
                  ) : null
                ) : (
                  <span className="absolute -right-2 -top-2 inline-flex size-5 items-center justify-center rounded-full bg-[#015347] text-[11px] font-bold leading-none text-white">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/70" />
                  </span>
                )}
              </Button>

              <NavbarDesktopAccountControl navActionButtonClass={navActionButtonClass} />
            </div>
          </header>

          <MobileSearchOverlay 
            open={isSearchOpen}
            onOpenChange={setIsSearchOpen}
          />

          {/* Top Secondary Navbar (now below header) */}
          <div className="hidden md:flex relative z-40 bg-muted/30 py-2.5 border-y border-border/50">
            <div className="mx-auto flex w-full max-w-[1440px] items-center justify-center px-4 sm:px-6 xl:px-10 text-[14px] font-semibold text-muted-foreground/90">
              <div className="flex flex-wrap items-center justify-center gap-2 xl:gap-4">
                <Link href="/" className="inline-flex relative z-50 items-center justify-center h-[38px] gap-1.5 px-4 rounded-full hover:bg-[#E3FCEF] hover:text-[#015347] hover:-translate-y-1.5 hover:scale-110 hover:shadow-[0_6px_20px_rgba(227,252,239,0.7)] transition-all duration-300 ease-out group active:scale-95 active:translate-y-0">
                  <Home className="size-4 transition-transform duration-300 ease-out group-hover:scale-110" strokeWidth={2.2} /> Home
                </Link>
                <DropdownMenu open={isCategoriesOpen} onOpenChange={setIsCategoriesOpen}>
                  <div
                    onPointerEnter={() => {
                      cancelCategoriesClose();
                      setIsCategoriesOpen(true);
                    }}
                    onPointerLeave={scheduleCategoriesClose}
                  >
                    <DropdownMenuTrigger className="group/button flex items-center justify-center h-[38px] gap-1.5 px-4 rounded-full hover:bg-[#E3FCEF] hover:text-[#015347] hover:-translate-y-1.5 hover:scale-110 hover:shadow-[0_6px_20px_rgba(227,252,239,0.7)] transition-all duration-300 ease-out outline-none select-none active:scale-95 active:translate-y-0">
                      <LayoutGrid className="size-4 transition-transform duration-300 ease-out group-hover/button:scale-[1.15]" strokeWidth={2.2} /> Categories / Collections
                      <ChevronDown className={cn('size-3.5 transition-transform duration-300 ease-out', isCategoriesOpen && 'rotate-180')} />
                    </DropdownMenuTrigger>
                  </div>
                  <DropdownMenuContent
                    className="w-60 p-1 rounded-2xl"
                    align="start"
                    sideOffset={8}
                    onPointerEnter={cancelCategoriesClose}
                    onPointerLeave={scheduleCategoriesClose}
                  >
                    <DropdownMenuItem className="rounded-xl cursor-pointer hover:bg-muted" onClick={() => handleCategoryClick('new-arrivals')}>
                      <Sparkles className="text-accent-foreground" />
                      <span>New Arrivals</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl cursor-pointer hover:bg-muted" onClick={() => handleCategoryClick('special-offers')}>
                      <Tag className="text-accent-foreground" />
                      <span>Special Offers</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {categories.filter(c => c.id !== 'special-offers' && c.id !== 'new-arrivals').map((category) => (
                      <DropdownMenuItem
                        key={category.id}
                        className="rounded-xl cursor-pointer hover:bg-muted"
                        onClick={() => handleCategoryClick(category.id)}
                      >
                        <Tag className="text-muted-foreground" />
                        <span>{category.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Link href="/products" className="flex items-center justify-center h-[38px] gap-1.5 px-4 rounded-full hover:bg-[#E3FCEF] hover:text-[#015347] hover:-translate-y-1.5 hover:scale-110 hover:shadow-[0_6px_20px_rgba(227,252,239,0.7)] transition-all duration-300 ease-out group active:scale-95 active:translate-y-0">
                  <ShoppingBag className="size-4 transition-transform duration-300 ease-out group-hover:scale-110" strokeWidth={2.2} /> All Products
                </Link>
                {session ? (
                  <Link href="/orders" className="flex items-center justify-center h-[38px] gap-1.5 px-4 rounded-full hover:bg-[#E3FCEF] hover:text-[#015347] hover:-translate-y-1.5 hover:scale-110 hover:shadow-[0_6px_20px_rgba(227,252,239,0.7)] transition-all duration-300 ease-out group active:scale-95 active:translate-y-0">
                    <Package className="size-4 transition-transform duration-300 ease-out group-hover:scale-110" strokeWidth={2.2} /> My Orders
                  </Link>
                ) : (
                  <Link href="/track-order" className="flex items-center justify-center h-[38px] gap-1.5 px-4 rounded-full hover:bg-[#E3FCEF] hover:text-[#015347] hover:-translate-y-1.5 hover:scale-110 hover:shadow-[0_6px_20px_rgba(227,252,239,0.7)] transition-all duration-300 ease-out group active:scale-95 active:translate-y-0">
                    <MapPin className="size-4 transition-transform duration-300 ease-out group-hover:scale-110" strokeWidth={2.2} /> Track Order
                  </Link>
                )}
                <Link href="/wishlist" className="flex items-center justify-center h-[38px] gap-1.5 px-4 rounded-full hover:bg-[#E3FCEF] hover:text-[#015347] hover:-translate-y-1.5 hover:scale-110 hover:shadow-[0_6px_20px_rgba(227,252,239,0.7)] transition-all duration-300 ease-out group active:scale-95 active:translate-y-0">
                  <Heart className="size-4 transition-transform duration-300 ease-out group-hover:scale-110" strokeWidth={2.2} /> Wishlist
                </Link>
                <Link href="/products?price=under500" className="flex items-center justify-center h-[38px] gap-1.5 px-4 rounded-full hover:bg-[#E3FCEF] hover:text-[#015347] hover:-translate-y-1.5 hover:scale-110 hover:shadow-[0_6px_20px_rgba(227,252,239,0.7)] transition-all duration-300 ease-out group active:scale-95 active:translate-y-0">
                  <Tag className="size-4 transition-transform duration-300 ease-out group-hover:scale-110" strokeWidth={2.2} /> Rs 500 Store
                </Link>
                <Link href="/products?price=under1000" className="flex items-center justify-center h-[38px] gap-1.5 px-4 rounded-full hover:bg-[#E3FCEF] hover:text-[#015347] hover:-translate-y-1.5 hover:scale-110 hover:shadow-[0_6px_20px_rgba(227,252,239,0.7)] transition-all duration-300 ease-out group active:scale-95 active:translate-y-0">
                  <Tag className="size-4 transition-transform duration-300 ease-out group-hover:scale-110" strokeWidth={2.2} /> Rs 1000 Store
                </Link>
                <Link href="/contact" className="flex items-center justify-center h-[38px] gap-1.5 px-4 rounded-full hover:bg-[#E3FCEF] hover:text-[#015347] hover:-translate-y-1.5 hover:scale-110 hover:shadow-[0_6px_20px_rgba(227,252,239,0.7)] transition-all duration-300 ease-out group active:scale-95 active:translate-y-0">
                  <Phone className="size-4 transition-transform duration-300 ease-out group-hover:scale-110" strokeWidth={2.2} /> Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>

      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            className={cn(
              "w-[85vw] max-w-sm border-r border-sidebar-border bg-sidebar p-0 text-sidebar-foreground sm:w-[22rem] md:w-[min(76vw,22rem)] flex flex-col data-[state=closed]:duration-300 data-[state=open]:duration-300",
              showAnnouncementBar ? "pt-[96px]" : "pt-[64px]"
            )}
          >
            {isSidebarOpen && (
              <MobileMenuContent
                pathname={pathname}
                categories={categories}
                activeCategory={activeCategory}
                handleCategoryClick={handleCategoryClick}
                setIsSidebarOpen={setIsSidebarOpen}
                setIsAuthModalOpen={setIsAuthModalOpen}
                mobileMenuButtonClass={mobileMenuButtonClass}
              />
            )}
          </SheetContent>
        </Sheet>

      </div>

      <MobileBottomNav
        pathname={pathname}
        isSearchOpen={isSearchOpen}
        onSearchOpenChange={handleSearchOpenChange}
        accountOpen={isAccountDrawerOpen}
        onAccountOpenChange={handleAccountDrawerChange}
        isAuthOpen={isAuthModalOpen}
        onAuthOpenChange={setIsAuthModalOpen}
        onNavigate={handleMobileNavigate}
      />
      {isAuthModalOpen ? <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} /> : null}
    </>
  );
}

export default function Navbar({
  categories = [],
  storeName = 'China Unique Store',
  lightLogoUrl = '',
  darkLogoUrl = '',
  logoScalePercent = 100,
  announcementBarEnabled = true,
  announcementBarText = '',
  announcementBarMessages = [],
}) {
  return (
    <NavbarContent
      categories={categories}
      storeName={storeName}
      lightLogoUrl={lightLogoUrl}
      darkLogoUrl={darkLogoUrl}
      logoScalePercent={logoScalePercent}
      announcementBarEnabled={announcementBarEnabled}
      announcementBarText={announcementBarText}
      announcementBarMessages={announcementBarMessages}
    />
  );
}
