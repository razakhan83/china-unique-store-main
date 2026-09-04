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
        className="h-9 min-h-9 w-full rounded-lg px-3 py-1.5 shadow-none text-[14px]"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <SidebarMenu>
        <SidebarMenuItem>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onCloseSidebar();
              signOut();
            }}
            className="h-8.5 min-h-8.5 w-full justify-center rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 active:scale-[0.98] border border-border bg-background hover:bg-muted text-foreground shadow-none cursor-pointer"
          >
            <LogOut className="mr-2 size-3.5 text-muted-foreground" />
            Logout
          </Button>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}
