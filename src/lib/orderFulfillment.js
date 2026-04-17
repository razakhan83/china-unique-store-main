import mongoose from 'mongoose';

import Product from '@/models/Product';
import Vendor from '@/models/Vendor';
import mongooseConnect from '@/lib/mongooseConnect';
import { normalizeVendorSnapshot } from '@/lib/vendors';

function toCleanId(value = '') {
  return String(value || '').trim();
}

function toCleanString(value = '') {
  return String(value || '').trim();
}

function toSafeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function buildOrderItemsWithSourcing(items = []) {
  await mongooseConnect();

  const normalizedItems = (Array.isArray(items) ? items : [])
    .map((item) => ({
      productId: toCleanId(item.productId || item.id || item.slug),
      name: toCleanString(item.name || item.Name),
      price: toSafeNumber(item.price ?? item.Price),
      quantity: Math.max(1, toSafeNumber(item.quantity, 1)),
      image: toCleanString(item.image || item.imageUrl),
    }))
    .filter((item) => item.productId && item.name);

  if (normalizedItems.length === 0) {
    return [];
  }

  const productIdentifiers = Array.from(new Set(normalizedItems.map((item) => item.productId)));
  const objectIds = productIdentifiers.filter((value) => mongoose.Types.ObjectId.isValid(value));
  const products = await Product.find({
    $or: [
      { slug: { $in: productIdentifiers } },
      ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : []),
    ],
  })
    .select('slug vendors')
    .lean();

  const vendorIds = Array.from(
    new Set(
      products.flatMap((product) =>
        (Array.isArray(product.vendors) ? product.vendors : [])
          .map((vendor) => toCleanId(vendor.vendorId))
          .filter(Boolean)
      )
    )
  ).filter((value) => mongoose.Types.ObjectId.isValid(value));

  const vendors = vendorIds.length > 0
    ? await Vendor.find({ _id: { $in: vendorIds } }, 'name shopNumber phone whatsappNumber email address').lean()
    : [];
  const vendorMap = new Map(vendors.map((vendor) => [vendor._id.toString(), vendor]));

  const productMap = new Map();
  products.forEach((product) => {
    const sourcingVendors = (Array.isArray(product.vendors) ? product.vendors : [])
      .map(normalizeVendorSnapshot)
      .filter(Boolean)
      .map((entry) => {
        const vendor = vendorMap.get(toCleanId(entry.vendorId));
        return {
          vendorId: toCleanId(entry.vendorId),
          name: toCleanString(vendor?.name || entry.name),
          shopNumber: toCleanString(vendor?.shopNumber || entry.shopNumber),
          phone: toCleanString(vendor?.phone || entry.phone),
          whatsappNumber: toCleanString(vendor?.whatsappNumber || entry.whatsappNumber),
          email: toCleanString(vendor?.email || entry.email),
          address: toCleanString(vendor?.address || entry.address),
          vendorProductName: toCleanString(entry.vendorProductName),
          vendorPrice: entry.vendorPrice == null ? null : Math.max(0, toSafeNumber(entry.vendorPrice)),
        };
      });

    productMap.set(product._id.toString(), sourcingVendors);
    if (product.slug) {
      productMap.set(toCleanString(product.slug), sourcingVendors);
    }
  });

  return normalizedItems.map((item) => ({
    ...item,
    sourcingVendors: productMap.get(item.productId) || [],
  }));
}

export async function applyInventoryAdjustments(orderItems = []) {
  await mongooseConnect();

  const requestedAdjustments = new Map();
  for (const item of Array.isArray(orderItems) ? orderItems : []) {
    const productId = toCleanId(item.productId);
    if (!mongoose.Types.ObjectId.isValid(productId)) continue;
    requestedAdjustments.set(
      productId,
      (requestedAdjustments.get(productId) || 0) + Math.max(1, toSafeNumber(item.quantity, 1))
    );
  }

  if (requestedAdjustments.size === 0) {
    return [];
  }

  const products = await Product.find({ _id: { $in: Array.from(requestedAdjustments.keys()) } })
    .select('_id stockQuantity StockStatus')
    .lean();

  const operations = products
    .map((product) => {
      const orderedQuantity = requestedAdjustments.get(product._id.toString()) || 0;
      const currentStock = Math.max(0, toSafeNumber(product.stockQuantity, 0));
      const nextStock = Math.max(0, currentStock - orderedQuantity);

      if (nextStock === currentStock) {
        return null;
      }

      return {
        updateOne: {
          filter: { _id: product._id },
          update: {
            $set: {
              stockQuantity: nextStock,
              ...(nextStock === 0 ? { StockStatus: 'Out of Stock' } : {}),
            },
          },
        },
      };
    })
    .filter(Boolean);

  if (operations.length > 0) {
    await Product.bulkWrite(operations, { ordered: false });
  }

  return operations;
}
