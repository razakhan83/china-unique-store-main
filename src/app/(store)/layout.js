import { getStoreCategories, getStoreSettings } from "@/lib/data";
import AuthProvider from "@/components/AuthProvider";
import LayoutWrapper from "@/components/LayoutWrapper";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

export default async function StoreLayout({ children }) {
  const [categories, settings] = await Promise.all([getStoreCategories(), getStoreSettings()]);

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <TooltipProvider>
            <LayoutWrapper categories={categories} settings={settings}>
              {children}
            </LayoutWrapper>
          </TooltipProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
