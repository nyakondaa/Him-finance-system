import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Users,
    DollarSign,
    Receipt,
    FileText,
    Settings,
    Banknote,
    LogOut,
    Home,
    Menu,
    X,
    User,
    ChevronLeft,
    CreditCard,
    Trello,
    TrendingUp
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import './Navbar.css';

const NavItem = ({ to, icon, text, onClick, isCollapsed }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center gap-4 p-3 rounded-lg transition-all duration-300
            ${isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}
            ${isCollapsed ? 'justify-center' : ''}`
        }
    >
        <span className="flex-shrink-0">{icon}</span>
        {!isCollapsed && <span className="font-medium text-sm">{text}</span>}
    </NavLink>
);

const UserInfoCard = ({ currentUser, isCollapsed }) => (
    <div className={`p-4 bg-gray-700/30 rounded-xl transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{currentUser.username}</p>
                <p className="text-xs text-blue-300 uppercase tracking-wide">{currentUser.role}</p>
            </div>
        </div>
        {currentUser.branch && (
            <p className="text-xs text-gray-400 mt-2 border-t border-gray-600 pt-2">
                <span className="text-gray-500">Branch:</span> {currentUser.branch}
            </p>
        )}
    </div>
);

const Navbar = () => {
    const { currentUser, handleLogout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!currentUser) return null;

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);
    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    const navigationItems = [
        { to: "/", icon: <Home className="w-5 h-5" />, text: "Dashboard" },
        { to: "/receipting", icon: <Receipt className="w-5 h-5" />, text: "Receipting" },
        { to: "/reports", icon: <FileText className="w-5 h-5" />, text: "Reports" },
        { to: "/transactions", icon: <Banknote className="w-5 h-5" />, text: "Transactions" },
    ];

    const adminItems = [
        { to: "/users", icon: <Users className="w-5 h-5" />, text: "User Management" },
        { to: "/revenue-heads", icon: <DollarSign className="w-5 h-5" />, text: "Revenue Heads" },
        { to: "/expenditure-heads", icon: <Banknote className="w-5 h-5" />, text: "Expenditure Heads" },
        { to: "/members", icon: <User className="w-5 h-5" />, text: "Members" },
        { to: "/payment-management", icon: <CreditCard className="w-5 h-5" />, text: "Payment Management" },
        { to: "/exchange-rates", icon: <TrendingUp className="w-5 h-5" />, text: "Exchange Rates" },
        { to: "/project-board", icon: <Trello className="w-5 h-5" />, text: "Project Board" },
        { to: "/settings", icon: <Settings className="w-5 h-5" />, text: "System Settings" },
        
    ];

    const isAdminOrSupervisor = currentUser.role === 'admin' || currentUser.role === 'supervisor';

    const renderNavContent = (isMobile) => (
        <>
            <div className="p-4 border-b border-gray-700 flex-shrink-0">
                <UserInfoCard currentUser={currentUser} isCollapsed={isMobile ? false : isCollapsed} />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                <div className="space-y-2">
                    {navigationItems.map((item) => (
                        <NavItem
                            key={item.to}
                            to={item.to}
                            icon={item.icon}
                            text={item.text}
                            onClick={isMobile ? closeMobileMenu : undefined}
                            isCollapsed={isMobile ? false : isCollapsed}
                        />
                    ))}
                </div>

                {isAdminOrSupervisor && (
                    <>
                        <div className={`pt-4 ${isCollapsed && !isMobile ? 'hidden' : 'block'}`}>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Administration
                            </h3>
                        </div>
                        <div className="space-y-2">
                            {adminItems.map((item) => (
                                <NavItem
                                    key={item.to}
                                    to={item.to}
                                    icon={item.icon}
                                    text={item.text}
                                    onClick={isMobile ? closeMobileMenu : undefined}
                                    isCollapsed={isMobile ? false : isCollapsed}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="p-4 border-t border-gray-700 flex-shrink-0">
                <button
                    onClick={() => {
                        handleLogout();
                        if (isMobile) closeMobileMenu();
                    }}
                    className={`w-full flex items-center gap-4 p-3 rounded-lg text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-all duration-300 ${isMobile || !isCollapsed ? '' : 'justify-center'}`}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {(!isCollapsed || isMobile) && <span className="font-medium text-sm">Logout</span>}
                </button>
            </div>
        </>
    );

    return (
        <>
            <button
                onClick={toggleMobileMenu}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 text-white bg-gray-800 rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
            >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={closeMobileMenu}
                />
            )}

            <aside className={`
                hidden lg:flex flex-col bg-gray-900 text-white shadow-2xl border-r border-gray-800
                transition-all duration-300 ease-in-out
                ${isCollapsed ? 'w-[5rem]' : 'w-[16rem]'}
                h-screen
            `}>
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="p-4 flex items-center justify-between border-b border-gray-700 flex-shrink-0">
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate">
                                    HIM Admin
                                </h1>
                            </div>
                        )}
                        <button
                            onClick={toggleCollapse}
                            className={`p-2 rounded-lg transition-transform duration-300 ease-in-out hover:bg-gray-700 text-gray-400 hover:text-white ${isCollapsed ? 'rotate-180' : ''}`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    </div>

                    {renderNavContent(false)}
                </div>
            </aside>

            <aside className={`
                lg:hidden fixed top-0 left-0 h-full w-64 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    <div className="p-4 flex items-center justify-between border-b border-gray-700 flex-shrink-0">
                        <div>
                            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                HIM Admin
                            </h1>
                        </div>
                        <button
                            onClick={closeMobileMenu}
                            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    {renderNavContent(true)}
                </div>
            </aside>
        </>
    );
};

export default Navbar;