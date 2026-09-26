'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MAX_OFFERS = 10;

function formatEnds(value) {
  if (!value) return 'No end time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No end time';
  return date.toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function LimitedOffersClient({ initialSelected = [] }) {
  const [selected, setSelected] = useState(initialSelected);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  async function persist(next) {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/marketing/limited-offers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: next.map((product) => product._id) }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not save the list');
      }
      setSelected(data.selected || next);
      toast.success('Limited time offers updated');
    } catch (error) {
      toast.error(error.message || 'Could not save the list');
    } finally {
      setSaving(false);
    }
  }

  async function searchProducts(event) {
    event.preventDefault();
    const term = query.trim();
    if (!term) {
      setMatches([]);
      return;
    }
    setSearching(true);
    try {
      const response = await fetch(`/api/admin/marketing/limited-offers?q=${encodeURIComponent(term)}`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Search failed');
      setMatches(data.matches || []);
    } catch (error) {
      toast.error(error.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  function addProduct(product) {
    if (selected.some((item) => item._id === product._id)) return;
    if (selected.length >= MAX_OFFERS) {
      toast.error('You can add 10 products at most');
      return;
    }
    if (!product.active) {
      toast.error('This flash sale is not active');
      return;
    }
    persist([...selected, product]);
  }

  function move(index, direction) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= selected.length) return;
    const next = [...selected];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    persist(next);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Limited Time Offers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose 8 to 10 flash-sale products. Home Page Builder places this list on the homepage.
        </p>
        <p className="mt-1 text-sm font-medium tabular-nums">{selected.length} / {MAX_OFFERS}</p>
      </div>

      <form onSubmit={searchProducts} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search flash-sale products"
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={searching}>Search</Button>
      </form>

      {matches.length > 0 ? (
        <ul className="divide-y rounded-xl border">
          {matches.map((product) => (
            <li key={product._id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{product.Name}</p>
                <p className="text-xs text-muted-foreground">{product.discountPercentage}% off · ends {formatEnds(product.discountEndsAt)}</p>
              </div>
              <Button type="button" size="sm" variant="outline" disabled={saving || !product.active} onClick={() => addProduct(product)}>
                Add
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {selected.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No limited-time products yet. Search for a product that already has a flash sale.
        </div>
      ) : (
        <ol className="divide-y rounded-xl border">
          {selected.map((product, index) => (
            <li key={product._id} className="flex items-center gap-3 px-3 py-3">
              <span className="w-6 text-sm font-semibold tabular-nums text-muted-foreground">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.Name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.expired ? 'Expired' : `${product.discountPercentage}% off · ends ${formatEnds(product.discountEndsAt)}`}
                </p>
              </div>
              <Button type="button" size="icon" variant="ghost" disabled={saving || index === 0} onClick={() => move(index, -1)} aria-label="Move up">
                <ArrowUp className="size-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" disabled={saving || index === selected.length - 1} onClick={() => move(index, 1)} aria-label="Move down">
                <ArrowDown className="size-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" disabled={saving} onClick={() => persist(selected.filter((item) => item._id !== product._id))} aria-label="Remove">
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
