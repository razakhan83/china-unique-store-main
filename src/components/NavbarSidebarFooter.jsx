'use client';

import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { LayoutGrid, LogOut, Settings } from 'lucide-react';

import GoogleSignInButton from '@/components/GoogleSignInButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

export default function NavbarSidebarFooter({ mobileMenuButtonClass = '', onCloseSidebar, onOpenAuth }) {
  const router = useRouter();
  const { data: session } = useSession();

  if (!session) {
    return (
      <GoogleSignInButton
        onClick={() => {
          onCloseSidebar();
          onOpenAuth();
        }}
        className="min-h-10 w-full rounded-xl py-2.5 shadow-none"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <SidebarMenu>
        <SidebarMenuItem>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onCloseSidebar();
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
  );
}
