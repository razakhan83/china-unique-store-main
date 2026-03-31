import mongoose from 'mongoose';

const OrderLogSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    previousStatus: String,
    newStatus: String,
    adminName: String,
    adminEmail: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.OrderLog || mongoose.model('OrderLog', OrderLogSchema);
