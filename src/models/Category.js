import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a category name"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    imagePublicId: {
      type: String,
      default: "",
      trim: true,
    },
    blurDataURL: {
      type: String,
      default: "",
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    showOnHome: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.Category ||
  mongoose.model("Category", CategorySchema);
