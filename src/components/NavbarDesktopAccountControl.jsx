'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Heart, LayoutGrid, LogOut, Settings, ShoppingBag, User, Package } from 'lucide-react';

import AuthModal from '@/components/AuthModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function NavbarDesktopAccountControl({ navActionButtonClass = '' }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loadedAvatarSrc, setLoadedAvatarSrc] = useState('');
  const avatarSrc = session?.user?.image || '';
  const isAvatarLoaded = !avatarSrc || loadedAvatarSrc === avatarSrc;

  if (status === 'loading') {
    return (
      <div className="hidden md:block">
        <Button
          variant="ghost"
          size="icon-lg"
          className={`nav-profile-button flex items-center justify-center overflow-hidden ${navActionButtonClass}`}
          disabled
          aria-label="Loading account"
        >
          <Skeleton className="size-9 rounded-full" />
        </Button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="hidden md:block">
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={() => setIsAuthModalOpen(true)}
          className={`nav-profile-button overflow-hidden ${navActionButtonClass}`}
          title="Account"
        >
          <span className="relative flex size-6 items-center justify-center">
            <User strokeWidth={1.5} className="size-[1.45rem]" />
          </span>
        </Button>
        {isAuthModalOpen ? <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} /> : null}
      </div>
    );
  }

  return (
    <div className="hidden md:block">
      <DropdownMenu>
        <DropdownMenuTrigger title="Account" className="group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground">

            <Avatar className="size-10">
              {!isAvatarLoaded ? <Skeleton className="absolute inset-0 rounded-full" /> : null}
              <AvatarImage
                src={avatarSrc}
                alt={session.user?.name || 'User'}
                className={isAvatarLoaded ? 'opacity-100' : 'opacity-0'}
                onLoad={() => setLoadedAvatarSrc(avatarSrc)}
                onError={() => setLoadedAvatarSrc(avatarSrc)}
              />
              <AvatarFallback>{(session.user?.name || 'U').charAt(0)}</AvatarFallback>
            </Avatar>
          
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
              <Package className="mr-2 h-4 w-4" />
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
  );
}
