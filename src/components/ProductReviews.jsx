import { Star } from 'lucide-react';

import ProductReviewsClient from '@/components/ProductReviewsClient';
import { getApprovedReviews } from '@/lib/data';
import { cn } from '@/lib/utils';

function ReviewCard({ name, body, rating, date }) {
  const initial = (name || 'U').charAt(0).toUpperCase();

  return (
    <div className="rounded-xl border border-border bg-muted/35 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
            {initial}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{name}</span>
            <span className="text-[10px] text-muted-foreground">
              {date ? new Date(date).toLocaleDateString() : ''}
            </span>
          </div>
        </div>
        <div className="flex gap-0.5 text-accent-foreground">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className={cn('size-3.5', index < rating ? 'fill-current' : 'text-muted/40')} />
          ))}
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

export default async function ProductReviews({ productId, productName }) {
  const reviews = await getApprovedReviews(productId);
  if (reviews.length === 0) {
    return null;
  }

  const averageRating =
    reviews.length > 0 ? Math.round(reviews.reduce((total, review) => total + review.rating, 0) / reviews.length) : 0;

  return (
    <div className="surface-card rounded-xl p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="mb-1 text-xl font-bold text-foreground md:text-2xl">Customer Reviews</h2>
          <div className="flex items-center gap-2">
            <div className="flex text-accent-foreground">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className={cn('size-4', index < averageRating ? 'fill-current' : 'text-muted/40')} />
              ))}
            </div>
            <span className="text-sm font-semibold text-foreground">
              {reviews.length > 0 ? `${reviews.length} Verified Reviews` : 'Be the first to review'}
            </span>
          </div>
        </div>

        <ProductReviewsClient productId={productId} productName={productName} reviewCount={reviews.length} />
      </div>
      <div className="grid gap-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review._id}
            name={review.userName}
            body={review.comment}
            rating={review.rating}
            date={review.createdAt}
          />
        ))}
      </div>
    </div>
  );
}
