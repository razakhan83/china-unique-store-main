import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import mongooseConnect from '@/lib/mongooseConnect';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { getProductCategories } from '@/lib/productCategories';
import { normalizeProductImages } from '@/lib/productImages';
import { ensureProductImagesBlur } from '@/lib/serverImageBlur';
import { formatSeoKeywords } from '@/lib/seoKeywords';
import { buildProductVendorSnapshots, normalizeVendorSnapshot } from '@/lib/vendors';
import { normalizeDiscountInput } from '@/lib/discount';

// Utility for formatting a string to a unique URL-friendly slug
const slugify = (text) => {
    return (text || '').toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

// GET all products - used by both Public Store and Admin
export async function GET(req) {
    try {
        await mongooseConnect();

        // Check if requester is an authenticated Admin
        const session = await getServerSession(authOptions);
        const isAdmin = !!(session && session.user?.isAdmin);

        // Support ?search=, ?limit=, and ?page= with safe bounds
        const { searchParams } = new URL(req.url);
        const searchQuery = searchParams.get('search') || '';
        const rawLimit = searchParams.get('limit');
        const rawPage = searchParams.get('page');

        const page = Math.max(1, parseInt(rawPage || '1', 10) || 1);
        const defaultLimit = 24;
        const maxLimit = 100;
        let limit = rawLimit !== null ? parseInt(rawLimit, 10) : defaultLimit;
        if (isNaN(limit) || limit <= 0) {
            limit = defaultLimit;
        } else if (limit > maxLimit) {
            limit = maxLimit;
        }
        const skip = (page - 1) * limit;

        let filter = {};

        // Non-admin public requests can only see active store products
        if (!isAdmin) {
            filter.showOnStore = true;
        }

        if (searchQuery.trim()) {
            const escaped = searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escaped, 'i');
            filter.$or = [
                { Name: regex },
                { shortDescription: regex },
                { tags: regex },
                { primaryTag: regex },
            ];
        }

        // Omit heavy markdown 'Description' to avoid massive payload transfer; shortDescription is preserved
        const [products, total] = await Promise.all([
            Product.find(filter)
                .select('Name shortDescription seoTitle seoDescription seoKeywords seoCanonicalUrl seoOgTitle seoOgDescription seoOgImage seoOgImageRatio seoOgImageFit Price compareAtPrice Images Category StockStatus slug showOnStore createdAt updatedAt stockQuantity discountPercentage isDiscounted discountedPrice isNewArrival isBestSelling packOptions tags primaryTag')
                .populate({ path: 'Category', select: 'name slug bgColor' })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Product.countDocuments(filter),
        ]);

        // Format objectId to string securely
        const safeProducts = products.map((p) => {
            const { Image, ImageURL, ...safeProduct } = p;

            return {
                ...safeProduct,
                _id: safeProduct._id.toString(),
                id: safeProduct.slug || safeProduct._id.toString(),
                Category: getProductCategories(safeProduct),
                Images: normalizeProductImages(safeProduct.Images),
            };
        });

        return NextResponse.json({
            success: true,
            data: safeProducts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + products.length < total,
            },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


// POST new product - Protected Admin Route
export async function POST(req) {
    try {
        // Validation: Verify if the requester is the authorized Admin
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.isAdmin) {
            return NextResponse.json({ success: false, message: 'Unauthorized Access' }, { status: 401 });
        }

        await mongooseConnect();

        const body = await req.json();

        let {
            Name,
            Description,
            shortDescription,
            seoTitle,
            seoDescription,
            seoKeywords,
            seoCanonicalUrl,
            seoOgTitle,
            seoOgDescription,
            seoOgImage,
            Price,
            compareAtPrice,
            discountPercentage,
            stockQuantity,
            Images,
            cloudinary_id,
            Category: categoryInput,
            slug,
            StockStatus,
            showOnStore,
            isNewArrival,
            isBestSelling,
            isFeatured,
            isFreeDelivery,
            featuredPriority,
            vendors,
            packOptions,
            variants,
            tags,
            primaryTag,
            bulletPoints,
            specifications,
        } = body;

        if (!Name || !Price || !categoryInput) {
            return NextResponse.json({ success: false, message: 'Please provide Name, Price, and Category' }, { status: 400 });
        }

        if (!Images || !Array.isArray(Images) || Images.length === 0) {
            return NextResponse.json({ success: false, message: 'Please provide at least one product image' }, { status: 400 });
        }

        // Normalize Category to always be an array
        const categoryIds = Array.isArray(categoryInput) ? categoryInput : [categoryInput].filter(Boolean);
        const categories = await Category.find({ _id: { $in: categoryIds } }, '_id').lean();
        const validCategoryIdSet = new Set(categories.map((category) => category._id.toString()));
        const categoryArray = categoryIds.filter((id) => validCategoryIdSet.has(String(id)));

        if (categoryArray.length === 0) {
            return NextResponse.json({ success: false, message: 'Please provide valid categories' }, { status: 400 });
        }

        // Auto-generate slug if missing or empty
        let uniqueSlug = slug || slugify(Name);
        const baseSlug = slugify(Name);
        let counter = 1;

        while (await Product.exists({ slug: uniqueSlug })) {
            uniqueSlug = `${baseSlug}-${counter}`;
            counter++;
        }

        const normalizedPrice = Number(Price);
        const normalizedCompareAtPrice = compareAtPrice === '' || compareAtPrice == null
            ? null
            : Number(compareAtPrice);
        const normalizedStockQuantity = Math.max(0, Number(stockQuantity) || 0);
        const discountInput = normalizeDiscountInput({
            price: normalizedPrice,
            discountPercentage,
            discountType: body.discountType,
            discountEndsAt: body.discountEndsAt,
        });
        if (discountInput.error) {
            return NextResponse.json({ success: false, message: discountInput.error }, { status: 400 });
        }
        const stockStatus = StockStatus === 'Out of Stock'
            ? 'Out of Stock'
            : StockStatus === 'In Stock'
                ? 'In Stock'
                : normalizedStockQuantity > 0
                    ? 'In Stock'
                    : 'Out of Stock';
        const normalizedImages = await ensureProductImagesBlur(normalizeProductImages(Images));
        const normalizedVendors = await buildProductVendorSnapshots(vendors);

        const product = await Product.create({
            Name,
            Description,
            shortDescription: typeof shortDescription === 'string' ? shortDescription.trim() : '',
            seoTitle: typeof seoTitle === 'string' ? seoTitle.trim() : '',
            seoDescription: typeof seoDescription === 'string' ? seoDescription.trim() : '',
            seoKeywords: formatSeoKeywords(seoKeywords),
            seoCanonicalUrl: typeof seoCanonicalUrl === 'string' ? seoCanonicalUrl.trim() : '',
            seoOgTitle: typeof seoOgTitle === 'string' ? seoOgTitle.trim() : '',
            seoOgDescription: typeof seoOgDescription === 'string' ? seoOgDescription.trim() : '',
            seoOgImage: typeof seoOgImage === 'string' && !seoOgImage.startsWith('data:') ? seoOgImage.trim() : '',
            seoOgImageRatio: body.seoOgImageRatio === '1:1' ? '1:1' : '1.91:1',
            seoOgImageFit: body.seoOgImageFit === 'contain' ? 'contain' : 'cover',
            Price: normalizedPrice,
            compareAtPrice: Number.isFinite(normalizedCompareAtPrice) ? normalizedCompareAtPrice : null,
            Images: normalizedImages,
            cloudinary_id,
            Category: categoryArray,
            stockQuantity: normalizedStockQuantity,
            StockStatus: stockStatus,
            slug: uniqueSlug, // Ensure slug is saved
            vendors: normalizedVendors,
            showOnStore: showOnStore !== false && showOnStore !== 'false',
            discountPercentage: discountInput.discountPercentage,
            isDiscounted: discountInput.isDiscounted,
            discountedPrice: discountInput.discountedPrice,
            discountType: discountInput.discountType,
            discountEndsAt: discountInput.discountEndsAt,
            isNewArrival: isNewArrival === true || isNewArrival === 'true',
            isBestSelling: isBestSelling === true || isBestSelling === 'true',
            isFeatured: isFeatured === true || isFeatured === 'true',
            isFreeDelivery: isFreeDelivery === true || isFreeDelivery === 'true',
            featuredPriority: Number(featuredPriority) || 0,
            packOptions: Array.isArray(packOptions) ? packOptions : [],
            variants: Array.isArray(variants) ? variants : [],
            tags: Array.isArray(tags) ? tags : [],
            primaryTag: primaryTag || '',
            bulletPoints: Array.isArray(bulletPoints) ? bulletPoints : [],
            specifications: Array.isArray(specifications) ? specifications : [],
        });

        revalidateTag('products');
        revalidateTag(`product-${uniqueSlug}`);
        revalidateTag(`product-${product._id.toString()}`);
        revalidateTag('admin-dashboard');
        revalidateTag('home-sections');
        return NextResponse.json({
            success: true,
            data: {
                ...product.toObject(),
                _id: product._id.toString(),
                id: product.slug || product._id.toString(),
                Category: getProductCategories(product.toObject()),
                Images: normalizeProductImages(product.Images),
                vendors: Array.isArray(product.vendors) ? product.vendors.map(normalizeVendorSnapshot).filter(Boolean) : [],
            },
        }, { status: 201 });
    } catch (error) {
        console.error('[API] Error:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
