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

export async function GET(_request, { params }) {
    try {
        await mongooseConnect();

        const { id } = await params;
        const product = await Product.findById(id)
            .select('Name Description Price Images Category StockStatus slug isLive createdAt updatedAt stockQuantity discountPercentage isDiscounted discountedPrice isNewArrival isBestSelling')
            .populate({ path: 'Category', select: 'name slug' })
            .lean();

        if (!product) {
            return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }

        const { Image, ImageURL, ...safeProduct } = product;

        return NextResponse.json({
            success: true,
            data: {
                ...safeProduct,
                _id: safeProduct._id.toString(),
                id: safeProduct.slug || safeProduct._id.toString(),
                Category: getProductCategories(safeProduct),
                Images: normalizeProductImages(safeProduct.Images),
            },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.isAdmin) {
            return NextResponse.json({ success: false, message: 'Unauthorized Access' }, { status: 401 });
        }

        await mongooseConnect();

        const { id } = await params;
        const body = await request.json();
        const existingProduct = await Product.findById(id);

        if (!existingProduct) {
            return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }

        if (Object.keys(body).length === 1 && Object.prototype.hasOwnProperty.call(body, 'isLive')) {
            existingProduct.isLive = body.isLive === true || body.isLive === 'true';
            await existingProduct.save();
            revalidateTag('products', 'max');
            if (existingProduct.slug) {
                revalidateTag(`product-${existingProduct.slug}`, 'max');
            }
            revalidateTag('admin-dashboard', 'max');
            revalidateTag('home-sections');
        }

        const categoryInput = Array.isArray(body.Category)
            ? body.Category
            : [body.Category].filter(Boolean);
        const categories = await Category.find({ _id: { $in: categoryInput } }, '_id').lean();
        const validCategoryIdSet = new Set(categories.map((category) => category._id.toString()));
        const categoryArray = categoryInput.filter((id) => validCategoryIdSet.has(String(id)));

        if (categoryArray.length === 0) {
            return NextResponse.json({ success: false, message: 'Please provide valid categories' }, { status: 400 });
        }

        const normalizedImages = await ensureProductImagesBlur(normalizeProductImages(body.Images));
        const previousSlug = existingProduct.slug;

        existingProduct.Name = body.Name;
        existingProduct.Description = body.Description;
        existingProduct.seoTitle = typeof body.seoTitle === 'string' ? body.seoTitle.trim() : '';
        existingProduct.seoDescription = typeof body.seoDescription === 'string' ? body.seoDescription.trim() : '';
        existingProduct.seoKeywords = formatSeoKeywords(body.seoKeywords);
        existingProduct.seoCanonicalUrl = typeof body.seoCanonicalUrl === 'string' ? body.seoCanonicalUrl.trim() : '';
        existingProduct.Price = Number(body.Price);
        existingProduct.Images = normalizedImages;
        existingProduct.Category = categoryArray;
        // existingProduct.StockStatus is intentionally left alone here; handled by the Admin toggle.
        existingProduct.isLive = body.isLive === true || body.isLive === 'true';
        
        // Marketing flags
        existingProduct.isNewArrival = body.isNewArrival === true || body.isNewArrival === 'true';
        existingProduct.isBestSelling = body.isBestSelling === true || body.isBestSelling === 'true';

        // Discount fields
        const discountPct = Math.min(100, Math.max(0, Number(body.discountPercentage) || 0));
        existingProduct.discountPercentage = discountPct;
        existingProduct.isDiscounted = discountPct > 0;

        await existingProduct.save();
        await existingProduct.populate({ path: 'Category', select: 'name slug' });
        revalidateTag('products', 'max');
        if (previousSlug) {
            revalidateTag(`product-${previousSlug}`, { expire: 0 });
            revalidatePath(`/products/${previousSlug}`);
        }
        if (existingProduct.slug) {
            revalidateTag(`product-${existingProduct.slug}`, { expire: 0 });
            revalidatePath(`/products/${existingProduct.slug}`);
        }
        revalidateTag('admin-dashboard', 'max');
        revalidateTag('home-sections');
        revalidatePath('/admin/products');
        revalidatePath('/products');

        return NextResponse.json({
            success: true,
            data: {
                ...existingProduct.toObject(),
                _id: existingProduct._id.toString(),
                id: existingProduct.slug || existingProduct._id.toString(),
                Category: getProductCategories(existingProduct.toObject()),
                Images: normalizeProductImages(existingProduct.Images),
            },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PATCH — discount-only update (dedicated endpoint, no full product reload needed)
export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.isAdmin) {
            return NextResponse.json({ success: false, message: 'Unauthorized Access' }, { status: 401 });
        }

        await mongooseConnect();

        const { id } = await params;
        const body = await request.json();

        // Handle StockStatus toggle
        if (body.StockStatus !== undefined) {
            const updatedProduct = await Product.findByIdAndUpdate(
                id,
                { $set: { StockStatus: body.StockStatus } },
                { new: true, runValidators: false, strict: false }
            ).lean();

            revalidateTag('products');
            if (updatedProduct.slug) {
                revalidateTag(`product-${updatedProduct.slug}`);
                revalidatePath(`/products/${updatedProduct.slug}`);
            }
            revalidateTag('admin-dashboard');
            revalidateTag('home-sections');
            revalidatePath('/admin/products');
            revalidatePath('/products');
            revalidatePath('/');

            return NextResponse.json({
                success: true,
                data: {
                    _id: updatedProduct._id.toString(),
                    StockStatus: updatedProduct.StockStatus,
                },
            });
        }

        // Handle Marketing flags toggle
        if (body.isNewArrival !== undefined || body.isBestSelling !== undefined) {
            const updateFields = {};
            if (body.isNewArrival !== undefined) updateFields.isNewArrival = body.isNewArrival === true || body.isNewArrival === 'true';
            if (body.isBestSelling !== undefined) updateFields.isBestSelling = body.isBestSelling === true || body.isBestSelling === 'true';

            const updatedProduct = await Product.findByIdAndUpdate(
                id,
                { $set: updateFields },
                { new: true, runValidators: false, strict: false }
            ).lean();

            revalidateTag('products');
            if (updatedProduct.slug) {
                revalidateTag(`product-${updatedProduct.slug}`);
                revalidatePath(`/products/${updatedProduct.slug}`);
            }
            revalidateTag('admin-dashboard');
            revalidateTag('home-sections');
            revalidatePath('/admin/products');
            revalidatePath('/products');
            revalidatePath('/');

            return NextResponse.json({
                success: true,
                data: {
                    _id: updatedProduct._id.toString(),
                    isNewArrival: updatedProduct.isNewArrival,
                    isBestSelling: updatedProduct.isBestSelling,
                },
            });
        }

        const pct = Math.min(100, Math.max(0, Number(body.discountPercentage) || 0));

        // We need the current price to compute discountedPrice
        const existing = await Product.findById(id).select('Price slug Name').lean();
        if (!existing) {
            return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }

        const discountedPrice = pct > 0
            ? Math.round(Number(existing.Price) * (1 - pct / 100))
            : null;

        // Atomic write directly to MongoDB — avoids any Mongoose validation issues
        // 'strict: false' is CRUCIAL here because Mongoose caches schemas during Next.js HMR.
        // If the dev server is using an old cached schema model, it will silently drop new fields!
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { $set: { discountPercentage: pct, isDiscounted: pct > 0, discountedPrice } },
            { new: true, runValidators: false, strict: false }
        ).lean();

        // Verify the saved document in Vercel / server logs
        console.log('[PATCH discount] Saved to MongoDB:', JSON.stringify({
            _id: updatedProduct._id.toString(),
            name: updatedProduct.Name,
            discountPercentage: updatedProduct.discountPercentage,
            isDiscounted: updatedProduct.isDiscounted,
            discountedPrice: updatedProduct.discountedPrice,
        }));

        // Hard-flush all caches so the storefront reflects changes immediately
        revalidateTag('products');
        if (updatedProduct.slug) {
            revalidateTag(`product-${updatedProduct.slug}`);
            revalidatePath(`/products/${updatedProduct.slug}`);
        }
        revalidateTag('admin-dashboard');
        revalidateTag('home-sections');
        revalidatePath('/admin/products');
        revalidatePath('/products');
        revalidatePath('/');

        return NextResponse.json({
            success: true,
            data: {
                _id: updatedProduct._id.toString(),
                discountPercentage: updatedProduct.discountPercentage,
                isDiscounted: updatedProduct.isDiscounted,
                discountedPrice: updatedProduct.discountedPrice ?? null,
            },
        });
    } catch (error) {
        console.error('[PATCH discount] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE a product by ID - Protected Admin Route
export async function DELETE(_request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.isAdmin) {
            return NextResponse.json({ success: false, message: 'Unauthorized Access' }, { status: 401 });
        }

        await mongooseConnect();

        const { id } = await params;
        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }

        revalidateTag('products', 'max');
        if (deletedProduct.slug) {
            revalidateTag(`product-${deletedProduct.slug}`, { expire: 0 });
            revalidatePath(`/products/${deletedProduct.slug}`);
        }
        revalidateTag('admin-dashboard', 'max');
        revalidateTag('home-sections');
        revalidatePath('/admin/products');
        revalidatePath('/products');

        return NextResponse.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
