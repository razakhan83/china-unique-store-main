'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import InvoiceFormClient from './InvoiceFormClient';
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  ExternalLink,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  ShoppingCart,
  Send,
  RotateCcw,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  deleteInvoiceAction,
  restoreInvoiceAction,
  bulkMarkInvoicesSentAction,
  bulkDeleteInvoicesAction,
  bulkRestoreInvoicesAction,
  emptyInvoiceTrashAction,
} from '@/app/actions/invoice.actions';

export default function AdminInvoicesClient({ initialData }) {
  const [invoices, setInvoices] = useState(initialData?.invoices || []);
  const [stats, setStats] = useState(initialData?.stats || { totalUnpaid: 0, draftCount: 0, sentCount: 0, trashCount: 0 });
  const [totalCount, setTotalCount] = useState(initialData?.totalCount || 0);
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 1);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPanel, setShowNewPanel] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        status: statusFilter,
        search: search.trim(),
      });
      const res = await fetch(`/api/admin/invoices?${params.toString()}`);
      const data = await res.json();
      if (data?.invoices) {
        setInvoices(data.invoices);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
      setSelectedIds([]);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const toggleSelectAll = () => {
    if (selectedIds.length === invoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(invoices.map((inv) => inv._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkMarkSent = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsBulkProcessing(true);
      const res = await bulkMarkInvoicesSentAction(selectedIds);
      if (res.success) {
        toast.success(`${res.count} invoices marked as Sent`);
        fetchInvoices();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to mark as sent');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to move ${selectedIds.length} invoices (and linked orders) to trash?`)) return;
    try {
      setIsBulkProcessing(true);
      const res = await bulkDeleteInvoicesAction(selectedIds);
      if (res.success) {
        toast.success(`${res.count} invoices moved to trash`);
        fetchInvoices();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to move to trash');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsBulkProcessing(true);
      const res = await bulkRestoreInvoicesAction(selectedIds);
      if (res.success) {
        toast.success(`${res.count} invoices restored`);
        fetchInvoices();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to restore invoices');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleDelete = async (id, num) => {
    if (!confirm(`Are you sure you want to move invoice ${num} to trash?`)) return;
    try {
      await deleteInvoiceAction(id);
      toast.success(`Invoice ${num} moved to trash`);
      fetchInvoices();
    } catch (err) {
      toast.error(err.message || 'Failed to delete invoice');
    }
  };

  const handleRestore = async (id, num) => {
    try {
      await restoreInvoiceAction(id);
      toast.success(`Invoice ${num} restored`);
      fetchInvoices();
    } catch (err) {
      toast.error(err.message || 'Failed to restore invoice');
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('Are you sure you want to permanently delete all invoices in trash? This cannot be undone.')) return;
    try {
      setIsBulkProcessing(true);
      const res = await emptyInvoiceTrashAction();
      toast.success(`${res.deletedCount} invoices deleted permanently`);
      fetchInvoices();
    } catch (err) {
      toast.error(err.message || 'Failed to empty trash');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
            DRAFT
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            SENT
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            PARTIALLY PAID
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            PAID
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dStr) => {
    if (!dStr) return '-';
    try {
      return new Date(dStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  const isTrashView = statusFilter === 'TRASH';

  const filterTabs = [
    { key: 'ALL', label: 'All Invoices' },
    { key: 'DRAFT', label: 'Draft', count: stats.draftCount },
    { key: 'SENT', label: 'Sent', count: stats.sentCount },
    { key: 'PARTIALLY_PAID', label: 'Partially Paid' },
    { key: 'PAID', label: 'Paid' },
    { key: 'TRASH', label: 'Trash', count: stats.trashCount },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto admin-page-stack">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-800 border border-zinc-200">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                All Invoices
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Manage store invoices, payments, and 2-way synced customer orders.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/admin/orders">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs text-zinc-700 hover:bg-zinc-100 border-zinc-200 shadow-none"
            >
              <ShoppingCart className="w-4 h-4 text-zinc-500" />
              Orders Management
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => setShowNewPanel(true)}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors h-9"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* ── Stats Overview Cards (Flat & Clean) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Unpaid Balance */}
        <div className="p-4 rounded-xl bg-white border border-zinc-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Unpaid Balance
            </span>
            <div className="text-2xl font-bold text-zinc-900 tabular-nums">
              PKR {Number(stats.totalUnpaid || 0).toLocaleString('en-PK')}
            </div>
            <p className="text-[10px] text-zinc-400">Pending receivables</p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Draft Invoices */}
        <div className="p-4 rounded-xl bg-white border border-zinc-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Draft Invoices
            </span>
            <div className="text-2xl font-bold text-zinc-900 tabular-nums">
              {stats.draftCount || 0}
            </div>
            <p className="text-[10px] text-zinc-400">Unfinalized drafts</p>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-50 text-zinc-600 border border-zinc-200 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Sent Invoices */}
        <div className="p-4 rounded-xl bg-white border border-zinc-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Sent Invoices
            </span>
            <div className="text-2xl font-bold text-blue-600 tabular-nums">
              {stats.sentCount || 0}
            </div>
            <p className="text-[10px] text-zinc-400">Dispatched & active</p>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
            <Send className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Total Invoices */}
        <div className="p-4 rounded-xl bg-white border border-zinc-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Total Invoices
            </span>
            <div className="text-2xl font-bold text-zinc-900 tabular-nums">
              {totalCount || 0}
            </div>
            <p className="text-[10px] text-zinc-400">Registered records</p>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-50 text-zinc-600 border border-zinc-200 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Filters & Search Control Bar ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-zinc-200">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
            <Input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search Invoice#, Customer, Phone..."
              className="pl-8 h-9 text-xs rounded-lg border-zinc-200 shadow-none focus-visible:ring-1 focus-visible:ring-emerald-500"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchInvoices}
            className="h-9 w-9 rounded-lg border-zinc-200 hover:bg-zinc-50 shadow-none"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-600 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── Bulk Actions Floating Toolbar (When Items Selected) ── */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-zinc-900 text-white rounded-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2 py-0.5 bg-white/20 rounded-md">{selectedIds.length} Selected</span>
          </div>

          <div className="flex items-center gap-2">
            {!isTrashView ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isBulkProcessing}
                  onClick={handleBulkMarkSent}
                  className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <Send className="w-3.5 h-3.5 mr-1" /> Mark as Sent
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isBulkProcessing}
                  onClick={handleBulkDelete}
                  className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Move to Trash
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isBulkProcessing}
                  onClick={handleBulkRestore}
                  className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore Selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isBulkProcessing}
                  onClick={handleEmptyTrash}
                  className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Empty Trash
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="h-8 text-xs text-zinc-300 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ── Main Invoices Table ── */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={invoices.length > 0 && selectedIds.length === invoices.length}
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Linked Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {isLoading ? (
                // ── Professional Skeleton Loading Rows ──
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="px-3 py-3.5 text-center">
                      <div className="h-4 w-4 bg-zinc-200 rounded mx-auto"></div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 bg-zinc-200 rounded w-24"></div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 bg-zinc-100 rounded w-20"></div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 bg-zinc-200 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-zinc-100 rounded w-20"></div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 bg-zinc-100 rounded w-24"></div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-5 bg-zinc-100 rounded-full w-16"></div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="h-4 bg-zinc-200 rounded w-16 ml-auto"></div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="h-4 bg-zinc-200 rounded w-16 ml-auto"></div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="h-7 bg-zinc-100 rounded-lg w-14 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-3 border border-zinc-200">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-zinc-800 text-sm">
                      {isTrashView ? 'Trash is empty' : 'No invoices found'}
                    </p>
                    <p className="text-zinc-400 text-xs mt-1">
                      {isTrashView
                        ? 'Deleted invoices will appear here.'
                        : 'Try changing your filters or create a new invoice.'}
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isSelected = selectedIds.includes(inv._id);
                  return (
                    <tr
                      key={inv._id}
                      className={`transition-colors ${
                        isSelected ? 'bg-emerald-50/50' : 'hover:bg-zinc-50/60'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(inv._id)}
                          className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>

                      {/* Invoice # */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Link
                          href={`/admin/invoices/${inv._id}`}
                          className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          {inv.invoiceNumber}
                        </Link>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-zinc-500 font-medium">
                        {formatDate(inv.invoiceDate)}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-zinc-900">{inv.customerName || 'Anonymous'}</div>
                        {inv.customerPhone && (
                          <div className="text-[11px] text-zinc-400 mt-0.5">{inv.customerPhone}</div>
                        )}
                      </td>

                      {/* Linked Order */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {inv.orderId ? (
                          <Link
                            href={`/admin/orders?search=${inv.orderId}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium transition-colors border border-zinc-200/80"
                            title="View Order"
                          >
                            <span>{inv.orderId}</span>
                            <ExternalLink className="w-3 h-3 text-zinc-400" />
                          </Link>
                        ) : (
                          <span className="text-zinc-300 font-medium">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(inv.status)}</td>

                      {/* Amount */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right font-semibold text-zinc-900 tabular-nums">
                        PKR {Number(inv.totalAmount || 0).toLocaleString('en-PK')}
                      </td>

                      {/* Balance Due */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right tabular-nums">
                        {Number(inv.balanceDue || 0) === 0 && Number(inv.totalAmount || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                          </span>
                        ) : (
                          <span className="font-bold text-zinc-900">
                            PKR {Number(inv.balanceDue || 0).toLocaleString('en-PK')}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isTrashView ? (
                            <>
                              <Link href={`/admin/invoices/${inv._id}`}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 shadow-none"
                                  title="View Invoice"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(inv._id, inv.invoiceNumber)}
                                className="h-8 w-8 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-none"
                                title="Move to Trash"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRestore(inv._id, inv.invoiceNumber)}
                              className="h-8 px-2.5 text-xs text-emerald-700 hover:bg-emerald-50"
                              title="Restore Invoice"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ── */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 border-t border-zinc-200 text-xs text-zinc-500">
          <div>
            Showing <strong className="text-zinc-700">{invoices.length}</strong> of{' '}
            <strong className="text-zinc-700">{totalCount}</strong> invoices
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 rounded-lg border-zinc-200 text-xs shadow-none"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
            </Button>
            <span className="text-xs text-zinc-600 px-1 font-medium">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5 rounded-lg border-zinc-200 text-xs shadow-none"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Inline New Invoice Slide-over Panel ── */}
      {showNewPanel && (
        <InvoiceFormClient
          isPanelMode
          onPanelClose={() => setShowNewPanel(false)}
          onPanelSuccess={() => {
            setShowNewPanel(false);
            fetchInvoices();
          }}
        />
      )}
    </div>
  );
}
