import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/requireAdmin';
import mongooseConnect from '@/lib/mongooseConnect';
import Product from '@/models/Product';
import { revalidateTag } from 'next/cache';

export async function PATCH(req) {
    try {
        const auth = await requireApiAdmin();
        if (auth.error) return auth.error;

        const body = await req.json();
        const { productIds, price, compareAtPrice, stockQuantity, StockStatus, discountPercentage } = body;

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json({ success: false, message: 'Please select at least one product.' }, { status: 400 });
        }

        await mongooseConnect();

        const updateFields = {};

        if (price !== undefined && price !== null && price !== '') {
            const numPrice = Number(price);
            if (!isNaN(numPrice) && numPrice >= 0) {
                updateFields.Price = numPrice;
            }
        }

        if (compareAtPrice !== undefined && compareAtPrice !== null && compareAtPrice !== '') {
            const numCompare = Number(compareAtPrice);
            if (!isNaN(numCompare) && numCompare >= 0) {
                updateFields.compareAtPrice = numCompare;
            }
        }

        if (discountPercentage !== undefined && discountPercentage !== null && discountPercentage !== '') {
            const numDisc = Number(discountPercentage);
            if (!isNaN(numDisc) && numDisc >= 0 && numDisc <= 100) {
                updateFields.discountPercentage = numDisc;
                updateFields.isDiscounted = numDisc > 0;
            }
        }

        if (stockQuantity !== undefined && stockQuantity !== null && stockQuantity !== '') {
            const numStock = Number(stockQuantity);
            if (!isNaN(numStock) && numStock >= 0) {
                updateFields.stockQuantity = numStock;
                // If status wasn't explicitly given, auto-derive
                if (!StockStatus) {
                    updateFields.StockStatus = numStock > 0 ? 'In Stock' : 'Out of Stock';
                }
            }
        }

        if (StockStatus && ['In Stock', 'Out of Stock'].includes(StockStatus)) {
            updateFields.StockStatus = StockStatus;
        }

        if (Object.keys(updateFields).length === 0) {
            return NextResponse.json({ success: false, message: 'No valid price or stock fields provided to update.' }, { status: 400 });
        }

        const result = await Product.updateMany(
            { _id: { $in: productIds } },
            { $set: updateFields }
        );

        revalidateTag('products');
        revalidateTag('admin-dashboard');
        revalidateTag('home-sections');

        return NextResponse.json({
            success: true,
            message: `Updated ${result.modifiedCount} product(s) successfully.`,
            modifiedCount: result.modifiedCount,
            updates: updateFields,
        });
    } catch (error) {
        console.error('[API] Bulk Price/Stock Edit Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
