'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Star, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function AdminReviewsDialog({ open, onOpenChange, product }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchReviews = useCallback(async () => {
    if (!product?._id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?productId=${product._id}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch reviews', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [product?._id]);

  useEffect(() => {
    if (open && product) {
      fetchReviews();
    }
  }, [open, product, fetchReviews]);

  async function handleDelete(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) => prev.filter((r) => r._id !== reviewId));
        toast.success('Review deleted');
      } else {
        toast.error(data.error || 'Failed to delete review');
      }
    } catch (error) {
      toast.error('An error occurred during deletion');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <DialogTitle>Manage Reviews</DialogTitle>
              <DialogDescription>
                Viewing customer feedback for <span className="font-semibold text-foreground uppercase tracking-wide">{product?.Name}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator className="my-2" />

        <ScrollArea className="max-h-[60vh] px-1">
          {loading ? (
            <div className="flex h-40 flex-col items-center justify-center gap-3">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs font-medium text-muted-foreground">Loading reviews...</p>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4 py-2">
              {reviews.map((review) => (
                <div 
                  key={review._id} 
                  className="group relative rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground uppercase">
                        {(review.userName || 'U').charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">{review.userName}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-0.5 text-accent">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("size-3.5", i < review.rating ? "fill-current" : "text-muted/30")} />
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(review._id)}
                        disabled={deletingId === review._id}
                      >
                        {deletingId === review._id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm italic leading-relaxed text-muted-foreground ring-offset-background">
                    &ldquo;{review.comment || 'No comment provided.'}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted/40">
                <AlertCircle className="size-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-medium text-foreground">No reviews found</p>
              <p className="mt-1 text-xs text-muted-foreground">There are currently no approved reviews for this product.</p>
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
