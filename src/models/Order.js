import mongoose from 'mongoose';
import { DEFAULT_ORDER_STATUS, normalizeOrderStatus, ORDER_STATUSES } from '@/lib/order-status';

const OrderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
        },
        customerEmail: {
            type: String,
            required: false,
            lowercase: true,
        },
        customerName: {
            type: String,
            required: [true, 'Customer name is required.'],
        },
        customerPhone: {
            type: String,
            required: false,
        },
        customerAddress: {
            type: String,
            required: false,
        },
        customerCity: {
            type: String,
            required: false,
        },
        landmark: {
            type: String,
            required: false,
        },
        paymentStatus: {
            type: String,
            enum: ['COD', 'Online'],
            default: 'COD',
        },
        weight: {
            type: Number,
            default: 2,
        },
        manualCodAmount: {
            type: Number,
            required: false,
        },
        itemType: {
            type: String,
            default: 'Mix',
        },
        orderQuantity: {
            type: Number,
            default: 1,
        },
        items: [
            {
                productId: { type: String },
                name: { type: String },
                price: { type: Number },
                quantity: { type: Number, default: 1 },
                image: { type: String },
                isReviewed: { type: Boolean, default: false },
                sourcingVendors: [
                    {
                        vendorId: { type: String, default: '' },
                        name: { type: String, default: '' },
                        shopNumber: { type: String, default: '' },
                        phone: { type: String, default: '' },
                        whatsappNumber: { type: String, default: '' },
                        email: { type: String, default: '' },
                        address: { type: String, default: '' },
                        vendorProductName: { type: String, default: '' },
                        vendorPrice: { type: Number, default: null },
                    },
                ],
            },
        ],
        totalAmount: {
            type: Number,
            required: [true, 'Total amount is required.'],
        },
        isDraft: {
            type: Boolean,
            default: false,
        },
        sourceTag: {
            type: String,
            default: '',
            trim: true,
        },
        status: {
            type: String,
            enum: ORDER_STATUSES,
            default: DEFAULT_ORDER_STATUS,
            set: normalizeOrderStatus,
        },
        courierName: {
            type: String,
            required: false,
        },
        trackingNumber: {
            type: String,
            required: false,
        },
        notes: {
            type: String,
            required: false,
        },
        secureToken: {
            type: String,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ customerEmail: 1, createdAt: -1 });
OrderSchema.index({ secureToken: 1 });
OrderSchema.index({ status: 1, customerEmail: 1, 'items.productId': 1, createdAt: -1 });

// Next.js hot reloading can keep old models in memory. 
// If the cached Order model doesn't have the updated status enum or missing fields, we must delete it to force re-registration.
const cachedOrder = mongoose.models.Order;
if (cachedOrder) {
    const cachedStatuses = cachedOrder.schema.path('status').options.enum || [];
    const hasExpectedStatuses =
        cachedStatuses.length === ORDER_STATUSES.length &&
        ORDER_STATUSES.every((status) => cachedStatuses.includes(status));
    const hasTracking = !!cachedOrder.schema.paths.trackingNumber;
    const hasIsReviewed = !!cachedOrder.schema.path('items').schema.paths.isReviewed;
    const hasSourcingVendors = !!cachedOrder.schema.path('items').schema.paths.sourcingVendors;
    const hasWeight = !!cachedOrder.schema.paths.weight;
    const hasItemType = !!cachedOrder.schema.paths.itemType;
    const hasSecureToken = !!cachedOrder.schema.paths.secureToken;
    const hasIsDraft = !!cachedOrder.schema.paths.isDraft;
    const hasSourceTag = !!cachedOrder.schema.paths.sourceTag;
    
    if (!hasExpectedStatuses || !hasTracking || !hasIsReviewed || !hasSourcingVendors || !hasWeight || !hasItemType || !hasSecureToken || !hasIsDraft || !hasSourceTag) {
        delete mongoose.models.Order;
    }
}

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
