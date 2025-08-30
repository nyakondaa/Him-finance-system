import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Search,
  AlertCircle,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  ArrowRightLeft,
  DollarSign,
  Eye,
  MoreVertical,
  Clock,
  Activity,
} from "lucide-react";
import {
  getExchangeRates,
  createExchangeRate,
  updateExchangeRate,
  deleteExchangeRate,
  getCurrencies,
} from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import useAuth from "../hooks/useAuth";
import ExchangeRateFormModal from "../components/ExchangeRateFormModal";

const ExchangeRatePage = ({ showModal }) => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "fromCurrency",
    direction: "asc",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRate, setCurrentRate] = useState(null);
  const [dateFilter, setDateFilter] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("");

  // Fetch data
  const {
    data: exchangeRates = [],
    isLoading: isLoadingRates,
    error: ratesError,
    refetch: refetchRates,
  } = useQuery({
    queryKey: ["exchangeRates"],
    queryFn: getExchangeRates,
    onError: (err) =>
      showModal(err.message || "Failed to load exchange rates.", "Error"),
  });

  const {
    data: currencies = [],
    isLoading: isLoadingCurrencies,
    error: currenciesError,
  } = useQuery({
    queryKey: ["currencies"],
    queryFn: getCurrencies,
    onError: (err) =>
      showModal(err.message || "Failed to load currencies.", "Error"),
  });

  // Mutations
  const createExchangeRateMutation = useMutation({
    mutationFn: createExchangeRate,
    onSuccess: () => {
      queryClient.invalidateQueries(["exchangeRates"]);
      showModal("Exchange rate created successfully!", "Success");
      setIsModalOpen(false);
      setCurrentRate(null);
    },
    onError: (err) =>
      showModal(err.message || "Failed to create exchange rate.", "Error"),
  });

  const updateExchangeRateMutation = useMutation({
    mutationFn: ({ id, data }) => updateExchangeRate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["exchangeRates"]);
      showModal("Exchange rate updated successfully!", "Success");
      setIsModalOpen(false);
      setCurrentRate(null);
    },
    onError: (err) =>
      showModal(err.message || "Failed to update exchange rate.", "Error"),
  });

  const deleteExchangeRateMutation = useMutation({
    mutationFn: deleteExchangeRate,
    onSuccess: () => {
      queryClient.invalidateQueries(["exchangeRates"]);
      showModal("Exchange rate deleted successfully.", "Success");
    },
    onError: (err) =>
      showModal(err.message || "Failed to delete exchange rate.", "Error"),
  });

  // Helper functions
  const handleEditRate = (rate) => {
    setCurrentRate(rate);
    setIsModalOpen(true);
  };

  const handleCreateRate = () => {
    setCurrentRate(null);
    setIsModalOpen(true);
  };

  const handleDeleteRate = (id) => {
    showModal(
      "Are you sure you want to delete this exchange rate? This action cannot be undone.",
      "Confirm Deletion",
      true,
      () => deleteExchangeRateMutation.mutate(id)
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
  const filteredAndSortedRates = React.useMemo(() => {
    let filtered = [...exchangeRates];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (rate) =>
          rate.fromCurrency.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rate.toCurrency.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(
        (rate) =>
          new Date(rate.effectiveDate).toDateString() ===
          new Date(dateFilter).toDateString()
      );
    }

    // Apply currency filter
    if (currencyFilter) {
      filtered = filtered.filter(
        (rate) =>
          rate.fromCurrency === currencyFilter ||
          rate.toCurrency === currencyFilter
      );
    }

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
  }, [exchangeRates, sortConfig, searchTerm, dateFilter, currencyFilter]);

  // Permission checks
  const canManageRates =
    currentUser?.permissions?.exchangeRates?.includes("manage") ||
    currentUser?.role === "admin" ||
    currentUser?.role === "super_admin" ||
    false;

  // Statistics calculations
  const stats = React.useMemo(() => {
    const today = new Date().toDateString();
    const recentRates = exchangeRates.filter(
      (rate) => new Date(rate.effectiveDate).toDateString() === today
    );

    return {
      total: exchangeRates.length,
      today: recentRates.length,
      currencies: new Set([
        ...exchangeRates.map((r) => r.fromCurrency),
        ...exchangeRates.map((r) => r.toCurrency),
      ]).size,
    };
  }, [exchangeRates]);

  if (isLoadingRates || isLoadingCurrencies) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading exchange rates...</p>
        </div>
      </div>
    );
  }

  if (ratesError || currenciesError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-red-200">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Data
          </h3>
          {ratesError && (
            <p className="text-red-600 mb-2">{ratesError.message}</p>
          )}
          {currenciesError && (
            <p className="text-red-600">{currenciesError.message}</p>
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-xl">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              Exchange Rates
            </h1>
            <p className="text-gray-600">
              Manage currency exchange rates and conversions
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Rates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ArrowRightLeft className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Today's Rates
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.today}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Active Currencies
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.currencies}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Search and Filter Bar */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-4 flex-grow">
              {/* Search */}
              <div className="relative flex-grow max-w-md">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search currencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white"
                />
              </div>

              {/* Date Filter */}
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />

              {/* Currency Filter */}
              <select
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Currencies</option>
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
              {/* Refresh Button */}
              <button
                onClick={refetchRates}
                className="p-3 rounded-xl border border-gray-300 hover:bg-gray-100 transition duration-200 bg-white"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5 text-gray-500" />
              </button>

              {/* Create Button */}
              {canManageRates && (
                <button
                  onClick={handleCreateRate}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-300 shadow-lg flex items-center gap-2 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add Rate
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {filteredAndSortedRates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <SortableHeader
                      title="From"
                      sortKey="fromCurrency"
                      sortConfig={sortConfig}
                      requestSort={requestSort}
                    />
                    <SortableHeader
                      title="To"
                      sortKey="toCurrency"
                      sortConfig={sortConfig}
                      requestSort={requestSort}
                    />
                    <SortableHeader
                      title="Rate"
                      sortKey="rate"
                      sortConfig={sortConfig}
                      requestSort={requestSort}
                    />
                    <SortableHeader
                      title="Effective Date"
                      sortKey="effectiveDate"
                      sortConfig={sortConfig}
                      requestSort={requestSort}
                    />
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                      Last Updated
                    </th>
                    {canManageRates && (
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAndSortedRates.map((rate) => (
                    <tr
                      key={rate.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="py-4 px-6 font-mono font-semibold text-gray-900">
                        {rate.fromCurrency}
                      </td>
                      <td className="py-4 px-6 font-mono font-semibold text-gray-900">
                        {rate.toCurrency}
                      </td>
                      <td className="py-4 px-6 text-gray-900 font-medium">
                        {rate.rate.toFixed(6)}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {new Date(rate.effectiveDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {new Date(rate.updatedAt).toLocaleDateString()}
                      </td>
                      {canManageRates && (
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditRate(rate)}
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRate(rate.id)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || dateFilter || currencyFilter
                  ? "No exchange rates found"
                  : "No exchange rates yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || dateFilter || currencyFilter
                  ? "No rates match your search criteria. Try adjusting your filters."
                  : "Get started by creating your first exchange rate."}
              </p>
              {canManageRates &&
                !(searchTerm || dateFilter || currencyFilter) && (
                  <button
                    onClick={handleCreateRate}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Add Exchange Rate
                  </button>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ExchangeRateFormModal
          rate={currentRate}
          currencies={currencies}
          onClose={() => {
            setIsModalOpen(false);
            setCurrentRate(null);
          }}
          onCreate={createExchangeRateMutation.mutate}
          onUpdate={updateExchangeRateMutation.mutate}
          isLoading={
            createExchangeRateMutation.isLoading ||
            updateExchangeRateMutation.isLoading
          }
        />
      )}
    </div>
  );
};

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

export default ExchangeRatePage;
