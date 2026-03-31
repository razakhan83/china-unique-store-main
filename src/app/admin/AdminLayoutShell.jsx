'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import NextTopLoader from 'nextjs-toploader';
import {
  Box,
  ChartColumn,
  Images,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  Users,
  MessageSquare,
  X,
} from 'lucide-react';

import AdminNotificationCenter from '@/components/AdminNotificationCenter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: ChartColumn, match: (pathname) => pathname === '/admin' },
  { href: '/admin/products', label: 'Products', icon: Box, match: (pathname) => pathname.startsWith('/admin/products') },
  { href: '/admin/categories', label: 'Categories', icon: LayoutGrid, match: (pathname) => pathname.startsWith('/admin/categories') },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, match: (pathname) => pathname.startsWith('/admin/orders') },
  { href: '/admin/shipping', label: 'Shipping', icon: Truck, match: (pathname) => pathname.startsWith('/admin/shipping') },
  { href: '/admin/cover-photos', label: 'Cover Photos', icon: Images, match: (pathname) => pathname.startsWith('/admin/cover-photos') },
  { href: '/admin/settings', label: 'Settings', icon: Settings, match: (pathname) => pathname.startsWith('/admin/settings') },
  { href: '/admin/users', label: 'Users', icon: Users, match: (pathname) => pathname.startsWith('/admin/users') },
  { href: '/admin/reviews', label: 'Reviews', icon: MessageSquare, match: (pathname) => pathname.startsWith('/admin/reviews') },
];

export default function AdminLayoutShell({ children, sessionUser }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === '/admin/login') return <>{children}</>;

  const sidebar = (
    <div className="flex h-full flex-col gap-6 bg-primary px-4 py-5 text-primary-foreground">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <div className="flex size-11 items-center justify-center rounded-xl bg-white/10">
          <Store className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em]">China Unique</p>
          <p className="text-xs text-primary-foreground/70">Admin workspace</p>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                active ? 'bg-white text-primary' : 'text-primary-foreground/72 hover:bg-white/10 hover:text-primary-foreground'
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Admin Mobile/Desktop Sidebar User Info */}
      <div className="mt-auto flex flex-col gap-2 pt-6 border-t border-white/10">
        <div className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3">
          <Avatar className="h-10 w-10 border border-white/20">
            <AvatarImage src={sessionUser?.image} alt={sessionUser?.name || 'Admin'} />
            <AvatarFallback className="bg-white/20 text-white">{(sessionUser?.name || 'A').charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <p className="truncate text-sm font-semibold">{sessionUser?.name || 'Admin'}</p>
            <p className="truncate text-xs text-primary-foreground/60">{sessionUser?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors bg-white/10 text-white hover:bg-white/20"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <NextTopLoader
        color="var(--color-primary)"
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl
        showSpinner={false}
        easing="ease"
        speed={200}
      />

      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-border bg-primary md:block">{sidebar}</aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 md:px-8">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
                  <Menu />
                </Button>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Dashboard</p>
                  <p className="text-xs text-muted-foreground">Welcome back, {sessionUser?.name || 'Admin'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AdminNotificationCenter />
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
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{sessionUser?.name || 'Admin'}</p>
                          <p className="text-xs leading-none text-muted-foreground">{sessionUser?.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/admin/login' })} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
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

          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
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
