'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  ChartColumn,
  CirclePlus,
  ExternalLink,
  Images,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
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
import { Button, buttonVariants } from '@/components/ui/button';
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
  { href: '/admin/categories', label: 'Categories', icon: LayoutGrid, match: (pathname) => pathname.startsWith('/admin/categories') },
  { href: '/admin/reviews', label: 'Reviews', icon: MessageSquare, match: (pathname) => pathname.startsWith('/admin/reviews') },
];

const salesNavItems = [
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, match: (pathname) => pathname.startsWith('/admin/orders') },
];

const secondaryNavItems = [
  { href: '/admin/users', label: 'Users / Customers', icon: Users, match: (pathname) => pathname.startsWith('/admin/users') },
  { href: '/admin/shipping', label: 'Shipping', icon: Truck, match: (pathname) => pathname.startsWith('/admin/shipping') },
  { href: '/admin/home-page', label: 'Home Page', icon: LayoutGrid, match: (pathname) => pathname.startsWith('/admin/home-page') },
  { href: '/admin/cover-photos', label: 'Cover Photos', icon: Images, match: (pathname) => pathname.startsWith('/admin/cover-photos') },
  { href: '/admin/settings', label: 'Settings', icon: Settings, match: (pathname) => pathname.startsWith('/admin/settings') },
];

function getOpenSections(pathname) {
  return [
    productNavItems.some((item) => item.match(pathname)) ? 'products' : null,
    salesNavItems.some((item) => item.match(pathname)) ? 'sales' : null,
  ].filter(Boolean);
}

function getPageMeta(pathname) {
  if (pathname.startsWith('/admin/orders')) {
    return {
      eyebrow: 'Sales',
      title: 'Orders',
    };
  }

  if (pathname.startsWith('/admin/products')) {
    return {
      eyebrow: 'Catalog',
      title: 'Products',
    };
  }

  if (pathname.startsWith('/admin/settings')) {
    return {
      eyebrow: 'Store',
      title: 'Settings',
    };
  }

  if (pathname.startsWith('/admin/users')) {
    return {
      eyebrow: 'Customers',
      title: 'Users',
    };
  }

  return {
    eyebrow: 'Admin',
    title: 'Dashboard',
  };
}

export default function AdminLayoutShell({ children, sessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageMeta = getPageMeta(pathname);

  if (pathname === '/admin/login') return <>{children}</>;

  function renderPrimaryNavLink({ href, label, icon: Icon, match }) {
    const active = match(pathname);

    return (
      <Link
        key={href}
        href={href}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          'flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-[background-color,color,transform,box-shadow] duration-200 active:scale-[0.96]',
          active
            ? 'bg-white text-primary shadow-[0_12px_30px_-24px_rgba(0,0,0,0.45)]'
            : 'text-primary-foreground/76 hover:bg-white/8 hover:text-primary-foreground'
        )}
      >
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{label}</span>
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
          'group flex min-h-9 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-[background-color,color,transform] duration-200 active:scale-[0.98]',
          active
            ? 'bg-white/14 text-primary-foreground'
            : 'text-primary-foreground/66 hover:bg-white/7 hover:text-primary-foreground/88'
        )}
      >
        <Icon className="size-3.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-85" />
        <span className="truncate font-normal">{label}</span>
      </Link>
    );
  }

  function renderSectionTrigger({ icon: Icon, label, value }) {
    return (
      <AccordionTrigger
        className="rounded-xl bg-white/4 px-3 py-2.5 text-primary-foreground hover:bg-white/8 hover:no-underline"
      >
        <div className="flex items-center gap-3">
          <Icon className="size-4 shrink-0" />
          <span className="text-sm font-semibold">{label}</span>
        </div>
      </AccordionTrigger>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-6 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-primary)_92%,black),color-mix(in_oklab,var(--color-primary)_82%,black))] px-4 py-5 text-primary-foreground">
      <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4 shadow-[0_24px_60px_-42px_rgba(0,0,0,0.55)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            <Store className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold uppercase tracking-[0.16em]">China Unique</p>
            <p className="text-xs text-primary-foreground/70">Admin</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-black/12 px-3 py-2.5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/60">Workspace</p>
            <p className="text-sm font-medium text-primary-foreground">Operations</p>
          </div>
          <span className="rounded-full border border-white/14 bg-white/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/78">
            Live
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/50">Overview</p>
          <div className="flex flex-col gap-2">
            {primaryNavItems.map((item) => renderPrimaryNavLink(item))}
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/50">Commerce</p>
          <Accordion
            key={pathname}
            type="multiple"
            defaultValue={getOpenSections(pathname)}
            className="w-full gap-2"
          >
            <AccordionItem value="products" className="border-none">
              {renderSectionTrigger({ icon: Box, label: 'Products', value: 'products' })}
              <AccordionContent className="px-0 pt-2 pb-0 [&_a]:no-underline [&_a:hover]:no-underline">
                <div className="ml-6 flex flex-col gap-1">
                  {productNavItems.map((item) => renderNestedNavLink(item))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sales" className="border-none">
              {renderSectionTrigger({ icon: ShoppingCart, label: 'Sales', value: 'sales' })}
              <AccordionContent className="px-0 pt-2 pb-0 [&_a]:no-underline [&_a:hover]:no-underline">
                <div className="ml-6 flex flex-col gap-1">
                  {salesNavItems.map((item) => renderNestedNavLink(item))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="space-y-2">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/50">Operations</p>
          <div className="flex flex-col gap-2">
            {secondaryNavItems.map((item) => renderPrimaryNavLink(item))}
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-white/10 pt-6">
        <div className="flex items-center gap-3 rounded-[1.1rem] bg-white/10 px-3 py-3">
          <Avatar className="h-10 w-10 border border-white/20">
            <AvatarImage src={sessionUser?.image} alt={sessionUser?.name || 'Admin'} />
            <AvatarFallback className="bg-white/20 text-white">{(sessionUser?.name || 'A').charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-sm font-semibold">{sessionUser?.name || 'Admin'}</p>
            <p className="truncate text-xs text-primary-foreground/60">{sessionUser?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex min-h-11 items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-medium text-white transition-[background-color,transform] duration-200 hover:bg-white/16 active:scale-[0.98]"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-background)_72%,white),var(--color-background))]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-border bg-primary md:sticky md:top-0 md:block md:h-screen md:overflow-y-auto">
          {sidebar}
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/70 bg-[color:color-mix(in_oklab,var(--color-card)_92%,white)]/95 backdrop-blur">
            <div className="flex min-h-18 items-center justify-between gap-4 px-4 py-3 md:px-8">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
                  <Menu />
                </Button>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">{pageMeta.eyebrow}</p>
                  <p className="text-base font-semibold leading-tight text-foreground md:text-lg">{pageMeta.title}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <AdminNotificationCenter />

                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="inline-flex border border-border/60 bg-[color:color-mix(in_oklab,var(--color-card)_94%,white)] shadow-none hover:border-primary/25 hover:bg-primary hover:text-primary-foreground"
                  onClick={() => router.push('/')}
                >
                  <ExternalLink data-icon="inline-start" />
                  Back to Store
                </Button>

                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src={sessionUser?.image} alt={sessionUser?.name || 'Admin'} />
                          <AvatarFallback className="bg-primary/5 text-primary">{(sessionUser?.name || 'A').charAt(0)}</AvatarFallback>
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
                        <DropdownMenuItem
                          onClick={() => signOut({ callbackUrl: '/admin/login' })}
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Logout</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8">
            <div className="mx-auto w-full max-w-[1480px]">{children}</div>
          </main>
        </div>
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[min(92vw,20rem)] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Admin navigation</SheetTitle>
            <SheetDescription>Navigate between admin sections.</SheetDescription>
          </SheetHeader>
          {sidebar}
        </SheetContent>
      </Sheet>
    </div>
  );
}
