
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Feedback, FeedbackType } from '../../types';
import { api } from '../../services/apiService';

const FeedbackManagement: React.FC = () => {
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [filter, setFilter] = useState<FeedbackType | 'All'>('All');

    const fetchFeedback = useCallback(async () => {
        setIsLoading(true);
        try {
            const allFeedback = await api.getAllFeedback();
            setFeedback(allFeedback);
        } catch (error) {
            console.error("Failed to load feedback data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFeedback();
    }, [fetchFeedback]);

    const newFeedbackCounts = useMemo(() => {
        const counts: Record<FeedbackType, number> = {
            'Inquiry': 0,
            'Bug Report': 0,
            'Suggestion': 0,
            'Praise': 0,
        };
        feedback.forEach(item => {
            if (item.status === 'Submitted' && counts[item.type] !== undefined) {
                counts[item.type]++;
            }
        });
        return counts;
    }, [feedback]);
    
    const filteredFeedback = useMemo(() => {
        if (filter === 'All') return feedback;
        return feedback.filter(item => item.type === filter);
    }, [feedback, filter]);

    const handleToggleExpand = (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
            setReplyText('');
        } else {
            setExpandedId(id);
            const item = feedback.find(f => f.id === id);
            setReplyText(item?.reply || '');
        }
    };

    const handleReplySubmit = async (id: string) => {
        if (!replyText.trim()) return;
        await api.replyToFeedback(id, replyText.trim());
        await fetchFeedback(); // Refresh data
        setExpandedId(null);
        setReplyText('');
    };
    
    const getStatusChip = (status: 'Submitted' | 'Replied') => {
        const baseClass = "px-2 py-0.5 text-xs font-semibold rounded-full";
        if (status === 'Submitted') {
            return <span className={`${baseClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`}>New</span>;
        }
        return <span className={`${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>Replied</span>;
    };

    const filterTypes: (FeedbackType | 'All')[] = ['All', 'Inquiry', 'Bug Report', 'Suggestion', 'Praise'];

    if (isLoading) {
        return <div className="text-center py-10"><i className="fa-solid fa-spinner fa-spin mr-2"></i> Loading feedback...</div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Feedback Management</h1>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                 {filterTypes.map(type => {
                    const count = type !== 'All' ? newFeedbackCounts[type as FeedbackType] : 0;
                    return (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                filter === type
                                    ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
                                    : 'bg-gray-200 dark:bg-neutral-800 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-neutral-700'
                            }`}
                        >
                            {type}
                            {count > 0 && (
                                <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-md overflow-hidden">
                {filteredFeedback.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-neutral-800">
                        {filteredFeedback.map(item => (
                            <li key={item.id}>
                                <div 
                                    className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/50"
                                    onClick={() => handleToggleExpand(item.id)}
                                >
                                    <div className="flex-grow">
                                        <p className="font-semibold text-gray-800 dark:text-neutral-200">
                                            {item.type} from <span className="font-bold">@{item.username}</span>
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-neutral-400 truncate max-w-md">{item.message}</p>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0 self-end sm:self-center">
                                        <span className="text-xs text-gray-500 dark:text-neutral-500">{new Date(item.timestamp).toLocaleString()}</span>
                                        {getStatusChip(item.status)}
                                        <i className={`fa-solid fa-chevron-down text-gray-500 dark:text-neutral-500 transition-transform duration-300 ${expandedId === item.id ? 'rotate-180' : ''}`}></i>
                                    </div>
                                </div>
                                {expandedId === item.id && (
                                    <div className="p-6 bg-gray-50 dark:bg-neutral-800/50 border-t border-gray-200 dark:border-neutral-800">
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-800 dark:text-neutral-200">Full Message:</h4>
                                                <p className="text-sm text-gray-700 dark:text-neutral-300 whitespace-pre-wrap">{item.message}</p>
                                            </div>
                                            <hr className="border-gray-200 dark:border-neutral-700"/>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-800 dark:text-neutral-200 mb-2">Reply:</h4>
                                                <textarea
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    rows={4}
                                                    placeholder="Type your reply here..."
                                                    className="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                                />
                                                <div className="mt-2 flex justify-end">
                                                    <button 
                                                        onClick={() => handleReplySubmit(item.id)}
                                                        className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-black font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-neutral-200 transition-colors text-sm"
                                                    >
                                                        {item.status === 'Replied' ? 'Update Reply' : 'Send Reply'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="p-6 text-center text-gray-500 dark:text-neutral-400">No feedback matching the filter criteria.</p>
                )}
            </div>
        </div>
    );
};

export default FeedbackManagement;
