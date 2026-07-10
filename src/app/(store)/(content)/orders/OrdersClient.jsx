'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
const ReviewModal = dynamic(() => import('@/components/ReviewModal'));
import { normalizeOrderStatus } from '@/lib/order-status';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  'Order Confirmed': { dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-500/10' },
  'In Process': { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-500/10' },
  Packed: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-500/10' },
  Shipped: { dot: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
  'Out For Delivery': { dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-500/10' },
  Delivered: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  Returned: { dot: 'bg-slate-500', text: 'text-slate-700 dark:text-slate-400', bg: 'bg-slate-500/10' },
};
const DEFAULT_STATUS = { dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100' };

function splitOrdersForDisplay(orders) {
  if (orders.length <= 1) {
    return {
      featuredOrders: orders,
      collapsibleOrders: [],
    };
  }

  return {
    featuredOrders: [orders[0]],
    collapsibleOrders: orders.slice(1),
  };
}

export default function OrdersClient({ initialOrders, invoiceBranding }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [activeOpenOrderIds, setActiveOpenOrderIds] = useState([]);
  const [historyOpenOrderIds, setHistoryOpenOrderIds] = useState([]);
  const orders = initialOrders;

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const activeOrders = orders.filter(order => 
    ['Order Confirmed', 'In Process', 'Packed', 'Shipped', 'Out For Delivery'].includes(normalizeOrderStatus(order.status))
  );
  
  const historyOrders = orders.filter(order => 
    ['Delivered', 'Returned'].includes(normalizeOrderStatus(order.status))
  );

  useEffect(() => {
    if (!mounted) return;

    orders.forEach(order => {
      const allReviewed = order.items.every(item => item.isReviewed);
      if (allReviewed) {
        localStorage.removeItem(`review_never_${order.orderId}`);
        sessionStorage.removeItem(`review_later_${order.orderId}`);
        localStorage.removeItem(`review_popup_count_${order.orderId}`);
      }
    });

    const deliveredUnreviewedOrders = orders.filter(order => 
      normalizeOrderStatus(order.status) === 'Delivered' && 
      order.items.some(item => !item.isReviewed)
    );

    for (const order of deliveredUnreviewedOrders) {
      const neverKey = `review_never_${order.orderId}`;
      const laterKey = `review_later_${order.orderId}`;
      
      const neverShow = localStorage.getItem(neverKey) === 'true';
      const showLater = sessionStorage.getItem(laterKey) === 'true';

      if (!neverShow && !showLater) {
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
      localStorage.setItem(neverKey, 'true');
    } else if (action === 'later') {
      sessionStorage.setItem(laterKey, 'true');
    }
  };

  const handleReviewComplete = () => {
    window.location.reload();
  };

  function renderEmptyState(title, description, Icon) {
    return (
      <Empty className="rounded-[2rem] border-0 ring-1 ring-border/30 py-20 px-8 bg-gradient-to-b from-background to-muted/10 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)]">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-20 rounded-2xl bg-background text-muted-foreground shadow-sm ring-1 ring-border/40 mb-6">
            <Icon className="size-10 stroke-[1.5]" />
          </EmptyMedia>
          <EmptyTitle className="text-2xl font-semibold tracking-tight text-foreground">{title}</EmptyTitle>
          <EmptyDescription className="text-base max-w-sm mx-auto mt-2">{description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const renderOrderCard = (order) => {
    const hasUnreviewedItems = normalizeOrderStatus(order.status) === 'Delivered' && order.items.some(item => !item.isReviewed);
    const status = normalizeOrderStatus(order.status);
    const style = STATUS_STYLES[status] || DEFAULT_STATUS;
    
    return (
      <div key={order._id} className="relative flex flex-col overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] bg-card ring-1 ring-border/20 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] transition-all duration-500 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)] hover:ring-border/40">
        
        {/* Header - Super Clean */}
        <div className="flex flex-col gap-5 p-5 pb-4 sm:gap-6 sm:p-8 sm:pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                Order #{order.orderId}
              </h3>
              <CopyButton 
                text={order.orderId} 
                className="size-6 sm:size-7 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              />
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5 sm:size-4 opacity-70" />
                {mounted ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '---'}
              </span>
              <span className="h-1 w-1 rounded-full bg-border"></span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 sm:size-4 opacity-70" />
                {mounted ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 sm:mt-0">
            <InvoiceButton order={order} branding={invoiceBranding} />
            {hasUnreviewedItems && (
              <Button 
                size="sm" 
                variant="default"
                className="h-8 sm:h-9 gap-1.5 sm:gap-2 rounded-full px-4 sm:px-5 text-xs sm:text-sm font-medium shadow-sm transition-transform active:scale-[0.96]"
                onClick={() => handleReviewClick(order)}
              >
                <MessageSquare className="size-3.5 sm:size-4" />
                Review
              </Button>
            )}
            <div className={cn("flex items-center gap-1.5 sm:gap-2 rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-semibold", style.bg, style.text)}>
              <span className={cn("size-1.5 sm:size-2 rounded-full", style.dot)} />
              {status}
            </div>
          </div>
        </div>

        {/* Items List - Spaced out without dividers */}
        <div className="px-5 sm:px-8 pb-2 pt-2">
          <div className="flex flex-col gap-5 sm:gap-6">
            {order.items.map((item, idx) => (
              <div key={idx} className="group flex items-center gap-4 sm:gap-5 transition-transform duration-300">
                <div className="relative size-16 sm:size-20 shrink-0 overflow-hidden rounded-xl sm:rounded-2xl ring-1 ring-border/30 bg-muted/20 transition-all duration-300 group-hover:ring-border/50 group-hover:scale-[1.02]">
                  {item.image && (
                    <Image src={item.image} alt={item.name} fill sizes="(max-width: 640px) 64px, 80px" className="object-cover" unoptimized />
                  )}
                  {item.isReviewed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                      <div className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">Done</div>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-center gap-0.5 sm:gap-1 min-w-0">
                  <p className="truncate text-base sm:text-lg font-medium text-foreground transition-colors group-hover:text-primary">{item.name}</p>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <span className="text-base sm:text-lg font-semibold text-foreground">
                    Rs. {(item.price * item.quantity).toLocaleString('en-PK')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clean Footer Divider */}
        <div className="mx-5 sm:mx-8 mt-5 sm:mt-6 border-t border-border/40" />

        {/* Footer Info */}
        <div className="flex flex-col gap-5 p-5 pt-4 sm:gap-6 sm:p-8 sm:pt-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            {(order.courierName || order.trackingNumber) ? (
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-wrap items-center gap-x-8 sm:gap-x-12 gap-y-3 sm:gap-y-4">
                  {order.courierName && (
                    <div className="flex flex-col gap-0.5 sm:gap-1">
                      <span className="text-[11px] sm:text-xs font-semibold uppercase text-muted-foreground">Courier</span>
                      <span className="text-sm sm:text-base font-medium">{order.courierName}</span>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div className="flex flex-col gap-0.5 sm:gap-1">
                      <span className="text-[11px] sm:text-xs font-semibold uppercase text-muted-foreground">Tracking No.</span>
                      <div className="flex items-center gap-1.5 sm:gap-2 group">
                        <span className="text-sm sm:text-base font-medium">{order.trackingNumber}</span>
                        <CopyButton text={order.trackingNumber} className="size-6 sm:size-7 rounded-full text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-muted hover:text-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
               <div className="flex flex-col gap-0.5 sm:gap-1">
                 <span className="text-[11px] sm:text-xs font-semibold uppercase text-muted-foreground">Payment Method</span>
                 <span className="text-sm sm:text-base font-medium">Cash on Delivery</span>
               </div>
            )}
          </div>
          
          <div className="flex flex-col items-start sm:items-end sm:text-right mt-4 sm:mt-0 min-w-[160px]">
            {order.shippingAmount != null && (
              <div className="flex w-full justify-between mb-3 text-sm border-b border-border/30 pb-3 sm:border-0 sm:pb-0 sm:mb-2">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-medium text-foreground">
                  {order.shippingAmount === 0 ? 'Free' : `Rs. ${order.shippingAmount.toLocaleString('en-PK')}`}
                </span>
              </div>
            )}
            <div className="flex w-full justify-between items-end sm:flex-col sm:items-end">
              <span className="text-[11px] sm:text-xs font-semibold uppercase text-muted-foreground mb-1">Total</span>
              <span className="text-2xl sm:text-3xl font-bold text-foreground">
                Rs. {order.totalAmount.toLocaleString('en-PK')}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCollapsedOrderItem = (order, isExpanded) => {
    const hasUnreviewedItems = normalizeOrderStatus(order.status) === 'Delivered' && order.items.some(item => !item.isReviewed);
    const allReviewed = normalizeOrderStatus(order.status) === 'Delivered' && order.items.length > 0 && order.items.every(item => item.isReviewed);
    const status = normalizeOrderStatus(order.status);
    const style = STATUS_STYLES[status] || DEFAULT_STATUS;

    return (
      <AccordionItem
        key={order._id}
        value={order._id}
        className="group overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem] bg-card ring-1 ring-border/20 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] transition-all duration-300 hover:ring-border/40 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.08)] data-[state=open]:ring-border/40 data-[state=open]:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)] data-[state=open]:my-4"
      >
        {isExpanded ? (
          <div className="flex items-center justify-end py-3 px-5 sm:px-6 border-b border-border/20 mb-2">
            <AccordionTrigger className="h-9 sm:h-10 px-4 sm:px-5 shrink-0 flex-none items-center justify-center border border-border/40 rounded-full bg-muted/20 hover:bg-muted/50 text-xs sm:text-sm font-semibold text-muted-foreground hover:no-underline hover:text-foreground transition-all [&_[data-slot=accordion-trigger-icon]]:m-0 [&_[data-slot=accordion-trigger-icon]]:ml-2 [&_[data-slot=accordion-trigger-icon]]:size-4">
              Hide details
              <span className="sr-only">Collapse order details</span>
            </AccordionTrigger>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 sm:gap-4 py-4 sm:py-5 px-5 sm:px-6">
            <div className="min-w-0 flex-1 flex flex-col gap-1.5 sm:gap-2 text-left">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <span className="truncate text-sm sm:text-base font-semibold text-foreground">Order #{order.orderId}</span>
                <span className="h-1 sm:h-1.5 w-1 sm:w-1.5 shrink-0 rounded-full bg-border/60"></span>
                <span className="shrink-0 text-xs sm:text-sm font-medium text-muted-foreground">{mounted ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '---'}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                <span className="shrink-0 font-medium">{order.items.length} item{order.items.length === 1 ? '' : 's'}</span>
                <span className="h-1 sm:h-1.5 w-1 sm:w-1.5 shrink-0 rounded-full bg-border/60"></span>
                <span className="font-semibold text-foreground">Rs. {order.totalAmount.toLocaleString('en-PK')}</span>
                {order.shippingAmount != null && (
                  <>
                    <span className="h-1 sm:h-1.5 w-1 sm:w-1.5 shrink-0 rounded-full bg-border/60 hidden sm:block"></span>
                    <span className="hidden sm:inline-block font-medium">
                      + {order.shippingAmount === 0 ? 'Free' : `Rs. ${order.shippingAmount.toLocaleString('en-PK')}`}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-4">
              {hasUnreviewedItems ? (
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  className="hidden sm:flex h-8 sm:h-9 shrink-0 gap-1.5 sm:gap-2 rounded-full px-4 sm:px-5 text-xs sm:text-sm font-medium shadow-sm transition-transform active:scale-[0.96]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReviewClick(order);
                  }}
                >
                  <MessageSquare className="size-3.5 sm:size-4" />
                  Review
                </Button>
              ) : null}
              {allReviewed ? (
                <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                  <span className="size-1.5 rounded-full bg-success"></span>
                  Done
                </div>
              ) : null}
              
              <div className={cn("hidden sm:flex items-center gap-1.5 sm:gap-2 rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-semibold", style.bg, style.text)}>
                <span className={cn("size-1.5 sm:size-2 rounded-full", style.dot)} />
                {status}
              </div>

              <AccordionTrigger className="ml-2 sm:ml-3 flex size-9 sm:size-10 shrink-0 flex-none items-center justify-center rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground hover:no-underline transition-colors p-0 border-0 [&_[data-slot=accordion-trigger-icon]]:m-0 [&_[data-slot=accordion-trigger-icon]]:size-4 sm:[&_[data-slot=accordion-trigger-icon]]:size-5">
                <span className="sr-only">Expand order details</span>
              </AccordionTrigger>
            </div>
          </div>
        )}
        <AccordionContent className="pb-5 sm:pb-6 pt-2 px-0 sm:px-2">
          {renderOrderCard(order)}
        </AccordionContent>
      </AccordionItem>
    );
  };

  const renderOrdersSection = (sectionKey, ordersForSection, emptyTitle, emptyDescription, Icon) => {
    if (ordersForSection.length === 0) {
      return renderEmptyState(emptyTitle, emptyDescription, Icon);
    }

    const { featuredOrders, collapsibleOrders } = splitOrdersForDisplay(ordersForSection);
    const openOrderIds = sectionKey === 'active' ? activeOpenOrderIds : historyOpenOrderIds;
    const setOpenOrderIds = sectionKey === 'active' ? setActiveOpenOrderIds : setHistoryOpenOrderIds;

    return (
      <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {featuredOrders.map(renderOrderCard)}

        {collapsibleOrders.length > 0 ? (
          <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
            <div className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Archive className="size-3.5 sm:size-4 opacity-70" />
              Previous Orders
            </div>
            <Accordion
              className="flex flex-col gap-3 sm:gap-4"
              multiple
              value={openOrderIds}
              onValueChange={(value) => setOpenOrderIds(Array.isArray(value) ? value : [])}
            >
              {collapsibleOrders.map((order) => renderCollapsedOrderItem(order, openOrderIds.includes(order._id)))}
            </Accordion>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-8 sm:gap-10">
        <TabsList className="h-11 sm:h-12 w-full justify-start p-1 overflow-x-auto rounded-full bg-muted/40 shadow-inner sm:w-max ring-1 ring-border/20">
          <TabsTrigger 
            value="active" 
            className="h-full rounded-full px-6 sm:px-8 text-[13px] sm:text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Active Orders
            {activeOrders.length > 0 ? (
              <span className="ml-2.5 flex size-4 sm:size-5 items-center justify-center rounded-full bg-primary/10 text-[9px] sm:text-[10px] font-bold text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {activeOrders.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="h-full rounded-full px-6 sm:px-8 text-[13px] sm:text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Order History
            {historyOrders.length > 0 ? (
              <span className="ml-2.5 flex size-4 sm:size-5 items-center justify-center rounded-full bg-muted-foreground/10 text-[9px] sm:text-[10px] font-bold text-muted-foreground data-[state=active]:bg-foreground data-[state=active]:text-background">
                {historyOrders.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="m-0 focus-visible:outline-none">
          {renderOrdersSection(
            'active',
            activeOrders,
            'No active orders',
            "You don't have any ongoing shipments at the moment.",
            PackageSearch
          )}
        </TabsContent>

        <TabsContent value="history" className="m-0 focus-visible:outline-none">
          {renderOrdersSection(
            'history',
            historyOrders,
            'No order history',
            'Your completed orders will appear here.',
            Archive
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
