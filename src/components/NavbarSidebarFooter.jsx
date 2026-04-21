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
      <div className="flex items-center gap-3 rounded-2xl bg-sidebar-accent/55 px-3.5 py-3">
        <Avatar className="size-9">
          <AvatarImage src={session.user?.image} alt={session.user?.name || 'User'} />
          <AvatarFallback>{(session.user?.name || 'U').charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">{session.user?.name}</p>
          <p className="truncate text-xs text-sidebar-foreground/65">{session.user?.email}</p>
        </div>
      </div>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => {
              onCloseSidebar();
              router.push('/settings');
            }}
            className={mobileMenuButtonClass}
          >
            <Settings />
            <span>Account Settings</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {session.user?.isAdmin ? (
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                onCloseSidebar();
                router.push('/admin');
              }}
              className={mobileMenuButtonClass}
            >
              <LayoutGrid />
              <span>Admin Panel</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : null}
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
