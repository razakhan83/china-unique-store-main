import 'server-only';
import mongoose from 'mongoose';
import { revalidateTag } from 'next/cache';
import { cacheLife } from 'next/cache';
import { cacheTag } from 'next/cache';

import Category from '@/models/Category';
import CoverPhoto from '@/models/CoverPhoto';
import HomePage from '@/models/HomePage';
import Order from '@/models/Order';
import OrderLog from '@/models/OrderLog';
import Product from '@/models/Product';
import Settings from '@/models/Settings';
import User from '@/models/User';
import mongooseConnect from '@/lib/mongooseConnect';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryImage';
import {
  HOME_PAGE_SINGLETON_KEY,
  HOME_PAGE_PRODUCT_COLLECTIONS,
  normalizeHomePageSections,
} from '@/lib/homePageSections';
import { normalizeEmail, getPhoneRegex } from '@/lib/admin';
import { normalizeVendorSnapshot } from '@/lib/vendors';
import {
  getProductCategories,
  getProductCategoryNames,
  hasProductCategory,
  normalizeCategoryId,
} from '@/lib/productCategories';
import { normalizeProductImages } from '@/lib/productImages';

const SETTINGS_KEY = 'site-settings';
const COVER_PHOTOS_KEY = 'home-cover-photos';
const HOME_MARKETING_SECTIONS = [
  { id: 'special-offers', label: 'Special Offer', iconName: 'Tag' },
  { id: 'new-arrivals', label: 'New Arrivals', iconName: 'Sparkles' },
  { id: 'best-selling', label: 'Best Selling', iconName: 'Trophy' },
];
const HOME_PAGE_PRODUCT_COLLECTION_CONFIG = {
  'new-arrivals': {
    label: 'New Arrivals',
    viewAllHref: '/products?category=new-arrivals',
  },
  'special-offers': {
    label: 'Special Offers',
    viewAllHref: '/products?category=special-offers',
  },
  'top-rated': {
    label: 'Top Rated Products',
    viewAllHref: '',
  },
};
const PRODUCT_CATEGORY_POPULATE = { path: 'Category', select: 'name slug' };
const PRODUCT_CARD_PROJECTION = [
  'Name',
  'Description',
  'Price',
  'Images',
  'Category',
  'StockStatus',
  'slug',
  'isLive',
  'createdAt',
  'updatedAt',
  'discountPercentage',
  'isDiscounted',
  'discountedPrice',
  'isNewArrival',
  'isBestSelling',
].join(' ');
const PRODUCT_DETAIL_PROJECTION = [
  PRODUCT_CARD_PROJECTION,
  'stockQuantity',
  'seoTitle',
  'seoDescription',
  'seoKeywords',
  'seoCanonicalUrl',
  'vendors',
].join(' ');
const PRODUCT_ADMIN_PROJECTION = [
  PRODUCT_CARD_PROJECTION,
  'stockQuantity',
  'vendors',
].join(' ');

function sanitizeSectionOrder(order, fallbackOrder = []) {
  return Array.from(new Set([...(Array.isArray(order) ? order : []), ...fallbackOrder].filter(Boolean)));
}

function normalizeAnnouncementMessages(messages = [], fallbackText = '') {
  const rawMessages = Array.isArray(messages) && messages.length > 0
    ? messages
    : String(fallbackText || '')
        .split(/\r?\n|[|•]+/)
        .map((text) => ({ text }))
        .filter((entry) => String(entry?.text || '').trim());

  return rawMessages
    .map((entry, index) => ({
      id: String(entry?.id || `announcement-${index + 1}`).trim(),
      text: String(entry?.text || '').trim(),
      isActive: entry?.isActive !== false,
    }))
    .filter((entry) => entry.text);
}

function normalizeLogoUrl(value = '') {
  return optimizeCloudinaryUrl(String(value || '').trim(), {
    format: 'auto',
    quality: 'auto',
  });
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeMediaItem(item, sortOrder = 0, fallbackItem = null) {
  if ((!item || typeof item !== 'object') && (!fallbackItem || typeof fallbackItem !== 'object')) return null;

  const source = item && typeof item === 'object' ? item : {};
  const fallback = fallbackItem && typeof fallbackItem === 'object' ? fallbackItem : {};
  const url = String(source.url || source.image || fallback.url || fallback.image || '').trim();
  if (!url) return null;

  return {
    url: optimizeCloudinaryUrl(url),
    publicId: String(source.publicId || source.public_id || fallback.publicId || fallback.public_id || '').trim(),
    blurDataURL: String(source.blurDataURL || fallback.blurDataURL || '').trim(),
    sortOrder: Number(source.sortOrder ?? sortOrder) || 0,
  };
}

function serializeProduct(product) {
  const { Image, ImageURL, ...safeProduct } = product;

  return {
    ...safeProduct,
    _id: safeProduct._id.toString(),
    id: safeProduct.slug || safeProduct._id.toString(),
    slug: safeProduct.slug || safeProduct._id.toString(),
    Category: getProductCategories(safeProduct),
    Images: normalizeProductImages(safeProduct.Images),
    vendors: Array.isArray(safeProduct.vendors)
      ? safeProduct.vendors.map(normalizeVendorSnapshot).filter(Boolean)
      : [],
    createdAt: safeProduct.createdAt ? new Date(safeProduct.createdAt).toISOString() : null,
    updatedAt: safeProduct.updatedAt ? new Date(safeProduct.updatedAt).toISOString() : null,
    isNewArrival: safeProduct.isNewArrival === true,
    isBestSelling: safeProduct.isBestSelling === true,
  };
}

function toProductCardItem(product) {
  return {
    id: product.id,
    _id: product._id,
    slug: product.slug,
    Name: product.Name,
    Price: Number(product.Price || 0),
    Description: product.Description || '',
    Category: product.Category,
    Images: product.Images,
    StockStatus: product.StockStatus || 'Out of Stock',
    createdAt: product.createdAt,
    isLive: product.isLive !== false,
    isNewArrival: product.isNewArrival === true,
    isBestSelling: product.isBestSelling === true,
    averageRating: Number(product.averageRating || 0),
    reviewCount: Number(product.reviewCount || 0),
    discountPercentage: Number(product.discountPercentage || 0),
    isDiscounted: product.isDiscounted === true,
    discountedPrice: product.discountedPrice != null ? Number(product.discountedPrice) : null,
  };
}

function toProductDetailView(product) {
  return {
    id: product.id,
    _id: product._id,
    slug: product.slug,
    Name: product.Name,
    Description: product.Description || '',
    Price: Number(product.Price || 0),
    Category: product.Category,
    Images: product.Images,
    StockStatus: product.StockStatus || 'Out of Stock',
    isLive: product.isLive !== false,
    stockQuantity: Number(product.stockQuantity || 0),
    createdAt: product.createdAt,
    vendors: Array.isArray(product.vendors) ? product.vendors : [],
    discountPercentage: Number(product.discountPercentage || 0),
    isDiscounted: product.isDiscounted === true,
    discountedPrice: product.discountedPrice != null ? Number(product.discountedPrice) : null,
  };
}

function toAdminProductRow(product) {
  return {
    id: product.id,
    _id: product._id,
    slug: product.slug,
    Name: product.Name,
    Price: Number(product.Price || 0),
    Category: product.Category,
    Images: product.Images,
    StockStatus: product.StockStatus || 'Out of Stock',
    stockQuantity: Number(product.stockQuantity || 0),
    isLive: product.isLive !== false,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    isNewArrival: product.isNewArrival === true,
    isBestSelling: product.isBestSelling === true,
    vendors: Array.isArray(product.vendors) ? product.vendors : [],
    discountPercentage: Number(product.discountPercentage || 0),
    isDiscounted: product.isDiscounted === true,
    discountedPrice: product.discountedPrice != null ? Number(product.discountedPrice) : null,
  };
}

function buildCustomerAggregationPipeline({ search = '', skip = 0, limit = 12 } = {}) {
  const safeSearch = String(search || '').trim();
  const searchRegex = safeSearch ? new RegExp(escapeRegex(safeSearch), 'i') : null;

  const pipeline = [];

  if (searchRegex) {
    pipeline.push({
      $match: {
        $or: [
          { customerName: searchRegex },
          { customerEmail: searchRegex },
          { customerPhone: searchRegex },
          { customerCity: searchRegex },
          { customerAddress: searchRegex },
          { orderId: searchRegex },
        ],
      },
    });
  }

  pipeline.push(
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [
            { $ne: [{ $ifNull: ['$customerEmail', ''] }, ''] },
            { $ifNull: ['$customerEmail', ''] },
            {
              $cond: [
                { $ne: [{ $ifNull: ['$customerPhone', ''] }, ''] },
                { $ifNull: ['$customerPhone', ''] },
                { $toString: '$_id' },
              ],
            },
          ],
        },
        name: { $first: '$customerName' },
        email: { $first: { $ifNull: ['$customerEmail', ''] } },
        phone: { $first: '$customerPhone' },
        city: { $first: '$customerCity' },
        address: { $first: '$customerAddress' },
        landmark: { $first: '$landmark' },
        lastOrderAt: { $max: '$createdAt' },
        firstOrderAt: { $min: '$createdAt' },
        ordersCount: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
      },
    },
    { $sort: { lastOrderAt: -1 } },
    {
      $facet: {
        items: [
          { $skip: skip },
          { $limit: limit },
        ],
        totalCount: [{ $count: 'count' }],
        summary: [
          {
            $group: {
              _id: null,
              totalCustomers: { $sum: 1 },
              withEmail: {
                $sum: {
                  $cond: [{ $ne: ['$email', ''] }, 1, 0],
                },
              },
              withPhone: {
                $sum: {
                  $cond: [{ $ne: ['$phone', ''] }, 1, 0],
                },
              },
              withAddress: {
                $sum: {
                  $cond: [{ $ne: ['$address', ''] }, 1, 0],
                },
              },
            },
          },
        ],
      },
    },
  );

  return pipeline;
}

function toOrderSummaryRow(order) {
  return {
    _id: order._id.toString(),
    orderId: order.orderId,
    customerName: order.customerName,
    customerEmail: order.customerEmail || '',
    customerPhone: order.customerPhone || '',
    customerAddress: order.customerAddress || '',
    customerCity: order.customerCity || '',
    landmark: order.landmark || '',
    paymentStatus: order.paymentStatus || 'COD',
    weight: Number(order.weight ?? 2),
    manualCodAmount: order.manualCodAmount,
    itemType: order.itemType || 'Mix',
    orderQuantity: Number(order.orderQuantity || 1),
    totalAmount: Number(order.totalAmount || 0),
    status: order.status,
    notes: order.notes || '',
    courierName: order.courierName || '',
    trackingNumber: order.trackingNumber || '',
    items: Array.isArray(order.items)
      ? order.items.map((item) => ({
          ...item,
          _id: item._id?.toString(),
          productId: item.productId?.toString() || item.productId,
          sourcingVendors: Array.isArray(item.sourcingVendors)
            ? item.sourcingVendors.map((vendor) => ({
                ...vendor,
                vendorId: vendor?.vendorId?.toString?.() || vendor?.vendorId || '',
              }))
            : [],
        }))
      : [],
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : null,
    updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : null,
  };
}

async function getLiveProductsRaw() {
  await mongooseConnect();

  const products = await Product.find({ isLive: true })
    .select(PRODUCT_CARD_PROJECTION)
    .populate(PRODUCT_CATEGORY_POPULATE)
    .sort({ createdAt: -1 })
    .lean();
  return products.map(serializeProduct);
}

async function getAllProductsRaw() {
  await mongooseConnect();

  const products = await Product.find({})
    .select(PRODUCT_ADMIN_PROJECTION)
    .populate(PRODUCT_CATEGORY_POPULATE)
    .sort({ createdAt: -1 })
    .lean();
  return products.map(serializeProduct);
}

async function getSettingsRaw() {
  await mongooseConnect();

  let settings = await Settings.findOne({ singletonKey: SETTINGS_KEY }).lean();
  if (!settings) {
    settings = await Settings.create({ singletonKey: SETTINGS_KEY });
    settings = settings.toObject();
  }

  return {
    _id: settings._id.toString(),
    storeName: settings.storeName || 'China Unique Store',
    supportEmail: settings.supportEmail || '',
    businessAddress: settings.businessAddress || '',
    lightLogoUrl: normalizeLogoUrl(settings.lightLogoUrl),
    darkLogoUrl: normalizeLogoUrl(settings.darkLogoUrl),
    logoScalePercent: Math.min(200, Math.max(60, Number(settings.logoScalePercent || 100))),
    whatsappNumber: settings.whatsappNumber || '',
    facebookPageUrl: settings.facebookPageUrl || '',
    instagramUrl: settings.instagramUrl || '',
    trackingEnabled: settings.trackingEnabled === true,
    facebookPixelId: settings.facebookPixelId || '',
    tiktokPixelId: settings.tiktokPixelId || '',
    karachiDeliveryFee: Number(settings.karachiDeliveryFee || 200),
    outsideKarachiDeliveryFee: Number(settings.outsideKarachiDeliveryFee || 250),
    freeShippingThreshold: Number(settings.freeShippingThreshold || 3000),
    announcementBarEnabled: settings.announcementBarEnabled ?? true,
    announcementBarText: settings.announcementBarText || '',
    announcementBarMessages: normalizeAnnouncementMessages(settings.announcementBarMessages, settings.announcementBarText),
    homepageSectionOrder: Array.isArray(settings.homepageSectionOrder) ? settings.homepageSectionOrder : [],
  };
}

async function getCoverPhotosRaw() {
  await mongooseConnect();

  let coverPhoto = await CoverPhoto.findOne({ singletonKey: COVER_PHOTOS_KEY }).lean();
  if (!coverPhoto) {
    coverPhoto = await CoverPhoto.create({ singletonKey: COVER_PHOTOS_KEY });
    coverPhoto = coverPhoto.toObject();
  }

  return Array.isArray(coverPhoto.slides)
    ? coverPhoto.slides
        .map((item, index) => {
          const desktopImage = normalizeMediaItem(
            item.desktopImage || {
              url: item.url,
              publicId: item.publicId,
              blurDataURL: item.blurDataURL,
            },
            index,
          );
          if (!desktopImage) return null;
          const tabletImage = normalizeMediaItem(item.tabletImage, index, desktopImage);
          const mobileImage = normalizeMediaItem(item.mobileImage, index, desktopImage);

          return {
            desktopImage,
            tabletImage,
            mobileImage,
            alt: String(item.alt || '').trim(),
            sortOrder: Number(item.sortOrder ?? index) || 0,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
}

async function getCategoriesRaw() {
  await mongooseConnect();

  // Sort by sortOrder first (admin-defined order), then by name as fallback
  const dbCategories = await Category.find({}).sort({ sortOrder: 1, name: 1 }).lean();
  let mappedCategories = [];
  if (dbCategories.length > 0) {
    mappedCategories = dbCategories.map((category) => ({
      _id: category._id.toString(),
      id: category.slug || normalizeCategoryId(category.name),
      label: category.name,
      image: optimizeCloudinaryUrl(category.image || ''),
      imagePublicId: category.imagePublicId || '',
      blurDataURL: category.blurDataURL || '',
      sortOrder: category.sortOrder ?? 0,
      isEnabled: category.isEnabled !== false,
      showOnHome: category.showOnHome !== false,
    }));
  }

  // Ensure special-offers is always in the list for the homepage sections
  if (!mappedCategories.some(c => c.id === 'special-offers')) {
    mappedCategories.unshift({
      _id: 'special-offers',
      id: 'special-offers',
      label: 'Special Offers',
      image: '',
      imagePublicId: '',
      blurDataURL: '',
      sortOrder: 0,
      isEnabled: true,
      showOnHome: true,
    });
  }
  
  if (mappedCategories.length > 0) {
    return mappedCategories;
  }

  const products = await getLiveProductsRaw();
  const categoryMap = new Map();

  for (const product of products) {
    for (const category of getProductCategories(product)) {
      const trimmed = String(category.name || '').trim();
      if (!trimmed) continue;
      const id = category.id || normalizeCategoryId(trimmed);
      if (!categoryMap.has(id)) {
        categoryMap.set(id, {
          id,
          label: trimmed,
          image: '',
          imagePublicId: '',
          blurDataURL: '',
          showOnHome: true,
        });
      }
    }
  }

  return Array.from(categoryMap.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function buildDefaultHomePageSections({ categories = [], coverPhotos = [] } = {}) {
  const activeCategories = categories.filter(
    (category) => category.isEnabled !== false && category.id !== 'special-offers',
  );

  const sections = [];

  if (coverPhotos.length > 0) {
    sections.push({
      id: 'hero-slider-default',
      type: 'HeroSlider',
      order: sections.length,
      title: 'Hero Slider',
      slides: coverPhotos.map((slide, index) => ({
        desktopImage: slide.desktopImage,
        tabletImage: slide.tabletImage,
        mobileImage: slide.mobileImage || slide.tabletImage || slide.desktopImage,
        alt: slide.alt || `Store cover ${index + 1}`,
        sortOrder: index,
      })),
    });
  }

  sections.push({
    id: 'categories-grid-default',
    type: 'CategoriesGrid',
    order: sections.length,
    title: 'Shop by Category',
  });

  HOME_PAGE_PRODUCT_COLLECTIONS.forEach((collectionKey) => {
    sections.push({
      id: `collection-${collectionKey}`,
      type: 'ProductCollection',
      order: sections.length,
      title: HOME_PAGE_PRODUCT_COLLECTION_CONFIG[collectionKey]?.label || '',
      collectionKey,
      productLimit: 8,
    });
  });

  activeCategories.forEach((category) => {
    sections.push({
      id: `category-${category.id}`,
      type: 'ProductGridByCategory',
      order: sections.length,
      title: category.label,
      categoryId: category._id,
      productLimit: 8,
    });
  });

  return normalizeHomePageSections(sections);
}

async function getHomePageRaw() {
  await mongooseConnect();

  let homePage = await HomePage.findOne({ singletonKey: HOME_PAGE_SINGLETON_KEY }).lean();

  if (!homePage) {
    const [categories, coverPhotos] = await Promise.all([getCategoriesRaw(), getCoverPhotosRaw()]);
    homePage = await HomePage.create({
      singletonKey: HOME_PAGE_SINGLETON_KEY,
      sections: buildDefaultHomePageSections({ categories, coverPhotos }),
    });
    homePage = homePage.toObject();
  }

  return {
    _id: homePage._id.toString(),
    sections: normalizeHomePageSections(homePage.sections),
  };
}

async function getProductsForHomeCategorySectionsRaw(categoryIds = []) {
  const uniqueIds = Array.from(new Set((Array.isArray(categoryIds) ? categoryIds : []).filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  await mongooseConnect();

  const products = await Product.find({
    isLive: true,
    Category: { $in: uniqueIds },
  })
    .select(PRODUCT_CARD_PROJECTION)
    .populate(PRODUCT_CATEGORY_POPULATE)
    .sort({ createdAt: -1 })
    .lean();

  return products.map(serializeProduct);
}

async function getProductsForHomeCollectionSectionsRaw(collectionKeys = [], limitByCollection = new Map()) {
  const uniqueKeys = Array.from(
    new Set((Array.isArray(collectionKeys) ? collectionKeys : []).filter((key) => HOME_PAGE_PRODUCT_COLLECTIONS.includes(key))),
  );
  if (uniqueKeys.length === 0) return new Map();

  await mongooseConnect();

  const results = new Map();

  const fetchFlaggedProducts = async (filter, sort, collectionKey) => {
    const requestedLimit = Math.max(1, Number(limitByCollection.get(collectionKey) || 8));
    const products = await Product.find({
      isLive: true,
      ...filter,
    })
      .select(PRODUCT_CARD_PROJECTION)
      .populate(PRODUCT_CATEGORY_POPULATE)
      .sort(sort)
      .limit(Math.min(24, requestedLimit))
      .lean();

    results.set(collectionKey, products.map((product) => toProductCardItem(serializeProduct(product))));
  };

  await Promise.all(
    uniqueKeys
      .filter((key) => key === 'new-arrivals' || key === 'special-offers')
      .map((key) => {
        if (key === 'new-arrivals') {
          return fetchFlaggedProducts({ isNewArrival: true }, { createdAt: -1 }, key);
        }

        return fetchFlaggedProducts({ isDiscounted: true }, { createdAt: -1 }, key);
      }),
  );

  if (uniqueKeys.includes('top-rated')) {
    const Review = (await import('@/models/Review')).default;
    const requestedLimit = Math.max(1, Number(limitByCollection.get('top-rated') || 8));
    const reviewSummaries = await Review.aggregate([
      { $match: { isApproved: true } },
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
      { $sort: { averageRating: -1, reviewCount: -1, _id: 1 } },
      { $limit: Math.max(requestedLimit * 4, 24) },
    ]);

    const productIds = reviewSummaries.map((entry) => entry._id).filter(Boolean);
    const topRatedProducts = productIds.length > 0
      ? await Product.find({
          _id: { $in: productIds },
          isLive: true,
        })
          .select(PRODUCT_CARD_PROJECTION)
          .populate(PRODUCT_CATEGORY_POPULATE)
          .lean()
      : [];

    const productMap = new Map(
      topRatedProducts.map((product) => {
        const serialized = serializeProduct(product);
        return [serialized._id, serialized];
      }),
    );

    const items = reviewSummaries
      .map((summary) => {
        const product = productMap.get(String(summary._id));
        if (!product) return null;

        return toProductCardItem({
          ...product,
          averageRating: Number(summary.averageRating || 0),
          reviewCount: Number(summary.reviewCount || 0),
        });
      })
      .filter(Boolean)
      .slice(0, Math.min(24, requestedLimit));

    results.set('top-rated', items);
  }

  return results;
}

export async function getStoreSettings() {
  'use cache';
  cacheLife('foreverish');
  cacheTag('settings');
  return getSettingsRaw();
}

export async function getAdminCoverPhotos() {
  await mongooseConnect();

  let coverPhoto = await CoverPhoto.findOne({ singletonKey: COVER_PHOTOS_KEY }).lean();
  if (!coverPhoto) {
    coverPhoto = await CoverPhoto.create({ singletonKey: COVER_PHOTOS_KEY });
    coverPhoto = coverPhoto.toObject();
  }

  return Array.isArray(coverPhoto.slides)
    ? coverPhoto.slides
        .map((item, index) => {
          const desktopImage = normalizeMediaItem(
            item.desktopImage || {
              url: item.url,
              publicId: item.publicId,
              blurDataURL: item.blurDataURL,
            },
            index,
          );
          if (!desktopImage) return null;
          const tabletImage = normalizeMediaItem(item.tabletImage, index, desktopImage);
          const mobileImage = normalizeMediaItem(item.mobileImage, index, desktopImage);

          return {
            desktopImage,
            tabletImage,
            mobileImage,
            alt: String(item.alt || '').trim(),
            sortOrder: Number(item.sortOrder ?? index) || 0,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
}

export async function getStoreCategories() {
  'use cache';
  cacheLife('foreverish');
  cacheTag('categories');
  const categories = await getCategoriesRaw();
  return categories.filter((category) => category.isEnabled !== false && category.id !== 'special-offers');
}

export async function getHomeSections() {
  'use cache';
  cacheLife('foreverish');
  cacheTag('home-sections', 'products', 'categories', 'cover-photos');
  const [products, categories, coverPhotos, settings] = await Promise.all([
    getLiveProductsRaw(),
    getCategoriesRaw(),
    getCoverPhotosRaw(),
    getSettingsRaw(),
  ]);
  const featuredProducts = products.slice(0, 8).map(toProductCardItem);
  const sections = categories
    .map((category) => {
      let items;
      let label = category?.label || 'Special Offers';
      if (category.id === 'special-offers') {
        const discountedProducts = products
          .filter((product) => product.isDiscounted === true)
          .sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 12)
          .map(toProductCardItem);
        
        items = discountedProducts;
        
        // Ensure the label is clean
        if (label.includes('🏷️')) {
          category.label = label.replace(' 🏷️', '');
        }
        category.iconName = 'Tag';
      } else {
        items = products
          .filter((product) => hasProductCategory(product, category.id))
          .slice(0, 8)
          .map(toProductCardItem);
      }

      return {
        category,
        products: items,
      };
    })
    .filter((section) => 
      (
        section.category.id === 'special-offers' ||
        section.category.showOnHome !== false
      ) &&
      (section.category.id === 'special-offers' || section.products.length > 0)
    );

  // Add the dynamic marketing sections (New Arrivals, Trending, Best Selling)
  const marketingSections = [
    { id: 'new-arrivals', label: 'New Arrivals', flag: 'isNewArrival', iconName: 'Sparkles' },
    { id: 'best-selling', label: 'Best Selling', flag: 'isBestSelling', iconName: 'Trophy' },
  ].map(m => {
    const items = products
      .filter(p => p[m.flag] === true)
      .slice(0, 8)
      .map(toProductCardItem);
    
    if (items.length === 0) return null;

    return {
      category: {
        id: m.id,
        label: m.label,
        iconName: m.iconName,
        image: '',
        isEnabled: true,
      },
      products: items
    };
  }).filter(Boolean);

  const defaultOrder = [
    ...HOME_MARKETING_SECTIONS.map((section) => section.id),
    ...categories
      .filter((category) => !HOME_MARKETING_SECTIONS.some((section) => section.id === category.id))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => category.id),
  ];
  const fullOrder = sanitizeSectionOrder(settings.homepageSectionOrder, defaultOrder);

  const sectionMap = new Map(
    [...sections, ...marketingSections].map((section) => [section.category.id, section])
  );
  const orderedSections = fullOrder
    .map((id) => sectionMap.get(id))
    .filter(Boolean);
  const remainingSections = [...sectionMap.values()].filter(
    (section) => !fullOrder.includes(section.category.id)
  );
  const finalSections = [...orderedSections, ...remainingSections];

  return {
    categories: categories.filter((category) => category.isEnabled !== false && category.id !== 'special-offers'),
    coverPhotos,
    featuredProducts,
    sections: finalSections,
  };
}

export async function getAdminHomePageBuilderData() {
  const [homePage, categories] = await Promise.all([getHomePageRaw(), getCategoriesRaw()]);

  return {
    sections: homePage.sections,
    categories: categories
      .filter((category) => category.isEnabled !== false && category.id !== 'special-offers')
      .map((category) => ({
        _id: category._id,
        id: category.id,
        label: category.label,
      })),
  };
}

export async function getStorefrontHomePage() {
  'use cache';
  cacheLife('foreverish');
  cacheTag('home-page', 'home-sections', 'products', 'categories');

  const [homePage, categories] = await Promise.all([getHomePageRaw(), getCategoriesRaw()]);
  const activeCategories = categories.filter(
    (category) => category.isEnabled !== false && category.id !== 'special-offers',
  );
  const categoryMap = new Map(categories.map((category) => [category._id, category]));
  const categorySectionIds = homePage.sections
    .filter((section) => section.isEnabled !== false && section.type === 'ProductGridByCategory')
    .map((section) => section.categoryId)
    .filter(Boolean);
  const collectionSections = homePage.sections.filter(
    (section) => section.isEnabled !== false && section.type === 'ProductCollection',
  );
  const collectionLimitMap = new Map();
  collectionSections.forEach((section) => {
    const currentLimit = Number(collectionLimitMap.get(section.collectionKey) || 0);
    collectionLimitMap.set(
      section.collectionKey,
      Math.max(currentLimit, Number(section.productLimit || 8)),
    );
  });
  const categoryProducts = await getProductsForHomeCategorySectionsRaw(categorySectionIds);
  const collectionProductsMap = await getProductsForHomeCollectionSectionsRaw(
    collectionSections.map((section) => section.collectionKey),
    collectionLimitMap,
  );
  const productsByCategoryId = new Map();

  for (const product of categoryProducts) {
    const cardItem = toProductCardItem(product);

    for (const category of getProductCategories(product)) {
      const categoryId = String(category._id || '');
      if (!categoryId || !categorySectionIds.includes(categoryId)) continue;

      if (!productsByCategoryId.has(categoryId)) {
        productsByCategoryId.set(categoryId, []);
      }

      const items = productsByCategoryId.get(categoryId);
      if (!items.some((item) => item._id === cardItem._id)) {
        items.push(cardItem);
      }
    }
  }

  const sections = homePage.sections
    .filter((section) => section.isEnabled !== false)
    .map((section) => {
      if (section.type === 'HeroSlider') {
        const slides = Array.isArray(section.slides)
          ? section.slides.filter((slide) => slide?.desktopImage?.url && slide?.mobileImage?.url)
          : [];

        return slides.length > 0 ? { ...section, slides } : null;
      }

      if (section.type === 'CategoriesGrid') {
        return activeCategories.length > 0 ? { ...section, categories: activeCategories } : null;
      }

      if (section.type === 'ProductBanner') {
        const desktopImages = Array.isArray(section.desktopImages)
          ? section.desktopImages.filter((item) => item?.image?.url).slice(0, 2)
          : [];
        const mobileImage = section.mobileImage?.image?.url ? section.mobileImage : null;

        return desktopImages.length === 2 && mobileImage
          ? {
              ...section,
              desktopImages,
              mobileImage,
            }
          : null;
      }

      if (section.type === 'ScrollableBannerCarousel') {
        const carouselBanners = Array.isArray(section.carouselBanners)
          ? section.carouselBanners.filter((item) => item?.image?.url)
          : [];

        return carouselBanners.length > 0
          ? {
              ...section,
              carouselBanners,
            }
          : null;
      }

      if (section.type === 'ProductGridByCategory') {
        const category = categoryMap.get(section.categoryId);
        if (!category || category.isEnabled === false) return null;

        const products = (productsByCategoryId.get(section.categoryId) || []).slice(0, section.productLimit || 8);
        if (products.length === 0) return null;

        return {
          ...section,
          category,
          products,
        };
      }

      if (section.type === 'ProductCollection') {
        const collectionKey = HOME_PAGE_PRODUCT_COLLECTIONS.includes(section.collectionKey)
          ? section.collectionKey
          : 'new-arrivals';
        const config = HOME_PAGE_PRODUCT_COLLECTION_CONFIG[collectionKey];
        const products = (collectionProductsMap.get(collectionKey) || []).slice(0, section.productLimit || 8);

        if (!config || products.length === 0) return null;

        return {
          ...section,
          collectionKey,
          title: section.title || config.label,
          viewAllHref: config.viewAllHref || '',
          products,
        };
      }

      return null;
    })
    .filter(Boolean);

  return { sections };
}

export async function getProductsList({ category = 'all', search = '', sort = 'newest', page = 1, limit = 12 } = {}) {
  'use cache';
  cacheLife('foreverish');
  cacheTag('products', 'categories');

  await mongooseConnect();

  const safeCategory = String(category || 'all').trim() || 'all';
  const safeSearch = String(search || '').trim();
  const safeSort = String(sort || 'newest').trim() || 'newest';
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 12);

  const query = { isLive: true };

  if (safeCategory === 'new-arrivals') {
    query.isNewArrival = true;
  } else if (safeCategory === 'best-selling') {
    query.isBestSelling = true;
  } else if (safeCategory === 'special-offers') {
    query.isDiscounted = true;
  } else if (safeCategory && safeCategory !== 'all') {
    const categories = await getCategoriesRaw();
    const matchedCategory = categories.find((entry) => entry.id === safeCategory);
    if (!matchedCategory?._id) {
      return {
        items: [],
        total: 0,
        page: safePage,
        limit: safeLimit,
        hasMore: false,
        totalPages: 0,
        activeCategory: safeCategory,
        searchTerm: safeSearch,
        sort: safeSort,
      };
    }

    query.Category = matchedCategory._id;
  }

  if (safeSearch) {
    const searchRegex = new RegExp(escapeRegex(safeSearch), 'i');
    const matchingCategories = await Category.find(
      {
        $or: [
          { name: searchRegex },
          { slug: searchRegex },
        ],
      },
      '_id',
    ).lean();

    const matchingCategoryIds = matchingCategories.map((entry) => entry._id);
    query.$or = [{ Name: searchRegex }];
    if (matchingCategoryIds.length > 0) {
      query.$or.push({ Category: { $in: matchingCategoryIds } });
    }
  }

  const sortQuery = (() => {
    if (safeSort === 'price-low') return { Price: 1, createdAt: -1 };
    if (safeSort === 'price-high') return { Price: -1, createdAt: -1 };
    if (safeSort === 'az') return { Name: 1, createdAt: -1 };
    if (safeSort === 'za') return { Name: -1, createdAt: -1 };
    return { createdAt: -1 };
  })();

  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    Product.find(query)
      .select(PRODUCT_CARD_PROJECTION)
      .populate(PRODUCT_CATEGORY_POPULATE)
      .sort(sortQuery)
      .skip(skip)
      .limit(safeLimit)
      .lean()
      .then((products) => products.map(serializeProduct).map(toProductCardItem)),
    Product.countDocuments(query),
  ]);

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    hasMore: skip + safeLimit < total,
    totalPages: Math.ceil(total / safeLimit),
    activeCategory: safeCategory,
    searchTerm: safeSearch,
    sort: safeSort,
  };
}

export async function getApprovedReviews(productId) {
  'use cache';
  cacheLife('foreverish');
  cacheTag(`reviews-${productId}`);

  const safeProductId = String(productId || '').trim();
  if (!safeProductId) return [];

  await mongooseConnect();
  const Review = (await import('@/models/Review')).default;

  // Cast to ObjectId when valid so Mongoose can use the indexed ObjectId field correctly
  const queryId = mongoose.Types.ObjectId.isValid(safeProductId)
    ? new mongoose.Types.ObjectId(safeProductId)
    : safeProductId;

  const reviews = await Review.find({ productId: queryId, isApproved: true })
    .sort({ createdAt: -1 })
    .lean();

  return reviews.map((review) => ({
    ...review,
    _id: review._id.toString(),
    productId: review.productId?.toString?.() || safeProductId,
    userId: review.userId?.toString?.() || null,
    createdAt: review.createdAt ? new Date(review.createdAt).toISOString() : null,
    updatedAt: review.updatedAt ? new Date(review.updatedAt).toISOString() : null,
  }));
}

export async function getProductReviewSummary(productId) {
  'use cache';
  cacheLife('foreverish');
  cacheTag(`reviews-${productId}`);

  const safeProductId = String(productId || '').trim();
  if (!safeProductId) {
    return {
      averageRating: 0,
      reviewCount: 0,
    };
  }

  await mongooseConnect();
  const Review = (await import('@/models/Review')).default;

  const queryId = mongoose.Types.ObjectId.isValid(safeProductId)
    ? new mongoose.Types.ObjectId(safeProductId)
    : safeProductId;

  const [summary] = await Review.aggregate([
    { $match: { productId: queryId, isApproved: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  return {
    averageRating: Number(summary?.averageRating || 0),
    reviewCount: Number(summary?.reviewCount || 0),
  };
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatFeedPrice(value) {
  const amount = Number(value || 0);
  return `${amount.toFixed(2)} PKR`;
}

function getCatalogSiteUrl() {
  const configuredUrl = String(process.env.NEXTAUTH_URL || '').trim();
  if (configuredUrl && !/localhost/i.test(configuredUrl)) {
    return configuredUrl.replace(/\/$/, '');
  }

  return 'https://china-unique-items.vercel.app';
}

function buildCatalogFeedItem(product, siteUrl, storeName) {
  const productUrl = `${siteUrl}/products/${product.slug || product._id}`;
  const primaryImage = product.Images?.[0]?.url || `${siteUrl}/opengraph-image.png`;
  const additionalImages = product.Images?.slice(1).map((image) => image.url).filter(Boolean) || [];
  const categoryNames = getProductCategoryNames(product);
  const basePrice = Number(product.Price || 0);
  const salePrice = product.isDiscounted === true && product.discountedPrice != null
    ? Number(product.discountedPrice)
    : null;

  return {
    id: product.slug || product._id,
    title: product.Name,
    description: stripHtml(product.Description || `Buy ${product.Name} from ${storeName}.`),
    availability: product.StockStatus === 'In Stock' ? 'in stock' : 'out of stock',
    condition: 'new',
    price: formatFeedPrice(basePrice),
    salePrice: salePrice != null ? formatFeedPrice(salePrice) : null,
    link: productUrl,
    imageLink: primaryImage,
    additionalImageLinks: additionalImages,
    brand: storeName,
    productType: categoryNames.join(' > '),
  };
}

export async function getProductBySlug(slug) {
  const safeSlug = String(slug || '').trim();
  if (!safeSlug) return null;

  async function getSingleProduct(productSlug) {
    try {
      await mongooseConnect();
      
      // 1. Try finding by slug first (vanity URL)
      let product = await Product.findOne({ slug: productSlug, isLive: true })
        .select(PRODUCT_DETAIL_PROJECTION)
        .populate(PRODUCT_CATEGORY_POPULATE)
        .lean();
      
      // 2. If not found, and it looks like a Mongo ID, try finding by ID
      if (!product && mongoose.Types.ObjectId.isValid(productSlug)) {
        product = await Product.findOne({ _id: productSlug, isLive: true })
          .select(PRODUCT_DETAIL_PROJECTION)
          .populate(PRODUCT_CATEGORY_POPULATE)
          .lean();
      }
      
      return product ? serializeProduct(product) : null;
    } catch (error) {
      console.error(`❌ [DATA] Error fetching product "${productSlug}":`, error.message);
      throw error;
    }
  }

  try {
    const product = await getSingleProduct(safeSlug);
    return product ? toProductDetailView(product) : null;
  } catch (error) {
    console.error(`❌ [DATA] getProductBySlug failed for "${safeSlug}":`, error.message);
    throw error; // Rethrow to let Next.js Error boundary handle it, preventing false 404 caching
  }
}

export async function getProductPrerenderParams(limit = 1) {
  'use cache';
  cacheLife('hours');
  cacheTag('products');

  const safeLimit = Math.max(1, Number(limit) || 1);

  try {
    await mongooseConnect();
  const products = await Product.find({ isLive: true })
    .sort({ createdAt: -1 })
    .select('slug')
      .limit(safeLimit)
      .lean();

    const params = products
      .map((product) => String(product?.slug || '').trim())
      .filter(Boolean)
      .map((id) => ({ id }));

    return params.length > 0 ? params : [{ id: '__placeholder__' }];
  } catch (error) {
    console.error('❌ [DATA] getProductPrerenderParams failed:', error.message);
    return [{ id: '__placeholder__' }];
  }
}

export async function getRelatedProducts({ category = '', excludeSlug = '', limit = 8 } = {}) {
  'use cache';
  cacheLife('foreverish');
  cacheTag('products');
  const products = await getLiveProductsRaw();

  return products
    .filter((product) => product.slug !== excludeSlug)
    .filter((product) => {
      if (!category) return true;
      return hasProductCategory(product, category);
    })
    .slice(0, limit)
    .map(toProductCardItem);
}

export async function getCatalogFeed() {
  'use cache';
  cacheLife('hours');
  cacheTag('products', 'settings', 'categories');

  const siteUrl = getCatalogSiteUrl();
  const [products, settings] = await Promise.all([
    getLiveProductsRaw(),
    getSettingsRaw(),
  ]);

  const items = products.map((product) => buildCatalogFeedItem(product, siteUrl, settings.storeName));

  return {
    generatedAt: new Date().toISOString(),
    storeName: settings.storeName,
    currency: 'PKR',
    items,
  };
}

export async function getAdminProducts() {
  await mongooseConnect();
  const products = await Product.find({})
    .select(PRODUCT_ADMIN_PROJECTION)
    .populate(PRODUCT_CATEGORY_POPULATE)
    .sort({ createdAt: -1 })
    .lean();
  const serializedProducts = products.map(serializeProduct);
  return serializedProducts.map(toAdminProductRow);
}

export async function getOrdersList() {
  await mongooseConnect();
  const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
  return orders.map(toOrderSummaryRow);
}

export async function getAdminProductsPage({
  search = '',
  status = 'all',
  stock = 'all',
  sort = 'newest',
  page = 1,
  limit = 12,
} = {}) {
  await mongooseConnect();

  const safeSearch = String(search || '').trim();
  const safeStatus = String(status || 'all').trim() || 'all';
  const safeStock = String(stock || 'all').trim() || 'all';
  const safeSort = String(sort || 'newest').trim() || 'newest';
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 12);

  const query = {};

  if (safeStatus === 'live') query.isLive = true;
  if (safeStatus === 'draft') query.isLive = false;

  if (safeStock === 'in-stock') query.StockStatus = 'In Stock';
  if (safeStock === 'out-of-stock') query.StockStatus = { $ne: 'In Stock' };

  if (safeSearch) {
    const searchRegex = new RegExp(escapeRegex(safeSearch), 'i');
    const matchingCategories = await Category.find(
      {
        $or: [{ name: searchRegex }, { slug: searchRegex }],
      },
      '_id',
    ).lean();

    const matchingCategoryIds = matchingCategories.map((entry) => entry._id);
    query.$or = [
      { Name: searchRegex },
      { 'vendors.name': searchRegex },
      { 'vendors.shopNumber': searchRegex },
    ];

    if (matchingCategoryIds.length > 0) {
      query.$or.push({ Category: { $in: matchingCategoryIds } });
    }

    if ('special offers'.includes(safeSearch.toLowerCase()) || 'special-offers'.includes(safeSearch.toLowerCase())) {
      query.$or.push({ isDiscounted: true });
    }
  }

  const sortQuery = (() => {
    if (safeSort === 'oldest') return { createdAt: 1 };
    if (safeSort === 'updated') return { updatedAt: -1, createdAt: -1 };
    if (safeSort === 'price-high') return { Price: -1, createdAt: -1 };
    if (safeSort === 'price-low') return { Price: 1, createdAt: -1 };
    if (safeSort === 'name') return { Name: 1, createdAt: -1 };
    return { createdAt: -1 };
  })();

  const skip = (safePage - 1) * safeLimit;

  const [items, total, totalProducts, liveProducts] = await Promise.all([
    Product.find(query)
      .select(PRODUCT_ADMIN_PROJECTION)
      .populate(PRODUCT_CATEGORY_POPULATE)
      .sort(sortQuery)
      .skip(skip)
      .limit(safeLimit)
      .lean()
      .then((products) => products.map(serializeProduct).map(toAdminProductRow)),
    Product.countDocuments(query),
    Product.countDocuments(),
    Product.countDocuments({ isLive: true }),
  ]);

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    hasMore: skip + safeLimit < total,
    searchTerm: safeSearch,
    status: safeStatus,
    stock: safeStock,
    sort: safeSort,
    summary: {
      totalProducts,
      liveProducts,
      draftProducts: Math.max(0, totalProducts - liveProducts),
    },
  };
}

export async function getAdminOrdersPage({
  search = '',
  status = 'Confirmed',
  startDate = '',
  endDate = '',
  page = 1,
  limit = 12,
} = {}) {
  await mongooseConnect();

  const safeSearch = String(search || '').trim();
  const safeStatus = String(status || 'Confirmed').trim() || 'Confirmed';
  const safeStartDate = String(startDate || '').trim();
  const safeEndDate = String(endDate || '').trim();
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 12);

  const query = {};

  if (safeStatus !== 'all') {
    if (safeStatus === 'Confirmed') {
      query.status = { $in: ['Confirmed', 'Pending'] };
    } else {
      query.status = safeStatus;
    }
  }

  if (safeSearch) {
    const searchRegex = new RegExp(escapeRegex(safeSearch), 'i');
    query.$or = [
      { orderId: searchRegex },
      { customerName: searchRegex },
      { customerPhone: searchRegex },
    ];
  }

  if (safeStartDate || safeEndDate) {
    query.createdAt = {};
    if (safeStartDate) {
      const start = new Date(safeStartDate);
      start.setHours(0, 0, 0, 0);
      query.createdAt.$gte = start;
    }
    if (safeEndDate) {
      const end = new Date(safeEndDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const skip = (safePage - 1) * safeLimit;

  const [items, total, confirmedCount, sourcingCount, inProcessCount, packedCount, shippedCount, outForDeliveryCount, deliveredCount, returnedCount] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean().then((orders) => orders.map(toOrderSummaryRow)),
    Order.countDocuments(query),
    Order.countDocuments({ status: { $in: ['Confirmed', 'Pending'] } }),
    Order.countDocuments({ status: 'Sourcing' }),
    Order.countDocuments({ status: 'In Process' }),
    Order.countDocuments({ status: 'Packed' }),
    Order.countDocuments({ status: 'Shipped' }),
    Order.countDocuments({ status: 'Out for Delivery' }),
    Order.countDocuments({ status: 'Delivered' }),
    Order.countDocuments({ status: 'Returned' }),
  ]);

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    hasMore: skip + safeLimit < total,
    searchTerm: safeSearch,
    status: safeStatus,
    startDate: safeStartDate,
    endDate: safeEndDate,
    summary: {
      confirmedCount,
      sourcingCount,
      inProcessCount,
      packedCount,
      shippedCount,
      outForDeliveryCount,
      deliveredCount,
      returnedCount,
      allCount: confirmedCount + sourcingCount + inProcessCount + packedCount + shippedCount + outForDeliveryCount + deliveredCount + returnedCount,
    },
  };
}

export async function getAdminUsersPage({
  search = '',
  status = 'all',
  type = 'registered',
  page = 1,
  limit = 12,
} = {}) {
  await mongooseConnect();

  const safeSearch = String(search || '').trim();
  const safeStatus = String(status || 'all').trim() || 'all';
  const safeType = String(type || 'registered').trim() || 'registered';
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 12);
  const skip = (safePage - 1) * safeLimit;

  if (safeType === 'customers') {
    const [result] = await Order.aggregate(
      buildCustomerAggregationPipeline({
        search: safeSearch,
        skip,
        limit: safeLimit,
      }),
    );

    const items = Array.isArray(result?.items) ? result.items : [];
    const total = Number(result?.totalCount?.[0]?.count || 0);
    const summary = result?.summary?.[0] || {};

    return {
      items: items.map((customer) => ({
        ...customer,
        _id: String(customer._id || ''),
        email: customer.email || '',
        phone: customer.phone || '',
        city: customer.city || '',
        address: customer.address || '',
        landmark: customer.landmark || '',
        ordersCount: Number(customer.ordersCount || 0),
        totalSpent: Number(customer.totalSpent || 0),
        createdAt: customer.firstOrderAt?.toISOString?.() || null,
        updatedAt: customer.lastOrderAt?.toISOString?.() || null,
        customerType: 'customer',
      })),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
      hasMore: skip + safeLimit < total,
      searchTerm: safeSearch,
      status: 'all',
      type: safeType,
      summary: {
        totalUsers: Number(summary.totalCustomers || 0),
        activeUsers: Number(summary.withPhone || 0),
        disabledUsers: Math.max(0, Number(summary.totalCustomers || 0) - Number(summary.withPhone || 0)),
        withEmail: Number(summary.withEmail || 0),
        withAddress: Number(summary.withAddress || 0),
      },
    };
  }

  const query = {};

  if (safeStatus === 'active') query.disabled = { $ne: true };
  if (safeStatus === 'disabled') query.disabled = true;

  if (safeSearch) {
    const searchRegex = new RegExp(escapeRegex(safeSearch), 'i');
    query.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  const [items, total, totalUsers, disabledUsers] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    User.countDocuments(query),
    User.countDocuments(),
    User.countDocuments({ disabled: true }),
  ]);

  return {
    items: items.map((user) => ({
      ...user,
      _id: user._id.toString(),
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    })),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    hasMore: skip + safeLimit < total,
    searchTerm: safeSearch,
    status: safeStatus,
    type: safeType,
    summary: {
      totalUsers,
      disabledUsers,
      activeUsers: Math.max(0, totalUsers - disabledUsers),
    },
  };
}

export async function getAdminReviewsPage({
  search = '',
  page = 1,
  limit = 12,
} = {}) {
  await mongooseConnect();
  const Review = (await import('@/models/Review')).default;

  const safeSearch = String(search || '').trim();
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 12);

  const query = {};

  if (safeSearch) {
    const searchRegex = new RegExp(escapeRegex(safeSearch), 'i');
    const matchedProducts = await Product.find(
      {
        $or: [{ Name: searchRegex }, { slug: searchRegex }],
      },
      '_id',
    ).lean();

    query.$or = [{ userName: searchRegex }, { comment: searchRegex }];

    if (matchedProducts.length > 0) {
      query.$or.push({ productId: { $in: matchedProducts.map((product) => product._id) } });
    }
  }

  const skip = (safePage - 1) * safeLimit;

  const [items, total, totalReviews, recentReviews, ratings] = await Promise.all([
    Review.find(query)
      .populate('productId', 'Name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Review.countDocuments(query),
    Review.countDocuments(),
    Review.countDocuments({ createdAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    Review.aggregate([{ $group: { _id: null, average: { $avg: '$rating' } } }]),
  ]);

  return {
    items: items.map((review) => ({
      ...review,
      _id: review._id.toString(),
      productId: review.productId
        ? {
            ...review.productId,
            _id: review.productId._id.toString(),
          }
        : null,
      userId: review.userId ? review.userId.toString() : null,
      createdAt: review.createdAt?.toISOString(),
      updatedAt: review.updatedAt?.toISOString(),
    })),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    hasMore: skip + safeLimit < total,
    searchTerm: safeSearch,
    summary: {
      totalReviews,
      recentReviews,
      averageRating: Number(ratings[0]?.average || 0),
    },
  };
}

export async function getUserOrders(email) {
  if (!email) return [];
  await mongooseConnect();
  
  const normalizedEmail = normalizeEmail(email);

  // 1. Fetch user to see if they have a phone number linked
  const user = await User.findOne({ email: normalizedEmail }).lean();
  
  // 2. Build query: match by customerEmail OR by customerPhone if phone exists (fuzzy)
  const query = {
    $or: [
      { customerEmail: normalizedEmail }
    ]
  };

  if (user?.phone) {
    const phoneRegex = getPhoneRegex(user.phone);
    if (phoneRegex) {
      query.$or.push({ customerPhone: { $regex: phoneRegex } });
    }
  }

  const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
  return orders.map(toOrderSummaryRow);
}

export async function getOrderById(id) {
  await mongooseConnect();
  const order = await Order.findById(String(id || '')).lean();
  if (!order) return null;

  const productIdentifiers = Array.from(
    new Set(
      (Array.isArray(order.items) ? order.items : [])
        .map((item) => String(item?.productId || '').trim())
        .filter(Boolean)
    )
  );

  let productLookup = new Map();
  if (productIdentifiers.length > 0) {
    const objectIds = productIdentifiers.filter((value) => mongoose.Types.ObjectId.isValid(value));
    const products = await Product.find({
      $or: [
        { slug: { $in: productIdentifiers } },
        ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : []),
      ],
    })
      .select('slug vendors')
      .lean();

    productLookup = new Map();
    products.forEach((product) => {
      const normalizedVendors = Array.isArray(product.vendors)
        ? product.vendors.map(normalizeVendorSnapshot).filter(Boolean)
        : [];

      productLookup.set(product._id.toString(), normalizedVendors);
      if (product.slug) {
        productLookup.set(String(product.slug), normalizedVendors);
      }
    });
  }

  const normalizedOrder = toOrderSummaryRow(order);
  normalizedOrder.items = normalizedOrder.items.map((item) => ({
    ...item,
    sourcingVendors:
      Array.isArray(item.sourcingVendors) && item.sourcingVendors.length > 0
        ? item.sourcingVendors
        : productLookup.get(String(item.productId || '').trim()) || [],
  }));

  return normalizedOrder;
}

export async function getOrderLogs(orderId) {
  await mongooseConnect();
  const normalizedOrderId = mongoose.Types.ObjectId.isValid(String(orderId || ''))
    ? new mongoose.Types.ObjectId(String(orderId))
    : String(orderId || '');

  const logs = await OrderLog.find({ orderId: normalizedOrderId })
    .sort({ createdAt: -1 })
    .lean();
  
  return logs.map(log => ({
    ...log,
    _id: log._id.toString(),
    orderId: log.orderId.toString(),
    createdAt: log.createdAt.toISOString(),
  }));
}

export async function getAdminDashboardData() {
  await mongooseConnect();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const [
    totalOrders,
    pendingOrders,
    totalProducts,
    liveProducts,
    revenueAgg,
    customersAgg,
    recentOrders,
    dailyConfirmedOrders,
    topVendorsAgg,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: 'Pending' }),
    Product.countDocuments(),
    Product.countDocuments({ isLive: true }),
    Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Order.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $ne: [{ $ifNull: ['$customerEmail', ''] }, ''] },
              { $ifNull: ['$customerEmail', ''] },
              {
                $cond: [
                  { $ne: [{ $ifNull: ['$customerPhone', ''] }, ''] },
                  { $ifNull: ['$customerPhone', ''] },
                  { $toString: '$_id' },
                ],
              },
            ],
          },
        },
      },
      { $count: 'count' },
    ]),
    Order.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    Order.countDocuments({
      status: { $in: ['Confirmed', 'Pending'] },
      createdAt: { $gte: startOfToday, $lt: startOfTomorrow },
    }),
    Product.aggregate([
      { $match: { isLive: true, vendors: { $exists: true, $ne: [] } } },
      { $unwind: '$vendors' },
      {
        $group: {
          _id: {
            vendorId: '$vendors.vendorId',
            name: '$vendors.name',
            shopNumber: '$vendors.shopNumber',
          },
          totalLiveItems: { $sum: 1 },
        },
      },
      { $sort: { totalLiveItems: -1, '_id.name': 1 } },
      { $limit: 5 },
    ]),
  ]);

  return {
    summary: {
      totalOrders,
      pendingOrders,
      totalProducts,
      liveProducts,
      totalRevenue: Number(revenueAgg[0]?.total || 0),
      totalCustomers: Number(customersAgg[0]?.count || 0),
      dailyConfirmedOrders: Number(dailyConfirmedOrders || 0),
    },
    recentOrders: recentOrders.map(toOrderSummaryRow),
    topVendors: topVendorsAgg.map((entry) => ({
      vendorId: entry?._id?.vendorId?.toString?.() || '',
      name: String(entry?._id?.name || '').trim(),
      shopNumber: String(entry?._id?.shopNumber || '').trim(),
      totalLiveItems: Number(entry?.totalLiveItems || 0),
    })).filter((entry) => entry.name),
  };
}

export async function getAdminSettings() {
  await mongooseConnect();

  let settings = await Settings.findOne({ singletonKey: SETTINGS_KEY }).lean();
  if (!settings) {
    settings = await Settings.create({ singletonKey: SETTINGS_KEY });
    settings = settings.toObject();
  }

  return {
    _id: settings._id.toString(),
    storeName: settings.storeName || 'China Unique Store',
    supportEmail: settings.supportEmail || '',
    businessAddress: settings.businessAddress || '',
    lightLogoUrl: normalizeLogoUrl(settings.lightLogoUrl),
    darkLogoUrl: normalizeLogoUrl(settings.darkLogoUrl),
    logoScalePercent: Math.min(200, Math.max(60, Number(settings.logoScalePercent || 100))),
    whatsappNumber: settings.whatsappNumber || '',
    facebookPageUrl: settings.facebookPageUrl || '',
    instagramUrl: settings.instagramUrl || '',
    trackingEnabled: settings.trackingEnabled === true,
    facebookPixelId: settings.facebookPixelId || '',
    facebookConversionsApiToken: settings.facebookConversionsApiToken || '',
    facebookTestEventCode: settings.facebookTestEventCode || '',
    tiktokPixelId: settings.tiktokPixelId || '',
    tiktokAccessToken: settings.tiktokAccessToken || '',
    karachiDeliveryFee: Number(settings.karachiDeliveryFee || 200),
    outsideKarachiDeliveryFee: Number(settings.outsideKarachiDeliveryFee || 250),
    freeShippingThreshold: Number(settings.freeShippingThreshold || 3000),
    announcementBarEnabled: settings.announcementBarEnabled ?? true,
    announcementBarText: settings.announcementBarText || '',
    announcementBarMessages: normalizeAnnouncementMessages(settings.announcementBarMessages, settings.announcementBarText),
    homepageSectionOrder: Array.isArray(settings.homepageSectionOrder) ? settings.homepageSectionOrder : [],
  };
}
