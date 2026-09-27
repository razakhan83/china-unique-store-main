const fs = require('fs');

const file = 'src/app/admin/orders/AdminOrdersClient.jsx';
let content = fs.readFileSync(file, 'utf8');

const filterStart = '{/* ── Filter Bar & Actions ── */}';
const tableStart = '{/* ── Desktop Table ── */}';
const mobileStart = '{/* ── Mobile Cards ── */}';
const mobileEnd = '{/* Delete Confirm Dialog */}';

const filterIdx1 = content.indexOf(filterStart);
const tableIdx1 = content.indexOf(tableStart);
const mobileIdx1 = content.indexOf(mobileStart);
const mobileIdx2 = content.indexOf(mobileEnd);

if (filterIdx1 === -1 || tableIdx1 === -1 || mobileIdx1 === -1 || mobileIdx2 === -1) {
  console.log("Could not find boundaries", { filterIdx1, tableIdx1, mobileIdx1, mobileIdx2 });
  process.exit(1);
}

const filterJsx = content.substring(filterIdx1, tableIdx1);
const desktopTableJsx = content.substring(tableIdx1, mobileIdx1);
const mobileTableJsx = content.substring(mobileIdx1, mobileIdx2);

const makeComponent = (name, jsxCode) => {
  return `import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Calendar, Search, X, PackageCheck, Printer, Download, Truck, RotateCcw, Trash2, Zap, Upload, AlertTriangle, UserCog, Globe, Check, Edit, FileText, Send, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function ${name}(props) {
  const {
    // Props will be passed in bulk
    ...p
  } = props;
  
  // Expose all props to the local scope so the existing JSX works without prefix
  const {
    selectedOrders = [], setSelectedOrders, bulkStatus, setBulkStatus, BULK_STATUS_OPTIONS = [],
    moveSelectedOrdersToStatus, isBulkUpdating, pendingWorkflowAction, statusFilter,
    handlePrintSourcingSlip, handlePrintPackingSlip, DRAFT_TAB_ID, handleGenerateCourierSheet,
    setNocBookingOpen, isBookingNoc, handlePrintSelectedNocSlips, handleSyncNocStatus,
    isBulkSyncingNoc, setBulkDeleteConfirmOpen, isBulkDeleting, searchQuery, setSearchQuery,
    navigate, getQuickDateValue, handleQuickDateFilter, startDate, setStartDate, endDate, setEndDate,
    isDatePopoverOpen, setIsDatePopoverOpen, canApplyFilters, displayOrders = [], setIsSyncSheetModalOpen,
    handleExportMonthlySales, hasActiveFilters, clearFilters, isPending, OrdersTablePendingSkeleton,
    showNocColumns, enableSecondaryNoc, handleSelectAll, isAllPaginatedSelected, handleSelectOne,
    formatSmartTimeAgo, formatDate, formatTime, formatFullDateTime, getOrderOriginInfo, isNewOrder,
    getNocStatusBadgeClass, handleQuickUpdate, setEditingOrder, setIsEditModalOpen, setQuickActionOrder,
    setQuickStatus, setQuickTracking, setIsQuickUpdating, handleConfirmBulkDelete, formatPrice, OrderQuickViewDialog, OrdersMobilePendingSkeleton, handleOpenEditModal, handleDeleteOrder, setNocTrackingOrder, normalizeOrderStatus, initialSearchQuery
  } = p;

  return (
    <>
      ${jsxCode}
    </>
  );
}
`;
};

fs.writeFileSync('src/components/admin/orders/OrderFilters.jsx', makeComponent('OrderFilters', filterJsx));
fs.writeFileSync('src/components/admin/orders/OrderTable.jsx', makeComponent('OrderTable', desktopTableJsx + '\n' + mobileTableJsx));

const beforeFilters = content.substring(0, filterIdx1);
const afterMobile = content.substring(mobileIdx2);

const newContent = `import { OrderFilters } from '@/components/admin/orders/OrderFilters';\nimport { OrderTable } from '@/components/admin/orders/OrderTable';\n` + 
beforeFilters + 
`
      <OrderFilters {...{
        selectedOrders, setSelectedOrders, bulkStatus, setBulkStatus, BULK_STATUS_OPTIONS,
        moveSelectedOrdersToStatus, isBulkUpdating, pendingWorkflowAction, statusFilter,
        handlePrintSourcingSlip, handlePrintPackingSlip, DRAFT_TAB_ID, handleGenerateCourierSheet,
        setNocBookingOpen, isBookingNoc, handlePrintSelectedNocSlips, handleSyncNocStatus,
        isBulkSyncingNoc, setBulkDeleteConfirmOpen, isBulkDeleting, searchQuery, setSearchQuery,
        navigate, getQuickDateValue, handleQuickDateFilter, startDate, setStartDate, endDate, setEndDate,
        isDatePopoverOpen, setIsDatePopoverOpen, canApplyFilters, displayOrders, setIsSyncSheetModalOpen,
        handleExportMonthlySales, hasActiveFilters, clearFilters, handleConfirmBulkDelete, initialSearchQuery
      }} />

      <OrderTable {...{
        isPending, OrdersTablePendingSkeleton, showNocColumns, enableSecondaryNoc, displayOrders,
        hasActiveFilters, clearFilters, selectedOrders, handleSelectOne, handleSelectAll,
        isAllPaginatedSelected, isBulkSyncingNoc, formatFullDateTime, formatSmartTimeAgo,
        formatDate, formatTime, isNewOrder, getOrderOriginInfo, getNocStatusBadgeClass,
        handleQuickUpdate, setEditingOrder, setIsEditModalOpen, setQuickActionOrder, setQuickStatus,
        setQuickTracking, setIsQuickUpdating, formatPrice, OrderQuickViewDialog, OrdersMobilePendingSkeleton, handleOpenEditModal, handleDeleteOrder, setNocTrackingOrder, normalizeOrderStatus, statusFilter, DRAFT_TAB_ID, handleGenerateCourierSheet, pendingWorkflowAction, isBulkUpdating
      }} />
` + 
afterMobile;

fs.writeFileSync(file, newContent);
console.log("Successfully extracted OrderFilters and OrderTable!");
