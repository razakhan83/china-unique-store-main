import ProductCard from '@/components/ProductCard';

import CategoryProductSlider from '@/components/CategoryProductSlider';

export default function HomeCategories({ sections = [] }) {
  if (sections.length === 0) {
    return (
      <div className="bg-muted/30 py-12">
        <div className="container mx-auto max-w-7xl px-4">
          <p className="text-center text-muted-foreground">No products available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {sections.map((section, index) => {
        const sectionClassName =
          index % 2 === 0 ? 'bg-[color:color-mix(in_oklab,var(--color-primary)_10%,white)]' : 'bg-white';

        return (
          <section
            key={section.category.id}
            className={`home-lazy-section py-8 md:py-11 ${sectionClassName}`}
          >
            <div className="mx-auto w-full max-w-7xl px-4">
              <CategoryProductSlider
                categoryLabel={section.category.label}
                viewAllHref={`/products?category=${section.category.id}`}
              >
                {section.products.map((product, productIndex) => (
                  <ProductCard
                    key={`${product.slug || product._id || product.id || 'item'}-${productIndex}`}
                    product={product}
                    className="h-full shadow-none"
                  />
                ))}
              </CategoryProductSlider>
            </div>
          </section>
        );
      })}
    </div>
  );
}
