import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['order', 'review', 'user'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      id: String, // orderId, productId, userId etc
      userName: String,
      rating: Number,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
