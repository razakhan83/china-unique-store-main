import mongoose from 'mongoose';

import Vendor from '@/models/Vendor';

function toTrimmedString(value = '') {
  return String(value || '').trim();
}

export function serializeVendor(vendor) {
  if (!vendor) return null;

  return {
    _id: vendor._id?.toString?.() || '',
    id: vendor._id?.toString?.() || '',
    name: toTrimmedString(vendor.name),
    shopNumber: toTrimmedString(vendor.shopNumber),
    createdAt: vendor.createdAt ? new Date(vendor.createdAt).toISOString() : null,
    updatedAt: vendor.updatedAt ? new Date(vendor.updatedAt).toISOString() : null,
  };
}

export function normalizeVendorSnapshot(entry) {
  if (!entry || typeof entry !== 'object') return null;

  const name = toTrimmedString(entry.name);
  if (!name) return null;

  const vendorId = entry.vendorId
    ? entry.vendorId.toString?.() || toTrimmedString(entry.vendorId)
    : '';

  return {
    vendorId,
    name,
    shopNumber: toTrimmedString(entry.shopNumber),
    vendorProductName: toTrimmedString(entry.vendorProductName),
    vendorPrice:
      entry.vendorPrice === '' || entry.vendorPrice === null || entry.vendorPrice === undefined
        ? null
        : Math.max(0, Number(entry.vendorPrice) || 0),
  };
}

export async function buildProductVendorSnapshots(input = []) {
  const rawEntries = (Array.isArray(input) ? input : [input])
    .map((entry) => {
      if (typeof entry === 'string') {
        return {
          vendorId: toTrimmedString(entry),
          vendorProductName: '',
          vendorPrice: null,
        };
      }

      if (entry && typeof entry === 'object') {
        return {
          vendorId: toTrimmedString(entry.vendorId || entry._id || entry.id),
          vendorProductName: toTrimmedString(entry.vendorProductName),
          vendorPrice:
            entry.vendorPrice === '' || entry.vendorPrice === null || entry.vendorPrice === undefined
              ? null
              : Math.max(0, Number(entry.vendorPrice) || 0),
        };
      }

      return null;
    })
    .filter(Boolean)
    .filter((entry) => mongoose.Types.ObjectId.isValid(entry.vendorId));

  const requestedIds = Array.from(new Set(rawEntries.map((entry) => entry.vendorId)));

  if (requestedIds.length === 0) {
    return [];
  }

  const vendors = await Vendor.find({ _id: { $in: requestedIds } }, 'name shopNumber').lean();
  const vendorMap = new Map(vendors.map((vendor) => [vendor._id.toString(), vendor]));
  const entryMap = new Map(rawEntries.map((entry) => [entry.vendorId, entry]));

  return requestedIds
    .map((id) => {
      const vendor = vendorMap.get(id);
      const rawEntry = entryMap.get(id);
      if (!vendor) return null;

      return {
        vendorId: vendor._id,
        name: toTrimmedString(vendor.name),
        shopNumber: toTrimmedString(vendor.shopNumber),
        vendorProductName: toTrimmedString(rawEntry?.vendorProductName),
        vendorPrice:
          rawEntry?.vendorPrice === null || rawEntry?.vendorPrice === undefined
            ? null
            : Math.max(0, Number(rawEntry.vendorPrice) || 0),
      };
    })
    .filter(Boolean);
}
