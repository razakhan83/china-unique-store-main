'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Package,
  MessageSquare,
  ChevronDown,
  ShoppingBag,
  Clock,
  CalendarDays,
  ClipboardCheck,
  Settings,
  Truck,
  MapPin,
  CheckCircle2,
  PackageCheck,
  Star,
  X,
  Camera,
  Copy,
  Check,
  BadgeCheck
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

const ReviewModal = dynamic(() => import('@/components/ReviewModal'));
import { normalizeOrderStatus } from '@/lib/order-status';
import { cn } from '@/lib/utils';
import CopyButton from '@/components/CopyButton';
import InvoiceButton from '@/components/InvoiceButtonWrapper';

const ProgressTracker = ({ status }) => {
  const steps = [
    { label: 'Order Confirmed', key: 'Order Confirmed', Icon: ClipboardCheck },
    { label: 'In Process', key: 'In Process', Icon: Clock },
    { label: 'Packed', key: 'Packed', Icon: Package },
    { label: 'Shipped', key: 'Shipped', Icon: Truck },
    { label: 'Out for delivery', key: 'Out For Delivery', Icon: MapPin },
  ];
  
  const norm = normalizeOrderStatus(status);
  let currentIndex = steps.findIndex(s => s.key === norm);
  const isDelivered = norm === 'Delivered';
  if (isDelivered) currentIndex = 4; // all complete
  
  if (currentIndex === -1 && !isDelivered) {
    return null; // Don't render for cancelled/returned
  }
  
  return (
    <div className="relative mt-4 mb-10 w-full max-w-3xl mx-auto md:mx-0">
      <div className="flex items-center justify-between relative z-10 px-2 sm:px-4">
        {/* Background Line */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[3px] bg-gray-200 -z-10 rounded-full" />
        {/* Active Line */}
        {currentIndex >= 0 && (
          <div 
            className="absolute left-4 top-1/2 -translate-y-1/2 h-[3px] bg-primary -z-10 rounded-full transition-all duration-700 ease-out" 
            style={{ width: `calc(${isDelivered ? 100 : (currentIndex / (steps.length - 1)) * 100}% - 2rem)` }} 
          />
        )}
        
        {steps.map((step, index) => {
          const isCompleted = isDelivered || index < currentIndex;
          const isActive = !isDelivered && index === currentIndex;
          const StepIcon = step.Icon;
          
          return (
            <div key={step.key} className="relative flex flex-col items-center justify-center">
              
              {isCompleted && (
                <div className="size-[26px] sm:size-[30px] rounded-full bg-primary ring-[3px] ring-white flex items-center justify-center shadow-sm z-10">
                  <StepIcon className="size-3.5 sm:size-4 text-primary-foreground" strokeWidth={2.5} />
                </div>
              )}
              
              {isActive && (
                <div className="flex items-center justify-center bg-white z-10 px-1 sm:px-2">
                  <StepIcon className="size-[22px] sm:size-[26px] text-blue-600 animate-pulse drop-shadow-[0_0_6px_rgba(37,99,235,0.4)]" strokeWidth={2.5} />
                </div>
              )}

              {(!isCompleted && !isActive) && (
                <div className="flex items-center justify-center bg-white z-10 p-1 rounded-full">
                  <div className="size-2.5 rounded-full bg-gray-300 ring-2 ring-white" />
                </div>
              )}

              <span className={cn(
                "absolute top-8 sm:top-10 text-[9px] sm:text-xs font-bold transition-colors duration-500",
                "text-center w-[56px] sm:w-auto leading-[1.1] sm:leading-normal whitespace-normal sm:whitespace-nowrap",
                "hidden min-[360px]:block", // Hide text on extremely small screens (<360px) like old SE
                isCompleted ? "text-gray-900" :
                isActive ? "text-blue-700" : "text-gray-400"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DeliveredStamp = ({ className }) => (
  <div className={cn("flex items-center justify-center rotate-[-10deg] pointer-events-none select-none", className)}>
    <div className="relative border-[2.5px] md:border-[4px] border-primary text-primary px-2.5 py-1 md:px-4 md:py-2 rounded-[10px] md:rounded-[14px] flex items-center gap-1.5 md:gap-2 opacity-95 shadow-sm bg-white/60 backdrop-blur-sm">
      <BadgeCheck className="size-4 md:size-6" strokeWidth={2.5} />
      <span className="font-black text-[12px] md:text-[17px] tracking-widest uppercase leading-none mt-0.5" style={{ WebkitTextStroke: '0.5px currentColor' }}>DELIVERED</span>
    </div>
  </div>
);

const TrackingTimeline = ({ order, mounted }) => {
  const steps = [
    { label: 'Order Confirmed', key: 'Order Confirmed' },
    { label: 'In Process', key: 'In Process' },
    { label: 'Packed', key: 'Packed' },
    { label: 'Shipped', key: 'Shipped' },
    { label: 'Out for delivery', key: 'Out For Delivery' },
    { label: 'Delivered', key: 'Delivered' }
  ];
  
  const norm = normalizeOrderStatus(order.status);
  let currentIndex = steps.findIndex(s => s.key === norm);
  const isDelivered = norm === 'Delivered';
  if (isDelivered) currentIndex = 5;
  
  const createdDate = mounted ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const updatedDate = mounted ? new Date(order.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  const getStatusDate = (stepKey, index, isActive, isCompleted) => {
    if (!mounted) return null;
    
    // Look for it in statusHistory if it exists
    if (order.statusHistory && order.statusHistory.length > 0) {
      const historyItem = order.statusHistory.find(h => normalizeOrderStatus(h.status) === stepKey);
      if (historyItem && historyItem.timestamp) {
        return new Date(historyItem.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
    }
    
    // Fallbacks if not in history
    if (index === 0) return createdDate;
    if (isActive || (isDelivered && index === 5)) return updatedDate;
    
    return null;
  };

  return (
    <div className="flex flex-col">
      {steps.map((step, index) => {
        const isPast = index < currentIndex;
        const isActive = index === currentIndex;
        const dateToShow = getStatusDate(step.key, index, isActive, isPast);
        const isLast = index === steps.length - 1;

        return (
          <div 
            key={step.key} 
            className="flex gap-5 group animate-in slide-in-from-left-4 fade-in fill-mode-both duration-500"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            {/* Timeline Column */}
            <div className="flex flex-col items-center">
              {/* Dot */}
              <div className="relative mt-1">
                {isActive && (
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                )}
                <div className={cn(
                  "size-3.5 rounded-full z-10 transition-all duration-500 shrink-0 relative",
                  isPast || isDelivered ? "bg-primary shadow-sm ring-4 ring-primary/10" : 
                  isActive ? "bg-white border-[3px] border-primary ring-4 ring-primary/20 scale-110" : "bg-gray-200"
                )} />
              </div>
              {/* Line */}
              {!isLast && (
                <div className={cn(
                  "w-[2px] h-full min-h-[36px] my-1.5 transition-colors duration-500 rounded-full",
                  isPast || (isDelivered && index < 5) ? "bg-primary" : "bg-gray-100"
                )} />
              )}
            </div>
            
            {/* Content Column */}
            <div className="flex flex-col pb-8 pt-0.5">
              <span className={cn(
                "text-[15px] font-bold leading-none tracking-tight transition-colors duration-500",
                isPast || isActive || isDelivered ? "text-gray-900" : "text-gray-400"
              )}>
                {step.label}
              </span>
              {dateToShow && (
                <span className="text-[13px] font-medium text-gray-500 mt-2 flex items-center gap-1.5 animate-in fade-in duration-500">
                  <Clock className="size-3.5 opacity-70" />
                  {dateToShow}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};


export default function OrdersClient({ initialOrders, invoiceBranding }) {
  const [activeTab, setActiveTab] = useState('not_shipped');
  const [timeFilter, setTimeFilter] = useState('past_3_months');
  const [mounted, setMounted] = useState(false);
  const [feedbackOrder, setFeedbackOrder] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [reviewedOrders, setReviewedOrders] = useState([]);

  const orders = initialOrders || [];

  useEffect(() => {
    setMounted(true);
    const stored = JSON.parse(localStorage.getItem('reviewedOrders') || '[]');
    setReviewedOrders(stored);
  }, []);

  const handleFeedbackSuccess = (orderId) => {
    const newReviewed = [...reviewedOrders, orderId];
    setReviewedOrders(newReviewed);
    localStorage.setItem('reviewedOrders', JSON.stringify(newReviewed));
  };

  const activeOrders = orders.filter(o => ['Order Confirmed', 'In Process', 'Packed', 'Shipped', 'Out For Delivery'].includes(normalizeOrderStatus(o.status)));
  const deliveredOrders = orders.filter(o => ['Delivered', 'Returned'].includes(normalizeOrderStatus(o.status)));

  // Auto-popup logic for delivered orders
  useEffect(() => {
    if (mounted) {
      const isPermanentlyDismissed = localStorage.getItem('feedback_popup_dismissed') === 'true';
      if (isPermanentlyDismissed) return;

      const unreviewedDeliveredOrder = deliveredOrders.find(order => {
        // Use sessionStorage so it only pops up once per session per order
        const shownKey = `feedback_shown_${order.orderId}`;
        return !sessionStorage.getItem(shownKey) && !reviewedOrders.includes(order._id);
      });

      if (unreviewedDeliveredOrder && !feedbackOrder && !trackingOrder) {
        setFeedbackOrder(unreviewedDeliveredOrder);
        sessionStorage.setItem(`feedback_shown_${unreviewedDeliveredOrder.orderId}`, 'true');
      }
    }
  }, [mounted, deliveredOrders, feedbackOrder, trackingOrder, reviewedOrders]);
  
  let displayOrders = activeTab === 'not_shipped' ? activeOrders : deliveredOrders;

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8 items-start w-full font-sans">
        {/* Left Column (80%) */}
        <div className="w-full lg:flex-1 flex flex-col min-w-0">
          
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-3xl sm:text-[32px] font-bold text-gray-900 tracking-tight">Your Orders</h1>
            <Badge variant="secondary" className="bg-gray-100 text-gray-900 font-bold px-2.5 py-0.5 rounded-full text-sm">
              {displayOrders.length}
            </Badge>
          </div>

          {/* Tabs & Filter Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex p-1 bg-[#F1F3F5] rounded-xl w-max overflow-x-auto max-w-full no-scrollbar ring-1 ring-black/5">
              <button 
                onClick={() => setActiveTab('not_shipped')} 
                className={cn("px-5 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap", activeTab === 'not_shipped' ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50")}
              >
                Not Yet Shipped
              </button>
              <button 
                onClick={() => setActiveTab('delivered')} 
                className={cn("px-5 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap", activeTab === 'delivered' ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50")}
              >
                Delivered Orders
              </button>
            </div>
            
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[160px] bg-[#F1F3F5] border-transparent font-semibold text-gray-700 hover:bg-gray-200 focus:ring-0 rounded-xl h-10 px-4 ring-1 ring-black/5">
                <SelectValue placeholder="Time filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="past_3_months" className="font-medium">Past 3 Months</SelectItem>
                <SelectItem value="2026" className="font-medium">2026</SelectItem>
                <SelectItem value="2025" className="font-medium">2025</SelectItem>
                <SelectItem value="older" className="font-medium">Older</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Orders List */}
          <div className="flex flex-col gap-6">
            {displayOrders.length > 0 ? displayOrders.map(order => {
              const isDelivered = normalizeOrderStatus(order.status) === 'Delivered';
              const norm = normalizeOrderStatus(order.status);
              const itemCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
              
              return (
                <div key={order._id} className="rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
                  {/* Card Header */}
                  <div className="bg-[#F8F9FA] px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center text-sm gap-4 sm:gap-0 rounded-t-xl">
                    
                    {/* Left Side: Order Placed & Total (PC), Stacked (Mobile) */}
                    <div className="flex flex-row sm:flex-row gap-8 sm:gap-16">
                      <div className="flex flex-col gap-0.5 sm:gap-1">
                        <div className="text-gray-500 uppercase text-[10px] sm:text-[11px] font-bold tracking-widest flex items-center gap-1.5"><CalendarDays className="size-3.5 hidden sm:block" /> Order placed</div>
                        <div className="font-semibold text-gray-900 text-[13px] sm:text-sm">
                          {mounted ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '---'}
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:gap-1">
                        <div className="text-gray-500 uppercase text-[10px] sm:text-[11px] font-bold tracking-widest">Total</div>
                        <div className="font-semibold text-gray-900 text-[13px] sm:text-sm">Rs. {mounted ? order.totalAmount.toLocaleString('en-PK') : order.totalAmount}</div>
                      </div>
                    </div>
                    
                    {/* Right Side: Order # and Links */}
                    <div className="flex flex-col sm:items-end gap-1.5 sm:gap-1 pt-3 sm:pt-0 border-t border-gray-200 sm:border-0 mt-1 sm:mt-0">
                      <div className="text-gray-900 font-semibold text-[13px] sm:text-sm flex items-center gap-2">
                        Order # {order.orderId}
                        <CopyButton text={order.orderId} className="size-5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Link href={`/orders/${order._id}`} className="text-primary hover:underline font-bold text-[13px]">
                          View order details
                        </Link>
                        <div className="w-px h-3 bg-gray-300" />
                        <InvoiceButton order={order} branding={invoiceBranding} variant="link" className="text-primary hover:underline font-bold text-[13px] p-0 h-auto" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="p-6">
                    <div className="mb-6">
                      {isDelivered ? (
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-col gap-1">
                            <h3 className="text-[17px] sm:text-[19px] font-bold text-gray-900 tracking-tight">
                              Delivered {mounted ? new Date(order.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">Your package was delivered successfully.</p>
                          </div>
                          <div className="shrink-0 ml-2 opacity-90 select-none">
                             <DeliveredStamp className="origin-right" />
                          </div>
                        </div>
                      ) : (
                        <h3 className="text-[17px] sm:text-[19px] font-bold text-gray-900 tracking-tight">
                          Estimated Delivery: {mounted ? (() => {
                            const minD = new Date(new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000);
                            const maxD = new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000);
                            return `${minD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${maxD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                          })() : ''} — Currently {norm}
                        </h3>
                      )}
                    </div>
                    
                    {!isDelivered && norm !== 'Cancelled' && norm !== 'Returned' && (
                      <ProgressTracker status={order.status} />
                    )}

                    {/* Order Action Buttons & Summary */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                         <div className="size-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
                            <Package className="size-5 text-gray-400" />
                         </div>
                         <span>{itemCount} Item{itemCount === 1 ? '' : 's'}</span>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-6">
                        {isDelivered ? (
                          <>
                            {reviewedOrders.includes(order._id) ? (
                              <Button disabled className="bg-gray-100 text-gray-400 rounded-xl h-11 px-6 shadow-none font-semibold w-full sm:w-auto cursor-not-allowed">
                                <CheckCircle2 className="size-4 mr-2" />
                                Reviewed
                              </Button>
                            ) : (
                              <Button 
                                onClick={() => setFeedbackOrder(order)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 px-6 shadow-sm font-semibold transition-all active:scale-[0.98] w-full sm:w-auto"
                              >
                                <MessageSquare className="size-4 mr-2" />
                                Give feedback
                              </Button>
                            )}
                            <Button 
                              variant="outline"
                              onClick={() => setTrackingOrder(order)}
                              className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl h-11 px-6 font-semibold w-full sm:w-auto"
                            >
                              Tracking history
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button render={<Link href={`/orders/${order._id}`} />} nativeButton={false} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 px-6 shadow-sm font-semibold transition-all active:scale-[0.98] w-full sm:w-auto">
                              View your items
                            </Button>
                            <Button 
                              variant="outline" 
                              className="h-11 px-6 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold shadow-sm transition-all active:scale-[0.98] w-full sm:w-auto"
                              onClick={() => setTrackingOrder(order)}
                            >
                              Track package
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <Empty className="rounded-2xl border border-dashed border-gray-200 py-20 bg-white">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="size-16 rounded-full bg-[#F1F3F5] text-gray-400">
                    <ShoppingBag className="size-8" />
                  </EmptyMedia>
                  <EmptyTitle className="text-xl font-bold text-gray-900 mt-4">No orders found</EmptyTitle>
                  <EmptyDescription className="text-sm text-gray-500 mt-1">
                    {activeTab === 'not_shipped' 
                      ? "You don't have any pending orders." 
                      : "You don't have any delivered orders."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </div>
        
        {/* Right Column (20% Sticky Sidebar) */}
        <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 pt-0 lg:pt-[72px]">
          <div className="sticky top-24 rounded-2xl border border-gray-200 bg-[#F8F9FA] p-6 shadow-sm flex flex-col">
            <div className="size-12 rounded-xl bg-white ring-1 ring-gray-200/60 shadow-sm flex items-center justify-center mb-5">
               <MessageSquare className="size-6 text-primary" />
            </div>
            <h3 className="text-[17px] font-bold text-gray-900 mb-2">Send us a message</h3>
            <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
              If you are unable to find answers, please describe your issue and we will provide solutions within the next 24 hours.
            </p>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 font-semibold shadow-sm transition-all active:scale-[0.98]">
              Send us a message
            </Button>
          </div>
        </div>
      </div>

      {/* Tracking Modal */}
      <Dialog open={!!trackingOrder} onOpenChange={(open) => !open && setTrackingOrder(null)}>
        <DialogContent className="max-w-[440px] md:max-w-[500px] w-full bg-white p-0 overflow-hidden rounded-[24px] border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] gap-0 font-sans">
          {trackingOrder && (
             <div className="flex flex-col h-full relative">
               {/* Elegant Header */}
               <div className="px-7 md:px-9 pt-8 pb-5 flex flex-col gap-1 border-b border-gray-50 relative overflow-hidden">
                  <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight z-10 relative">Track Order</DialogTitle>
                  <DialogDescription className="text-xs font-bold text-gray-400 uppercase tracking-widest z-10 relative">#{trackingOrder.orderId}</DialogDescription>
                  
                  {normalizeOrderStatus(trackingOrder.status) === 'Delivered' && (
                    <div className="absolute right-4 top-4 md:right-8 md:top-6 z-20 origin-top-right animate-in zoom-in-75 fade-in duration-500">
                       <DeliveredStamp className="scale-100" />
                    </div>
                  )}
               </div>
               
               {/* Tracking Info Area */}
               {trackingOrder.trackingNumber ? (
                 <div className="px-7 md:px-9 py-5 bg-gray-50/50 border-b border-gray-100 flex flex-col gap-3">
                    <div className="flex items-center justify-between group">
                      <div className="flex flex-col gap-1">
                         <span className="text-[11px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5 cursor-pointer hover:text-primary/80 transition-colors"
                           onClick={() => {
                              navigator.clipboard.writeText(trackingOrder.courierName || 'Courier');
                              toast?.success?.("Courier name copied!");
                           }}
                         >
                           {trackingOrder.courierName || 'Courier'}
                           <Copy className="size-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                         </span>
                         <span 
                           className="text-xl font-bold text-gray-900 tracking-tight font-mono cursor-pointer hover:text-gray-600 transition-colors flex items-center gap-2"
                           onClick={() => {
                             navigator.clipboard.writeText(trackingOrder.trackingNumber);
                             const el = document.getElementById('copy-icon-' + trackingOrder.orderId);
                             if(el) {
                                el.classList.replace('text-gray-400', 'text-green-600');
                                setTimeout(() => {
                                  el.classList.replace('text-green-600', 'text-gray-400');
                                }, 2000);
                             }
                           }}
                         >
                           {trackingOrder.trackingNumber}
                           <Copy id={'copy-icon-' + trackingOrder.orderId} className="size-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95" />
                         </span>
                      </div>
                    </div>
                    <div className="text-[13px] font-medium text-gray-500 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      Your package has been shipped and is on its way.
                    </div>
                 </div>
               ) : (
                 <div className="px-7 md:px-9 py-6 bg-gray-50/50 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-500 leading-relaxed animate-in fade-in">
                      Your order is currently being processed. Tracking details will appear here once your package ships.
                    </p>
                 </div>
               )}
               
               {/* Timeline */}
               <div className="px-7 md:px-9 py-8">
                  <TrackingTimeline order={trackingOrder} mounted={mounted} />
               </div>
             </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Feedback Modal */}
      {feedbackOrder && (
        <FeedbackModal 
          order={feedbackOrder} 
          onRemindLater={() => {
            sessionStorage.setItem(`feedback_shown_${feedbackOrder.orderId}`, 'true');
            setFeedbackOrder(null);
          }}
          onDismissPermanently={() => {
            localStorage.setItem('feedback_popup_dismissed', 'true');
            setFeedbackOrder(null);
          }}
          onClose={() => {
            setFeedbackOrder(null);
          }}
          onSuccess={handleFeedbackSuccess}
        />
      )}
    </>
  );
}

// ------------------------------------------------------------------
// Custom Feedback Modal Component (Per-Product Reviews)
// ------------------------------------------------------------------
const FeedbackModal = ({ order, onRemindLater, onDismissPermanently, onClose, onSuccess }) => {
  const getItemKey = (item, idx) => item._id ? item._id : `${item.productId}-${idx}`;

  // Initialize state for each product in the order
  const [reviews, setReviews] = useState(() => {
    return order.items.reduce((acc, item, idx) => ({
      ...acc,
      [getItemKey(item, idx)]: { rating: 0, hoverRating: 0, text: '', images: [], productId: item.productId }
    }), {});
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateReview = (itemKey, field, value) => {
    setReviews(prev => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        [field]: value
      }
    }));
  };

  const handleImageChange = (itemKey, e) => {
    if (e.target.files) {
      const currentImages = reviews[itemKey].images;
      const selected = Array.from(e.target.files).slice(0, 2 - currentImages.length);
      const newImages = selected.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      updateReview(itemKey, 'images', [...currentImages, ...newImages].slice(0, 2));
    }
  };

  const removeImage = (itemKey, idx) => {
    const currentImages = reviews[itemKey].images;
    updateReview(itemKey, 'images', currentImages.filter((_, i) => i !== idx));
  };

  const hasAnyRating = Object.values(reviews).some(r => r.rating > 0);

  const uploadImages = async (imagesArray) => {
    if (!imagesArray || imagesArray.length === 0) return [];
    
    const sigRes = await fetch('/api/cloudinary-sign?folder=kifayatly_reviews');
    const sigData = await sigRes.json();
    if (!sigRes.ok) throw new Error(sigData.error || 'Failed to get Cloudinary signature');

    const urls = [];
    for (const img of imagesArray) {
      const formData = new FormData();
      formData.append('file', img.file);
      formData.append('api_key', sigData.apiKey);
      formData.append('timestamp', sigData.timestamp);
      formData.append('signature', sigData.signature);
      formData.append('folder', sigData.folder);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error?.message || 'Failed to upload image');
      urls.push(uploadData.secure_url);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!hasAnyRating) return;
    setIsSubmitting(true);
    
    try {
      for (const itemKey of Object.keys(reviews)) {
        const review = reviews[itemKey];
        if (review.rating > 0) {
          const imageUrls = await uploadImages(review.images);
          
          const res = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: review.productId,
              rating: review.rating,
              comment: review.text,
              images: imageUrls
            })
          });
          
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Failed to submit review');
          }
        }
      }
      
      setSubmitted(true);
      if (onSuccess) {
        onSuccess(order._id);
      }
      setTimeout(() => {
        if (onClose) onClose();
        else onDismissPermanently();
      }, 2000);
    } catch (error) {
      // Assuming toast from 'sonner' is available in scope or we use standard alert
      alert(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl w-full max-w-sm p-8 text-center shadow-2xl transform scale-100 animate-in zoom-in-95 duration-300">
          <div className="mx-auto size-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h2>
          <p className="text-gray-500 text-sm">Your feedback will help others make better choices.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Review your items</h2>
            <p className="text-sm text-gray-500 mt-1">Order #{order.orderId}</p>
          </div>
          <button 
            onClick={onDismissPermanently}
            className="size-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {order.items.map((item, index) => {
            const itemKey = getItemKey(item, index);
            const itemReview = reviews[itemKey];
            
            return (
              <div key={itemKey} className={cn("mb-8 pb-8", index !== order.items.length - 1 && "border-b border-gray-100")}>
                {/* Product Info */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative size-12 sm:size-14 rounded-lg bg-gray-100 shrink-0 overflow-hidden border border-gray-200">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="size-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{item.name}</h4>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Rate this product</span>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="flex flex-col mb-4">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => updateReview(itemKey, 'rating', star)}
                        onMouseEnter={() => updateReview(itemKey, 'hoverRating', star)}
                        onMouseLeave={() => updateReview(itemKey, 'hoverRating', 0)}
                        className="transition-transform active:scale-90"
                      >
                        <Star 
                          className={cn(
                            "size-8 sm:size-10 transition-all duration-200",
                            (itemReview.hoverRating || itemReview.rating) >= star 
                              ? "fill-[#facc15] text-[#facc15] drop-shadow-[0_2px_4px_rgba(250,204,21,0.3)]" 
                              : "fill-transparent text-gray-200 hover:text-gray-300"
                          )} 
                          strokeWidth={1.5}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expanded Section (Text & Images) - Only shows if rated */}
                {itemReview.rating > 0 && (
                  <div className="animate-in slide-in-from-top-2 fade-in duration-300 space-y-4">
                    {/* Text Review */}
                    <div>
                      <textarea 
                        value={itemReview.text}
                        onChange={(e) => updateReview(itemKey, 'text', e.target.value)}
                        placeholder="What did you like or dislike?"
                        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none h-24 bg-gray-50/50"
                      />
                    </div>

                    {/* Image Upload */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Add photos (optional)</label>
                        <span className="text-xs text-gray-400">{itemReview.images.length} / 2</span>
                      </div>
                      <div className="flex gap-3">
                        {itemReview.images.map((img, idx) => (
                          <div key={idx} className="relative size-16 sm:size-20 rounded-xl border border-gray-200 overflow-hidden group">
                            <Image src={img.preview} alt={`Upload ${idx+1}`} fill className="object-cover" />
                            <button 
                              onClick={() => removeImage(itemKey, idx)}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <X className="size-5 text-white drop-shadow-md" />
                            </button>
                          </div>
                        ))}
                        
                        {itemReview.images.length < 2 && (
                          <label className="size-16 sm:size-20 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center cursor-pointer transition-colors text-gray-500">
                            <Camera className="size-5 mb-1 text-gray-400" />
                            <span className="text-[9px] font-bold uppercase tracking-wider">Upload</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              multiple 
                              className="hidden" 
                              onChange={(e) => handleImageChange(itemKey, e)}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex gap-3 mt-auto shrink-0">
          <Button 
            variant="outline" 
            onClick={onRemindLater}
            className="flex-1 h-12 rounded-xl text-gray-600 font-semibold border-gray-200 hover:bg-gray-100 transition-all"
          >
            Remind me later
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!hasAnyRating || isSubmitting}
            className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Submitting...
              </span>
            ) : "Submit Reviews"}
          </Button>
        </div>
      </div>
    </div>
  );
};
