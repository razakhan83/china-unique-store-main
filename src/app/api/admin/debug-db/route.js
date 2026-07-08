import { NextResponse } from 'next/server';
import { toggleProductLiveAction } from '@/app/actions';
import Product from '@/models/Product';
import mongooseConnect from '@/lib/mongooseConnect';

export async function GET(req) {
    try {
        await mongooseConnect();
        const p = await Product.findOne({}).lean();
        
        const original = p.showOnStore;
        
        // Toggle to false
        const res = await toggleProductLiveAction(p._id.toString(), false);

        const p2 = await Product.findOne({ _id: p._id }).lean();
        const after = p2.showOnStore;

        return NextResponse.json({
            success: true,
            original,
            res,
            after
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
