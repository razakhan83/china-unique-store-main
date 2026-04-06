import ProductCard from '@/components/ProductCard';
import CategoryProductSlider from '@/components/CategoryProductSlider';

export default function HomeProductGridSection({
  title = '',
  category = null,
  products = [],
  viewAllHref = '',
}) {
  if (!products.length) return null;

  const sectionLabel = title || category?.label || 'Products';

  return (
    <section className="bg-white py-8 md:py-11 even:bg-[color:color-mix(in_oklab,var(--color-primary)_6%,white)]">
      <div className="mx-auto w-full max-w-7xl px-4">
        <CategoryProductSlider
          categoryLabel={sectionLabel}
          viewAllHref={viewAllHref || (category?.id ? `/products?category=${category.id}` : '')}
        >
          {products.map((product, index) => (
            <ProductCard
              key={`${product.slug || product._id || product.id || 'product'}-${index}`}
              product={product}
              className="h-full shadow-none"
            />
          ))}
        </CategoryProductSlider>
      </div>
    </section>
  );
}
