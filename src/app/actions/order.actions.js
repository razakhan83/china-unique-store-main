'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { after } from 'next/server';

import { getConfiguredAdminEmails, normalizeEmail, normalizePhone, getPhoneRegex } from '@/lib/admin';
import { authOptions } from '@/lib/auth';
import mongooseConnect from '@/lib/mongooseConnect';
import { submitOrderSchema, draftOrderSchema, updateOrderSchema, trackGuestOrderSchema, linkOrdersSchema } from '@/lib/validation';
import { applyInventoryAdjustments, buildOrderItemsWithSourcing, calculateOrderTotal } from '@/lib/orderFulfillment';
import { calculateCheckoutPricing } from '@/lib/checkoutPricing';
import { getStoreSettings } from '@/lib/data';
import { DEFAULT_ORDER_STATUS, getOrderStatusQueryValue, isValidOrderStatus, normalizeOrderStatus } from '@/lib/order-status';
import { getSiteUrlFromHeaders } from '@/lib/siteUrl';
import { sendPurchaseTrackingEvents } from '@/lib/trackingServer';
import { generateOrderEmailHtml, generateCustomerOrderConfirmationHtml, getEmailBranding } from '@/lib/emailTemplates';
import { getServerSession } from 'next-auth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function assertAdmin(isMutation = true) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isAdmin) {
    throw new Error('Unauthorized access');
  }
  if (isMutation && session.user?.isDemo) {
    throw new Error('Demo Mode: Actions are disabled. You have read-only access.');
  }
  return session;
}

function makeOrderId() {
  return `ORD-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function normalizeSourceTag(value) {
  return String(value || '').trim();
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

// Extracted logic so submitOrderAction and validateCouponAction can share it
async function validateCouponLogic(code, subtotal, email, phone) {
  const Coupon = (await import('@/models/Coupon')).default;
  if (!code) return { success: false, message: 'Coupon code is required.' };

  const coupon = await Coupon.findOne({ code: code.toUpperCase() }).lean();
  if (!coupon) return { success: false, message: 'Invalid coupon code.' };
  if (!coupon.isActive) return { success: false, message: 'This coupon is no longer active.' };

  const now = new Date();
  if (coupon.startDate && now < coupon.startDate) return { success: false, message: 'This coupon is not valid yet.' };
  if (coupon.endDate && now > coupon.endDate) return { success: false, message: 'This coupon has expired.' };
  if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) return { success: false, message: `Minimum order amount of Rs. ${coupon.minOrderAmount} required.` };
  if (coupon.usageLimitPerCoupon && coupon.usedCount >= coupon.usageLimitPerCoupon) return { success: false, message: 'This coupon has reached its usage limit.' };

  // Check per-user limit
  if (coupon.usageLimitPerUser) {
    if (!email && !phone) {
      return { success: false, message: 'Please enter your email or phone number in the checkout form to use this coupon.' };
    }

    const Order = (await import('@/models/Order')).default;
    const query = { couponCode: coupon.code, status: { $ne: 'Cancelled' }, isDraft: { $ne: true } };
    if (email && phone) {
      query.$or = [{ customerEmail: email }, { customerPhone: phone }];
    } else if (email) {
      query.customerEmail = email;
    } else {
      query.customerPhone = phone;
    }

    const pastUses = await Order.countDocuments(query);
    if (pastUses >= coupon.usageLimitPerUser) {
      return { success: false, message: `You have already used this coupon the maximum number of times (${coupon.usageLimitPerUser}).` };
    }
  }

  return { success: true, coupon: coupon.toObject() };
}

// ---------------------------------------------------------------------------
// Exported Server Actions
// ---------------------------------------------------------------------------

export async function submitOrderAction(input) {
  try {
    const validation = submitOrderSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0].message };
    }
    const validatedData = validation.data;

    await mongooseConnect();
    const Order = (await import('@/models/Order')).default;
    const Coupon = (await import('@/models/Coupon')).default;
    const User = (await import('@/models/User')).default;

    const customerName = validatedData.customerName;
    const customerPhone = validatedData.customerPhone;
    const customerAddress = validatedData.customerAddress;
    const customerCity = validatedData.customerCity;
    const items = validatedData.items;
    const totalAmount = validatedData.totalAmount;
    const notes = validatedData.notes;
    const whatsappNumber = validatedData.whatsappNumber;
    const couponCodeInput = validatedData.couponCode;
    const customerEmail = validatedData.customerEmail;
    const landmark = validatedData.landmark;
    
    const cookieStore = await cookies();
    const requestHeaders = await headers();
    const clientIp =
      requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      requestHeaders.get('x-real-ip') ||
      undefined;
    const clientUserAgent = requestHeaders.get('user-agent') || undefined;
    const siteUrl = getSiteUrlFromHeaders(requestHeaders);
    const fbp = cookieStore.get('_fbp')?.value;
    const fbc = cookieStore.get('_fbc')?.value;

    const [normalizedItems, settings, session] = await Promise.all([
      buildOrderItemsWithSourcing(items),
      getStoreSettings(),
      getServerSession(authOptions),
    ]);
    const canonicalSubtotalAmount = calculateOrderTotal(normalizedItems);
    if (canonicalSubtotalAmount <= 0) {
      return { success: false, error: 'Unable to calculate a valid order total.' };
    }

    const sessionEmail = session?.user?.email ? normalizeEmail(session.user.email) : null;
    const inputEmail = customerEmail ? normalizeEmail(customerEmail) : null;
    const userEmail = sessionEmail || inputEmail || null;

    let appliedCoupon = null;
    if (couponCodeInput) {
      const validationResult = await validateCouponLogic(couponCodeInput, canonicalSubtotalAmount, userEmail, customerPhone);
      if (validationResult.success) {
        appliedCoupon = validationResult.coupon;
      }
    }

    const pricing = calculateCheckoutPricing({
      subtotal: canonicalSubtotalAmount,
      city: customerCity,
      settings,
      appliedCoupon,
    });

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
      status: DEFAULT_ORDER_STATUS,
      notes,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      discountAmount: pricing.discountAmount || 0,
      shippingAmount: pricing.shipping || 0,
      statusHistory: [{ status: DEFAULT_ORDER_STATUS, timestamp: new Date() }],
    });

    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon._id, { $inc: { usedCount: 1 } });
    }

    await applyInventoryAdjustments(normalizedItems);

    revalidateTag('orders');
    revalidateTag('admin-dashboard');
    revalidateTag('products');

    after(async () => {
      const backgroundTasks = [
        sendOrderEmails({ order, customerName, userEmail }),
        sendPurchaseTrackingEvents({
          order,
          items: normalizedItems,
          userData: {
            clientIp,
            clientUserAgent,
            fbp,
            fbc,
          },
          siteUrl,
        }),
      ];

      if (userEmail) {
        backgroundTasks.push(
          (async () => {
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
          })()
        );
      }

      backgroundTasks.push(
        (async () => {
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
        })()
      );

      await Promise.allSettled(backgroundTasks);
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
      totalAmount: pricing.total,
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
  const Order = (await import('@/models/Order')).default;

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

export async function syncCartPricingAction(items) {
  try {
    await mongooseConnect();

    const requestedItems = Array.isArray(items) ? items : [];
    const normalizedItems = await buildOrderItemsWithSourcing(requestedItems);

    return {
      success: true,
      items: normalizedItems.map((item) => ({
        id: item.productId,
        slug: item.productId,
        _id: item.productId,
        Name: item.name,
        Price: item.price,
        discountedPrice: null,
        isDiscounted: false,
        Images: item.image ? [{ url: item.image }] : [],
        quantity: item.quantity,
      })),
    };
  } catch (error) {
    console.error('syncCartPricingAction failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unable to refresh cart pricing right now.',
    };
  }
}

export async function linkOrdersAction(phone) {
  // NOTE: This function references `session` without declaring it — this is a
  // pre-existing bug in the original actions.js and is preserved here as-is.
  // Fix tracked separately.

  const validation = linkOrdersSchema.safeParse({ phone });
  if (!validation.success) {
    return { success: false, message: validation.error.errors[0].message };
  }
  
  const userEmail = normalizeEmail(session.user.email);
  const normalizedPhone = validation.data.phone;

  await mongooseConnect();
  const User = (await import('@/models/User')).default;
  const Order = (await import('@/models/Order')).default;

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

export async function trackGuestOrderAction(input = {}) {
  const validation = trackGuestOrderSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, message: validation.error.errors[0].message };
  }
  
  const safeOrderId = validation.data.orderId.toUpperCase();
  const normalizedPhone = validation.data.phone;

  await mongooseConnect();
  const Order = (await import('@/models/Order')).default;

  const phoneRegex = getPhoneRegex(normalizedPhone);
  if (!phoneRegex) {
    return { success: false, message: 'Enter a valid phone number.' };
  }

  const order = await Order.findOne({
    orderId: safeOrderId,
    customerPhone: { $regex: phoneRegex },
  }).select('_id secureToken').lean();

  if (!order?._id) {
    return { success: false, message: 'We could not find an order matching those details.' };
  }

  let secureToken = String(order.secureToken || '').trim();
  if (!secureToken) {
    secureToken = crypto.randomUUID();
    await Order.updateOne({ _id: order._id }, { $set: { secureToken } });
  }

  return {
    success: true,
    redirectUrl: `/orders/${order._id.toString()}?token=${encodeURIComponent(secureToken)}`,
  };
}

export async function createDraftOrderAction(input = {}) {
  await assertAdmin();

  const validation = draftOrderSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }
  const validatedData = validation.data;

  await mongooseConnect();
  const Order = (await import('@/models/Order')).default;
  const OrderLog = (await import('@/models/OrderLog')).default;

  try {
    const customerName = validatedData.customerName;
    const customerEmail = validatedData.customerEmail ? normalizeEmail(validatedData.customerEmail) : '';
    const customerPhone = validatedData.customerPhone;
    const customerAddress = validatedData.customerAddress;
    const customerCity = validatedData.customerCity;
    const landmark = validatedData.landmark;
    const notes = validatedData.notes;
    const sourceTag = validatedData.sourceTag;
    const itemType = validatedData.itemType || 'Mix';
    const weight = Math.max(0.5, validatedData.weight || 2);
    const requestedItems = validatedData.items;

    const normalizedItems = await buildOrderItemsWithSourcing(requestedItems);
    const totalAmount = calculateOrderTotal(normalizedItems);
    if (totalAmount <= 0) {
      throw new Error('Unable to calculate a valid draft order total.');
    }

    const orderQuantity = normalizedItems.reduce(
      (sum, item) => sum + Math.max(1, Number(item?.quantity || 1)),
      0
    );

    // manualCodAmount: if provided, use it; otherwise leave undefined (= auto = totalAmount)
    const manualCodAmount = (validatedData.manualCodAmount !== undefined && validatedData.manualCodAmount !== '') ? validatedData.manualCodAmount : undefined;

    const order = await Order.create({
      orderId: makeOrderId(),
      secureToken: crypto.randomUUID(),
      customerEmail: customerEmail || null,
      customerName,
      customerPhone,
      customerAddress,
      customerCity,
      landmark,
      items: normalizedItems,
      totalAmount,
      status: DEFAULT_ORDER_STATUS,
      notes,
      isDraft: true,
      sourceTag,
      itemType,
      orderQuantity,
      weight,
      ...(manualCodAmount !== undefined && { manualCodAmount }),
    });

    const session = await getServerSession(authOptions);
    await OrderLog.create({
      orderId: order._id,
      action: 'CREATE',
      details: sourceTag ? `Draft order created from ${sourceTag}` : 'Draft order created',
      adminName: session?.user?.name,
      adminEmail: session?.user?.email,
    });

    revalidateTag('orders');
    revalidateTag('admin-dashboard');
    revalidatePath('/admin/orders');

    return { success: true, data: JSON.parse(JSON.stringify(order)) };
  } catch (error) {
    console.error('Failed to create draft order:', error);
    return { success: false, error: error.message };
  }
}

export async function updateOrderAction(id, updates) {
  await assertAdmin();
  
  const validation = updateOrderSchema.safeParse(updates);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }
  const validatedData = validation.data;

  await mongooseConnect();
  const Order = (await import('@/models/Order')).default;
  const OrderLog = (await import('@/models/OrderLog')).default;

  try {
    const order = await Order.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    // Explicitly mapping allowed fields for security
    if (validatedData.customerName !== undefined) order.customerName = validatedData.customerName;
    if (validatedData.customerPhone !== undefined) order.customerPhone = validatedData.customerPhone;
    if (validatedData.customerAddress !== undefined) order.customerAddress = validatedData.customerAddress;
    if (validatedData.customerCity !== undefined) order.customerCity = validatedData.customerCity;
    if (validatedData.landmark !== undefined) order.landmark = validatedData.landmark;
    if (validatedData.customerEmail !== undefined) order.customerEmail = validatedData.customerEmail;
    if (validatedData.sourceTag !== undefined) order.sourceTag = validatedData.sourceTag;

    const nextStatus = validatedData.status !== undefined ? normalizeOrderStatus(validatedData.status) : undefined;
    const hasStatusChanged = nextStatus !== undefined && nextStatus !== order.status;
    const oldStatus = order.status;
    const wasDraft = order.isDraft === true;

    if (nextStatus !== undefined) {
      if (!isValidOrderStatus(nextStatus)) {
        throw new Error('Invalid order status');
      }
      order.status = nextStatus;
      order.isDraft = false;
    }
    if (validatedData.trackingNumber !== undefined) order.trackingNumber = validatedData.trackingNumber;
    if (validatedData.courierName !== undefined) order.courierName = validatedData.courierName;

    if (validatedData.weight !== undefined) order.weight = validatedData.weight;
    if (validatedData.itemType !== undefined) order.itemType = validatedData.itemType;
    if (validatedData.orderQuantity !== undefined) order.orderQuantity = validatedData.orderQuantity;

    if (validatedData.manualCodAmount !== undefined) {
      order.manualCodAmount = validatedData.manualCodAmount === '' ? undefined : validatedData.manualCodAmount;
    }

    await order.save();

    if (wasDraft && order.isDraft === false) {
      await applyInventoryAdjustments(order.items);
    }

    // Log the change
    try {
      const session = await getServerSession(authOptions);
      let details = 'Order updated';
      let action = 'UPDATE';

      if (wasDraft && order.isDraft === false && hasStatusChanged) {
        action = 'STATUS_CHANGE';
        details = `Draft published and status changed from Draft to ${order.status}`;
      } else if (wasDraft && order.isDraft === false) {
        action = 'STATUS_CHANGE';
        details = `Draft published to ${order.status}`;
      } else if (hasStatusChanged) {
        action = 'STATUS_CHANGE';
        details = `Status changed from ${oldStatus} to ${order.status}`;
      } else if (validatedData.trackingNumber !== undefined) {
        action = 'TRACKING_UPDATE';
        details = `Tracking Number set to ${order.trackingNumber}`;
      }

      await OrderLog.create({
        orderId: order._id,
        action,
        details,
        previousStatus: hasStatusChanged ? oldStatus : (wasDraft && order.isDraft === false ? 'Draft' : undefined),
        newStatus: hasStatusChanged ? order.status : (wasDraft && order.isDraft === false ? order.status : undefined),
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

export async function bulkUpdateOrderStatusAction({
  orderIds = [],
  nextStatus,
  allowedCurrentStatuses = [],
  logReason = '',
} = {}) {
  await assertAdmin();
  await mongooseConnect();
  const Order = (await import('@/models/Order')).default;
  const OrderLog = (await import('@/models/OrderLog')).default;

  try {
    const normalizedIds = Array.from(
      new Set(
        (Array.isArray(orderIds) ? orderIds : [])
          .map((value) => String(value || '').trim())
          .filter(Boolean)
      )
    );

    if (normalizedIds.length === 0) {
      throw new Error('Select at least one order');
    }

    const normalizedNextStatus = normalizeOrderStatus(nextStatus);
    if (!isValidOrderStatus(normalizedNextStatus)) {
      throw new Error('Invalid order status');
    }

    const normalizedAllowedStatuses = Array.from(
      new Set(
        (Array.isArray(allowedCurrentStatuses) ? allowedCurrentStatuses : [])
          .map((status) => normalizeOrderStatus(status))
          .filter(Boolean)
      )
    );

    const session = await getServerSession(authOptions);
    const orders = await Order.find({ _id: { $in: normalizedIds } });
    const blockedOrders = [];
    const updatedOrders = [];
    const logs = [];

    for (const order of orders) {
      const currentStatus = normalizeOrderStatus(order.status);
      const wasDraft = order.isDraft === true;

      if (
        normalizedAllowedStatuses.length > 0 &&
        !normalizedAllowedStatuses.some((status) => {
          const queryValue = getOrderStatusQueryValue(status);
          if (typeof queryValue === 'string') {
            return currentStatus === queryValue;
          }
          return Array.isArray(queryValue?.$in) && queryValue.$in.includes(order.status);
        })
      ) {
        blockedOrders.push({
          _id: order._id.toString(),
          orderId: order.orderId,
          status: currentStatus,
        });
        continue;
      }

      if (currentStatus === normalizedNextStatus && !wasDraft) {
        continue;
      }

      const previousStatus = currentStatus;
      order.status = normalizedNextStatus;
      if (wasDraft) {
        order.isDraft = false;
      }
      await order.save();

      if (wasDraft) {
        await applyInventoryAdjustments(order.items);
      }

      updatedOrders.push(order._id.toString());
      logs.push({
        orderId: order._id,
        action: 'STATUS_CHANGE',
        details:
          logReason ||
          (wasDraft
            ? `Draft published and status changed from Draft to ${normalizedNextStatus}`
            : `Status changed from ${previousStatus} to ${normalizedNextStatus}`),
        previousStatus: wasDraft ? 'Draft' : previousStatus,
        newStatus: normalizedNextStatus,
        adminName: session?.user?.name,
        adminEmail: session?.user?.email,
      });
    }

    if (logs.length > 0) {
      await OrderLog.insertMany(logs, { ordered: false });
    }

    revalidateTag('orders');
    revalidateTag('admin-dashboard');
    revalidatePath('/admin/orders');

    return {
      success: true,
      updatedCount: updatedOrders.length,
      updatedOrderIds: updatedOrders,
      blockedOrders,
    };
  } catch (error) {
    console.error('Failed to bulk update orders:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteOrderAction(id) {
  await assertAdmin();
  await mongooseConnect();
  const Order = (await import('@/models/Order')).default;
  const OrderLog = (await import('@/models/OrderLog')).default;

  try {
    const order = await Order.findById(id);
    if (!order) return { success: false, error: 'Order not found.' };
    if (order.isDeleted) return { success: false, error: 'Order is already in trash.' };

    order.isDeleted = true;
    order.deletedAt = new Date();
    await order.save();

    const session = await getServerSession(authOptions);
    await OrderLog.create({
      orderId: order._id,
      action: 'DELETE',
      details: `Order moved to trash`,
      adminName: session?.user?.name,
      adminEmail: session?.user?.email,
    });

    revalidateTag('orders');
    revalidateTag('admin-dashboard');
    revalidatePath('/admin/orders');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete order:', error);
    return { success: false, error: error.message };
  }
}

export async function restoreOrderAction(id) {
  await assertAdmin();
  await mongooseConnect();
  const Order = (await import('@/models/Order')).default;
  const OrderLog = (await import('@/models/OrderLog')).default;

  try {
    const order = await Order.findById(id);
    if (!order) return { success: false, error: 'Order not found.' };

    order.isDeleted = false;
    order.deletedAt = null;
    await order.save();

    const session = await getServerSession(authOptions);
    await OrderLog.create({
      orderId: order._id,
      action: 'RESTORE',
      details: `Order restored from trash`,
      adminName: session?.user?.name,
      adminEmail: session?.user?.email,
    });

    revalidateTag('orders');
    revalidateTag('admin-dashboard');
    revalidatePath('/admin/orders');
    return { success: true };
  } catch (error) {
    console.error('Failed to restore order:', error);
    return { success: false, error: error.message };
  }
}

export async function hardDeleteOrderAction(id) {
  await assertAdmin();
  await mongooseConnect();
  const Order = (await import('@/models/Order')).default;

  try {
    const order = await Order.findById(id);
    if (!order) return { success: false, error: 'Order not found.' };
    await Order.deleteOne({ _id: id });

    revalidateTag('orders');
    revalidateTag('admin-dashboard');
    revalidatePath('/admin/orders');
    return { success: true };
  } catch (error) {
    console.error('Failed to permanently delete order:', error);
    return { success: false, error: error.message };
  }
}

export async function emptyTrashAction() {
  await assertAdmin();
  await mongooseConnect();
  const Order = (await import('@/models/Order')).default;

  try {
    const result = await Order.deleteMany({ isDeleted: true });
    revalidateTag('orders');
    revalidateTag('admin-dashboard');
    revalidatePath('/admin/orders');
    return { success: true, deletedCount: result.deletedCount || 0 };
  } catch (error) {
    console.error('Failed to empty trash:', error);
    return { success: false, error: error.message };
  }
}
