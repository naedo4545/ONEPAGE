
import React, { useState, useEffect, useMemo } from 'react';
import type { UserMetadata } from '../../types';
import { api } from '../../services/apiService';

interface UserData extends UserMetadata {
    username: string;
    cardCount: number;
    name: string;
    email: string;
    profilePicture: string;
}

const ITEMS_PER_PAGE = 10;

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
    const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [memoText, setMemoText] = useState('');
    const [pointsToAdd, setPointsToAdd] = useState<number | string>('');
    
    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const allUserData = await api.getAllUsersForAdmin();
            setUsers(allUserData);
        } catch (error) {
            console.error("Failed to load user data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const openMemoModal = (user: UserData) => {
        setSelectedUser(user);
        setMemoText(user.memo || '');
        setIsMemoModalOpen(true);
    };

    const openPointsModal = (user: UserData) => {
        setSelectedUser(user);
        setPointsToAdd('');
        setIsPointsModalOpen(true);
    };
    
    const openDetailsModal = (user: UserData) => {
        setSelectedUser(user);
        setIsDetailsModalOpen(true);
    };

    const handleSaveMemo = async () => {
        if (!selectedUser) return;
        await api.updateUserMemo(selectedUser.username, memoText);
        setIsMemoModalOpen(false);
        await loadUsers();
    };
    
    const handleAddPoints = async () => {
        if (!selectedUser || !pointsToAdd || +pointsToAdd === 0) return;
        const points = parseInt(String(pointsToAdd), 10);
        if (isNaN(points)) return;
        
        await api.addUserPoints(selectedUser.username, points);
        setIsPointsModalOpen(false);
        await loadUsers();
    };

    const handleDeleteUser = async (username: string) => {
        if (!window.confirm(`Are you sure you want to permanently delete user '${username}' and all their data? This action cannot be undone.`)) return;

        try {
            await api.deleteUser(username);
            await loadUsers();
        } catch (error) {
            console.error(`Failed to delete user ${username}:`, error);
            alert(`Could not delete user ${username}.`);
        }
    };

    const handleOrderStatusChange = async (username: string, newOrderStatus: UserMetadata['orderStatus']) => {
        await api.updateUserOrderStatus(username, newOrderStatus);
        await loadUsers();
    };

    const handlePaymentStatusChange = async (username: string, newPaymentStatus: UserMetadata['paymentStatus']) => {
        await api.updateUserPaymentStatus(username, newPaymentStatus);
        await loadUsers();
    };


    const filteredUsers = useMemo(() => {
        return users.filter(user => 
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    
    const exportToCSV = (usersToExport: UserData[]) => {
        const headers = ['Username', 'Name', 'Email', 'Plan', 'Card Count', 'Points', 'Join Date'];
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + usersToExport.map(u => [
                u.username,
                `"${u.name.replace(/"/g, '""')}"`, // handle commas and quotes in name
                u.email,
                u.plan,
                u.cardCount,
                u.points,
                new Date(u.joinDate).toLocaleDateString(),
            ].join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "user_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = (usersToExport: UserData[]) => {
        Promise.all([
            import('jspdf'),
            import('jspdf-autotable')
        ]).then(([{ default: jsPDF }]) => {
            const doc = new jsPDF();
            (doc as any).autoTable({
                head: [['Username', 'Name', 'Email', 'Plan', 'Cards', 'Points', 'Join Date']],
                body: usersToExport.map(u => [
                    u.username,
                    u.name,
                    u.email,
                    u.plan,
                    u.cardCount,
                    u.points,
                    new Date(u.joinDate).toLocaleDateString(),
                ]),
            });
            doc.save('user_data.pdf');
        }).catch(err => {
            console.error("Failed to load PDF export libraries", err);
            alert("Could not export to PDF. Please check the console for errors.");
        });
    };
    
    const ActionButton: React.FC<{ icon: string, title: string, onClick: () => void, className?: string }> = ({ icon, title, onClick, className="" }) => (
        <button onClick={onClick} title={title} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${className}`}>
            <i className={`fa-solid ${icon}`}></i>
        </button>
    );

    if (isLoading) {
        return <div className="text-center py-10"><i className="fa-solid fa-spinner fa-spin mr-2"></i> Loading users...</div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>

            {/* Modals */}
            {isDetailsModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setIsDetailsModalOpen(false)}>
                     <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                         <div className="p-6 border-b border-gray-200 dark:border-neutral-800 flex items-start gap-4">
                             <img src={selectedUser.profilePicture || `https://ui-avatars.com/api/?name=${selectedUser.name}&background=random`} alt={selectedUser.name} className="w-20 h-20 rounded-full object-cover bg-gray-200 dark:bg-neutral-700"/>
                             <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.name}</h2>
                                <p className="text-gray-500 dark:text-neutral-400">@{selectedUser.username}</p>
                                <p className="text-sm text-gray-600 dark:text-neutral-300 mt-1">{selectedUser.email}</p>
                             </div>
                         </div>
                         <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-md">
                                <p className="text-xs text-gray-500 dark:text-neutral-400 font-semibold">Plan</p>
                                <p className="text-gray-900 dark:text-white">{selectedUser.plan}</p>
                            </div>
                             <div className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-md">
                                <p className="text-xs text-gray-500 dark:text-neutral-400 font-semibold">Join Date</p>
                                <p className="text-gray-900 dark:text-white">{new Date(selectedUser.joinDate).toLocaleString()}</p>
                            </div>
                             <div className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-md">
                                <p className="text-xs text-gray-500 dark:text-neutral-400 font-semibold">Cards Created</p>
                                <p className="text-gray-900 dark:text-white">{selectedUser.cardCount}</p>
                            </div>
                             <div className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-md">
                                <p className="text-xs text-gray-500 dark:text-neutral-400 font-semibold">Points</p>
                                <p className="text-gray-900 dark:text-white">{selectedUser.points}</p>
                            </div>
                             <div className="sm:col-span-3 p-3 bg-gray-100 dark:bg-neutral-800 rounded-md">
                                <p className="text-xs text-gray-500 dark:text-neutral-400 font-semibold">Admin Memo</p>
                                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedUser.memo || 'No memo set.'}</p>
                            </div>
                         </div>
                         <div className="p-4 bg-gray-50 dark:bg-neutral-800/50 flex justify-end">
                            <button onClick={() => setIsDetailsModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600">Close</button>
                         </div>
                     </div>
                </div>
            )}
            {isMemoModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200 dark:border-neutral-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Memo for @{selectedUser.username}</h2>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={memoText}
                                onChange={(e) => setMemoText(e.target.value)}
                                rows={5}
                                placeholder="Add a private note for this user..."
                                className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md py-2 px-3 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-neutral-800/50 flex justify-end gap-3">
                            <button onClick={() => setIsMemoModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600">Cancel</button>
                            <button onClick={handleSaveMemo} className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-black font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-neutral-200">Save Memo</button>
                        </div>
                    </div>
                </div>
            )}
            {isPointsModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                     <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-sm">
                        <div className="p-6 border-b border-gray-200 dark:border-neutral-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Give Points to @{selectedUser.username}</h2>
                        </div>
                        <div className="p-6 space-y-2">
                             <p className="text-sm text-gray-600 dark:text-neutral-400">Current points: <strong>{selectedUser.points}</strong></p>
                             <input
                                type="number"
                                value={pointsToAdd}
                                onChange={(e) => setPointsToAdd(e.target.value)}
                                placeholder="Enter points to add (e.g., 100 or -50)"
                                className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md py-2 px-3 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-neutral-800/50 flex justify-end gap-3">
                            <button onClick={() => setIsPointsModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600">Cancel</button>
                            <button onClick={handleAddPoints} className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-black font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-neutral-200">Add Points</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-4 space-y-4">
                     <input 
                        type="text"
                        placeholder="Search by username, name, or email..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                    <div className="flex justify-end gap-3">
                        <button onClick={() => exportToCSV(filteredUsers)} className="px-4 py-2 text-sm font-semibold bg-gray-200 dark:bg-neutral-700 rounded-md hover:bg-gray-300 dark:hover:bg-neutral-600">
                           <i className="fa-solid fa-file-csv mr-2"></i>Export CSV
                        </button>
                        <button onClick={() => exportToPDF(filteredUsers)} className="px-4 py-2 text-sm font-semibold bg-gray-200 dark:bg-neutral-700 rounded-md hover:bg-gray-300 dark:hover:bg-neutral-600">
                           <i className="fa-solid fa-file-pdf mr-2"></i>Export PDF
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-800">
                        <thead className="bg-gray-50 dark:bg-neutral-800/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">User</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Order Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Payment Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Info</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Join Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-800">
                            {paginatedUsers.map(user => (
                                <tr key={user.username}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                        <div className="flex items-center gap-3">
                                            <img src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} className="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-neutral-700"/>
                                            <div>
                                                <div className="font-bold flex items-center gap-2">
                                                    {user.name}
                                                    {user.memo && <i className="fa-solid fa-note-sticky text-yellow-400" title={`Memo: ${user.memo}`}></i>}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-neutral-400">@{user.username}</div>
                                                <div className="text-xs text-gray-500 dark:text-neutral-400">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">
                                        <select
                                            value={user.orderStatus}
                                            onChange={(e) => handleOrderStatusChange(user.username, e.target.value as UserMetadata['orderStatus'])}
                                            className="bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md p-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white"
                                            aria-label={`Order Status for ${user.username}`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">
                                        <select
                                            value={user.paymentStatus}
                                            onChange={(e) => handlePaymentStatusChange(user.username, e.target.value as UserMetadata['paymentStatus'])}
                                            className="bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md p-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white"
                                            aria-label={`Payment Status for ${user.username}`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="paid">Paid</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">
                                        <div className="text-xs">
                                            <p>Cards: {user.cardCount}</p>
                                            <p>Points: {user.points}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">{new Date(user.joinDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                           <ActionButton icon="fa-eye" title="View Details" onClick={() => openDetailsModal(user)} className="hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-500" />
                                           <ActionButton icon="fa-coins" title="Give Points" onClick={() => openPointsModal(user)} className="hover:bg-yellow-100 dark:hover:bg-yellow-900/50 text-yellow-500" />
                                           <ActionButton icon="fa-pencil" title="Edit Memo" onClick={() => openMemoModal(user)} className="hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-500" />
                                           <ActionButton icon="fa-trash-can" title="Delete User" onClick={() => handleDeleteUser(user.username)} className="hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 flex items-center justify-between border-t border-gray-200 dark:border-neutral-800">
                     <p className="text-sm text-gray-700 dark:text-neutral-400">
                        Showing <span className="font-medium">{filteredUsers.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}</span> of <span className="font-medium">{filteredUsers.length}</span> results
                    </p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 text-sm rounded-md bg-gray-200 dark:bg-neutral-800 disabled:opacity-50">Previous</button>
                        <span className="text-sm text-gray-700 dark:text-neutral-400">Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 text-sm rounded-md bg-gray-200 dark:bg-neutral-800 disabled:opacity-50">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
