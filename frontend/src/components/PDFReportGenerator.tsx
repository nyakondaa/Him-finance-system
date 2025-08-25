import React from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FileText, Download, Printer } from 'lucide-react';

// Helper functions
const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount || 0);
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// PDF Report Generator Component
const PDFReportGenerator = ({
                                transactions = [],
                                branches = [],
                                currencies = [],
                                paymentMethods = [],
                                filters = {}
                            }) => {
    // Generate all reports in one PDF
    const generateAllReports = () => {
        const doc = new jsPDF();
        const startDate = filters.startDate || new Date().toISOString().split('T')[0];
        const endDate = filters.endDate || new Date().toISOString().split('T')[0];

        // Add title page
        doc.setFontSize(20);
        doc.text('Financial Reports', 105, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text(`Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}`, 105, 30, { align: 'center' });

        if (filters.branchCode) {
            const branch = branches.find(b => b.code === filters.branchCode);
            doc.text(`Branch: ${branch ? branch.name : filters.branchCode}`, 105, 40, { align: 'center' });
        }

        doc.addPage();

        // Generate each report
        generateDailyActivityByCurrencyBranch(doc);
        doc.addPage();
        generateDailyActivityPerBranch(doc);
        doc.addPage();
        generateConsolidatedSummary(doc);

        // Save the PDF
        doc.save(`financial-reports-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // 1. Daily activity report by currency and branch with payment method breakdown
    const generateDailyActivityByCurrencyBranch = (doc) => {
        doc.setFontSize(16);
        doc.text('Daily Activity Report by Currency and Branch', 105, 20, { align: 'center' });

        // Group data by currency, then by branch, then by payment method
        const groupedData = {};

        transactions.forEach(t => {
            const currency = t.currency || 'USD';
            const branch = t.branchCode || 'Unknown';
            const paymentMethod = t.paymentMethod || 'Unknown';

            if (!groupedData[currency]) {
                groupedData[currency] = {};
            }

            if (!groupedData[currency][branch]) {
                groupedData[currency][branch] = {};
            }

            if (!groupedData[currency][branch][paymentMethod]) {
                groupedData[currency][branch][paymentMethod] = 0;
            }

            groupedData[currency][branch][paymentMethod] += parseFloat(t.amount) || 0;
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
                const tableData = paymentMethodNames.map(pm => [
                    pm,
                    formatCurrency(paymentMethodsData[pm], currency)
                ]);

                // Add branch header
                doc.setFontSize(12);
                doc.text(`Branch: ${branch}`, 14, 40 + (bIndex * 80));

                // Generate the table
                doc.autoTable({
                    startY: 45 + (bIndex * 80),
                    head: [['Payment Method', 'Amount']],
                    body: tableData,
                    theme: 'grid',
                    headStyles: { fillColor: [41, 128, 185] },
                    columnStyles: {
                        0: { cellWidth: 'auto' },
                        1: { cellWidth: 'auto', halign: 'right' }
                    },
                    margin: { left: 14 }
                });

                // Add branch total
                const branchTotal = paymentMethodNames.reduce((sum, pm) => sum + paymentMethodsData[pm], 0);
                doc.setFontSize(10);
                doc.text(`Branch Total: ${formatCurrency(branchTotal, currency)}`, 14, doc.lastAutoTable.finalY + 5);
            });
        });
    };

    // 2. Daily activity report per branch
    const generateDailyActivityPerBranch = (doc) => {
        doc.setFontSize(16);
        doc.text('Daily Activity Report per Branch', 105, 20, { align: 'center' });

        // Group data by branch, then by date
        const groupedData = {};

        transactions.forEach(t => {
            const branch = t.branchCode || 'Unknown';
            const date = t.transactionDate.split('T')[0];

            if (!groupedData[branch]) {
                groupedData[branch] = {};
            }

            if (!groupedData[branch][date]) {
                groupedData[branch][date] = 0;
            }

            groupedData[branch][date] += parseFloat(t.amount) || 0;
        });

        // Generate tables for each branch
        Object.keys(groupedData).forEach((branch, bIndex) => {
            if (bIndex > 0) doc.addPage();

            doc.setFontSize(14);
            doc.text(`Branch: ${branch}`, 14, 30);

            const dateData = groupedData[branch];
            const dates = Object.keys(dateData).sort();

            // Prepare data for the table
            const tableData = dates.map(date => [
                formatDate(date),
                formatCurrency(dateData[date])
            ]);

            // Generate the table
            doc.autoTable({
                startY: 35,
                head: [['Date', 'Amount']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [39, 174, 96] },
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    1: { cellWidth: 'auto', halign: 'right' }
                },
                margin: { left: 14 }
            });

            // Add branch total
            const branchTotal = dates.reduce((sum, date) => sum + dateData[date], 0);
            doc.setFontSize(10);
            doc.text(`Branch Total: ${formatCurrency(branchTotal)}`, 14, doc.lastAutoTable.finalY + 5);
        });
    };

    // 3. Consolidated summary report for all branches
    const generateConsolidatedSummary = (doc) => {
        doc.setFontSize(16);
        doc.text('Consolidated Summary Report', 105, 20, { align: 'center' });

        // Calculate totals by branch
        const branchTotals = {};
        let grandTotal = 0;

        transactions.forEach(t => {
            const branch = t.branchCode || 'Unknown';

            if (!branchTotals[branch]) {
                branchTotals[branch] = 0;
            }

            branchTotals[branch] += parseFloat(t.amount) || 0;
            grandTotal += parseFloat(t.amount) || 0;
        });

        // Prepare data for the table
        const tableData = Object.keys(branchTotals).map(branch => [
            branch,
            formatCurrency(branchTotals[branch])
        ]);

        // Add grand total row
        tableData.push(['GRAND TOTAL', formatCurrency(grandTotal)]);

        // Generate the table
        doc.autoTable({
            startY: 30,
            head: [['Branch', 'Total Amount']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [142, 68, 173] },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 'auto', halign: 'right' }
            },
            margin: { left: 14 },
            bodyStyles: {
                fontSize: 10,
                cellPadding: 3
            },
            didDrawCell: (data) => {
                // Style the grand total row
                if (data.row.index === tableData.length - 1) {
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);
                    doc.setFont(undefined, 'bold');
                }
            }
        });

        // Add statistics
        doc.setFontSize(12);
        doc.text('Statistics:', 14, doc.lastAutoTable.finalY + 15);

        const uniqueBranches = Object.keys(branchTotals).length;
        const transactionCount = transactions.length;
        const averagePerBranch = grandTotal / uniqueBranches;

        doc.setFontSize(10);
        doc.text(`- Number of Branches: ${uniqueBranches}`, 20, doc.lastAutoTable.finalY + 25);
        doc.text(`- Total Transactions: ${transactionCount}`, 20, doc.lastAutoTable.finalY + 35);
        doc.text(`- Average per Branch: ${formatCurrency(averagePerBranch)}`, 20, doc.lastAutoTable.finalY + 45);
    };

    return (
        <div className="flex flex-wrap gap-3 mb-6">
            <button
                onClick={generateAllReports}
                disabled={transactions.length === 0}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium"
            >
                <FileText className="w-4 h-4" />
                <span>Generate PDF Reports</span>
            </button>
        </div>
    );
};

export default PDFReportGenerator;