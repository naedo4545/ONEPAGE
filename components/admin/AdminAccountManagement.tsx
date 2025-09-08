
import React, { useState, useEffect } from 'react';
import type { AdminAccount, AdminRole } from '../../types';
import { api } from '../../services/apiService';

const AdminAccountManagement: React.FC = () => {
    const [admins, setAdmins] = useState<AdminAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAdmins = async () => {
        setIsLoading(true);
        try {
            const adminList = await api.getAdmins();
            setAdmins(adminList);
        } catch (error) {
            console.error("Failed to load admin accounts:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleRoleChange = async (username: string, newRole: AdminRole) => {
        await api.updateAdminRole(username, newRole);
        // Refresh the list to show the change
        const updatedAdmins = admins.map(admin => admin.username === username ? {...admin, role: newRole} : admin);
        setAdmins(updatedAdmins);
    };

    if (isLoading) {
        return <div className="text-center py-10"><i className="fa-solid fa-spinner fa-spin mr-2"></i> Loading admin accounts...</div>;
    }

    const roles: AdminRole[] = ['Super Admin', 'Content Manager', 'Support Specialist', 'Read-only'];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Account Management</h1>
             <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-800">
                        <thead className="bg-gray-50 dark:bg-neutral-800/50">
                             <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Username</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Last Login</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-800">
                            {admins.map(admin => (
                                <tr key={admin.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{admin.username}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <select value={admin.role} onChange={e => handleRoleChange(admin.username, e.target.value as AdminRole)} className="bg-gray-100 dark:bg-neutral-800 border-gray-300 dark:border-neutral-700 rounded-md p-1 text-gray-900 dark:text-white">
                                            {roles.map(role => <option key={role} value={role}>{role}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-neutral-400">{new Date(admin.lastLogin).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <button className="text-red-500 hover:text-red-700" onClick={() => alert('Delete ' + admin.username)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminAccountManagement;
