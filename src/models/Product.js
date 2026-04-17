import mongoose from 'mongoose';

const ProductImageSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
            trim: true,
        },
        blurDataURL: {
            type: String,
            default: '',
        },
        publicId: {
            type: String,
            default: '',
            trim: true,
        },
    },
    {
        _id: false,
    }
);

const ProductVendorSchema = new mongoose.Schema(
    {
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: false,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        shopNumber: {
            type: String,
            default: '',
            trim: true,
        },
        phone: {
            type: String,
            default: '',
            trim: true,
        },
        whatsappNumber: {
            type: String,
            default: '',
            trim: true,
        },
        email: {
            type: String,
            default: '',
            trim: true,
            lowercase: true,
        },
        address: {
            type: String,
            default: '',
            trim: true,
        },
        vendorProductName: {
            type: String,
            default: '',
            trim: true,
        },
        vendorPrice: {
            type: Number,
            default: null,
            min: 0,
        },
    },
    {
        _id: false,
    }
);

const ProductSchema = new mongoose.Schema(
    {
        Name: {
            type: String,
            required: [true, 'Please provide a name for this product.'],
            maxlength: [200, 'Name cannot be more than 200 characters'],
        },
        Description: {
            type: String,
            required: false,
        },
        seoTitle: {
            type: String,
            trim: true,
            maxlength: [70, 'SEO title cannot be more than 70 characters'],
            default: '',
        },
        seoDescription: {
            type: String,
            trim: true,
            maxlength: [320, 'SEO description cannot be more than 320 characters'],
            default: '',
        },
        seoKeywords: {
            type: String,
            trim: true,
            maxlength: [250, 'SEO keywords cannot be more than 250 characters'],
            default: '',
        },
        seoCanonicalUrl: {
            type: String,
            trim: true,
            default: '',
        },
        Price: {
            type: Number,
            required: [true, 'Please provide a price.'],
        },
        Images: {
            type: [ProductImageSchema],
            default: []
        },
        Category: {
            type: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category',
            }],
            required: [true, 'Please provide at least one category.'],
            default: [],
        },
        vendors: {
            type: [ProductVendorSchema],
            default: [],
        },
        stockQuantity: {
            type: Number,
            default: 0,
            min: 0,
        },
        StockStatus: {
            type: String,
            enum: ['In Stock', 'Out of Stock'], // Only allow these two values
            required: true,
        },
        slug: {
            type: String,
            required: false,
            unique: true,
        },
        isLive: {
            type: Boolean,
            default: true
        },
        discountPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        isDiscounted: {
            type: Boolean,
            default: false,
        },
        discountedPrice: {
            type: Number,
            default: null,
        },
        isNewArrival: {
            type: Boolean,
            default: false,
        },
        isBestSelling: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

ProductSchema.index({ isLive: 1, createdAt: -1 });
ProductSchema.index({ isLive: 1, Category: 1, createdAt: -1 });
ProductSchema.index({ isLive: 1, slug: 1 });
ProductSchema.index({ isLive: 1, isDiscounted: 1, createdAt: -1 });
ProductSchema.index({ isLive: 1, isNewArrival: 1, createdAt: -1 });
ProductSchema.index({ isLive: 1, isBestSelling: 1, createdAt: -1 });
ProductSchema.index({ 'vendors.name': 1 });
ProductSchema.index({ 'vendors.vendorId': 1 });

const cachedProduct = mongoose.models.Product;
if (
    cachedProduct &&
    (
        !cachedProduct.schema.path('vendors') ||
        !cachedProduct.schema.path('vendors').schema?.path('vendorProductName') ||
        !cachedProduct.schema.path('vendors').schema?.path('vendorPrice') ||
        !cachedProduct.schema.path('vendors').schema?.path('phone') ||
        !cachedProduct.schema.path('vendors').schema?.path('whatsappNumber') ||
        !cachedProduct.schema.path('vendors').schema?.path('email') ||
        !cachedProduct.schema.path('vendors').schema?.path('address')
    )
) {
    delete mongoose.models.Product;
}

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
