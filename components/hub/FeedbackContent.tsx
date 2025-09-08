
import React, { useState, useEffect } from 'react';
import type { Feedback, FeedbackType } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/apiService';

interface FeedbackContentProps {
    currentUser: string;
    onOpenChat: (username: string) => void;
}

const FeedbackContent: React.FC<FeedbackContentProps> = ({ currentUser, onOpenChat }) => {
    const { t, tWithFallback } = useLanguage();
    const [feedbackType, setFeedbackType] = useState<FeedbackType>('Inquiry');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [myFeedback, setMyFeedback] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const loadFeedback = async () => {
        setIsLoading(true);
        const userFeedback = await api.getFeedback(currentUser);
        setMyFeedback(userFeedback.sort((a,b) => b.timestamp - a.timestamp));
        setIsLoading(false);
    };

    useEffect(() => {
        loadFeedback();
    }, [currentUser]);

    const handleToggleExpand = async (id: string) => {
        const newExpandedId = expandedId === id ? null : id;
        setExpandedId(newExpandedId);
        
        if (newExpandedId) {
            const feedbackItem = myFeedback.find(f => f.id === id);
            if (feedbackItem && feedbackItem.reply && !feedbackItem.readByUser) {
                await api.markFeedbackAsRead(id);
                loadFeedback(); // Reload to reflect the change
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) {
            alert("Please enter a message.");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.submitFeedback({
                username: currentUser,
                type: feedbackType,
                message,
            });

            setSubmitSuccess(true);
            setMessage('');
            setFeedbackType('Inquiry');
            setTimeout(() => setSubmitSuccess(false), 3000);
            await loadFeedback(); // Refresh the list

        } catch (error) {
            console.error("Failed to submit feedback:", error);
            alert("An error occurred while submitting your feedback.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const getStatusChip = (status: 'Submitted' | 'Replied') => {
        const baseClass = "px-2 py-0.5 text-xs font-semibold rounded-full";
        if (status === 'Submitted') {
            return <span className={`${baseClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`}>Submitted</span>;
        }
        return <span className={`${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>Replied</span>;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <section>
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white text-left">{tWithFallback('feedback.submitFeedback', 'Submit Feedback')}</h2>
                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="feedbackType" className="block text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">{tWithFallback('feedback.type', 'Type of Feedback')}</label>
                            <select
                                id="feedbackType"
                                value={feedbackType}
                                onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
                                className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                            >
                                <option value="Inquiry">{tWithFallback('feedback.inquiry', 'Inquiry')}</option>
                                <option value="Bug Report">{tWithFallback('feedback.bugReport', 'Bug Report')}</option>
                                <option value="Suggestion">{tWithFallback('feedback.suggestion', 'Suggestion')}</option>
                                <option value="Praise">{tWithFallback('feedback.praise', 'Praise')}</option>
                            </select>
                        </div>
                        <div>
                             <label htmlFor="message" className="block text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">{tWithFallback('feedback.message', 'Message')}</label>
                             <textarea
                                id="message"
                                rows={5}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={tWithFallback('feedback.messagePlaceholder', 'Please describe your feedback in detail...')}
                                className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                required
                             />
                        </div>
                        <div className="flex justify-end items-center gap-4">
                            {submitSuccess && <p className="text-sm text-green-600 dark:text-green-400">{tWithFallback('feedback.thankYou', 'Thank you! Your feedback has been submitted.')}</p>}
                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2.5 bg-gray-900 text-white dark:bg-white dark:text-black font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? tWithFallback('feedback.submitting', 'Submitting...') : tWithFallback('feedback.submit', 'Submit Feedback')}
                            </button>
                        </div>
                    </form>
                </div>
            </section>
            
            <section>
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white text-left">{tWithFallback('feedback.feedbackHistory', 'My Feedback History')}</h2>
                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                    {isLoading ? (
                        <p className="p-6 text-center text-gray-500 dark:text-neutral-400">{tWithFallback('feedback.loading', 'Loading feedback history...')}</p>
                    ) : myFeedback.length > 0 ? (
                         <ul className="divide-y divide-gray-200 dark:divide-neutral-800">
                             {myFeedback.map(item => (
                                 <li key={item.id}>
                                     <div 
                                        className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/50 ${item.reply && !item.readByUser ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                        onClick={() => handleToggleExpand(item.id)}
                                     >
                                         <div className="flex-grow">
                                             <p className="font-semibold text-gray-800 dark:text-neutral-200">
                                                 {item.type}
                                                 {item.reply && !item.readByUser && <span className="ml-2 text-xs font-bold text-blue-600 dark:text-blue-400">● New Reply</span>}
                                             </p>
                                             <p className="text-sm text-gray-600 dark:text-neutral-400 truncate max-w-md">{item.message}</p>
                                         </div>
                                         <div className="flex items-center gap-4 flex-shrink-0 self-end sm:self-center">
                                             <span className="text-xs text-gray-500 dark:text-neutral-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                                             {getStatusChip(item.status)}
                                         </div>
                                     </div>
                                     {expandedId === item.id && (
                                         <div className="p-6 bg-gray-50 dark:bg-neutral-800/50 border-t border-gray-200 dark:border-neutral-800 space-y-4">
                                             <div>
                                                 <h4 className="text-sm font-bold text-gray-800 dark:text-neutral-200">My Message:</h4>
                                                 <p className="text-sm text-gray-700 dark:text-neutral-300 whitespace-pre-wrap">{item.message}</p>
                                             </div>
                                             {item.reply && (
                                                  <div>
                                                      <hr className="border-gray-200 dark:border-neutral-700 my-4"/>
                                                      <div className="flex justify-between items-center">
                                                          <h4 className="text-sm font-bold text-gray-800 dark:text-neutral-200">Admin Reply:</h4>
                                                          <button onClick={() => onOpenChat('admin')} className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-md hover:bg-blue-600 transition-colors">
                                                              <i className="fa-solid fa-comments mr-2"></i>Continue in Chat
                                                          </button>
                                                      </div>
                                                      <p className="mt-2 text-sm text-gray-700 dark:text-neutral-300 whitespace-pre-wrap">{item.reply}</p>
                                                  </div>
                                             )}
                                         </div>
                                     )}
                                 </li>
                             ))}
                         </ul>
                    ) : (
                         <p className="p-6 text-center text-gray-500 dark:text-neutral-400">You haven't submitted any feedback yet.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default FeedbackContent;
