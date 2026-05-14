'use client';

import { useEffect, useState, useTransition } from 'react';
import { ArrowDownWideNarrow, Loader2, Search } from 'lucide-react';
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
  const [pendingAction, setPendingAction] = useState('apply');

  useEffect(() => {
    setSearchValue(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setSortValue(initialSort || defaultSortValue);
  }, [initialSort]);

  useEffect(() => {
    setPendingAction('apply');
  }, [initialSearch, initialSort, activeCategory]);

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

  function handleSubmit(event, action = 'apply') {
    event.preventDefault();
    setPendingAction(action);
    navigateWithFilters();
  }

  return (
    <div className="products-page-toolbar mx-auto max-w-7xl px-4 pt-3 md:pt-4">
      <form
        onSubmit={(event) => handleSubmit(event, pendingAction)}
        className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-card/70 p-2 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur md:p-2.5 lg:flex-row lg:items-center"
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="products-search" className="sr-only">
            Search products
          </label>
          <div className="flex min-h-10 items-center gap-2 rounded-xl bg-background/82 px-3 md:min-h-11">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              id="products-search"
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search products"
              className="h-10 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm text-foreground outline-none placeholder:text-muted-foreground/75 md:h-11"
            />
            <Button
              type="submit"
              size="sm"
              onClick={() => setPendingAction('search')}
              className="h-8 shrink-0 rounded-lg px-2.5 text-xs font-semibold shadow-none transition-[transform,background-color] hover:bg-primary/90 active:scale-[0.97] md:h-9 md:px-3"
              disabled={isPending}
              aria-label="Search products"
            >
              {isPending && pendingAction === 'search' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-3.5 md:hidden" />
              )}
              <span className="hidden md:inline">
                {isPending && pendingAction === 'search' ? 'Loading...' : 'Search'}
              </span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:w-[18.5rem]">
          <div className="flex h-10 w-full min-w-0 items-center gap-2 rounded-xl bg-background/82 px-3 text-muted-foreground md:h-11">
            <ArrowDownWideNarrow className="size-4 shrink-0" />
            <Select value={sortValue} onValueChange={setSortValue}>
              <SelectTrigger
                id="products-sort"
                aria-label="Sort products"
                className="h-10 w-full min-w-0 border-0 bg-transparent px-0 text-sm font-medium text-foreground shadow-none ring-0 focus:ring-0 focus:ring-offset-0 md:h-11"
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
          <Button
            type="submit"
            variant="default"
            onClick={() => setPendingAction('apply')}
            className="h-10 shrink-0 rounded-xl px-3 text-xs font-semibold shadow-none transition-[transform,background-color] hover:bg-primary/90 active:scale-[0.97] md:h-11 md:px-4"
            disabled={isPending}
            aria-label="Apply sort and filters"
          >
            {isPending && pendingAction === 'apply' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowDownWideNarrow className="size-4 md:hidden" />
            )}
            <span className="hidden md:inline">
              {isPending && pendingAction === 'apply' ? 'Loading...' : 'Apply'}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}
