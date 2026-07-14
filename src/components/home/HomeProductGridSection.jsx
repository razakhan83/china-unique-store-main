import ProductCard from '@/components/ProductCard';
import CategoryProductSlider from '@/components/CategoryProductSlider';
import SectionDoodleBackground from '@/components/home/SectionDoodleBackground';

export default function HomeProductGridSection({
  title = '',
  category = null,
  products = [],
  viewAllHref = '',
}) {
  if (!products.length) return null;

  const sectionLabel = title || category?.label || 'Products';

  return (
    <section className="relative bg-transparent py-8 md:py-11 even:bg-card/50">
      <SectionDoodleBackground categoryLabel={sectionLabel} />
      <div className="relative z-10 mx-auto w-full max-w-[1500px] px-4">
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
