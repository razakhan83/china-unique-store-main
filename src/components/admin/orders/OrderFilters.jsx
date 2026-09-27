import React from 'react';
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

export function OrderFilters(props) {
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
      {/* ── Filter Bar & Actions ── */}
      {selectedOrders.length > 0 ? (
        /* Floating / Selected Mode Action Bar */
        <div className="admin-filter-shell flex flex-wrap items-center justify-between gap-2.5 w-full bg-primary/5 border border-primary/20 rounded-xl px-3 py-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-semibold text-xs px-2.5 py-0.5">
              {selectedOrders.length} selected
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedOrders([])}
              className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
            >
              Clear
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Selector Dropdown */}
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="h-7.5 w-[140px] text-xs bg-background rounded-lg border-border/80">
                <SelectValue placeholder="Move to status" />
              </SelectTrigger>
              <SelectContent>
                {BULK_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status} className="text-xs">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Apply Status Button */}
            <Button
              type="button"
              size="sm"
              onClick={() => moveSelectedOrdersToStatus(bulkStatus)}
              disabled={!bulkStatus || isBulkUpdating || pendingWorkflowAction !== ''}
              className="h-7.5 px-2.5 text-xs font-medium"
            >
              {isBulkUpdating ? <Spinner data-icon="inline-start" /> : <PackageCheck data-icon="inline-start" />}
              Move
            </Button>

            {/* Contextual Workflow Action Buttons for Selected Orders */}
            {statusFilter === 'Order Confirmed' && (
              <Button
                type="button"
                size="sm"
                onClick={() => handlePrintSourcingSlip({ moveToNextStep: true })}
                disabled={pendingWorkflowAction !== '' || isBulkUpdating}
                className="h-7.5 px-2.5 text-xs bg-yellow-200 text-yellow-900 hover:bg-yellow-300 rounded-lg font-medium shadow-xs"
              >
                {pendingWorkflowAction === 'sourcing-print-move' ? <Spinner data-icon="inline-start" /> : <Printer data-icon="inline-start" />}
                Print & Move
              </Button>
            )}

            {statusFilter === 'In Process' && (
              <Button
                type="button"
                size="sm"
                onClick={() => handlePrintPackingSlip({ moveToNextStep: true })}
                disabled={pendingWorkflowAction !== '' || isBulkUpdating}
                className="h-7.5 px-2.5 text-xs bg-yellow-200 text-yellow-900 hover:bg-yellow-300 rounded-lg font-medium shadow-xs"
              >
                {pendingWorkflowAction === 'packing-print-move' ? <Spinner data-icon="inline-start" /> : <Printer data-icon="inline-start" />}
                Print & Move
              </Button>
            )}

            {(statusFilter === 'Packed' || statusFilter === DRAFT_TAB_ID || statusFilter === 'all') && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateCourierSheet}
                disabled={pendingWorkflowAction !== '' || isBulkUpdating}
                className="h-7.5 px-2.5 text-xs font-medium gap-1.5 rounded-lg shadow-xs cursor-pointer"
              >
                {pendingWorkflowAction === 'courier' ? <Spinner data-icon="inline-start" className="size-3" /> : <Download className="size-3.5" />}
                Courier Sheet
              </Button>
            )}

            {(statusFilter === 'Packed' || statusFilter === DRAFT_TAB_ID) && (
              <Button
                type="button"
                size="sm"
                onClick={() => setNocBookingOpen(true)}
                disabled={isBookingNoc}
                className="h-7.5 px-2.5 text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold shadow-xs"
              >
                <Truck className="size-3.5 mr-1" />
                Send to NOC
              </Button>
            )}

            {(statusFilter === 'Packed' || statusFilter === DRAFT_TAB_ID || statusFilter === 'Shipped') && (
              <Button
                type="button"
                size="sm"
                onClick={handlePrintSelectedNocSlips}
                className="h-7.5 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
              >
                <Printer className="size-3.5 mr-1" />
                Print Slips
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={() => handleSyncNocStatus(selectedOrders)}
              disabled={isBulkSyncingNoc}
              className="h-7.5 px-2.5 text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1 cursor-pointer"
            >
              {isBulkSyncingNoc ? <Spinner data-icon="inline-start" /> : <RotateCcw className="size-3.5" />}
              Sync NOC Status
            </Button>

            {/* Delete / Move to Trash Button */}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteConfirmOpen(true)}
              disabled={isBulkDeleting || isBulkUpdating || pendingWorkflowAction !== ''}
              className="h-7.5 px-2.5 text-xs gap-1.5 rounded-lg shadow-xs cursor-pointer"
            >
              {isBulkDeleting ? <Spinner data-icon="inline-start" className="size-3" /> : <Trash2 className="size-3.5" />}
              Move to Trash
            </Button>
          </div>
        </div>
      ) : (
        /* Standard Filters & Actions Bar (Clean, Responsive Grid) */
        <div className="admin-filter-shell flex flex-col gap-2.5 w-full md:flex-row md:items-center md:justify-between">
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
            {/* Date Filters Row (Left side) */}
            <div className="flex items-center gap-2">
              <Select value={getQuickDateValue()} onValueChange={handleQuickDateFilter}>
                <SelectTrigger className="h-8.5 flex-1 md:w-[130px] rounded-lg border-border bg-background text-xs shadow-none">
                  <SelectValue placeholder="Date Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="lastWeek">Last Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="year2026">Year 2026</SelectItem>
                  <SelectItem value="year2025">Year 2025</SelectItem>
                  <SelectItem value="custom" className="hidden">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              <Popover open={Boolean(isDatePopoverOpen)} onOpenChange={setIsDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" type="button" className="size-8.5 shrink-0 rounded-lg border-border bg-background shadow-none relative cursor-pointer" title="Custom Date Range">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    {(startDate || endDate) && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-4 rounded-xl shadow-lg border-border">
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-semibold text-foreground">Filter by Custom Date Range</p>
                    <div className="flex items-center gap-2">
                      <Field>
                        <FieldLabel htmlFor="orders-start-date" className="sr-only">From date</FieldLabel>
                        <Input
                          id="orders-start-date"
                          type="date"
                          className="h-8 min-w-[120px] text-xs"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </Field>
                      <span className="text-xs text-muted-foreground">to</span>
                      <Field>
                        <FieldLabel htmlFor="orders-end-date" className="sr-only">To date</FieldLabel>
                        <Input
                          id="orders-end-date"
                          type="date"
                          className="h-8 min-w-[120px] text-xs"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </Field>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {(startDate || endDate) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setStartDate('');
                            setEndDate('');
                            setIsDatePopoverOpen(false);
                            navigate({
                              search: searchQuery.trim() || null,
                              startDate: null,
                              endDate: null,
                              allDates: '1',
                              page: null,
                            });
                          }}
                          className="h-7 px-2.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                        >
                          Reset
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setIsDatePopoverOpen(false);
                          navigate({
                            search: searchQuery.trim() || null,
                            startDate: startDate || null,
                            endDate: endDate || null,
                            page: null,
                          });
                        }}
                        className="h-7 px-4 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 rounded-md cursor-pointer"
                      >
                        Apply Date
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Search Input (Right side) */}
            <Field className="w-full md:max-w-xs lg:max-w-sm">
              <FieldLabel className="sr-only">Search orders</FieldLabel>
              <div className="relative flex items-center w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" data-icon />
                <Input
                  placeholder="Search order ID, customer, phone..."
                  className="h-8.5 rounded-lg border-border bg-background pl-9 pr-[68px] text-xs shadow-none w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                  {initialSearchQuery && searchQuery === initialSearchQuery ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        navigate({ search: null, page: null });
                      }}
                      className="h-6.5 px-2.5 text-[11px] font-bold bg-red-600 text-white hover:bg-red-700 rounded-md gap-1 shadow-xs cursor-pointer"
                      title="Clear search"
                    >
                      <X className="size-3" />
                      Clear
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!canApplyFilters}
                      className="h-6.5 px-2.5 text-[10px] font-semibold bg-foreground text-background hover:bg-foreground/90 rounded-md cursor-pointer"
                    >
                      Search
                    </Button>
                  )}
                </div>
              </div>
            </Field>
          </form>

          {/* Action Buttons Row (Sync NOC, Reports, etc.) */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50 md:border-0 md:pt-0 shrink-0">
            {(statusFilter === 'Shipped' || statusFilter === 'all' || statusFilter === 'In Transit' || statusFilter === 'Out for Delivery' || statusFilter === 'Out For Delivery' || statusFilter === 'Returned') ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const targetOrders = displayOrders
                      .filter((o) => o.nocParcelNo || o.trackingNumber || o.nocThirdPartyNo)
                      .map((o) => o._id);
                    if (targetOrders.length === 0) {
                      toast.error('No orders with tracking numbers found to sync.');
                      return;
                    }
                    handleSyncNocStatus(targetOrders);
                  }}
                  disabled={isBulkSyncingNoc}
                  className="h-8 px-3 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer text-foreground hover:bg-muted"
                >
                  {isBulkSyncingNoc ? <Spinner data-icon="inline-start" className="size-3" /> : <RotateCcw className="size-3.5 text-muted-foreground" />}
                  <span>{isBulkSyncingNoc ? 'Syncing...' : 'Sync NOC Status'}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSyncSheetModalOpen(true)}
                  className="h-8 px-3 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer text-foreground hover:bg-muted"
                  title="Upload NOC Excel file to auto-sync 3rd Party CNs and Courier Partners"
                >
                  <Upload className="size-3.5 text-muted-foreground" />
                  <span>Sync NOC Sheet</span>
                </Button>
              </>
            ) : null}

            {statusFilter === 'all' ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-medium rounded-lg flex items-center gap-1.5 text-foreground hover:bg-muted cursor-pointer">
                    <Zap className="size-3.5 text-muted-foreground" />
                    <span>Reports</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52 p-1.5 rounded-xl shadow-lg border-border" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Courier Exports</DropdownMenuLabel>
                    <DropdownMenuItem
                      className="gap-2 text-xs font-medium cursor-pointer"
                      onClick={() => handleGenerateCourierSheet()}
                    >
                      <Download className="size-3.5" />
                      Courier Sheet (.xlsx)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuLabel className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Monthly Sales</DropdownMenuLabel>
                    <DropdownMenuItem
                      className="gap-2 text-xs font-medium cursor-pointer"
                      onClick={() => handleExportMonthlySales('excel')}
                    >
                      <Download className="size-3.5" />
                      Excel (.xlsx)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-xs font-medium text-destructive focus:text-destructive cursor-pointer"
                      onClick={() => handleExportMonthlySales('pdf')}
                    >
                      <Download className="size-3.5" />
                      PDF (.pdf)
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      )}


      
    </>
  );
}
