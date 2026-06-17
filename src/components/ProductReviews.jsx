import { Star } from 'lucide-react';

import ProductReviewsClient from '@/components/ProductReviewsClient';
import ProductReviewsList from '@/components/ProductReviewsList';
import { getApprovedReviews } from '@/lib/data';
import { cn } from '@/lib/utils';

export default async function ProductReviews({ productId, productName }) {
  const reviews = await getApprovedReviews(productId);
  if (reviews.length === 0) {
    return (
      <div className="surface-card rounded-xl p-6 text-center md:p-8">
        <h2 className="mb-2 text-xl font-bold text-foreground">Customer Reviews</h2>
        <p className="mb-6 text-sm text-muted-foreground">No reviews yet. Be the first to review this product!</p>
        <ProductReviewsClient productId={productId} productName={productName} reviewCount={0} />
      </div>
    );
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
      
      <ProductReviewsList reviews={reviews} />
    </div>
  );
}
