'use client';

import { useEffect, useState, useTransition } from 'react';
import { ArrowDownWideNarrow } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export default function ProductsToolbar({
  initialSearch = '',
  initialSort = 'newest',
  activeCategory = 'all',
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(initialSearch);
  const [sortValue, setSortValue] = useState(initialSort === 'newest' ? '' : initialSort);

  useEffect(() => {
    setSearchValue(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setSortValue(initialSort === 'newest' ? '' : initialSort);
  }, [initialSort]);

  const sortOptions = [
    { value: '', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'az', label: 'Name: A to Z' },
    { value: 'za', label: 'Name: Z to A' },
  ];

  function navigateWithFilters() {
    const params = new URLSearchParams();
    const trimmedSearch = searchValue.trim();

    if (activeCategory && activeCategory !== 'all') {
      params.set('category', activeCategory);
    }

    if (trimmedSearch) {
      params.set('search', trimmedSearch);
    }

    if (sortValue) {
      params.set('sort', sortValue);
    }

    const query = params.toString();
    const href = query ? `${pathname}?${query}` : pathname;

    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    navigateWithFilters();
  }

  return (
    <div className="products-page-toolbar mx-auto max-w-7xl px-4 pt-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <label htmlFor="products-search" className="sr-only">
            Search products
          </label>
          <div className="flex min-h-12 items-center gap-2 rounded-xl border border-border/70 bg-card/95 px-3">
            <input
              id="products-search"
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search for premium products"
              className="h-12 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground/80"
            />
            <Button type="submit" size="sm" className="h-9 rounded-xl px-3.5 text-sm" disabled={isPending}>
              {isPending ? 'Updating...' : 'Search'}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:w-72">
          <label
            htmlFor="products-sort"
            className="flex h-12 shrink-0 items-center rounded-xl border border-border/70 bg-card/95 px-3 text-muted-foreground"
          >
            <ArrowDownWideNarrow className="size-4" />
          </label>
          <select
            id="products-sort"
            value={sortValue}
            onChange={(event) => setSortValue(event.target.value)}
            className="h-12 w-full rounded-xl border border-border/70 bg-card/95 px-4 text-sm font-medium text-foreground outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" className="h-12 rounded-xl px-4" disabled={isPending}>
            {isPending ? 'Applying...' : 'Apply'}
          </Button>
        </div>
      </form>
    </div>
  );
}
