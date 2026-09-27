const fs = require('fs');
const file = 'src/app/admin/orders/AdminOrdersClient.jsx';
let content = fs.readFileSync(file, 'utf8');

const hookImport = "import { useOrderManagement } from '@/hooks/useOrderManagement';\n";
content = content.replace("import { Badge } from '@/components/ui/badge';", hookImport + "import { Badge } from '@/components/ui/badge';");

const targetState = `  const [isPending, startNavTransition] = useTransition();
  const [orders, setOrders] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [paymentFilter, setPaymentFilter] = useState(initialPaymentFilter || 'all');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);`;

const hookUsage = `  const {
    orders, setOrders, selectedOrders, setSelectedOrders,
    searchQuery, setSearchQuery, statusFilter, setStatusFilter,
    paymentFilter, setPaymentFilter, startDate, setStartDate,
    endDate, setEndDate, isPending, handleSearch, handleFilterChange,
    handlePaymentFilterChange, handleDateFilterChange, handleSelectAll,
    handleSelectOrder, getSelectedOrdersData, validateSelectedOrders, updateURL
  } = useOrderManagement({
    initialOrders, initialSearchQuery, initialStatusFilter,
    initialPaymentFilter, initialStartDate, initialEndDate,
    DEFAULT_ADMIN_FILTER_STATUS, DRAFT_TAB_ID
  });`;

content = content.replace(targetState, hookUsage);

// Remove the old updateURL function
const updateUrlRegex = /function buildHref[\s\S]*?const updateURL = useCallback\([\s\S]*?router]\n\s+\);/;
content = content.replace(updateUrlRegex, '');

fs.writeFileSync(file, content);
console.log('Successfully injected useOrderManagement hook.');
