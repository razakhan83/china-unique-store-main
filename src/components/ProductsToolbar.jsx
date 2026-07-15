'use client';

import { Suspense, useTransition } from 'react';
import { Grid2x2, Grid3x3, LayoutGrid, Search, SlidersHorizontal, Square } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductsFilterSheet from '@/components/ProductsFilterSheet';
import { cn } from '@/lib/utils';

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'az', label: 'Name: A to Z' },
  { value: 'za', label: 'Name: Z to A' },
];

export default function ProductsToolbar({
  initialSearch = '',
  initialSort = 'newest',
  activeCategory = 'all',
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get('sort') || initialSort;
  const layout = searchParams.get('layout') || 'grid4';
  const currentPrice = searchParams.get('price') || 'all';
  const currentInstock = searchParams.get('instock') || 'all';

  function buildUrl(overrides = {}) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value === 'all' || value === 'newest') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    return `${pathname}?${params.toString()}`;
  }

  function handleChange(key, value) {
    startTransition(() => {
      router.push(buildUrl({ [key]: value }), { scroll: false });
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 pt-2 md:pt-4 sm:px-6 md:px-8 lg:px-10 xl:px-14">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
        {/* Left side: Filters */}
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <Suspense fallback={null}>
              <ProductsFilterSheet activeCategory={activeCategory} currentSort={currentSort} />
            </Suspense>
          </div>
        </div>

        {/* Right side: Sort and Layout */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Sort</span>
            <Select value={currentSort} onValueChange={(val) => handleChange('sort', val)}>
              <SelectTrigger className="h-8 w-auto border-0 bg-transparent px-2 text-sm font-medium shadow-none focus:ring-0 hover:bg-muted/50 rounded-md">
                <SelectValue placeholder="Newest" />
              </SelectTrigger>
              <SelectContent align="end" className="rounded-xl">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-sm">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-0.5 border-l border-border/50 pl-3">
            <button
              onClick={() => handleChange('layout', '1col')}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${layout === '1col' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
              title="1 per row (Mobile), 6 per row (PC)"
            >
              <Square className="size-4 sm:hidden" />
              <Grid3x3 className="size-4 hidden sm:block" />
            </button>
            <button
              onClick={() => handleChange('layout', '2col')}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${layout === '2col' || !layout || layout === 'grid4' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
              title="2 per row (Mobile), 4 per row (PC)"
            >
              <Grid2x2 className="size-4 sm:hidden" />
              <LayoutGrid className="size-4 hidden sm:block" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
