'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
  LayoutGrid,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  X,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
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
import { cn } from '@/lib/utils';

const MyOrdersButton = dynamic(() => import('@/components/MyOrdersButton'), {
  ssr: false,
  loading: () => <Skeleton className="min-h-10 w-10 md:w-[6.5rem] rounded-xl" aria-hidden="true" />,
});

const MyWishlistButton = dynamic(() => import('@/components/MyWishlistButton'), {
  ssr: false,
  loading: () => <Skeleton className="min-h-10 w-10 md:w-[6.5rem] rounded-xl" aria-hidden="true" />,
});

const AuthModal = dynamic(() => import('@/components/AuthModal'), {
  ssr: false,
  loading: () => null,
});

const NavbarSearchPanel = dynamic(() => import('@/components/NavbarSearchPanel'), {
  loading: () => <Skeleton className="min-h-12 w-full rounded-xl" aria-hidden="true" />,
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

  const marqueeItems = Array.from({ length: 6 }, (_, repeatIndex) =>
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
  const { activeCategory = 'all', isSidebarOpen = false } = useCartUi() || {};
  const {
    setActiveCategory = () => {},
    setIsSidebarOpen = () => {},
    openSidebar = () => {},
    openCart = () => {},
  } = useCartActions() || {};

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [isNavbarHidden, setIsNavbarHidden] = useState(false);
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

  function revealNavbar() {
    if (isNavbarHiddenRef.current) {
      isNavbarHiddenRef.current = false;
      setIsNavbarHidden(false);
    }

    scrollAnchorYRef.current = window.scrollY;
  }

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
      } else if (!(isSearchOpen || isSidebarOpen || isAccountDrawerOpen)) {
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
    'nav-icon-button relative rounded-2xl border border-border/60 bg-card/85 p-0 text-foreground transition-[transform,background-color,border-color,color] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:border-primary/18 hover:bg-background hover:text-foreground active:scale-[0.96]';
  const announcementItems = normalizeAnnouncementItems(announcementBarMessages, announcementBarText);
  const showAnnouncementBar = announcementBarEnabled && announcementItems.length > 0;

  return (
    <div className="navbar-shell sticky top-0 z-40 overflow-visible bg-card shadow-[0_1px_0_color-mix(in_oklab,var(--color-border)_72%,white)]">
      {showAnnouncementBar ? (
        <div className="relative flex min-h-9 items-center bg-primary py-2 text-primary-foreground shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)] before:absolute before:-top-px before:left-0 before:right-0 before:h-px before:bg-primary before:content-['']">
          <AnnouncementMarquee items={announcementItems} />
        </div>
      ) : null}

      <div
        className={cn(
          'relative transition-[height] duration-300 ease-[cubic-bezier(0.2,0,0,1)]',
          isSearchOpen ? 'overflow-visible' : 'overflow-hidden',
          isNavbarHidden ? 'h-0' : 'h-16'
        )}
      >
        <div
          className={cn(
            'relative h-16 transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] will-change-transform',
            isNavbarHidden ? '-translate-y-full' : 'translate-y-0'
          )}
        >
          <header className="relative z-20 mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
            <Button variant="ghost" size="icon" onClick={handleSidebarOpen} aria-label="Open menu" className="md:hidden">
              <Menu />
            </Button>

            <StoreLogo
              storeName={storeName}
              lightLogoUrl={lightLogoUrl}
              darkLogoUrl={darkLogoUrl}
              logoScalePercent={logoScalePercent}
              variant="light-surface"
              priority
              onClick={(event) => {
                event.preventDefault();
                handleDesktopNavigate('/');
              }}
              className="absolute left-1/2 -translate-x-1/2 md:static md:left-auto md:translate-x-0"
            />

            <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
              <Link
                href="/"
                className={navLinkClass('/')}
                onClick={(event) => {
                  event.preventDefault();
                  handleDesktopNavigate('/');
                }}
              >
                Home
              </Link>
              <Link
                href="/products"
                scroll={true}
                className={navLinkClass('/products')}
                onClick={(event) => {
                  event.preventDefault();
                  handleDesktopNavigate('/products');
                }}
              >
                All Products
              </Link>
              <DropdownMenu open={isCategoriesOpen} onOpenChange={setIsCategoriesOpen}>
                <div
                  onPointerEnter={() => {
                    cancelCategoriesClose();
                    setIsCategoriesOpen(true);
                  }}
                  onPointerLeave={scheduleCategoriesClose}
                >
                  <DropdownMenuTrigger className="group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground">

                      Categories
                      <ChevronDown className={cn('size-4 transition-transform', isCategoriesOpen && 'rotate-180')} />
                    
</DropdownMenuTrigger>
                </div>
                <DropdownMenuContent
                  className="w-60 p-1"
                  align="start"
                  sideOffset={8}
                  onPointerEnter={cancelCategoriesClose}
                  onPointerLeave={scheduleCategoriesClose}
                >
                  <DropdownMenuItem onClick={() => handleCategoryClick('new-arrivals')}>
                    <Sparkles className="text-accent-foreground" />
                    <span>New Arrivals</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryClick('special-offers')}>
                    <Tag className="text-accent-foreground" />
                    <span>Special Offers</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {categories.filter(c => c.id !== 'special-offers' && c.id !== 'new-arrivals').map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                    >
                      <Tag className="text-muted-foreground" />
                      <span>{category.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            <div className="ml-auto flex items-center gap-2 self-center">
              <Button
                variant="ghost"
                size="icon-lg"
                onClick={handleSearchToggle}
                aria-label="Toggle search"
                aria-expanded={isSearchOpen}
                className={cn(
                  `nav-search-toggle hidden overflow-hidden md:inline-flex ${navActionButtonClass}`,
                  isSearchOpen
                    ? 'is-open border-primary/18 bg-background text-primary'
                    : ''
                )}
              >
                <span className="relative flex size-5 items-center justify-center">
                  <Search className={cn('navbar-toggle-icon navbar-toggle-icon-search', isSearchOpen && 'is-hidden')} />
                  <X className={cn('navbar-toggle-icon navbar-toggle-icon-close', isSearchOpen && 'is-visible')} />
                </span>
              </Button>
              <MyOrdersButton
                iconOnly
                className={`hidden md:inline-flex ${navActionButtonClass}`}
              />
              <MyWishlistButton
                iconOnly
                className={`hidden md:inline-flex ${navActionButtonClass}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                onClick={openCart}
                className={`nav-cart-button overflow-visible ${navActionButtonClass}`}
                aria-label="Open cart"
              >
                <span className="relative flex size-5 items-center justify-center">
                  <ShoppingBag className="size-[1.05rem]" />
                </span>
                {isCartInitialized ? (
                  cartCount > 0 ? (
                    <span className="absolute -right-2 -top-2 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold leading-none text-primary-foreground">
                      {cartCount}
                    </span>
                  ) : null
                ) : (
                  <span className="absolute -right-2 -top-2 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold leading-none text-primary-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary-foreground/70" />
                  </span>
                )}
              </Button>

              <NavbarDesktopAccountControl navActionButtonClass={navActionButtonClass} />
            </div>
          </header>

          <div
            data-state={isSearchOpen ? 'open' : 'closed'}
            aria-hidden={!isSearchOpen}
            className={cn(
              'navbar-search-shell absolute inset-x-0 top-full z-10 grid border-t bg-background/96 backdrop-blur transition-[grid-template-rows,opacity,border-color] duration-300 ease-[cubic-bezier(0.2,0,0,1)] md:bg-background/80',
              isSearchOpen
                ? 'md:relative md:inset-auto md:top-auto md:z-auto'
                : 'md:absolute md:inset-x-0 md:top-full md:z-10',
              isSearchOpen ? 'grid-rows-[1fr] overflow-visible border-border/70 opacity-100' : 'pointer-events-none grid-rows-[0fr] overflow-hidden border-transparent opacity-0'
            )}
          >
            <div className="overflow-visible">
              <div className="navbar-search-inner mx-auto max-w-4xl px-4 py-4">
                {isSearchOpen ? (
                  <NavbarSearchPanel open={isSearchOpen} onOpenChange={handleSearchOpenChange} />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isSidebarOpen ? (
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="w-screen min-w-0 max-w-none overflow-hidden border-r border-sidebar-border bg-sidebar p-0 text-sidebar-foreground sm:max-w-none md:w-[min(76vw,22rem)] md:min-w-[16rem] md:max-w-[22rem]"
          >
            <Sidebar className="h-full bg-transparent text-inherit">
              <SidebarHeader className="border-b border-sidebar-border px-5 pb-4 pt-5">
                <StoreLogo
                  href="/"
                  storeName={storeName}
                  lightLogoUrl={lightLogoUrl}
                  darkLogoUrl={darkLogoUrl}
                  logoScalePercent={logoScalePercent}
                  variant="light-surface"
                  compact
                  onClick={() => setIsSidebarOpen(false)}
                  className="max-w-full pl-3"
                />
              </SidebarHeader>

              <SidebarContent>
                <ScrollArea className="min-h-0 flex-1 px-3 py-3">
                  <div className="flex min-h-full flex-col gap-3">
                    <SidebarGroup className="gap-2 p-0">
                      <SidebarGroupLabel>Main</SidebarGroupLabel>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {mobileItems.map(({ href, label, icon: Icon }) => (
                            <SidebarMenuItem key={href}>
                              <SidebarMenuButton
                                isActive={pathname === href}
                                className={mobileMenuButtonClass}
                                render={<Link href={href} onClick={() => setIsSidebarOpen(false)} />}
                              >
                                <Icon />
                                <span>{label}</span>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>

                    <SidebarGroup className="gap-2 p-0">
                      <SidebarGroupLabel>Categories</SidebarGroupLabel>
                      <SidebarGroupContent>
                    <Accordion className="w-full">
                          <AccordionItem value="categories" className="border-none">
                            <AccordionTrigger className="rounded-xl px-2.5 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/45 hover:text-sidebar-accent-foreground hover:no-underline [&[aria-expanded=true]]:bg-sidebar-accent/35">
                              <div className="flex items-center gap-3">
                                <LayoutGrid className="size-4" />
                                <span>Shop by Category</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-0 pt-2 pb-0">
                              <SidebarMenu>
                                <SidebarMenuItem>
                                  <SidebarMenuButton
                                    isActive={activeCategory === 'new-arrivals'}
                                    onClick={() => handleCategoryClick('new-arrivals')}
                                    className={mobileMenuButtonClass}
                                  >
                                    <Sparkles />
                                    <span>New Arrivals</span>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                  <SidebarMenuButton
                                    isActive={activeCategory === 'special-offers'}
                                    onClick={() => handleCategoryClick('special-offers')}
                                    className={mobileMenuButtonClass}
                                  >
                                    <Tag />
                                    <span>Special Offers</span>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                                {categories.filter(c => c.id !== 'special-offers' && c.id !== 'new-arrivals').map((category) => (
                                  <SidebarMenuItem key={category.id}>
                                    <SidebarMenuButton
                                      isActive={activeCategory === category.id}
                                      onClick={() => handleCategoryClick(category.id)}
                                      className={mobileMenuButtonClass}
                                    >
                                      <Tag />
                                      <span>{category.label}</span>
                                    </SidebarMenuButton>
                                  </SidebarMenuItem>
                                ))}
                              </SidebarMenu>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </SidebarGroupContent>
                    </SidebarGroup>

                    <SidebarSeparator />

                    <SidebarGroup className="gap-2 p-0">
                      <SidebarGroupLabel>Account</SidebarGroupLabel>
                      <SidebarGroupContent className="flex flex-col gap-1">
                        <MyOrdersButton
                          isMobile
                          className={mobileMenuButtonClass}
                        />
                        <MyWishlistButton
                          isMobile
                          className={mobileMenuButtonClass}
                        />
                      </SidebarGroupContent>
                    </SidebarGroup>
                  </div>
                </ScrollArea>
              </SidebarContent>

              <SidebarFooter className="border-t border-sidebar-border px-3 pb-3 pt-3">
                <NavbarSidebarFooter
                  mobileMenuButtonClass={mobileMenuButtonClass}
                  onCloseSidebar={() => setIsSidebarOpen(false)}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                />
              </SidebarFooter>
            </Sidebar>
          </SheetContent>
        </Sheet>
      ) : null}

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
    </div>
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
