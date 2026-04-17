import { ArrowDownWideNarrow } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function ProductsToolbar({
  initialSearch = '',
  initialSort = 'newest',
  activeCategory = 'all',
}) {
  const sortOptions = [
    { value: '', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'az', label: 'Name: A to Z' },
    { value: 'za', label: 'Name: Z to A' },
  ];

  return (
    <div className="products-page-toolbar mx-auto max-w-7xl px-4 pt-5">
      <form action="/products" className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {activeCategory && activeCategory !== 'all' ? (
          <input type="hidden" name="category" value={activeCategory} />
        ) : null}

        <div className="min-w-0 flex-1">
          <label htmlFor="products-search" className="sr-only">
            Search products
          </label>
          <div className="flex min-h-12 items-center gap-2 rounded-xl border border-border/70 bg-card/95 px-3">
            <input
              id="products-search"
              name="search"
              type="search"
              defaultValue={initialSearch}
              placeholder="Search for premium products"
              className="h-12 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground/80"
            />
            <Button type="submit" size="sm" className="h-9 rounded-xl px-3.5 text-sm">
              Search
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
            name="sort"
            defaultValue={initialSort === 'newest' ? '' : initialSort}
            className="h-12 w-full rounded-xl border border-border/70 bg-card/95 px-4 text-sm font-medium text-foreground outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" className="h-12 rounded-xl px-4">
            Apply
          </Button>
        </div>
      </form>
    </div>
  );
}
