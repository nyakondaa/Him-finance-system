import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Download,
  Calendar,
  BarChart2,
  DollarSign,
  Receipt,
  TrendingUp,
  Filter,
  Eye,
  RefreshCw,
  PieChart,
  Activity,
  Clock,
  Users,
  Building,
  CreditCard,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  Star,
  Bookmark,
  Target,
  Zap,
  Archive,
  BookOpen,
  Layers,
  AlertCircle,
  Printer,
  FileSpreadsheet,
  FileX,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Pie,
} from "recharts";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// API functions
const apiClient = async (endpoint, method = "GET", data = null) => {
  const token = localStorage.getItem("accessToken");
  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  if (data && method !== "GET") {
    config.body = JSON.stringify(data);
  }

  const url = `${
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  }${endpoint}`;
  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "API request failed");
  }

  return response.json();
};

const getTransactions = async (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value);
    }
  });

  return apiClient(`/transactions?${searchParams.toString()}`);
};

const getBranches = () => apiClient("/branches");
const getRevenueHeads = () => apiClient("/revenue-heads");
const getCurrencies = () => apiClient("/currencies");
const getPaymentMethods = () => apiClient("/payment-methods");

const CHART_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#14B8A6",
  "#F43F5E",
  "#6366F1",
  "#84CC16",
  "#F97316",
];

const ITEMS_PER_PAGE = 25;

// Helper functions
const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount || 0);
};

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num || 0);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// PDF Report Generator Component
const PDFReportGenerator = ({
  transactions = [],
  branches = [],
  currencies = [],
  paymentMethods = [],
  filters = {},
  showModal,
}) => {
  // Generate all reports in one PDF
  const generateAllReports = () => {
    try {
      const doc = new jsPDF();
      const startDate =
        filters.startDate || new Date().toISOString().split("T")[0];
      const endDate = filters.endDate || new Date().toISOString().split("T")[0];

      // Add title page
      doc.setFontSize(20);
      doc.text("Financial Reports", 105, 20, { align: "center" });
      doc.setFontSize(14);
      doc.text(
        `Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}`,
        105,
        30,
        { align: "center" }
      );

      if (filters.branchCode) {
        const branch = branches.find((b) => b.code === filters.branchCode);
        doc.text(
          `Branch: ${branch ? branch.name : filters.branchCode}`,
          105,
          40,
          { align: "center" }
        );
      }

      doc.addPage();

      // Generate each report
      generateDailyActivityByCurrencyBranch(
        doc,
        transactions,
        branches,
        currencies,
        paymentMethods
      );
      doc.addPage();
      generateDailyActivityPerBranch(doc, transactions, branches);
      doc.addPage();
      generateConsolidatedSummary(doc, transactions, branches);

      // Save the PDF
      doc.save(
        `financial-reports-${new Date().toISOString().split("T")[0]}.pdf`
      );
      showModal?.("PDF reports generated successfully!", "Success");
    } catch (error) {
      showModal?.("Failed to generate PDF reports. Please try again.", "Error");
    }
  };

  return (
    <button
      onClick={generateAllReports}
      disabled={transactions.length === 0}
      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium"
    >
      <FileText className="w-4 h-4" />
      <span>Generate PDF Reports</span>
    </button>
  );
};

// 1. Daily activity report by currency and branch with payment method breakdown
const generateDailyActivityByCurrencyBranch = (
  doc,
  transactions,
  branches,
  currencies
) => {
  doc.setFontSize(16);
  doc.text("Daily Activity Report by Currency and Branch", 105, 20, {
    align: "center",
  });

  // Group data by currency, then by branch, then by payment method
  const groupedData = {};

  transactions.forEach((t) => {
    const currency = t.currency || "USD";
    const branch = t.branchCode || "Unknown";
    const paymentMethod = t.paymentMethod || "Unknown";
    const amount = parseFloat(t.amount) || 0;

    if (!groupedData[currency]) {
      groupedData[currency] = {};
    }

    if (!groupedData[currency][branch]) {
      groupedData[currency][branch] = {};
    }

    if (!groupedData[currency][branch][paymentMethod]) {
      groupedData[currency][branch][paymentMethod] = 0;
    }

    groupedData[currency][branch][paymentMethod] += amount;
  });

  // Generate tables for each currency
  Object.keys(groupedData).forEach((currency, cIndex) => {
    if (cIndex > 0) doc.addPage();

    doc.setFontSize(14);
    doc.text(`Currency: ${currency}`, 14, 30);

    const branchData = groupedData[currency];
    const branchNames = Object.keys(branchData);

    // Table for each branch in this currency
    branchNames.forEach((branch, bIndex) => {
      const paymentMethodsData = branchData[branch];
      const paymentMethodNames = Object.keys(paymentMethodsData);

      // Prepare data for the table
      const tableData = paymentMethodNames.map((pm) => [
        pm,
        formatCurrency(paymentMethodsData[pm], currency),
      ]);

      // Add branch header
      doc.setFontSize(12);
      doc.text(`Branch: ${branch}`, 14, 40 + bIndex * 80);

      // Generate the table
      doc.autoTable({
        startY: 45 + bIndex * 80,
        head: [["Payment Method", "Amount"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: "auto", halign: "right" },
        },
        margin: { left: 14 },
      });

      // Add branch total
      const branchTotal = paymentMethodNames.reduce(
        (sum, pm) => sum + paymentMethodsData[pm],
        0
      );
      doc.setFontSize(10);
      doc.text(
        `Branch Total: ${formatCurrency(branchTotal, currency)}`,
        14,
        doc.lastAutoTable.finalY + 5
      );
    });
  });
};

// 2. Daily activity report per branch
const generateDailyActivityPerBranch = (doc, transactions, branches) => {
  doc.setFontSize(16);
  doc.text("Daily Activity Report per Branch", 105, 20, { align: "center" });

  // Group data by branch, then by date
  const groupedData = {};

  transactions.forEach((t) => {
    const branch = t.branchCode || "Unknown";
    const date = t.transactionDate.split("T")[0];
    const amount = parseFloat(t.amount) || 0;

    if (!groupedData[branch]) {
      groupedData[branch] = {};
    }

    if (!groupedData[branch][date]) {
      groupedData[branch][date] = 0;
    }

    groupedData[branch][date] += amount;
  });

  // Generate tables for each branch
  Object.keys(groupedData).forEach((branch, bIndex) => {
    if (bIndex > 0) doc.addPage();

    doc.setFontSize(14);
    doc.text(`Branch: ${branch}`, 14, 30);

    const dateData = groupedData[branch];
    const dates = Object.keys(dateData).sort();

    // Prepare data for the table
    const tableData = dates.map((date) => [
      formatDate(date),
      formatCurrency(dateData[date]),
    ]);

    // Generate the table
    doc.autoTable({
      startY: 35,
      head: [["Date", "Amount"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [39, 174, 96] },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: "auto", halign: "right" },
      },
      margin: { left: 14 },
    });

    // Add branch total
    const branchTotal = dates.reduce((sum, date) => sum + dateData[date], 0);
    doc.setFontSize(10);
    doc.text(
      `Branch Total: ${formatCurrency(branchTotal)}`,
      14,
      doc.lastAutoTable.finalY + 5
    );
  });
};

// 3. Consolidated summary report for all branches
const generateConsolidatedSummary = (doc, transactions, branches) => {
  doc.setFontSize(16);
  doc.text("Consolidated Summary Report", 105, 20, { align: "center" });

  // Calculate totals by branch
  const branchTotals = {};
  let grandTotal = 0;

  transactions.forEach((t) => {
    const branch = t.branchCode || "Unknown";
    const amount = parseFloat(t.amount) || 0;

    if (!branchTotals[branch]) {
      branchTotals[branch] = 0;
    }

    branchTotals[branch] += amount;
    grandTotal += amount;
  });

  // Prepare data for the table
  const tableData = Object.keys(branchTotals).map((branch) => [
    branch,
    formatCurrency(branchTotals[branch]),
  ]);

  // Add grand total row
  tableData.push(["GRAND TOTAL", formatCurrency(grandTotal)]);

  // Generate the table
  doc.autoTable({
    startY: 30,
    head: [["Branch", "Total Amount"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [142, 68, 173] },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: "auto", halign: "right" },
    },
    margin: { left: 14 },
    bodyStyles: {
      fontSize: 10,
      cellPadding: 3,
    },
    didDrawCell: (data) => {
      // Style the grand total row
      if (data.row.index === tableData.length - 1) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, "bold");
      }
    },
  });

  // Add statistics
  doc.setFontSize(12);
  doc.text("Statistics:", 14, doc.lastAutoTable.finalY + 15);

  const uniqueBranches = Object.keys(branchTotals).length;
  const transactionCount = transactions.length;
  const averagePerBranch = grandTotal / uniqueBranches;

  doc.setFontSize(10);
  doc.text(
    `- Number of Branches: ${uniqueBranches}`,
    20,
    doc.lastAutoTable.finalY + 25
  );
  doc.text(
    `- Total Transactions: ${transactionCount}`,
    20,
    doc.lastAutoTable.finalY + 35
  );
  doc.text(
    `- Average per Branch: ${formatCurrency(averagePerBranch)}`,
    20,
    doc.lastAutoTable.finalY + 45
  );
};

const EnhancedReportsPage = ({ showModal }) => {
  // State management
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    branchCode: "",
    currency: "",
    paymentMethod: "",
    revenueHeadCode: "",
    operatorName: "",
  });

  const [activeTab, setActiveTab] = useState("report");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "transactionDate",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Calculate pagination parameters
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const limit = ITEMS_PER_PAGE;

  // Data fetching with real API
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["transactions", filters, offset, limit],
    queryFn: () =>
      getTransactions({
        ...filters,
        offset,
        limit,
      }),
    keepPreviousData: true,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: getBranches,
    staleTime: 300000,
  });

  const { data: revenueHeads = [] } = useQuery({
    queryKey: ["revenueHeads"],
    queryFn: getRevenueHeads,
    staleTime: 300000,
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ["currencies"],
    queryFn: getCurrencies,
    staleTime: 300000,
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: getPaymentMethods,
    staleTime: 300000,
  });

  // Process data for analytics
  const processedData = useMemo(() => {
    if (!transactionsData?.transactions) return null;

    const transactions = transactionsData.transactions;

    // Helper functions
    const getBranchName = (code) =>
      branches.find((b) => b.code === code)?.name || code;
    const getRevenueHeadName = (code) =>
      revenueHeads.find((h) => h.code === code)?.name || code;

    // Group by different dimensions
    const groupBy = (data, keyFn, nameFn = null) => {
      const grouped = data.reduce((acc, item) => {
        const key = keyFn(item);
        const name = nameFn ? nameFn(key) : key;
        const amount = parseFloat(item.amount) || 0;

        if (!acc[key]) {
          acc[key] = { key, name, amount: 0, count: 0 };
        }
        acc[key].amount += amount;
        acc[key].count += 1;
        return acc;
      }, {});

      return Object.values(grouped).sort((a, b) => b.amount - a.amount);
    };

    const groupByDate = (data) => {
      const grouped = data.reduce((acc, t) => {
        const date = new Date(t.transactionDate).toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = { date, amount: 0, count: 0 };
        }
        acc[date].amount += parseFloat(t.amount) || 0;
        acc[date].count += 1;
        return acc;
      }, {});

      return Object.values(grouped).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
    };

    // Calculate overview stats
    const totalAmount = transactions.reduce(
      (sum, t) => sum + (parseFloat(t.amount) || 0),
      0
    );
    const totalTransactions = transactions.length;
    const averageTransaction =
      totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    const uniquePayers = new Set(transactions.map((t) => t.payerName)).size;

    return {
      transactions,
      overview: {
        totalAmount,
        totalTransactions,
        averageTransaction,
        uniquePayers,
      },
      byBranch: groupBy(transactions, (t) => t.branchCode, getBranchName),
      byRevenueHead: groupBy(
        transactions,
        (t) => t.revenueHeadCode,
        getRevenueHeadName
      ),
      byPaymentMethod: groupBy(transactions, (t) => t.paymentMethod),
      byCurrency: groupBy(transactions, (t) => t.currency),
      byDate: groupByDate(transactions),
    };
  }, [transactionsData, branches, revenueHeads]);

  // Pagination calculations
  const totalPages = transactionsData
    ? Math.ceil(transactionsData.total / ITEMS_PER_PAGE)
    : 0;
  const startItem = offset + 1;
  const endItem = Math.min(
    offset + ITEMS_PER_PAGE,
    transactionsData?.total || 0
  );

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle sorting
  const handleSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  };

  // Generate report (refetch with current filters)
  const generateReport = async () => {
    try {
      await refetchTransactions();
      showModal?.("Report generated successfully!", "Success");
    } catch (error) {
      showModal?.("Failed to generate report. Please try again.", "Error");
    }
  };

  // Export functions
  const exportToCSV = () => {
    if (!processedData?.transactions?.length) {
      showModal?.(
        "No data to export. Please generate a report first.",
        "Warning"
      );
      return;
    }

    const csvContent = [
      [
        "Date",
        "Receipt Number",
        "Payer",
        "Branch",
        "Revenue Head",
        "Amount",
        "Currency",
        "Payment Method",
        "Operator",
      ],
      ...processedData.transactions.map((t) => [
        new Date(t.transactionDate).toLocaleDateString(),
        t.receiptNumber,
        t.payerName,
        t.branch?.name || t.branchCode,
        t.revenueHead?.name || t.revenueHeadCode,
        t.amount,
        t.currency,
        t.paymentMethod,
        t.operatorName,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      branchCode: "",
      currency: "",
      paymentMethod: "",
      revenueHeadCode: "",
      operatorName: "",
    });
    setCurrentPage(1);
    setSearchTerm("");
  };

  if (isLoadingTransactions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                <BarChart2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Financial Reports
                </h1>
                <p className="text-gray-600 mt-1">
                  Comprehensive transaction analytics and reports
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Filters */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Report Filters
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch
                </label>
                <select
                  value={filters.branchCode}
                  onChange={(e) =>
                    handleFilterChange("branchCode", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch.code} value={branch.code}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Revenue Head
                </label>
                <select
                  value={filters.revenueHeadCode}
                  onChange={(e) =>
                    handleFilterChange("revenueHeadCode", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Revenue Heads</option>
                  {revenueHeads.map((head) => (
                    <option key={head.code} value={head.code}>
                      {head.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={filters.currency}
                  onChange={(e) =>
                    handleFilterChange("currency", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Currencies</option>
                  {currencies
                    .filter((c) => c.isActive)
                    .map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.name} ({currency.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) =>
                    handleFilterChange("paymentMethod", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Payment Methods</option>
                  {paymentMethods
                    .filter((p) => p.isActive)
                    .map((method) => (
                      <option key={method.id} value={method.name}>
                        {method.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operator
                </label>
                <input
                  type="text"
                  placeholder="Enter operator name"
                  value={filters.operatorName}
                  onChange={(e) =>
                    handleFilterChange("operatorName", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={generateReport}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Generate Report</span>
              </button>

              <PDFReportGenerator
                transactions={processedData?.transactions || []}
                branches={branches}
                currencies={currencies}
                paymentMethods={paymentMethods}
                filters={filters}
                showModal={showModal}
              />

              <button
                onClick={exportToCSV}
                disabled={!processedData?.transactions?.length}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={resetFilters}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "report", label: "Transaction Report", icon: Receipt },
                { id: "analytics", label: "Analytics", icon: BarChart2 },
                { id: "summary", label: "Summary", icon: Eye },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Transaction Report Tab (Primary) */}
            {activeTab === "report" && (
              <div className="space-y-6">
                {/* Report Header with Stats */}
                {transactionsData && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 text-sm font-medium">
                            Total Records
                          </p>
                          <p className="text-2xl font-bold text-blue-700">
                            {formatNumber(transactionsData.total)}
                          </p>
                        </div>
                        <Receipt className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium">
                            Page Records
                          </p>
                          <p className="text-2xl font-bold text-green-700">
                            {formatNumber(
                              transactionsData.transactions?.length || 0
                            )}
                          </p>
                        </div>
                        <FileText className="w-8 h-8 text-green-500" />
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-600 text-sm font-medium">
                            Current Page
                          </p>
                          <p className="text-2xl font-bold text-purple-700">
                            {currentPage} of {totalPages}
                          </p>
                        </div>
                        <BookOpen className="w-8 h-8 text-purple-500" />
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-600 text-sm font-medium">
                            Showing
                          </p>
                          <p className="text-2xl font-bold text-orange-700">
                            {startItem}-{endItem}
                          </p>
                        </div>
                        <Target className="w-8 h-8 text-orange-500" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Transaction Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Transaction Details
                    </h3>
                    {transactionsData && (
                      <span className="text-sm text-gray-500">
                        Showing {startItem}-{endItem} of{" "}
                        {formatNumber(transactionsData.total)} transactions
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("transactionDate")}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Date</span>
                              {sortConfig.key === "transactionDate" &&
                                (sortConfig.direction === "asc" ? (
                                  <ArrowUp className="w-3 h-3" />
                                ) : (
                                  <ArrowDown className="w-3 h-3" />
                                ))}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Receipt #
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("payerName")}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Payer</span>
                              {sortConfig.key === "payerName" &&
                                (sortConfig.direction === "asc" ? (
                                  <ArrowUp className="w-3 h-3" />
                                ) : (
                                  <ArrowDown className="w-3 h-3" />
                                ))}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Branch
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Revenue Head
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("amount")}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Amount</span>
                              {sortConfig.key === "amount" &&
                                (sortConfig.direction === "asc" ? (
                                  <ArrowUp className="w-3 h-3" />
                                ) : (
                                  <ArrowDown className="w-3 h-3" />
                                ))}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment Method
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Operator
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactionsError && (
                          <tr>
                            <td
                              colSpan="8"
                              className="px-6 py-12 text-center text-red-600"
                            >
                              <div className="flex flex-col items-center">
                                <AlertCircle className="w-12 h-12 mb-2" />
                                <p className="font-semibold">
                                  Error loading data
                                </p>
                                <p className="text-sm">
                                  {transactionsError.message}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                        {!transactionsError &&
                        transactionsData?.transactions?.length > 0 ? (
                          transactionsData.transactions.map((t) => (
                            <tr
                              key={t.id || t.receiptNumber}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {new Date(
                                  t.transactionDate
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {t.receiptNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {t.payerName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {t.branch?.name || t.branchCode}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {t.revenueHead?.name || t.revenueHeadCode}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                                {formatCurrency(t.amount, t.currency)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {t.paymentMethod}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {t.operatorName}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="8"
                              className="px-6 py-12 text-center text-gray-500"
                            >
                              <div className="flex flex-col items-center">
                                <FileX className="w-12 h-12 mb-2 text-gray-400" />
                                <p className="font-semibold">
                                  No transactions found
                                </p>
                                <p className="text-sm">
                                  Try adjusting your filters to see results.
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4 inline-block mr-1" />
                        Previous
                      </button>
                      <span className="text-sm text-gray-700">
                        Page <span className="font-medium">{currentPage}</span>{" "}
                        of <span className="font-medium">{totalPages}</span>
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 inline-block ml-1" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div className="space-y-8">
                {!processedData ? (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="font-semibold">No data for analytics.</p>
                    <p>
                      Please generate a report to see charts and visualizations.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Revenue Over Time */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                        Revenue Over Time
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart
                          data={processedData.byDate}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(date) =>
                              new Date(date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            }
                          />
                          <YAxis
                            tickFormatter={(value) =>
                              `$${(value / 1000).toFixed(0)}k`
                            }
                          />
                          <Tooltip
                            formatter={(value, name) => [
                              formatCurrency(value),
                              "Amount",
                            ]}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#3B82F6"
                            fill="#BFDBFE"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Revenue by Branch */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Building className="w-5 h-5 mr-2 text-green-500" />
                        Revenue by Branch
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={processedData.byBranch.slice(0, 10)}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            tickFormatter={(value) =>
                              `$${(value / 1000).toFixed(0)}k`
                            }
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={100}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip
                            formatter={(value) => formatCurrency(value)}
                          />
                          <Legend />
                          <Bar dataKey="amount" fill="#10B981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Revenue by Revenue Head */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Layers className="w-5 h-5 mr-2 text-purple-500" />
                        Top Revenue Heads
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={processedData.byRevenueHead.slice(0, 10)}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10 }}
                            angle={-25}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => formatCurrency(value)}
                          />
                          <Bar dataKey="amount" fill="#8B5CF6">
                            {processedData.byRevenueHead
                              .slice(0, 10)
                              .map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    CHART_COLORS[index % CHART_COLORS.length]
                                  }
                                />
                              ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Payment Method Distribution */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2 text-yellow-500" />
                        Payment Methods
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={processedData.byPaymentMethod}
                            dataKey="amount"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#F59E0B"
                            label
                          >
                            {processedData.byPaymentMethod.map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    CHART_COLORS[index % CHART_COLORS.length]
                                  }
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip
                            formatter={(value) => formatCurrency(value)}
                          />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Summary Tab */}
            {activeTab === "summary" && (
              <div className="space-y-8">
                {!processedData ? (
                  <div className="text-center py-12 text-gray-500">
                    <Eye className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="font-semibold">No summary data available.</p>
                    <p>Please generate a report to view the summary.</p>
                  </div>
                ) : (
                  <>
                    {/* Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-2xl shadow-md border border-blue-200">
                        <DollarSign className="w-10 h-10 text-blue-600 mb-3" />
                        <p className="text-sm font-medium text-blue-800">
                          Total Revenue
                        </p>
                        <p className="text-3xl font-bold text-blue-900">
                          {formatCurrency(processedData.overview.totalAmount)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-2xl shadow-md border border-green-200">
                        <Receipt className="w-10 h-10 text-green-600 mb-3" />
                        <p className="text-sm font-medium text-green-800">
                          Total Transactions
                        </p>
                        <p className="text-3xl font-bold text-green-900">
                          {formatNumber(
                            processedData.overview.totalTransactions
                          )}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-6 rounded-2xl shadow-md border border-purple-200">
                        <Activity className="w-10 h-10 text-purple-600 mb-3" />
                        <p className="text-sm font-medium text-purple-800">
                          Avg. Transaction
                        </p>
                        <p className="text-3xl font-bold text-purple-900">
                          {formatCurrency(
                            processedData.overview.averageTransaction
                          )}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-6 rounded-2xl shadow-md border border-yellow-200">
                        <Users className="w-10 h-10 text-yellow-600 mb-3" />
                        <p className="text-sm font-medium text-yellow-800">
                          Unique Payers
                        </p>
                        <p className="text-3xl font-bold text-yellow-900">
                          {formatNumber(processedData.overview.uniquePayers)}
                        </p>
                      </div>
                    </div>

                    {/* Top Lists */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Star className="w-5 h-5 mr-2 text-yellow-500" />
                          Top 5 Branches by Revenue
                        </h3>
                        <ul className="space-y-3">
                          {processedData.byBranch
                            .slice(0, 5)
                            .map((item, index) => (
                              <li
                                key={index}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="text-gray-700">
                                  {item.name}
                                </span>
                                <span className="font-bold text-gray-900">
                                  {formatCurrency(item.amount)}
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Bookmark className="w-5 h-5 mr-2 text-blue-500" />
                          Top 5 Revenue Heads
                        </h3>
                        <ul className="space-y-3">
                          {processedData.byRevenueHead
                            .slice(0, 5)
                            .map((item, index) => (
                              <li
                                key={index}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="text-gray-700">
                                  {item.name}
                                </span>
                                <span className="font-bold text-gray-900">
                                  {formatCurrency(item.amount)}
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <PieChart className="w-5 h-5 mr-2 text-green-500" />
                          Payment Method Usage
                        </h3>
                        <ul className="space-y-3">
                          {processedData.byPaymentMethod.map((item, index) => (
                            <li
                              key={index}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-700">
                                {item.name} ({item.count} times)
                              </span>
                              <span className="font-bold text-gray-900">
                                {formatCurrency(item.amount)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedReportsPage;
