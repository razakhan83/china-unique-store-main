'use client';

import { startTransition, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowDownWideNarrow } from 'lucide-react';

import { useProductsNavigationFeedback } from '@/components/ProductsNavigationFeedback';
import SearchField from '@/components/SearchField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trackSearchEvent } from '@/lib/clientTracking';

export default function ProductsToolbar({ initialSearch = '', initialSort = 'newest' }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setManualPending } = useProductsNavigationFeedback();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [isFocused, setIsFocused] = useState(false);
  const [sortBy, setSortBy] = useState(initialSort);

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setSortBy(initialSort);
  }, [initialSort]);

  useEffect(() => {
    setManualPending(false);
  }, [pathname, searchParams, setManualPending]);

  function buildHref(nextValues = {}) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(nextValues).forEach(([key, value]) => {
      const normalized = String(value ?? '').trim();
      if (!normalized || normalized === 'all' || (key === 'sort' && normalized === 'newest')) {
        params.delete(key);
      } else {
        params.set(key, normalized);
      }
    });

    params.delete('page');
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function navigate(nextHref) {
    const currentQuery = searchParams.toString();
    const currentHref = currentQuery ? `${pathname}?${currentQuery}` : pathname;
    if (nextHref === currentHref) {
      setManualPending(false);
      return;
    }

    setManualPending(true);
    startTransition(() => {
      router.push(nextHref, { scroll: false });
    });
  }

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'az', label: 'Name: A to Z' },
    { value: 'za', label: 'Name: Z to A' },
  ];

  return (
    <div className="products-page-toolbar mx-auto max-w-7xl px-4 pt-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <SearchField
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onSubmit={(event) => {
              event.preventDefault();
              setIsFocused(false);
              if (searchTerm.trim()) {
                trackSearchEvent({ searchString: searchTerm.trim() });
              }
              navigate(buildHref({ search: searchTerm }));
            }}
            onClear={() => {
              setSearchTerm('');
              setIsFocused(false);
              navigate(buildHref({ search: '' }));
            }}
            onFocus={() => setIsFocused(true)}
            isFocused={isFocused}
            suggestions={[]}
            showSuggestions={false}
          />
        </div>

        <div className="flex items-center gap-2 lg:w-64">
          <Select
            value={sortBy}
            onValueChange={(value) => {
              setSortBy(value);
              navigate(buildHref({ sort: value }));
            }}
          >
            <SelectTrigger className="h-12 rounded-xl border-border/70 bg-card/95 px-4 text-sm font-medium transition-none hover:bg-card/95 focus:border-border/70 focus:ring-0">
              <ArrowDownWideNarrow className="size-4 text-muted-foreground" />
              <SelectValue placeholder="Sort products" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
