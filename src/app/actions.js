'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { updateTag } from 'next/cache';
import { after } from 'next/server';

import { getConfiguredAdminEmails, normalizeEmail, normalizePhone, getPhoneRegex } from '@/lib/admin';
import { authOptions } from '@/lib/auth';
import mongooseConnect from '@/lib/mongooseConnect';
import { applyInventoryAdjustments, buildOrderItemsWithSourcing, calculateOrderTotal } from '@/lib/orderFulfillment';
import { calculateCheckoutPricing } from '@/lib/checkoutPricing';
import { getStoreSettings } from '@/lib/data';
import { sendPurchaseTrackingEvents } from '@/lib/trackingServer';
import Order from '@/models/Order';
import OrderLog from '@/models/OrderLog';
import Product from '@/models/Product';
import Settings from '@/models/Settings';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { Resend } from 'resend';
import { generateOrderEmailHtml, generateCustomerOrderConfirmationHtml, getEmailBranding } from '@/lib/emailTemplates';

const resend = new Resend(process.env.RESEND_API_KEY);

const SETTINGS_KEY = 'site-settings';

function normalizeCoverImages(input) {
  if (!Array.isArray(input)) return [];

  return input
    .map((item, index) => {
      const normalizeAsset = (asset, fallback = null) => {
        const source = asset && typeof asset === 'object' ? asset : {};
        const fallbackSource = fallback && typeof fallback === 'object' ? fallback : {};
        const url = String(source.url || fallbackSource.url || '').trim();
        if (!url) return null;

        return {
          url,
          publicId: String(source.publicId || fallbackSource.publicId || '').trim(),
          blurDataURL: String(source.blurDataURL || fallbackSource.blurDataURL || '').trim(),
        };
      };

      const legacyDesktop = {
        url: item?.desktopImage?.url || item?.url || item?.image || '',
        publicId: item?.desktopImage?.publicId || item?.publicId || item?.public_id || '',
        blurDataURL: item?.desktopImage?.blurDataURL || item?.blurDataURL || '',
      };
      const desktopImage = normalizeAsset(legacyDesktop);
      if (!desktopImage) return null;
      const tabletImage = normalizeAsset(item?.tabletImage);
      const mobileImage = normalizeAsset(item?.mobileImage);

      const normalizedItem = {
        desktopImage,
        alt: String(item?.alt || '').trim(),
        sortOrder: Number(item?.sortOrder ?? index) || 0,
      };

      if (tabletImage) {
        normalizedItem.tabletImage = tabletImage;
      }

      if (mobileImage) {
        normalizedItem.mobileImage = mobileImage;
      }

      return normalizedItem;
    })
    .filter(Boolean);
}

function makeOrderId() {
  return `ORD-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isAdmin) {
    throw new Error('Unauthorized access');
  }
  return session;
}

async function sendOrderEmails({ order, customerName, userEmail }) {
  try {
    const emailBranding = await getEmailBranding();
    const adminRecipients = getConfiguredAdminEmails();
    const adminEmailResult = await resend.emails.send({
      from: 'China Unique <onboarding@resend.dev>',
      to: adminRecipients.length > 0 ? adminRecipients : ['123raza83@gmail.com'],
      subject: `New Order Received - ${customerName}`,
      html: generateOrderEmailHtml(order, emailBranding),
      headers: {
        'X-Click-Tracking': 'off',
      },
    });
    console.log(`Admin email notification triggered for ${order.orderId}:`, adminEmailResult);

    if (userEmail) {
      const customerEmailResult = await resend.emails.send({
        from: 'China Unique <onboarding@resend.dev>',
        to: userEmail,
        subject: `Thank You for Your Order! - ${order.orderId}`,
        html: generateCustomerOrderConfirmationHtml(order, emailBranding),
        headers: {
          'X-Click-Tracking': 'off',
        },
      });
      console.log(`Customer 'Thank You' email triggered for ${order.orderId}:`, customerEmailResult);
    }
  } catch (emailError) {
    console.error(`Failed to send emails for ${order.orderId}:`, emailError);
  }
}

export async function toggleProductLiveAction(productId, nextValue) {
  await assertAdmin();
  await mongooseConnect();

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  product.isLive = Boolean(nextValue);
  await product.save();

  revalidateTag('products');
  if (product.slug) {
    updateTag(`product-${product.slug}`);
  }
  revalidateTag('admin-dashboard');
  revalidateTag('home-sections');

  return { success: true, isLive: product.isLive };
}

export async function deleteProductAction(productId) {
  await assertAdmin();
  await mongooseConnect();

  const product = await Product.findByIdAndDelete(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  revalidateTag('products');
  if (product.slug) {
    revalidateTag(`product-${product.slug}`);
  }
  revalidateTag('admin-dashboard');
  revalidateTag('home-sections');

  return { success: true };
}

export async function setProductDiscountAction(productId, discountPercentage) {
  await assertAdmin();
  await mongooseConnect();

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const pct = Math.min(100, Math.max(0, Number(discountPercentage) || 0));
  product.discountPercentage = pct;
  product.isDiscounted = pct > 0;
  await product.save();

  // Use revalidateTag (hard/immediate flush) not updateTag (lazy background)
  // so the admin page re-render after this action gets fresh data from MongoDB
  revalidateTag('products');
  if (product.slug) {
    revalidateTag(`product-${product.slug}`);
  }
  revalidateTag('admin-dashboard');
  revalidateTag('home-sections');
  revalidatePath('/admin/products');
  revalidatePath('/');

  return { success: true, discountPercentage: product.discountPercentage, isDiscounted: product.isDiscounted };
}

export async function saveStoreSettingsAction(nextSettings) {
  await assertAdmin();
  await mongooseConnect();

  const allowedFields = [
    'storeName',
    'supportEmail',
    'businessAddress',
    'whatsappNumber',
    'facebookPageUrl',
    'instagramUrl',
    'trackingEnabled',
    'facebookPixelId',
    'facebookConversionsApiToken',
    'facebookTestEventCode',
    'tiktokPixelId',
    'tiktokAccessToken',
    'karachiDeliveryFee',
    'outsideKarachiDeliveryFee',
    'freeShippingThreshold',
    'announcementBarEnabled',
    'announcementBarText',
    'coverImages',
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (nextSettings[field] !== undefined) {
      updates[field] = field === 'coverImages' ? normalizeCoverImages(nextSettings[field]) : nextSettings[field];
    }
  }

  const settings = await Settings.findOneAndUpdate(
    { singletonKey: SETTINGS_KEY },
    { $set: updates },
    { new: true, upsert: true, runValidators: true },
  ).lean();

  revalidateTag('settings');
  revalidateTag('home-sections');

  return {
    success: true,
    data: {
      ...settings,
      _id: settings._id.toString(),
    },
  };
}

export async function submitOrderAction(input) {
  try {
    await mongooseConnect();

    const customerName = String(input?.customerName || '').trim();
    const customerPhone = String(input?.customerPhone || '').trim();
    const customerAddress = String(input?.customerAddress || '').trim();
    const customerCity = String(input?.customerCity || '').trim();
    const items = Array.isArray(input?.items) ? input.items : [];
    const totalAmount = Number(input?.totalAmount || 0);
    const notes = String(input?.notes || '').trim();
    const whatsappNumber = String(input?.whatsappNumber || '').trim();

    // Simplified fields from Phase 13
    const landmark = String(input?.landmark || '').trim();

    if (!customerName || !customerPhone || !customerAddress || !customerCity || items.length === 0 || totalAmount <= 0) {
      return { success: false, error: 'Missing required checkout details' };
    }

    const normalizedItems = await buildOrderItemsWithSourcing(items);
    const canonicalSubtotalAmount = calculateOrderTotal(normalizedItems);
    if (canonicalSubtotalAmount <= 0) {
      return { success: false, error: 'Unable to calculate a valid order total.' };
    }

    const settings = await getStoreSettings();
    const pricing = calculateCheckoutPricing({
      subtotal: canonicalSubtotalAmount,
      city: customerCity,
      settings,
    });

    if (totalAmount !== pricing.total) {
      return {
        success: false,
        error: 'Checkout total no longer matches current product pricing. Please review your cart and try again.',
      };
    }

    const session = await getServerSession(authOptions);
  
    // Robust email capture:
    const sessionEmail = session?.user?.email ? normalizeEmail(session.user.email) : null;
    const inputEmail = input?.customerEmail ? normalizeEmail(input.customerEmail) : null;
    const userEmail = sessionEmail || inputEmail || null;

    // STRICT VALIDATION
    if (session?.user && !userEmail) {
      return { success: false, error: 'Unable to capture user email.' };
    }

    // Create Order record
    const order = await Order.create({
      orderId: makeOrderId(),
      secureToken: crypto.randomUUID(),
      customerEmail: userEmail || null,
      customerName,
      customerPhone,
      customerAddress,
      customerCity,
      landmark,
      items: normalizedItems,
      totalAmount: pricing.total,
      status: 'Confirmed',
      notes,
    });

    await applyInventoryAdjustments(normalizedItems);

    revalidateTag('orders');
    revalidateTag('admin-dashboard');
    revalidateTag('products');

    // Update User Profile (Background)
    if (userEmail) {
      try {
        await User.findOneAndUpdate(
          { email: userEmail },
          {
            $set: {
              email: userEmail,
              name: customerName,
              phone: customerPhone,
              city: customerCity,
              address: customerAddress,
              landmark,
            },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // 2. Link all previous orders using fuzzy phone matching
        const phoneRegex = getPhoneRegex(customerPhone);
        if (phoneRegex) {
          const linkResult = await Order.updateMany(
            { customerPhone: { $regex: phoneRegex }, customerEmail: null },
            { customerEmail: userEmail }
          );
        
          if (linkResult.modifiedCount > 0) {
            console.log(`Linked ${linkResult.modifiedCount} previous orders to ${userEmail} via fuzzy phone ${customerPhone}`);
          }
        }
      } catch (profileError) {
        console.error('Error updating user profile/linking orders:', profileError);
      }
    }

    // Create Admin Notification
    try {
      const Notification = (await import('@/models/Notification')).default;
      await Notification.create({
        type: 'order',
        message: `New Order ${order.orderId} received from ${customerName}`,
        link: `/admin/orders/${order._id}`,
        metadata: {
          id: order.orderId,
          userName: customerName,
        }
      });
    } catch (notifyError) {
      console.error('Failed to create order notification:', notifyError);
    }

    after(async () => {
      await Promise.allSettled([
        sendOrderEmails({ order, customerName, userEmail }),
        sendPurchaseTrackingEvents({ order, items: normalizedItems }),
      ]);
    });

    const lines = [
      '*New Order from China Unique Store*',
      '',
      '*Customer Details*',
      `Name: ${customerName}`,
      `Phone: ${customerPhone}`,
      `Address: ${customerAddress}`,
    ];

    if (notes) {
      lines.push(`Notes: ${notes}`);
    }

    lines.push('', '*Items*');
    normalizedItems.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.name} - ${item.quantity} x Rs. ${item.price.toLocaleString('en-PK')}`);
    });
    lines.push('', `*Total:* Rs. ${pricing.total.toLocaleString('en-PK')}`);
    lines.push(`*Order ID:* ${order.orderId}`);

    return {
      success: true,
      orderId: order.orderId,
      whatsappUrl: whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}` : '',
    };
  } catch (error) {
    console.error('submitOrderAction failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unable to place the order right now.',
    };
  }
}

export async function getLastOrderDetailsAction() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  await mongooseConnect();
  const lastOrder = await Order.findOne({ customerEmail: normalizeEmail(session.user.email) })
    .sort({ createdAt: -1 })
    .lean();

  if (!lastOrder) return null;

  return {
    phone: lastOrder.customerPhone || '',
    address: lastOrder.customerAddress || '',
    addressOnly: lastOrder.customerAddress || '',
    city: lastOrder.customerCity || '',
    landmark: lastOrder.landmark || '',
  };
}

export async function linkOrdersAction(phone) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { success: false, message: 'Please sign in first.' };
  }

  const userEmail = normalizeEmail(session.user.email);
  const normalizedPhone = String(phone || '').trim();

  if (!normalizedPhone) {
    return { success: false, message: 'Phone number is required.' };
  }

  await mongooseConnect();

  // 1. Update User profile with this phone
  await User.findOneAndUpdate(
    { email: userEmail },
    { phone: normalizedPhone },
    { upsert: true }
  );

  // 2. Link orders using fuzzy phone matching
  const phoneRegex = getPhoneRegex(normalizedPhone);
  let modifiedCount = 0;

  if (phoneRegex) {
    const result = await Order.updateMany(
      { customerPhone: { $regex: phoneRegex }, customerEmail: null },
      { customerEmail: userEmail }
    );
    modifiedCount = result.modifiedCount;
  }

  if (modifiedCount > 0) {
    revalidatePath('/orders');
    return { 
      success: true, 
      message: `Successfully linked ${modifiedCount} order(s) to your account.` 
    };
  } else {
    return { 
      success: false, 
      message: 'No unlinked orders found with this phone number, but your phone has been saved to your profile.' 
    };
  }
}

export async function updateOrderAction(id, updates) {
  await assertAdmin();
  await mongooseConnect();

  try {
    const order = await Order.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    // Explicitly mapping allowed fields for security
    if (updates.customerName !== undefined) order.customerName = updates.customerName;
    if (updates.customerPhone !== undefined) order.customerPhone = updates.customerPhone;
    if (updates.customerAddress !== undefined) order.customerAddress = updates.customerAddress;
    if (updates.customerCity !== undefined) order.customerCity = updates.customerCity;
    if (updates.landmark !== undefined) order.landmark = updates.landmark;
    if (updates.customerEmail !== undefined) order.customerEmail = updates.customerEmail;
    
    const hasStatusChanged = updates.status !== undefined && updates.status !== order.status;
    const oldStatus = order.status;
    
    if (updates.status !== undefined) order.status = updates.status;
    if (updates.trackingNumber !== undefined) order.trackingNumber = updates.trackingNumber;
    if (updates.courierName !== undefined) order.courierName = updates.courierName;
    
    if (updates.weight !== undefined) order.weight = Number(updates.weight);
    if (updates.itemType !== undefined) order.itemType = updates.itemType;
    if (updates.orderQuantity !== undefined) order.orderQuantity = Number(updates.orderQuantity);
    
    if (updates.manualCodAmount !== undefined) {
      order.manualCodAmount = updates.manualCodAmount === '' ? undefined : Number(updates.manualCodAmount);
    }

    await order.save();

    // Log the change
    try {
      const session = await getServerSession(authOptions);
      let details = 'Order updated';
      let action = 'UPDATE';

      if (hasStatusChanged) {
        action = 'STATUS_CHANGE';
        details = `Status changed from ${oldStatus} to ${order.status}`;
      } else if (updates.trackingNumber !== undefined) {
        action = 'TRACKING_UPDATE';
        details = `Tracking Number set to ${order.trackingNumber}`;
      }

      await OrderLog.create({
        orderId: order._id,
        action,
        details,
        previousStatus: hasStatusChanged ? oldStatus : undefined,
        newStatus: hasStatusChanged ? order.status : undefined,
        adminName: session?.user?.name,
        adminEmail: session?.user?.email,
      });
    } catch (logError) {
      console.error('Failed to create order log:', logError);
    }
    
    revalidateTag('orders');
    revalidateTag('admin-dashboard');
    revalidatePath('/admin/orders');
    
    return { success: true, data: JSON.parse(JSON.stringify(order)) };
  } catch (error) {
    console.error('Failed to update order:', error);
    return { success: false, error: error.message };
  }
}
