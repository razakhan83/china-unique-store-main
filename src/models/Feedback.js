import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['suggestion', 'product-request', 'general'],
      default: 'suggestion',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'read', 'archived'],
      default: 'new',
    },
  },
  {
    timestamps: true,
  }
);

FeedbackSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);
