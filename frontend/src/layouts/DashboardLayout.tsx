import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar'; // The sidebar navigation

const DashboardLayout = () => {
    return (
        <div className="flex h-screen bg-gray-100">
            {/* The Navbar component is now fixed and takes up the full screen height */}
            <div className="fixed top-0 left-0 h-screen">
                <Navbar /> {/* Sidebar */}
            </div>

            {/* The main content area now accounts for the width of the fixed Navbar */}
            <main className="flex-grow p-6 overflow-auto ml-64">
                <Outlet /> {/* Renders the matched child route (e.g., DashboardPage, UserManagementPage) */}
            </main>
        </div>
    );
};

export default DashboardLayout;