import { nanoid } from 'nanoid';

const BASE_URL = 'http://localhost:5000/api';

const apiClient = async (endpoint, method = 'GET', data = null) => {
    const token = localStorage.getItem('accessToken');
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
    };

    const url = `${BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unexpected error occurred.' }));
            throw new Error(errorData.message || 'API request failed.');
        }

        const responseText = await response.text();
        return responseText ? JSON.parse(responseText) : {};
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};

// --- AUTHENTICATION ---
export const login = (username, password) => apiClient('/login', 'POST', { username, password });
export const logout = (refreshToken) => apiClient('/logout', 'POST', { refreshToken });
export const refreshToken = (refreshToken) => apiClient('/refresh-token', 'POST', { refreshToken });
export const requestPasswordReset = (username) => apiClient('/password-reset/request', 'POST', { username });
export const resetPassword = (token, newPassword) => apiClient('/password-reset/reset', 'POST', { token, newPassword });

// --- USER MANAGEMENT ---
export const getUsers = () => apiClient('/users');
export const getUserById = (id) => apiClient(`/users/${id}`);
export const createUser = (userData) => apiClient('/users', 'POST', userData);
export const updateUser = (id, userData) => apiClient(`/users/${id}`, 'PATCH', userData);
export const deleteUser = (id) => apiClient(`/users/${id}`, 'DELETE');
export const lockUser = (id) => apiClient(`/users/${id}/lock`, 'POST');
export const unlockUser = (id) => apiClient(`/users/${id}/unlock`, 'POST');
export const checkPermission = (user, module, action) => {
    if (!user || !user.permissions[module]) {
        return false;
    }
    return user.permissions[module].includes(action);
};

// --- ROLE MANAGEMENT ---
export const getRoles = () => apiClient('/roles');
export const createRole = (roleData) => apiClient('/roles', 'POST', roleData);
export const updateRole = (id, roleData) => apiClient(`/roles/${id}`, 'PATCH', roleData);
export const deleteRole = (id) => apiClient(`/roles/${id}`, 'DELETE');

// --- BRANCH MANAGEMENT ---
export const getBranches = () => apiClient('/branches');
export const addBranch = (branchData) => apiClient('/branches', 'POST', branchData);
export const updateBranch = (code, branchData) => apiClient(`/branches/${code}`, 'PATCH', branchData);
export const deleteBranch = (code) => apiClient(`/branches/${code}`, 'DELETE');

// --- MEMBER MANAGEMENT ---
export const getMembers = (params = {}) => apiClient(`/members?${new URLSearchParams(params)}`);
export const getMemberById = (id) => apiClient(`/members/${id}`);
export const createMember = (memberData) => apiClient('/members', 'POST', memberData);
export const updateMember = (id, memberData) => apiClient(`/members/${id}`, 'PATCH', memberData);
export const deleteMember = (id) => apiClient(`/members/${id}`, 'DELETE');

// --- PROJECT MANAGEMENT ---
export const getProjects = () => apiClient('/projects');
export const getProjectById = (id) => apiClient(`/projects/${id}`);
export const createProject = (projectData) => apiClient('/projects', 'POST', projectData);
export const updateProject = (id, projectData) => apiClient(`/projects/${id}`, 'PATCH', projectData);
export const deleteProject = (id) => apiClient(`/projects/${id}`, 'DELETE');
export const getProjectMembers = (projectId) => apiClient(`/projects/${projectId}/members`);
export const getProjectContributions = (projectId) => apiClient(`/projects/${projectId}/contributions`);
export const getBranchMemberStats = (branchCode) => apiClient(`/dashboard/stats?branchCode=${branchCode}`);

// --- ASSET MANAGEMENT ---
export const getAssets = (params = {}) => apiClient(`/assets?${new URLSearchParams(params)}`);
export const getAssetById = (id) => apiClient(`/assets/${id}`);
export const createAsset = (assetData) => apiClient('/assets', 'POST', assetData);
export const updateAsset = (id, assetData) => apiClient(`/assets/${id}`, 'PATCH', assetData);
export const deleteAsset = (id) => apiClient(`/assets/${id}`, 'DELETE');

// --- EXPENDITURE MANAGEMENT ---
export const getExpenditures = (params = {}) => apiClient(`/expenditures?${new URLSearchParams(params)}`);
export const getExpenditureById = (id) => apiClient(`/expenditures/${id}`);
export const createExpenditure = (expenditureData) => apiClient('/expenditures', 'POST', expenditureData);
export const updateExpenditure = (id, expenditureData) => apiClient(`/expenditures/${id}`, 'PATCH', expenditureData);
export const deleteExpenditure = (id) => apiClient(`/expenditures/${id}`, 'DELETE');
export const approveExpenditure = (id) => apiClient(`/expenditures/${id}/approve`, 'POST');

// --- SUPPLIER MANAGEMENT ---
export const getSuppliers = (params = {}) => apiClient(`/suppliers?${new URLSearchParams(params)}`);
export const getSupplierById = (id) => apiClient(`/suppliers/${id}`);
export const createSupplier = (supplierData) => apiClient('/suppliers', 'POST', supplierData);
export const updateSupplier = (id, supplierData) => apiClient(`/suppliers/${id}`, 'PATCH', supplierData);
export const deleteSupplier = (id) => apiClient(`/suppliers/${id}`, 'DELETE');

// --- CONTRACT MANAGEMENT ---
export const getContracts = (params = {}) => apiClient(`/contracts?${new URLSearchParams(params)}`);
export const getContractById = (id) => apiClient(`/contracts/${id}`);
export const createContract = (contractData) => apiClient('/contracts', 'POST', contractData);
export const updateContract = (id, contractData) => apiClient(`/contracts/${id}`, 'PATCH', contractData);
export const deleteContract = (id) => apiClient(`/contracts/${id}`, 'DELETE');

// --- BUDGET MANAGEMENT ---
export const getBudgets = (params = {}) => apiClient(`/budget-periods?${new URLSearchParams(params)}`);
export const getBudgetById = (id) => apiClient(`/budget-periods/${id}`);
export const createBudget = (budgetData) => apiClient('/budget-periods', 'POST', budgetData);
export const updateBudget = (id, budgetData) => apiClient(`/budget-periods/${id}`, 'PATCH', budgetData);
export const deleteBudget = (id) => apiClient(`/budget-periods/${id}`, 'DELETE');
export const getBudgetLines = (budgetId) => apiClient(`/budget-periods/${budgetId}/lines`);
export const updateBudgetLine = (budgetId, lineData) => apiClient(`/budget-periods/${budgetId}/lines`, 'POST', lineData);

// --- TRANSACTIONS AND RECEIPTS ---
export const getTransactions = (params = {}) => apiClient(`/transactions?${new URLSearchParams(params)}`);
export const getTransactionById = (id) => apiClient(`/transactions/${id}`);
export const createTransaction = (transactionData) => apiClient('/transactions', 'POST', transactionData);
export const refundTransaction = (id, refundData) => apiClient(`/transactions/${id}/refund`, 'POST', refundData);

// --- CURRENCY AND PAYMENT METHODS ---
export const getCurrencies = () => apiClient('/currencies');
export const createCurrency = (currencyData) => apiClient('/currencies', 'POST', currencyData);
export const updateCurrency = (code, currencyData) => apiClient(`/currencies/${code}`, 'PATCH', currencyData);
export const deleteCurrency = (code) => apiClient(`/currencies/${code}`, 'DELETE');
export const getPaymentMethods = () => apiClient('/payment-methods');
export const createPaymentMethod = (paymentMethodData) => apiClient('/payment-methods', 'POST', paymentMethodData);
export const updatePaymentMethod = (id, paymentMethodData) => apiClient(`/payment-methods/${id}`, 'PATCH', paymentMethodData);
export const deletePaymentMethod = (id) => apiClient(`/payment-methods/${id}`, 'DELETE');
export const getCurrencyPaymentMethods = (currencyCode) => apiClient(`/currencies/${currencyCode}/payment-methods`);
export const getPaymentMethodCurrencies = (paymentMethodId) => apiClient(`/payment-methods/${paymentMethodId}/currencies`);
export const updateCurrencyPaymentMethod = (currencyCode, paymentMethodId, data) => apiClient(`/currencies/${currencyCode}/payment-methods/${paymentMethodId}`, 'PATCH', data);
export const deleteCurrencyPaymentMethod = (currencyCode, paymentMethodId) => apiClient(`/currencies/${currencyCode}/payment-methods/${paymentMethodId}`, 'DELETE');
export const updatePaymentMethodCurrency = (paymentMethodId, currencyCode, data) => apiClient(`/payment-methods/${paymentMethodId}/currencies/${currencyCode}`, 'PATCH', data);
export const deletePaymentMethodCurrency = (paymentMethodId, currencyCode) => apiClient(`/payment-methods/${paymentMethodId}/currencies/${currencyCode}`, 'DELETE');

// --- REVENUE HEADS ---
export const getRevenueHeads = () => apiClient('/revenue-heads');
export const addRevenueHead = (headData) => apiClient('/revenue-heads', 'POST', headData);
export const updateRevenueHead = (code, headData) => apiClient(`/revenue-heads/${code}`, 'PATCH', headData);
export const deleteRevenueHead = (code) => apiClient(`/revenue-heads/${code}`, 'DELETE');

// --- EXPENDITURE HEADS ---
export const getExpenditureHeads = () => apiClient('/expenditure-heads');
export const addExpenditureHead = (headData) => apiClient('/expenditure-heads', 'POST', headData);
export const updateExpenditureHead = (code, headData) => apiClient(`/expenditure-heads/${code}`, 'PATCH', headData);
export const deleteExpenditureHead = (code) => apiClient(`/expenditure-heads/${code}`, 'DELETE');

// --- REPORTS ---
export const getReport = (params = {}) => apiClient(`/reports?${new URLSearchParams(params)}`);
export const exportReport = (params = {}) => apiClient(`/reports/export?${new URLSearchParams(params)}`);

// --- EXCHANGE RATES ---
export const getExchangeRates = () => apiClient('/exchange-rates');
export const createExchangeRate = (rateData) => apiClient('/exchange-rates', 'POST', rateData);
export const updateExchangeRate = (id, rateData) => apiClient(`/exchange-rates/${id}`, 'PATCH', rateData);
export const deleteExchangeRate = (id) => apiClient(`/exchange-rates/${id}`, 'DELETE');
export const getExchangeRateById = (id) => apiClient(`/exchange-rates/${id}`);

// --- QZ TRAY ---
export const getQZCertificate = () => apiClient('/qz/certificate');
export const signQZData = (dataToSign) => apiClient('/qz/sign', 'POST', { dataToSign });