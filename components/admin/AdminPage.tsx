
import React, { useState, useEffect, useMemo } from 'react';
import type { CompanyInfo } from '../../types';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import FeedbackManagement from './FeedbackManagement';
import SampleManagement from './SampleManagement';
import CompanyInfoManagement from './CompanyInfoManagement';
import AdminAccountManagement from './AdminAccountManagement';
import BillingManagement from './BillingManagement';
import StatisticsPage from './StatisticsPage';
import VideoRequestManagement from './VideoRequestManagement';
import { api } from '../../services/apiService';

interface AdminPageProps {
    currentUser: string;
    onLogout: () => void;
    onCompanyInfoUpdate: () => void;
}

type AdminView = 'dashboard' | 'users' | 'feedback' | 'samples' | 'companyInfo' | 'admins' | 'billing' | 'statistics' | 'videoRequests';

interface AdminMenuItem {
    view: AdminView;
    label: string;
    icon: string;
    notification?: number;
}

const AdminPage: React.FC<AdminPageProps> = ({ currentUser, onLogout, onCompanyInfoUpdate }) => {
    const [activeView, setActiveView] = useState<AdminView>('dashboard');
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [newFeedbackCount, setNewFeedbackCount] = useState(0);
    const [pendingRequestCount, setPendingRequestCount] = useState(0);


    const updateCompanyInfo = async () => {
        const info = await api.getCompanyInfo();
        setCompanyInfo(info);
        onCompanyInfoUpdate();
    };

    useEffect(() => {
        updateCompanyInfo();
        const updateCounts = async () => {
            try {
                const [feedbackCount, requestCount] = await Promise.all([
                    api.getNewFeedbackCount(),
                    api.getPendingVideoRequestCount()
                ]);
                setNewFeedbackCount(feedbackCount);
                setPendingRequestCount(requestCount);
            } catch (error) {
                console.error("Failed to update admin notification counts:", error);
            }
        };
        updateCounts();
        const intervalId = setInterval(updateCounts, 5000);
        return () => clearInterval(intervalId);
    }, []);

    const NavItem: React.FC<AdminMenuItem> = ({ view, label, icon, notification }) => (
        <button
            onClick={() => {
                setActiveView(view);
                setIsSidebarOpen(false); // Close sidebar on selection in mobile
            }}
            className={`relative w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors text-sm font-medium ${
                activeView === view
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
                    : 'text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-800'
            }`}
        >
            <i className={`fa-solid ${icon} w-5 text-center`}></i>
            <span>{label}</span>
            {notification && notification > 0 && (
                <span className="absolute top-1/2 -translate-y-1/2 right-3 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {notification > 9 ? '9+' : notification}
                </span>
            )}
        </button>
    );

    const menuItems: AdminMenuItem[] = [
        { view: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
        { view: 'users', label: 'User Management', icon: 'fa-users' },
        { view: 'samples', label: 'Sample Management', icon: 'fa-film' },
        { view: 'videoRequests', label: 'Video Requests', icon: 'fa-video', notification: pendingRequestCount },
        { view: 'feedback', label: 'Feedback', icon: 'fa-comment-dots', notification: newFeedbackCount },
        { view: 'statistics', label: 'Statistics', icon: 'fa-chart-pie' },
        { view: 'admins', label: 'Admin Accounts', icon: 'fa-user-shield' },
        { view: 'billing', label: 'Billing & Revenue', icon: 'fa-credit-card' },
    ];
    
    const companyInfoItem: AdminMenuItem = { view: 'companyInfo', label: 'Company Info', icon: 'fa-building' };
    
    const sidebarContent = (
        <div className="flex flex-col justify-between h-full">
            <div>
                <div className="mb-8">
                    {companyInfo?.logo ? (
                        <img src={companyInfo.logo} alt="Company Logo" className="h-12 w-auto mb-2" />
                    ) : (
                       <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h2>
                    )}
                    <p className="text-sm text-gray-500 dark:text-neutral-400">Welcome, {currentUser}</p>
                </div>
                <nav className="flex flex-col gap-2">
                   {menuItems.map(item => <NavItem key={item.view} {...item} />)}
                   <hr className="my-2 border-gray-200 dark:border-neutral-800" />
                   <NavItem {...companyInfoItem} />
                </nav>
            </div>
            <div className="mt-auto pt-4">
                 <button onClick={onLogout} className="w-full bg-gray-200 dark:bg-neutral-800 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors text-sm self-center">
                    Logout
                </button>
                {companyInfo && (
                    <footer className="text-center mt-4 text-xs text-gray-400 dark:text-neutral-600 hidden lg:block">
                        <p>© {new Date().getFullYear()} {companyInfo.name}</p>
                    </footer>
                )}
            </div>
        </div>
    );

    const activeComponent = useMemo(() => {
        switch (activeView) {
            case 'dashboard': return <AdminDashboard setActiveView={setActiveView} />;
            case 'users': return <UserManagement />;
            case 'samples': return <SampleManagement />;
            case 'videoRequests': return <VideoRequestManagement />;
            case 'feedback': return <FeedbackManagement />;
            case 'statistics': return <StatisticsPage />;
            case 'admins': return <AdminAccountManagement />;
            case 'billing': return <BillingManagement />;
            case 'companyInfo': return <CompanyInfoManagement onInfoUpdate={updateCompanyInfo} />;
            default: return <AdminDashboard setActiveView={setActiveView} />;
        }
    }, [activeView]);

    return (
        <div className="min-h-screen flex bg-gray-100 dark:bg-[#282728]">
            {/* Sidebar for Desktop */}
            <aside className="w-64 bg-white dark:bg-neutral-900 p-6 hidden lg:flex flex-col justify-between border-r border-gray-200 dark:border-neutral-800 flex-shrink-0">
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar */}
             <div className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'bg-black/60' : 'bg-transparent pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)}></div>
            <aside className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-neutral-900 p-6 flex flex-col justify-between border-r border-gray-200 dark:border-neutral-800 z-50 transform transition-transform duration-300 lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                 {sidebarContent}
            </aside>

            {/* Main Content */}
            <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 mb-4 rounded-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700">
                    <i className="fa-solid fa-bars"></i>
                </button>
                <div className="container mx-auto">
                   {activeComponent}
                </div>
            </main>
        </div>
    );
};

export default AdminPage;
