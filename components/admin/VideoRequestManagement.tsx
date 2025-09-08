
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { VideoGenerationRequest, MediaSample, DirectMessage } from '../../types';
import { api } from '../../services/apiService';

interface ChatUser {
    username: string;
    name: string;
    profilePicture: string;
}

const VideoRequestManagement: React.FC = () => {
    const [requests, setRequests] = useState<VideoGenerationRequest[]>([]);
    const [allSamples, setAllSamples] = useState<MediaSample[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'All' | VideoGenerationRequest['status']>('All');
    
    // Chat state
    const [chatModalUser, setChatModalUser] = useState<ChatUser | null>(null);
    const [allMessages, setAllMessages] = useState<DirectMessage[]>([]);
    const [messageText, setMessageText] = useState('');
    const [allUsers, setAllUsers] = useState<ChatUser[]>([]);

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [
                allRequests, 
                samples, 
                messages, 
                chatUsers
            ] = await Promise.all([
                api.getAllVideoRequests(),
                api.getSamples(),
                api.getAllMessages(),
                api.getAllChatUsers(),
            ]);
            
            setRequests(allRequests);
            setAllSamples(samples);
            setAllMessages(messages);
            setAllUsers(chatUsers);

        } catch (error) {
            console.error("Failed to load video requests management data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const filteredRequests = useMemo(() => {
        if (filter === 'All') return requests;
        return requests.filter(item => item.status === filter);
    }, [requests, filter]);

    const currentConversation = useMemo(() => {
        if (!chatModalUser) return [];
        return allMessages
            .filter(m => (m.from === 'admin' && m.to === chatModalUser.username) || (m.from === chatModalUser.username && m.to === 'admin'))
            .sort((a, b) => a.timestamp - b.timestamp);
    }, [allMessages, chatModalUser]);

    const handleStatusChange = async (id: string, newStatus: VideoGenerationRequest['status']) => {
        const updatedRequests = await api.updateVideoRequestStatus(id, newStatus);
        setRequests(updatedRequests);
    };

    const handleSendMessage = async () => {
        if (!chatModalUser || !messageText.trim()) return;
        const newMessage: Omit<DirectMessage, 'id'> = {
            from: 'admin',
            to: chatModalUser.username,
            message: messageText,
            timestamp: Date.now(),
            read: false,
        };
        const updatedMessages = await api.sendMessage(newMessage);
        setAllMessages(updatedMessages);
        setMessageText('');
    };
    
    const openChatModal = (username: string) => {
        const user = allUsers.find(u => u.username === username);
        if (user) {
            setChatModalUser(user);
        }
    };

    const getStatusChip = (status: VideoGenerationRequest['status']) => {
        const baseClass = "px-2 py-0.5 text-xs font-semibold rounded-full";
        switch (status) {
            case 'Pending': return <span className={`${baseClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`}>Pending</span>;
            case 'Approved': return <span className={`${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>Approved</span>;
            case 'Rejected': return <span className={`${baseClass} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`}>Rejected</span>;
        }
    };

    const filterTypes: ('All' | VideoGenerationRequest['status'])[] = ['All', 'Pending', 'Approved', 'Rejected'];

    if (isLoading) {
        return <div className="text-center py-10"><i className="fa-solid fa-spinner fa-spin mr-2"></i> Loading video requests...</div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Video Generation Requests</h1>
            
            {chatModalUser && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Chat with @{chatModalUser.username}</h2>
                            <button onClick={() => setChatModalUser(null)} className="p-2 -mr-2"><i className="fa-solid fa-times text-xl"></i></button>
                        </div>
                        <div className="p-4 space-y-4 flex-grow overflow-y-auto">
                           {currentConversation.map(msg => (
                               <div key={msg.id} className={`flex items-end gap-2 ${msg.from === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.from !== 'admin' && <img src={chatModalUser.profilePicture || `https://ui-avatars.com/api/?name=${chatModalUser.name}&background=random`} alt={chatModalUser.name} className="w-6 h-6 rounded-full mb-1" />}
                                    <div className={`p-3 rounded-2xl max-w-[80%] ${msg.from === 'admin' ? 'bg-gray-900 text-white dark:bg-white dark:text-black rounded-br-none' : 'bg-gray-200 dark:bg-neutral-700 rounded-bl-none'}`}>
                                        <p className="text-sm">{msg.message}</p>
                                        <p className={`text-xs mt-1 opacity-70 ${msg.from === 'admin' ? 'text-right' : 'text-left'}`}>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                               </div>
                           ))}
                        </div>
                        <div className="p-4 border-t border-gray-200 dark:border-neutral-800">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder="Type your message..."
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-grow bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg py-2 px-3 text-gray-900 dark:text-white"
                                />
                                <button onClick={handleSendMessage} className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-black font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-neutral-200 shrink-0"><i className="fa-solid fa-paper-plane"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                 {filterTypes.map(type => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                            filter === type
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
                                : 'bg-gray-200 dark:bg-neutral-800 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-neutral-700'
                        }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-800">
                         <thead className="bg-gray-50 dark:bg-neutral-800/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">User</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Inquiry Details</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-800">
                             {filteredRequests.map(req => {
                                 const selectedSampleNames = (req.selectedSampleIds || [])
                                    .map(id => allSamples.find(s => s.id === id)?.name)
                                    .filter((name): name is string => !!name);

                                return (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">@{req.username}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-neutral-300 max-w-md">
                                        <p className="break-words whitespace-pre-wrap font-semibold">Message:</p>
                                        <p className="break-words whitespace-pre-wrap mb-2">{req.prompt}</p>
                                        {selectedSampleNames.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-neutral-700">
                                                <p className="text-xs font-semibold">Interested in Samples:</p>
                                                <ul className="list-disc list-inside text-xs">
                                                    {selectedSampleNames.map(name => <li key={name}>{name}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">{new Date(req.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getStatusChip(req.status)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={req.status}
                                                onChange={(e) => handleStatusChange(req.id, e.target.value as VideoGenerationRequest['status'])}
                                                className="bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md p-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white text-gray-900 dark:text-white text-xs"
                                                aria-label={`Status for request from ${req.username}`}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Approved">Approved</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                            <button 
                                                onClick={() => openChatModal(req.username)}
                                                className="px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                            >
                                                Reply
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                             )})}
                        </tbody>
                    </table>
                     {filteredRequests.length === 0 && (
                        <p className="p-6 text-center text-gray-500 dark:text-neutral-400">No requests matching the filter criteria.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoRequestManagement;
