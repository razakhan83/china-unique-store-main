'use client';

import { useEffect, useState, useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, Receipt, Search, X, Download, Edit, Zap, Check, ChevronsUpDown, MoreHorizontal } from 'lucide-react';
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
import { updateOrderAction } from '@/app/actions';
import { toast } from 'sonner';

const statusVariant = {
  Confirmed: 'primary',
  Sourcing: 'secondary',
  'In Process': 'secondary',
  Packed: 'secondary',
  Shipped: 'secondary',
  'Out for Delivery': 'secondary',
  Delivered: 'secondary',
  Returned: 'outline',
};

const ITEMS_PER_PAGE = 12;

const formatPrice = (price) => `PKR ${Number(price).toLocaleString('en-PK')}`;
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });
const formatWeight = (weight) => `${Number(weight || 0).toFixed(1)} kg`;

function buildHref(pathname, searchParams, updates) {
  const params = new URLSearchParams(searchParams?.toString());

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '' || (key === 'status' && value === 'Confirmed')) {
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
  total,
  totalPages,
  currentPage,
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

  const displayOrders = orders;

  function navigate(updates) {
    const href = buildHref(pathname, searchParams, updates);
    startNavTransition(() => {
      router.push(href);
    });
  }

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('Confirmed');
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

  const handleDownloadExcel = async () => {
    const ordersToExport = orders.filter(o => selectedOrders.includes(o._id));
    if (ordersToExport.length === 0) return;

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    
    // 1. Create a single sheet named 'Sheet1' (Courier Portal requirement)
    const mainSheet = workbook.addWorksheet('Sheet1');

    // 2. Populate Reference Cities into a far-off hidden column (Column T / 20)
    // This allows a single-sheet file while still providing dropdown functionality.
    PAKISTAN_CITIES.forEach((city, index) => {
      mainSheet.getCell(index + 1, 20).value = city;
    });
    mainSheet.getColumn(20).hidden = true;

    // 3. Define exact headers for courier portal (No hidden spaces)
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

    // 4. Populate Rows and Formatting
    ordersToExport.forEach((order, index) => {
      // CODAmount Logic: 0 if Online, manual override, or totalAmount
      let codAmount = 0;
      if (order.manualCodAmount !== undefined && order.manualCodAmount !== null && order.manualCodAmount !== '') {
        codAmount = Number(order.manualCodAmount);
      } else if (order.paymentStatus === 'Online') {
        codAmount = 0;
      } else {
        codAmount = order.totalAmount;
      }

      // Address Cleaning: Merge, remove commas/newlines. NO MANUAL QUOTES (Excel handles it).
      const cleanAddress = [order.customerAddress, order.landmark]
        .filter(Boolean)
        .join(' - ')
        .replace(/[, \n\r]+/g, ' ') 
        .trim();

      // Pre-process City: Trim, Match Case, and Fallback
      let city = (order.customerCity || '').trim();
      const exactMatch = PAKISTAN_CITIES.find(c => c.trim().toLowerCase() === city.toLowerCase());
      city = exactMatch || 'KARACHI';

      const rowIndex = index + 2; // Data starts from row 2
      const row = mainSheet.getRow(rowIndex);
      
      // Email Fallback: Ensure never empty
      const email = (order.customerEmail || 'customer@store.com').trim();
      
      row.values = [
        order.customerName,
        cleanAddress,           // NO manual quotes here
        email,
        order.customerPhone,
        city,
        'Mix',                 // Static ItemType
        '1',                   // Static Quantity
        codAmount,
        order.weight ?? 2,
        order.notes || ''
      ];

      // 5. Apply Data Validation Rule to ConsigneeCity cell (Column 5/E)
      // Reference the hidden T column on the same sheet
      row.getCell(5).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`$T$1:$T$${PAKISTAN_CITIES.length}`],
        showDropDown: true,
      };
    });

    // Finalize columns width for better readability
    mainSheet.columns.forEach((column, index) => {
      if (index < 10) column.width = 20;
    });

    // Generate buffer and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Daily_Courier_Sheet_${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setSelectedOrders([]);
  };

  const handleDownloadPDF = async () => {
    const ordersToExport = orders.filter(o => selectedOrders.includes(o._id));
    if (ordersToExport.length === 0) return;

    // Dynamically import jspdf to avoid SSR errors with Node-specific modules
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    doc.text('Order Data Export', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const tableData = ordersToExport.map(o => [
      o.orderId,
      o.customerName,
      o.customerCity,
      o.status,
      o.totalAmount,
      new Date(o.createdAt).toLocaleDateString()
    ]);

    autoTable(doc, {
      head: [['ID', 'Customer', 'City', 'Status', 'Amount', 'Date']],
      body: tableData,
      startY: 30,
    });

    doc.save(`Orders_Export_${new Date().toISOString().slice(0, 10)}.pdf`);
    setSelectedOrders([]);
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
        order._id === id ? { ...order, status: quickStatus, trackingNumber: quickTracking, courierName: editingOrder?.courierName || '' } : order
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

  const hasActiveFilters = searchQuery || statusFilter !== 'Confirmed' || startDate || endDate;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">Orders</h2>
      </div>

      {/* Status Filter Tabs — Compact pills */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
        {[
          { id: 'Confirmed', label: `Confirmed (${summary.confirmedCount})` },
          { id: 'Sourcing', label: `Sourcing (${summary.sourcingCount || 0})` },
          { id: 'In Process', label: `In Progress (${summary.inProcessCount})` },
          { id: 'Packed', label: `Packed (${summary.packedCount || 0})` },
          { id: 'Shipped', label: `Shipped (${summary.shippedCount || 0})` },
          { id: 'Out for Delivery', label: `Out (${summary.outForDeliveryCount || 0})` },
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

        <div className="flex flex-wrap items-center gap-1.5">
          {selectedOrders.length > 0 && (
            <div className="flex items-center gap-1 rounded-md border border-border bg-muted/30 p-0.5">
              <Button onClick={handleDownloadExcel} size="sm" className="h-7 gap-1 px-2 text-[11px] font-semibold">
                <Download data-icon="inline-start" />
                XLSX ({selectedOrders.length})
              </Button>
              <Button onClick={handleDownloadPDF} size="sm" variant="outline" className="h-7 gap-1 border-destructive/20 px-2 text-[11px] font-semibold text-destructive hover:bg-destructive/10">
                <Download data-icon="inline-start" />
                PDF ({selectedOrders.length})
              </Button>
            </div>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
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
                      <Badge variant={statusVariant[order.status] || 'secondary'} className="text-[10px]">
                        {order.status}
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
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Badge variant={statusVariant[order.status] || 'secondary'} className="text-[10px]">
                          {order.status}
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
                                  setEditingOrder(order);
                                  setIsEditModalOpen(true);
                                }}
                              >
                                <Edit data-icon="inline-start" />
                                Edit Order
                              </DropdownMenuItem>
                              <DropdownMenuItem render={<Link href={`/admin/orders/${order._id}`} />}>
                                <Eye data-icon="inline-start" />
                                View Order
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-border/60 bg-muted/15 p-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">City</p>
                        <p className="mt-0.5 text-[12px] font-medium text-foreground">{order.customerCity || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Total</p>
                        <p className="mt-0.5 text-[12px] font-semibold tabular-nums text-foreground">{formatPrice(order.totalAmount)}</p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="admin-touch-target mt-2 h-9 w-full justify-center gap-1.5 rounded-lg border border-border/50 bg-transparent text-[12px] font-medium text-muted-foreground shadow-none hover:bg-muted/30 hover:text-foreground"
                      onClick={() => {
                        setQuickActionOrder(order._id);
                        setQuickStatus(order.status);
                        setQuickTracking(order.trackingNumber || '');
                        setEditingOrder(order);
                      }}
                    >
                      <Zap data-icon="inline-start" />
                      Quick Update
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/admin/orders/${order._id}`} />}
                      nativeButton={false}
                      className="admin-touch-target mt-1.5 h-9 w-full justify-center gap-1.5 rounded-lg border border-border/50 bg-transparent text-[12px] font-medium text-muted-foreground shadow-none hover:bg-muted/30 hover:text-foreground"
                    >
                      <Eye data-icon="inline-start" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Update Dialog (unified — used by both desktop dropdown and mobile cards) */}
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
            Showing <span className="font-medium text-foreground">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to{' '}
            <span className="font-medium text-foreground">
              {Math.min(currentPage * ITEMS_PER_PAGE, total)}
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
