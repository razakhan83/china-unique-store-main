'use client';

import { useEffect, useState, useTransition } from 'react';
import { ArrowDownWideNarrow, Search } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProductsToolbar({
  initialSearch = '',
  initialSort = 'newest',
  activeCategory = 'all',
}) {
  const defaultSortValue = 'newest';
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(initialSearch);
  const [sortValue, setSortValue] = useState(initialSort || defaultSortValue);

  useEffect(() => {
    setSearchValue(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setSortValue(initialSort || defaultSortValue);
  }, [initialSort]);

  const sortOptions = [
    { value: defaultSortValue, label: 'Newest First' },
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

    if (sortValue && sortValue !== defaultSortValue) {
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
    <div className="products-page-toolbar mx-auto max-w-7xl px-4 pt-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-card/70 p-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur lg:flex-row lg:items-center"
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="products-search" className="sr-only">
            Search products
          </label>
          <div className="flex min-h-11 items-center gap-2 rounded-xl bg-background/82 px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              id="products-search"
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search products"
              className="h-11 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm text-foreground outline-none placeholder:text-muted-foreground/75"
            />
            <Button type="submit" size="sm" className="h-8 rounded-lg px-3 text-sm" disabled={isPending}>
              {isPending ? 'Updating...' : 'Search'}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:w-[18.5rem]">
          <div className="flex h-11 w-full items-center gap-2 rounded-xl bg-background/82 px-3 text-muted-foreground">
            <ArrowDownWideNarrow className="size-4 shrink-0" />
            <Select value={sortValue} onValueChange={setSortValue}>
              <SelectTrigger
                id="products-sort"
                aria-label="Sort products"
                className="h-11 w-full border-0 bg-transparent px-0 text-sm font-medium text-foreground shadow-none ring-0 focus:ring-0 focus:ring-offset-0"
              >
                <SelectValue placeholder="Newest First" />
              </SelectTrigger>
              <SelectContent align="end" className="min-w-[13rem] rounded-xl border-border/60">
                {sortOptions.map((option) => (
                  <SelectItem key={option.label} value={option.value} className="text-sm">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" variant="outline" className="h-11 rounded-xl px-4" disabled={isPending}>
            {isPending ? 'Applying...' : 'Apply'}
          </Button>
        </div>
      </form>
    </div>
  );
}
