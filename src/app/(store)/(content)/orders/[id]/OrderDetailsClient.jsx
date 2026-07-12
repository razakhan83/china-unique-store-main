'use client';

import Image from 'next/image';
import { Package } from 'lucide-react';
import CopyButton from '@/components/CopyButton';
import InvoiceButton from '@/components/InvoiceButtonWrapper';
import { normalizeOrderStatus } from '@/lib/order-status';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function OrderDetailsClient({ order, invoiceBranding }) {
  if (!order) return null;
  const normalizedStatus = normalizeOrderStatus(order.status);
  
  const customerName = order.shippingAddress?.fullName || order.customerName || 'Customer';
  const customerAddress = order.shippingAddress 
    ? `${order.shippingAddress.address1 || ''}${order.shippingAddress.city ? `, ${order.shippingAddress.city}` : ''}`
    : order.customerAddress || 'No Address Provided';
  
  const customerPhone = order.shippingAddress?.phone || order.customerPhone || '';
  
  const itemsSubtotal = order.items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  const deliveryCharges = order.shippingAmount != null ? order.shippingAmount : Math.max(0, order.totalAmount - itemsSubtotal);

  return (
    <div className="grid gap-4 md:gap-6 md:grid-cols-3">
      {/* Left Column */}
      <div className="flex flex-col gap-4 md:gap-6 md:col-span-2 min-w-0">
        
        {/* Order Header Card */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 space-y-0">
            <div className="flex flex-col space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg md:text-xl break-all">Order #{order.orderId}</CardTitle>
                <CopyButton text={order.orderId} className="size-6 text-muted-foreground shrink-0" />
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </CardDescription>
            </div>
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-3 w-full sm:w-auto">
              <Badge variant="outline" className="px-2.5 py-0.5 text-xs">
                {normalizedStatus}
              </Badge>
              <InvoiceButton order={order} branding={invoiceBranding} variant="outline" className="h-8 sm:h-9 text-xs sm:text-sm" />
            </div>
          </CardHeader>
        </Card>

        {/* Items Card */}
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
            <CardDescription>
              {order.items.length} item{order.items.length === 1 ? '' : 's'} in this order.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            
            {/* --- PC VIEW (Native Shadcn Table) --- */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="relative size-12 rounded-md bg-muted overflow-hidden">
                          {item.image ? (
                             <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                          ) : (
                             <div className="flex h-full w-full items-center justify-center">
                                <Package className="size-4 text-muted-foreground/50" />
                             </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">Rs. {Number(item.price || 0).toLocaleString('en-PK')}</TableCell>
                      <TableCell className="text-right font-medium">Rs. {(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('en-PK')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* --- MOBILE VIEW (Flex Layout) --- */}
            <div className="flex flex-col divide-y sm:hidden">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-3 py-4 px-4 min-w-0">
                  <div className="flex gap-4 min-w-0">
                    <div className="relative size-16 rounded-md border bg-muted overflow-hidden shrink-0">
                      {item.image ? (
                         <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                      ) : (
                         <div className="flex h-full w-full items-center justify-center">
                            <Package className="size-5 text-muted-foreground/50" />
                         </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0 flex-1">
                      <span className="font-medium text-sm line-clamp-2">{item.name}</span>
                      <div className="text-xs text-muted-foreground mt-1">
                        Qty: {item.quantity} × Rs. {Number(item.price || 0).toLocaleString('en-PK')}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium pt-2 border-t mt-1">
                    <span className="text-xs text-muted-foreground uppercase">Total</span>
                    <span>Rs. {(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('en-PK')}</span>
                  </div>
                </div>
              ))}
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-4 md:gap-6 md:col-span-1">
        
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>Rs. {itemsSubtotal.toLocaleString('en-PK')}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span>{deliveryCharges === 0 ? 'Free' : `Rs. ${deliveryCharges.toLocaleString('en-PK')}`}</span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-Rs. {order.discountAmount.toLocaleString('en-PK')}</span>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between font-medium">
              <span>Total</span>
              <span className="text-lg">Rs. {order.totalAmount.toLocaleString('en-PK')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Card */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <div className="font-medium">{customerName}</div>
              <div className="text-muted-foreground mt-1 leading-relaxed break-words">{customerAddress}</div>
              {customerPhone && <div className="text-muted-foreground mt-1">{customerPhone}</div>}
            </div>
          </CardContent>
          <Separator />
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="text-sm">Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {order.paymentMethod || 'Cash on Delivery'}
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}
