'use client';

import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import SearchField from '@/components/SearchField';
import { trackSearchEvent } from '@/lib/clientTracking';

export default function NavbarSearchPanel({ open, onOpenChange, placeholder = 'Search products', autoFocus, inlineSuggestions = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const currentUrlQuery = pathname === '/search' ? (searchParams.get('q') || searchParams.get('search') || '') : '';
  const [searchTerm, setSearchTerm] = useState(currentUrlQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(currentUrlQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trending, setTrending] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Sync searchTerm when URL query changes on /search
  useEffect(() => {
    if (pathname === '/search') {
      const q = searchParams.get('q') || searchParams.get('search') || '';
      setSearchTerm(q);
      setDebouncedSearch(q);
    }
  }, [pathname, searchParams]);

  // Close search suggestions when navigating to a new page
  useEffect(() => {
    setIsFocused(false);
  }, [pathname]);

  // Close search suggestions on click outside or Escape key
  useEffect(() => {
    if (!isFocused) return;

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFocused]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => setDebouncedSearch(deferredSearchTerm), 250);
    return () => window.clearTimeout(timer);
  }, [deferredSearchTerm, open]);

  useEffect(() => {
    if (!open) {
      setIsFocused(false);
      setSearchTerm('');
      setDebouncedSearch('');
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    async function loadSuggestions() {
      const query = debouncedSearch.trim();

      if (!query) {
        setIsLoadingSuggestions(true);
        try {
          const response = await fetch('/api/search-products?suggest=1', { signal: controller.signal });
          const result = await response.json();
          if (!isActive) return;
          setSuggestions([]);
          setCategories(
            Array.isArray(result?.categories)
              ? result.categories.map((category) => ({
                  ...category,
                  onSelect: () => {
                    onOpenChange(false);
                    setIsFocused(false);
                    router.push(`/products?category=${encodeURIComponent(category.slug || category.id || category.label)}`, { scroll: true });
                  },
                }))
              : [],
          );
          setTrending(
            Array.isArray(result?.trending)
              ? result.trending.map((product) => ({
                  ...product,
                  onSelect: () => {
                    onOpenChange(false);
                    setIsFocused(false);
                    router.push(`/products/${product.slug || product._id || product.id}`, { scroll: true });
                  },
                }))
              : [],
          );
        } catch (error) {
          if (error?.name !== 'AbortError' && isActive) {
            setCategories([]);
            setTrending([]);
          }
        } finally {
          if (isActive) setIsLoadingSuggestions(false);
        }
        return;
      }

      setIsLoadingSuggestions(true);

      try {
        const response = await fetch(`/api/search-products?q=${encodeURIComponent(query)}&limit=5`, {
          signal: controller.signal,
        });
        const result = await response.json();

        if (!isActive) return;

        setSuggestions(
          Array.isArray(result?.data)
            ? result.data.map((product) => ({
                ...product,
                onSelect: () => {
                  onOpenChange(false);
                  setIsFocused(false);
                  router.push(`/products/${product.slug || product._id || product.id}`, { scroll: true });
                },
              }))
            : [],
        );
      } catch (error) {
        if (error?.name !== 'AbortError' && isActive) {
          setSuggestions([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingSuggestions(false);
        }
      }
    }

    loadSuggestions();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [debouncedSearch, onOpenChange, open, router]);

  function handleSearchSubmit(event) {
    event?.preventDefault?.();
    const query = searchTerm.trim();
    if (!query) return;

    trackSearchEvent({ searchString: query });
    onOpenChange?.(false);
    setIsFocused(false);
    setSuggestions([]);
    if (typeof document !== 'undefined') {
      document.activeElement?.blur?.();
    }
    router.push(`/search?q=${encodeURIComponent(query)}`, { scroll: true });
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <SearchField
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        onSubmit={handleSearchSubmit}
        onClear={() => {
          setSearchTerm('');
          setDebouncedSearch('');
          setSuggestions([]);
          setIsFocused(true);
        }}
        onFocus={() => setIsFocused(true)}
        isFocused={isFocused}
        suggestions={suggestions}
        categories={categories}
        trending={trending}
        showSuggestions
        isLoading={isLoadingSuggestions}
        emptyLabel={isLoadingSuggestions ? 'Searching...' : `No products found for "${debouncedSearch}"`}
        placeholder={placeholder}
        autoFocus={autoFocus}
        inlineSuggestions={inlineSuggestions}
      />
    </div>
  );
}
