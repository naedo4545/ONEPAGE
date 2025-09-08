
import React, { useState, useEffect } from 'react';
import type { Feedback } from '../../types';
import { api } from '../../services/apiService';

type AdminView = 'dashboard' | 'users' | 'feedback' | 'samples' | 'companyInfo' | 'admins' | 'billing' | 'statistics' | 'videoRequests';

interface AdminDashboardProps {
    setActiveView: (view: AdminView) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ setActiveView }) => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCards: 0,
        totalPublicCards: 0,
        totalConnections: 0,
        totalFeedback: 0,
        newFeedbackCount: 0,
        totalSamples: 0,
        totalRevenue: 0,
    });
    const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            setIsLoading(true);
            try {
                const dashboardStats = await api.getDashboardStats();
                setStats(dashboardStats);
                
                const allFeedback = await api.getAllFeedback();
                setRecentFeedback(allFeedback.slice(0, 5));

            } catch (error) {
                console.error("Failed to load dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    const StatCard: React.FC<{ title: string; value: string | number; icon: string; }> = ({ title, value, icon }) => (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-neutral-400">{title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
            <div className="text-3xl text-gray-400 dark:text-neutral-500">
                <i className={`fa-solid ${icon}`}></i>
            </div>
        </div>
    );
    
    const getStatusChip = (status: 'Submitted' | 'Replied') => {
        const baseClass = "px-2 py-0.5 text-xs font-semibold rounded-full";
        if (status === 'Submitted') {
            return <span className={`${baseClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`}>New</span>;
        }
        return <span className={`${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>Replied</span>;
    };

    if (isLoading) {
        return <div className="text-center py-10"><i className="fa-solid fa-spinner fa-spin mr-2"></i> Loading dashboard...</div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Users" value={stats.totalUsers} icon="fa-users" />
                <StatCard title="Total Cards" value={stats.totalCards} icon="fa-id-card" />
                <StatCard title="Public Cards" value={stats.totalPublicCards} icon="fa-globe" />
                <StatCard title="Total Revenue" value={`$${stats.totalRevenue}`} icon="fa-dollar-sign" />
                <StatCard title="Connections" value={stats.totalConnections} icon="fa-network-wired" />
                <StatCard title="Total Samples" value={stats.totalSamples} icon="fa-film" />
                <StatCard title="Total Feedback" value={stats.totalFeedback} icon="fa-comment-dots" />
                <StatCard title="New Feedback" value={stats.newFeedbackCount} icon="fa-bell" />
            </div>

            {/* Recent Feedback */}
            <div>
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Recent Feedback</h2>
                 <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-md overflow-hidden">
                    {recentFeedback.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-neutral-800">
                            {recentFeedback.map(item => (
                                <li 
                                    key={item.id} 
                                    className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-gray-50 dark:hover:bg-neutral-800/50 cursor-pointer"
                                    onClick={() => setActiveView('feedback')}
                                    title="Go to Feedback Management"
                                >
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-neutral-200">
                                            {item.type} from <span className="font-bold">@{item.username}</span>
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-neutral-400 truncate max-w-md">{item.message}</p>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <span className="text-xs text-gray-500 dark:text-neutral-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                                        {getStatusChip(item.status)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="p-6 text-center text-gray-500 dark:text-neutral-400">No feedback has been submitted yet.</p>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
