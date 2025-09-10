import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building,
  Calendar,
  Clock,
  CreditCard,
  Smartphone,
  Banknote,
  PiggyBank,
  Target,
  Activity,
  Zap,
  Award,
  Eye,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Filter,
  Download,
  Settings,
  Bell,
  Search,
  MapPin,
  Timer,
  Wallet,
  Receipt,
  Star,
  Crown,
  Flame,
  Square,
  CheckSquare,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  getTransactions,
  getUsers,
  getBranches,
  getRevenueHeads,
  getCurrencies,
  getPaymentMethods,
} from "../services/api";
import useAuth from "../hooks/useAuth";

const Dashboard = ({ showModal }) => {
  
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [isDefaultCurrency, setIsDefaultCurrency] = useState(false);
  const [viewMode, setViewMode] = useState("overview");

 

  // Load default currency from local storage on component mount
  useEffect(() => {
    const savedDefaultCurrency = localStorage.getItem("defaultCurrency");
    if (savedDefaultCurrency) {
      setSelectedCurrency(savedDefaultCurrency);
    }
  }, []);

  // Save/remove default currency to local storage when checkbox changes
  useEffect(() => {
    if (isDefaultCurrency) {
      localStorage.setItem("defaultCurrency", selectedCurrency);
    } else {
      localStorage.removeItem("defaultCurrency");
    }
  }, [isDefaultCurrency, selectedCurrency]);

  // Fetch all data
  const {
    data: transactionsData,
    isLoading: loadingTransactions,
    isError: isErrorTransactions,
    error: transactionsError,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
    refetchInterval: 30000,
    onError: (err) => {
      console.error("Failed to load transactions:", err);
      if (showModal) {
        showModal(err.message || "Failed to load transactions.", "Error");
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: usersData,
    isLoading: loadingUsers,
    isError: isErrorUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    onError: (err) => {
      console.error("Failed to load users:", err);
      if (showModal) {
        showModal(err.message || "Failed to load users.", "Error");
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: branchesData,
    isLoading: loadingBranches,
    isError: isErrorBranches,
    error: branchesError,
  } = useQuery({
    queryKey: ["branches"],
    queryFn: getBranches,
    onError: (err) => {
      console.error("Failed to load branches:", err);
      if (showModal) {
        showModal(err.message || "Failed to load branches.", "Error");
      }
    },
    retry: 2,
    staleTime: 10 * 60 * 1000,
  });

  const {
    data: revenueHeadsData,
    isLoading: loadingRevenueHeads,
    isError: isErrorRevenueHeads,
    error: revenueHeadsError,
  } = useQuery({
    queryKey: ["revenueHeads"],
    queryFn: getRevenueHeads,
    onError: (err) => {
      console.error("Failed to load revenue heads:", err);
      if (showModal) {
        showModal(err.message || "Failed to load revenue heads.", "Error");
      }
    },
    retry: 2,
    staleTime: 10 * 60 * 1000,
  });


const {userPermissions, isLoading: authLoading } = useAuth();
const hasPermission = (resource, action) => {
  return userPermissions && userPermissions[resource]?.includes(action);
};
// The key change: add permissions to the queryKey
const {
    data: currenciesData,
    isLoading: loadingCurrencies,
    isError: isErrorCurrencies,
    error: currenciesError,
} = useQuery({
    queryKey: ["currencies", userPermissions],
    queryFn: getCurrencies,
    // The enabled check is still necessary
    enabled: hasPermission('currencies', 'read') && !authLoading,
    onError: (err) => {
        console.error("Failed to load currencies:", err);
    },
    retry: 2,
    staleTime: 60 * 60 * 1000,
});

  const {
    data: paymentMethodsData,
    isLoading: loadingPaymentMethods,
    isError: isErrorPaymentMethods,
    error: paymentMethodsError,
  } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: getPaymentMethods,
    onError: (err) => {
      console.error("Failed to load payment methods:", err);
      if (showModal) {
        showModal(err.message || "Failed to load payment methods.", "Error");
      }
    },
    retry: 2,
    staleTime: 60 * 60 * 1000, // 1 hour cache for payment methods
  });

  // Process data - All useMemo hooks should be unconditional
  const transactions = useMemo(() => {
    if (!transactionsData) return [];
    const data = Array.isArray(transactionsData)
      ? transactionsData
      : transactionsData.transactions || transactionsData.data || [];
    return data.map((t) => ({
      ...t,
      amount: parseFloat(t.amount) || 0,
      transactionDate: new Date(t.transactionDate),
    }));
  }, [transactionsData]);

  const users = useMemo(() => {
    if (!usersData) return [];
    return Array.isArray(usersData)
      ? usersData
      : usersData.users || usersData.data || [];
  }, [usersData]);

  const branches = useMemo(() => {
    if (!branchesData) return [];
    return Array.isArray(branchesData)
      ? branchesData
      : branchesData.branches || branchesData.data || [];
  }, [branchesData]);

  const revenueHeads = useMemo(() => {
    if (!revenueHeadsData) return [];
    return Array.isArray(revenueHeadsData)
      ? revenueHeadsData
      : revenueHeadsData.revenueHeads || revenueHeadsData.data || [];
  }, [revenueHeadsData]);

  const currencies = useMemo(() => {
    if (!currenciesData) return [];
    return Array.isArray(currenciesData)
      ? currenciesData
      : currenciesData.currencies || currenciesData.data || [];
  }, [currenciesData]);

  const paymentMethods = useMemo(() => {
    if (!paymentMethodsData) return [];
    return Array.isArray(paymentMethodsData)
      ? paymentMethodsData
      : paymentMethodsData.paymentMethods || paymentMethodsData.data || [];
  }, [paymentMethodsData]);

  // Get available currencies - this must be unconditional
  const availableCurrencies = useMemo(() => {
    if (currencies.length > 0) {
      return currencies.map((c) => c.code).sort();
    }

    const currenciesSet = new Set(
      transactions.map((t) => t.currency).filter(Boolean)
    );
    const sortedCurrencies = Array.from(currenciesSet).sort();
    if (!sortedCurrencies.includes("USD")) {
      sortedCurrencies.unshift("USD");
    }
    return sortedCurrencies;
  }, [transactions, currencies]);

  // Get date ranges for current and previous periods
  const getDateRange = (period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);

    switch (period) {
      case "today":
        return { start: today, end: endOfToday };
      case "yesterday":
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return { start: yesterday, end: today };
      case "week":
        const weekStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - today.getDay()
        );
        return { start: weekStart, end: endOfToday };
      case "prevWeek":
        const prevWeekStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - today.getDay() - 7
        );
        const weekStart2 = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - today.getDay()
        );
        return {
          start: prevWeekStart,
          end: new Date(weekStart2.getTime() - 1),
        };
      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: monthStart, end: endOfToday };
      case "prevMonth":
        const prevMonthStart = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const prevMonthEnd = new Date(
          today.getFullYear(),
          today.getMonth(),
          0,
          23,
          59,
          59,
          999
        );
        return { start: prevMonthStart, end: prevMonthEnd };
      default:
        return { start: today, end: endOfToday };
    }
  };

  const { start: currentStart, end: currentEnd } = getDateRange(selectedPeriod);
  const { start: prevStart, end: prevEnd } = getDateRange(
    selectedPeriod === "today"
      ? "yesterday"
      : selectedPeriod === "week"
      ? "prevWeek"
      : selectedPeriod === "month"
      ? "prevMonth"
      : "today"
  );

  // Filter transactions for the current and previous periods
  const currentTransactions = useMemo(() => {
    return transactions.filter(
      (t) =>
        t.currency === selectedCurrency &&
        t.transactionDate >= currentStart &&
        t.transactionDate <= currentEnd
    );
  }, [transactions, selectedCurrency, currentStart, currentEnd]);

  const previousTransactions = useMemo(() => {
    return transactions.filter(
      (t) =>
        t.currency === selectedCurrency &&
        t.transactionDate >= prevStart &&
        t.transactionDate <= prevEnd
    );
  }, [transactions, selectedCurrency, prevStart, prevEnd]);

  // Calculate core metrics for the selected period
  const metrics = useMemo(() => {
    const currentRevenue = currentTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const previousRevenue = previousTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const revenueChange =
      previousRevenue === 0
        ? currentRevenue > 0
          ? 100
          : 0
        : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

    const currentCount = currentTransactions.length;
    const previousCount = previousTransactions.length;
    const countChange =
      previousCount === 0
        ? currentCount > 0
          ? 100
          : 0
        : ((currentCount - previousCount) / previousCount) * 100;

    const avgTransaction = currentCount > 0 ? currentRevenue / currentCount : 0;
    const prevAvgTransaction =
      previousCount > 0 ? previousRevenue / previousCount : 0;
    const avgChange =
      prevAvgTransaction === 0
        ? avgTransaction > 0
          ? 100
          : 0
        : ((avgTransaction - prevAvgTransaction) / prevAvgTransaction) * 100;

    const uniquePayersSet = new Set(
      currentTransactions.map((t) => t.payerName).filter(Boolean)
    );
    const uniquePayers = uniquePayersSet.size;

    const conversionRate = uniquePayers > 0 ? currentCount / uniquePayers : 0;

    return {
      totalRevenue: currentRevenue,
      revenueChange,
      totalTransactions: currentCount,
      transactionChange: countChange,
      averageTransaction: avgTransaction,
      averageChange: avgChange,
      uniquePayers,
      conversionRate,
    };
  }, [currentTransactions, previousTransactions]);

  // Payment methods analysis
  const paymentMethodsChartData = useMemo(() => {
    const methods = {};
    currentTransactions.forEach((t) => {
      const method = t.paymentMethod || "Unknown";
      if (!methods[method]) {
        methods[method] = { name: method, value: 0, count: 0, color: "" };
      }
      methods[method].value += t.amount;
      methods[method].count += 1;
    });

    const colors = [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#06B6D4",
      "#84CC16",
      "#F97316",
      "#6B7280",
    ];
    return Object.values(methods)
      .map((method, index) => ({
        ...method,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [currentTransactions]);

  // Hourly data for charts
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      hourLabel: `${i.toString().padStart(2, "0")}:00`,
      revenue: 0,
      transactions: 0,
    }));

    currentTransactions.forEach((t) => {
      const hour = t.transactionDate.getHours();
      if (hours[hour]) {
        hours[hour].revenue += t.amount;
        hours[hour].transactions += 1;
      }
    });

    return hours;
  }, [currentTransactions]);

  // Top 5 revenue heads for the current period
  const topRevenueHeads = useMemo(() => {
    const revenueHeadTotals = {};
    currentTransactions.forEach((t) => {
      const revenueHeadCode = t.revenueHeadCode;
      const amount = t.amount;
      if (revenueHeadCode) {
        revenueHeadTotals[revenueHeadCode] =
          (revenueHeadTotals[revenueHeadCode] || 0) + amount;
      }
    });

    const sortedRevenueHeads = Object.entries(revenueHeadTotals)
      .map(([code, total]) => {
        const head = revenueHeads.find((rh) => rh.code === code);
        return {
          name: head?.name || `Unknown Head (${code})`,
          total: total,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return sortedRevenueHeads;
  }, [currentTransactions, revenueHeads]);

  // Top 5 payers for the current period with transaction count
  const topPayers = useMemo(() => {
    const payerTotals = {};
    const payerCounts = {};

    currentTransactions.forEach((t) => {
      const payerName = t.payerName || "Unknown Payer";
      const amount = t.amount;
      payerTotals[payerName] = (payerTotals[payerName] || 0) + amount;
      payerCounts[payerName] = (payerCounts[payerName] || 0) + 1;
    });

    return Object.entries(payerTotals)
      .map(([name, total]) => ({
        name,
        total,
        count: payerCounts[name] || 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [currentTransactions]);

  // Transaction Value Distribution data for chart
  const transactionValueDistributionData = useMemo(() => {
    const bins = [
      { name: `< ${selectedCurrency} 50`, min: 0, max: 50, count: 0 },
      { name: `${selectedCurrency} 50 - 200`, min: 50, max: 200, count: 0 },
      { name: `${selectedCurrency} 200 - 500`, min: 200, max: 500, count: 0 },
      { name: `${selectedCurrency} 500 - 1000`, min: 500, max: 1000, count: 0 },
      {
        name: `> ${selectedCurrency} 1000`,
        min: 1000,
        max: Infinity,
        count: 0,
      },
    ];

    currentTransactions.forEach((t) => {
      const amount = t.amount;
      for (let i = 0; i < bins.length; i++) {
        if (amount >= bins[i].min && amount < bins[i].max) {
          bins[i].count++;
          break;
        }
      }
    });

    return bins.map((b) => ({ name: b.name, transactions: b.count }));
  }, [currentTransactions, selectedCurrency]);

  // Branch Performance for the current period
  const branchPerformanceData = useMemo(() => {
    const branchTotals = {};
    currentTransactions.forEach((t) => {
      const branchCode = t.branchCode;
      const amount = t.amount;
      if (branchCode) {
        branchTotals[branchCode] = (branchTotals[branchCode] || 0) + amount;
      }
    });

    return branches
      .map((branch) => ({
        name: branch.name || `Unknown Branch (${branch.code})`,
        total: branchTotals[branch.code] || 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [currentTransactions, branches]);

  // Helper functions for styling and formatting
  const getPerformanceColor = (change) => {
    if (change > 10) return "text-green-600 bg-green-50";
    if (change > 0) return "text-green-500 bg-green-50";
    if (change < -10) return "text-red-600 bg-red-50";
    if (change < 0) return "text-red-500 bg-red-50";
    return "text-gray-600 bg-gray-50";
  };

  const getPerformanceIcon = (change) => {
    if (change > 0) return <ArrowUpRight className="w-4 h-4" />;
    if (change < 0) return <ArrowDownRight className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: selectedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  // Overall loading and error state
  if (
    loadingTransactions ||
    loadingUsers ||
    loadingBranches ||
    loadingRevenueHeads ||
    loadingCurrencies ||
    loadingPaymentMethods
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">
            Loading Dashboard...
          </p>
          <p className="text-gray-500 mt-2">Fetching your latest data</p>
        </div>
      </div>
    );
  }

  if (
    isErrorTransactions ||
    isErrorUsers ||
    isErrorBranches ||
    isErrorRevenueHeads ||
    isErrorCurrencies ||
    isErrorPaymentMethods
  ) {
    return (
      <div className="text-center text-red-600 p-8">
        <h2 className="text-xl font-semibold mb-4">
          Error Loading Dashboard Data
        </h2>
        <div className="space-y-2">
          {isErrorTransactions && (
            <p className="text-sm">
              Transactions: {transactionsError?.message || "Unknown error"}
            </p>
          )}
          {isErrorUsers && (
            <p className="text-sm">
              Users: {usersError?.message || "Unknown error"}
            </p>
          )}
          {isErrorBranches && (
            <p className="text-sm">
              Branches: {branchesError?.message || "Unknown error"}
            </p>
          )}
          {isErrorRevenueHeads && (
            <p className="text-sm">
              Revenue Heads: {revenueHeadsError?.message || "Unknown error"}
            </p>
          )}
          {isErrorCurrencies && (
            <p className="text-sm">
              Currencies: {currenciesError?.message || "Unknown error"}
            </p>
          )}
          {isErrorPaymentMethods && (
            <p className="text-sm">
              Payment Methods: {paymentMethodsError?.message || "Unknown error"}
            </p>
          )}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Revenue Command Center
                  </h1>
                  <p className="text-sm text-gray-500">
                    Real-time business intelligence
                  </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* Period Selector */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {["today", "week", "month"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedPeriod === period
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>

              {/* Currency Selector */}
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableCurrencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>

              {/* Default Currency Checkbox */}
              <label className="flex items-center cursor-pointer text-gray-700 text-sm sm:text-base">
                <input
                  type="checkbox"
                  className="hidden"
                  checked={isDefaultCurrency}
                  onChange={(e) => setIsDefaultCurrency(e.target.checked)}
                />
                <span className="w-5 h-5 sm:w-6 h-6 border-2 border-gray-400 rounded-md flex items-center justify-center mr-2 transition-all duration-200 ease-in-out flex-shrink-0">
                  {isDefaultCurrency ? (
                    <CheckSquare className="w-4 h-4 sm:w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 sm:w-5 h-5 text-gray-400" />
                  )}
                </span>
                Default
              </label>

              {/* Refresh Button */}
              <button
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => {
                  window.location.reload();
                }}
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div
                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(
                  metrics.revenueChange
                )}`}
              >
                {getPerformanceIcon(metrics.revenueChange)}
                <span>{metrics.revenueChange.toFixed(1)}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">
                Total Revenue (
                {selectedPeriod === "today"
                  ? "Today"
                  : selectedPeriod === "week"
                  ? "This Week"
                  : "This Month"}
                )
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(metrics.totalRevenue)}
              </p>
              <p className="text-xs text-gray-500">
                {selectedPeriod === "today"
                  ? "vs yesterday"
                  : `vs previous ${selectedPeriod}`}
              </p>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div
                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(
                  metrics.transactionChange
                )}`}
              >
                {getPerformanceIcon(metrics.transactionChange)}
                <span>{metrics.transactionChange.toFixed(1)}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">
                Transactions (
                {selectedPeriod === "today"
                  ? "Today"
                  : selectedPeriod === "week"
                  ? "This Week"
                  : "This Month"}
                )
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(metrics.totalTransactions)}
              </p>
              <p className="text-xs text-gray-500">Payment processed</p>
            </div>
          </div>

          {/* Average Transaction */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div
                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(
                  metrics.averageChange
                )}`}
              >
                {getPerformanceIcon(metrics.averageChange)}
                <span>{metrics.averageChange.toFixed(1)}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">
                Avg. Transaction (
                {selectedPeriod === "today"
                  ? "Today"
                  : selectedPeriod === "week"
                  ? "This Week"
                  : "This Month"}
                )
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(metrics.averageTransaction)}
              </p>
              <p className="text-xs text-gray-500">Per transaction value</p>
            </div>
          </div>

          {/* Unique Payers */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-600">
                <Crown className="w-3 h-3" />
                <span>{metrics.conversionRate.toFixed(1)}x</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">
                Unique Payers (
                {selectedPeriod === "today"
                  ? "Today"
                  : selectedPeriod === "week"
                  ? "This Week"
                  : "This Month"}
                )
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(metrics.uniquePayers)}
              </p>
              <p className="text-xs text-gray-500">Customer engagement</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Timeline */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Revenue Timeline (
                  {selectedPeriod === "today" ? "Hourly" : "Daily"})
                </h3>
                <p className="text-sm text-gray-500">Performance breakdown</p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                <Activity className="w-4 h-4" />
                <span>Live Data</span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient
                      id="revenueGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#3B82F6"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="hourLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatCurrency(value),
                      "Revenue",
                    ]}
                    labelStyle={{ color: "#1f2937" }}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Payment Mix (
                  {selectedPeriod === "today"
                    ? "Today"
                    : selectedPeriod === "week"
                    ? "This Week"
                    : "This Month"}
                  )
                </h3>
                <p className="text-sm text-gray-500">
                  Method distribution by value
                </p>
              </div>
              <Wallet className="w-5 h-5 text-gray-400" />
            </div>

            <div className="h-48 mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={paymentMethodsChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    dataKey="value"
                    stroke="none"
                  >
                    {paymentMethodsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), "Amount"]}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 mt-4">
              {paymentMethodsChartData.slice(0, 4).map((method) => (
                <div
                  key={method.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: method.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {method.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(method.value)}
                    </p>
                    <p className="text-xs text-gray-500">{method.count} txns</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Performers (Payers) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Top Payers (
                  {selectedPeriod === "today"
                    ? "Today"
                    : selectedPeriod === "week"
                    ? "This Week"
                    : "This Month"}
                  )
                </h3>
                <p className="text-sm text-gray-500">
                  Revenue leaders by customer
                </p>
              </div>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>

            <div className="space-y-4">
              {topPayers.length > 0 ? (
                topPayers.map((payer, index) => (
                  <div
                    key={payer.name}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                            ? "bg-gray-400"
                            : index === 2
                            ? "bg-orange-500"
                            : "bg-blue-500"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {payer.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payer.count} transactions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(payer.total)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Avg: {formatCurrency(payer.total / payer.count)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">
                  No top payers for this period.
                </p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Live Activity
                </h3>
                <p className="text-sm text-gray-500">Recent transactions</p>
              </div>
              <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
            </div>

            <div className="space-y-3">
              {currentTransactions
                .slice(-5)
                .reverse()
                .map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Receipt className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {transaction.payerName || "Unknown Payer"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction.transactionDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.paymentMethod || "Unknown Method"}
                      </p>
                    </div>
                  </div>
                ))}
              {currentTransactions.length === 0 && (
                <p className="text-gray-500 text-center py-4 text-sm">
                  No recent transactions for this period.
                </p>
              )}
            </div>
          </div>

          {/* Currencies and Payment Methods */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Currencies & Methods
                </h3>
                <p className="text-sm text-gray-500">
                  Supported payment options
                </p>
              </div>
              <CreditCard className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">
                  Active Currencies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {availableCurrencies.map((currency) => (
                    <span
                      key={currency}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        currency === selectedCurrency
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {currency}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">
                  Payment Methods
                </h4>
                <div className="space-y-2">
                  {paymentMethods.length > 0 ? (
                    paymentMethods.slice(0, 5).map((method) => (
                      <div
                        key={method.id || method.name}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-700">
                          {method.name}
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          {method.type || "N/A"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No payment methods configured.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-3 bg-white/20 rounded-xl inline-block mb-3">
                <TrendingUp className="w-8 h-8" />
              </div>
              <p className="text-white/80 text-sm mb-1">Revenue Growth</p>
              <p className="text-3xl font-bold">
                {metrics.revenueChange > 0 ? "+" : ""}
                {metrics.revenueChange.toFixed(1)}%
              </p>
            </div>

            <div className="text-center">
              <div className="p-3 bg-white/20 rounded-xl inline-block mb-3">
                <Award className="w-8 h-8" />
              </div>
              <p className="text-white/80 text-sm mb-1">
                Transaction Success Rate
              </p>
              <p className="text-3xl font-bold">100%</p>
            </div>

            <div className="text-center">
              <div className="p-3 bg-white/20 rounded-xl inline-block mb-3">
                <Flame className="w-8 h-8" />
              </div>
              <p className="text-white/80 text-sm mb-1">
                Peak Hour (
                {selectedPeriod === "today"
                  ? "Today"
                  : selectedPeriod === "week"
                  ? "This Week"
                  : "This Month"}
                )
              </p>
              <p className="text-3xl font-bold">
                {hourlyData.reduce(
                  (max, curr) => (curr.revenue > max.revenue ? curr : max),
                  hourlyData[0]
                )?.hourLabel || "--:--"}
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Value Distribution Chart */}
        <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-600" /> Transaction Value
            Distribution ({selectedCurrency},{" "}
            {selectedPeriod === "today"
              ? "Today"
              : selectedPeriod === "week"
              ? "This Week"
              : "This Month"}
            )
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={transactionValueDistributionData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  style={{ fontSize: "12px" }}
                />
                <Tooltip formatter={(value) => [value, "Transactions"]} />
                <Bar
                  dataKey="transactions"
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            Payment Methods Distribution ({selectedCurrency},{" "}
            {selectedPeriod === "today"
              ? "Today"
              : selectedPeriod === "week"
              ? "This Week"
              : "This Month"}
            )
          </h3>
          <div className="space-y-4">
            {paymentMethodsChartData.length > 0 ? (
              paymentMethodsChartData.map((method) => {
                const percentage =
                  metrics.totalRevenue > 0
                    ? (method.value / metrics.totalRevenue) * 100
                    : 0;
                return (
                  <div key={method.name} className="space-y-1.5">
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>{method.name}</span>
                      <span className="font-semibold">
                        {formatCurrency(method.value)} ({percentage.toFixed(1)}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm">
                No payment method data for this period.
              </p>
            )}
          </div>
        </div>

        {/* Branch Performance */}
        <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            Branch Performance ({selectedCurrency},{" "}
            {selectedPeriod === "today"
              ? "Today"
              : selectedPeriod === "week"
              ? "This Week"
              : "This Month"}
            )
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {branchPerformanceData.length > 0 ? (
              branchPerformanceData.map((branch) => (
                <div
                  key={branch.name}
                  className="p-4 border border-gray-200 rounded-xl bg-gray-50 hover:shadow-md transition duration-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4 text-gray-600" />
                    <span className="font-semibold text-gray-800 text-sm">
                      {branch.name}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatCurrency(branch.total)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Collections</p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-4 text-sm">
                No branch performance data for this period.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
