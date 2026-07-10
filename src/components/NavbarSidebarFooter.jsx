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
            variant="ghost"
            onClick={() => {
              onCloseSidebar();
              signOut();
            }}
            className="h-9 min-h-9 w-full justify-start rounded-lg px-3 py-1.5 text-[14px] font-medium transition-all duration-300 active:scale-[0.98] !bg-red-400 !text-white hover:!bg-red-500 shadow-none border-0"
          >
            <LogOut className="mr-3 size-4" />
            Logout
          </Button>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}
