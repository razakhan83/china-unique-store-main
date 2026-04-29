'use client';

import { useEffect, useState, useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, Receipt, Search, X, Download, Edit, Zap, Check, ChevronsUpDown, MoreHorizontal, FileSpreadsheet, PackageCheck, Truck, Plus, Trash2 } from 'lucide-react';
import AppPagination from '@/components/AppPagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
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
import { cn } from '@/lib/utils';
import { PAKISTAN_CITIES } from '@/lib/cities';
import { bulkUpdateOrderStatusAction, createDraftOrderAction, updateOrderAction } from '@/app/actions';
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

const formatPrice = (price) => `PKR ${Number(price).toLocaleString('en-PK')}`;
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });
const formatWeight = (weight) => `${Number(weight || 0).toFixed(1)} kg`;

function sanitizePdfText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  const [createCityOpen, setCreateCityOpen] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [draftForm, setDraftForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerCity: '',
    landmark: '',
    sourceTag: '',
    itemType: 'Mix',
    weight: '2',
    notes: '',
  });
  const [draftItems, setDraftItems] = useState([]);
  
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

  const draftTotalAmount = draftItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);

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
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      customerCity: '',
      landmark: '',
      sourceTag: '',
      itemType: 'Mix',
      weight: '2',
      notes: '',
    });
    setDraftItems([]);
    setCreateCityOpen(false);
    setProductPickerOpen(false);
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
          image: Array.isArray(product.Images) ? product.Images[0]?.url || '' : '',
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

  const validateSelectedOrders = (expectedStatus, actionLabel) => {
    const normalizedExpectedStatus = normalizeOrderStatus(expectedStatus);
    const selectedRecords = getSelectedOrders();

    if (selectedRecords.length === 0) {
      toast.error(`Select at least one order to ${actionLabel.toLowerCase()}.`);
      return [];
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

  const handleGenerateCourierSheet = async () => {
    const ordersToExport = validateSelectedOrders('Packed', 'Generate Courier Sheet');
    if (!ordersToExport) return;

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
          codAmount = order.totalAmount;
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
        allowedCurrentStatuses: ['Packed'],
        logReason: 'Courier sheet generated. Status moved from Packed to Shipped.',
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

  const handleGenerateSourcingSlip = async () => {
    const ordersToExport = validateSelectedOrders('Order Confirmed', 'Generate Sourcing Slip');
    if (!ordersToExport) return;

    setPendingWorkflowAction('sourcing');

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

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

      const statusMoved = await moveSelectedOrdersToStatus('In Process', {
        allowedCurrentStatuses: ['Order Confirmed'],
        logReason: 'Sourcing slip generated. Status moved from Order Confirmed to In Process.',
      });

      if (!statusMoved) return;

      doc.save(`Sourcing_Slip_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setPendingWorkflowAction('');
    }
  };

  const handleGeneratePackingSlip = async () => {
    const selectedRecords = getSelectedOrders();
    if (selectedRecords.length === 0) {
      toast.error('Select at least one order to generate packing slips.');
      return;
    }

    setPendingWorkflowAction('packing');

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

      const statusMoved = await moveSelectedOrdersToStatus('Packed', {
        allowedCurrentStatuses: ['In Process'],
        logReason: 'Packing slip generated. Status moved from In Process to Packed.',
      });

      if (!statusMoved) return;

      doc.save(`Packing_Slips_${new Date().toISOString().slice(0, 10)}.pdf`);
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

  const handleCreateDraftOrder = async (event) => {
    event.preventDefault();

    if (draftItems.length === 0) {
      toast.error('Add at least one item before creating the order.');
      return;
    }

    setIsCreatingDraft(true);
    try {
      const result = await createDraftOrderAction({
        ...draftForm,
        items: draftItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
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
  const appliedFilters = [
    statusFilter !== DEFAULT_ORDER_STATUS ? `Status: ${statusFilter === 'all' ? 'All' : statusFilter === DRAFT_TAB_ID ? 'Draft' : statusFilter}` : null,
    initialSearchQuery ? `Search: ${initialSearchQuery}` : null,
    initialStartDate || initialEndDate
      ? `Date: ${initialStartDate || 'Any'} - ${initialEndDate || 'Any'}`
      : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">Orders</h2>
        <Button
          type="button"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="h-8 rounded-xl px-3 text-[12px] font-semibold"
        >
          <Plus data-icon="inline-start" />
          Create Order
        </Button>
      </div>

      {/* Status Filter Tabs — Compact pills */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
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
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Filters Bar — Compact */}
      <form
        className="flex flex-col gap-2"
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
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" data-icon />
          <Input
            placeholder="Search by Order ID, Name, or Phone..."
            className="h-8 pl-8 text-[13px] md:h-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Date Range Filters */}
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/20 px-2 py-1">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">From</span>
            <Input
              type="date"
              className="h-7 min-w-0 flex-1 border-0 bg-transparent px-1 text-[12px] shadow-none focus-visible:ring-0 sm:w-[120px]"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/20 px-2 py-1">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">To</span>
            <Input
              type="date"
              className="h-7 min-w-0 flex-1 border-0 bg-transparent px-1 text-[12px] shadow-none focus-visible:ring-0 sm:w-[120px]"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {(startDate || endDate) && (
            <Button type="submit" variant="default" size="sm" className="h-7 gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
              <Search data-icon="inline-start" className="size-3" />
              Search Dates
            </Button>
          )}

          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="h-7 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <X data-icon="inline-start" />
              Clear
            </Button>
          )}
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {statusFilter === DEFAULT_ORDER_STATUS ? (
          <Button
            type="button"
            size="sm"
            onClick={handleGenerateSourcingSlip}
            disabled={selectedOrders.length === 0 || pendingWorkflowAction !== '' || isBulkUpdating}
            className="h-8 rounded-xl px-3 text-[12px] font-semibold"
          >
            {pendingWorkflowAction === 'sourcing' ? <Spinner data-icon="inline-start" /> : <FileSpreadsheet data-icon="inline-start" />}
            {pendingWorkflowAction === 'sourcing' ? 'Generating Sourcing Slip...' : `Generate Sourcing Slip${selectedOrders.length > 0 ? ` (${selectedOrders.length})` : ''}`}
          </Button>
        ) : null}
        {statusFilter === 'In Process' ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleGeneratePackingSlip}
            disabled={selectedOrders.length === 0 || pendingWorkflowAction !== '' || isBulkUpdating}
            className="h-8 rounded-xl px-3 text-[12px] font-semibold"
          >
            {pendingWorkflowAction === 'packing' ? <Spinner data-icon="inline-start" /> : <Receipt data-icon="inline-start" />}
            {pendingWorkflowAction === 'packing' ? 'Generating Packing Slip...' : `Packing Slip${selectedOrders.length > 0 ? ` (${selectedOrders.length})` : ''}`}
          </Button>
        ) : null}
        {statusFilter === 'Packed' ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleGenerateCourierSheet}
            disabled={selectedOrders.length === 0 || pendingWorkflowAction !== '' || isBulkUpdating}
            className="h-8 rounded-xl px-3 text-[12px] font-semibold"
          >
            {pendingWorkflowAction === 'courier' ? <Spinner data-icon="inline-start" /> : <Truck data-icon="inline-start" />}
            {pendingWorkflowAction === 'courier' ? 'Generating Courier Sheet...' : `Generate Courier Sheet${selectedOrders.length > 0 ? ` (${selectedOrders.length})` : ''}`}
          </Button>
        ) : null}
        <Select value={bulkStatus} onValueChange={setBulkStatus}>
          <SelectTrigger
            disabled={selectedOrders.length === 0 || isBulkUpdating || pendingWorkflowAction !== ''}
            className="h-8 w-[180px] rounded-xl text-[12px]"
          >
            <SelectValue placeholder="Choose status" />
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
          onClick={() => moveSelectedOrdersToStatus(bulkStatus)}
          disabled={selectedOrders.length === 0 || !bulkStatus || isBulkUpdating || pendingWorkflowAction !== ''}
          className="h-8 rounded-xl px-3 text-[12px] font-semibold"
        >
          {isBulkUpdating ? <Spinner data-icon="inline-start" /> : <PackageCheck data-icon="inline-start" />}
          Move Selected{selectedOrders.length > 0 ? ` (${selectedOrders.length})` : ''}
        </Button>
        {statusFilter === 'all' ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-xl text-[12px] font-semibold">
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
      </div>

      {appliedFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {appliedFilters.map((filter) => (
            <Badge key={filter} variant="outline" className="rounded-md px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {filter}
            </Badge>
          ))}
        </div>
      )}

      {/* ── Desktop Table ── */}
      <div className={cn("hidden overflow-hidden rounded-lg border border-border bg-card md:block", isPending && "opacity-60")}>
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
                      <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3 h-7 text-[12px]">
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
                      <Link href={`/admin/orders/${order._id}`} className="text-[13px] font-semibold tabular-nums text-foreground hover:underline">
                        {order.orderId}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-foreground">{order.customerName}</span>
                        <span className="text-[11px] text-muted-foreground">{order.customerPhone}</span>
                        {(order.isDraft || order.sourceTag) ? (
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            {order.isDraft ? (
                              <Badge variant="outline" className="rounded-md px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide">
                                Draft
                              </Badge>
                            ) : null}
                            {order.sourceTag ? (
                              <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[9px] font-medium">
                                {order.sourceTag}
                              </Badge>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="secondary" className="text-[10px] font-medium">
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
                      <div className="flex max-w-[140px] flex-col">
                        <span className="truncate text-[12px] text-foreground">{order.trackingNumber || '—'}</span>
                        <span className="truncate text-[11px] text-muted-foreground">{order.courierName || ''}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[12px] tabular-nums text-foreground">{formatWeight(order.weight)}</td>
                    <td className="px-3 py-2 text-right text-[13px] font-semibold tabular-nums text-foreground">{formatPrice(order.totalAmount)}</td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={order.isDraft ? 'outline' : (statusVariant[order.status] || 'secondary')}
                        className={cn('text-[10px]', order.isDraft ? 'border-slate-300 bg-slate-50 text-slate-700' : getStatusBadgeClass(order.status))}
                      >
                        {getOrderDisplayStatus(order)}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
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
                                <Eye data-icon="inline-start" />
                                View details
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
                            <DropdownMenuSeparator />
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
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Cards ── */}
      <div className={cn("flex flex-col gap-2 md:hidden", isPending && "opacity-60")}>
        {displayOrders.length > 0 && (
          <div className="flex items-center justify-between px-1 py-1 mb-0.5">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={isAllPaginatedSelected} 
                onCheckedChange={handleSelectAll} 
                aria-label="Select all on page"
              />
              <p className="text-[12px] font-medium text-muted-foreground cursor-pointer" onClick={() => handleSelectAll(!isAllPaginatedSelected)}>Select all on page</p>
            </div>
            {selectedOrders.length > 0 && (
              <span className="text-[11px] font-semibold text-foreground">{selectedOrders.length} selected</span>
            )}
          </div>
        )}

        {displayOrders.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-3 py-8 text-center">
            <Receipt className="mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">No orders found</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Try adjusting your search or filters.</p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3 h-8 text-[12px]">
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          displayOrders.map((order) => {
            if (!order) return null;

            return (
              <div key={order._id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    checked={selectedOrders.includes(order._id)}
                    onCheckedChange={(checked) => handleSelectOne(checked, order._id)}
                    aria-label={`Select order ${order.orderId}`}
                    className="mt-0.5"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold tabular-nums text-foreground">{order.orderId}</p>
                        <p className="text-[12px] font-medium text-foreground">{order.customerName}</p>
                        <p className="text-[11px] text-muted-foreground">{order.customerPhone}</p>
                        {(order.isDraft || order.sourceTag) ? (
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            {order.isDraft ? (
                              <Badge variant="outline" className="rounded-md px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide">
                                Draft
                              </Badge>
                            ) : null}
                            {order.sourceTag ? (
                              <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[9px] font-medium">
                                {order.sourceTag}
                              </Badge>
                            ) : null}
                          </div>
                        ) : null}
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Badge
                          variant={order.isDraft ? 'outline' : (statusVariant[order.status] || 'secondary')}
                          className={cn('text-[10px]', order.isDraft ? 'border-slate-300 bg-slate-50 text-slate-700' : getStatusBadgeClass(order.status))}
                        >
                          {getOrderDisplayStatus(order)}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="admin-touch-target size-8 rounded-full text-muted-foreground">
                              <MoreHorizontal />
                              <span className="sr-only">Order actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuGroup>
                              <DropdownMenuItem disabled className="text-[11px]">City: {order.customerCity || 'N/A'}</DropdownMenuItem>
                              <DropdownMenuItem disabled className="text-[11px]">Total: {formatPrice(order.totalAmount)}</DropdownMenuItem>
                              <DropdownMenuItem disabled className="text-[11px]">Payment: {order.paymentStatus || 'COD'}</DropdownMenuItem>
                              <DropdownMenuItem disabled className="text-[11px]">Weight: {formatWeight(order.weight)}</DropdownMenuItem>
                              <DropdownMenuItem disabled className="text-[11px]">Tracking: {order.trackingNumber || '—'}</DropdownMenuItem>
                              <DropdownMenuSeparator />
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5">
                       <span className="text-[12px] font-bold tabular-nums text-foreground">{formatPrice(order.totalAmount)}</span>
                       <Button
                          variant="secondary"
                          size="sm"
                          render={<Link href={`/admin/orders/${order._id}`} />}
                          nativeButton={false}
                          className="h-7 rounded-md px-3 text-[11px] font-semibold"
                       >
                          View order
                       </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Update Dialog (unified — used by both desktop dropdown and mobile cards) */}
      <Dialog
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) {
            resetDraftComposer();
          }
        }}
      >
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Create Draft Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateDraftOrder} className="flex flex-col gap-5 py-2">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Customer</p>
                <Separator />
                <FieldGroup>
                  <Field>
                    <FieldLabel className="text-[12px]">Full Name</FieldLabel>
                    <Input className="h-8 text-[13px]" value={draftForm.customerName} onChange={(event) => updateDraftField('customerName', event.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel className="text-[12px]">Email</FieldLabel>
                    <Input type="email" className="h-8 text-[13px]" value={draftForm.customerEmail} onChange={(event) => updateDraftField('customerEmail', event.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel className="text-[12px]">Phone</FieldLabel>
                    <Input className="h-8 text-[13px]" value={draftForm.customerPhone} onChange={(event) => updateDraftField('customerPhone', event.target.value)} required />
                  </Field>
                </FieldGroup>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Source</p>
                <Separator />
                <FieldGroup>
                  <Field>
                    <FieldLabel className="text-[12px]">Tag</FieldLabel>
                    <Input className="h-8 text-[13px]" value={draftForm.sourceTag} onChange={(event) => updateDraftField('sourceTag', event.target.value)} placeholder="WhatsApp, Instagram, Call..." />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel className="text-[12px]">Item Type</FieldLabel>
                      <Input className="h-8 text-[13px]" value={draftForm.itemType} onChange={(event) => updateDraftField('itemType', event.target.value)} />
                    </Field>
                    <Field>
                      <FieldLabel className="text-[12px]">Weight (kg)</FieldLabel>
                      <Input type="number" step="0.5" min="0.5" className="h-8 text-[13px]" value={draftForm.weight} onChange={(event) => updateDraftField('weight', event.target.value)} />
                    </Field>
                  </div>
                </FieldGroup>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Address</p>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <FieldGroup>
                  <Field>
                    <FieldLabel className="text-[12px]">City</FieldLabel>
                    <Popover open={createCityOpen} onOpenChange={setCreateCityOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-8 justify-between text-[13px] font-normal">
                          {draftForm.customerCity || 'Select city...'}
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
                                  onSelect={(value) => {
                                    updateDraftField('customerCity', value);
                                    setCreateCityOpen(false);
                                  }}
                                >
                                  <Check className={cn(draftForm.customerCity === city ? 'opacity-100' : 'opacity-0')} data-icon="inline-start" />
                                  {city}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel className="text-[12px]">Landmark</FieldLabel>
                    <Input className="h-8 text-[13px]" value={draftForm.landmark} onChange={(event) => updateDraftField('landmark', event.target.value)} />
                  </Field>
                </FieldGroup>
              </div>
              <FieldGroup>
                <Field>
                  <FieldLabel className="text-[12px]">Full Address</FieldLabel>
                  <Input className="h-8 text-[13px]" value={draftForm.customerAddress} onChange={(event) => updateDraftField('customerAddress', event.target.value)} required />
                </Field>
                <Field>
                  <FieldLabel className="text-[12px]">Notes</FieldLabel>
                  <Textarea rows={3} className="text-[13px]" value={draftForm.notes} onChange={(event) => updateDraftField('notes', event.target.value)} placeholder="Optional internal note" />
                </Field>
              </FieldGroup>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Items</p>
                <Popover open={productPickerOpen} onOpenChange={setProductPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="h-8 rounded-xl px-3 text-[12px] font-semibold">
                      <Plus data-icon="inline-start" />
                      Add Item
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search product..." />
                      <CommandList>
                        <CommandEmpty>No product found.</CommandEmpty>
                        <CommandGroup className="max-h-72 overflow-y-auto">
                          {(Array.isArray(productCatalog) ? productCatalog : []).map((product) => (
                            <CommandItem key={product._id} value={`${product.Name} ${product.slug || ''}`} onSelect={() => addDraftProduct(product)}>
                              <div className="flex w-full items-center justify-between gap-3">
                                <span className="truncate text-[12px]">{product.Name}</span>
                                <span className="shrink-0 text-[11px] text-muted-foreground">{formatPrice(product.discountedPrice ?? product.Price ?? 0)}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <Separator />
              {draftItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-[12px] text-muted-foreground">
                  Add products to build the draft order.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full">
                    <thead className="bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Item</th>
                        <th className="w-24 px-3 py-2">Qty</th>
                        <th className="w-28 px-3 py-2 text-right">Price</th>
                        <th className="w-10 px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {draftItems.map((item) => (
                        <tr key={item.productId}>
                          <td className="px-3 py-2 text-[13px] font-medium text-foreground">{item.name}</td>
                          <td className="px-3 py-2">
                            <Input type="number" min="1" className="h-8 text-[12px]" value={item.quantity} onChange={(event) => updateDraftItemQuantity(item.productId, event.target.value)} />
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
                  <div className="flex items-center justify-between border-t border-border bg-muted/20 px-3 py-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {draftItems.length} item{draftItems.length === 1 ? '' : 's'}
                    </span>
                    <span className="text-[13px] font-semibold text-foreground">{formatPrice(draftTotalAmount)}</span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-1.5 sm:gap-0">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setIsCreateModalOpen(false); resetDraftComposer(); }} className="h-8 text-[12px]">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCreatingDraft} className="h-8 min-w-[120px] text-[12px]">
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
                      If blank, COD = {formatPrice(editingOrder.totalAmount || 0)}
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </div>

              <DialogFooter className="gap-1.5 sm:gap-0">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditModalOpen(false)} className="h-8 text-[12px]">Cancel</Button>
                <Button type="submit" size="sm" disabled={isUpdating} className="h-8 min-w-[100px] text-[12px]">
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
