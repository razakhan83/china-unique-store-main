'use client';

import { useCallback, useTransition, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const PRICE_BUCKETS = [
  { value: 'all', label: 'All Prices' },
  { value: 'under500', label: 'Under Rs. 500' },
  { value: '500-1500', label: 'Rs. 500 – 1,500' },
  { value: '1500-5000', label: 'Rs. 1,500 – 5,000' },
  { value: 'above5000', label: 'Above Rs. 5,000' },
];

export default function ProductsSidebar({ categories = [], activeCategory = 'all' }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingCategoryId, setPendingCategoryId] = useState(null);

  const currentPrice = searchParams.get('price') || 'all';
  const currentInstock = searchParams.get('instock') === 'true';

  const buildUrl = useCallback((overrides = {}) => {
    const params = new URLSearchParams(searchParams.toString());
    
    for (const [key, value] of Object.entries(overrides)) {
      if (value === 'all' || value === false) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    
    // Always reset to page 1 when filtering
    params.delete('page');

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  function handleCategoryClick(categoryId) {
    if (activeCategory === categoryId) return;
    setPendingCategoryId(categoryId);
    startTransition(() => {
      router.push(buildUrl({ category: categoryId }), { scroll: false });
    });
  }

  function handlePriceChange(value) {
    startTransition(() => {
      router.push(buildUrl({ price: value }), { scroll: false });
    });
  }

  function handleInstockChange(checked) {
    startTransition(() => {
      router.push(buildUrl({ instock: checked }), { scroll: false });
    });
  }

  return (
    <aside className="hidden md:flex flex-col w-[240px] lg:w-[260px] shrink-0 gap-8 py-2 sticky top-[100px] max-h-[calc(100vh-120px)] overflow-y-auto hide-scrollbar pr-4">
      {/* Categories */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Categories</h3>
        <div className="flex flex-col space-y-0.5">
          <button
            onClick={() => handleCategoryClick('all')}
            className={cn(
              "flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors text-left w-full",
              activeCategory === 'all' 
                ? "bg-primary/10 text-primary font-bold" 
                : "text-foreground hover:bg-muted font-medium"
            )}
          >
            <span>All Products</span>
            {isPending && pendingCategoryId === 'all' && <Loader2 className="size-3.5 animate-spin opacity-70" />}
          </button>
          
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            const isLoading = isPending && pendingCategoryId === category.id;
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors text-left w-full",
                  isActive 
                    ? "bg-primary/10 text-primary font-bold" 
                    : "text-foreground hover:bg-muted font-medium"
                )}
              >
                <span className="truncate pr-2">{category.label}</span>
                {isLoading && <Loader2 className="size-3.5 animate-spin opacity-70 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-border/60" />

      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Price</h3>
        <ToggleGroup
          type="single"
          value={currentPrice}
          onValueChange={(val) => { if(val) handlePriceChange(val) }}
          variant="outline"
          className="flex flex-col items-stretch gap-1 px-1"
        >
          {PRICE_BUCKETS.map((bucket) => (
            <ToggleGroupItem
              key={bucket.value}
              value={bucket.value}
              className="h-8 justify-start rounded-md px-3 text-sm font-medium transition-colors border-transparent hover:border-border hover:bg-muted data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:font-bold"
            >
              {bucket.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Separator className="bg-border/60" />

      {/* Availability */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Availability</h3>
        <div className="flex items-center justify-between gap-4 px-1 pb-4">
          <div>
            <Label htmlFor="sidebar-instock" className="text-sm font-semibold text-foreground cursor-pointer">
              In Stock Only
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">Hide out-of-stock items</p>
          </div>
          <Switch
            id="sidebar-instock"
            checked={currentInstock}
            onCheckedChange={handleInstockChange}
          />
        </div>
      </div>
    </aside>
  );
}
