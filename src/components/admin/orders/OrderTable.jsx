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

// Pure utility functions (co-located here to avoid prop-drilling)
const getCodAmount = (order) => {
  if (order?.manualCodAmount != null && order.manualCodAmount !== '') {
    return Number(order.manualCodAmount);
  }
  return Number(order?.totalAmount || 0);
};

const formatPrice = (price) => `PKR ${Number(price || 0).toLocaleString('en-PK')}`;

export function OrderTable(props) {
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
    setQuickStatus, setQuickTracking, setIsQuickUpdating, handleConfirmBulkDelete, OrderQuickViewDialog, OrdersMobilePendingSkeleton, handleOpenEditModal, handleDeleteOrder, setNocTrackingOrder, normalizeOrderStatus, initialSearchQuery
  } = p;

  return (
    <>
      {/* ── Desktop Table ── */}
      {isPending ? <OrdersTablePendingSkeleton showNocColumns={showNocColumns} enableSecondaryNoc={enableSecondaryNoc} /> : (
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="w-8 px-2 py-2.5 text-center">
                      <Checkbox 
                        checked={isAllPaginatedSelected} 
                        onCheckedChange={handleSelectAll} 
                        aria-label="Select all on page"
                        className="size-4"
                      />
                    </th>
                    <th className="px-2.5 py-2.5 whitespace-nowrap">Order</th>
                    <th className="px-2.5 py-2.5 whitespace-nowrap">Customer</th>
                    <th className="px-2 py-2.5 whitespace-nowrap">City</th>
                    <th className="px-2.5 py-2.5 whitespace-nowrap">Date</th>
                    <th className="px-2 py-2.5 whitespace-nowrap">Payment</th>
                    {showNocColumns && <th className="px-2.5 py-2.5 whitespace-nowrap">Tracking / Courier</th>}
                    {showNocColumns && (
                      <th className="px-2.5 py-2.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span>NOC Status</span>
                          {isBulkSyncingNoc && (
                            <Spinner className="size-3 text-primary animate-spin" title="Updating statuses in background..." />
                          )}
                        </div>
                      </th>
                    )}
                    <th className="px-2.5 py-2.5 text-right whitespace-nowrap">Amount</th>
                    <th className="px-2.5 py-2.5 text-center whitespace-nowrap">Status</th>
                    <th className="w-16 px-2 py-2.5 text-right whitespace-nowrap" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-[13px]">
                  {displayOrders.length === 0 ? (
                    <tr>
                      <td colSpan={showNocColumns ? (enableSecondaryNoc ? 14 : 13) : 9} className="px-4 py-14 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Image
                            src="/undraw_relaxing-outdoors_s653.svg"
                            alt="No orders found"
                            width={160}
                            height={120}
                            className="mb-3 h-auto w-36 object-contain opacity-90"
                          />
                          <p className="text-base font-semibold text-foreground">No orders found</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">Try adjusting your search or filters.</p>
                          {hasActiveFilters && (
                            <Button variant="outline" size="sm" onClick={clearFilters} className="admin-cta-button mt-3 rounded-md">
                              Clear all filters
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayOrders.map((order) => {
                      if (!order) return null;
                      const has3rdParty = order.nocThirdPartyNo && String(order.nocThirdPartyNo).trim() !== '' && String(order.nocThirdPartyNo).trim().toUpperCase() !== 'N/A' && String(order.nocThirdPartyNo).trim().toUpperCase() !== 'NA';
                      const displayTracking = has3rdParty ? String(order.nocThirdPartyNo).trim() : (order.nocParcelNo || order.trackingNumber || '');
                      const rawCourier = order.courierName || (order.trackingNumber ? 'NOC' : '—');
                      const courierToDisplay = rawCourier;
                      const statusTimeDisplay = (() => {
                        if (order.nocStatusTime && String(order.nocStatusTime).trim() !== '') {
                          return String(order.nocStatusTime).trim();
                        }
                        if (order.courierBookingDate) {
                          return formatFullDateTime(order.courierBookingDate);
                        }
                        return '—';
                      })();

                      return (
                        <tr key={order._id} className="transition-colors hover:bg-muted/30">
                          <td className="w-8 px-2 py-2 text-center">
                            <Checkbox 
                              checked={selectedOrders.includes(order._id)} 
                              onCheckedChange={(checked) => handleSelectOne(checked, order._id)} 
                              aria-label={`Select order ${order.orderId}`}
                              className="size-4"
                            />
                          </td>
                          <td className="px-2.5 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              {(() => {
                                const origin = getOrderOriginInfo(order);
                                return origin.isAdmin ? (
                                  <UserCog className="size-3.5 text-foreground shrink-0 select-none" title={origin.tooltip} />
                                ) : (
                                  <Globe className="size-3.5 text-foreground shrink-0 select-none" title={origin.tooltip} />
                                );
                              })()}
                              <Link href={`/admin/orders/${order._id}`} className="text-[13px] font-bold tabular-nums text-foreground hover:underline whitespace-nowrap">
                                {order.orderId}
                              </Link>
                              {isNewOrder(order.createdAt) && (
                                <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[8.5px] font-bold uppercase tracking-wider shrink-0">
                                  NEW
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2.5 py-2 whitespace-nowrap">
                            <div className="flex flex-col whitespace-nowrap">
                              <span className="text-[13px] font-semibold text-foreground max-w-[130px] truncate" title={order.customerName}>{order.customerName}</span>
                              <span className="text-[11.5px] font-medium text-muted-foreground">{order.customerPhone}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <span className="text-[12.5px] font-semibold text-foreground whitespace-nowrap">
                              {order.customerCity || '—'}
                            </span>
                          </td>
                          <td className="px-2.5 py-2 whitespace-nowrap">
                            <div className="flex flex-col whitespace-nowrap" title={formatFullDateTime(order.createdAt)}>
                              <span className="text-[12.5px] font-semibold text-foreground whitespace-nowrap">
                                {formatSmartTimeAgo(order.createdAt)}
                              </span>
                              <span className="text-[10.5px] font-medium text-muted-foreground whitespace-nowrap">
                                {formatDate(order.createdAt)} {formatTime(order.createdAt)}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-[12px] font-semibold text-foreground whitespace-nowrap">{order.paymentStatus || 'COD'}</td>

                          {/* 1. Combined Tracking & Courier Column (Only on Post-Pack tabs) */}
                          {showNocColumns && (
                            <td className="px-2.5 py-2 whitespace-nowrap">
                              {displayTracking ? (
                                <div className="flex flex-col whitespace-nowrap">
                                  <span className="font-mono text-[12.5px] font-bold text-foreground whitespace-nowrap" title={has3rdParty ? `3rd Party No: ${displayTracking}` : `Parcel No: ${displayTracking}`}>
                                    {displayTracking}
                                  </span>
                                  <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                                    {courierToDisplay}{enableSecondaryNoc && order.nocAccountId === 'portal_2' ? ' • Aam Samaan' : ''}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[12px] text-muted-foreground">—</span>
                              )}
                            </td>
                          )}

                          {/* 2. Combined NOC Status & Time Column (Only on Post-Pack tabs) */}
                          {showNocColumns && (
                            <td className="px-2.5 py-2 whitespace-nowrap">
                              {(order.trackingNumber || has3rdParty) ? (
                                <div className="flex flex-col whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => setNocTrackingOrder(order)}
                                    title={`Click to view tracking timeline${order.nocRemarks ? ` (${order.nocRemarks})` : ''}`}
                                    className="text-[12px] font-semibold text-foreground hover:text-primary hover:underline cursor-pointer text-left whitespace-nowrap"
                                  >
                                    {(() => {
                                      const raw = order.nocStatus || '';
                                      if (raw && !raw.match(/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/)) {
                                        return raw;
                                      }
                                      return order.status === 'Delivered' ? 'Delivered' : (order.status === 'Out For Delivery' ? 'INTRANSIT' : 'Booked');
                                    })()}
                                  </button>
                                  {(() => {
                                    const effectiveTime = getEffectiveNocStatusTime(order);
                                    if (!effectiveTime) return null;
                                    return (
                                      <span className="text-[10.5px] font-medium text-muted-foreground whitespace-nowrap">
                                        {formatSmartTimeAgo(effectiveTime)}
                                      </span>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <span className="text-[12px] text-muted-foreground">—</span>
                              )}
                            </td>
                          )}

                          {/* 3. Combined Amount Column */}
                          <td className="px-2.5 py-2 text-right whitespace-nowrap">
                            <div className="flex flex-col items-end whitespace-nowrap">
                              <span className="text-[13px] font-bold tabular-nums text-foreground whitespace-nowrap">
                                {formatPrice(getCodAmount(order))}
                              </span>
                              {order.manualCodAmount ? (
                                <span className="text-[10px] tabular-nums font-medium text-muted-foreground whitespace-nowrap">
                                  Tot: {formatPrice(order.totalAmount)}
                                </span>
                              ) : null}
                            </div>
                          </td>

                          {/* 4. Store Status Badge */}
                          <td className="px-2.5 py-2 text-center whitespace-nowrap">
                            <Badge
                              variant={order.isDraft ? 'outline' : (statusVariant[order.status] || 'secondary')}
                              className={cn('text-[11px] px-2 py-0.5 whitespace-nowrap font-bold', order.isDraft ? 'border-slate-300 bg-slate-50 text-slate-700' : getStatusBadgeClass(order.status))}
                            >
                              {getOrderDisplayStatus(order)}
                            </Badge>
                          </td>
                          <td className="w-16 px-2 py-2 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                              <OrderQuickViewDialog
                                order={order}
                                triggerLabel="View"
                                triggerSize="sm"
                                triggerClassName="h-6.5 px-2 text-[11.5px] rounded-md border border-border shadow-xs font-semibold"
                              />
                              {(() => {
                                const isShippedPhase = ['Shipped', 'Out For Delivery', 'Delivered', 'Returned', 'Cancelled'].includes(normalizeOrderStatus(order.status));
                                return (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="size-6.5 text-muted-foreground cursor-pointer">
                                        <MoreHorizontal className="size-3.5" />
                                        <span className="sr-only">Order actions</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-38">
                                      <DropdownMenuGroup>
                                        {!isShippedPhase && (
                                          <DropdownMenuItem
                                            onClick={() => handleOpenEditModal(order)}
                                            className="cursor-pointer text-[12px]"
                                          >
                                            <Edit className="size-3.5 mr-2" />
                                            Edit Order
                                          </DropdownMenuItem>
                                        )}
                                        {(order.trackingNumber || order.nocParcelNo || order.nocThirdPartyNo) && (
                                          <DropdownMenuItem
                                            onClick={() => setNocTrackingOrder(order)}
                                            className="cursor-pointer text-[12px]"
                                          >
                                            <Truck className="size-3.5 mr-2 text-primary" />
                                            Track NOC
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuGroup>
                                      {(!isShippedPhase || order.trackingNumber || order.nocParcelNo || order.nocThirdPartyNo) && <DropdownMenuSeparator />}
                                      <DropdownMenuItem
                                        variant="destructive"
                                        onClick={() => handleDeleteOrder(order)}
                                        className="cursor-pointer text-destructive focus:text-destructive text-[12px]"
                                      >
                                        <Trash2 className="size-3.5 mr-2" />
                                        Move to Trash
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                );
                              })()}
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
          <div className="border-y border-border bg-card px-3 py-8 text-center flex flex-col items-center justify-center">
            <Image
              src="/undraw_relaxing-outdoors_s653.svg"
              alt="No orders found"
              width={140}
              height={105}
              className="mb-3 h-auto w-32 object-contain opacity-90"
            />
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
                      <div className="flex items-center gap-1.5 min-w-0 mt-[1px] flex-wrap">
                        {(() => {
                          const origin = getOrderOriginInfo(order);
                          return origin.isAdmin ? (
                            <UserCog className="size-3 text-foreground shrink-0 select-none" title={origin.tooltip} />
                          ) : (
                            <Globe className="size-3 text-foreground shrink-0 select-none" title={origin.tooltip} />
                          );
                        })()}
                        <p className="text-[13px] font-bold tracking-tight text-foreground truncate leading-none">{order.orderId}</p>
                        {isNewOrder(order.createdAt) && (
                          <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 leading-none">
                            NEW
                          </span>
                        )}
                      </div>
                      
                      {(() => {
                        const isShippedPhase = ['Shipped', 'Out For Delivery', 'Delivered', 'Returned', 'Cancelled'].includes(normalizeOrderStatus(order.status));
                        return (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5 rounded text-muted-foreground -mr-1 -mt-1 shrink-0 cursor-pointer">
                                <MoreHorizontal className="size-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-38">
                              <DropdownMenuGroup>
                                {!isShippedPhase && (
                                  <DropdownMenuItem
                                    onClick={() => handleOpenEditModal(order)}
                                    className="cursor-pointer text-[12px]"
                                  >
                                    <Edit className="size-3.5 mr-2" />
                                    Edit Order
                                  </DropdownMenuItem>
                                )}
                                {(order.trackingNumber || order.nocParcelNo || order.nocThirdPartyNo) && (
                                  <DropdownMenuItem
                                    onClick={() => setNocTrackingOrder(order)}
                                    className="cursor-pointer text-[12px]"
                                  >
                                    <Truck className="size-3.5 mr-2 text-primary" />
                                    Track NOC
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuGroup>
                              {(!isShippedPhase || order.trackingNumber || order.nocParcelNo || order.nocThirdPartyNo) && <DropdownMenuSeparator />}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive cursor-pointer text-[12px]"
                                onClick={() => handleDeleteOrder(order)}
                              >
                                <Trash2 className="size-3.5 mr-2" />
                                Move to Trash
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      })()}
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] text-muted-foreground truncate leading-tight">
                        <span className="font-semibold text-foreground">{order.customerName}</span>
                        {order.customerCity ? <span className="text-[12px] font-medium text-foreground/80"> • {order.customerCity}</span> : ''}
                      </p>
                      <Badge
                        variant={order.isDraft ? 'outline' : (statusVariant[order.status] || 'secondary')}
                        className={cn('text-[11px] px-2 py-0.5 font-semibold', order.isDraft ? 'border-slate-300 bg-slate-50 text-slate-700' : getStatusBadgeClass(order.status))}
                      >
                        {getOrderDisplayStatus(order)}
                      </Badge>
                    </div>

                    {(() => {
                      const isShippedPhase = ['Shipped', 'Out For Delivery', 'Delivered', 'Returned'].includes(order.status) || showNocColumns;
                      const has3rdParty = order.nocThirdPartyNo && String(order.nocThirdPartyNo).trim() !== '' && String(order.nocThirdPartyNo).trim().toUpperCase() !== 'N/A' && String(order.nocThirdPartyNo).trim().toUpperCase() !== 'NA';
                      const displayTracking = has3rdParty ? String(order.nocThirdPartyNo).trim() : (order.nocParcelNo || order.trackingNumber);
                      const courierToDisplay = order.courierName || (order.trackingNumber ? 'NOC' : '—');

                      if (!isShippedPhase || !displayTracking) return null;

                      const effectiveTime = getEffectiveNocStatusTime(order);
                      const statusTimeAgo = effectiveTime ? formatSmartTimeAgo(effectiveTime) : '';

                      return (
                        <div className="flex items-center justify-between gap-2 py-1.5 border-t border-border/40 text-[12px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono text-[12px] font-bold text-foreground truncate" title={has3rdParty ? `3rd Party No: ${displayTracking}` : `Parcel No: ${displayTracking}`}>
                              {displayTracking}
                            </span>
                            <span className="text-[11px] font-semibold text-muted-foreground truncate">({courierToDisplay})</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setNocTrackingOrder(order)}
                              className="text-[12px] font-semibold text-foreground hover:underline cursor-pointer"
                            >
                              {(() => {
                                const raw = order.nocStatus || '';
                                if (raw && !raw.match(/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/)) {
                                  return raw;
                                }
                                return order.status === 'Delivered' ? 'Delivered' : (order.status === 'Out For Delivery' ? 'INTRANSIT' : 'Booked');
                              })()}
                            </button>
                            {statusTimeAgo && (
                              <span className="text-[10.5px] text-muted-foreground font-normal">
                                • {statusTimeAgo}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Mobile Amounts Row: COD & Total */}
                    <div className="flex items-center justify-between gap-2 py-1.5 border-t border-border/40 text-[12.5px]">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          COD: <strong className="text-foreground font-bold">{formatPrice(getCodAmount(order))}</strong>
                        </span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="text-muted-foreground">
                          Total: <span className="font-medium text-foreground">{formatPrice(order.totalAmount)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Mobile Date & View Action */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="flex flex-col" title={formatFullDateTime(order.createdAt)}>
                        <span className="text-[12px] font-semibold text-foreground">
                          {formatSmartTimeAgo(order.createdAt)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(order.createdAt)} {formatTime(order.createdAt)}
                        </span>
                      </div>
                      
                      <OrderQuickViewDialog
                        order={order}
                        triggerLabel="View"
                        triggerSize="sm"
                        triggerClassName="h-6.5 px-3 text-[11px] rounded-md border border-border shadow-xs font-medium shrink-0"
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

      
    </>
  );
}
