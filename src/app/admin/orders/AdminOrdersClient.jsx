'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, useTransition, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { formatDistanceToNow } from 'date-fns';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Calendar, Eye, Receipt, RotateCcw, Search, Trash2, X, Download, Edit, Zap, Check, ChevronsUpDown, MoreHorizontal, FileSpreadsheet, PackageCheck, Truck, Plus, Printer, Send, FileText } from 'lucide-react';
import AppPagination from '@/components/AppPagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import NocTrackingModal from '@/components/NocTrackingModal';
import { NOC_PORTALS } from '@/lib/nocCourier';
const OrderQuickViewDialog = dynamic(() => import('./OrderQuickViewDialog'));
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from '@/components/ui/field';
import { getBlurPlaceholderProps } from '@/lib/imagePlaceholder';
import { getPrimaryProductImage } from '@/lib/productImages';
import { getProductCategoryNames } from '@/lib/productCategories';
import { cn } from '@/lib/utils';
import { PAKISTAN_CITIES } from '@/lib/cities';
import { bulkUpdateOrderStatusAction, createDraftOrderAction, deleteOrderAction, emptyTrashAction, hardDeleteOrderAction, restoreOrderAction, updateOrderAction } from '@/app/actions';
import { DEFAULT_ORDER_STATUS, ORDER_STATUSES, normalizeOrderStatus } from '@/lib/order-status';
import { toast } from 'sonner';

const statusVariant = {
  'Order Confirmed': 'primary',
  'In Process': 'secondary',
  Packed: 'secondary',
  Shipped: 'secondary',
  'Out For Delivery': 'secondary',
  Delivered: 'secondary',
  Returned: 'outline',
};

const BULK_STATUS_OPTIONS = ORDER_STATUSES;
const DRAFT_TAB_ID = 'draft';
const TRASH_TAB_ID = 'trash';
const DRAFT_SOURCE_OPTIONS = [
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Insta', label: 'Insta' },
  { value: 'Others', label: 'Others' },
];

// Deterministic city → pastel color mapping for visual scanning
const CITY_COLOR_PALETTE = [
  'bg-sky-100 text-sky-800 border-sky-200',
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-pink-100 text-pink-800 border-pink-200',
];

function getCityColorClass(city) {
  if (!city) return 'bg-slate-100 text-slate-600 border-slate-200';
  let hash = 0;
  for (let i = 0; i < city.length; i++) {
    hash = city.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CITY_COLOR_PALETTE[Math.abs(hash) % CITY_COLOR_PALETTE.length];
}

const formatPrice = (price) => `PKR ${Number(price || 0).toLocaleString('en-PK')}`;

const getCodAmount = (order) => {
  if (order?.manualCodAmount != null && order.manualCodAmount !== '') {
    return Number(order.manualCodAmount);
  }
  return Number(order?.totalAmount || 0);
};

const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });
const formatWeight = (weight) => `${Number(weight || 0).toFixed(1)} kg`;

const isNewOrder = (dateStr) => {
  if (!dateStr) return false;
  const orderDate = new Date(dateStr);
  const now = new Date();
  const diffHours = (now - orderDate) / (1000 * 60 * 60);
  return diffHours <= 24;
};

function sanitizePdfText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPrintCurrency(value) {
  return `PKR ${Number(value || 0).toLocaleString('en-PK')}`;
}

function formatPrintAddress(order) {
  return [order?.customerAddress, order?.customerCity].filter(Boolean).join(', ') || 'N/A';
}

function buildPrintDocument({ title, content }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        --page-bg: #eef2f7;
        --paper-bg: #ffffff;
        --ink: #0f172a;
        --muted: #475569;
        --line: #cbd5e1;
        --line-soft: #e2e8f0;
        --panel: #f8fafc;
        --accent: #111827;
      }

      * {
        box-sizing: border-box;
      }

      html, body {
        margin: 0;
        padding: 0;
        background: var(--page-bg);
        color: var(--ink);
        font-family: Arial, Helvetica, sans-serif;
      }

      body {
        padding: 24px;
      }

      .print-shell {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        background: var(--paper-bg);
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
      }

      .print-page {
        width: 100%;
        min-height: 297mm;
        padding: 10mm;
      }

      .print-page + .print-page {
        margin-top: 16px;
      }

      .page-break {
        break-before: page;
        page-break-before: always;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      thead {
        display: table-header-group;
      }

      tr, img, .avoid-break {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      img {
        max-width: 100%;
        display: block;
      }

      @page {
        size: A4 portrait;
        margin: 10mm;
      }

      @media print {
        html, body {
          width: 210mm;
          background: #fff;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        body {
          padding: 0;
        }

        .print-shell {
          width: auto;
          min-height: auto;
          margin: 0;
          box-shadow: none;
        }

        .print-page {
          min-height: auto;
          padding: 0;
        }

        .print-page + .print-page {
          margin-top: 0;
        }
      }
    </style>
  </head>
  <body>
    ${content}
  </body>
</html>`;
}

function getStatusBadgeClass(status) {
  const normalizedStatus = normalizeOrderStatus(status).toLowerCase();

  if (normalizedStatus === 'order confirmed') {
    return 'border-sky-200 bg-sky-100 text-sky-800';
  }

  if (normalizedStatus === 'delivered') {
    return 'border-emerald-200 bg-emerald-100 text-emerald-800';
  }

  if (
    normalizedStatus.includes('issue') ||
    normalizedStatus.includes('return')
  ) {
    return 'border-red-200 bg-red-100 text-red-800';
  }

  if (
    normalizedStatus === 'in process' ||
    normalizedStatus === 'packed' ||
    normalizedStatus === 'shipped' ||
    normalizedStatus === 'out for delivery'
  ) {
    return 'border-amber-200 bg-amber-100 text-amber-800';
  }

  return 'border-slate-200 bg-slate-100 text-slate-800';
}

function buildHref(pathname, searchParams, updates) {
  const params = new URLSearchParams(searchParams?.toString());

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '' || (key === 'status' && value === DEFAULT_ORDER_STATUS)) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function OrdersTablePendingSkeleton() {
  return (
    <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
      <div className="overflow-x-auto">
        <div className="min-w-[960px]">
          <div className="grid grid-cols-[40px_120px_1.4fr_90px_110px_90px_120px_90px_100px_120px_70px] gap-0 border-b border-border bg-muted/40 px-3 py-2">
            {Array.from({ length: 11 }).map((_, index) => (
              <div key={index} className="px-2 py-1">
                <Skeleton className="h-3 w-full max-w-[72px] rounded-md" />
              </div>
            ))}
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 7 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="grid grid-cols-[40px_120px_1.4fr_90px_110px_90px_120px_90px_100px_120px_70px] items-center px-3 py-3"
              >
                <div className="px-2">
                  <Skeleton className="size-4 rounded-sm" />
                </div>
                <div className="px-2">
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
                <div className="space-y-2 px-2">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
                <div className="px-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="space-y-2 px-2">
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
                <div className="px-2">
                  <Skeleton className="h-4 w-12 rounded-md" />
                </div>
                <div className="space-y-2 px-2">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
                <div className="px-2">
                  <Skeleton className="h-4 w-14 rounded-md" />
                </div>
                <div className="px-2">
                  <Skeleton className="ml-auto h-4 w-20 rounded-md" />
                </div>
                <div className="px-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <div className="px-2">
                  <Skeleton className="ml-auto h-7 w-10 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrdersMobilePendingSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-border border-y border-border bg-card md:hidden">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-3">
          <Skeleton className="size-4 rounded-sm shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-32 rounded-md" />
              <Skeleton className="h-4 w-12 rounded-md" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-6 w-14 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminOrdersClient({
  initialOrders,
  productCatalog,
  total,
  totalPages,
  currentPage,
  pageSize,
  initialSearchQuery,
  initialStatusFilter,
  initialStartDate,
  initialEndDate,
  summary,
  initialTrashOrders = [],
  initialCreateOrder = false,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startNavTransition] = useTransition();
  const [orders, setOrders] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [bulkStatus, setBulkStatus] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [pendingWorkflowAction, setPendingWorkflowAction] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [createSourceOpen, setCreateSourceOpen] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [citySuggestionsOpen, setCitySuggestionsOpen] = useState(false);
  const [customerSuggestionsOpen, setCustomerSuggestionsOpen] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const searchTimeoutRef = useRef(null);
  const defaultUnknownItem = { productId: 'unknown-default', isCustom: true, name: 'Unknown item', price: 100, quantity: 1 };
  const [draftForm, setDraftForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerCity: '',
    landmark: '',
    sourceTag: '',
    itemType: 'Mix',
    weight: '2',
    notes: '',
    manualCodAmount: '',
    customItemName: '',
    customItemPrice: '',
  });
  const [draftItems, setDraftItems] = useState([defaultUnknownItem]);
  
  // Modals & Popovers State
  const [editingOrder, setEditingOrder] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Quick Action State (Status/Tracking)
  const [quickActionOrder, setQuickActionOrder] = useState(null);
  const [quickStatus, setQuickStatus] = useState('');
  const [quickTracking, setQuickTracking] = useState('');
  const [isQuickUpdating, setIsQuickUpdating] = useState(false);
  
  const [cityOpen, setCityOpen] = useState(false);

  // NOC Courier Integration State
  const [nocBookingOpen, setNocBookingOpen] = useState(false);
  const [selectedNocPortal, setSelectedNocPortal] = useState('portal_1');
  const [isBookingNoc, setIsBookingNoc] = useState(false);
  const [nocTrackingOrder, setNocTrackingOrder] = useState(null);
  const [nocPrintResult, setNocPrintResult] = useState(null);
  const [nocPrintAccountModal, setNocPrintAccountModal] = useState(null);

  const handleBulkNocBooking = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select at least one order to book with NOC Courier');
      return;
    }
    setIsBookingNoc(true);
    try {
      const res = await fetch('/api/admin/courier/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedOrders,
          portalKey: selectedNocPortal,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Successfully booked ${selectedOrders.length} parcel(s) with NOC Express!`);
        setNocBookingOpen(false);
        setNocPrintResult({
          count: data.updatedOrders?.length || selectedOrders.length,
          labelUrl: data.labelUrl || '',
          parcelNumbers: data.parcelNumbers || [],
          portalKey: data.portalKey || selectedNocPortal,
        });

        // Instantly filter out booked orders from Draft/Packed/In Process tabs so they move to Shipped!
        const selectedSet = new Set(selectedOrders.map((id) => String(id)));
        setOrders((prev) => {
          if (statusFilter === DRAFT_TAB_ID || statusFilter === 'Packed' || statusFilter === 'In Process' || statusFilter === 'Order Confirmed') {
            return prev.filter((o) => !selectedSet.has(String(o._id)) && !selectedSet.has(String(o.orderId)));
          }
          return prev.map((o) => {
            const matches = selectedSet.has(String(o._id)) || selectedSet.has(String(o.orderId));
            if (matches) {
              const updatedItem = data.updatedOrders?.find((u) => String(u.orderId) === String(o.orderId));
              return {
                ...o,
                status: 'Shipped',
                isDraft: false,
                courierName: 'NOC Express',
                nocAccountId: selectedNocPortal,
                nocLabelUrl: data.labelUrl || o.nocLabelUrl,
                trackingNumber: updatedItem?.trackingNumber || o.trackingNumber,
              };
            }
            return o;
          });
        });

        setSelectedOrders([]);
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to book parcels with NOC Express');
      }
    } catch (error) {
      console.error('NOC Booking Error:', error);
      toast.error('Connection error while booking with NOC Express');
    } finally {
      setIsBookingNoc(false);
    }
  };

  const handlePrintSelectedNocSlips = () => {
    const selectedSet = new Set(selectedOrders.map((id) => String(id)));
    const selectedObjList = orders.filter(
      (o) => selectedSet.has(String(o._id)) || selectedSet.has(String(o.orderId))
    );

    const getOrderLabelUrl = (o) => {
      if (o.nocLabelUrl && o.nocLabelUrl.trim().length > 0) return o.nocLabelUrl.trim();
      return null;
    };

    const bookedOrders = selectedObjList.filter((o) => getOrderLabelUrl(o));

    if (bookedOrders.length === 0) {
      toast.error('No NOC shipping slip URL found for selected orders. Please book with NOC Express first.');
      return;
    }

    const p1Orders = bookedOrders.filter((o) => o.nocAccountId === 'portal_1' || (!o.nocAccountId && getOrderLabelUrl(o)));
    const p2Orders = bookedOrders.filter((o) => o.nocAccountId === 'portal_2');

    const p1Urls = Array.from(new Set(p1Orders.map(getOrderLabelUrl).filter(Boolean)));
    const p2Urls = Array.from(new Set(p2Orders.map(getOrderLabelUrl).filter(Boolean)));
    const allUrls = Array.from(new Set(bookedOrders.map(getOrderLabelUrl).filter(Boolean)));

    setNocPrintAccountModal({
      p1Count: p1Orders.length,
      p1Urls,
      p2Count: p2Orders.length,
      p2Urls,
      allUrls,
    });
  };

  // Trash & Delete State
  const [trashOrders, setTrashOrders] = useState(initialTrashOrders);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, orderId, label }
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);
  const [emptyTrashConfirm, setEmptyTrashConfirm] = useState(false);

  // Auto-open create modal if navigated from admin home with ?createOrder=1
  useEffect(() => {
    if (initialCreateOrder) {
      setIsCreateModalOpen(true);
    }
  }, [initialCreateOrder]);

  useEffect(() => {
    setOrders(initialOrders);
    setSelectedOrders([]);
  }, [initialOrders]);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
    setStatusFilter(initialStatusFilter);
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
  }, [initialSearchQuery, initialStatusFilter, initialStartDate, initialEndDate]);

  useEffect(() => {
    setTrashOrders(initialTrashOrders);
  }, [initialTrashOrders]);

  const draftTotalAmount = draftItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
  const filteredDraftCities = useMemo(() => {
    const query = String(draftForm.customerCity || '').trim().toLowerCase();
    if (!query) {
      return PAKISTAN_CITIES.slice(0, 8);
    }

    return PAKISTAN_CITIES.filter((city) => city.toLowerCase().includes(query)).slice(0, 8);
  }, [draftForm.customerCity]);
  const availableDraftProducts = useMemo(() => {
    const selectedProductIds = new Set(draftItems.map((item) => item.productId));

    return (Array.isArray(productCatalog) ? productCatalog : [])
      .filter((product) => !selectedProductIds.has(String(product?._id || product?.slug || '').trim()))
      .map((product) => {
        const categoryNames = getProductCategoryNames(product);
        const primaryImage = getPrimaryProductImage(product);

        return {
          product,
          categoryNames,
          categorySummary: categoryNames.slice(0, 2),
          primaryImage,
          searchValue: [product.Name, product.slug || '', ...categoryNames].filter(Boolean).join(' '),
        };
      });
  }, [draftItems, productCatalog]);

  // Quick Add: first 3 products from catalog not already in draft
  const quickAddProducts = useMemo(() => {
    const selectedProductIds = new Set(draftItems.map((item) => item.productId));
    return (Array.isArray(productCatalog) ? productCatalog : [])
      .filter((p) => !selectedProductIds.has(String(p?._id || p?.slug || '').trim()))
      .slice(0, 3);
  }, [draftItems, productCatalog]);

  const displayOrders = orders;

  function navigate(updates) {
    const href = buildHref(pathname, searchParams, updates);
    startNavTransition(() => {
      router.push(href);
    });
  }

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter(DEFAULT_ORDER_STATUS);
    setStartDate('');
    setEndDate('');
    navigate({ search: null, status: null, startDate: null, endDate: null, page: null });
  };

  const handleQuickDateFilter = (value) => {
    let newStart = '';
    let newEnd = '';
    
    const today = new Date();
    
    if (value === 'today') {
      newStart = today.toISOString().split('T')[0];
      newEnd = newStart;
    } else if (value === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      newStart = yesterday.toISOString().split('T')[0];
      newEnd = newStart;
    } else if (value === 'lastWeek') {
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      newStart = lastWeek.toISOString().split('T')[0];
      newEnd = today.toISOString().split('T')[0];
    } else if (value === 'lastMonth') {
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      newStart = lastMonth.toISOString().split('T')[0];
      newEnd = today.toISOString().split('T')[0];
    }

    setStartDate(newStart);
    setEndDate(newEnd);
    
    navigate({
      search: searchQuery.trim() || null,
      startDate: newStart || null,
      endDate: newEnd || null,
      page: null,
    });
  };

  const getQuickDateValue = () => {
    if (!startDate && !endDate) return 'all';
    
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
    
    if (startDate === todayStr && endDate === todayStr) return 'today';
    if (startDate === yesterdayStr && endDate === yesterdayStr) return 'yesterday';
    
    const lastWeekDate = new Date();
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    if (startDate === lastWeekDate.toISOString().split('T')[0] && endDate === todayStr) return 'lastWeek';
    
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    if (startDate === lastMonthDate.toISOString().split('T')[0] && endDate === todayStr) return 'lastMonth';
    
    return 'custom';
  };

  const isAllPaginatedSelected = displayOrders.length > 0 && displayOrders.every(o => o && selectedOrders.includes(o._id));

  const handleSelectAll = (checked) => {
    if (checked) {
      const newSelected = new Set(selectedOrders);
      displayOrders.forEach(o => {
        if (o?._id) newSelected.add(o._id);
      });
      setSelectedOrders(Array.from(newSelected));
    } else {
      setSelectedOrders(selectedOrders.filter(id => !displayOrders.find(o => o?._id === id)));
    }
  };

  const handleSelectOne = (checked, id) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, id]);
    } else {
      setSelectedOrders(selectedOrders.filter(oId => oId !== id));
    }
  };

  const getSelectedOrders = () => orders.filter((order) => selectedOrders.includes(order._id));
  const getOrderDisplayStatus = (order) => (order?.isDraft ? 'Draft' : normalizeOrderStatus(order?.status));

  const resetDraftComposer = () => {
    setDraftForm({
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      customerCity: '',
      landmark: '',
      sourceTag: '',
      itemType: 'Mix',
      weight: '2',
      notes: '',
      manualCodAmount: '',
      customItemName: '',
      customItemPrice: '',
    });
    setDraftItems([{ productId: 'unknown-default', isCustom: true, name: 'Unknown item', price: 100, quantity: 1 }]);
    setCreateSourceOpen(false);
    setProductPickerOpen(false);
    setCitySuggestionsOpen(false);
  };

  const updateDraftField = (field, value) => {
    setDraftForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const addDraftProduct = (product) => {
    const productId = String(product?._id || product?.slug || '').trim();
    if (!productId) return;

    setDraftItems((current) => {
      const existingIndex = current.findIndex((item) => item.productId === productId);
      if (existingIndex >= 0) {
        return current.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...current,
        {
          productId,
          name: product.Name,
          price: Number(product.discountedPrice ?? product.Price ?? 0),
          image: getPrimaryProductImage(product)?.url || '',
          quantity: 1,
        },
      ];
    });
    setProductPickerOpen(false);
  };

  const updateDraftItemQuantity = (productId, nextQuantity) => {
    const safeQuantity = Math.max(1, Number(nextQuantity) || 1);
    setDraftItems((current) =>
      current.map((item) =>
        item.productId === productId
          ? { ...item, quantity: safeQuantity }
          : item
      )
    );
  };

  const removeDraftItem = (productId) => {
    setDraftItems((current) => current.filter((item) => item.productId !== productId));
  };

  const addCustomItemToDraft = () => {
    const name = String(draftForm.customItemName || '').trim();
    const price = Number(draftForm.customItemPrice) || 0;
    if (!name) { toast.error('Enter a custom item name first.'); return; }
    const customId = `custom-${Date.now()}`;
    setDraftItems((current) => [
      ...current,
      { productId: customId, name, price, image: '', quantity: 1 },
    ]);
    updateDraftField('customItemName', '');
    updateDraftField('customItemPrice', '');
  };

  const handleDeleteOrder = (order) => {
    setDeleteConfirm({ id: order._id, orderId: order.orderId, label: order.customerName });
  };

  const confirmDeleteOrder = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      const res = await deleteOrderAction(deleteConfirm.id);
      if (res.success) {
        toast.success(`Order ${deleteConfirm.orderId} moved to Trash.`);
        setOrders((prev) => prev.filter((o) => o._id !== deleteConfirm.id));
        setTrashOrders((prev) => [{
          _id: deleteConfirm.id,
          orderId: deleteConfirm.orderId,
          customerName: deleteConfirm.label,
          customerPhone: '',
          totalAmount: 0,
          deletedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }, ...prev]);
        setDeleteConfirm(null);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to delete order.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestoreOrder = async (id, orderId) => {
    const res = await restoreOrderAction(id);
    if (res.success) {
      toast.success(`Order ${orderId} restored.`);
      setTrashOrders((prev) => prev.filter((o) => o._id !== id));
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to restore order.');
    }
  };

  const handleHardDeleteOrder = async (id, orderId) => {
    const res = await hardDeleteOrderAction(id);
    if (res.success) {
      toast.success(`Order ${orderId} permanently deleted.`);
      setTrashOrders((prev) => prev.filter((o) => o._id !== id));
    } else {
      toast.error(res.error || 'Failed to delete order.');
    }
  };

  const handleEmptyTrash = async () => {
    setIsEmptyingTrash(true);
    try {
      const res = await emptyTrashAction();
      if (res.success) {
        toast.success(`Trash emptied — ${res.deletedCount} order${res.deletedCount === 1 ? '' : 's'} permanently deleted.`);
        setTrashOrders([]);
        setEmptyTrashConfirm(false);
      } else {
        toast.error(res.error || 'Failed to empty trash.');
      }
    } finally {
      setIsEmptyingTrash(false);
    }
  };

  const validateSelectedOrders = (expectedStatus, actionLabel) => {
    const normalizedExpectedStatus = normalizeOrderStatus(expectedStatus);
    const selectedRecords = getSelectedOrders();

    if (selectedRecords.length === 0) {
      toast.error(`Select at least one order to ${actionLabel.toLowerCase()}.`);
      return null;
    }

    const invalidOrders = selectedRecords.filter(
      (order) => normalizeOrderStatus(order.status) !== normalizedExpectedStatus
    );

    if (invalidOrders.length > 0) {
      toast.error(`${actionLabel} only works for ${normalizedExpectedStatus.toLowerCase()} orders.`);
      return null;
    }

    return selectedRecords;
  };

  const moveSelectedOrdersToStatus = async (nextStatus, options = {}) => {
    const selectedRecords = getSelectedOrders();
    if (selectedRecords.length === 0) {
      toast.error('Select at least one order first.');
      return false;
    }

    setIsBulkUpdating(true);
    try {
      const result = await bulkUpdateOrderStatusAction({
        orderIds: selectedRecords.map((order) => order._id),
        nextStatus,
        allowedCurrentStatuses: options.allowedCurrentStatuses || [],
        logReason: options.logReason || '',
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to update selected orders.');
        return false;
      }

      if (result.blockedOrders?.length > 0) {
        toast.error(`${result.blockedOrders.length} orders were skipped because their current status did not match this action.`);
      }

      if (result.updatedCount > 0) {
        const normalizedNextStatus = normalizeOrderStatus(nextStatus);
        setOrders((prev) =>
          prev.map((order) =>
            result.updatedOrderIds?.includes(order._id)
              ? { ...order, isDraft: false, status: normalizedNextStatus }
              : order
          )
        );
        toast.success(`${result.updatedCount} order${result.updatedCount === 1 ? '' : 's'} moved to ${normalizedNextStatus}.`);
      }

      setSelectedOrders([]);
      setBulkStatus('');
      router.refresh();
      return true;
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const blobToPngDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(blob);
      const image = new window.Image();

      image.crossOrigin = 'anonymous';
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const width = Math.max(1, image.naturalWidth || image.width || 1);
          const height = Math.max(1, image.naturalHeight || image.height || 1);
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext('2d');
          if (!context) {
            throw new Error('Unable to create image canvas.');
          }

          context.drawImage(image, 0, 0, width, height);
          const pngDataUrl = canvas.toDataURL('image/png');
          URL.revokeObjectURL(objectUrl);
          resolve(pngDataUrl);
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Unable to decode image file.'));
      };

      image.src = objectUrl;
    });

  const loadImageDataUrl = async (url) => {
    const safeUrl = String(url || '').trim();
    if (!safeUrl) return null;

    try {
      const response = await fetch(safeUrl);
      if (!response.ok) return null;
      const blob = await response.blob();
      return await blobToPngDataUrl(blob);
    } catch {
      return null;
    }
  };

  const collectSourcingSlipData = async (ordersToExport) => {
    const sourcingMap = new Map();

    ordersToExport.forEach((order) => {
      (Array.isArray(order.items) ? order.items : []).forEach((item, index) => {
        const productKey = String(item.productId || `${item.name || 'item'}-${index}`).trim();
        const existing = sourcingMap.get(productKey) || {
          image: item.image || '',
          itemName: sanitizePdfText(item.name || 'Unnamed item'),
          totalQuantity: 0,
          vendors: [],
        };

        existing.totalQuantity += Number(item.quantity || 0);
        if (!existing.image && item.image) {
          existing.image = item.image;
        }

        if (!existing.itemName) {
          existing.itemName = sanitizePdfText(item.name || 'Unnamed item');
        }

        const vendorMap = new Map(
          existing.vendors.map((vendor) => [
            `${vendor.vendorId || vendor.name}-${vendor.vendorProductName}-${vendor.vendorPrice}`,
            vendor,
          ])
        );

        (Array.isArray(item.sourcingVendors) ? item.sourcingVendors : []).forEach((vendor) => {
          const vendorKey = `${vendor.vendorId || vendor.name}-${vendor.vendorProductName}-${vendor.vendorPrice}`;
          if (!vendorMap.has(vendorKey)) {
            vendorMap.set(vendorKey, vendor);
          }
        });

        existing.vendors = Array.from(vendorMap.values());
        sourcingMap.set(productKey, existing);
      });
    });

    const sourcingRows = Array.from(sourcingMap.values());
    const imageEntries = await Promise.all(
      sourcingRows.map(async (row) => [row.image, await loadImageDataUrl(row.image)])
    );
    const imageLookup = new Map(imageEntries);

    const grandTotalCost = sourcingRows.reduce((total, row) => {
      const vendorPrices = row.vendors
        .map((vendor) => Number(vendor.vendorPrice))
        .filter((value) => Number.isFinite(value) && value >= 0);

      if (vendorPrices.length === 0) return total;
      return total + Math.min(...vendorPrices) * Number(row.totalQuantity || 0);
    }, 0);

    return {
      sourcingRows,
      imageLookup,
      grandTotalCost,
    };
  };

  const openPrintWindow = (title) => {
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      toast.error('Allow pop-ups to open the print tab.');
      return null;
    }

    printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title></head><body style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;">Preparing print view...</body></html>`);
    printWindow.document.close();
    return printWindow;
  };

  const writePrintWindow = (printWindow, title, content) => {
    if (!printWindow || printWindow.closed) return;
    printWindow.document.open();
    printWindow.document.write(buildPrintDocument({ title, content }));
    printWindow.document.close();
  };

  const renderSourcingPrintMarkup = (ordersToExport, sourcingRows, imageLookup, grandTotalCost) => {
    const generatedAt = new Date().toLocaleString('en-PK');
    const rowsMarkup = sourcingRows.map((row) => {
      const vendorsMarkup = row.vendors.length > 0
        ? row.vendors.map((vendor) => {
            const vendorName = escapeHtml(vendor.name || 'Vendor');
            const vendorProductName = escapeHtml(vendor.vendorProductName || '');
            const priceLabel = vendor.vendorPrice != null
              ? formatPrintCurrency(vendor.vendorPrice)
              : 'Price N/A';

            return `<li><strong>${vendorName}</strong>${vendorProductName ? ` (${vendorProductName})` : ''}<span>${escapeHtml(priceLabel)}</span></li>`;
          }).join('')
        : '<li><strong>No vendor data</strong><span>Price N/A</span></li>';

      const imageMarkup = imageLookup.get(row.image)
        ? `<img src="${imageLookup.get(row.image)}" alt="${escapeHtml(row.itemName)}" />`
        : '<div class="print-sourcing-image-fallback">No image</div>';

      return `
        <tr>
          <td class="print-sourcing-image-cell">${imageMarkup}</td>
          <td class="print-sourcing-name-cell">${escapeHtml(row.itemName)}</td>
          <td>
            <ul class="print-vendor-list">${vendorsMarkup}</ul>
          </td>
          <td class="print-qty-cell">${escapeHtml(String(row.totalQuantity || 0))}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="print-shell">
        <section class="print-page">
          <style>
            .print-sourcing-header {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              margin-bottom: 10mm;
              padding: 7mm;
              border: 1px solid var(--line);
              border-radius: 5mm;
              background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
            }

            .print-sourcing-header h1 {
              margin: 0 0 6px;
              font-size: 22px;
            }

            .print-sourcing-meta {
              margin: 0;
              color: var(--muted);
              font-size: 12px;
              line-height: 1.5;
            }

            .print-sourcing-summary {
              min-width: 58mm;
              padding: 4mm;
              border: 1px solid var(--line-soft);
              border-radius: 4mm;
              background: var(--panel);
              text-align: right;
            }

            .print-sourcing-summary-label {
              margin: 0 0 4px;
              font-size: 11px;
              color: var(--muted);
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }

            .print-sourcing-summary-value {
              margin: 0;
              font-size: 20px;
              font-weight: 700;
            }

            .print-sourcing-table th,
            .print-sourcing-table td {
              border: 1px solid var(--line);
              padding: 10px;
              vertical-align: top;
            }

            .print-sourcing-table th {
              background: #e2e8f0;
              font-size: 12px;
              text-align: left;
            }

            .print-sourcing-table td {
              font-size: 12px;
            }

            .print-sourcing-image-cell {
              width: 32mm;
            }

            .print-sourcing-name-cell {
              width: 45mm;
              font-weight: 700;
            }

            .print-qty-cell {
              width: 18mm;
              text-align: center;
              font-weight: 700;
            }

            .print-sourcing-image-cell img,
            .print-sourcing-image-fallback {
              width: 26mm;
              height: 26mm;
              border: 1px solid var(--line-soft);
              border-radius: 3mm;
              object-fit: cover;
              background: #fff;
            }

            .print-sourcing-image-fallback {
              display: flex;
              align-items: center;
              justify-content: center;
              color: #94a3b8;
              font-size: 11px;
            }

            .print-vendor-list {
              list-style: none;
              margin: 0;
              padding: 0;
              display: grid;
              gap: 6px;
            }

            .print-vendor-list li {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              border-bottom: 1px dashed var(--line-soft);
              padding-bottom: 4px;
            }

            .print-vendor-list li:last-child {
              border-bottom: 0;
              padding-bottom: 0;
            }
          </style>
          <header class="print-sourcing-header avoid-break">
            <div>
              <h1>Daily Sourcing Slip</h1>
              <p class="print-sourcing-meta">Generated: ${escapeHtml(generatedAt)}</p>
              <p class="print-sourcing-meta">Orders selected: ${escapeHtml(String(ordersToExport.length))}</p>
            </div>
            <div class="print-sourcing-summary">
              <p class="print-sourcing-summary-label">Grand Total Cost</p>
              <p class="print-sourcing-summary-value">${escapeHtml(formatPrintCurrency(grandTotalCost))}</p>
            </div>
          </header>
          <table class="print-sourcing-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Item / Variant</th>
                <th>Vendor List</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>${rowsMarkup}</tbody>
          </table>
        </section>
      </div>
    `;
  };

  const renderPackingPrintMarkup = (selectedRecords) => {
    const slipsMarkup = selectedRecords.map((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      const itemsMarkup = items.map((item) => `
        <tr>
          <td>${escapeHtml(item.name || 'Unnamed item')}</td>
          <td class="packing-qty">${escapeHtml(String(Number(item.quantity || 0)))}</td>
        </tr>
      `).join('');

      return `
        <article class="packing-slip avoid-break">
          <header class="packing-slip-header">
            <h1 class="packing-slip-title">PACKING SLIP</h1>
            <div class="packing-slip-order-id">${escapeHtml(order.orderId || 'N/A')}</div>
          </header>
          <div class="packing-slip-meta avoid-break">
            <div><strong>Name:</strong> ${escapeHtml(order.customerName || 'N/A')}</div>
            <div><strong>Phone:</strong> ${escapeHtml(order.customerPhone || 'N/A')}</div>
            <div><strong>Address:</strong> ${escapeHtml(formatPrintAddress(order))}</div>
          </div>
          <table class="packing-slip-table">
            <thead>
              <tr>
                <th>Items</th>
                <th class="packing-qty">Qty</th>
              </tr>
            </thead>
            <tbody>${itemsMarkup}</tbody>
          </table>
        </article>
      `;
    }).join('');

    return `
      <div class="print-shell">
        <section class="print-page">
          <style>
            .packing-slip-list {
              display: grid;
              gap: 14px;
            }

            .packing-slip {
              border: 1px solid var(--line);
              border-radius: 5mm;
              overflow: hidden;
              background: #fff;
            }

            .packing-slip-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
              padding: 5mm 6mm;
              background: #0f172a;
              color: #fff;
            }

            .packing-slip-title {
              margin: 0;
              font-size: 20px;
              letter-spacing: 0.08em;
            }

            .packing-slip-order-id {
              font-size: 14px;
              font-weight: 700;
            }

            .packing-slip-meta {
              display: grid;
              gap: 8px;
              padding: 6mm;
              border-bottom: 1px solid var(--line-soft);
              background: #f8fafc;
              font-size: 13px;
            }

            .packing-slip-meta strong {
              color: var(--ink);
            }

            .packing-slip-table th,
            .packing-slip-table td {
              border: 1px solid var(--line);
              padding: 10px 12px;
              font-size: 13px;
              text-align: left;
            }

            .packing-slip-table th {
              background: #e2e8f0;
            }

            .packing-qty {
              width: 22mm;
              text-align: center;
              font-weight: 700;
            }

            @media print {
              .packing-slip-list {
                gap: 10px;
              }
            }
          </style>
          <div class="packing-slip-list">${slipsMarkup}</div>
        </section>
      </div>
    `;
  };

  const handleGenerateCourierSheet = async () => {
    const isDraftContext = statusFilter === DRAFT_TAB_ID;
    let ordersToExport = [];
    
    if (isDraftContext) {
      ordersToExport = getSelectedOrders();
      if (ordersToExport.length === 0) {
        toast.error("Select at least one draft order to generate courier sheet.");
        return;
      }
    } else {
      ordersToExport = validateSelectedOrders('Packed', 'Generate Courier Sheet');
      if (!ordersToExport) return;
    }

    setPendingWorkflowAction('courier');

    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const mainSheet = workbook.addWorksheet('Sheet1');

      PAKISTAN_CITIES.forEach((city, index) => {
        mainSheet.getCell(index + 1, 20).value = city;
      });
      mainSheet.getColumn(20).hidden = true;

      const headers = [
        'ConsigneeName',
        'ConsigneeAddress',
        'ConsigneeEmail',
        'ConsigneeCellNo',
        'ConsigneeCity',
        'ItemType',
        'Quantity',
        'CODAmount',
        'Weight',
        'SpecialInstruction'
      ];

      mainSheet.getRow(1).values = headers;
      mainSheet.getRow(1).font = { bold: true };

      ordersToExport.forEach((order, index) => {
        let codAmount = 0;
        if (order.manualCodAmount !== undefined && order.manualCodAmount !== null && order.manualCodAmount !== '') {
          codAmount = Number(order.manualCodAmount);
        } else if (order.paymentStatus === 'Online') {
          codAmount = 0;
        } else {
          codAmount = getCodAmount(order);
        }

        const cleanAddress = [order.customerAddress, order.landmark]
          .filter(Boolean)
          .join(' - ')
          .replace(/[, \n\r]+/g, ' ')
          .trim();

        let city = (order.customerCity || '').trim();
        const exactMatch = PAKISTAN_CITIES.find((entry) => entry.trim().toLowerCase() === city.toLowerCase());
        city = exactMatch || 'KARACHI';

        const row = mainSheet.getRow(index + 2);
        const email = (order.customerEmail || 'customer@store.com').trim();

        row.values = [
          order.customerName,
          cleanAddress,
          email,
          order.customerPhone,
          city,
          order.itemType || 'Mix',
          String(order.orderQuantity || 1),
          codAmount,
          order.weight ?? 2,
          order.notes || ''
        ];

        row.getCell(5).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`$T$1:$T$${PAKISTAN_CITIES.length}`],
          showDropDown: true,
        };
      });

      mainSheet.columns.forEach((column, index) => {
        if (index < 10) column.width = 20;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const statusMoved = await moveSelectedOrdersToStatus('Shipped', {
        allowedCurrentStatuses: isDraftContext ? [] : ['Packed'],
        logReason: isDraftContext ? 'Courier sheet generated from Draft. Status moved to Shipped.' : 'Courier sheet generated. Status moved from Packed to Shipped.',
      });

      if (!statusMoved) return;

      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Courier_Sheet_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setPendingWorkflowAction('');
    }
  };

  const handleGenerateSourcingSlip = async ({ moveToNextStep = true } = {}) => {
    const ordersToExport = validateSelectedOrders('Order Confirmed', 'Generate Sourcing Slip');
    if (!ordersToExport) return;

    setPendingWorkflowAction(moveToNextStep ? 'sourcing-move' : 'sourcing-download');

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const { sourcingRows, imageLookup, grandTotalCost } = await collectSourcingSlipData(ordersToExport);

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(28, 28, 539, 70, 18, 18, 'F');
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(18);
      doc.text('Daily Sourcing Slip', 44, 56);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated ${new Date().toLocaleString('en-PK')}`, 44, 76);
      doc.text(`${ordersToExport.length} order${ordersToExport.length === 1 ? '' : 's'} selected`, 44, 92);

      autoTable(doc, {
        startY: 118,
        head: [['Image', 'Item / Variant', 'Vendor List', 'Qty']],
        body: sourcingRows.map((row) => [
          '',
          row.itemName,
          row.vendors.length > 0
            ? row.vendors
                .map((vendor) => {
                  const vendorName = sanitizePdfText(vendor.name || 'Vendor');
                  const vendorProductName = sanitizePdfText(vendor.vendorProductName || '');
                  const priceLabel = vendor.vendorPrice != null
                    ? `PKR ${Number(vendor.vendorPrice).toLocaleString('en-PK')}`
                    : 'Price N/A';
                  return `${vendorName}${vendorProductName ? ` (${vendorProductName})` : ''} - ${priceLabel}`;
                })
                .join('\n')
            : '',
          String(row.totalQuantity || 0),
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 8,
          textColor: [30, 41, 59],
          valign: 'middle',
        },
        columnStyles: {
          0: { cellWidth: 72, minCellHeight: 60 },
          1: { cellWidth: 170 },
          2: { cellWidth: 220 },
          3: { cellWidth: 45, halign: 'center' },
        },
        didDrawCell: (hookData) => {
          if (hookData.section !== 'body' || hookData.column.index !== 0) return;

          const imageKey = sourcingRows[hookData.row.index]?.image;
          const imageData = imageLookup.get(imageKey);

          if (imageData) {
            doc.addImage(imageData, hookData.cell.x + 8, hookData.cell.y + 6, 48, 48);
            return;
          }

          doc.setDrawColor(203, 213, 225);
          doc.roundedRect(hookData.cell.x + 8, hookData.cell.y + 6, 48, 48, 8, 8);
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text('No image', hookData.cell.x + 16, hookData.cell.y + 34);
        },
      });

      const tableEndY = doc.lastAutoTable?.finalY || 118;
      doc.setDrawColor(226, 232, 240);
      doc.line(28, tableEndY + 18, 567, tableEndY + 18);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('Grand Total Cost (lowest vendor price):', 332, tableEndY + 40);
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(`PKR ${grandTotalCost.toLocaleString('en-PK')}`, 567, tableEndY + 40, { align: 'right' });

      if (moveToNextStep) {
        const statusMoved = await moveSelectedOrdersToStatus('In Process', {
          allowedCurrentStatuses: ['Order Confirmed'],
          logReason: 'Sourcing slip generated. Status moved from Order Confirmed to In Process.',
        });

        if (!statusMoved) return;
      }

      doc.save(`Sourcing_Slip_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setPendingWorkflowAction('');
    }
  };

  const handlePrintSourcingSlip = async ({ moveToNextStep = true } = {}) => {
    const ordersToPrint = validateSelectedOrders('Order Confirmed', 'Print Sourcing Slip');
    if (!ordersToPrint) return;

    const printWindow = openPrintWindow('Sourcing Slip');
    if (!printWindow) return;

    setPendingWorkflowAction(moveToNextStep ? 'sourcing-print-move' : 'sourcing-print');

    try {
      const { sourcingRows, imageLookup, grandTotalCost } = await collectSourcingSlipData(ordersToPrint);

      if (moveToNextStep) {
        const statusMoved = await moveSelectedOrdersToStatus('In Process', {
          allowedCurrentStatuses: ['Order Confirmed'],
          logReason: 'Sourcing slip printed. Status moved from Order Confirmed to In Process.',
        });

        if (!statusMoved) {
          printWindow.close();
          return;
        }
      }

      const content = renderSourcingPrintMarkup(ordersToPrint, sourcingRows, imageLookup, grandTotalCost);
      writePrintWindow(printWindow, 'Sourcing Slip', content);
    } catch (error) {
      printWindow.close();
      console.error(error);
      toast.error('Failed to open the sourcing print view.');
    } finally {
      setPendingWorkflowAction('');
    }
  };

  const handleGeneratePackingSlip = async ({ moveToNextStep = true } = {}) => {
    const selectedRecords = validateSelectedOrders('In Process', 'Generate Packing Slip');
    if (!selectedRecords) return;

    setPendingWorkflowAction(moveToNextStep ? 'packing-move' : 'packing-download');

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let cursorY = 28;
      const sectionX = 42;
      const sectionWidth = pageWidth - 84;
      const bottomMargin = 24;
      const sectionGap = 14;

      selectedRecords.forEach((order, orderIndex) => {
        const items = Array.isArray(order.items) ? order.items : [];
        const addressLabel = `Address: ${sanitizePdfText(
          [order.customerAddress, order.customerCity].filter(Boolean).join(', ') || 'N/A'
        )}`;
        const addressLines = doc.splitTextToSize(addressLabel, sectionWidth - 24);
        const addressHeight = Math.max(12, addressLines.slice(0, 2).length * 10);
        const estimatedSectionHeight = 70 + addressHeight + 24 + (items.length * 20);

        if (cursorY + estimatedSectionHeight > pageHeight - bottomMargin) {
          doc.addPage();
          cursorY = 28;
        }

        const sectionTop = cursorY;
        const tableStartY = sectionTop + 50 + addressHeight;

        doc.setDrawColor(203, 213, 225);
        doc.setFillColor(255, 255, 255);
        doc.setLineWidth(1);
        doc.roundedRect(sectionX, sectionTop, sectionWidth, estimatedSectionHeight - 8, 8, 8, 'S');

        doc.setFillColor(15, 23, 42);
        doc.roundedRect(sectionX, sectionTop, sectionWidth, 24, 8, 8, 'F');
        doc.rect(sectionX, sectionTop + 12, sectionWidth, 12, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('PACKING SLIP', sectionX + 12, sectionTop + 16);
        doc.text(`${sanitizePdfText(order.orderId)}`, pageWidth - sectionX - 12, sectionTop + 16, { align: 'right' });

        doc.setTextColor(17, 24, 39);
        doc.setFontSize(8);
        doc.text(`Name: ${sanitizePdfText(order.customerName || 'N/A')}`, sectionX + 12, sectionTop + 38);
        doc.text(`Phone: ${sanitizePdfText(order.customerPhone || 'N/A')}`, sectionX + 210, sectionTop + 38);
        doc.text(addressLines.slice(0, 2), sectionX + 12, sectionTop + 50);

        autoTable(doc, {
          startY: tableStartY,
          head: [['Items', 'Qty']],
          body: items.map((item) => [
            sanitizePdfText(item.name || 'Unnamed item'),
            String(Number(item.quantity || 0)),
          ]),
          theme: 'grid',
          margin: { left: sectionX, right: sectionX },
          headStyles: {
            fillColor: [241, 245, 249],
            textColor: [15, 23, 42],
            fontSize: 8,
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 4,
            textColor: [30, 41, 59],
          },
          alternateRowStyles: {
            fillColor: [255, 255, 255],
          },
          columnStyles: {
            0: { cellWidth: sectionWidth - 70 },
            1: { cellWidth: 70, halign: 'center' },
          },
        });

        const finalY = doc.lastAutoTable?.finalY || tableStartY;
        cursorY = finalY + sectionGap;
      });

      if (moveToNextStep) {
        const statusMoved = await moveSelectedOrdersToStatus('Packed', {
          allowedCurrentStatuses: ['In Process'],
          logReason: 'Packing slip generated. Status moved from In Process to Packed.',
        });

        if (!statusMoved) return;
      }

      doc.save(`Packing_Slips_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setPendingWorkflowAction('');
    }
  };

  const handlePrintPackingSlip = async ({ moveToNextStep = true } = {}) => {
    const selectedRecords = validateSelectedOrders('In Process', 'Print Packing Slip');
    if (!selectedRecords) return;

    const printWindow = openPrintWindow('Packing Slips');
    if (!printWindow) return;

    setPendingWorkflowAction(moveToNextStep ? 'packing-print-move' : 'packing-print');

    try {
      if (moveToNextStep) {
        const statusMoved = await moveSelectedOrdersToStatus('Packed', {
          allowedCurrentStatuses: ['In Process'],
          logReason: 'Packing slip printed. Status moved from In Process to Packed.',
        });

        if (!statusMoved) {
          printWindow.close();
          return;
        }
      }

      const content = renderPackingPrintMarkup(selectedRecords);
      writePrintWindow(printWindow, 'Packing Slips', content);
    } catch (error) {
      printWindow.close();
      console.error(error);
      toast.error('Failed to open the packing print view.');
    } finally {
      setPendingWorkflowAction('');
    }
  };

  const handleExportMonthlySales = async (format) => {
    // Filter orders by the selected date range for monthly report
    const reportOrders = orders;
    if (reportOrders.length === 0) {
      toast.error('No orders found in the current filtered range for report.');
      return;
    }

    const totalRevenue = reportOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const statusCounts = reportOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    if (format === 'excel') {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Monthly Sales');
      
      sheet.addRow(['Monthly Sales Report']);
      sheet.addRow([`Period: ${startDate || 'All'} to ${endDate || 'All'}`]);
      sheet.addRow([]);
      sheet.addRow(['Summary']);
      sheet.addRow(['Total Orders', reportOrders.length]);
      sheet.addRow(['Total Revenue', totalRevenue]);
      sheet.addRow([]);
      sheet.addRow(['Status Breakdown']);
      Object.entries(statusCounts).forEach(([status, count]) => {
        sheet.addRow([status, count]);
      });
      sheet.addRow([]);
      sheet.addRow(['Order Details']);
      sheet.addRow(['Date', 'Order ID', 'Customer', 'City', 'Amount', 'Status']);
      
      reportOrders.forEach(o => {
        sheet.addRow([
          new Date(o.createdAt).toLocaleDateString(),
          o.orderId,
          o.customerName,
          o.customerCity,
          o.totalAmount,
          o.status
        ]);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Monthly_Sales_Report_${new Date().toISOString().slice(0, 7)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Dynamically import jspdf to avoid SSR errors with Node-specific modules
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Monthly Sales Report', 14, 20);
      doc.setFontSize(12);
      doc.text(`Period: ${startDate || 'All'} to ${endDate || 'All'}`, 14, 30);
      
      doc.text('Summary', 14, 45);
      autoTable(doc, {
        body: [
          ['Total Orders', reportOrders.length],
          ['Total Revenue', `PKR ${totalRevenue.toLocaleString()}`],
        ],
        startY: 50,
        theme: 'grid',
      });

      doc.text('Status Breakdown', 14, doc.lastAutoTable?.finalY + 15 || 80);
      autoTable(doc, {
        body: Object.entries(statusCounts),
        startY: doc.lastAutoTable?.finalY + 20 || 85,
        theme: 'grid',
      });

      doc.text('Order details', 14, doc.lastAutoTable?.finalY + 15 || 120);
      autoTable(doc, {
        head: [['Date', 'ID', 'Customer', 'City', 'Amount', 'Status']],
        body: reportOrders.map(o => [
          new Date(o.createdAt).toLocaleDateString(),
          o.orderId,
          o.customerName,
          o.customerCity,
          o.totalAmount,
          o.status
        ]),
        startY: doc.lastAutoTable?.finalY + 20 || 125,
      });

      doc.save(`Monthly_Sales_Report_${new Date().toISOString().slice(0, 7)}.pdf`);
    }
  };

  const handleQuickUpdate = async (id) => {
    setIsQuickUpdating(true);
    const res = await updateOrderAction(id, { 
      status: quickStatus, 
      trackingNumber: quickTracking,
      courierName: editingOrder?.courierName || ''
    });
    
    if (res.success) {
      toast.success('Order updated');
      setQuickActionOrder(null);
      setOrders((prev) => prev.map((order) => (
        order._id === id ? { ...order, isDraft: false, status: normalizeOrderStatus(quickStatus), trackingNumber: quickTracking, courierName: editingOrder?.courierName || '' } : order
      )));
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to update order');
    }
    setIsQuickUpdating(false);
  };

  const handleFullUpdate = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    setIsUpdating(true);
    // Collect updates from form fields
    const form = e.target;
    const updates = {
      customerName: form.customerName.value,
      customerEmail: form.customerEmail.value,
      customerPhone: form.customerPhone.value,
      customerAddress: form.customerAddress.value,
      landmark: form.landmark.value,
      customerCity: editingOrder.customerCity,
      sourceTag: form.sourceTag.value,
      itemType: form.itemType.value,
      orderQuantity: form.orderQuantity.value,
      weight: form.weight.value,
      manualCodAmount: form.manualCodAmount.value,
      courierName: editingOrder.courierName || '',
    };
    const res = await updateOrderAction(editingOrder._id, updates);
    if (res.success) {
      toast.success('Order details updated');
      setIsEditModalOpen(false);
      setEditingOrder(null);
      setOrders((prev) => prev.map((order) => (
        order._id === editingOrder._id
          ? { ...order, ...updates, customerCity: editingOrder.customerCity }
          : order
      )));
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to update order');
    }
    setIsUpdating(false);
  };

  const fetchCustomerSuggestions = async (query) => {
    if (!query || query.trim().length < 2) {
      setCustomerSuggestions([]);
      setCustomerSuggestionsOpen(false);
      return;
    }
    setIsSearchingCustomers(true);
    try {
      const res = await fetch(`/api/admin/manual-customers/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerSuggestions(data.customers || []);
        setCustomerSuggestionsOpen(true);
      }
    } catch (err) {
      console.error('Failed to search customers:', err);
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  const onCustomerNameChange = (val) => {
    updateDraftField('customerName', val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchCustomerSuggestions(val);
    }, 300);
  };

  const selectCustomer = (customer) => {
    setDraftForm(prev => ({
      ...prev,
      customerName: customer.name,
      customerPhone: customer.phone || prev.customerPhone,
      customerAddress: customer.address || prev.customerAddress,
      customerCity: customer.city || prev.customerCity
    }));
    setCustomerSuggestionsOpen(false);
  };

  const handleCreateDraftOrder = async (event) => {
    event.preventDefault();

    if (!/^03\d{9}$/.test(draftForm.customerPhone)) {
      toast.error('Phone number must be exactly 11 digits starting with 03 (e.g., 03xxxxxxxxx)');
      return;
    }

    if (draftItems.length === 0) {
      toast.error('Add at least one item before creating the order.');
      return;
    }

    setIsCreatingDraft(true);
    try {
      const result = await createDraftOrderAction({
        customerName: draftForm.customerName,
        customerPhone: draftForm.customerPhone,
        customerAddress: draftForm.customerAddress,
        customerCity: draftForm.customerCity,
        landmark: draftForm.landmark,
        sourceTag: draftForm.sourceTag,
        itemType: draftForm.itemType,
        weight: draftForm.weight,
        notes: draftForm.notes,
        manualCodAmount: draftForm.manualCodAmount,
        items: draftItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          name: item.name,
          price: item.price,
        })),
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to create draft order.');
        return;
      }

      toast.success('Draft order created.');
      setIsCreateModalOpen(false);
      resetDraftComposer();
      setStatusFilter(DRAFT_TAB_ID);
      navigate({ status: DRAFT_TAB_ID, page: null });
      router.refresh();
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const hasActiveFilters = searchQuery || statusFilter !== DEFAULT_ORDER_STATUS || startDate || endDate;
  const canApplyFilters = Boolean(searchQuery.trim() || startDate || endDate);
  const isFilterModified = searchQuery !== (initialSearchQuery || '') || startDate !== (initialStartDate || '') || endDate !== (initialEndDate || '');
  const hasAppliedFilters = Boolean(initialSearchQuery || initialStartDate || initialEndDate);
  const appliedFilters = [
    statusFilter !== DEFAULT_ORDER_STATUS ? `Status: ${statusFilter === 'all' ? 'All' : statusFilter === DRAFT_TAB_ID ? 'Draft' : statusFilter === TRASH_TAB_ID ? 'Trash' : statusFilter}` : null,
    initialSearchQuery ? `Search: ${initialSearchQuery}` : null,
    initialStartDate || initialEndDate
      ? `Date: ${initialStartDate || 'Any'} - ${initialEndDate || 'Any'}`
      : null,
  ].filter(Boolean);
  const isTrashView = statusFilter === TRASH_TAB_ID;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">Orders</h2>
        <Button
          type="button"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="admin-cta-button rounded-md"
        >
          <Plus data-icon="inline-start" />
          Create Order
        </Button>
      </div>

      {/* Status Filter Tabs / Select (Responsive) */}
      <div className="hidden md:flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
        {[
          { id: DRAFT_TAB_ID, label: `Draft (${summary.draftCount || 0})` },
          { id: DEFAULT_ORDER_STATUS, label: `Order Confirmed (${summary.orderConfirmedCount})` },
          { id: 'In Process', label: `In Process (${summary.inProcessCount})` },
          { id: 'Packed', label: `Packed (${summary.packedCount || 0})` },
          { id: 'Shipped', label: `Shipped (${summary.shippedCount || 0})` },
          { id: 'Out For Delivery', label: `Out For Delivery (${summary.outForDeliveryCount || 0})` },
          { id: 'Delivered', label: `Delivered (${summary.deliveredCount})` },
          { id: 'Returned', label: `Returned (${summary.returnedCount})` },
          { id: 'all', label: `All (${summary.allCount})` },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={statusFilter === tab.id ? "default" : "ghost"}
            size="sm"
            disabled={isPending}
            onClick={() => {
              setStatusFilter(tab.id);
              navigate({ status: tab.id, page: null });
            }}
            className={cn(
              "h-7 rounded-md px-2.5 text-[11px] font-medium transition-colors md:h-7",
              statusFilter === tab.id
                ? "shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isPending && statusFilter === tab.id ? <Spinner data-icon="inline-start" className="size-3" /> : null}
            {tab.label}
          </Button>
        ))}
        {/* Trash tab — separated with a divider */}
        <div className="mx-1 h-4 w-px bg-border/60" />
        <Button
          variant={statusFilter === TRASH_TAB_ID ? 'destructive' : 'ghost'}
          size="sm"
          disabled={isPending}
          onClick={() => {
            setStatusFilter(TRASH_TAB_ID);
            navigate({ status: TRASH_TAB_ID, page: null });
          }}
          className={cn(
            'h-7 rounded-md px-2.5 text-[11px] font-medium transition-colors md:h-7',
            statusFilter !== TRASH_TAB_ID && 'text-destructive/70 hover:text-destructive'
          )}
        >
          <Trash2 className="mr-1 size-3" />
          Trash ({summary.trashCount || trashOrders.length})
        </Button>
      </div>

      {/* Mobile Status + Move Row */}
      <div className="md:hidden flex flex-row items-center gap-2">
        <Select
          value={statusFilter}
          disabled={isPending}
          onValueChange={(val) => {
            setStatusFilter(val);
            navigate({ status: val, page: null });
          }}
        >
          <SelectTrigger className="flex-1 h-8 rounded-lg bg-background border-border/70 text-[12px] shadow-none">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {[
              { id: DRAFT_TAB_ID, label: `Draft (${summary.draftCount || 0})` },
              { id: DEFAULT_ORDER_STATUS, label: `Order Confirmed (${summary.orderConfirmedCount})` },
              { id: 'In Process', label: `In Process (${summary.inProcessCount})` },
              { id: 'Packed', label: `Packed (${summary.packedCount || 0})` },
              { id: 'Shipped', label: `Shipped (${summary.shippedCount || 0})` },
              { id: 'Out For Delivery', label: `Out For Delivery (${summary.outForDeliveryCount || 0})` },
              { id: 'Delivered', label: `Delivered (${summary.deliveredCount})` },
              { id: 'Returned', label: `Returned (${summary.returnedCount})` },
              { id: 'all', label: `All (${summary.allCount})` },
              { id: TRASH_TAB_ID, label: `Trash (${summary.trashCount || trashOrders.length})` },
            ].map((tab) => (
              <SelectItem key={tab.id} value={tab.id} className="text-[13px]">
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={bulkStatus} onValueChange={setBulkStatus}>
          <SelectTrigger
            disabled={selectedOrders.length === 0 || isBulkUpdating || pendingWorkflowAction !== ''}
            className="h-8 w-[120px] shrink-0 rounded-lg text-[11px]"
          >
            <SelectValue placeholder="Move to..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {BULK_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status} className="text-[12px]">
                  {status}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => moveSelectedOrdersToStatus(bulkStatus)}
          disabled={selectedOrders.length === 0 || !bulkStatus || isBulkUpdating || pendingWorkflowAction !== ''}
          className="admin-cta-button h-8 text-[11px] shrink-0 px-2"
        >
          {isBulkUpdating ? <Spinner data-icon="inline-start" /> : <PackageCheck data-icon="inline-start" />}
          Move
        </Button>
      </div>

      {/* ── Trash Panel ── */}
      {isTrashView && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <div className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-4" />
              <p className="text-[13px] font-semibold">Trash</p>
              <span className="text-[11px] text-destructive/70">— Orders are auto-purged after 50 days</span>
            </div>
            {trashOrders.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setEmptyTrashConfirm(true)}
                className="admin-cta-button text-[12px]"
              >
                <Trash2 data-icon="inline-start" />
                Empty Trash ({trashOrders.length})
              </Button>
            )}
          </div>

          {trashOrders.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-4 py-12 text-center">
              <Trash2 className="mx-auto mb-2 size-8 text-muted-foreground/30" />
              <p className="text-sm font-medium text-foreground">Trash is empty</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">Deleted orders will appear here for 50 days.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    <th className="px-3 py-2">Order</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2">Deleted</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {trashOrders.map((o) => (
                    <tr key={o._id} className="hover:bg-muted/20">
                      <td className="px-3 py-2.5 text-[13px] font-semibold tabular-nums text-foreground">{o.orderId}</td>
                      <td className="px-3 py-2.5">
                        <p className="text-[13px] font-medium text-foreground">{o.customerName}</p>
                        {o.isDraft && <span className="text-[10px] text-muted-foreground">Draft</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[12px] tabular-nums text-foreground">{formatPrice(o.totalAmount)}</td>
                      <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                        {o.deletedAt ? formatDistanceToNow(new Date(o.deletedAt), { addSuffix: true }) : '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="admin-cta-button h-7 text-[11px]"
                            onClick={() => handleRestoreOrder(o._id, o.orderId)}
                          >
                            <RotateCcw className="mr-1 size-3" />
                            Restore
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="admin-cta-button h-7 text-[11px] text-destructive hover:text-destructive"
                            onClick={() => handleHardDeleteOrder(o._id, o.orderId)}
                          >
                            <Trash2 className="mr-1 size-3" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Empty Trash Confirm Dialog */}
      <Dialog open={emptyTrashConfirm} onOpenChange={setEmptyTrashConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive text-sm">
              <AlertTriangle className="size-4" />
              Empty Trash?
            </DialogTitle>
            <DialogDescription className="text-[13px]">
              This will permanently delete all {trashOrders.length} order{trashOrders.length === 1 ? '' : 's'} in the trash. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-1.5 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setEmptyTrashConfirm(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" disabled={isEmptyingTrash} onClick={handleEmptyTrash} className="min-w-[100px]">
              {isEmptyingTrash ? <Spinner data-icon="inline-start" /> : <Trash2 data-icon="inline-start" />}
              {isEmptyingTrash ? 'Emptying...' : 'Empty Trash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters & Actions Bar */}
      <div className="admin-filter-shell flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
        <form
          className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 flex-1 min-w-0"
          onSubmit={(event) => {
          event.preventDefault();
          navigate({
            search: searchQuery.trim() || null,
            startDate: startDate || null,
            endDate: endDate || null,
            page: null,
          });
        }}
      >
        <div className="flex flex-row gap-2 items-center flex-1 min-w-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" type="button" className="h-8 w-8 shrink-0 rounded-lg border-border/70 bg-background shadow-none relative">
                <Calendar className="size-3.5 text-muted-foreground" />
                {(startDate || endDate) && <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-4 rounded-xl shadow-lg border-border/70">
              <div className="flex flex-col gap-3">
                <p className="text-[13px] font-medium text-foreground">Filter by Date</p>
                <div className="flex items-center gap-2">
                  <Field>
                    <FieldLabel htmlFor="orders-start-date" className="sr-only">From date</FieldLabel>
                    <Input
                      id="orders-start-date"
                      type="date"
                      className="h-8 min-w-[120px] text-[12px]"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Field>
                  <span className="text-[11px] text-muted-foreground">to</span>
                  <Field>
                    <FieldLabel htmlFor="orders-end-date" className="sr-only">To date</FieldLabel>
                    <Input
                      id="orders-end-date"
                      type="date"
                      className="h-8 min-w-[120px] text-[12px]"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Field>
                </div>
                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7 px-4 text-[11px] bg-black text-white hover:bg-black/90 rounded-md"
                  >
                    Search
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Select value={getQuickDateValue()} onValueChange={handleQuickDateFilter}>
            <SelectTrigger className="h-8 w-[130px] rounded-lg border-border/70 bg-background text-[12px] shadow-none shrink-0">
              <SelectValue placeholder="Date Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="lastWeek">Last Week</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="custom" className="hidden">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          <Field className="flex-1 min-w-0 md:max-w-sm">
            <FieldLabel className="sr-only">Search orders</FieldLabel>
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" data-icon />
              <Input
                placeholder="Search orders"
                className="h-8 rounded-lg border-border/70 bg-background pl-9 pr-[64px] text-[12px] shadow-none w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                {!isFilterModified && hasAppliedFilters ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!canApplyFilters}
                    className="h-6 px-2 text-[10px] bg-black text-white hover:bg-black/90 rounded-md"
                  >
                    Search
                  </Button>
                )}
              </div>
            </div>
          </Field>
        </div>
      </form>

      <div className="flex flex-row flex-wrap items-center gap-2 border-t border-border/50 pt-2 md:border-0 md:pt-0 shrink-0">
        {statusFilter === DEFAULT_ORDER_STATUS ? (
          <div className="flex flex-row flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              onClick={() => handlePrintSourcingSlip({ moveToNextStep: true })}
              disabled={selectedOrders.length === 0 || pendingWorkflowAction !== '' || isBulkUpdating}
              className="h-7 px-3 text-[11px] bg-yellow-200 text-yellow-900 hover:bg-yellow-300 rounded-md font-medium shadow-sm"
            >
              {pendingWorkflowAction === 'sourcing-print-move' ? <Spinner data-icon="inline-start" /> : <Printer data-icon="inline-start" />}
              {pendingWorkflowAction === 'sourcing-print-move' ? 'Opening...' : `Print & Move${selectedOrders.length > 0 ? ` (${selectedOrders.length})` : ''}`}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handlePrintSourcingSlip({ moveToNextStep: false })}
              disabled={selectedOrders.length === 0 || pendingWorkflowAction !== '' || isBulkUpdating}
              className="admin-cta-button h-7 text-[11px]"
            >
              {pendingWorkflowAction === 'sourcing-print' ? <Spinner data-icon="inline-start" /> : <Printer data-icon="inline-start" />}
              {pendingWorkflowAction === 'sourcing-print' ? 'Opening...' : 'Print'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleGenerateSourcingSlip({ moveToNextStep: false })}
              disabled={selectedOrders.length === 0 || pendingWorkflowAction !== '' || isBulkUpdating}
              className="admin-cta-button h-7 text-[11px] hidden sm:flex"
            >
              {pendingWorkflowAction === 'sourcing-download' ? <Spinner data-icon="inline-start" /> : <Download data-icon="inline-start" />}
              {pendingWorkflowAction === 'sourcing-download' ? 'Generating...' : 'Download'}
            </Button>
          </div>
        ) : null}
        {statusFilter === 'In Process' ? (
          <div className="flex flex-row flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              onClick={() => handlePrintPackingSlip({ moveToNextStep: true })}
              disabled={selectedOrders.length === 0 || pendingWorkflowAction !== '' || isBulkUpdating}
              className="h-7 px-3 text-[11px] bg-yellow-200 text-yellow-900 hover:bg-yellow-300 rounded-md font-medium shadow-sm"
            >
              {pendingWorkflowAction === 'packing-print-move' ? <Spinner data-icon="inline-start" /> : <Printer data-icon="inline-start" />}
              {pendingWorkflowAction === 'packing-print-move' ? 'Opening...' : `Print & Move${selectedOrders.length > 0 ? ` (${selectedOrders.length})` : ''}`}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handlePrintPackingSlip({ moveToNextStep: false })}
              disabled={selectedOrders.length === 0 || pendingWorkflowAction !== '' || isBulkUpdating}
              className="admin-cta-button h-7 text-[11px]"
            >
              {pendingWorkflowAction === 'packing-print' ? <Spinner data-icon="inline-start" /> : <Printer data-icon="inline-start" />}
              {pendingWorkflowAction === 'packing-print' ? 'Opening...' : 'Print'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleGeneratePackingSlip({ moveToNextStep: false })}
              disabled={selectedOrders.length === 0 || pendingWorkflowAction !== '' || isBulkUpdating}
              className="admin-cta-button h-7 text-[11px] hidden sm:flex"
            >
              {pendingWorkflowAction === 'packing-download' ? <Spinner data-icon="inline-start" /> : <Download data-icon="inline-start" />}
              {pendingWorkflowAction === 'packing-download' ? 'Generating...' : 'Download'}
            </Button>
          </div>
        ) : null}

        {(statusFilter === 'Packed' || statusFilter === DRAFT_TAB_ID) ? (
          <Button
            type="button"
            size="sm"
            onClick={() => setNocBookingOpen(true)}
            disabled={selectedOrders.length === 0 || isBookingNoc}
            className="h-7 px-3 text-[11px] bg-sky-600 hover:bg-sky-700 text-white rounded-md font-semibold shadow-sm flex items-center gap-1.5"
          >
            <Truck className="size-3.5" />
            Send to NOC Express{selectedOrders.length > 0 ? ` (${selectedOrders.length})` : ''}
          </Button>
        ) : null}

        {(statusFilter === 'Packed' || statusFilter === DRAFT_TAB_ID || statusFilter === 'Shipped') ? (
          <Button
            type="button"
            size="sm"
            onClick={handlePrintSelectedNocSlips}
            disabled={selectedOrders.length === 0}
            className="h-7 px-3 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold shadow-sm flex items-center gap-1.5"
          >
            <Printer className="size-3.5" />
            Print Slips{selectedOrders.length > 0 ? ` (${selectedOrders.length})` : ''}
          </Button>
        ) : null}

        {(statusFilter === 'Packed' || statusFilter === DRAFT_TAB_ID) ? (
          <Button
            type="button"
            size="sm"
            onClick={handleGenerateCourierSheet}
            disabled={selectedOrders.length === 0 || pendingWorkflowAction !== '' || isBulkUpdating}
            className="h-7 px-3 text-[11px] bg-green-200 text-green-900 hover:bg-green-300 rounded-md font-medium shadow-sm hidden md:flex"
          >
            {pendingWorkflowAction === 'courier' ? <Spinner data-icon="inline-start" /> : <Download data-icon="inline-start" />}
            {pendingWorkflowAction === 'courier' ? 'Generating...' : `Courier Sheet${selectedOrders.length > 0 ? ` (${selectedOrders.length})` : ''}`}
          </Button>
        ) : null}

        {statusFilter === 'all' ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="admin-cta-button h-7 text-[11px]">
                <Zap data-icon="inline-start" />
                Reports
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="flex flex-col gap-1.5">
                <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Monthly Sales</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 justify-start gap-1.5 text-[12px] font-medium"
                  onClick={() => handleExportMonthlySales('excel')}
                >
                  <Download data-icon="inline-start" />
                  Excel (.xlsx)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 justify-start gap-1.5 text-[12px] font-medium text-destructive hover:text-destructive"
                  onClick={() => handleExportMonthlySales('pdf')}
                >
                  <Download data-icon="inline-start" />
                  PDF (.pdf)
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : null}

        <div className="ml-auto hidden md:flex flex-row items-center gap-1.5">
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger
              disabled={selectedOrders.length === 0 || isBulkUpdating || pendingWorkflowAction !== ''}
              className="h-7 w-[180px] rounded-lg text-[11px]"
            >
              <SelectValue placeholder="Move to..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {BULK_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status} className="text-[12px]">
                    {status}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => moveSelectedOrdersToStatus(bulkStatus)}
            disabled={selectedOrders.length === 0 || !bulkStatus || isBulkUpdating || pendingWorkflowAction !== ''}
            className="admin-cta-button h-7 text-[11px] shrink-0"
          >
            {isBulkUpdating ? <Spinner data-icon="inline-start" /> : <PackageCheck data-icon="inline-start" />}
            <span className="hidden sm:inline">Move{selectedOrders.length > 0 ? ` (${selectedOrders.length})` : ''}</span>
            <span className="sm:hidden">Move</span>
          </Button>
        </div>
      </div>
      </div>

      {appliedFilters.length > 0 && (
        <div className="hidden md:flex flex-wrap items-center gap-1.5">
          {appliedFilters.map((filter) => (
            <Badge key={filter} variant="outline" className="rounded-md px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {filter}
            </Badge>
          ))}
        </div>
      )}

      {/* ── Desktop Table ── */}
      {isPending ? <OrdersTablePendingSkeleton /> : (
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                <th className="w-10 px-3 py-2">
                  <Checkbox 
                    checked={isAllPaginatedSelected} 
                    onCheckedChange={handleSelectAll} 
                    aria-label="Select all on page"
                  />
                </th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">City</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Payment</th>
                <th className="px-3 py-2">Tracking</th>
                <th className="px-3 py-2">Weight</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-14 text-center">
                    <Receipt className="mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-foreground">No orders found</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">Try adjusting your search or filters.</p>
                    {hasActiveFilters && (
                      <Button variant="outline" size="sm" onClick={clearFilters} className="admin-cta-button mt-3">
                        Clear all filters
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                displayOrders.map((order) => {
                  if (!order) return null;
                  return (
                    <tr key={order._id} className="transition-colors hover:bg-muted/25">
                    <td className="px-3 py-2">
                      <Checkbox 
                        checked={selectedOrders.includes(order._id)} 
                        onCheckedChange={(checked) => handleSelectOne(checked, order._id)} 
                        aria-label={`Select order ${order.orderId}`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/orders/${order._id}`} className="text-[13px] font-semibold tabular-nums text-foreground hover:underline">
                          {order.orderId}
                        </Link>
                        {isNewOrder(order.createdAt) && (
                          <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                            New
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-foreground">{order.customerName}</span>
                        <span className="text-[11px] text-muted-foreground">{order.customerPhone}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className={cn('text-[10px] font-medium', getCityColorClass(order.customerCity))}>
                        {order.customerCity || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-[12px] text-foreground">{formatDate(order.createdAt)}</span>
                        <span className="text-[11px] text-muted-foreground">{formatTime(order.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[12px] text-foreground">{order.paymentStatus || 'COD'}</td>
                    <td className="px-3 py-2">
                      <div className="flex max-w-[160px] flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[12px] font-medium text-foreground">{order.trackingNumber || '—'}</span>
                          {order.trackingNumber && (
                            <span
                              className={cn(
                                'inline-flex items-center px-1.5 py-0.5 text-[10px] font-black rounded border uppercase tracking-wider shrink-0 shadow-2xs',
                                order.nocAccountId === 'portal_2'
                                  ? 'bg-purple-100 text-purple-950 border-purple-400 dark:bg-purple-900/90 dark:text-purple-100 dark:border-purple-500'
                                  : 'bg-sky-100 text-sky-950 border-sky-400 dark:bg-sky-900/90 dark:text-sky-100 dark:border-sky-500'
                              )}
                              title={order.nocAccountId === 'portal_2' ? 'Secondary Account (aamsaman)' : 'Main Account (unique items)'}
                            >
                              {order.nocAccountId === 'portal_2' ? 'AS' : 'UI'}
                            </span>
                          )}
                        </div>
                        <span className="truncate text-[11px] text-muted-foreground">{order.courierName || ''}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[12px] tabular-nums text-foreground">{formatWeight(order.weight)}</td>
                    <td className="px-3 py-2 text-right text-[13px] font-semibold tabular-nums text-foreground">{formatPrice(getCodAmount(order))}</td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={order.isDraft ? 'outline' : (statusVariant[order.status] || 'secondary')}
                        className={cn('text-[10px]', order.isDraft ? 'border-slate-300 bg-slate-50 text-slate-700' : getStatusBadgeClass(order.status))}
                      >
                        {getOrderDisplayStatus(order)}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <OrderQuickViewDialog
                          order={order}
                          triggerLabel="View"
                          triggerSize="sm"
                          triggerClassName="admin-cta-button"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
                              <MoreHorizontal />
                              <span className="sr-only">Order actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuGroup>
                              <DropdownMenuItem render={<Link href={`/admin/orders/${order._id}`} />}>
                                  <Receipt data-icon="inline-start" />
                                  Order details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingOrder(order);
                                  setIsEditModalOpen(true);
                                }}
                              >
                                <Edit data-icon="inline-start" />
                                Edit order
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setQuickActionOrder(order._id);
                                  setQuickStatus(order.status);
                                  setQuickTracking(order.trackingNumber || '');
                                  setEditingOrder(order);
                                }}
                              >
                                <Zap data-icon="inline-start" />
                                Quick update
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setNocTrackingOrder(order)}
                              >
                                <Truck className="size-4 text-sky-600 mr-2" />
                                Track Order
                              </DropdownMenuItem>
                              {(statusFilter === 'Packed' || statusFilter === DRAFT_TAB_ID || (order.status !== 'Shipped' && order.status !== 'Delivered' && order.status !== 'Cancelled' && order.status !== 'Returned')) && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedOrders([order._id]);
                                    setNocBookingOpen(true);
                                  }}
                                >
                                  <Send className="size-4 text-sky-600 mr-2" />
                                  Book NOC Express
                                </DropdownMenuItem>
                              )}
                              {order.nocLabelUrl && (
                                <DropdownMenuItem
                                  onClick={() => window.open(order.nocLabelUrl, '_blank')}
                                >
                                  <FileText className="size-4 text-emerald-600 mr-2" />
                                  Print NOC Slip
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteOrder(order)}
                            >
                              <Trash2 data-icon="inline-start" />
                              Move to Trash
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* ── Mobile Cards ── */}
      {isPending ? <OrdersMobilePendingSkeleton /> : (
      <div className="flex flex-col md:hidden">
        {displayOrders.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 border-y border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={isAllPaginatedSelected} 
                onCheckedChange={handleSelectAll} 
                aria-label="Select all on page"
              />
              <p className="text-[12px] font-medium text-muted-foreground cursor-pointer" onClick={() => handleSelectAll(!isAllPaginatedSelected)}>Select all on page</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedOrders.length > 0 && (
                <span className="text-[11px] font-semibold text-foreground">{selectedOrders.length} selected</span>
              )}
              {(statusFilter === 'Packed' || statusFilter === DRAFT_TAB_ID) && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleGenerateCourierSheet}
                  disabled={selectedOrders.length === 0 || pendingWorkflowAction !== '' || isBulkUpdating}
                  className="admin-cta-button h-7 text-[11px] px-2"
                >
                  {pendingWorkflowAction === 'courier' ? <Spinner data-icon="inline-start" /> : <Download data-icon="inline-start" />}
                  Courier Sheet
                </Button>
              )}
            </div>
          </div>
        )}

        {displayOrders.length === 0 ? (
          <div className="border-y border-border bg-card px-3 py-8 text-center">
            <Receipt className="mx-auto mb-2 text-muted-foreground/30 size-8" />
            <p className="text-sm font-medium text-foreground">No orders found</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Try adjusting your search or filters.</p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="admin-cta-button mt-3">
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border border-b border-border bg-card">
            {displayOrders.map((order) => {
              if (!order) return null;

              return (
                <div key={order._id} className="flex items-start gap-2.5 p-2.5 hover:bg-muted/30 transition-colors">
                  <Checkbox
                    checked={selectedOrders.includes(order._id)}
                    onCheckedChange={(checked) => handleSelectOne(checked, order._id)}
                    aria-label={`Select order ${order.orderId}`}
                    className="shrink-0 size-3.5 rounded-sm mt-0.5"
                  />
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 mt-[1px]">
                        <p className="text-[12px] font-semibold tracking-tight text-foreground truncate leading-none">{order.orderId}</p>
                        {isNewOrder(order.createdAt) && (
                          <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm shrink-0 leading-none">
                            NEW
                          </span>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5 rounded text-muted-foreground -mr-1 -mt-1 shrink-0">
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuGroup>
                            <DropdownMenuItem render={<Link href={`/admin/orders/${order._id}`} />}>
                              <Receipt data-icon="inline-start" />
                              Order details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setQuickActionOrder(order._id);
                                setQuickStatus(order.status);
                                setQuickTracking(order.trackingNumber || '');
                                setEditingOrder(order);
                              }}
                            >
                              <Zap data-icon="inline-start" />
                              Quick Update
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingOrder(order);
                                setIsEditModalOpen(true);
                              }}
                            >
                              <Edit data-icon="inline-start" />
                              Edit Order
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteOrder(order)}
                          >
                            <Trash2 data-icon="inline-start" />
                            Move to Trash
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] text-muted-foreground truncate leading-none">
                        <span className="font-medium text-foreground">{order.customerName}</span>
                        {order.customerCity ? ` • ${order.customerCity}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        {order.sourceTag ? (
                          <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 inline-flex items-center justify-center leading-none font-medium rounded-sm">
                            {order.sourceTag}
                          </Badge>
                        ) : null}
                        <span className="text-[9px] font-medium text-muted-foreground leading-none">{formatDate(order.createdAt)}</span>
                      </div>
                      
                      <OrderQuickViewDialog
                        order={order}
                        triggerLabel="View"
                        triggerSize="sm"
                        triggerClassName="h-6 px-3 text-[10px] rounded border border-border shadow-sm font-medium shrink-0"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive text-sm">
              <AlertTriangle className="size-4" />
              Move to Trash?
            </DialogTitle>
            <DialogDescription className="text-[13px]">
              Order <strong>{deleteConfirm?.orderId}</strong> ({deleteConfirm?.label}) will be moved to Trash. You can restore it within 50 days.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-1.5 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" disabled={isDeleting} onClick={confirmDeleteOrder} className="min-w-[100px]">
              {isDeleting ? <Spinner data-icon="inline-start" /> : <Trash2 data-icon="inline-start" />}
              {isDeleting ? 'Deleting...' : 'Move to Trash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Draft Order Dialog */}
      <Dialog
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) {
            resetDraftComposer();
          }
        }}
      >
        <DialogContent className="max-h-[100dvh] w-full max-w-full overflow-x-hidden overflow-y-auto rounded-none border-0 p-3 sm:max-h-[90vh] sm:w-[calc(100vw-2rem)] sm:max-w-3xl sm:rounded-2xl sm:border sm:p-5 lg:max-w-5xl lg:p-6 xl:max-w-6xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Create Draft Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateDraftOrder} className="flex flex-col gap-3 py-1 sm:gap-4" autoComplete="off">
            {/* Form start */}
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-start lg:gap-4">
              <div className="min-w-0 space-y-3">
                <div className="relative z-20 min-w-0 rounded-2xl border border-border/80 bg-card p-3 shadow-[0_14px_30px_-32px_rgba(15,23,42,0.4)] lg:p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Customer</p>
                  </div>
                </div>

                <FieldGroup className="grid gap-3 md:grid-cols-2">
                  <Field>
                    <FieldLabel className="flex items-center gap-1.5 text-[12px]">Full Name <span className="text-destructive">*</span></FieldLabel>
                    <div className="relative">
                      <Input
                        className={cn('h-9 rounded-xl px-3 text-[13px]', !draftForm.customerName && 'border-destructive/80 ring-1 ring-destructive/80')}
                        value={draftForm.customerName}
                        onChange={(event) => onCustomerNameChange(event.target.value)}
                        onFocus={() => {
                          if (customerSuggestions.length > 0) setCustomerSuggestionsOpen(true);
                        }}
                        onBlur={() => {
                          window.setTimeout(() => setCustomerSuggestionsOpen(false), 150);
                        }}
                        autoComplete="new-password"
                        required
                      />
                      {isSearchingCustomers && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Spinner className="h-3 w-3" />
                        </div>
                      )}
                      {customerSuggestionsOpen && customerSuggestions.length > 0 ? (
                        <div className="absolute top-full z-[120] mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                          <div className="max-h-56 overflow-y-auto p-1">
                            {customerSuggestions.map((cust) => (
                              <button
                                key={cust._id}
                                type="button"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  selectCustomer(cust);
                                }}
                                className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-[13px] text-foreground transition-colors hover:bg-muted"
                              >
                                <span className="font-medium">{cust.name}</span>
                                <span className="text-[11px] text-muted-foreground">{cust.phone} {cust.city ? `- ${cust.city}` : ''}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel className="flex items-center gap-1.5 text-[12px]">Phone <span className="text-destructive">*</span></FieldLabel>
                    <Input
                      className={cn('h-9 rounded-xl px-3 text-[13px]', !draftForm.customerPhone && 'border-destructive/80 ring-1 ring-destructive/80')}
                      value={draftForm.customerPhone}
                      onChange={(event) => updateDraftField('customerPhone', event.target.value)}
                      autoComplete="new-password"
                      placeholder="03xxxxxxxxx"
                      pattern="^03[0-9]{9}$"
                      title="Format: 03xxxxxxxxx (11 digits)"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel className="flex items-center gap-1.5 text-[12px]">City <span className="text-destructive">*</span></FieldLabel>
                    <div className="relative">
                      <Input
                        className={cn('h-9 rounded-xl px-3 text-[13px]', !draftForm.customerCity && 'border-destructive/80 ring-1 ring-destructive/80')}
                        value={draftForm.customerCity}
                        autoComplete="new-password"
                        onChange={(event) => {
                          updateDraftField('customerCity', event.target.value);
                          setCitySuggestionsOpen(true);
                        }}
                        onFocus={() => setCitySuggestionsOpen(true)}
                        onBlur={() => {
                          window.setTimeout(() => setCitySuggestionsOpen(false), 120);
                        }}
                        placeholder="Start typing city"
                        required
                      />
                      {citySuggestionsOpen && filteredDraftCities.length > 0 ? (
                        <div className="absolute top-full z-[120] mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                          <div className="max-h-56 overflow-y-auto p-1">
                            {filteredDraftCities.map((city) => (
                              <button
                                key={city}
                                type="button"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  updateDraftField('customerCity', city);
                                  setCitySuggestionsOpen(false);
                                }}
                                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-[13px] text-foreground transition-colors hover:bg-muted"
                              >
                                {city}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel className="flex items-center gap-1.5 text-[12px]">Landmark</FieldLabel>
                    <Input className="h-9 rounded-xl px-3 text-[13px]" value={draftForm.landmark} onChange={(event) => updateDraftField('landmark', event.target.value)} autoComplete="new-password" />
                  </Field>
                  <Field className="md:col-span-2">
                    <FieldLabel className="flex items-center gap-1.5 text-[12px]">Full Address <span className="text-destructive">*</span></FieldLabel>
                    <Input
                      className={cn('h-9 rounded-xl px-3 text-[13px]', !draftForm.customerAddress && 'border-destructive/80 ring-1 ring-destructive/80')}
                      value={draftForm.customerAddress}
                      onChange={(event) => updateDraftField('customerAddress', event.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </Field>
                  <Field className="md:col-span-2">
                    <FieldLabel className="flex items-center gap-1.5 text-[12px]">Notes</FieldLabel>
                    <Textarea rows={3} className="min-h-24 rounded-xl px-3 py-2 text-[13px]" value={draftForm.notes} onChange={(event) => updateDraftField('notes', event.target.value)} placeholder="Internal note" />
                  </Field>
                </FieldGroup>
              </div>

              <div className="relative z-10 min-w-0 rounded-2xl border border-border/80 bg-card p-3 shadow-[0_14px_30px_-32px_rgba(15,23,42,0.4)] lg:p-4">
                <div className="mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Order Setup</p>
                  </div>

                  <FieldGroup className="grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field>
                        <FieldLabel className="flex items-center gap-1.5 text-[12px]">COD Amount</FieldLabel>
                        <Input
                          type="number"
                          min="0"
                          className="h-9 rounded-xl px-3 text-[13px]"
                          value={draftForm.manualCodAmount}
                          onChange={(event) => updateDraftField('manualCodAmount', event.target.value)}
                          placeholder={`Auto (= ${formatPrice(draftTotalAmount || 0)})`}
                        />
                        <FieldDescription className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                          {draftForm.manualCodAmount
                            ? `COD will be: ${formatPrice(draftForm.manualCodAmount)}`
                            : `Auto-calculate: COD = ${formatPrice(draftTotalAmount || 0)}`
                          }
                        </FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel className="flex items-center gap-1.5 text-[12px]">Source Tag</FieldLabel>
                        <Select value={draftForm.sourceTag || undefined} onValueChange={(value) => updateDraftField('sourceTag', value)}>
                          <SelectTrigger className="h-9 rounded-xl px-3 text-[13px]">
                            <SelectValue placeholder="Pick source..." />
                          </SelectTrigger>
                          <SelectContent className="z-[300]">
                            <SelectGroup>
                              {DRAFT_SOURCE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="text-[13px]">
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field>
                        <FieldLabel className="flex items-center gap-1.5 text-[12px]">Item Type</FieldLabel>
                        <Input className="h-9 rounded-xl px-3 text-[13px]" value={draftForm.itemType} onChange={(event) => updateDraftField('itemType', event.target.value)} />
                      </Field>
                      <Field>
                        <FieldLabel className="flex items-center gap-1.5 text-[12px]">Weight (kg)</FieldLabel>
                        <Input type="number" step="0.5" min="0.5" className="h-9 rounded-xl px-3 text-[13px]" value={draftForm.weight} onChange={(event) => updateDraftField('weight', event.target.value)} />
                      </Field>
                    </div>
                  </FieldGroup>
                </div>
              </div>

              <div className="min-w-0 space-y-3">
                <div className="min-w-0 rounded-2xl border border-border/80 bg-card p-3 shadow-[0_14px_30px_-32px_rgba(15,23,42,0.4)] lg:p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Items</p>
                    </div>
                    <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                      {draftItems.length} item{draftItems.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <Field className="mb-3">
                    <FieldLabel className="flex items-center gap-1.5 text-[12px]">Search & Add Items <span className="text-destructive">*</span></FieldLabel>
                      <Popover open={productPickerOpen} onOpenChange={setProductPickerOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="h-9 w-full justify-between rounded-xl px-3 text-[13px] font-normal">
                            <span className="truncate text-muted-foreground">Search products, categories, or tags</span>
                            <Plus data-icon="inline-end" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="z-[300] w-[min(24rem,calc(100vw-2rem))] overflow-hidden p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search product..." />
                          <CommandList>
                            <CommandEmpty>No matching product found.</CommandEmpty>
                            <CommandGroup className="max-h-80 overflow-y-auto">
                              {availableDraftProducts.map(({ product, primaryImage, categorySummary, searchValue }) => {
                                  return (
                                    <CommandItem
                                      key={product._id}
                                      value={searchValue}
                                      onSelect={() => addDraftProduct(product)}
                                      className="px-3 py-3"
                                    >
                                      <div className="flex min-w-0 flex-1 items-center gap-3">
                                        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted">
                                          {primaryImage?.url ? (
                                            <Image
                                              src={primaryImage.url}
                                              alt={product.Name}
                                              fill
                                              sizes="48px"
                                              className="object-cover"
                                              {...getBlurPlaceholderProps(primaryImage.blurDataURL)}
                                            />
                                          ) : null}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="truncate text-sm font-semibold text-foreground">{product.Name}</p>
                                          <div className="mt-1 flex flex-wrap gap-1.5">
                                            {categorySummary.length > 0 ? categorySummary.map((category) => (
                                              <span key={category} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                {category}
                                              </span>
                                            )) : (
                                              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                Uncategorized
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <span className="shrink-0 text-[11px] font-semibold text-foreground">
                                          {formatPrice(product.discountedPrice ?? product.Price ?? 0)}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </Field>

                  {/* Custom Item */}
                  <div className="mb-3 rounded-xl border border-dashed border-border bg-muted/20 p-2.5">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Custom Item</p>
                    <div className="flex gap-2">
                      <Input
                        className="h-8 flex-1 rounded-xl px-2.5 text-[12px]"
                        placeholder="Item name"
                        value={draftForm.customItemName}
                        onChange={(e) => updateDraftField('customItemName', e.target.value)}
                      />
                      <Input
                        type="number"
                        className="h-8 w-24 rounded-xl px-2.5 text-[12px]"
                        placeholder="Price"
                        value={draftForm.customItemPrice}
                        onChange={(e) => updateDraftField('customItemPrice', e.target.value)}
                      />
                      <Button type="button" size="sm" variant="secondary" className="h-8 rounded-xl text-[12px]" onClick={addCustomItemToDraft}>
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {draftItems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-[12px] text-muted-foreground">
                      Add products to build the draft order.
                    </div>
                  ) : (
                    <>
                        <div className="hidden overflow-hidden rounded-xl border border-border md:block">
                          <div>
                    <table className="w-full table-fixed">
                      <thead className="bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">Item</th>
                          <th className="w-20 px-3 py-2">Qty</th>
                          <th className="w-24 px-3 py-2 text-right">Price</th>
                          <th className="w-12 px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                      {draftItems.map((item) => (
                        <tr key={item.productId}>
                          <td className="px-3 py-2">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="relative size-10 overflow-hidden rounded-lg border border-border/80 bg-muted">
                                {item.image ? (
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                  />
                                ) : null}
                              </div>
                              <span className="truncate text-[13px] font-medium text-foreground">{item.name}</span>
                            </div>
                          </td>
                            <td className="px-3 py-2">
                              <Input type="number" min="1" className="ml-auto h-8 w-16 rounded-lg px-2 text-[12px]" value={item.quantity} onChange={(event) => updateDraftItemQuantity(item.productId, event.target.value)} />
                            </td>
                          <td className="px-3 py-2 text-right text-[12px] font-semibold text-foreground">
                            {formatPrice(Number(item.price || 0) * Number(item.quantity || 0))}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={() => removeDraftItem(item.productId)}>
                              <Trash2 className="size-4" />
                              <span className="sr-only">Remove item</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                        </div>
                      </div>

                        <div className="space-y-2.5 md:hidden">
                          {draftItems.map((item) => (
                            <div key={item.productId} className="rounded-xl border border-border bg-card p-3">
                              <div className="flex items-start gap-3">
                                <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted">
                                  {item.image ? (
                                    <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    sizes="48px"
                                    className="object-cover"
                                  />
                                ) : null}
                              </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[13px] font-medium text-foreground">{item.name}</p>
                                  <p className="mt-1 text-[12px] font-semibold text-foreground">
                                    {formatPrice(Number(item.price || 0) * Number(item.quantity || 0))}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <FieldLabel className="text-[11px] text-muted-foreground">Qty</FieldLabel>
                                  <Input type="number" min="1" className="h-8 w-16 rounded-lg px-2 text-[12px]" value={item.quantity} onChange={(event) => updateDraftItemQuantity(item.productId, event.target.value)} />
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground" onClick={() => removeDraftItem(item.productId)}>
                                  <Trash2 className="size-4" />
                                  <span className="sr-only">Remove item</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-border bg-muted/20 px-3 py-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {draftItems.length} item{draftItems.length === 1 ? '' : 's'}
                        </span>
                        <span className="text-[13px] font-semibold text-foreground">{formatPrice(draftTotalAmount)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 z-[100] -mx-3 -mb-3 mt-4 bg-card/95 pb-3 pl-3 pr-3 pt-4 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] backdrop-blur sm:-mx-5 sm:-mb-5 sm:pb-5 sm:pl-5 sm:pr-5 sm:pt-4 lg:-mx-6 lg:-mb-6 lg:pb-6 lg:pl-6 lg:pr-6 gap-1.5 sm:gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setIsCreateModalOpen(false); resetDraftComposer(); }} className="admin-cta-button">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCreatingDraft} className="admin-cta-button min-w-[120px]">
                {isCreatingDraft ? <Spinner data-icon="inline-start" /> : null}
                {isCreatingDraft ? 'Creating...' : 'Create Draft'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={quickActionOrder !== null} onOpenChange={(open) => { if (!open) setQuickActionOrder(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Quick Update</DialogTitle>
          </DialogHeader>
          <QuickUpdateForm
            quickStatus={quickStatus}
            setQuickStatus={setQuickStatus}
            quickTracking={quickTracking}
            setQuickTracking={setQuickTracking}
            editingOrder={editingOrder}
            setEditingOrder={setEditingOrder}
            isQuickUpdating={isQuickUpdating}
            onSubmit={() => handleQuickUpdate(quickActionOrder)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-h-[88vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Edit Order {editingOrder?.orderId}</DialogTitle>
          </DialogHeader>
          
          {editingOrder && (
            <form onSubmit={handleFullUpdate} className="flex flex-col gap-5 py-2">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Consignee Info */}
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Consignee Details</p>
                  <Separator />
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="customerName" className="text-[12px]">Full Name</FieldLabel>
                      <Input id="customerName" name="customerName" className="h-8 text-[13px]" defaultValue={editingOrder.customerName} required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="customerEmail" className="text-[12px]">Email</FieldLabel>
                      <Input id="customerEmail" name="customerEmail" type="email" className="h-8 text-[13px]" defaultValue={editingOrder.customerEmail} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="customerPhone" className="text-[12px]">Phone</FieldLabel>
                      <Input id="customerPhone" name="customerPhone" className="h-8 text-[13px]" defaultValue={editingOrder.customerPhone} required />
                    </Field>
                  </FieldGroup>
                </div>

                {/* Address Info */}
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Shipping Address</p>
                  <Separator />
                  <FieldGroup>
                    <Field>
                      <FieldLabel className="text-[12px]">City</FieldLabel>
                      <Popover open={cityOpen} onOpenChange={setCityOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={cityOpen}
                            className="h-8 w-full justify-between text-[13px] font-normal"
                          >
                            {editingOrder.customerCity || editingOrder.city || "Select city..."}
                            <ChevronsUpDown data-icon="inline-end" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search city..." />
                            <CommandList>
                              <CommandEmpty>No city found.</CommandEmpty>
                              <CommandGroup className="max-h-52 overflow-y-auto">
                                {PAKISTAN_CITIES.map((city) => (
                                  <CommandItem
                                    key={city}
                                    value={city}
                                    onSelect={(currentValue) => {
                                      if (editingOrder) {
                                        setEditingOrder({ ...editingOrder, customerCity: currentValue });
                                      }
                                      setCityOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        (editingOrder.customerCity || editingOrder.city) === city ? "opacity-100" : "opacity-0"
                                      )}
                                      data-icon="inline-start"
                                    />
                                    {city}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="customerAddress" className="text-[12px]">Full Address</FieldLabel>
                      <Input id="customerAddress" name="customerAddress" className="h-8 text-[13px]" defaultValue={editingOrder.customerAddress} required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="landmark" className="text-[12px]">Landmark</FieldLabel>
                      <Input id="landmark" name="landmark" className="h-8 text-[13px]" defaultValue={editingOrder.landmark} />
                    </Field>
                  </FieldGroup>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="itemType" className="text-[12px]">Item Type</FieldLabel>
                    <Input id="itemType" name="itemType" className="h-8 text-[13px]" defaultValue={editingOrder.itemType || 'Mix'} />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="orderQuantity" className="text-[12px]">Quantity</FieldLabel>
                    <Input id="orderQuantity" name="orderQuantity" type="number" className="h-8 text-[13px]" defaultValue={editingOrder.orderQuantity || 1} />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="weight" className="text-[12px]">Weight (kg)</FieldLabel>
                    <Input id="weight" name="weight" type="number" step="0.5" className="h-8 text-[13px]" defaultValue={editingOrder.weight ?? 2} />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="sourceTag" className="text-[12px]">Source Tag</FieldLabel>
                    <Input id="sourceTag" name="sourceTag" className="h-8 text-[13px]" defaultValue={editingOrder.sourceTag || ''} placeholder="WhatsApp, Instagram, Call..." />
                  </Field>
                </FieldGroup>
                <FieldGroup className="md:col-span-2">
                  <Field>
                    <FieldLabel htmlFor="manualCodAmount" className="text-[12px]">COD Amount (Override)</FieldLabel>
                    <Input id="manualCodAmount" name="manualCodAmount" type="number" className="h-8 text-[13px]" placeholder="Blank = auto" defaultValue={editingOrder.manualCodAmount ?? ''} />
                    <FieldDescription className="text-[10px]">
                      If blank, COD = {formatPrice(getCodAmount(editingOrder) || 0)}
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </div>

              <DialogFooter className="gap-1.5 sm:gap-0">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditModalOpen(false)} className="admin-cta-button">Cancel</Button>
                <Button type="submit" size="sm" disabled={isUpdating} className="admin-cta-button min-w-[100px]">
                  {isUpdating ? <Spinner data-icon="inline-start" /> : null}
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-2 px-1 py-2">
          <p className="text-[12px] text-muted-foreground">
            Showing <span className="font-medium text-foreground">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
            <span className="font-medium text-foreground">
              {Math.min(currentPage * pageSize, total)}
            </span>{' '}
            of <span className="font-medium text-foreground">{total}</span> orders
          </p>
          <AppPagination
            page={currentPage}
            totalPages={totalPages}
            getHref={(page) => buildHref(pathname, searchParams, { page })}
          />
        </div>
      )}

      {/* NOC Express Bulk Booking Dialog */}
      <Dialog open={nocBookingOpen} onOpenChange={setNocBookingOpen}>
        <DialogContent className="max-w-md bg-white text-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <Truck className="size-5 text-sky-600" />
              Book Selected with NOC Express
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Select NOC account to send {selectedOrders.length} selected order(s):
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
                NOC Account
              </span>
              <Select value={selectedNocPortal} onValueChange={setSelectedNocPortal}>
                <SelectTrigger className="w-full h-11 text-sm font-semibold bg-white text-gray-900 border-gray-300 rounded-xl">
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900 border-gray-200 rounded-xl">
                  {NOC_PORTALS.map((portal) => (
                    <SelectItem key={portal.id} value={portal.id} className="font-medium text-gray-900">
                      {portal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Simple White Light Summary Box */}
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs flex items-center justify-between">
              <span className="font-semibold text-gray-700">Selected Orders:</span>
              <span className="font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200 text-xs">
                {selectedOrders.length} Order(s)
              </span>
            </div>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setNocBookingOpen(false)} className="rounded-xl h-10 px-4 text-gray-700 hover:bg-gray-100 border-gray-300">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleBulkNocBooking}
              disabled={isBookingNoc}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl h-10 px-5 shadow-sm"
            >
              {isBookingNoc ? <Spinner data-icon="inline-start" /> : <Send className="size-4 mr-1.5" />}
              {isBookingNoc ? 'Booking...' : `Confirm & Book (${selectedOrders.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shared NOC Live Tracking Modal */}
      <NocTrackingModal
        open={!!nocTrackingOrder}
        onOpenChange={(open) => !open && setNocTrackingOrder(null)}
        trackingNumber={nocTrackingOrder?.trackingNumber}
        orderId={nocTrackingOrder?.orderId}
        courierName={nocTrackingOrder?.courierName || 'NOC Express'}
        nocLabelUrl={nocTrackingOrder?.nocLabelUrl}
      />

      {/* NOC Express Booking Success & Print Slips Popup Dialog */}
      <Dialog open={!!nocPrintResult} onOpenChange={(open) => !open && setNocPrintResult(null)}>
        <DialogContent className="max-w-md bg-white text-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <span className="text-xl">🎉</span>
              Booking Successful!
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600">
              {nocPrintResult?.count || 0} order(s) successfully booked with NOC Express and moved to <strong className="text-gray-900">Shipped</strong> status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {/* NOC Account Used Indicator */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs">
              <span className="font-semibold text-gray-700">Account Used:</span>
              <span className="font-bold text-sky-900 bg-sky-100 px-3 py-1 rounded-full border border-sky-300">
                {nocPrintResult?.portalKey === 'portal_2' ? 'Secondary Account (aamsaman)' : 'Main Account (unique items)'}
              </span>
            </div>

            {nocPrintResult?.parcelNumbers?.length > 0 && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">Assigned NOC Parcel No(s):</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {nocPrintResult.parcelNumbers.map((no, idx) => (
                    <span key={idx} className="font-mono text-xs font-bold bg-sky-100 text-sky-900 px-2.5 py-1 rounded-md border border-sky-300">
                      {no}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNocPrintResult(null)}
              className="rounded-xl h-10 px-4 text-gray-700 hover:bg-gray-100 border-gray-300 font-medium"
            >
              Close
            </Button>
            {nocPrintResult?.labelUrl && (
              <Button
                size="sm"
                onClick={() => {
                  window.open(nocPrintResult.labelUrl, '_blank');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-10 px-5 shadow-sm flex items-center gap-1.5"
              >
                <Printer className="size-4" />
                Print Airway Slips
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NOC Print Slips Account Selection Dialog */}
      <Dialog open={!!nocPrintAccountModal} onOpenChange={(open) => !open && setNocPrintAccountModal(null)}>
        <DialogContent className="max-w-md bg-white text-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <Printer className="size-5 text-emerald-600" />
              Print Shipping Slips by Account
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600">
              Select which NOC Account slips you would like to open for printing:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {/* Main Account Option */}
            <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-sky-900 block">Main Account (unique items)</span>
                <span className="text-[11px] text-sky-700">{nocPrintAccountModal?.p1Count || 0} order slip(s) ready</span>
              </div>
              <Button
                size="sm"
                disabled={!nocPrintAccountModal?.p1Urls?.length}
                onClick={() => {
                  nocPrintAccountModal.p1Urls.forEach((url) => window.open(url, '_blank'));
                  setNocPrintAccountModal(null);
                }}
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs rounded-lg px-3 py-1.5 h-8 font-semibold"
              >
                Print ({nocPrintAccountModal?.p1Count || 0})
              </Button>
            </div>

            {/* Secondary Account Option */}
            <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-purple-900 block">Secondary Account (aamsaman)</span>
                <span className="text-[11px] text-purple-700">{nocPrintAccountModal?.p2Count || 0} order slip(s) ready</span>
              </div>
              <Button
                size="sm"
                disabled={!nocPrintAccountModal?.p2Urls?.length}
                onClick={() => {
                  nocPrintAccountModal.p2Urls.forEach((url) => window.open(url, '_blank'));
                  setNocPrintAccountModal(null);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg px-3 py-1.5 h-8 font-semibold"
              >
                Print ({nocPrintAccountModal?.p2Count || 0})
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-between gap-2 border-t border-gray-100 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNocPrintAccountModal(null)}
              className="rounded-xl h-9 px-4 text-gray-700 border-gray-300"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!nocPrintAccountModal?.allUrls?.length}
              onClick={() => {
                nocPrintAccountModal.allUrls.forEach((url) => window.open(url, '_blank'));
                setNocPrintAccountModal(null);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-9 px-4 shadow-sm flex items-center gap-1.5"
            >
              <Printer className="size-3.5" />
              Print All ({nocPrintAccountModal?.allUrls?.length || 0})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Quick Update Form (shared between mobile popover & desktop dialog) ── */
function QuickUpdateForm({ quickStatus, setQuickStatus, quickTracking, setQuickTracking, editingOrder, setEditingOrder, isQuickUpdating, onSubmit }) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel className="text-[11px]">Status</FieldLabel>
        <Select value={quickStatus} onValueChange={setQuickStatus}>
          <SelectTrigger className="h-8 text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.keys(statusVariant).map(s => <SelectItem key={s} value={s} className="text-[12px]">{s}</SelectItem>)}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel className="text-[11px]">Tracking ID</FieldLabel>
        <Input 
          className="h-8 text-[12px]" 
          value={quickTracking} 
          onChange={(e) => setQuickTracking(e.target.value)} 
          placeholder="Enter Tracking ID"
        />
      </Field>
      <Field>
        <FieldLabel className="text-[11px]">Courier</FieldLabel>
        <Input 
          className="h-8 text-[12px]" 
          value={editingOrder?.courierName || ''} 
          onChange={(e) => setEditingOrder({ ...editingOrder, courierName: e.target.value })} 
          placeholder="e.g. Trax, Leopard, PostEx"
        />
      </Field>
      <Button 
        className="h-8 w-full text-[12px]" 
        disabled={isQuickUpdating} 
        onClick={onSubmit}
      >
        {isQuickUpdating ? <Spinner data-icon="inline-start" /> : null}
        {isQuickUpdating ? 'Updating...' : 'Update Order'}
      </Button>
    </FieldGroup>
  );
}
