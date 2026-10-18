import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/requireAdmin';
import mongooseConnect from '@/lib/mongooseConnect';
import Product from '@/models/Product';
import { revalidateTag } from 'next/cache';

function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export async function POST(req, { params }) {
    try {
        const auth = await requireApiAdmin();
        if (auth.error) return auth.error;

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ success: false, message: 'Product ID is required.' }, { status: 400 });
        }

        await mongooseConnect();

        const original = await Product.findById(id).lean();
        if (!original) {
            return NextResponse.json({ success: false, message: 'Original product not found.' }, { status: 404 });
        }

        const cloneName = `Copy of ${original.Name}`;
        const baseSlug = slugify(cloneName) || 'product-copy';
        let uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

        // Ensure unique slug
        let slugExists = await Product.findOne({ slug: uniqueSlug }).lean();
        let counter = 1;
        while (slugExists) {
            uniqueSlug = `${baseSlug}-${Date.now().toString(36)}-${counter}`;
            slugExists = await Product.findOne({ slug: uniqueSlug }).lean();
            counter++;
        }

        const clonedProductData = {
            Name: cloneName,
            slug: uniqueSlug,
            Description: original.Description || '',
            shortDescription: original.shortDescription || '',
            bulletPoints: Array.isArray(original.bulletPoints) ? [...original.bulletPoints] : [],
            specifications: Array.isArray(original.specifications) ? [...original.specifications] : [],
            seoTitle: original.seoTitle ? `Copy of ${original.seoTitle}` : '',
            seoDescription: original.seoDescription || '',
            seoKeywords: original.seoKeywords || '',
            seoCanonicalUrl: '',
            seoOgTitle: original.seoOgTitle ? `Copy of ${original.seoOgTitle}` : '',
            seoOgDescription: original.seoOgDescription || '',
            seoOgImage: original.seoOgImage || '',
            seoOgImageRatio: original.seoOgImageRatio || '1.91:1',
            seoOgImageFit: original.seoOgImageFit || 'cover',
            Price: Number(original.Price || 0),
            compareAtPrice: original.compareAtPrice != null ? Number(original.compareAtPrice) : null,
            discountPercentage: Number(original.discountPercentage || 0),
            discountType: original.discountType || 'none',
            discountEndsAt: original.discountEndsAt || null,
            isDiscounted: Boolean(original.isDiscounted),
            discountedPrice: original.discountedPrice != null ? Number(original.discountedPrice) : null,
            Images: Array.isArray(original.Images) ? original.Images.map(img => ({ ...img })) : [],
            Category: Array.isArray(original.Category) ? [...original.Category] : [],
            vendors: Array.isArray(original.vendors) ? original.vendors.map(v => ({ ...v })) : [],
            packOptions: Array.isArray(original.packOptions) ? original.packOptions.map(p => ({ ...p })) : [],
            variants: Array.isArray(original.variants) ? original.variants.map(v => ({ ...v })) : [],
            stockQuantity: Number(original.stockQuantity || 0),
            StockStatus: original.StockStatus || 'In Stock',
            showOnStore: false, // Clone starts as draft!
            isNewArrival: false,
            isBestSelling: false,
            isFeatured: false,
            isFreeDelivery: Boolean(original.isFreeDelivery),
            featuredPriority: 0,
            tags: Array.isArray(original.tags) ? [...original.tags] : [],
            primaryTag: original.primaryTag || '',
        };

        const clonedProduct = await Product.create(clonedProductData);

        revalidateTag('products');
        revalidateTag('admin-dashboard');

        return NextResponse.json({
            success: true,
            message: `"${clonedProduct.Name}" duplicated successfully as a draft.`,
            product: {
                ...clonedProduct.toObject(),
                _id: clonedProduct._id.toString(),
            },
        });
    } catch (error) {
        console.error('[API] Product Clone Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
