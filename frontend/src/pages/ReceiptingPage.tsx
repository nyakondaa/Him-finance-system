

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Printer,
  Receipt,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  getBranches,
  getRevenueHeads,
  createTransaction,
} from "../services/api";
import useAuth from "../hooks/useAuth.ts";

const LoadingSpinner = () => <Loader2 className="w-4 h-4 animate-spin" />;


const ReceiptingPage = () => {

  
  // Form state
  const [receipt, setReceipt] = useState({
    payerName: "",
    revenueHeadCode: "",
    amount: "",
    currency: "USD",
    paymentMethod: "Cash",
    branchCode: "",
  });

  // QZ Tray state
  const [qzConnection, setQzConnection] = useState("disconnected");
  const [qzPrinters, setQzPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [connectionAttempt, setConnectionAttempt] = useState(null);

  // Data state
  const [revenueHeads, setRevenueHeads] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Auth state
  const [user, setUser] = useState(currentUser);
  console.log({ user });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    type: "info",
  });

  // Constants
  const CURRENCIES = ["USD", "ZWL", "ZAR", "GBP"];
  const PAYMENT_METHODS = [
    "Cash",
    "Card - CBZ Bank",
    "Card - Steward Bank",
    "Ecocash",
    "One Money",
    "Telecel",
  ];

  // Check if all required fields are filled
  const isFormComplete = useMemo(() => {
    return (
      receipt.payerName.trim() &&
      receipt.revenueHeadCode &&
      receipt.amount &&
      parseFloat(receipt.amount) > 0 &&
      receipt.branchCode
    );
  }, [receipt]);

  // Get user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Set user's branch as default if available
      if (parsedUser.branchCode && !receipt.branchCode) {
        setReceipt((prev) => ({ ...prev, branchCode: parsedUser.branchCode }));
      }
    }
  }, []);

  // Fetch initial data from backend using API service
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch branches and revenue heads using API service
        const [branchesData, revenueHeadsData] = await Promise.all([
          getBranches(),
          getRevenueHeads(),
        ]);

        setBranches(branchesData);
        setRevenueHeads(revenueHeadsData);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(err.message);
        setIsLoading(false);
        showModal(err.message, "Data Loading Error", "error");
      }
    };

    fetchData();
  }, []);

  // QZ Tray connection with proper browser-based implementation
  const API_BASE_URL = "http://localhost:5000";

  // Fixed QZ Tray connection with proper callback pattern and server URLs

  /*
  const connectToQz = useCallback(async () => {
    // Check if QZ Tray is available in browser
    if (!window.qz) {
      setQzConnection("disconnected");
      showModal(
        "QZ Tray is not installed or not running. Please install and launch QZ Tray from qz.io.",
        "QZ Tray Not Found",
        "error"
      );
      return;
    }

    // If already connecting or connected, return
    if (qzConnection === "connecting" || qzConnection === "connected") {
      return;
    }

    setQzConnection("connecting");

    try {
      // Clear any previous connection attempt
      if (connectionAttempt) {
        clearTimeout(connectionAttempt);
        setConnectionAttempt(null);
      }

      // Set timeout for connection attempt
      const timeout = setTimeout(() => {
        setQzConnection("disconnected");
        showModal(
          "Connection to QZ Tray timed out. Please ensure QZ Tray is running and try again.",
          "Connection Timeout",
          "error"
        );
      }, 15000);

      setConnectionAttempt(timeout);

      // First, check if server endpoints are available
      let useSimpleMode = false;

      try {
        const certResponse = await fetch(`${API_BASE_URL}/qz/certificate`);
        if (!certResponse.ok) {
          console.warn("Certificate endpoint not available, using simple mode");
          useSimpleMode = true;
        } else {
          console.log("Certificate endpoint available, using secure mode");
        }
      } catch (error) {
        console.warn("Certificate check failed, using simple mode:", error);
        useSimpleMode = true;
      }

      // Set up security promises
      window.qz.security.setCertificatePromise(() => {
        if (useSimpleMode) {
          return Promise.resolve(""); // Empty certificate for development
        }
        return fetch(`${API_BASE_URL}/qz/certificate`).then((response) => {
          if (!response.ok) throw new Error("Failed to load certificate");
          return response.text();
        });
      });

      window.qz.security.setSignaturePromise((dataToSign) => {
        if (useSimpleMode) {
          return Promise.resolve(""); // Empty signature for development
        }
        return fetch(`${API_BASE_URL}/qz/sign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ dataToSign }),
        })
          .then((response) => {
            if (!response.ok) throw new Error("Failed to sign data");
            return response.json();
          })
          .then((data) => data.signature);
      });

      // Connect to QZ Tray
      if (!window.qz.websocket.isActive()) {
        await window.qz.websocket.connect();
        console.log("QZ Tray websocket connected");
      }

      // Clear the timeout on successful connection
      clearTimeout(timeout);
      setConnectionAttempt(null);

      // Find available printers
      console.log("Finding printers...");
      const printers = await window.qz.printers.find();
      console.log("Printers found:", printers);

      setQzPrinters(printers);
      setSelectedPrinter(printers[0] || "");
      setQzConnection("connected");

      showModal(
        `QZ Tray connected successfully! Found ${printers.length} printer(s).${
          useSimpleMode ? " (Development mode)" : ""
        }`,
        "Connection Successful",
        "success"
      );
    } catch (err) {
      console.error("QZ Tray connection error:", err);
      setQzConnection("disconnected");

      // Clear any pending timeout
      if (connectionAttempt) {
        clearTimeout(connectionAttempt);
        setConnectionAttempt(null);
      }

      let errorMessage =
        "Could not connect to QZ Tray. Please ensure QZ Tray is running and try again.";

      if (
        err.message &&
        (err.message.includes("already exists") ||
          err.message.includes("already connected"))
      ) {
        errorMessage = "QZ Tray connection already established";
        // Try to get printers anyway
        try {
          const printers = await window.qz.printers.find();
          setQzPrinters(printers);
          setSelectedPrinter(printers[0] || "");
          setQzConnection("connected");
          showModal(
            "QZ Tray reconnected successfully!",
            "Connection Successful",
            "success"
          );
          return;
        } catch (printerError) {
          console.error("Failed to get printers:", printerError);
        }
      }

      showModal(errorMessage, "Connection Error", "error");
    }
  }, [qzConnection, connectionAttempt]); // Initialize QZ connection on component mount

  */


  const connectToQz = useCallback(async () => {
  // Check if QZ Tray is available in the browser
  if (!window.qz) {
    setQzConnection("disconnected");
    showModal(
      "QZ Tray is not installed or not running. Please download and launch QZ Tray from https://qz.io/download",
      "QZ Tray Not Found",
      "error"
    );
    return;
  }

  // Already connecting or connected
  if (qzConnection === "connecting" || qzConnection === "connected") return;

  setQzConnection("connecting");

  try {
    // Set simple development mode
    window.qz.security.setCertificatePromise(() => Promise.resolve(""));
    window.qz.security.setSignaturePromise(() => Promise.resolve(""));

    // Connect to QZ Tray WebSocket
    if (!window.qz.websocket.isActive()) {
      await window.qz.websocket.connect();
      console.log("QZ Tray connected successfully (simple mode).");
    }

    // List available printers
    const printers = await window.qz.printers.find();
    console.log("Printers found:", printers);

    setQzPrinters(printers);
    setSelectedPrinter(printers[0] || "");
    setQzConnection("connected");

    showModal(
      `QZ Tray connected! Found ${printers.length} printer(s).`,
      "Connection Successful",
      "success"
    );
  } catch (err) {
    console.error("QZ Tray connection error:", err);
    setQzConnection("disconnected");
    showModal(
      "Could not connect to QZ Tray. Please ensure it is installed and running.",
      "Connection Error",
      "error"
    );
  }
}, [qzConnection]);



  useEffect(() => {
    connectToQz();

    return () => {
      // Cleanup on unmount
      if (connectionAttempt) {
        clearTimeout(connectionAttempt);
      }

      // Only disconnect if we're actually connected
      if (qzConnection === "connected" && window.qz) {
        window.qz.websocket.disconnect().catch((err) => {
          console.log("Disconnection error:", err);
        });
      }
    };
  }, []);

  // Helper functions
  const showModal = (message, title, type = "info") => {
    setModalContent({ title, message, type });
    setIsModalOpen(true);
  };

  // Print receipt function with corrected QZ Tray implementation
  const printReceipt = async (receiptData) => {
    if (qzConnection !== "connected") {
      showModal(
        "QZ Tray is not connected. Please connect to QZ Tray first.",
        "Printing Error",
        "error"
      );
      return;
    }

    if (!selectedPrinter) {
      showModal("Please select a printer.", "Printing Error", "error");
      return;
    }

    setIsPrinting(true);

    try {
      const selectedBranch = branches.find(
        (b) => b.code === receiptData.branchCode
      );
      const selectedRevenueHead = revenueHeads.find(
        (r) => r.code === receiptData.revenueHeadCode
      );

      const receiptHtml = `
            <html>
            <head>
            <style>
                body { 
                    font-family: 'Courier New', monospace; 
                    font-size: 12px; 
                    width: 80mm; 
                    margin: 0; 
                    padding: 10px; 
                    line-height: 1.4; 
                }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .large { font-size: 14px; }
                .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
                .amount-box { 
                    border: 2px solid #000; 
                    padding: 8px; 
                    margin: 10px 0; 
                    text-align: center; 
                    font-size: 16px; 
                    font-weight: bold; 
                }
                .footer { 
                    margin-top: 15px; 
                    text-align: center; 
                    font-size: 10px; 
                }
            </style>
            </head>
            <body>
                <div class="center bold large">HIM ADMINISTRATION</div>
                <div class="center">${
                  selectedBranch?.name || "Unknown Branch"
                }</div>
                <div class="divider"></div>
                
                <div><strong>Receipt #:</strong> ${
                  receiptData.receiptNumber || "N/A"
                }</div>
                <div><strong>Date:</strong> ${new Date(
                  receiptData.transactionDate || new Date()
                ).toLocaleDateString()}</div>
                <div><strong>Time:</strong> ${new Date(
                  receiptData.transactionDate || new Date()
                ).toLocaleTimeString()}</div>
                <div><strong>Payer:</strong> ${receiptData.payerName}</div>
                <div><strong>Revenue Head:</strong> ${
                  selectedRevenueHead?.name || "Unknown Head"
                }</div>
                <div><strong>Payment Method:</strong> ${
                  receiptData.paymentMethod
                }</div>
                
                <div class="divider"></div>
                
                <div class="amount-box">
                ${receiptData.currency} ${(
        parseFloat(receiptData.amount) || 0
      ).toFixed(2)}
                </div>
                
                <div class="divider"></div>
                
                <div class="footer">
                <div>Thank you for your contribution!</div>
                <div>Operator: ${receiptData.operatorName || "Unknown"}</div>
                <div>Printed: ${new Date().toLocaleString()}</div>
                </div>
            </body>
            </html>
        `;

      // Create printer configuration
      const config = window.qz.configs.create(selectedPrinter);

      // Print with proper data format
      const printData = [
        {
          type: "html",
          data: receiptHtml,
        },
      ];

      console.log("Sending to printer:", selectedPrinter);
      console.log("Print data prepared, sending to QZ Tray...");

      await window.qz.print(config, printData);

      console.log("Print job sent successfully");

      showModal(
        `Receipt printed successfully to ${selectedPrinter}!`,
        "Success",
        "success"
      );
    } catch (err) {
      console.error("Printing error:", err);

      let errorMessage =
        "Failed to print receipt. Please check printer connection and try again.";

      if (err.message && err.message.includes("printer")) {
        errorMessage = `Printer error: ${err.message}. Please check if the printer is connected and ready.`;
      } else if (err.message && err.message.includes("connection")) {
        errorMessage =
          "Connection error. Please ensure QZ Tray is running and the printer is connected.";
      }

      showModal(errorMessage, "Printing Error", "error");
    } finally {
      setIsPrinting(false);
    }
  };

  // Add this helper function to test QZ Tray without printing
  const testQzConnection = async () => {
    if (!window.qz) {
      showModal("QZ Tray is not available", "Test Failed", "error");
      return;
    }

    try {
      const isActive = window.qz.websocket.isActive();
      const printers = await window.qz.printers.find();

      showModal(
        `QZ Tray Status:\nWebSocket Active: ${isActive}\nPrinters Found: ${
          printers.length
        }\nPrinters: ${printers.join(", ") || "None"}`,
        "QZ Tray Test Results",
        "info"
      );
    } catch (error) {
      showModal(
        `QZ Tray test failed: ${error.message}`,
        "Test Failed",
        "error"
      );
    }
  };

  // Handle form submission and transaction creation
  const handleGenerateReceipt = async () => {
    if (!isFormComplete) {
      showModal(
        "Please fill in all required fields.",
        "Validation Error",
        "error"
      );
      return;
    }

    // if (!selectedPrinter) {
    //     showModal('Please select a printer.', 'Validation Error', 'error');
    //     return;
    // }

    // if (qzConnection !== 'connected') {
    //     showModal('QZ Tray is not connected. Please connect to QZ Tray first.', 'Connection Error', 'error');
    //     return;
    // }

    if (!user) {
      showModal(
        "User information not found. Please login again.",
        "Authentication Error",
        "error"
      );
      return;
    }

    // setIsPrinting(true);

    try {
      // Prepare transaction data for backend
      const transactionData = {
        payerName: receipt.payerName.trim(),
        revenueHeadCode: receipt.revenueHeadCode,
        amount: parseFloat(receipt.amount),
        currency: receipt.currency,
        paymentMethod: receipt.paymentMethod,
        branchCode: receipt.branchCode,
        operatorName: user.username, // Use authenticated user's username
      };

      // Create transaction using API service
      const createdTransaction = await createTransaction(transactionData);

      console.log("Transaction created successfully:", createdTransaction);

      // Print the receipt with the transaction data
      await printReceipt({
        ...transactionData,
        receiptNumber: createdTransaction.receiptNumber,
        transactionDate:
          createdTransaction.transactionDate || new Date().toISOString(),
      });

      // Reset form after successful submission
      setReceipt({
        payerName: "",
        revenueHeadCode: "",
        amount: "",
        currency: "USD",
        paymentMethod: "Cash",
        branchCode: user?.branchCode || "", // Keep user's branch selected
      });

      showModal(
        `Transaction recorded successfully! Receipt #: ${createdTransaction.receiptNumber}`,
        "Success",
        "success"
      );
    } catch (err) {
      console.error("Error creating transaction:", err);
      showModal(
        err.message || "Failed to create transaction and generate receipt.",
        "Transaction Error",
        "error"
      );
    } finally {
      setIsPrinting(false);
    }
  };

  // Filter revenue heads based on selected branch
  const availableRevenueHeads = receipt.branchCode
    ? revenueHeads.filter((r) => r.branchCode === receipt.branchCode)
    : revenueHeads;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading system data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8 bg-gray-50 min-h-screen flex flex-col items-center justify-center">
        <AlertCircle className="w-16 h-16 mb-4" />
        <h2 className="text-xl font-semibold mb-4">Error Loading Data</h2>
        <p className="text-sm mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Modal
        isOpen={isModalOpen}
        title={modalContent.title}
        message={modalContent.message}
        type={modalContent.type}
        onClose={() => setIsModalOpen(false)}
      />

      <div className="flex-grow p-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-8 text-gray-800 flex items-center gap-3">
            <Receipt className="w-8 h-8 text-purple-600" />
            Thermal Receipt Printing System
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-semibold mb-6 text-gray-700 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Generate Receipt
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payer's Name *
                  </label>
                  <input
                    type="text"
                    value={receipt.payerName}
                    onChange={(e) =>
                      setReceipt({ ...receipt, payerName: e.target.value })
                    }
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
                    placeholder="Enter payer's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch *
                  </label>
                  <select
                    value={receipt.branchCode}
                    onChange={(e) =>
                      setReceipt({
                        ...receipt,
                        branchCode: e.target.value,
                        revenueHeadCode: "",
                      })
                    }
                    className="w-full border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.code} value={branch.code}>
                        {branch.code} - {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Revenue Head *
                  </label>
                  <select
                    value={receipt.revenueHeadCode}
                    onChange={(e) =>
                      setReceipt({
                        ...receipt,
                        revenueHeadCode: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
                    disabled={!receipt.branchCode}
                  >
                    <option value="">Select Revenue Head</option>
                    {availableRevenueHeads.map((revenue) => (
                      <option key={revenue.code} value={revenue.code}>
                        {revenue.code} - {revenue.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={receipt.currency}
                      onChange={(e) =>
                        setReceipt({ ...receipt, currency: e.target.value })
                      }
                      className="w-full border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
                    >
                      {CURRENCIES.map((currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      value={receipt.amount}
                      onChange={(e) =>
                        setReceipt({ ...receipt, amount: e.target.value })
                      }
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={receipt.paymentMethod}
                    onChange={(e) =>
                      setReceipt({ ...receipt, paymentMethod: e.target.value })
                    }
                    className="w-full border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Printer *
                  </label>
                  <select
                    value={selectedPrinter}
                    onChange={(e) => setSelectedPrinter(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
                    disabled={qzConnection !== "connected"}
                  >
                    <option value="">Select Printer</option>
                    {qzPrinters.map((printer) => (
                      <option key={printer} value={printer}>
                        {printer}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 text-sm">
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-2 ${
                          qzConnection === "connected"
                            ? "bg-green-500"
                            : qzConnection === "connecting"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      <span>
                        QZ Tray:{" "}
                        {qzConnection === "connected"
                          ? "Connected"
                          : qzConnection === "connecting"
                          ? "Connecting..."
                          : "Disconnected"}
                      </span>
                    </div>
                    <button
                      onClick={connectToQz}
                      disabled={qzConnection === "connecting"}
                      className="text-sm text-blue-500 hover:text-blue-700 disabled:text-gray-400 mt-1 flex items-center"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      {qzConnection === "connecting"
                        ? "Connecting..."
                        : "Reconnect"}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleGenerateReceipt}
                  // disabled={isPrinting || !isFormComplete || !selectedPrinter || qzConnection !== 'connected'}
                  disabled={!isFormComplete}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isPrinting ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Processing...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-5 h-5 mr-2" />
                      Generate & Print Receipt
                    </>
                  )}
                </button>
              </div>
            </div>

            
            <div className="bg-gray-50 p-8 rounded-xl shadow-inner">
              <h3 className="text-xl font-semibold mb-6 text-gray-700">
                Receipt Preview
              </h3>
              {isFormComplete ? (
                <div className="bg-white p-6 border-2 border-dashed border-gray-300 font-mono text-sm rounded-lg max-w-sm mx-auto">
                  <div className="text-center mb-4">
                    <h3 className="font-bold text-lg text-gray-800">
                      HIM ADMINISTRATION
                    </h3>
                    <p className="text-gray-600 text-xs">
                      {branches.find((b) => b.code === receipt.branchCode)
                        ?.name || "Unknown Branch"}
                    </p>
                  </div>

                  <div className="border-b border-dashed border-gray-300 mb-4"></div>

                  <div className="space-y-1 mb-4 text-gray-700 text-xs">
                    <div className="flex justify-between">
                      <strong>Receipt #:</strong>
                      <span>PREVIEW</span>
                    </div>
                    <div className="flex justify-between">
                      <strong>Date:</strong>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <strong>Time:</strong>
                      <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <strong>Payer:</strong>
                      <span className="truncate ml-2">{receipt.payerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <strong>Revenue Head:</strong>
                      <span className="truncate ml-2">
                        {revenueHeads.find(
                          (r) => r.code === receipt.revenueHeadCode
                        )?.name || "Unknown Head"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <strong>Payment:</strong>
                      <span>{receipt.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="border-b border-dashed border-gray-300 mb-4"></div>

                  <div className="text-2xl font-bold text-center mt-6 mb-6 p-3 bg-blue-50 text-blue-800 rounded-md border-2 border-solid border-blue-200">
                    {receipt.currency}{" "}
                    {(parseFloat(receipt.amount) || 0).toFixed(2)}
                  </div>

                  <div className="border-b border-dashed border-gray-300 mb-4"></div>

                  <div className="text-center text-xs text-gray-500">
                    <p>Thank you for your contribution!</p>
                    <p className="mt-1">
                      Operator: {user?.username || "Current User"}
                    </p>
                    <p className="mt-1">
                      Printed: {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 p-8">
                  <Receipt className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Fill out all required fields to see receipt preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Modal = ({ isOpen, title, message, type, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center mb-4">
          {type === "success" ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (
            <AlertCircle
              className={`w-6 h-6 ${
                type === "error" ? "text-red-500" : "text-blue-500"
              }`}
            />
          )}
          <h3 className="text-xl font-bold ml-3 text-gray-800">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};




export default ReceiptingPage;

