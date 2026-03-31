'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Loader2, MessageSquarePlus, Star } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function ProductReviewsClient({ productId, productName, reviewCount = 0 }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [canReview, setCanReview] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function checkPermission() {
      if (status !== 'authenticated' || !session?.user || !productId) {
        setCanReview(false);
        setCheckingPermission(false);
        return;
      }

      setCheckingPermission(true);
      try {
        const response = await fetch(`/api/reviews/check-permission?productId=${encodeURIComponent(productId)}`, {
          cache: 'no-store',
        });
        const result = await response.json();

        if (!ignore) {
          setCanReview(result?.success === true && result?.canReview === true);
        }
      } catch {
        if (!ignore) {
          setCanReview(false);
        }
      } finally {
        if (!ignore) {
          setCheckingPermission(false);
        }
      }
    }

    checkPermission();

    return () => {
      ignore = true;
    };
  }, [productId, session, status]);

  function handleAddReviewClick() {
    if (!session) {
      toast.info('Please sign in to leave a review.');
      signIn('google');
      return;
    }

    if (!canReview) {
      toast.error('Reviews are available only after your delivered order.');
      return;
    }

    setModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (rating === 0) {
      toast.error('Please select a star rating.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, comment }),
      });
      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Failed to submit review');
        return;
      }

      toast.success(reviewCount > 0 ? 'Your review has been added.' : 'Thanks for being the first to review.');
      setModalOpen(false);
      setRating(0);
      setHoverRating(0);
      setComment('');
      router.refresh();
    } catch {
      toast.error('An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {canReview ? (
        <Button
          variant="outline"
          className="max-w-max border-primary/20 text-primary hover:bg-primary/5"
          onClick={handleAddReviewClick}
          disabled={checkingPermission}
        >
          {checkingPermission ? <Loader2 className="mr-2 size-4 animate-spin" /> : <MessageSquarePlus className="mr-2 size-4" />}
          Write a Review
        </Button>
      ) : null}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your thoughts on <span className="font-semibold text-foreground">{productName}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <FieldGroup>
            <Field>
              <FieldLabel className="justify-center text-center">Rating</FieldLabel>
              <div className="flex justify-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => {
                  const starValue = index + 1;

                  return (
                    <button
                      key={index}
                      type="button"
                      className="transition-transform active:scale-95"
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starValue)}
                    >
                      <Star
                        className={cn(
                          'size-8 transition-colors',
                          (hoverRating || rating) >= starValue
                            ? 'fill-accent-foreground text-accent-foreground'
                            : 'text-muted'
                        )}
                      />
                    </button>
                  );
                })}
              </div>
              <FieldDescription className="text-center">
                Choose a star rating before submitting your review.
              </FieldDescription>
            </Field>

            {rating === 0 ? (
              <Alert variant="destructive">
                <AlertTitle>Select a rating</AlertTitle>
                <AlertDescription>Please choose at least one star before submitting.</AlertDescription>
              </Alert>
            ) : null}

            <Field>
              <FieldLabel htmlFor="comment">Your Comments (Optional)</FieldLabel>
              <FieldContent>
                <Textarea
                  id="comment"
                  placeholder="What did you like or dislike?"
                  className="min-h-[100px] rounded-xl"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </FieldContent>
            </Field>
            </FieldGroup>

            <Button type="submit" className="h-11 w-full rounded-xl font-bold" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
