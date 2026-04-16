'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  ChartColumn,
  CirclePlus,
  ExternalLink,
  House,
  Images,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  PanelsTopLeft,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  Users,
} from 'lucide-react';

import AdminNotificationCenter from '@/components/AdminNotificationCenter';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const primaryNavItems = [
  { href: '/admin', label: 'Dashboard', icon: ChartColumn, match: (pathname) => pathname === '/admin' },
];

const productNavItems = [
  {
    href: '/admin/products',
    label: 'Product List',
    icon: Box,
    match: (pathname) => pathname.startsWith('/admin/products') && !pathname.startsWith('/admin/products/add'),
  },
  { href: '/admin/products/add', label: 'Add Product', icon: CirclePlus, match: (pathname) => pathname.startsWith('/admin/products/add') },
  { href: '/admin/vendors', label: 'Vendors', icon: Store, match: (pathname) => pathname.startsWith('/admin/vendors') },
  { href: '/admin/categories', label: 'Categories', icon: LayoutGrid, match: (pathname) => pathname.startsWith('/admin/categories') },
  { href: '/admin/reviews', label: 'Reviews', icon: MessageSquare, match: (pathname) => pathname.startsWith('/admin/reviews') },
];

const salesNavItems = [
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, match: (pathname) => pathname.startsWith('/admin/orders') },
];

const secondaryNavItems = [
  { href: '/admin/users', label: 'Users / Customers', icon: Users, match: (pathname) => pathname.startsWith('/admin/users') },
  { href: '/admin/shipping', label: 'Shipping', icon: Truck, match: (pathname) => pathname.startsWith('/admin/shipping') },
  { href: '/admin/home-page', label: 'Home Layout Settings', icon: LayoutGrid, match: (pathname) => pathname.startsWith('/admin/home-page') },
  { href: '/admin/cover-photos', label: 'Cover Photos', icon: Images, match: (pathname) => pathname.startsWith('/admin/cover-photos') },
  { href: '/admin/settings', label: 'Settings', icon: Settings, match: (pathname) => pathname.startsWith('/admin/settings') },
];

const compactDesktopNavItems = [
  ...primaryNavItems,
  {
    href: '/admin/products',
    label: 'Products',
    icon: Box,
    match: (pathname) =>
      pathname.startsWith('/admin/products') ||
      pathname.startsWith('/admin/vendors') ||
      pathname.startsWith('/admin/categories') ||
      pathname.startsWith('/admin/reviews'),
  },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, match: (pathname) => pathname.startsWith('/admin/orders') },
  { href: '/admin/users', label: 'Users', icon: Users, match: (pathname) => pathname.startsWith('/admin/users') },
  { href: '/admin/shipping', label: 'Shipping', icon: Truck, match: (pathname) => pathname.startsWith('/admin/shipping') },
  { href: '/admin/home-page', label: 'Home Layout', icon: LayoutGrid, match: (pathname) => pathname.startsWith('/admin/home-page') },
  { href: '/admin/settings', label: 'Settings', icon: Settings, match: (pathname) => pathname.startsWith('/admin/settings') },
];

const mobileBottomNavItems = [
  { href: '/admin', label: 'Dashboard', icon: ChartColumn, match: (pathname) => pathname === '/admin' },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, match: (pathname) => pathname.startsWith('/admin/orders') },
  { href: '/admin/products', label: 'Products', icon: Box, match: (pathname) => pathname.startsWith('/admin/products') },
  { href: '/admin/home-page', label: 'Layout', icon: LayoutGrid, match: (pathname) => pathname.startsWith('/admin/home-page') },
];

function getOpenSections(pathname) {
  return [
    productNavItems.some((item) => item.match(pathname)) ? 'products' : null,
    salesNavItems.some((item) => item.match(pathname)) ? 'sales' : null,
  ].filter(Boolean);
}

function getPageMeta(pathname) {
  if (pathname.startsWith('/admin/orders')) return { title: 'Orders' };
  if (pathname.startsWith('/admin/products')) return { title: 'Products' };
  if (pathname.startsWith('/admin/vendors')) return { title: 'Vendors' };
  if (pathname.startsWith('/admin/categories')) return { title: 'Categories' };
  if (pathname.startsWith('/admin/reviews')) return { title: 'Reviews' };
  if (pathname.startsWith('/admin/users')) return { title: 'Users' };
  if (pathname.startsWith('/admin/shipping')) return { title: 'Shipping' };
  if (pathname.startsWith('/admin/home-page')) return { title: 'Home Layout Settings' };
  if (pathname.startsWith('/admin/cover-photos')) return { title: 'Cover Photos' };
  if (pathname.startsWith('/admin/settings')) return { title: 'Settings' };

  return { title: 'Dashboard' };
}

export default function AdminLayoutShell({ children, sessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const pageMeta = getPageMeta(pathname);

  useEffect(() => {
    document.body.classList.add('admin-theme');
    return () => {
      document.body.classList.remove('admin-theme');
    };
  }, []);

  if (pathname === '/admin/login') return <>{children}</>;

  function toggleDesktopSidebar() {
    setDesktopSidebarCollapsed((current) => !current);
  }

  function renderPrimaryNavLink({ href, label, icon: Icon, match }, collapsed = false) {
    const active = match(pathname);

    return (
      <Link
        key={href}
        href={href}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          'admin-touch-target flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-[background-color,color,transform,border-color] duration-200 active:scale-[0.98]',
          active
            ? 'border border-border bg-white text-foreground shadow-sm'
            : 'border border-transparent text-foreground/66 hover:border-border hover:bg-muted/70 hover:text-foreground',
          collapsed && 'justify-center px-0'
        )}
        title={collapsed ? label : undefined}
      >
        <Icon className="size-4 shrink-0" />
        <span className={cn('truncate', collapsed && 'hidden')}>{label}</span>
      </Link>
    );
  }

  function renderNestedNavLink({ href, label, icon: Icon, match }) {
    const active = match(pathname);

    return (
      <Link
        key={href}
        href={href}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          'group flex min-h-10 items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 text-[12px] transition-[background-color,color,transform,border-color] duration-200 active:scale-[0.98]',
          active
            ? 'border-border bg-white text-foreground'
            : 'text-foreground/82 hover:border-border/80 hover:bg-muted/60 hover:text-foreground'
        )}
      >
        <Icon className="size-3.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-85" />
        <span className="truncate font-normal">{label}</span>
      </Link>
    );
  }

  function renderSectionTrigger({ icon: Icon, label, value }) {
    const active = value === 'products'
      ? productNavItems.some((item) => item.match(pathname))
      : salesNavItems.some((item) => item.match(pathname));

    return (
      <AccordionTrigger
        className={cn(
          'admin-touch-target min-h-11 rounded-xl border px-3 py-2.5 text-[13px] font-medium hover:no-underline',
          active
            ? 'border border-border bg-white text-foreground shadow-sm'
            : 'border border-transparent text-foreground/66 hover:border-border hover:bg-muted/70 hover:text-foreground'
        )}
      >
        <div className="flex items-center gap-2.5">
          <Icon className="size-4 shrink-0" />
          <span className="text-[13px] font-medium">{label}</span>
        </div>
      </AccordionTrigger>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-4 bg-white px-3 py-3 text-foreground md:px-3.5 md:py-4">
      <div className={cn('flex items-center gap-2.5 px-1 py-1', desktopSidebarCollapsed && 'justify-center')}>
        <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/45">
          <PanelsTopLeft className="size-4 text-foreground" />
        </div>
        <div className={cn('min-w-0', desktopSidebarCollapsed && 'hidden')}>
          <p className="truncate text-sm font-bold tracking-[0.08em] text-foreground md:text-base">China Unique</p>
          <p className="truncate text-[11px] text-muted-foreground">Admin</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {desktopSidebarCollapsed ? (
          compactDesktopNavItems.map((item) => renderPrimaryNavLink(item, true))
        ) : (
          <>
            {primaryNavItems.map((item) => renderPrimaryNavLink(item))}

            <Accordion
              key={pathname}
              multiple
              defaultValue={getOpenSections(pathname)}
              className="flex w-full flex-col gap-1.5"
            >
              <AccordionItem value="products" className="border-none">
                {renderSectionTrigger({ icon: Box, label: 'Products', value: 'products' })}
                <AccordionContent className="px-0 pb-0 pt-2 [&_a]:no-underline [&_a:hover]:no-underline">
                  <div className="ml-5 flex flex-col gap-1">
                    {productNavItems.map((item) => renderNestedNavLink(item))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="sales" className="border-none">
                {renderSectionTrigger({ icon: ShoppingCart, label: 'Sales', value: 'sales' })}
                <AccordionContent className="px-0 pb-0 pt-2 [&_a]:no-underline [&_a:hover]:no-underline">
                  <div className="ml-5 flex flex-col gap-1">
                    {salesNavItems.map((item) => renderNestedNavLink(item))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {secondaryNavItems.map((item) => renderPrimaryNavLink(item))}
          </>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
        <Link
          href="/"
          onClick={() => setSidebarOpen(false)}
          className={cn(
            'admin-touch-target flex min-h-11 items-center gap-2.5 rounded-xl border border-border bg-white px-3 py-2.5 text-[13px] font-medium text-foreground transition-[background-color,transform,border-color] duration-200 hover:bg-muted/70 active:scale-[0.98]',
            desktopSidebarCollapsed && 'justify-center px-0'
          )}
          title="Back to Store"
        >
          <House className="size-4" />
          <span className={cn(desktopSidebarCollapsed && 'hidden')}>Back to Store</span>
        </Link>

        <div className={cn('flex items-center gap-3 rounded-[1rem] border border-border bg-white px-3 py-3', desktopSidebarCollapsed && 'justify-center px-2')}>
          <Avatar className="size-9 border border-border">
            <AvatarImage src={sessionUser?.image} alt={sessionUser?.name || 'Admin'} />
            <AvatarFallback className="bg-muted text-foreground">{(sessionUser?.name || 'A').charAt(0)}</AvatarFallback>
          </Avatar>
          <div className={cn('flex min-w-0 flex-col', desktopSidebarCollapsed && 'hidden')}>
            <p className="truncate text-[13px] font-semibold">{sessionUser?.name || 'Admin'}</p>
            <p className="truncate text-[11px] text-muted-foreground">{sessionUser?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className={cn(
            'admin-touch-target flex min-h-11 items-center gap-2.5 rounded-xl border border-border bg-white px-3 py-2.5 text-[13px] font-medium text-foreground transition-[background-color,transform,border-color] duration-200 hover:bg-muted/70 active:scale-[0.98]',
            desktopSidebarCollapsed && 'justify-center px-0'
          )}
          title="Logout"
        >
          <LogOut className="size-4" />
          <span className={cn(desktopSidebarCollapsed && 'hidden')}>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-theme min-h-screen">
      <div className="admin-shell-grid">
        <aside
          className="admin-shell-sidebar hidden shrink-0 md:block"
          data-collapsed={desktopSidebarCollapsed ? 'true' : 'false'}
        >
          {sidebar}
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/80 bg-[color:color-mix(in_oklab,var(--color-card)_94%,white)]/95 backdrop-blur">
            <div className="flex min-h-16 items-center justify-between gap-3 px-3 py-3 sm:px-4 md:min-h-18 md:px-6 xl:px-8">
              <div className="flex items-center gap-2.5 md:gap-3">
                <Button variant="ghost" size="icon" className="admin-touch-target md:hidden" onClick={() => setSidebarOpen(true)}>
                  <Menu />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="admin-touch-target hidden md:inline-flex"
                  onClick={toggleDesktopSidebar}
                  title={desktopSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {desktopSidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                </Button>
                <div>
                  <p className="text-sm font-semibold leading-tight text-foreground md:text-lg">{pageMeta.title}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <AdminNotificationCenter />

                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="hidden border border-border/70 bg-[color:color-mix(in_oklab,var(--color-card)_96%,white)] px-3 text-foreground shadow-none hover:border-foreground/16 hover:bg-foreground hover:text-background lg:inline-flex"
                  onClick={() => router.push('/')}
                >
                  <ExternalLink data-icon="inline-start" />
                  <span className="hidden lg:inline">Store</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="admin-touch-target relative size-11 rounded-full p-0">
                      <Avatar className="size-10 border border-border">
                        <AvatarImage src={sessionUser?.image} alt={sessionUser?.name || 'Admin'} />
                        <AvatarFallback className="bg-muted text-foreground">{(sessionUser?.name || 'A').charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium leading-none">{sessionUser?.name || 'Admin'}</p>
                          <p className="text-xs leading-none text-muted-foreground">{sessionUser?.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/')}>
                        <House className="mr-2 size-4" />
                        <span>Back to Store</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => signOut({ callbackUrl: '/admin/login' })}
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <LogOut className="mr-2 size-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 px-2 py-2 pb-22 sm:px-3 md:px-6 md:py-6 md:pb-6 xl:px-8">
            <div className="w-full">{children}</div>
          </main>
        </div>
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[min(88vw,18rem)] bg-white p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Admin navigation</SheetTitle>
            <SheetDescription>Navigate between admin sections.</SheetDescription>
          </SheetHeader>
          {sidebar}
        </SheetContent>
      </Sheet>

      <nav className="admin-mobile-nav fixed inset-x-0 bottom-0 z-40 md:hidden">
        <div className="admin-mobile-nav__shell mx-auto grid max-w-xl grid-cols-4 items-center gap-1 border-t border-border/70 px-1 pb-[calc(env(safe-area-inset-bottom)+0.7rem)] pt-2.5">
          {mobileBottomNavItems.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'admin-touch-target flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[0.72rem] font-semibold tracking-[0.01em] transition-[color,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96]',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground active:text-primary'
                )}
              >
                <span className={cn('flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]', active && 'scale-[1.08]')}>
                  <Icon className="size-[1.15rem]" strokeWidth={2.8} />
                </span>
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
