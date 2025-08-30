import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  CreditCard,
  Plus,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  List,
  X,
  Check,
  AlertCircle,
  Settings,
  Eye,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  Table,
  MoreVertical,
  Zap,
  Star,
} from "lucide-react";
import {
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  getPaymentMethods,
  getCurrencyPaymentMethods,
  updateCurrencyPaymentMethod,
  deleteCurrencyPaymentMethod,
  getPaymentMethodCurrencies,
  updatePaymentMethodCurrency,
  deletePaymentMethodCurrency,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import useAuth from "../hooks/useAuth";
import CurrencyFormModal from "../components/CurrencyFormModal";
import PaymentMethodFormModal from "../components/PaymentFormModal.tsx";

const CombinedCurrencyPaymentMethodPage = ({ showModal }) => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  // Enhanced state management
  const [activeTab, setActiveTab] = useState("currencies");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "code",
    direction: "asc",
  });
  const [expandedItem, setExpandedItem] = useState(null);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] =
    useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'grid'
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'inactive'

  // Fetch data with better error handling
  const {
    data: currencies = [],
    isLoading: isLoadingCurrencies,
    error: currenciesError,
    refetch: refetchCurrencies,
  } = useQuery({
    queryKey: ["currencies"],
    queryFn: getCurrencies,
    onError: (err) =>
      showModal(err.message || "Failed to load currencies.", "Error"),
  });

  const {
    data: paymentMethods = [],
    isLoading: isLoadingPaymentMethods,
    error: paymentMethodsError,
    refetch: refetchPaymentMethods,
  } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: getPaymentMethods,
    onError: (err) =>
      showModal(err.message || "Failed to load payment methods.", "Error"),
  });

  // Enhanced mutations with loading states
  const createCurrencyMutation = useMutation({
    mutationFn: createCurrency,
    onSuccess: () => {
      queryClient.invalidateQueries(["currencies"]);
      showModal("Currency created successfully!", "Success");
      setIsCurrencyModalOpen(false);
      setCurrentItem(null);
    },
    onError: (err) =>
      showModal(err.message || "Failed to create currency.", "Error"),
  });

  const updateCurrencyMutation = useMutation({
    mutationFn: ({ code, data }) => updateCurrency(code, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["currencies"]);
      showModal("Currency updated successfully!", "Success");
      setIsCurrencyModalOpen(false);
      setCurrentItem(null);
    },
    onError: (err) =>
      showModal(err.message || "Failed to update currency.", "Error"),
  });

  const deleteCurrencyMutation = useMutation({
    mutationFn: deleteCurrency,
    onSuccess: () => {
      queryClient.invalidateQueries(["currencies"]);
      showModal("Currency deleted successfully.", "Success");
    },
    onError: (err) =>
      showModal(err.message || "Failed to delete currency.", "Error"),
  });

  const createPaymentMethodMutation = useMutation({
    mutationFn: createPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries(["paymentMethods"]);
      showModal("Payment method created successfully!", "Success");
      setIsPaymentMethodModalOpen(false);
      setCurrentItem(null);
    },
    onError: (err) =>
      showModal(err.message || "Failed to create payment method.", "Error"),
  });

  const updatePaymentMethodMutation = useMutation({
    mutationFn: ({ id, data }) => updatePaymentMethod(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["paymentMethods"]);
      showModal("Payment method updated successfully!", "Success");
      setIsPaymentMethodModalOpen(false);
      setCurrentItem(null);
    },
    onError: (err) =>
      showModal(err.message || "Failed to update payment method.", "Error"),
  });

  const deletePaymentMethodMutation = useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries(["paymentMethods"]);
      showModal("Payment method deleted successfully.", "Success");
    },
    onError: (err) =>
      showModal(err.message || "Failed to delete payment method.", "Error"),
  });

  // Relationship mutations
  const updatePaymentMethodForCurrency = useMutation({
    mutationFn: ({ currencyCode, paymentMethodId, isActive }) =>
      updateCurrencyPaymentMethod(currencyCode, paymentMethodId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries(["currencies"]);
      queryClient.invalidateQueries(["paymentMethods"]);
    },
    onError: (err) =>
      showModal(
        err.message || "Failed to update payment method association.",
        "Error"
      ),
  });

  const updateCurrencyForPaymentMethod = useMutation({
    mutationFn: ({ paymentMethodId, currencyCode, isActive }) =>
      updatePaymentMethodCurrency(paymentMethodId, currencyCode, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries(["currencies"]);
      queryClient.invalidateQueries(["paymentMethods"]);
    },
    onError: (err) =>
      showModal(
        err.message || "Failed to update currency association.",
        "Error"
      ),
  });

  // Enhanced helper functions
  const handleEditItem = (item) => {
    setCurrentItem(item);
    if (activeTab === "currencies") {
      setIsCurrencyModalOpen(true);
    } else {
      setIsPaymentMethodModalOpen(true);
    }
  };

  const handleCreateItem = () => {
    setCurrentItem(null);
    if (activeTab === "currencies") {
      setIsCurrencyModalOpen(true);
    } else {
      setIsPaymentMethodModalOpen(true);
    }
  };

  const handleDeleteItem = (id) => {
    showModal(
      `Are you sure you want to delete this ${
        activeTab === "currencies" ? "currency" : "payment method"
      }? This action cannot be undone.`,
      "Confirm Deletion",
      true,
      () => {
        if (activeTab === "currencies") {
          deleteCurrencyMutation.mutate(id);
        } else {
          deletePaymentMethodMutation.mutate(id);
        }
      }
    );
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Enhanced filtering and sorting
  const filteredAndSortedItems = React.useMemo(() => {
    const items =
      activeTab === "currencies" ? [...currencies] : [...paymentMethods];

    // Apply status filter
    let filtered = items;
    if (statusFilter === "active") {
      filtered = items.filter((item) => item.isActive);
    } else if (statusFilter === "inactive") {
      filtered = items.filter((item) => !item.isActive);
    }

    // Apply search filter
    filtered = filtered.filter((item) => {
      const searchFields =
        activeTab === "currencies"
          ? [item.code, item.name, item.symbol || ""]
          : [item.name, item.description || ""];

      return searchFields.some((field) =>
        field.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
        }
        if (typeof bVal === "string") {
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [
    activeTab === "currencies" ? currencies : paymentMethods,
    sortConfig,
    searchTerm,
    statusFilter,
  ]);

  // Fixed permission checks - using more defensive approach
  const canManageCurrencies =
    currentUser?.permissions?.currencies?.includes("manage") ||
    currentUser?.role === "admin" ||
    currentUser?.role === "super_admin" ||
    false;

  const canViewCurrencies =
    currentUser?.permissions?.currencies?.includes("read") ||
    canManageCurrencies ||
    false;

  const canManagePaymentMethods =
    currentUser?.permissions?.paymentMethods?.includes("manage") ||
    currentUser?.permissions?.payment_methods?.includes("manage") || // alternative naming
    currentUser?.role === "admin" ||
    currentUser?.role === "super_admin" ||
    false;

  const canViewPaymentMethods =
    currentUser?.permissions?.paymentMethods?.includes("read") ||
    currentUser?.permissions?.payment_methods?.includes("read") || // alternative naming
    canManagePaymentMethods ||
    false;

  // Statistics calculations
  const stats = React.useMemo(() => {
    const currentData =
      activeTab === "currencies" ? currencies : paymentMethods;
    return {
      total: currentData.length,
      active: currentData.filter((item) => item.isActive).length,
      inactive: currentData.filter((item) => !item.isActive).length,
    };
  }, [activeTab, currencies, paymentMethods]);

  // Debug logging for permissions
  console.log("Current User:", currentUser);
  console.log("Can Manage Currencies:", canManageCurrencies);
  console.log("Can Manage Payment Methods:", canManagePaymentMethods);

  if (isLoadingCurrencies || isLoadingPaymentMethods) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  if (currenciesError || paymentMethodsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-red-200">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Data
          </h3>
          {currenciesError && (
            <p className="text-red-600 mb-2">{currenciesError.message}</p>
          )}
          {paymentMethodsError && (
            <p className="text-red-600">{paymentMethodsError.message}</p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
              {activeTab === "currencies" ? (
                <div className="p-2 bg-green-100 rounded-xl">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              ) : (
                <div className="p-2 bg-blue-100 rounded-xl">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
              )}
              {activeTab === "currencies"
                ? "Currency Management"
                : "Payment Methods"}
            </h1>
            <p className="text-gray-600">
              Manage your{" "}
              {activeTab === "currencies"
                ? "currencies and their relationships"
                : "payment methods and configurations"}
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-white p-1 rounded-xl shadow-md border border-gray-200">
            <button
              onClick={() => {
                setActiveTab("currencies");
                setExpandedItem(null); // Reset expanded item when switching tabs
                setSortConfig({ key: "code", direction: "asc" }); // Reset sort for currencies
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === "currencies"
                  ? "bg-green-600 text-white shadow-md"
                  : "text-gray-600 hover:text-green-600 hover:bg-green-50"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Currencies
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {currencies.length}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab("paymentMethods");
                setExpandedItem(null); // Reset expanded item when switching tabs
                setSortConfig({ key: "name", direction: "asc" }); // Reset sort for payment methods
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === "paymentMethods"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Payment Methods
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {paymentMethods.length}
              </span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  activeTab === "currencies" ? "bg-green-100" : "bg-blue-100"
                }`}
              >
                <List
                  className={`w-6 h-6 ${
                    activeTab === "currencies"
                      ? "text-green-600"
                      : "text-blue-600"
                  }`}
                />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.active}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Inactive</p>
                <p className="text-2xl font-bold text-gray-500">
                  {stats.inactive}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <X className="w-6 h-6 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Main Content */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Enhanced Search and Filter Bar */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-4 flex-grow">
              {/* Search */}
              <div className="relative flex-grow max-w-md">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-200 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "table"
                      ? "bg-white shadow-sm"
                      : "hover:bg-gray-300"
                  }`}
                  title="Table view"
                >
                  <Table className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm"
                      : "hover:bg-gray-300"
                  }`}
                  title="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>

              {/* Refresh Button */}
              <button
                onClick={
                  activeTab === "currencies"
                    ? refetchCurrencies
                    : refetchPaymentMethods
                }
                className="p-3 rounded-xl border border-gray-300 hover:bg-gray-100 transition duration-200 bg-white"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5 text-gray-500" />
              </button>

              {/* Create Button */}
              {(activeTab === "currencies"
                ? canManageCurrencies
                : canManagePaymentMethods) && (
                <button
                  onClick={handleCreateItem}
                  className={`px-6 py-3 text-white rounded-xl hover:opacity-90 transition duration-300 shadow-lg flex items-center gap-2 font-medium ${
                    activeTab === "currencies"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  Add {activeTab === "currencies" ? "Currency" : "Method"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {viewMode === "table" ? (
            <TableView
              items={filteredAndSortedItems}
              activeTab={activeTab}
              sortConfig={sortConfig}
              requestSort={requestSort}
              expandedItem={expandedItem}
              setExpandedItem={setExpandedItem}
              handleEditItem={handleEditItem}
              handleDeleteItem={handleDeleteItem}
              canManage={
                activeTab === "currencies"
                  ? canManageCurrencies
                  : canManagePaymentMethods
              }
              currencies={currencies}
              paymentMethods={paymentMethods}
              updatePaymentMethodForCurrency={updatePaymentMethodForCurrency}
              updateCurrencyForPaymentMethod={updateCurrencyForPaymentMethod}
              deleteCurrencyPaymentMethod={deleteCurrencyPaymentMethod}
              deletePaymentMethodCurrency={deletePaymentMethodCurrency}
              queryClient={queryClient}
              showModal={showModal}
            />
          ) : (
            <GridView
              items={filteredAndSortedItems}
              activeTab={activeTab}
              handleEditItem={handleEditItem}
              handleDeleteItem={handleDeleteItem}
              canManage={
                activeTab === "currencies"
                  ? canManageCurrencies
                  : canManagePaymentMethods
              }
            />
          )}

          {filteredAndSortedItems.length === 0 && (
            <EmptyState
              activeTab={activeTab}
              searchTerm={searchTerm}
              handleCreateItem={handleCreateItem}
              canManage={
                activeTab === "currencies"
                  ? canManageCurrencies
                  : canManagePaymentMethods
              }
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {isCurrencyModalOpen && (
        <CurrencyFormModal
          currency={currentItem}
          onClose={() => {
            setIsCurrencyModalOpen(false);
            setCurrentItem(null);
          }}
          onCreate={createCurrencyMutation.mutate}
          onUpdate={updateCurrencyMutation.mutate}
          isLoading={
            createCurrencyMutation.isLoading || updateCurrencyMutation.isLoading
          }
        />
      )}

      {isPaymentMethodModalOpen && (
        <PaymentMethodFormModal
          paymentMethod={currentItem}
          onClose={() => {
            setIsPaymentMethodModalOpen(false);
            setCurrentItem(null);
          }}
          onCreate={createPaymentMethodMutation.mutate}
          onUpdate={updatePaymentMethodMutation.mutate}
          isLoading={
            createPaymentMethodMutation.isLoading ||
            updatePaymentMethodMutation.isLoading
          }
        />
      )}
    </div>
  );
};

// Table View Component
const TableView = ({
  items,
  activeTab,
  sortConfig,
  requestSort,
  expandedItem,
  setExpandedItem,
  handleEditItem,
  handleDeleteItem,
  canManage,
  currencies,
  paymentMethods,
  updatePaymentMethodForCurrency,
  updateCurrencyForPaymentMethod,
  deleteCurrencyPaymentMethod,
  deletePaymentMethodCurrency,
  queryClient,
  showModal,
}) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200">
          {activeTab === "currencies" ? (
            <>
              <SortableHeader
                title="Code"
                sortKey="code"
                sortConfig={sortConfig}
                requestSort={requestSort}
              />
              <SortableHeader
                title="Name"
                sortKey="name"
                sortConfig={sortConfig}
                requestSort={requestSort}
              />
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                Symbol
              </th>
            </>
          ) : (
            <>
              <SortableHeader
                title="Name"
                sortKey="name"
                sortConfig={sortConfig}
                requestSort={requestSort}
              />
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                Description
              </th>
            </>
          )}
          <SortableHeader
            title="Status"
            sortKey="isActive"
            sortConfig={sortConfig}
            requestSort={requestSort}
          />
          <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
            {activeTab === "currencies" ? "Payment Methods" : "Currencies"}
          </th>
          {canManage && (
            <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
              Actions
            </th>
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {items.map((item) => {
          const isExpanded =
            expandedItem === (activeTab === "currencies" ? item.code : item.id);
          return (
            <React.Fragment
              key={activeTab === "currencies" ? item.code : item.id}
            >
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                {activeTab === "currencies" ? (
                  <>
                    <td className="py-4 px-6 font-mono font-semibold text-gray-900">
                      {item.code}
                    </td>
                    <td className="py-4 px-6 text-gray-900">{item.name}</td>
                    <td className="py-4 px-6 text-gray-600 font-mono">
                      {item.symbol || "-"}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      {item.name}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {item.description || "-"}
                    </td>
                  </>
                )}
                <td className="py-4 px-6">
                  <StatusBadge isActive={item.isActive} />
                </td>
                <td className="py-4 px-6">
                  <button
                    onClick={() =>
                      setExpandedItem(
                        isExpanded
                          ? null
                          : activeTab === "currencies"
                          ? item.code
                          : item.id
                      )
                    }
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    {activeTab === "currencies"
                      ? `${item.allowedPaymentMethods?.length || 0} methods`
                      : `${item.allowedCurrencies?.length || 0} currencies`}
                  </button>
                </td>
                {canManage && (
                  <td className="py-4 px-6">
                    <ActionButtons
                      item={item}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteItem}
                      activeTab={activeTab}
                    />
                  </td>
                )}
              </tr>
              {isExpanded && (
                <tr className="bg-gray-50">
                  <td colSpan={canManage ? 6 : 5} className="px-6 py-6">
                    {activeTab === "currencies" ? (
                      <ExpandedCurrencyView
                        currencyCode={item.code}
                        paymentMethods={paymentMethods}
                        onTogglePaymentMethod={(
                          currencyCode,
                          paymentMethodId,
                          isActive
                        ) =>
                          updatePaymentMethodForCurrency.mutate({
                            currencyCode,
                            paymentMethodId,
                            isActive,
                          })
                        }
                        onRemovePaymentMethod={(
                          currencyCode,
                          paymentMethodId
                        ) =>
                          deleteCurrencyPaymentMethod(
                            currencyCode,
                            paymentMethodId
                          )
                            .then(() => {
                              queryClient.invalidateQueries(["currencies"]);
                              showModal(
                                "Payment method removed successfully.",
                                "Success"
                              );
                            })
                            .catch((err) =>
                              showModal(
                                err.message ||
                                  "Failed to remove payment method.",
                                "Error"
                              )
                            )
                        }
                        onAddPaymentMethod={(currencyCode, paymentMethodId) =>
                          updatePaymentMethodForCurrency.mutate({
                            currencyCode,
                            paymentMethodId,
                            isActive: true,
                          })
                        }
                      />
                    ) : (
                      <ExpandedPaymentMethodView
                        paymentMethodId={item.id}
                        currencies={currencies}
                        onToggleCurrency={(
                          paymentMethodId,
                          currencyCode,
                          isActive
                        ) =>
                          updateCurrencyForPaymentMethod.mutate({
                            paymentMethodId,
                            currencyCode,
                            isActive,
                          })
                        }
                        onRemoveCurrency={(paymentMethodId, currencyCode) =>
                          deletePaymentMethodCurrency(
                            paymentMethodId,
                            currencyCode
                          )
                            .then(() => {
                              queryClient.invalidateQueries(["paymentMethods"]);
                              showModal(
                                "Currency removed successfully.",
                                "Success"
                              );
                            })
                            .catch((err) =>
                              showModal(
                                err.message || "Failed to remove currency.",
                                "Error"
                              )
                            )
                        }
                        onAddCurrency={(paymentMethodId, currencyCode) =>
                          updateCurrencyForPaymentMethod.mutate({
                            paymentMethodId,
                            currencyCode,
                            isActive: true,
                          })
                        }
                      />
                    )}
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  </div>
);

// Grid View Component - Fixed to include action handlers
const GridView = ({
  items,
  activeTab,
  handleEditItem,
  handleDeleteItem,
  canManage,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {items.map((item) => (
      <div
        key={activeTab === "currencies" ? item.code : item.id}
        className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300 cursor-pointer"
      >
        <div className="flex justify-between items-start mb-4">
          <div
            className={`p-3 rounded-xl ${
              activeTab === "currencies" ? "bg-green-100" : "bg-blue-100"
            }`}
          >
            {activeTab === "currencies" ? (
              <DollarSign
                className={`w-6 h-6 ${
                  activeTab === "currencies"
                    ? "text-green-600"
                    : "text-blue-600"
                }`}
              />
            ) : (
              <CreditCard
                className={`w-6 h-6 ${
                  activeTab === "currencies"
                    ? "text-green-600"
                    : "text-blue-600"
                }`}
              />
            )}
          </div>
          <StatusBadge isActive={item.isActive} />
        </div>

        <div className="mb-4" onClick={() => canManage && handleEditItem(item)}>
          {activeTab === "currencies" ? (
            <>
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                {item.code}
              </h3>
              <p className="text-gray-600 mb-2">{item.name}</p>
              {item.symbol && (
                <p className="text-sm text-gray-500 font-mono">
                  Symbol: {item.symbol}
                </p>
              )}
            </>
          ) : (
            <>
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                {item.name}
              </h3>
              <p className="text-gray-600 text-sm">
                {item.description || "No description"}
              </p>
            </>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            {activeTab === "currencies"
              ? `${item.allowedPaymentMethods?.length || 0} methods`
              : `${item.allowedCurrencies?.length || 0} currencies`}
          </span>

          {canManage && (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleEditItem(item)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  handleDeleteItem(
                    activeTab === "currencies" ? item.code : item.id
                  )
                }
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);

// Enhanced Status Badge Component
const StatusBadge = ({ isActive }) => (
  <span
    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
      isActive
        ? "bg-green-100 text-green-800 border border-green-200"
        : "bg-gray-100 text-gray-600 border border-gray-200"
    }`}
  >
    <div
      className={`w-2 h-2 rounded-full ${
        isActive ? "bg-green-500" : "bg-gray-400"
      }`}
    />
    {isActive ? "Active" : "Inactive"}
  </span>
);

// Sortable Header Component
const SortableHeader = ({ title, sortKey, sortConfig, requestSort }) => (
  <th
    className="py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
    onClick={() => requestSort(sortKey)}
  >
    <div className="flex items-center gap-2">
      {title}
      {sortConfig.key === sortKey &&
        (sortConfig.direction === "asc" ? (
          <SortAsc className="w-4 h-4 text-gray-500" />
        ) : (
          <SortDesc className="w-4 h-4 text-gray-500" />
        ))}
    </div>
  </th>
);

// Action Buttons Component
const ActionButtons = ({ item, onEdit, onDelete, activeTab }) => (
  <div className="flex items-center gap-1">
    <button
      onClick={() => onEdit(item)}
      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors duration-200"
      title="Edit"
    >
      <Edit className="w-4 h-4" />
    </button>
    <button
      onClick={() => onDelete(activeTab === "currencies" ? item.code : item.id)}
      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200"
      title="Delete"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);

// Empty State Component
const EmptyState = ({ activeTab, searchTerm, handleCreateItem, canManage }) => (
  <div className="text-center py-12">
    <div
      className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
        activeTab === "currencies" ? "bg-green-100" : "bg-blue-100"
      }`}
    >
      {activeTab === "currencies" ? (
        <DollarSign
          className={`w-8 h-8 ${
            activeTab === "currencies" ? "text-green-600" : "text-blue-600"
          }`}
        />
      ) : (
        <CreditCard
          className={`w-8 h-8 ${
            activeTab === "currencies" ? "text-green-600" : "text-blue-600"
          }`}
        />
      )}
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      {searchTerm ? `No ${activeTab} found` : `No ${activeTab} yet`}
    </h3>
    <p className="text-gray-600 mb-6">
      {searchTerm
        ? `No ${activeTab} match your search criteria. Try adjusting your filters.`
        : `Get started by creating your first ${
            activeTab === "currencies" ? "currency" : "payment method"
          }.`}
    </p>
    {canManage && !searchTerm && (
      <button
        onClick={handleCreateItem}
        className={`px-6 py-3 text-white rounded-xl font-medium transition-colors shadow-lg flex items-center gap-2 mx-auto ${
          activeTab === "currencies"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        <Plus className="w-5 h-5" />
        Add {activeTab === "currencies" ? "Currency" : "Payment Method"}
      </button>
    )}
  </div>
);

// Enhanced Expanded Currency View
const ExpandedCurrencyView = ({
  currencyCode,
  paymentMethods,
  onTogglePaymentMethod,
  onRemovePaymentMethod,
  onAddPaymentMethod,
}) => {
  const [currencyPaymentMethods, setCurrencyPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadPaymentMethods = async () => {
      setIsLoading(true);
      try {
        const methods = await getCurrencyPaymentMethods(currencyCode);
        setCurrencyPaymentMethods(methods);
      } catch (error) {
        console.error("Failed to load payment methods:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentMethods();
  }, [currencyCode]);

  const handleAddAllPaymentMethods = () => {
    filteredAvailableMethods.forEach((pm) => {
      onAddPaymentMethod(currencyCode, pm.id);
    });
  };

  const filteredAvailableMethods = paymentMethods.filter((pm) => {
    if (currencyPaymentMethods.some((allowedPm) => allowedPm.id === pm.id)) {
      return false;
    }
    return (
      pm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pm.description &&
        pm.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading payment methods...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Payment Methods */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <List className="w-5 h-5 text-gray-600" />
          <h4 className="font-semibold text-gray-800">
            Configured Payment Methods for {currencyCode}
          </h4>
        </div>

        {currencyPaymentMethods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currencyPaymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-semibold text-gray-900">{pm.name}</h5>
                    {pm.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {pm.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onRemovePaymentMethod(currencyCode, pm.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pm.isActive}
                      onChange={(e) =>
                        onTogglePaymentMethod(
                          currencyCode,
                          pm.id,
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span
                      className={`text-sm font-medium ${
                        pm.isActive ? "text-green-700" : "text-gray-500"
                      }`}
                    >
                      {pm.isActive ? "Enabled" : "Disabled"}
                    </span>
                  </label>
                  <StatusBadge isActive={pm.isActive} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              No payment methods configured for this currency
            </p>
          </div>
        )}
      </div>

      {/* Add Payment Methods */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-800">Add Payment Methods</h4>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-grow lg:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search methods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleAddAllPaymentMethods}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2 whitespace-nowrap"
              disabled={filteredAvailableMethods.length === 0}
            >
              <Zap className="w-4 h-4" />
              Add All ({filteredAvailableMethods.length})
            </button>
          </div>
        </div>

        {filteredAvailableMethods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAvailableMethods.map((pm) => (
              <div
                key={pm.id}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-grow">
                    <h5 className="font-semibold text-gray-900">{pm.name}</h5>
                    {pm.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {pm.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onAddPaymentMethod(currencyCode, pm.id)}
                    className="ml-3 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              {searchTerm
                ? "No matching payment methods found"
                : "All available payment methods are already added"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Expanded Payment Method View
const ExpandedPaymentMethodView = ({
  paymentMethodId,
  currencies,
  onToggleCurrency,
  onRemoveCurrency,
  onAddCurrency,
}) => {
  const [paymentMethodCurrencies, setPaymentMethodCurrencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadCurrencies = async () => {
      setIsLoading(true);
      try {
        const currencies = await getPaymentMethodCurrencies(paymentMethodId);
        setPaymentMethodCurrencies(currencies);
      } catch (error) {
        console.error("Failed to load currencies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrencies();
  }, [paymentMethodId]);

  const handleAddAllCurrencies = () => {
    filteredAvailableCurrencies.forEach((currency) => {
      onAddCurrency(paymentMethodId, currency.code);
    });
  };

  const filteredAvailableCurrencies = currencies.filter((currency) => {
    if (
      paymentMethodCurrencies.some(
        (allowedCurrency) => allowedCurrency.code === currency.code
      )
    ) {
      return false;
    }
    return (
      currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading currencies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Currencies */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <List className="w-5 h-5 text-gray-600" />
          <h4 className="font-semibold text-gray-800">Configured Currencies</h4>
        </div>

        {paymentMethodCurrencies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethodCurrencies.map((currency) => (
              <div
                key={currency.code}
                className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-semibold text-gray-900 font-mono">
                      {currency.code}
                    </h5>
                    <p className="text-sm text-gray-600">{currency.name}</p>
                    {currency.symbol && (
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        Symbol: {currency.symbol}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      onRemoveCurrency(paymentMethodId, currency.code)
                    }
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currency.isActive}
                      onChange={(e) =>
                        onToggleCurrency(
                          paymentMethodId,
                          currency.code,
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span
                      className={`text-sm font-medium ${
                        currency.isActive ? "text-green-700" : "text-gray-500"
                      }`}
                    >
                      {currency.isActive ? "Enabled" : "Disabled"}
                    </span>
                  </label>
                  <StatusBadge isActive={currency.isActive} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              No currencies configured for this payment method
            </p>
          </div>
        )}
      </div>

      {/* Add Currencies */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-800">Add Currencies</h4>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-grow lg:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search currencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleAddAllCurrencies}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2 whitespace-nowrap"
              disabled={filteredAvailableCurrencies.length === 0}
            >
              <Zap className="w-4 h-4" />
              Add All ({filteredAvailableCurrencies.length})
            </button>
          </div>
        </div>

        {filteredAvailableCurrencies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAvailableCurrencies.map((currency) => (
              <div
                key={currency.code}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-grow">
                    <h5 className="font-semibold text-gray-900 font-mono">
                      {currency.code}
                    </h5>
                    <p className="text-sm text-gray-600">{currency.name}</p>
                    {currency.symbol && (
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        Symbol: {currency.symbol}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      onAddCurrency(paymentMethodId, currency.code)
                    }
                    className="ml-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              {searchTerm
                ? "No matching currencies found"
                : "All available currencies are already added"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CombinedCurrencyPaymentMethodPage;
