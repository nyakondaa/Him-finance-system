// src/App.jsx
import * as React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage.tsx';
import UserManagementPage from './pages/UserManagementPage.tsx';
import RevenueHeadsPage from './pages/RevenueHeadsPage';
import ExpenditureHeadsPage from './pages/ExpenditureHeadsPage';
import ReceiptingPage from './pages/ReceiptingPage';
import ReportsPage from './pages/ReportsPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import CustomModal from './components/CustomModal';
import useModal from './hooks/useModal';
import TransactionsPage from "./pages/TransactionsPage.tsx";
import CurrencyManagementPage from "./pages/CurrencyManagementPage.tsx";
import ProjectBoardPage from "./pages/ProjectBoardPage.tsx";
import ExchangeRatePage from "./pages/ExchangeRatePage.tsx";
import MembersPage from "./pages/MenbersPage.tsx";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'

export default function App() {
    const { modalMessage, modalTitle, showConfirmButton, confirmAction, showModal, closeModal, handleConfirm } = useModal();

    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Routes */}
                <Route path="/" element={<ProtectedRoute allowedRoles={["admin", "user", "cashier", "supervisor"]} />}>
                    <Route path="/" element={<DashboardLayout />}>
                        <Route index element={<DashboardPage showModal={showModal} />} />
                        <Route path="users" element={<UserManagementPage showModal={showModal} />} />
                        <Route path="members" element={<MembersPage  />} />
                        <Route path="revenue-heads" element={<RevenueHeadsPage showModal={showModal} />} />
                        <Route path="expenditure-heads" element={<ExpenditureHeadsPage showModal={showModal} />} />
                        <Route path="transactions" element={<TransactionsPage  />} />
                        <Route path="receipting" element={<ReceiptingPage/>} />
                        <Route path="project-board" element={<ProjectBoardPage showModal={showModal}/>} />
                        <Route path="reports" element={<ReportsPage showModal={showModal} />} />
                        <Route path="settings" element={<SystemSettingsPage showModal={showModal} />} />
                        <Route path="payment-management" element={<CurrencyManagementPage showModal={showModal} />} />
                        {/*<Route path="exchange-rates" element={<ExchangeRatePage showModal={showModal} />} />*/}
                    </Route>
                </Route>

                {/* Catch-all for 404 */}
                <Route path="*" element={<div>404 Not Found</div>} />
            </Routes>

            <CustomModal
                message={modalMessage}
                title={modalTitle}
                onClose={closeModal}
                showConfirmButton={showConfirmButton}
                onConfirm={handleConfirm}
                isOpen={!!modalMessage}
            />

            <ToastContainer/>
        </AuthProvider>
    );
}
