'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Truck,
  MessageSquare,
  Archive,
  PackageSearch
} from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InvoiceButton from '@/components/InvoiceButtonWrapper';
import CopyButton from '@/components/CopyButton';
import ReviewModal from '@/components/ReviewModal';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  Pending: 'bg-accent/15 text-accent-foreground border-accent/25',
  Confirmed: 'bg-primary/10 text-primary border-primary/20',
  'In Process': 'bg-secondary text-secondary-foreground border-border',
  Delivered: 'bg-success/12 text-success border-success/20',
  'Delivery Address Issue': 'bg-destructive/10 text-destructive border-destructive/20',
  Returned: 'bg-muted text-muted-foreground border-border',
};

export default function OrdersClient({ initialOrders, invoiceBranding }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const orders = initialOrders;

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  // Updated Grouping Logic
  const activeOrders = orders.filter(order => 
    ['Pending', 'Confirmed', 'In Process', 'Delivery Address Issue'].includes(order.status)
  );
  
  const historyOrders = orders.filter(order => 
    ['Delivered', 'Returned'].includes(order.status)
  );

  // Auto-popup and Cleanup logic
  useEffect(() => {
    if (!mounted) return;

    // 1. Cleanup: Remove tracking for fully reviewed orders
    orders.forEach(order => {
      const allReviewed = order.items.every(item => item.isReviewed);
      if (allReviewed) {
        localStorage.removeItem(`review_never_${order.orderId}`);
        sessionStorage.removeItem(`review_later_${order.orderId}`);
        // Legacy cleanup
        localStorage.removeItem(`review_popup_count_${order.orderId}`);
      }
    });

    // 2. Auto-popup: Find a delivered order that needs a review prompt
    const deliveredUnreviewedOrders = orders.filter(order => 
      order.status === 'Delivered' && 
      order.items.some(item => !item.isReviewed)
    );

    for (const order of deliveredUnreviewedOrders) {
      const neverKey = `review_never_${order.orderId}`;
      const laterKey = `review_later_${order.orderId}`;
      
      const neverShow = localStorage.getItem(neverKey) === 'true';
      const showLater = sessionStorage.getItem(laterKey) === 'true';

      if (!neverShow && !showLater) {
        // Trigger popup for the first qualifying order
        const timer = setTimeout(() => {
          setSelectedOrder(order);
          setIsReviewModalOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [mounted, orders]);

  const handleReviewClick = (order) => {
    setSelectedOrder(order);
    setIsReviewModalOpen(true);
  };

  const handleReviewAction = (action) => {
    if (!selectedOrder) return;

    const neverKey = `review_never_${selectedOrder.orderId}`;
    const laterKey = `review_later_${selectedOrder.orderId}`;

    if (action === 'submit' || action === 'dismiss') {
      // Never show again for this order
      localStorage.setItem(neverKey, 'true');
    } else if (action === 'later') {
      // Show again on next session (sessionStorage lasts until tab/window closes)
      sessionStorage.setItem(laterKey, 'true');
    }
  };

  const handleReviewComplete = () => {
    window.location.reload();
  };

  function renderEmptyState(title, description, Icon) {
    return (
      <Empty className="surface-card rounded-xl border border-dashed border-border py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-12 rounded-xl bg-muted text-muted-foreground">
            <Icon className="size-6" />
          </EmptyMedia>
          <EmptyTitle className="text-lg font-semibold text-foreground">{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const renderOrderCard = (order) => {
    const hasUnreviewedItems = order.status === 'Delivered' && order.items.some(item => !item.isReviewed);
    
    return (
      <div key={order._id} className="surface-card overflow-hidden rounded-xl border border-border shadow-sm transition-all hover:shadow-md">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-muted/30">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order ID</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-sm font-semibold text-foreground">{order.orderId}</span>
                <CopyButton 
                  text={order.orderId} 
                  className="size-6 p-1 hover:bg-primary/10 transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="size-3" />
                {mounted ? new Date(order.createdAt).toLocaleDateString() : '---'}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="size-3" />
                {mounted ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Badge 
              variant="outline" 
              className={cn("px-3 py-1 rounded-full border shadow-sm", STATUS_COLORS[order.status] || 'bg-muted')}
            >
              {order.status}
            </Badge>
            <InvoiceButton order={order} branding={invoiceBranding} />
            {hasUnreviewedItems && (
              <Button 
                size="sm" 
                className="h-8 text-xs gap-2 bg-primary hover:bg-primary/90"
                onClick={() => handleReviewClick(order)}
              >
                <MessageSquare className="size-3" />
                Review Now
              </Button>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6">
          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="relative size-12 overflow-hidden rounded-lg border border-border bg-muted shrink-0">
                  {item.image && (
                    <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" unoptimized />
                  )}
                  {item.isReviewed && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Badge className="h-4 bg-success px-1 text-[8px] text-success-foreground hover:bg-success/90">Reviewed</Badge>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">Rs. {(item.price * item.quantity).toLocaleString('en-PK')}</span>
              </div>
            ))}
          </div>

          {/* Tracking Info */}
          {(order.courierName || order.trackingNumber) && (
            <>
              <Separator className="my-6" />
              <Alert className="rounded-xl border-primary/10 bg-primary/5 px-4 py-4">
                <Truck className="size-4 text-primary" />
                <AlertTitle className="text-sm font-bold text-primary">Tracking Information</AlertTitle>
                <AlertDescription className="pt-2">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {order.courierName && (
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Courier</p>
                      <p className="text-sm font-semibold text-foreground">{order.courierName}</p>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Tracking ID</p>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-mono font-semibold text-foreground">{order.trackingNumber}</span>
                        <CopyButton 
                          text={order.trackingNumber} 
                          className="size-6 p-1 hover:bg-primary/10 transition-colors"
                        />
                      </div>
                    </div>
                  )}
                  </div>
                </AlertDescription>
              </Alert>
            </>
          )}

          <Separator className="my-6" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Payment Method</p>
              <p className="text-sm font-medium text-foreground">Cash on Delivery</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="text-xl font-bold text-primary">Rs. {order.totalAmount.toLocaleString('en-PK')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-6">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-muted p-1 sm:w-fit">
          <TabsTrigger value="active" className="px-4 py-2 text-sm font-semibold">
            Active Orders
            {activeOrders.length > 0 ? (
              <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-[10px]">
                {activeOrders.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="history" className="px-4 py-2 text-sm font-semibold">
            Order History
            {historyOrders.length > 0 ? (
              <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-[10px]">
                {historyOrders.length}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeOrders.length > 0 ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {activeOrders.map(renderOrderCard)}
            </div>
          ) : (
            renderEmptyState('No active orders', "You don't have any ongoing shipments at the moment.", PackageSearch)
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {historyOrders.length > 0 ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {historyOrders.map(renderOrderCard)}
            </div>
          ) : (
            renderEmptyState('No order history', 'Your completed orders will appear here.', Archive)
          )}
        </TabsContent>
      </Tabs>

      <ReviewModal 
        isOpen={isReviewModalOpen} 
        onOpenChange={setIsReviewModalOpen}
        order={selectedOrder}
        onComplete={handleReviewComplete}
        onAction={handleReviewAction}
      />
    </>
  );
}
