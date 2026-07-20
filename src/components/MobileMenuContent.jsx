'use client';

import Link from 'next/link';
import {
  LayoutGrid,
  Phone,
  Sparkles,
  Store,
  Tag,
  X,
  MessageSquarePlus,
} from 'lucide-react';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import dynamic from 'next/dynamic';

const MyOrdersButton = dynamic(() => import('@/components/MyOrdersButton'), { ssr: false });
const MyWishlistButton = dynamic(() => import('@/components/MyWishlistButton'), { ssr: false });
const NavbarSidebarFooter = dynamic(() => import('@/components/NavbarSidebarFooter'), { ssr: false });

export default function MobileMenuContent({
  pathname,
  categories,
  activeCategory,
  handleCategoryClick,
  setIsSidebarOpen,
  setIsAuthModalOpen,
  mobileMenuButtonClass,
  onOpenSuggestions = () => {},
}) {
  return (
    <Tabs defaultValue="menu" className="flex h-full w-full flex-col">
      <div className="flex w-full items-center p-4 pb-2">
        <TabsList className="grid h-10 w-full grid-cols-2">
          <TabsTrigger value="menu" className="text-sm font-medium">Menu</TabsTrigger>
          <TabsTrigger value="categories" className="text-sm font-medium">Categories</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="menu" className="m-0 flex flex-1 flex-col overflow-hidden data-[state=inactive]:hidden data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-left-4 duration-300 ease-out">
        <ScrollArea className="flex-1">
          <div className="py-2">
            <SidebarMenu className="px-4 gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === '/'}
                  className={`gap-4 rounded-lg px-3 py-1.5 h-9 transition-all duration-300 active:scale-[0.98] text-foreground ${pathname === '/' ? 'bg-gray-200 font-semibold shadow-sm' : 'bg-gray-50 hover:bg-gray-100 font-medium'}`}
                  render={<Link href="/" onClick={() => setIsSidebarOpen(false)} />}
                >
                  <Store className="size-4 text-foreground" />
                  <span className="text-[14px] tracking-tight">Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === '/products'}
                  className={`gap-4 rounded-lg px-3 py-1.5 h-9 transition-all duration-300 active:scale-[0.98] text-foreground ${pathname === '/products' ? 'bg-gray-200 font-semibold shadow-sm' : 'bg-gray-50 hover:bg-gray-100 font-medium'}`}
                  render={<Link href="/products" onClick={() => setIsSidebarOpen(false)} />}
                >
                  <LayoutGrid className="size-4 text-foreground" />
                  <span className="text-[14px] tracking-tight">All Products</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className="flex items-center">
                <MyOrdersButton
                  isMobile
                  className={`gap-4 rounded-lg px-3 py-1.5 h-9 w-full transition-all duration-300 active:scale-[0.98] text-foreground ${pathname.startsWith('/orders') ? 'bg-gray-200 font-semibold shadow-sm' : 'bg-gray-50 hover:bg-gray-100 font-medium'}`}
                />
              </SidebarMenuItem>
              <SidebarMenuItem className="flex items-center">
                <MyWishlistButton
                  isMobile
                  className={`gap-4 rounded-lg px-3 py-1.5 h-9 w-full transition-all duration-300 active:scale-[0.98] text-foreground ${pathname.startsWith('/wishlist') ? 'bg-gray-200 font-semibold shadow-sm' : 'bg-gray-50 hover:bg-gray-100 font-medium'}`}
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === '/contact'}
                  className={`gap-4 rounded-lg px-3 py-1.5 h-9 transition-all duration-300 active:scale-[0.98] text-foreground ${pathname === '/contact' ? 'bg-gray-200 font-semibold shadow-sm' : 'bg-gray-50 hover:bg-gray-100 font-medium'}`}
                  render={<Link href="/contact" onClick={() => setIsSidebarOpen(false)} />}
                >
                  <Phone className="size-4 text-foreground" />
                  <span className="text-[14px] tracking-tight">Contact Us</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </div>
        </ScrollArea>

        <div className="mt-auto flex flex-col gap-4 border-t border-border p-4 bg-background">
          <div className="flex justify-center gap-5 pb-5 pt-2">
            <Link href="#" className="text-muted-foreground/80 hover:text-primary transition-colors">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="size-[18px]"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              <span className="sr-only">Facebook</span>
            </Link>
            <Link href="#" className="text-muted-foreground/80 hover:text-primary transition-colors">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="size-[18px]"><path d="M3 21l1.65-6.03A9.74 9.74 0 0 1 3 10.5C3 5.25 7.25 1 12.5 1S22 5.25 22 10.5 17.75 20 12.5 20c-1.74 0-3.37-.47-4.75-1.27L3 21z"></path><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"></path></svg>
              <span className="sr-only">WhatsApp</span>
            </Link>
            <Link href="#" className="text-muted-foreground/80 hover:text-primary transition-colors">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="size-[18px]"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              <span className="sr-only">Instagram</span>
            </Link>
            <Link href="#" className="text-muted-foreground/80 hover:text-primary transition-colors">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="size-[18px]"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5h3a5 5 0 0 1-8 0"></path></svg>
              <span className="sr-only">TikTok</span>
            </Link>
          </div>
          <NavbarSidebarFooter
            mobileMenuButtonClass={mobileMenuButtonClass}
            onCloseSidebar={() => setIsSidebarOpen(false)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        </div>
      </TabsContent>

      <TabsContent value="categories" className="m-0 flex flex-1 flex-col overflow-hidden data-[state=inactive]:hidden data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-right-4 duration-300 ease-out">
        <ScrollArea className="flex-1">
          <div className="py-2">
            <SidebarMenu className="px-4 gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeCategory === 'new-arrivals'}
                  onClick={() => handleCategoryClick('new-arrivals')}
                  className={`gap-4 rounded-lg px-3 py-1.5 h-9 transition-all duration-300 active:scale-[0.98] text-foreground ${activeCategory === 'new-arrivals' ? 'bg-gray-200 font-semibold shadow-sm' : 'bg-gray-50 hover:bg-gray-100 font-medium'}`}
                >
                  <Sparkles className="size-4 text-foreground" />
                  <span className="text-[14px] tracking-tight">New Arrivals</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeCategory === 'special-offers'}
                  onClick={() => handleCategoryClick('special-offers')}
                  className={`gap-4 rounded-lg px-3 py-1.5 h-9 transition-all duration-300 active:scale-[0.98] text-foreground ${activeCategory === 'special-offers' ? 'bg-gray-200 font-semibold shadow-sm' : 'bg-gray-50 hover:bg-gray-100 font-medium'}`}
                >
                  <Tag className="size-4 text-foreground" />
                  <span className="text-[14px] tracking-tight">Special Offers</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {categories.filter(c => c.id !== 'special-offers' && c.id !== 'new-arrivals').map((category) => (
                <SidebarMenuItem key={category.id}>
                  <SidebarMenuButton
                    isActive={activeCategory === category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`gap-4 rounded-lg px-3 py-1.5 h-9 transition-all duration-300 active:scale-[0.98] text-foreground ${activeCategory === category.id ? 'bg-gray-200 font-semibold shadow-sm' : 'bg-gray-50 hover:bg-gray-100 font-medium'}`}
                  >
                    <Tag className="size-4 text-foreground" />
                    <span className="text-[14px] tracking-tight">{category.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
