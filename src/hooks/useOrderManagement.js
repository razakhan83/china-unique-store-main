import { useState, useCallback, useEffect, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { DEFAULT_ADMIN_FILTER_STATUS } from '@/lib/order-status';

function buildHref(pathname, searchParams, updates) {
  const params = new URLSearchParams(searchParams?.toString());
  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '' || (key === 'status' && value === DEFAULT_ADMIN_FILTER_STATUS) || (key === 'paymentFilter' && value === 'all')) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function useOrderManagement({
  initialOrders,
  initialSearchQuery,
  initialStatusFilter,
  initialPaymentFilter = 'all',
  initialStartDate,
  initialEndDate,
  DEFAULT_ADMIN_FILTER_STATUS,
  DRAFT_TAB_ID
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startNavTransition] = useTransition();

  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrders, setSelectedOrders] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [paymentFilter, setPaymentFilter] = useState(initialPaymentFilter);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  useEffect(() => {
    setOrders(initialOrders);
    setSelectedOrders([]);
  }, [initialOrders]);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
    setStatusFilter(initialStatusFilter);
    setPaymentFilter(initialPaymentFilter);
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
  }, [initialSearchQuery, initialStatusFilter, initialPaymentFilter, initialStartDate, initialEndDate]);

  const updateURL = useCallback(
    (updates) => {
      startNavTransition(() => {
        const url = buildHref(pathname, searchParams, updates);
        router.push(url);
      });
    },
    [pathname, searchParams, router]
  );

  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      updateURL({ search: query, page: 1 });
    },
    [updateURL]
  );

  const handleFilterChange = useCallback(
    (status) => {
      setStatusFilter(status);
      updateURL({ status, page: 1 });
      setSelectedOrders([]);
    },
    [updateURL]
  );

  const handlePaymentFilterChange = useCallback(
    (payment) => {
      setPaymentFilter(payment);
      updateURL({ paymentFilter: payment, page: 1 });
      setSelectedOrders([]);
    },
    [updateURL]
  );

  const handleDateFilterChange = useCallback(
    (start, end) => {
      setStartDate(start);
      setEndDate(end);
      updateURL({ startDate: start, endDate: end, page: 1 });
    },
    [updateURL]
  );

  const handleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        setSelectedOrders(orders.map((order) => order._id));
      } else {
        setSelectedOrders([]);
      }
    },
    [orders]
  );

  const handleSelectOrder = useCallback((orderId, checked) => {
    setSelectedOrders((prev) =>
      checked ? [...prev, orderId] : prev.filter((id) => id !== orderId)
    );
  }, []);

  const getSelectedOrdersData = useCallback(() => {
    const selectedSet = new Set(selectedOrders.map((id) => String(id)));
    return orders.filter(
      (order) => selectedSet.has(String(order._id)) || selectedSet.has(String(order.orderId))
    );
  }, [orders, selectedOrders]);

  const validateSelectedOrders = useCallback(
    (requiredStatus, actionName) => {
      const isDraftContext = statusFilter === DRAFT_TAB_ID;
      const records = getSelectedOrdersData();

      if (records.length === 0) {
        toast.error(\`Select at least one \${isDraftContext ? 'draft ' : ''}order to \${actionName.toLowerCase()}.\`);
        return null;
      }

      if (!isDraftContext) {
        const invalidOrders = records.filter(
          (o) => (o.status || '').toLowerCase() !== requiredStatus.toLowerCase()
        );
        if (invalidOrders.length > 0) {
          toast.error(
            \`All selected orders must be in "\${requiredStatus}" status to \${actionName.toLowerCase()}.\nFound \${invalidOrders.length} order(s) with a different status.\`
          );
          return null;
        }
      }

      return records;
    },
    [getSelectedOrdersData, statusFilter, DRAFT_TAB_ID]
  );

  return {
    orders,
    setOrders,
    selectedOrders,
    setSelectedOrders,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    paymentFilter,
    setPaymentFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isPending,
    handleSearch,
    handleFilterChange,
    handlePaymentFilterChange,
    handleDateFilterChange,
    handleSelectAll,
    handleSelectOrder,
    getSelectedOrdersData,
    validateSelectedOrders,
    updateURL
  };
}
