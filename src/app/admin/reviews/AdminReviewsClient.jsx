'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronRight, MessageSquare, Package, Search, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import AppPagination from '@/components/AppPagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

function buildHref(pathname, searchParams, updates) {
  const params = new URLSearchParams(searchParams?.toString());

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export default function AdminReviewsClient({
  initialReviews,
  total,
  totalPages,
  currentPage,
  initialSearchQuery,
  summary,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [reviews, setReviews] = useState(initialReviews);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [loadingId, setLoadingId] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) return undefined;

    setHighlightedId(id);

    const scrollTimer = setTimeout(() => {
      const element = document.getElementById(`review-${id}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    const clearTimer = setTimeout(() => {
      setHighlightedId(null);
    }, 3000);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [searchParams]);

  function navigate(updates) {
    const href = buildHref(pathname, searchParams, updates);
    startTransition(() => {
      router.push(href);
    });
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    setLoadingId(id);

    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || 'Delete failed');
        return;
      }

      setReviews((prev) => prev.filter((review) => review._id !== id));
      toast.success('Review deleted successfully');
      router.refresh();
    } catch (error) {
      toast.error('An error occurred while deleting the review');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="admin-page-stack">
      <div className="admin-page-header">
        <div>
          <p className="admin-page-kicker">Feedback</p>
          <h1 className="admin-page-title">Reviews</h1>
          <p className="admin-page-subtitle">Track ratings and remove low-quality feedback fast.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="admin-stat-card border-none shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground">Total Reviews</CardDescription>
            <CardTitle className="text-3xl font-bold text-foreground">{summary.totalReviews}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="size-3" />
              <span>All feedback</span>
            </div>
          </CardContent>
        </Card>

        <Card className="admin-stat-card border-none shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground">Average Rating</CardDescription>
            <CardTitle className="text-3xl font-bold text-foreground">{summary.averageRating.toFixed(1)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="size-3 fill-foreground text-foreground" />
              <span>Store average</span>
            </div>
          </CardContent>
        </Card>

        <Card className="admin-stat-card border-none shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground">Recent (7 Days)</CardDescription>
            <CardTitle className="text-3xl font-bold text-foreground">{summary.recentReviews}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              <span>Last 7 days</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <form
        className="admin-filter-shell flex flex-col gap-4 md:flex-row md:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ search: searchQuery.trim() || null, page: null });
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by user, comment, or product..."
            className="pl-10"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </form>

      <div className={cn('admin-surface overflow-hidden rounded-[1.2rem] transition-opacity', isPending && 'opacity-70')}>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[180px]">User</TableHead>
              <TableHead className="w-[120px]">Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="w-[140px]">Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <TableRow
                  key={review._id}
                  id={`review-${review._id}`}
                  className={cn(
                    'transition-all duration-700',
                    highlightedId === review._id ? 'bg-muted ring-1 ring-border' : 'hover:bg-muted/30',
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                        {review.userName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                          {review.userName}
                          {highlightedId === review._id && (
                            <Badge className="h-4 animate-pulse bg-foreground px-1 text-[10px] uppercase tracking-wider text-background">
                              New
                            </Badge>
                          )}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          className={cn('size-3', index < review.rating ? 'fill-foreground text-foreground' : 'text-muted/40')}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-[300px] truncate text-sm text-foreground" title={review.comment}>
                      {review.comment || <span className="italic text-muted-foreground">No comment</span>}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 max-w-[200px]">
                      <Package className="size-3 shrink-0 text-muted-foreground" />
                      <span className="truncate text-xs font-medium text-muted-foreground">
                        {review.productId?.Name || 'Deleted Product'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="size-3" />
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(review._id)}
                      disabled={loadingId === review._id}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete review</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="rounded-full bg-muted p-3 text-muted-foreground">
                      <Search className="size-6" />
                    </div>
                    <p className="font-medium">No reviews found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search terms.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 px-2">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{((currentPage - 1) * 12) + 1}</span> to{' '}
            <span className="font-medium text-foreground">{Math.min(currentPage * 12, total)}</span> of{' '}
            <span className="font-medium text-foreground">{total}</span> reviews
          </p>
          <AppPagination
            page={currentPage}
            totalPages={totalPages}
            getHref={(page) => buildHref(pathname, searchParams, { page })}
          />
        </div>
      )}
    </div>
  );
}
