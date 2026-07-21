'use client';

import { useDeferredValue, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import { trackSearchEvent } from '@/lib/clientTracking';

const POPULAR_TAGS = [
  "Kitchen Gadgets",
  "Home Decor",
  "Smart Watches",
  "Beauty Accessories",
  "Wireless Earbuds",
  "Travel Bags"
];

export default function MobileSearchOverlay({ open, onOpenChange }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const inputRef = useRef(null);

  // Debounce search term
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => setDebouncedSearch(deferredSearchTerm), 300);
    return () => window.clearTimeout(timer);
  }, [deferredSearchTerm, open]);

  // Fetch results
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setDebouncedSearch('');
      setResults([]);
      setIsLoading(false);
      return;
    }

    if (open && inputRef.current) {
      // Focus input with a slight delay to allow transition
      setTimeout(() => inputRef.current?.focus(), 100);
    }

    let isActive = true;
    const controller = new AbortController();

    async function fetchResults() {
      if (!debouncedSearch.trim()) {
        if (isActive) {
          setResults([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`/api/search-products?q=${encodeURIComponent(debouncedSearch.trim())}&limit=12`, {
          signal: controller.signal,
        });
        const result = await response.json();

        if (!isActive) return;

        setResults(Array.isArray(result?.data) ? result.data : []);
      } catch (error) {
        if (error?.name !== 'AbortError' && isActive) {
          setResults([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    fetchResults();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [debouncedSearch, open]);

  function handleSearchSubmit(event) {
    event?.preventDefault();
    if (!searchTerm.trim()) return;

    trackSearchEvent({ searchString: searchTerm.trim() });
    onOpenChange(false);
    router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`, { scroll: true });
  }

  function handleProductClick(product) {
    onOpenChange(false);
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-md animate-in fade-in-0 duration-300 md:hidden" style={{ zIndex: 300 }} onClick={() => onOpenChange(false)} />
      <div className="fixed inset-0 bg-background w-full h-[100dvh] flex flex-col animate-in slide-in-from-bottom-[100%] duration-300 ease-out focus:outline-none md:hidden" style={{ zIndex: 300 }}>
          
          {/* Header */}
          <div className="flex items-center gap-3 p-3 border-b border-border/40 bg-background sticky top-0 z-10 shrink-0">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
              <Search className="absolute left-3.5 size-4.5 text-muted-foreground/70" />
              <input 
                ref={inputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full h-11 pl-10 pr-9 bg-muted/40 border border-transparent focus:bg-background focus:border-primary/30 focus:ring-[3px] focus:ring-primary/10 rounded-full text-[15px] transition-all outline-none"
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')} className="absolute right-3 p-1 text-muted-foreground hover:text-foreground">
                  <X className="size-4.5" />
                </button>
              )}
            </form>
            <button onClick={() => onOpenChange(false)} className="text-[15px] font-medium px-1 py-2 text-foreground active:opacity-70 transition-opacity">
              Cancel
            </button>
          </div>
          
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+4.5rem)]">
            {searchTerm.trim() === '' ? (
              <div className="p-5 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-foreground/80">
                    <TrendingUp className="size-4.5 text-primary" />
                    <h3 className="font-semibold text-sm uppercase tracking-wider">Suggested for you</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_TAGS.map((tag) => (
                      <button 
                        key={tag} 
                        onClick={() => setSearchTerm(tag)}
                        className="px-3.5 py-2 bg-muted/40 hover:bg-muted border border-border/40 rounded-full text-sm font-medium transition-colors active:scale-95"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-foreground/80">
                    <Sparkles className="size-4.5 text-amber-500" />
                    <h3 className="font-semibold text-sm uppercase tracking-wider">Categories</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['Home & Kitchen', 'Beauty & Personal Care', 'Electronics', 'Toys & Games'].map((cat) => (
                      <button 
                        key={cat}
                        onClick={() => {
                          onOpenChange(false);
                          router.push(`/products?category=${encodeURIComponent(cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-'))}`);
                        }}
                        className="flex items-center p-3 bg-muted/30 rounded-xl border border-border/40 text-left active:scale-[0.98] transition-transform"
                      >
                        <span className="text-sm font-medium line-clamp-1">{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : isLoading ? (
              <div className="p-3">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            ) : results.length > 0 ? (
              <div className="p-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-3 px-1">
                  <p className="text-sm font-medium text-muted-foreground">Showing {results.length} results</p>
                  <button onClick={handleSearchSubmit} className="text-sm font-semibold text-primary">View All</button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {results.map((product) => (
                    <div key={product._id} onClick={() => handleProductClick(product)}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
                {results.length === 12 && (
                  <div className="mt-4 pb-6 px-1">
                    <button 
                      onClick={handleSearchSubmit}
                      className="w-full py-3.5 bg-muted/50 hover:bg-muted text-foreground font-semibold rounded-xl transition-colors border border-border/50"
                    >
                      See more results for "{debouncedSearch}"
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 pt-20 text-center animate-in fade-in duration-300">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
                  <Search className="size-8 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">No results found</h3>
                <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                  We couldn't find anything matching "{debouncedSearch}". Try using different keywords or checking for typos.
                </p>
              </div>
            )}
          </div>
      </div>
    </>
  );
}
