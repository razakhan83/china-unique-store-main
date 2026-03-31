'use client';

import Image from 'next/image';
import { useCartActions } from '@/context/CartContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CLOUDINARY_IMAGE_PRESETS, optimizeCloudinaryUrl } from '@/lib/cloudinaryImage';
import { getProductCategoryNames } from '@/lib/productCategories';
import { getPrimaryProductImage } from '@/lib/productImages';
import { getBlurPlaceholderProps } from '@/lib/imagePlaceholder';
import { buildProductWhatsAppMessage, createWhatsAppUrl } from '@/lib/whatsapp';

export default function ProductModal({ product, onClose, whatsappNumber = '', storeName = 'China Unique Store' }) {
    const { addToCart } = useCartActions();

    if (!product) return null;

    const formatPrice = (raw) => {
        let cleanNumbers = String(raw).replace(/[^\d.]/g, '');
        if (!cleanNumbers) return 'Rs. 0';
        return `Rs. ${Number(cleanNumbers).toLocaleString('en-PK')}`;
    };

    const categories = getProductCategoryNames(product);
    const primaryImage = getPrimaryProductImage(product);
    const primaryImageSrc = primaryImage?.url
        ? optimizeCloudinaryUrl(primaryImage.url, CLOUDINARY_IMAGE_PRESETS.productModal)
        : '';
    const productUrl = typeof window !== 'undefined' ? window.location.href : '';
    const whatsappUrl = createWhatsAppUrl(
        whatsappNumber,
        buildProductWhatsAppMessage({
            productName: product.Name || product.name || 'Premium Item',
            productUrl,
            storeName,
        }),
    );

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 animate-fadeIn"
                onClick={onClose}
            >
                {/* Modal */}
                <div
                    className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card shadow-2xl animate-fadeInUp"
                    style={{ willChange: 'transform, opacity' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>

                    <div className="flex flex-col md:flex-row">
                        <div className="relative aspect-square w-full overflow-hidden bg-muted group md:min-h-[300px] md:w-1/2 md:aspect-auto">
                            {primaryImageSrc ? (
                                <Image
                                    src={primaryImageSrc}
                                    alt={product.Name || product.name || 'Product'}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    {...getBlurPlaceholderProps(primaryImage.blurDataURL)}
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground/60">
                                    <i className="fa-solid fa-image text-6xl opacity-20"></i>
                                </div>
                            )}
                        </div>

                        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {categories.length > 0 ? (
                                    categories.map((cat, i) => (
                                        <Badge key={i} variant="secondary">
                                            {cat}
                                        </Badge>
                                    ))
                                ) : (
                                    <Badge variant="secondary">Premium Item</Badge>
                                )}
                            </div>

                            <h2 className="mb-3 text-2xl font-bold leading-tight text-foreground">
                                {product.Name || product.name}
                            </h2>
                            <div className="mb-4 text-3xl font-extrabold tracking-tight text-primary">
                                {formatPrice(product.Price || product.price)}
                            </div>
                            <p className="mb-6 text-sm leading-relaxed text-muted-foreground md:text-base">
                                {product.Description || product.description || "Discover the perfect addition to your collection. This premium item from China Unique Store is crafted with quality and elegance in mind."}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-4">
                                <Button
                                    onClick={() => {
                                        addToCart(product);
                                        onClose();
                                    }}
                                    className="flex-1 w-full"
                                >
                                    <i className="fa-solid fa-cart-plus mr-2"></i> Add to Cart
                                </Button>

                                <a
                                    href={whatsappUrl || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 w-full"
                                >
                                    <Button variant="default" className="w-full bg-success text-success-foreground transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-1 hover:bg-success/90 shadow-sm hover:shadow-md">
                                        <i className="fa-brands fa-whatsapp text-xl mr-2"></i> Order via WhatsApp
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
