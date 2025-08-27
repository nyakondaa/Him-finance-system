import { nanoid } from 'nanoid';

const BASE_URL = 'http://localhost:5000/api';

const apiClient = async (
    endpoint: string,
    method: string = 'GET',
    data: any = null
) => {
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = {
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
export const login = (username: string, password: string) => apiClient('/login', 'POST', { username, password });
export const logout = (refreshToken: string) => apiClient('/logout', 'POST', { refreshToken });
export const refreshToken = (refreshToken: string) => apiClient('/refresh-token', 'POST', { refreshToken });
export const requestPasswordReset = (username: any) => apiClient('/password-reset/request', 'POST', { username });
export const resetPassword = (token: any, newPassword: any) => apiClient('/password-reset/reset', 'POST', { token, newPassword });

// --- USER MANAGEMENT ---
export const getUsers = () => apiClient('/users');
export const getUserById = (id: any) => apiClient(`/users/${id}`);
export const createUser = (userData: any) => apiClient('/users', 'POST', userData);
export const updateUser = (id: any, userData: any) => apiClient(`/users/${id}`, 'PATCH', userData);
export const deleteUser = (id: any) => apiClient(`/users/${id}`, 'DELETE');
export const lockUser = (id: any) => apiClient(`/users/${id}/lock`, 'POST');
export const unlockUser = (id: any) => apiClient(`/users/${id}/unlock`, 'POST');
export const checkPermission = (user: { permissions: { [x: string]: string | any[]; }; }, module: string, action: string) => {
    if (!user || !user.permissions[module]) {
        return false;
    }
    return user.permissions[module].includes(action);
};

// --- ROLE MANAGEMENT ---
export const getRoles = () => apiClient('/roles');
export const createRole = (roleData: any) => apiClient('/roles', 'POST', roleData);
export const updateRole = (id: any, roleData: any) => apiClient(`/roles/${id}`, 'PATCH', roleData);
export const deleteRole = (id: any) => apiClient(`/roles/${id}`, 'DELETE');

// --- BRANCH MANAGEMENT ---
export const getBranches = () => apiClient('/branches');
export const addBranch = (branchData: any) => apiClient('/branches', 'POST', branchData);
export const updateBranch = (code: any, branchData: any) => apiClient(`/branches/${code}`, 'PATCH', branchData);
export const deleteBranch = (code: any) => apiClient(`/branches/${code}`, 'DELETE');

// --- MEMBER MANAGEMENT ---
export const getMembers = (params = {}) => apiClient(`/members?${new URLSearchParams(params)}`);
export const getMemberById = (id: any) => apiClient(`/members/${id}`);
export const createMember = (memberData: any) => apiClient('/members', 'POST', memberData);
export const updateMember = (id: any, memberData: any) => apiClient(`/members/${id}`, 'PATCH', memberData);
export const deleteMember = (id: any) => apiClient(`/members/${id}`, 'DELETE');

// --- PROJECT MANAGEMENT ---
export const getProjects = () => apiClient('/projects');
export const getProjectById = (id: any) => apiClient(`/projects/${id}`);
export const createProject = (projectData: any) => apiClient('/projects', 'POST', projectData);
export const updateProject = (id: any, projectData: any) => apiClient(`/projects/${id}`, 'PATCH', projectData);
export const deleteProject = (id: any) => apiClient(`/projects/${id}`, 'DELETE');
export const getProjectMembers = (projectId: any) => apiClient(`/projects/${projectId}/members`);
export const getProjectContributions = (projectId: any) => apiClient(`/projects/${projectId}/contributions`);
export const getBranchMemberStats = (branchCode: any) => apiClient(`/dashboard/stats?branchCode=${branchCode}`);

// --- ASSET MANAGEMENT ---
export const getAssets = (params = {}) => apiClient(`/assets?${new URLSearchParams(params)}`);
export const getAssetById = (id: any) => apiClient(`/assets/${id}`);
export const createAsset = (assetData: any) => apiClient('/assets', 'POST', assetData);
export const updateAsset = (id: any, assetData: any) => apiClient(`/assets/${id}`, 'PATCH', assetData);
export const deleteAsset = (id: any) => apiClient(`/assets/${id}`, 'DELETE');

// --- EXPENDITURE MANAGEMENT ---
export const getExpenditures = (params = {}) => apiClient(`/expenditures?${new URLSearchParams(params)}`);
export const getExpenditureById = (id: any) => apiClient(`/expenditures/${id}`);
export const createExpenditure = (expenditureData: any) => apiClient('/expenditures', 'POST', expenditureData);
export const updateExpenditure = (id: any, expenditureData: any) => apiClient(`/expenditures/${id}`, 'PATCH', expenditureData);
export const deleteExpenditure = (id: any) => apiClient(`/expenditures/${id}`, 'DELETE');
export const approveExpenditure = (id: any) => apiClient(`/expenditures/${id}/approve`, 'POST');

// --- SUPPLIER MANAGEMENT ---
export const getSuppliers = (params = {}) => apiClient(`/suppliers?${new URLSearchParams(params)}`);
export const getSupplierById = (id: any) => apiClient(`/suppliers/${id}`);
export const createSupplier = (supplierData: any) => apiClient('/suppliers', 'POST', supplierData);
export const updateSupplier = (id: any, supplierData: any) => apiClient(`/suppliers/${id}`, 'PATCH', supplierData);
export const deleteSupplier = (id: any) => apiClient(`/suppliers/${id}`, 'DELETE');

// --- CONTRACT MANAGEMENT ---
export const getContracts = (params = {}) => apiClient(`/contracts?${new URLSearchParams(params)}`);
export const getContractById = (id: any) => apiClient(`/contracts/${id}`);
export const createContract = (contractData: any) => apiClient('/contracts', 'POST', contractData);
export const updateContract = (id: any, contractData: any) => apiClient(`/contracts/${id}`, 'PATCH', contractData);
export const deleteContract = (id: any) => apiClient(`/contracts/${id}`, 'DELETE');

// --- BUDGET MANAGEMENT ---
export const getBudgets = (params = {}) => apiClient(`/budget-periods?${new URLSearchParams(params)}`);
export const getBudgetById = (id: any) => apiClient(`/budget-periods/${id}`);
export const createBudget = (budgetData: any) => apiClient('/budget-periods', 'POST', budgetData);
export const updateBudget = (id: any, budgetData: any) => apiClient(`/budget-periods/${id}`, 'PATCH', budgetData);
export const deleteBudget = (id: any) => apiClient(`/budget-periods/${id}`, 'DELETE');
export const getBudgetLines = (budgetId: any) => apiClient(`/budget-periods/${budgetId}/lines`);
export const updateBudgetLine = (budgetId: any, lineData: any) => apiClient(`/budget-periods/${budgetId}/lines`, 'POST', lineData);

// --- TRANSACTIONS AND RECEIPTS ---
export const getTransactions = (params = {}) => apiClient(`/transactions?${new URLSearchParams(params)}`);
export const getTransactionById = (id: string) => apiClient(`/transactions/${id}`);
export const createTransaction = (transactionData: { payerName: string; revenueHeadCode: string; amount: number; currency: string; paymentMethod: string; branchCode: string; operatorName: any; }) => apiClient('/transactions', 'POST', transactionData);
export const refundTransaction = (id: string, refundData: { reason: string; processedBy: string; }) => apiClient(`/transactions/${id}/refund`, 'POST', refundData);

// --- CURRENCY AND PAYMENT METHODS ---
export const getCurrencies = () => apiClient('/currencies');
export const createCurrency = (currencyData: any) => apiClient('/currencies', 'POST', currencyData);
export const updateCurrency = (code: any, currencyData: any) => apiClient(`/currencies/${code}`, 'PATCH', currencyData);
export const deleteCurrency = (code: any) => apiClient(`/currencies/${code}`, 'DELETE');
export const getPaymentMethods = () => apiClient('/payment-methods');
export const createPaymentMethod = (paymentMethodData: any) => apiClient('/payment-methods', 'POST', paymentMethodData);
export const updatePaymentMethod = (id: any, paymentMethodData: any) => apiClient(`/payment-methods/${id}`, 'PATCH', paymentMethodData);
export const deletePaymentMethod = (id: any) => apiClient(`/payment-methods/${id}`, 'DELETE');
export const getCurrencyPaymentMethods = (currencyCode: any) => apiClient(`/currencies/${currencyCode}/payment-methods`);
export const getPaymentMethodCurrencies = (paymentMethodId: any) => apiClient(`/payment-methods/${paymentMethodId}/currencies`);
export const updateCurrencyPaymentMethod = (currencyCode: any, paymentMethodId: any, data: any) => apiClient(`/currencies/${currencyCode}/payment-methods/${paymentMethodId}`, 'PATCH', data);
export const deleteCurrencyPaymentMethod = (currencyCode: any, paymentMethodId: any) => apiClient(`/currencies/${currencyCode}/payment-methods/${paymentMethodId}`, 'DELETE');
export const updatePaymentMethodCurrency = (paymentMethodId: any, currencyCode: any, data: any) => apiClient(`/payment-methods/${paymentMethodId}/currencies/${currencyCode}`, 'PATCH', data);
export const deletePaymentMethodCurrency = (paymentMethodId: any, currencyCode: any) => apiClient(`/payment-methods/${paymentMethodId}/currencies/${currencyCode}`, 'DELETE');

// --- REVENUE HEADS ---
export const getRevenueHeads = () => apiClient('/revenue-heads');
export const addRevenueHead = (headData: any) => apiClient('/revenue-heads', 'POST', headData);
export const updateRevenueHead = (code: any, headData: any) => apiClient(`/revenue-heads/${code}`, 'PATCH', headData);
export const deleteRevenueHead = (code: any) => apiClient(`/revenue-heads/${code}`, 'DELETE');

// --- EXPENDITURE HEADS ---
export const getExpenditureHeads = () => apiClient('/expenditure-heads');
export const addExpenditureHead = (headData: any) => apiClient('/expenditure-heads', 'POST', headData);
export const updateExpenditureHead = (code: any, headData: any) => apiClient(`/expenditure-heads/${code}`, 'PATCH', headData);
export const deleteExpenditureHead = (code: any) => apiClient(`/expenditure-heads/${code}`, 'DELETE');

// --- REPORTS ---
export const getReport = (params = {}) => apiClient(`/reports?${new URLSearchParams(params)}`);
export const exportReport = (params = {}) => apiClient(`/reports/export?${new URLSearchParams(params)}`);

// --- EXCHANGE RATES ---
export const getExchangeRates = () => apiClient('/exchange-rates');
export const createExchangeRate = (rateData: any) => apiClient('/exchange-rates', 'POST', rateData);
export const updateExchangeRate = (id: any, rateData: any) => apiClient(`/exchange-rates/${id}`, 'PATCH', rateData);
export const deleteExchangeRate = (id: any) => apiClient(`/exchange-rates/${id}`, 'DELETE');
export const getExchangeRateById = (id: any) => apiClient(`/exchange-rates/${id}`);

// --- QZ TRAY ---
export const getQZCertificate = () => apiClient('/qz/certificate');
export const signQZData = (dataToSign: any) => apiClient('/qz/sign', 'POST', { dataToSign });