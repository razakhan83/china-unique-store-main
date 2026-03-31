'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Star, MessageSquare, Loader2, Package, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function ReviewModal({ isOpen, onOpenChange, order, onComplete, onAction }) {
  const [reviews, setReviews] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [actionTaken, setActionTaken] = useState(null);

  // Reset actionTaken when modal opens
  useEffect(() => {
    if (isOpen) setActionTaken(null);
  }, [isOpen]);

  const handleOpenChange = (open) => {
    if (!open && !actionTaken) {
      onAction?.('dismiss');
    }
    onOpenChange(open);
  };

  // Initialize reviews for items that haven't been reviewed
  useEffect(() => {
    if (order && order.items) {
      const initialReviews = {};
      order.items.forEach(item => {
        if (!item.isReviewed) {
          initialReviews[item.productId] = {
            productId: item.productId,
            name: item.name,
            image: item.image,
            rating: 5,
            comment: ''
          };
        }
      });
      setReviews(initialReviews);
    }
  }, [order]);

  const handleRatingChange = (productId, rating) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], rating }
    }));
  };

  const handleCommentChange = (productId, comment) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], comment }
    }));
  };

  const handleSubmit = async () => {
    const reviewsToSubmit = Object.values(reviews);
    if (reviewsToSubmit.length === 0) return;

    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch('/api/reviews/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          reviews: reviewsToSubmit
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Thank you for your feedback!');
        setActionTaken('submit');
        onAction?.('submit');
        onComplete();
        onOpenChange(false);
      } else {
        if (data.errors) {
          const newErrors = {};
          data.errors.forEach(err => {
            newErrors[err.productId] = err.error;
          });
          setErrors(newErrors);
          toast.error('Some products could not be reviewed.');
        } else {
          toast.error(data.error || 'Failed to submit reviews');
        }
      }
    } catch (error) {
      toast.error('An error occurred during submission');
    } finally {
      setSubmitting(false);
    }
  };

  if (!order) return null;

  const itemsToReview = Object.values(reviews);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="size-6 text-primary" />
            Rate Your Experience
          </DialogTitle>
          <DialogDescription>
            Your parcel has been delivered! Please share your feedback on the products from Order #{order.orderId}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {itemsToReview.map((item) => (
            <div key={item.productId} className="space-y-4 pb-6 border-b border-border last:border-0 last:pb-0">
              <div className="flex gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" unoptimized />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-semibold text-foreground text-sm line-clamp-1">{item.name}</h4>
                  
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(item.productId, star)}
                        disabled={!!errors[item.productId]}
                        className={cn(
                          "transition-transform hover:scale-110 disabled:opacity-50 disabled:hover:scale-100",
                          item.rating >= star ? "text-accent" : "text-muted/40"
                        )}
                      >
                        <Star className={cn("size-5", item.rating >= star && "fill-current")} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {errors[item.productId] ? (
                <Alert variant="destructive" className="rounded-lg px-3 py-3 text-xs">
                  <AlertCircle className="size-4" />
                  <AlertTitle>Review unavailable</AlertTitle>
                  <AlertDescription>{errors[item.productId]}</AlertDescription>
                </Alert>
              ) : (
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor={`review-${item.productId}`}>Comments</FieldLabel>
                    <FieldContent>
                      <Textarea
                        id={`review-${item.productId}`}
                        placeholder="Share your thoughts about this product..."
                        className="min-h-[80px] resize-none text-sm"
                        value={item.comment}
                        onChange={(e) => handleCommentChange(item.productId, e.target.value)}
                      />
                    </FieldContent>
                  </Field>
                </FieldGroup>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="ghost" 
            onClick={() => {
              setActionTaken('later');
              onAction?.('later');
              onOpenChange(false);
            }} 
            disabled={submitting}
          >
            Maybe Later
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || itemsToReview.length === 0}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Reviews'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
