import { revalidatePath, revalidateTag } from 'next/cache';
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
export async function GET() {
    try {
        await mongooseConnect();
        const products = await Product.find({})
            .select('Name Description seoTitle seoDescription seoKeywords seoCanonicalUrl Price Images Category StockStatus slug isLive createdAt updatedAt stockQuantity discountPercentage isDiscounted discountedPrice isNewArrival isBestSelling')
            .populate({ path: 'Category', select: 'name slug' })
            .sort({ createdAt: -1 })
            .lean();

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

        return NextResponse.json({ success: true, data: safeProducts });
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
            seoTitle,
            seoDescription,
            seoKeywords,
            seoCanonicalUrl,
            Price,
            discountPercentage,
            stockQuantity,
            Images,
            cloudinary_id,
            Category: categoryInput,
            slug,
            StockStatus,
            isLive,
            isNewArrival,
            isBestSelling,
            vendors,
        } = body;

        if (!Name || !Price || !categoryInput) {
            return NextResponse.json({ success: false, message: 'Please provide Name, Price, and Category' }, { status: 400 });
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
        const normalizedStockQuantity = Math.max(0, Number(stockQuantity) || 0);
        const normalizedDiscountPercentage = Math.min(100, Math.max(0, Number(discountPercentage) || 0));
        const stockStatus = StockStatus === 'Out of Stock'
            ? 'Out of Stock'
            : StockStatus === 'In Stock'
                ? 'In Stock'
                : normalizedStockQuantity > 0
                    ? 'In Stock'
                    : 'Out of Stock';
        const discountedPrice = normalizedDiscountPercentage > 0
            ? Math.round(normalizedPrice * (1 - normalizedDiscountPercentage / 100))
            : null;

        const normalizedImages = await ensureProductImagesBlur(normalizeProductImages(Images));
        const normalizedVendors = await buildProductVendorSnapshots(vendors);

        const product = await Product.create({
            Name,
            Description,
            seoTitle: typeof seoTitle === 'string' ? seoTitle.trim() : '',
            seoDescription: typeof seoDescription === 'string' ? seoDescription.trim() : '',
            seoKeywords: formatSeoKeywords(seoKeywords),
            seoCanonicalUrl: typeof seoCanonicalUrl === 'string' ? seoCanonicalUrl.trim() : '',
            Price: normalizedPrice,
            Images: normalizedImages,
            cloudinary_id,
            Category: categoryArray,
            stockQuantity: normalizedStockQuantity,
            StockStatus: stockStatus,
            slug: uniqueSlug, // Ensure slug is saved
            vendors: normalizedVendors,
            isLive: isLive === true || isLive === 'true' ? true : false,
            discountPercentage: normalizedDiscountPercentage,
            isDiscounted: normalizedDiscountPercentage > 0,
            discountedPrice,
            isNewArrival: isNewArrival === true || isNewArrival === 'true',
            isBestSelling: isBestSelling === true || isBestSelling === 'true',
        });

        await product.populate({ path: 'Category', select: 'name slug' });

        revalidateTag('products');
        revalidateTag(`product-${uniqueSlug}`);
        revalidateTag('admin-dashboard');
        revalidateTag('home-sections');
        revalidatePath('/admin/products');
        revalidatePath('/products');
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
