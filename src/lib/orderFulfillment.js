import mongoose from 'mongoose';

import Product from '@/models/Product';
import Vendor from '@/models/Vendor';
import mongooseConnect from '@/lib/mongooseConnect';
import { normalizeVendorSnapshot } from '@/lib/vendors';
import { normalizeProductImages } from '@/lib/productImages';
import { getActiveSellingPrice, isDiscountActive } from '@/lib/discount';

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

function resolveCheckoutUnitPrice(product, { packLabel = '', variantId = '' } = {}) {
  if (packLabel && Array.isArray(product?.packOptions)) {
    const pack = product.packOptions.find((p) => p.label === packLabel);
    if (pack) {
      const basePackPrice = toSafeNumber(pack.price);
      if (isDiscountActive(product)) {
        const percentage = Number(product?.discountPercentage) || 0;
        if (percentage > 0) {
          return Math.max(0, Math.round(basePackPrice * (1 - percentage / 100)));
        }
      }
      return Math.max(0, basePackPrice);
    }
  }

  if (variantId && Array.isArray(product?.variants)) {
    const variant = product.variants.find((v) => String(v.id || v._id) === String(variantId));
    if (variant && variant.price != null) {
      return Math.max(0, toSafeNumber(variant.price));
    }
  }

  if (isDiscountActive(product)) {
    return Math.max(0, toSafeNumber(getActiveSellingPrice(product)));
  }

  return Math.max(0, toSafeNumber(product?.Price));
}

function buildProductLookupMap(products = []) {
  const productMap = new Map();

  for (const product of products) {
    productMap.set(product._id.toString(), product);
    if (product.slug) {
      productMap.set(toCleanString(product.slug), product);
    }
  }

  return productMap;
}

export async function buildOrderItemsWithSourcing(items = []) {
  await mongooseConnect();

  const requestedItems = (Array.isArray(items) ? items : [])
    .map((item) => ({
      productId: toCleanId(item.slug || item.productId || item._id || item.id),
      quantity: Math.max(1, toSafeNumber(item.quantity, 1)),
      packLabel: toCleanString(item.packLabel || ''),
      variantId: toCleanString(item.variantId || ''),
      variantName: toCleanString(item.variantName || ''),
      name: toCleanString(item.name || ''),
      price: toSafeNumber(item.price, 0),
      image: toCleanString(item.image || ''),
    }))
    .filter((item) => item.productId);

  if (requestedItems.length === 0) {
    return [];
  }

  const customItems = [];
  const dbItems = [];

  requestedItems.forEach(item => {
    const pid = String(item.productId || '').toLowerCase();
    if (pid.startsWith('custom-') || pid.startsWith('unknown-')) {
      customItems.push({
        productId: item.productId,
        name: item.name,
        price: item.price,
        packLabel: item.packLabel,
        variantId: item.variantId,
        variantName: item.variantName,
        quantity: item.quantity,
        image: item.image,
        sourcingVendors: [],
      });
    } else {
      dbItems.push(item);
    }
  });

  const productIdentifiers = Array.from(new Set(dbItems.map((item) => item.productId)));
  const objectIds = productIdentifiers.filter((value) => mongoose.Types.ObjectId.isValid(value));
  const products = await Product.find({
    $or: [
      { slug: { $in: productIdentifiers } },
      ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : []),
    ],
  })
    .select('slug Name Price discountedPrice isDiscounted discountPercentage discountType discountEndsAt isFreeDelivery vendors Images packOptions variants')
    .lean();
  const productMap = buildProductLookupMap(products);

  const missingProductIds = dbItems
    .map((item) => item.productId)
    .filter((productId) => !productMap.has(productId));
  if (missingProductIds.length > 0) {
    throw new Error(`Some checkout items are no longer available: ${missingProductIds.join(', ')}`);
  }

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

  const sourcingMap = new Map();
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

    sourcingMap.set(product._id.toString(), sourcingVendors);
    if (product.slug) {
      sourcingMap.set(toCleanString(product.slug), sourcingVendors);
    }
  });

  const resolvedDbItems = dbItems.map((item) => {
    const product = productMap.get(item.productId);
    const images = normalizeProductImages(product.Images);
    
    let finalName = toCleanString(product.Name);
    if (item.packLabel && !finalName.includes(`(${item.packLabel})`)) {
      finalName = `${finalName} (${item.packLabel})`;
    } else if (item.variantName && !finalName.includes(`(${item.variantName})`)) {
      finalName = `${finalName} (${item.variantName})`;
    }

    return {
      productId: product._id ? product._id.toString() : item.productId,
      _id: product._id ? product._id.toString() : item.productId,
      slug: product.slug || '',
      name: finalName,
      price: resolveCheckoutUnitPrice(product, { packLabel: item.packLabel, variantId: item.variantId }),
      packLabel: item.packLabel,
      variantId: item.variantId || '',
      variantName: item.variantName || '',
      quantity: item.quantity,
      image: toCleanString(images[0]?.url),
      sourcingVendors: sourcingMap.get(item.productId) || [],
      isFreeDelivery: Boolean(product.isFreeDelivery),
    };
  });

  return [...resolvedDbItems, ...customItems];
}

export function calculateOrderTotal(orderItems = []) {
  return (Array.isArray(orderItems) ? orderItems : []).reduce(
    (sum, item) => sum + Math.max(0, toSafeNumber(item.price)) * Math.max(1, toSafeNumber(item.quantity, 1)),
    0
  );
}

export async function applyInventoryAdjustments(orderItems = []) {
  await mongooseConnect();

  const operations = [];
  const productIds = new Set();

  for (const item of Array.isArray(orderItems) ? orderItems : []) {
    const productId = toCleanId(item.productId || item._id);
    if (!mongoose.Types.ObjectId.isValid(productId)) continue;
    const quantity = Math.max(1, toSafeNumber(item.quantity, 1));
    const variantId = toCleanString(item.variantId);

    productIds.add(productId);

    if (variantId) {
      operations.push({
        updateOne: {
          filter: {
            _id: new mongoose.Types.ObjectId(productId),
          },
          update: {
            $inc: {
              stockQuantity: -quantity,
              'variants.$[elem].stockQuantity': -quantity,
            },
          },
          arrayFilters: [{ 'elem.id': variantId }],
        },
      });
    } else {
      operations.push({
        updateOne: {
          filter: {
            _id: new mongoose.Types.ObjectId(productId),
          },
          update: {
            $inc: {
              stockQuantity: -quantity,
            },
          },
        },
      });
    }
  }

  if (operations.length === 0) {
    return [];
  }

  await Product.bulkWrite(operations, { ordered: false });

  // Update StockStatus and clamp negative stock to 0
  await Product.updateMany(
    { _id: { $in: Array.from(productIds).map((id) => new mongoose.Types.ObjectId(id)) } },
    [
      {
        $set: {
          stockQuantity: { $max: [0, '$stockQuantity'] },
          variants: {
            $map: {
              input: { $ifNull: ['$variants', []] },
              as: 'v',
              in: {
                $mergeObjects: [
                  '$$v',
                  { stockQuantity: { $max: [0, { $ifNull: ['$$v.stockQuantity', 0] }] } },
                ],
              },
            },
          },
        },
      },
      {
        $set: {
          StockStatus: {
            $cond: [{ $lte: ['$stockQuantity', 0] }, 'Out of Stock', 'In Stock'],
          },
        },
      },
    ],
    { updatePipeline: true }
  );

  return operations;
}
