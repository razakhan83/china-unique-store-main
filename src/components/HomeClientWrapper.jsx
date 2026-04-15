"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import CategoryIconCarousel from "@/components/CategoryIconCarousel";
import HeroSlider from "@/components/HeroSlider";
import SearchField from "@/components/SearchField";
import { trackSearchEvent } from "@/lib/clientTracking";

export default function HomeClientWrapper({ heroSlides, categories = [] }) {
  const router = useRouter();
  const wrapperRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(deferredSearchTerm), 250);
    return () => clearTimeout(timer);
  }, [deferredSearchTerm]);

  useEffect(() => {
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
                  router.push(`/products/${product.slug || product._id || product.id}`, { scroll: true });
                  setIsFocused(false);
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
  }, [debouncedSearch, router]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearchSubmit(event) {
    event?.preventDefault();
    setIsFocused(false);
    if (!searchTerm.trim()) return;
    trackSearchEvent({ searchString: searchTerm.trim() });
    router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
  }

  return (
    <>
      <HeroSlider slides={heroSlides} />
      <CategoryIconCarousel categories={categories} />

      <div ref={wrapperRef} className="mx-auto max-w-3xl px-4 py-6 md:hidden">
        <SearchField
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
          }}
          onSubmit={handleSearchSubmit}
          onClear={() => {
            setSearchTerm("");
            setDebouncedSearch("");
            setSuggestions([]);
            setIsFocused(false);
          }}
          onFocus={() => setIsFocused(true)}
          isFocused={isFocused}
          suggestions={suggestions}
          emptyLabel={isLoadingSuggestions ? "Searching..." : `No products found for "${debouncedSearch}"`}
        />
      </div>
    </>
  );
}
