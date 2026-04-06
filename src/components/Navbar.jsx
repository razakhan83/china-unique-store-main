'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Heart,
  Settings,
  User,
  X,
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

import SearchField from '@/components/SearchField';
import { useCartActions, useCartItems, useCartUi } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import MyOrdersButton from '@/components/MyOrdersButton';
import MyWishlistButton from '@/components/MyWishlistButton';
import AuthModal from '@/components/AuthModal';
import { trackSearchEvent } from '@/lib/clientTracking';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  announcementBarEnabled = true,
  announcementBarText = '',
  announcementBarMessages = [],
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { cartCount = 0 } = useCartItems() || {};
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
  const [isFocused, setIsFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const closeCategoriesTimeoutRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    return () => {
      if (closeCategoriesTimeoutRef.current) {
        window.clearTimeout(closeCategoriesTimeoutRef.current);
      }
    };
  }, []);

  const suggestions = useMemo(() => [], []);

  function handleCategoryClick(categoryId) {
    setActiveCategory(categoryId);
    setIsSidebarOpen(false);
    setIsCategoriesOpen(false);
    const url = categoryId === 'all' ? '/products' : `/products?category=${categoryId}`;
    router.push(url, { scroll: true });
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    if (!searchTerm.trim()) return;
    trackSearchEvent({ searchString: searchTerm.trim() });
    setIsSearchOpen(false);
    setIsFocused(false);
    router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`, { scroll: true });
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
  const navActionButtonClass =
    'nav-icon-button relative rounded-2xl border border-border/60 bg-card/85 p-0 text-foreground transition-[transform,background-color,border-color,color] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:border-primary/18 hover:bg-background hover:text-foreground active:scale-[0.96]';
  const announcementItems = normalizeAnnouncementItems(announcementBarMessages, announcementBarText);
  const showAnnouncementBar = announcementBarEnabled && announcementItems.length > 0;

  return (
    <div className="navbar-shell sticky top-0 z-40 overflow-hidden bg-card shadow-[0_1px_0_color-mix(in_oklab,var(--color-border)_72%,white)]">
      {showAnnouncementBar ? (
        <div className="relative flex min-h-9 items-center bg-primary py-2 text-primary-foreground shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)] before:absolute before:-top-px before:left-0 before:right-0 before:h-px before:bg-primary before:content-['']">
          <AnnouncementMarquee items={announcementItems} />
        </div>
      ) : null}

      <header className="relative z-20 mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Button variant="ghost" size="icon" onClick={openSidebar} aria-label="Open menu" className="md:hidden">
          <Menu />
        </Button>

        <StoreLogo
          storeName={storeName}
          lightLogoUrl={lightLogoUrl}
          darkLogoUrl={darkLogoUrl}
          variant="light-surface"
          priority
          className="absolute left-1/2 -translate-x-1/2 md:static md:left-auto md:translate-x-0"
        />

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          <Link href="/" className={navLinkClass('/')}>Home</Link>
          <Link href="/products" scroll={true} className={navLinkClass('/products')}>All Products</Link>
          <DropdownMenu open={isCategoriesOpen} onOpenChange={setIsCategoriesOpen}>
            <div
              onPointerEnter={() => {
                cancelCategoriesClose();
                setIsCategoriesOpen(true);
              }}
              onPointerLeave={scheduleCategoriesClose}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    desktopNavButtonClass(isCategoriesOpen),
                    'gap-2'
                  )}
                >
                  Categories
                  <ChevronDown className={cn('size-4 transition-transform', isCategoriesOpen && 'rotate-180')} />
                </Button>
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
            onClick={() => setIsSearchOpen((value) => !value)}
            aria-label="Toggle search"
            aria-expanded={isSearchOpen}
            className={cn(
              `nav-search-toggle overflow-hidden ${navActionButtonClass}`,
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
            {cartCount > 0 ? (
              <span className="absolute -right-2 -top-2 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold leading-none text-primary-foreground">
                {cartCount}
              </span>
            ) : null}
          </Button>

          {session ? (
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    className={`nav-profile-button flex items-center justify-center overflow-hidden ${navActionButtonClass}`}
                  >
                    <Avatar className="size-9">
                      <AvatarImage src={session.user?.image} alt={session.user?.name || 'User'} />
                      <AvatarFallback>{(session.user?.name || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{session.user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/orders')}>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/wishlist')}>
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Wishlist</span>
                    </DropdownMenuItem>
                    {session.user?.isAdmin ? (
                      <DropdownMenuItem onClick={() => router.push('/admin')}>
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Account Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden md:block">
              <Button
                variant="ghost"
                size="icon-lg"
                onClick={() => setIsAuthModalOpen(true)}
                className={`nav-profile-button overflow-hidden ${navActionButtonClass}`}
              >
                <span className="relative flex size-5 items-center justify-center">
                  <User className="size-5" />
                </span>
              </Button>
            </div>
          )}
          
          <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
        </div>
      </header>

      <div
        data-state={isSearchOpen ? 'open' : 'closed'}
        aria-hidden={!isSearchOpen}
        className={cn(
          'navbar-search-shell relative z-10 grid overflow-hidden border-t bg-background/80 backdrop-blur transition-[grid-template-rows,opacity,border-color] duration-300 ease-[cubic-bezier(0.2,0,0,1)]',
          isSearchOpen ? 'grid-rows-[1fr] border-border/70 opacity-100' : 'pointer-events-none grid-rows-[0fr] border-transparent opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="navbar-search-inner mx-auto max-w-4xl px-4 py-4">
            <SearchField
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onSubmit={handleSearchSubmit}
              onClear={() => {
                setSearchTerm('');
                setIsFocused(false);
              }}
              onFocus={() => setIsFocused(true)}
              isFocused={isFocused}
              suggestions={suggestions}
              showSuggestions={false}
              emptyLabel={`No products found for "${debouncedSearch}"`}
            />
          </div>
        </div>
      </div>

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
                variant="light-surface"
                compact
                onClick={() => setIsSidebarOpen(false)}
                className="max-w-full"
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
                          <AccordionTrigger className="rounded-xl bg-sidebar-accent/70 px-3.5 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:no-underline [&[data-state=open]]:bg-sidebar-accent">
                            <div className="flex items-center gap-3">
                              <LayoutGrid className="size-4" />
                              <span>Shop by Category</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-0 pt-1.5 pb-0">
                            <SidebarMenu>
                              <SidebarMenuItem>
                                <SidebarMenuButton
                                  isActive={activeCategory === 'new-arrivals'}
                                  onClick={() => handleCategoryClick('new-arrivals')}
                                >
                                  <Sparkles />
                                  <span>New Arrivals</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                              <SidebarMenuItem>
                                <SidebarMenuButton
                                  isActive={activeCategory === 'special-offers'}
                                  onClick={() => handleCategoryClick('special-offers')}
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
                    <SidebarGroupContent className="space-y-1.5">
                      <MyOrdersButton
                        isMobile
                        className="min-h-10 rounded-xl bg-sidebar-accent/70 px-3.5 py-2.5 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      />
                      <MyWishlistButton
                        isMobile
                        className="min-h-10 rounded-xl bg-sidebar-accent/70 px-3.5 py-2.5 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      />
                    </SidebarGroupContent>
                  </SidebarGroup>
                </div>
              </ScrollArea>
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border px-3 pb-3 pt-3">
              {session ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 rounded-2xl bg-sidebar-accent/55 px-3.5 py-3">
                    <Avatar className="size-9">
                      <AvatarImage src={session.user?.image} alt={session.user?.name || 'User'} />
                      <AvatarFallback>{(session.user?.name || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <p className="truncate text-sm font-semibold text-sidebar-foreground">{session.user?.name}</p>
                      <p className="truncate text-xs text-sidebar-foreground/65">{session.user?.email}</p>
                    </div>
                  </div>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => {
                          setIsSidebarOpen(false);
                          router.push('/settings');
                        }}
                      >
                        <Settings />
                        <span>Account Settings</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {session.user?.isAdmin ? (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => {
                            setIsSidebarOpen(false);
                            router.push('/admin');
                          }}
                        >
                          <LayoutGrid />
                          <span>Admin Panel</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ) : null}
                    <SidebarMenuItem>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          setIsSidebarOpen(false);
                          signOut();
                        }}
                        className="min-h-10 w-full justify-start rounded-xl px-3.5 py-2.5 text-sm font-medium active:scale-[0.96]"
                      >
                        <LogOut />
                        Logout
                      </Button>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </div>
              ) : (
                <GoogleSignInButton className="min-h-10 rounded-xl py-2.5 shadow-none" />
              )}
            </SidebarFooter>
          </Sidebar>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function Navbar({
  categories = [],
  storeName = 'China Unique Store',
  lightLogoUrl = '',
  darkLogoUrl = '',
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
      announcementBarEnabled={announcementBarEnabled}
      announcementBarText={announcementBarText}
      announcementBarMessages={announcementBarMessages}
    />
  );
}
