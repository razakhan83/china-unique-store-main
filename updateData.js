const fs = require('fs');
const content = fs.readFileSync('src/lib/data.js', 'utf8');

let updated = content.replace(
  /topProducts: \[\s*\{ \$unwind: '\$items' \},\s*\{\s*\$group: \{\s*_id: '\$items\.productId',\s*name: \{ \$first: '\$items\.name' \},\s*image: \{ \$first: '\$items\.image' \},\s*totalSold: \{ \$sum: '\$items\.quantity' \},\s*\},\s*\},\s*\{ \$sort: \{ totalSold: -1 \} \},\s*\{ \$limit: 5 \},\s*\],/,
  `topProducts: [
            { $unwind: '$items' },
            {
              $group: {
                _id: '$items.productId',
                name: { $first: '$items.name' },
                image: { $first: '$items.image' },
                totalSold: { $sum: '$items.quantity' },
              },
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
          ],
          topCustomers: [
            {
              $group: {
                _id: {
                  $cond: [
                    { $ne: [{ $ifNull: ['$customerPhone', ''] }, ''] },
                    { $ifNull: ['$customerPhone', ''] },
                    {
                      $cond: [
                        { $ne: [{ $ifNull: ['$customerEmail', ''] }, ''] },
                        { $ifNull: ['$customerEmail', ''] },
                        { $toString: '$_id' },
                      ],
                    },
                  ],
                },
                name: { $first: '$customerName' },
                phone: { $first: '$customerPhone' },
                email: { $first: '$customerEmail' },
                totalSpent: { $sum: '$totalAmount' },
                ordersCount: { $sum: 1 },
              },
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 5 },
          ],`
);

updated = updated.replace(
  /const \[orderDashboardAgg, productDashboardAgg\] = await Promise\.all\(\[/,
  `const [orderDashboardAgg, productDashboardAgg, recentReviewsAgg] = await Promise.all([`
);

updated = updated.replace(
  /\]\);\s*const orderDashboard = orderDashboardAgg\?\.\[0\] \|\| \{\};/,
  `],
    Review.find().sort({ createdAt: -1 }).limit(5).populate('productId', 'Name images').lean()
  ]);

  const orderDashboard = orderDashboardAgg?.[0] || {};`
);

updated = updated.replace(
  /topProducts: Array\.isArray\(orderDashboard\.topProducts\) \? orderDashboard\.topProducts : \[\],/,
  `topProducts: Array.isArray(orderDashboard.topProducts) ? orderDashboard.topProducts : [],
    topCustomers: Array.isArray(orderDashboard.topCustomers) ? orderDashboard.topCustomers : [],
    recentReviews: (recentReviewsAgg || []).map(r => ({
      _id: r._id?.toString(),
      rating: r.rating,
      comment: r.comment,
      userName: r.userName,
      createdAt: r.createdAt?.toISOString(),
      productName: r.productId?.Name || 'Unknown Product',
      productImage: r.productId?.images?.[0] || null,
      productId: r.productId?._id?.toString() || null,
    })),`
);

fs.writeFileSync('src/lib/data.js', updated);
console.log('Update complete');
