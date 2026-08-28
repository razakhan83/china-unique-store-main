'use client';

import { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Plus, 
  Search, 
  ExternalLink, 
  CheckCircle,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getBlurPlaceholderProps } from '@/lib/imagePlaceholder';
import { getPrimaryProductImage } from '@/lib/productImages';

export default function FeaturedProductsClient({ initialFeatured = [] }) {
  const router = useRouter();
  const [featured, setFeatured] = useState(initialFeatured);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  const featuredIds = new Set(featured.map((p) => p._id));
  const availableProducts = searchResults.filter((p) => !featuredIds.has(p._id));

  useEffect(() => {
    if (!isAddModalOpen) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      const q = searchQuery.trim();
      const url = q
        ? `/api/admin/products/catalog?q=${encodeURIComponent(q)}&limit=40`
        : '/api/admin/products/catalog?limit=40';
      fetch(url, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => {
          if (data.products) setSearchResults(data.products);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') console.error(err);
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isAddModalOpen, searchQuery]);

  async function handleToggleFeatured(product, makeFeatured) {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${product._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isFeatured: makeFeatured,
          featuredPriority: makeFeatured ? featured.length + 1 : 0
        }),
      });

      if (!res.ok) throw new Error('Failed to update featured status');

      if (makeFeatured) {
        setFeatured((prev) => [product, ...prev]);
        toast.success(`"${product.Name}" marked as Featured.`);
      } else {
        setFeatured((prev) => prev.filter((p) => p._id !== product._id));
        toast.success(`"${product.Name}" removed from Featured.`);
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      toast.error(err.message || 'Error updating product');
    } finally {
      setSaving(false);
    }
  }

  async function handleMove(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= featured.length) return;

    const newFeatured = [...featured];
    const [movedItem] = newFeatured.splice(index, 1);
    newFeatured.splice(targetIndex, 0, movedItem);

    setFeatured(newFeatured);

    // Save priorities
    try {
      await Promise.all(
        newFeatured.map((prod, idx) =>
          fetch(`/api/products/${prod._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ featuredPriority: newFeatured.length - idx }),
          })
        )
      );
      toast.success('Featured order updated');
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error('Failed to update ordering');
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/admin" className="hover:text-foreground">Admin</Link>
            <span>/</span>
            <Link href="/admin/home-page" className="hover:text-foreground">Home Page</Link>
            <span>/</span>
            <span>Featured (Ads)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="size-6 text-amber-500" />
            Featured Products (Ads Showcase)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage top priority products (such as active Ad campaigns) to highlight prominently on the storefront homepage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            className="rounded-xl shadow-sm gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="size-4" />
            Add Featured Product
          </Button>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Select Product to Feature</DialogTitle>
                <DialogDescription>
                  Choose a product from your catalog to pin to the Featured (Ads) section.
                </DialogDescription>
              </DialogHeader>

              <div className="relative my-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex-1 overflow-y-auto max-h-[50vh] divide-y divide-border border rounded-xl">
                {availableProducts.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No matching products available to add.
                  </div>
                ) : (
                  availableProducts.map((p) => {
                    const img = getPrimaryProductImage(p);
                    return (
                      <div key={p._id} className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative size-11 rounded-lg border overflow-hidden bg-muted shrink-0">
                            {img?.url && (
                              <Image src={img.url} alt={p.Name} fill className="object-cover" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">{p.Name}</p>
                            <p className="text-xs text-muted-foreground">PKR {Number(p.Price || 0).toLocaleString('en-PK')}</p>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg shrink-0 gap-1"
                          disabled={saving}
                          onClick={() => {
                            handleToggleFeatured(p, true);
                            setIsAddModalOpen(false);
                          }}
                        >
                          <Plus className="size-3.5" />
                          Feature
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Featured Products List */}
      <div className="surface-card rounded-2xl border border-border/70 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">Featured Priority List</span>
            <Badge variant="secondary" className="text-xs">{featured.length} Products</Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            Items at top will display first on the Home Page.
          </span>
        </div>

        {featured.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Sparkles className="size-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">No featured products yet</p>
            <p className="text-xs max-w-md">
              Click &quot;Add Featured Product&quot; to pin specific products (e.g. your active Ad campaigns) to the top of your homepage.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {featured.map((product, index) => {
              const img = getPrimaryProductImage(product);
              return (
                <div key={product._id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs">
                      #{index + 1}
                    </div>

                    <div className="relative size-12 sm:size-14 rounded-xl border border-border/60 overflow-hidden bg-muted shrink-0 shadow-sm">
                      {img?.url ? (
                        <Image src={img.url} alt={product.Name} fill className="object-cover" />
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <Link href={`/admin/products/edit/${product._id}`} className="font-semibold text-sm text-foreground hover:underline truncate block">
                        {product.Name}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-foreground">
                          PKR {Number(product.Price || 0).toLocaleString('en-PK')}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {product.StockStatus || 'In Stock'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="rounded-lg"
                      disabled={index === 0}
                      onClick={() => handleMove(index, -1)}
                      title="Move Up"
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="rounded-lg"
                      disabled={index === featured.length - 1}
                      onClick={() => handleMove(index, 1)}
                      title="Move Down"
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-lg text-destructive hover:bg-destructive/10"
                      onClick={() => handleToggleFeatured(product, false)}
                      title="Remove from Featured"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
