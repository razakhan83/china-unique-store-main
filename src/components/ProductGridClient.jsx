"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownWideNarrow, Search, SearchX, Sparkles } from "lucide-react";

import ProductCard from "@/components/ProductCard";
import SearchField from "@/components/SearchField";
import { useCartActions, useCartUi } from "@/context/CartContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { trackSearchEvent } from "@/lib/clientTracking";
import { getProductCategoryNames, hasProductCategory, normalizeCategoryId } from "@/lib/productCategories";

function ProductGridContent({
  initialProducts,
  forceSearchTerm,
  hideSearch,
  hideCategoryBar,
  activeCategoryOverride,
}) {
  const { activeCategory: cartActiveCategory = "all" } = useCartUi() || {};
  const { setActiveCategory = () => {} } = useCartActions() || {};
  const activeCategory = activeCategoryOverride ?? cartActiveCategory;
  const [searchTerm, setSearchTerm] = useState(forceSearchTerm || "");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFocused, setIsFocused] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const itemsPerPage = 12;
  const loadMoreRef = useRef(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchFilteredProducts = useMemo(() => {
    const term = deferredSearchTerm.trim().toLowerCase();
    if (!term) return [...initialProducts];
    return initialProducts.filter((product) => {
      const name = (product.Name || product.name || "").toLowerCase();
      const categories = getProductCategoryNames(product);
      return name.includes(term) || categories.some((category) => (category || "").toLowerCase().includes(term));
    });
  }, [deferredSearchTerm, initialProducts]);

  const dynamicCategories = useMemo(() => {
    const categories = new Map();
    searchFilteredProducts.forEach((product) => {
      const values = getProductCategoryNames(product);
      values.forEach((category) => {
        const trimmed = (category || "").trim();
        if (!trimmed) return;
        if (!categories.has(trimmed.toLowerCase())) categories.set(trimmed.toLowerCase(), trimmed);
      });
    });
    return Array.from(categories.values())
      .sort()
      .map((category) => ({
        id: normalizeCategoryId(category),
        label: category,
      }));
  }, [searchFilteredProducts]);

  const filteredProducts = useMemo(() => {
    let base = [...searchFilteredProducts];
    if (activeCategory === "new-arrivals") {
      base.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
      return base.slice(0, 30);
    }

    if (activeCategory === "special-offers") {
      base = base.filter((product) => product.isDiscounted === true);
      return base;
    }

    if (activeCategory !== "all") {
      base = base.filter((product) => hasProductCategory(product, activeCategory));
    }

    if (sortBy === "price-low") {
      base.sort((a, b) => (a.Price || a.price || 0) - (b.Price || b.price || 0));
    } else if (sortBy === "price-high") {
      base.sort((a, b) => (b.Price || b.price || 0) - (a.Price || a.price || 0));
    } else if (sortBy === "az") {
      base.sort((a, b) => (a.Name || a.name || "").localeCompare(b.Name || b.name || ""));
    } else if (sortBy === "za") {
      base.sort((a, b) => (b.Name || b.name || "").localeCompare(a.Name || a.name || ""));
    } else {
      base.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));
    }
    return base;
  }, [activeCategory, searchFilteredProducts, sortBy]);

  const displayedProducts = filteredProducts.slice(0, currentPage * itemsPerPage);
  const hasMore = displayedProducts.length < filteredProducts.length;

  const handleObserver = useCallback((entries) => {
    if (entries[0].isIntersecting && hasMore) {
      setCurrentPage((previous) => previous + 1);
    }
  }, [hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { rootMargin: "200px" });
    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [handleObserver]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setCurrentPage(1);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeCategory, searchTerm]);

  useEffect(() => {
    if (forceSearchTerm !== undefined) {
      const timeoutId = window.setTimeout(() => {
        setSearchTerm(forceSearchTerm);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [forceSearchTerm]);

  const suggestions = useMemo(() => {
    if (!debouncedSearch.trim()) return [];
    return searchFilteredProducts.slice(0, 5).map((product) => ({
      ...product,
      onSelect: (selected) => {
        setSearchTerm(selected.Name || selected.name || "");
        setIsFocused(false);
      },
    }));
  }, [debouncedSearch, searchFilteredProducts]);

  const categoryButtons = [
    { id: "all", label: "All Items", icon: Search },
    { id: "new-arrivals", label: "New Arrivals", icon: Sparkles },
    ...dynamicCategories.map((category) => ({ ...category, icon: null })),
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "az", label: "Name: A to Z" },
    { value: "za", label: "Name: Z to A" },
  ];

  return (
    <>
      {!hideCategoryBar ? (
        <div className="border-y border-border/70 bg-card/70">
          <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-4 hide-scrollbar">
            <ToggleGroup
              type="single"
              value={activeCategory}
              onValueChange={(value) => {
                if (!value) return;
                setActiveCategory(value);
                setCurrentPage(1);
              }}
              variant="outline"
              spacing={2}
              className="min-w-max"
            >
              {categoryButtons.map((category) => {
                const Icon = category.icon;
                return (
                  <ToggleGroupItem
                    key={category.id}
                    value={category.id}
                    className="rounded-lg px-3.5 py-2 text-sm font-medium aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                  {Icon ? <Icon className="size-4" /> : null}
                  {category.label}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          </div>
        </div>
      ) : null}

      {!hideSearch ? (
        <div className="products-page-toolbar mx-auto max-w-7xl px-4 pt-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <SearchField
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (searchTerm.trim()) {
                    trackSearchEvent({ searchString: searchTerm.trim() });
                  }
                  setIsFocused(false);
                }}
                onClear={() => {
                  setSearchTerm("");
                  setIsFocused(false);
                }}
                onFocus={() => setIsFocused(true)}
                isFocused={isFocused}
                suggestions={suggestions}
                showSuggestions={false}
              />
            </div>

            <div className="flex items-center gap-2 lg:w-64">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12 rounded-xl border-border/70 bg-background/80 px-4 text-sm font-medium shadow-md transition-none hover:bg-background/80 focus:border-border/70 focus:ring-0">
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
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="products-page-results-meta mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground tabular-nums">
            Showing <span className="font-semibold text-foreground">{displayedProducts.length}</span> of{" "}
            <span className="font-semibold text-foreground">{filteredProducts.length}</span> products
          </p>
          {searchTerm ? <Badge variant="secondary">Search: &quot;{searchTerm}&quot;</Badge> : null}
        </div>

        {displayedProducts.length ? (
          <div className="grid auto-rows-max grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {displayedProducts.map((product, index) => (
              <div
                key={`${product.slug || product._id || product.id || "product"}-${index}`}
                className="products-grid-card"
                style={{ "--products-card-delay": `${Math.min(index, 7) * 48}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <Empty className="products-page-empty surface-card rounded-xl px-6 py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-16 rounded-xl bg-primary/10 text-primary">
              <SearchX className="size-7" />
              </EmptyMedia>
              <EmptyTitle className="text-lg font-semibold text-foreground">No products found</EmptyTitle>
              <EmptyDescription className="max-w-sm">
                Try adjusting your search or selecting another category to explore the catalog.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {displayedProducts.length ? (
          <div className="products-page-footer mt-8 flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground tabular-nums">
              {displayedProducts.length} of {filteredProducts.length} products loaded
            </p>
            {hasMore ? (
              <Button className="active:scale-[0.96]" onClick={() => setCurrentPage((previous) => previous + 1)}>
                Load More Products
              </Button>
            ) : null}
          </div>
        ) : null}

        {hasMore ? <div ref={loadMoreRef} className="h-10 w-full" /> : null}
      </section>
    </>
  );
}

export default function ProductGridClient({
  initialProducts,
  forceSearchTerm,
  hideSearch,
  hideCategoryBar,
  activeCategoryOverride,
}) {
  return (
    <ProductGridContent
      initialProducts={initialProducts}
      forceSearchTerm={forceSearchTerm}
      hideSearch={hideSearch}
      hideCategoryBar={hideCategoryBar}
      activeCategoryOverride={activeCategoryOverride}
    />
  );
}
