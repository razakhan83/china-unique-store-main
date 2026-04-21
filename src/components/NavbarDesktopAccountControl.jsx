'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Heart, LayoutGrid, LogOut, Settings, ShoppingBag, User } from 'lucide-react';

import AuthModal from '@/components/AuthModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

export default function NavbarDesktopAccountControl({ navActionButtonClass = '' }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
          <span className="size-9 rounded-full bg-muted/80" />
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
        >
          <span className="relative flex size-5 items-center justify-center">
            <User className="size-5" />
          </span>
        </Button>
        {isAuthModalOpen ? <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} /> : null}
      </div>
    );
  }

  return (
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
  );
}
