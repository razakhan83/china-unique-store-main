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
    secondaryImage: {
      type: String,
      default: "",
      trim: true,
    },
    secondaryImagePublicId: {
      type: String,
      default: "",
      trim: true,
    },
    secondaryBlurDataURL: {
      type: String,
      default: "",
      trim: true,
    },
    tertiaryImage: {
      type: String,
      default: "",
      trim: true,
    },
    tertiaryImagePublicId: {
      type: String,
      default: "",
      trim: true,
    },
    tertiaryBlurDataURL: {
      type: String,
      default: "",
      trim: true,
    },
    bgColor: {
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

CategorySchema.index({ sortOrder: 1, name: 1 });
CategorySchema.index({ isEnabled: 1, showOnHome: 1, sortOrder: 1, name: 1 });

export default mongoose.models.Category ||
  mongoose.model("Category", CategorySchema);
