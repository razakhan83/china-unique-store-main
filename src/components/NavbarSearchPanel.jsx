'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import SearchField from '@/components/SearchField';
import { trackSearchEvent } from '@/lib/clientTracking';

export default function NavbarSearchPanel({ open, onOpenChange }) {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const deferredSearchTerm = useDeferredValue(searchTerm);

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
      if (!debouncedSearch.trim()) {
        if (isActive) {
          setSuggestions([]);
          setIsLoadingSuggestions(false);
        }
        return;
      }

      setIsLoadingSuggestions(true);

      try {
        const response = await fetch(`/api/search-products?q=${encodeURIComponent(debouncedSearch.trim())}&limit=5`, {
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
    event.preventDefault();
    if (!searchTerm.trim()) return;

    trackSearchEvent({ searchString: searchTerm.trim() });
    onOpenChange(false);
    setIsFocused(false);
    setSuggestions([]);
    router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`, { scroll: true });
  }

  return (
    <SearchField
      value={searchTerm}
      onChange={(event) => setSearchTerm(event.target.value)}
      onSubmit={handleSearchSubmit}
      onClear={() => {
        setSearchTerm('');
        setDebouncedSearch('');
        setSuggestions([]);
        setIsFocused(false);
      }}
      onFocus={() => setIsFocused(true)}
      isFocused={isFocused}
      suggestions={suggestions}
      showSuggestions
      emptyLabel={isLoadingSuggestions ? 'Searching...' : `No products found for "${debouncedSearch}"`}
    />
  );
}
