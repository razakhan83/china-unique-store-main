'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Heart, Home, LogOut, Search, Settings, ShoppingBag, User, UserPlus, X } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

function MobileNavButton({
  active = false,
  icon: Icon,
  label,
  onClick,
  href,
  iconSwap,
}) {
  const content = (
    <>
      <span
        className={cn(
          'flex items-center justify-center text-[color:inherit] transition-[color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-active:-translate-y-0.5 motion-safe:group-active:scale-[0.88]'
        )}
      >
        {iconSwap ? iconSwap : <Icon className="size-[1.2rem]" strokeWidth={3} />}
      </span>
      <span
        className={cn(
          'text-[0.76rem] font-semibold tracking-[0.01em] transition-colors duration-200'
        )}
      >
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group flex min-w-0 flex-1 flex-col items-center gap-1 text-muted-foreground transition-colors duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:text-foreground active:text-primary',
          active && 'text-primary'
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'group flex min-w-0 flex-1 flex-col items-center gap-1 text-muted-foreground transition-colors duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:text-foreground active:text-primary',
        active && 'text-primary'
      )}
    >
      {content}
    </button>
  );
}

function AccountMenuButton({ icon: Icon, label, onClick, destructive = false }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        'h-auto w-full justify-start rounded-2xl px-4 py-3 text-left',
        destructive
          ? 'text-destructive hover:bg-destructive/8 hover:text-destructive'
          : 'text-foreground hover:bg-muted/70'
      )}
    >
      <Icon data-icon="inline-start" />
      {label}
    </Button>
  );
}

export default function MobileBottomNav({
  pathname,
  isSearchOpen,
  onSearchToggle,
  onWishlistClick,
  onAccountOpenChange,
  accountOpen,
  onAuthOpen,
  onNavigate,
}) {
  const { data: session } = useSession();

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden">
        <div className="pointer-events-auto mx-auto w-full max-w-xl pb-[env(safe-area-inset-bottom)]">
          <nav
            aria-label="Mobile navigation"
            className="grid grid-cols-4 items-center gap-1 border-t border-border/70 bg-background px-1 py-2.5 shadow-[0_-8px_22px_rgba(15,23,42,0.06)]"
          >
            <MobileNavButton icon={Home} label="Home" href="/" active={pathname === '/'} />
            <MobileNavButton
              icon={Search}
              label="Search"
              onClick={onSearchToggle}
              active={isSearchOpen}
              iconSwap={isSearchOpen ? <X className="size-[1.2rem]" strokeWidth={3} /> : undefined}
            />
            <MobileNavButton
              icon={Heart}
              label="Wishlist"
              onClick={onWishlistClick}
              active={pathname.startsWith('/wishlist')}
            />
            <MobileNavButton
              icon={User}
              label="Account"
              onClick={() => onAccountOpenChange(true)}
              active={accountOpen || pathname.startsWith('/settings') || pathname.startsWith('/orders')}
            />
          </nav>
        </div>
      </div>

      <Drawer open={accountOpen} onOpenChange={onAccountOpenChange} shouldScaleBackground={false}>
        <DrawerContent className="md:hidden">
          <DrawerHeader className="px-5 pb-3 pt-5 text-left">
            <DrawerTitle>{session ? 'Your account' : 'Join China Unique'}</DrawerTitle>
            <DrawerDescription>
              {session
                ? 'Quick access to your orders, wishlist, and profile settings.'
                : 'Create an account to save favorites, track orders, and check out faster.'}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col gap-4 px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-1">
            {session ? (
              <>
                <div className="flex items-center gap-3 rounded-[1.4rem] border border-border/70 bg-muted/45 px-4 py-3.5">
                  <Avatar className="size-11">
                    <AvatarImage src={session.user?.image} alt={session.user?.name || 'User'} />
                    <AvatarFallback>{(session.user?.name || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{session.user?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{session.user?.email}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <AccountMenuButton
                    icon={Settings}
                    label="Account Settings"
                    onClick={() => onNavigate('/settings')}
                  />
                  <AccountMenuButton
                    icon={ShoppingBag}
                    label="My Orders"
                    onClick={() => onNavigate('/orders')}
                  />
                  <AccountMenuButton
                    icon={Heart}
                    label="Wishlist"
                    onClick={() => onNavigate('/wishlist')}
                  />
                </div>
                <Separator />
                <AccountMenuButton
                  icon={LogOut}
                  label="Logout"
                  destructive
                  onClick={() => {
                    onAccountOpenChange(false);
                    signOut();
                  }}
                />
              </>
            ) : (
              <>
                <div className="rounded-[1.6rem] border border-border/70 bg-muted/45 px-4 py-4">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Save the pieces you love, track your deliveries, and keep your next checkout effortless.
                  </p>
                </div>
                <Button
                  type="button"
                  size="lg"
                  onClick={() => {
                    onAccountOpenChange(false);
                    onAuthOpen();
                  }}
                  className="h-12 rounded-2xl"
                >
                  <UserPlus data-icon="inline-start" />
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
