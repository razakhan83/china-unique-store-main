import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongooseConnect from '@/lib/mongooseConnect';
import Product from '@/models/Product';
import { revalidateTag } from 'next/cache';

export async function PATCH(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.isAdmin) {
            return NextResponse.json({ success: false, message: 'Unauthorized Access' }, { status: 401 });
        }

        const body = await req.json();
        const { action } = body; // 'live' or 'hidden'

        if (!action || !['live', 'hidden'].includes(action)) {
            return NextResponse.json({ success: false, message: 'Invalid action provided.' }, { status: 400 });
        }

        await mongooseConnect();

        const showOnStore = action === 'live';

        // Update all products
        const result = await Product.updateMany({}, { $set: { showOnStore } });

        revalidateTag('products');
        revalidateTag('admin-dashboard');

        return NextResponse.json({
            success: true,
            message: `Successfully updated ${result.modifiedCount} products to ${action === 'live' ? 'Live' : 'Hidden'}.`,
        });

    } catch (error) {
        console.error('[API] Bulk Visibility Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
