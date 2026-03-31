import mongoose from 'mongoose';

const StockRequestSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    productSlug: {
      type: String,
      trim: true,
      default: '',
    },
    productName: {
      type: String,
      required: true,
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
    status: {
      type: String,
      enum: ['pending', 'contacted', 'closed'],
      default: 'pending',
      index: true,
    },
    source: {
      type: String,
      default: 'product-detail',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.StockRequest || mongoose.model('StockRequest', StockRequestSchema);
