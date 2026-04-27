// @ts-nocheck
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import mongooseConnect from '@/lib/mongooseConnect';
import Order from '@/models/Order';
import { Resend } from 'resend';
import { generateOrderEmailHtml, getEmailBranding } from '@/lib/emailTemplates';
import { applyInventoryAdjustments, buildOrderItemsWithSourcing, calculateOrderTotal } from '@/lib/orderFulfillment';
import { calculateCheckoutPricing } from '@/lib/checkoutPricing';
import { getStoreSettings } from '@/lib/data';

const resend = new Resend(process.env.RESEND_API_KEY);

async function readJsonSafely(request) {
    try {
        return await request.json();
    } catch {
        return null;
    }
}

async function sendOrderNotificationEmail({ order, customerName }) {
    try {
        const emailBranding = await getEmailBranding();
        const data = await resend.emails.send({
            from: 'China Unique <onboarding@resend.dev>',
            to: '123raza83@gmail.com',
            subject: `New Order Received - ${customerName}`,
            html: generateOrderEmailHtml(order, emailBranding),
        });
        console.log(`Resend response for ${order.orderId}:`, data);
    } catch (emailError) {
        console.error('Failed to send order notification email:', emailError);
    }
}

// GET all orders — Protected Admin Route
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.isAdmin) {
            return NextResponse.json({ success: false, message: 'Unauthorized Access' }, { status: 401 });
        }

        await mongooseConnect();
        const orders = await Order.find({}).sort({ createdAt: -1 }).lean();

        const safeOrders = orders.map(o => ({
            ...o,
            _id: o._id.toString(),
        }));

        return NextResponse.json({ success: true, data: safeOrders });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST new order — Public (called by checkout)
export async function POST(req) {
    try {
        await mongooseConnect();

        const body = await readJsonSafely(req);
        if (!body || typeof body !== 'object') {
            return NextResponse.json(
                { success: false, message: 'Invalid request body.' },
                { status: 400 }
            );
        }
        const { customerName, customerPhone, customerAddress, customerCity, items, totalAmount, notes } = body;

        if (!customerName || !totalAmount || !items || items.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Customer name, items, and total amount are required.' },
                { status: 400 }
            );
        }

        const normalizedItems = await buildOrderItemsWithSourcing(items);
        const canonicalSubtotalAmount = calculateOrderTotal(normalizedItems);
        if (canonicalSubtotalAmount <= 0) {
            return NextResponse.json(
                { success: false, message: 'Unable to calculate a valid order total.' },
                { status: 400 }
            );
        }
        const expectedTotalAmount = customerCity
            ? calculateCheckoutPricing({
                subtotal: canonicalSubtotalAmount,
                city: customerCity,
                settings: await getStoreSettings(),
            }).total
            : canonicalSubtotalAmount;
        if (Number(totalAmount) !== expectedTotalAmount) {
            return NextResponse.json(
                { success: false, message: 'Checkout total no longer matches current product pricing. Please refresh and try again.' },
                { status: 409 }
            );
        }

        // Generate unique order ID: ORD-XXXXXX
        const orderId = `ORD-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

        const order = await Order.create({
            orderId,
            customerName,
            customerPhone,
            customerAddress,
            customerCity: String(customerCity || '').trim(),
            items: normalizedItems,
            totalAmount: expectedTotalAmount,
            notes,
            status: 'Pending',
        });

        await applyInventoryAdjustments(normalizedItems);

        revalidateTag('orders', 'max');
        revalidateTag('admin-dashboard', 'max');
        revalidateTag('products', 'max');

        after(() => sendOrderNotificationEmail({ order, customerName }));

        return NextResponse.json({ success: true, data: order }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
