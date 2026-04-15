import { Children } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CategoryProductSlider({ categoryLabel, children, viewAllHref }) {
  const slides = Children.toArray(children);
  const slideCount = slides.length;

  if (slideCount === 0) return null;

  return (
    <div className="w-full">
      <style>{`
        @supports selector(.category-product-carousel::scroll-button(left)) {
          .category-product-carousel[data-interactive="true"]::scroll-button(*) {
            position: absolute;
            top: -3.25rem;
            z-index: 2;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 2.5rem;
            height: 2.5rem;
            border: 1px solid color-mix(in srgb, var(--color-primary) 15%, transparent);
            border-radius: 0.75rem;
            background: color-mix(in srgb, var(--color-primary) 10%, transparent);
            color: var(--color-primary);
            box-shadow: 0 0 0 rgba(10, 61, 46, 0);
            cursor: pointer;
            transition-property: transform, background-color, color, box-shadow, opacity;
            transition-duration: 300ms;
            transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
            background-repeat: no-repeat;
            background-position: center;
            background-size: 1rem 1rem;
          }

          .category-product-carousel[data-interactive="true"]::scroll-button(left) {
            content: "";
            right: 3rem;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M12.5 4.5L7 10l5.5 5.5' stroke='%230a3d2e' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          }

          .category-product-carousel[data-interactive="true"]::scroll-button(right) {
            content: "";
            right: 0;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M7.5 4.5L13 10l-5.5 5.5' stroke='%230a3d2e' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          }

          .category-product-carousel[data-interactive="true"]::scroll-button(*):enabled:active {
            transform: scale(0.96);
          }

          .category-product-carousel[data-interactive="true"]::scroll-button(*):disabled {
            opacity: 0.45;
            cursor: not-allowed;
          }

          .category-product-carousel[data-interactive="false"]::scroll-button(*) {
            content: none;
          }

          @media (max-width: 767px) {
            .category-product-carousel[data-interactive="true"]::scroll-button(*) {
              content: none;
              width: 0;
              height: 0;
              border: 0;
              padding: 0;
              opacity: 0;
              pointer-events: none;
              background: none;
              box-shadow: none;
            }
          }
        }
      `}</style>

      <div className="mb-5 flex items-center justify-between gap-4 md:mb-6 md:items-end">
        <div className="min-w-0 flex-1">
          <h2 className="text-[1.7rem] font-bold tracking-[-0.04em] text-primary [text-wrap:balance] md:text-[2.1rem]">
            {categoryLabel}
          </h2>
        </div>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className={cn(
              'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-primary/15 bg-background/80 bg-clip-padding px-4 text-sm font-semibold text-primary outline-none select-none shadow-[0_12px_30px_rgba(10,61,46,0.08)] transition-[transform,background-color,color,box-shadow] duration-300 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_16px_36px_rgba(10,61,46,0.14)] active:scale-[0.96] md:hidden'
            )}
          >
            View All
            <ArrowRight className="ml-1 size-4" />
          </Link>
        ) : null}
      </div>

      <div className="category-product-carousel-shell">
        <div
          className="category-product-carousel"
          data-interactive={slideCount > 1 ? 'true' : 'false'}
          aria-label={`${categoryLabel} products`}
          aria-roledescription="carousel"
        >
          {slides.map((slide, idx) => (
            <div
              key={`product-slide-${idx}`}
              className="category-product-carousel-item"
            >
              <div className="h-full min-w-0 pb-1">
                {slide}
              </div>
            </div>
          ))}
        </div>
      </div>

      {viewAllHref ? (
        <div className="mt-6 hidden justify-center md:flex">
          <Link
            href={viewAllHref}
            className={cn(
              'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-primary/15 bg-background/80 bg-clip-padding px-5 text-sm font-semibold text-primary outline-none select-none shadow-[0_12px_30px_rgba(10,61,46,0.08)] transition-[transform,background-color,color,box-shadow] duration-300 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:backdrop-blur-sm hover:bg-primary hover:text-primary-foreground hover:shadow-[0_16px_36px_rgba(10,61,46,0.14)] active:scale-[0.96]'
            )}
          >
            View All
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
