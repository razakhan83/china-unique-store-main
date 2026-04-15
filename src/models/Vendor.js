import mongoose from 'mongoose';

const VendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vendor name is required.'],
      trim: true,
      maxlength: [120, 'Vendor name cannot be more than 120 characters'],
    },
    shopNumber: {
      type: String,
      default: '',
      trim: true,
      maxlength: [80, 'Shop number cannot be more than 80 characters'],
    },
  },
  {
    timestamps: true,
  }
);

VendorSchema.index({ name: 1 });

const cachedVendor = mongoose.models.Vendor;
if (
  cachedVendor &&
  (!cachedVendor.schema.path('name') || !cachedVendor.schema.path('shopNumber'))
) {
  delete mongoose.models.Vendor;
}

export default mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);
