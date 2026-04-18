'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { Heart, LogOut, Home, Search, Settings, ShoppingBag, User, UserPlus, X } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const [isPressed, setIsPressed] = useState(false);

  const content = (
    <>
      <span
        className={cn(
          'flex items-center justify-center text-[color:inherit] transition-[color,transform] duration-450 ease-[cubic-bezier(0.22,1,0.36,1)]',
          isPressed && 'scale-[1.12]'
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
        onClick={onClick}
        onPointerDown={() => setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerLeave={() => setIsPressed(false)}
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
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
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
  onSearchOpenChange,
  onAccountOpenChange,
  accountOpen,
  isAuthOpen = false,
  onAuthOpenChange,
  onNavigate,
}) {
  const { data: session } = useSession();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const mobileDrawerReservedLane = 'calc(env(safe-area-inset-bottom) + var(--mobile-bottom-nav-offset))';
  const mobileDrawerOverlayClassName =
    'z-[60] md:hidden';
  const mobileDrawerContentClassName =
    'pointer-events-none z-[60] border-0 bg-transparent shadow-none md:hidden data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:max-h-none data-[vaul-drawer-direction=bottom]:rounded-none';
  const mobileDrawerPanelClassName =
    'pointer-events-auto mx-auto w-full max-w-xl max-h-[calc(80vh-var(--mobile-bottom-nav-offset))] overflow-y-auto rounded-t-[1.35rem] border-t border-border/80 bg-popover text-sm text-popover-foreground shadow-[0_-18px_50px_rgba(15,23,42,0.12)]';
  const mobileDrawerShellClassName =
    'pointer-events-none mx-auto flex w-full max-w-xl flex-col justify-end';
  const accountPanelOpen = session ? accountOpen : isAuthOpen;

  function closeSearch() {
    onSearchOpenChange?.(false);
  }

  function closeAccountPanel() {
    if (session) {
      onAccountOpenChange(false);
      return;
    }

    onAuthOpenChange?.(false);
  }

  function openAccountPanel() {
    if (session) {
      onAccountOpenChange(true);
      return;
    }

    onAuthOpenChange?.(true);
  }

  function closeMobilePanels() {
    closeSearch();
    closeAccountPanel();
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] md:hidden">
        <div className="pointer-events-auto relative z-[1] mx-auto w-full max-w-xl">
          <nav
            aria-label="Mobile navigation"
            className="grid grid-cols-4 items-center gap-1 border-t border-border/70 bg-background px-1 pb-[calc(env(safe-area-inset-bottom)+0.7rem)] pt-2.5 shadow-[0_-8px_22px_rgba(15,23,42,0.06)]"
          >
            <MobileNavButton
              icon={Home}
              label="Home"
              href="/"
              onClick={() => {
                closeMobilePanels();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              active={pathname === '/'}
            />
            <MobileNavButton
              icon={Search}
              label="Search"
              onClick={() => {
                if (isSearchOpen) {
                  closeSearch();
                  return;
                }

                closeAccountPanel();
                onSearchOpenChange?.(true);
              }}
              active={isSearchOpen}
              iconSwap={isSearchOpen ? <X className="size-[1.2rem]" strokeWidth={3} /> : undefined}
            />
            <MobileNavButton
              icon={ShoppingBag}
              label="My Orders"
              onClick={() => {
                closeMobilePanels();
                onNavigate?.('/orders');
              }}
              active={pathname.startsWith('/orders')}
            />
            <MobileNavButton
              icon={User}
              label="Account"
              onClick={() => {
                if (accountPanelOpen) {
                  closeAccountPanel();
                  return;
                }

                closeSearch();
                openAccountPanel();
              }}
              active={accountPanelOpen || pathname.startsWith('/settings')}
              iconSwap={accountPanelOpen ? <X className="size-[1.2rem]" strokeWidth={3} /> : undefined}
            />
          </nav>
        </div>
      </div>

      <Drawer open={accountOpen} onOpenChange={onAccountOpenChange} shouldScaleBackground={false}>
        <DrawerContent
          overlayClassName={mobileDrawerOverlayClassName}
          className={mobileDrawerContentClassName}
          overlayStyle={{ bottom: mobileDrawerReservedLane }}
        >
          <div className={mobileDrawerShellClassName}>
            <div className={mobileDrawerPanelClassName}>
              <DrawerHeader className="px-5 pb-3 pt-5 text-left">
                <DrawerTitle>{session ? 'Your account' : 'Join China Unique'}</DrawerTitle>
                <DrawerDescription>
                  {session
                    ? 'Quick access to your orders, wishlist, and profile settings.'
                    : 'Create an account to save favorites, track orders, and check out faster.'}
                </DrawerDescription>
              </DrawerHeader>

              <div className="flex flex-col gap-4 px-5 pb-4 pt-1">
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
                    <div className="flex flex-col gap-2">
                      <p className="px-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        More actions
                      </p>
                      <AccountMenuButton
                        icon={LogOut}
                        label="Log out"
                        destructive
                        onClick={() => setLogoutConfirmOpen(true)}
                      />
                    </div>
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
                        onAuthOpenChange?.(true);
                      }}
                      className="h-12 rounded-2xl"
                    >
                      <UserPlus data-icon="inline-start" />
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of your account?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be signed out on this device and can sign back in anytime with Google.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setLogoutConfirmOpen(false);
                onAccountOpenChange(false);
                signOut();
              }}
              className="w-full sm:w-auto"
            >
              <LogOut data-icon="inline-start" />
              Log out
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
