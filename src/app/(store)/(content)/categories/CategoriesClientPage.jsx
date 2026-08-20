'use client';

import { useMemo, useState, useEffect } from 'react';
import CategoryPillCard from '@/components/home/CategoryPillCard';
import SectionDoodleBackground from '@/components/home/SectionDoodleBackground';
import Link from 'next/link';
import { Search, LayoutGrid, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function CategoriesClientPage({ initialCategories = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [fade, setFade] = useState(false);

  // Rotating placeholder text every 5 seconds with animation
  useEffect(() => {
    if (!initialCategories || initialCategories.length === 0) return;
    
    const interval = setInterval(() => {
      setFade(true); // Start fading out
      
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % initialCategories.length);
        setFade(false); // Fade back in
      }, 300); // 300ms matches the CSS transition duration
      
    }, 5000);

    return () => clearInterval(interval);
  }, [initialCategories]);

  const currentPlaceholder = initialCategories.length > 0 
    ? `Search ${initialCategories[placeholderIndex].name}...`
    : 'Search...';

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return initialCategories;
    const query = searchQuery.toLowerCase().trim();
    return initialCategories.filter((cat) =>
      cat.name.toLowerCase().includes(query)
    );
  }, [initialCategories, searchQuery]);

  return (
    <div className="relative min-h-screen bg-background pb-16">
      {/* Background doodles */}
      <SectionDoodleBackground categoryLabel="Categories" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-4 md:pt-8">
        {/* Top Left Back Button */}
        <div className="mb-4 flex justify-start md:mb-6">
          <Link 
            href="/" 
            className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2 rounded-full pl-3.5 pr-5 text-sm font-medium text-muted-foreground hover:text-foreground")}
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>

        <div className="mb-8 flex flex-col items-center gap-6 md:flex-row md:justify-between md:gap-0">
          <div className="flex flex-col items-center gap-2 md:items-start md:gap-3">
            <h1 className="text-center text-2xl font-bold tracking-tight text-primary md:text-left md:text-4xl">
              Shop by Category
            </h1>
          </div>
          {/* Minimal Search Bar */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-foreground/70 z-10" />
            
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-full border-border/80 bg-background/90 pl-11 pr-4 text-base shadow-sm backdrop-blur-sm transition-all focus-visible:ring-primary focus-visible:ring-offset-2"
            />
            
            {/* Animated Fake Placeholder */}
            {!searchQuery && (
              <div 
                className={`pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 z-10 text-muted-foreground transition-opacity duration-300 ${fade ? 'opacity-0' : 'opacity-100'}`}
              >
                {currentPlaceholder}
              </div>
            )}
          </div>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length === 0 ? (
          <div className="surface-card my-10 rounded-3xl p-12 text-center shadow-sm">
            <p className="text-base font-semibold text-foreground">No categories found matching &quot;{searchQuery}&quot;</p>
            <p className="mt-1 text-sm text-muted-foreground">Try searching with a different term.</p>
          </div>
        ) : (
          <div className="my-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-6 lg:gap-8">
            {filteredCategories.map((cat, index) => (
              <div key={cat._id} className="flex justify-center">
                <CategoryPillCard category={cat} index={cat.index ?? index} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
