
import React, { useState, useEffect } from 'react';
import type { SavedCard, CompanyInfo } from '../types';
import Connections from './Connections';
import HelpContent from './hub/HelpContent';
import FeedbackContent from './hub/FeedbackContent';
import VideoSamplesContent from './hub/VideoSamplesContent';
import LanguageToggle from './LanguageToggle';
import { api } from '../services/apiService';

interface HubProps {
    currentUser: string;
    cards: SavedCard[];
    onCreate: () => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onShare: (id: string) => void;
    onLogout: () => void;
    onTogglePrivacy: (id: string) => void;
    uiTheme: 'light' | 'dark';
    onToggleUiTheme: () => void;
    companyInfo: CompanyInfo | null;
}

const Hub: React.FC<HubProps> = ({ currentUser, cards, onCreate, onEdit, onDelete, onShare, onLogout, onTogglePrivacy, uiTheme, onToggleUiTheme, companyInfo }) => {
    const [activeTab, setActiveTab] = useState('myCards');
    const [requestCount, setRequestCount] = useState(0);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const [feedbackNotificationCount, setFeedbackNotificationCount] = useState(0);
    const [openChatUser, setOpenChatUser] = useState<string | null>(null);

    useEffect(() => {
        // Poll for new notifications periodically to keep the badges updated
        const updateCounts = async () => {
            try {
                const [reqCount, msgCount, feedbackCount] = await Promise.all([
                    api.getIncomingRequestsCount(currentUser),
                    api.getUnreadMessagesCount(currentUser),
                    api.getUnreadFeedbackRepliesCount(currentUser)
                ]);
                setRequestCount(reqCount);
                setUnreadMessageCount(msgCount);
                setFeedbackNotificationCount(feedbackCount);
            } catch (error) {
                console.error("Failed to update notification counts:", error);
            }
        };
        updateCounts();
        const intervalId = setInterval(updateCounts, 5000); // Check every 5 seconds
        return () => clearInterval(intervalId);
    }, [currentUser]);

    const handleOpenChat = (username: string) => {
        setOpenChatUser(username);
        setActiveTab('connections');
    };

    const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; icon: string; notification?: number; }> = ({ active, onClick, children, icon, notification }) => (
        <button
            onClick={onClick}
            title={children as string}
            className={`relative flex-shrink-0 flex items-center justify-center sm:gap-2 px-4 py-3 -mb-px border-b-2 transition-colors duration-200 text-sm whitespace-nowrap ${
                active
                    ? 'font-bold border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'font-medium border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-neutral-700'
            }`}
        >
            <i className={`fa-solid ${icon} text-lg sm:text-base w-5 text-center`}></i>
            <span className="hidden sm:inline">{children}</span>
            {notification && notification > 0 && (
                <span className="absolute top-2 right-1 h-4 min-w-[1rem] px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    {notification > 9 ? '9+' : notification}
                </span>
            )}
        </button>
    );

    const tabs = [
        { id: 'myCards', label: 'My Cards', icon: 'fa-id-card' },
        { id: 'connections', label: 'Connections', icon: 'fa-users', notification: requestCount + unreadMessageCount },
        { id: 'samples', label: 'Media Samples', icon: 'fa-film' },
        { id: 'feedback', label: 'Feedback', icon: 'fa-comment-dots', notification: feedbackNotificationCount },
        { id: 'help', label: 'Help & Pricing', icon: 'fa-question-circle' },
    ];

    const isVideoThumbnail = (thumbnail: string) => thumbnail.startsWith('data:video') || /\.(mp4|webm|ogg)$/i.test(thumbnail);

    return (
        <div className="max-w-7xl mx-auto">
            <header className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-4 mb-6 border-b border-gray-200 dark:border-neutral-800 pb-4">
                <div className="flex items-center gap-4">
                    {companyInfo?.logo && <img src={companyInfo.logo} alt={companyInfo.name} className="h-12 w-auto" />}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{companyInfo?.name || 'My Hub'}</h1>
                        <p className="text-sm text-gray-500 dark:text-neutral-400">{companyInfo?.slogan || `Welcome, ${currentUser}!`}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3 shrink-0">
                    <LanguageToggle />
                    <button onClick={onToggleUiTheme} title={`Switch to ${uiTheme === 'dark' ? 'light' : 'dark'} mode`} className="bg-gray-200 dark:bg-neutral-800 text-gray-800 dark:text-white font-semibold py-2 px-3 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors text-sm">
                        {uiTheme === 'dark' ? <i className="fa-solid fa-sun"></i> : <i className="fa-solid fa-moon"></i>}
                    </button>
                    <button onClick={onLogout} className="bg-gray-200 dark:bg-neutral-800 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors text-sm">
                        Logout
                    </button>
                </div>
            </header>

            <nav className="mb-8 border-b border-gray-200 dark:border-neutral-800">
                <div className="flex justify-around sm:justify-center">
                    {tabs.map(tab => (
                        <TabButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} icon={tab.icon} notification={tab.notification}>
                            {tab.label}
                        </TabButton>
                    ))}
                </div>
            </nav>

            <main>
                {activeTab === 'myCards' && (
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-left">My Cards</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <button onClick={onCreate} className="flex flex-col items-center justify-center p-6 bg-white dark:bg-neutral-900 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors aspect-[3/4] text-gray-500 dark:text-neutral-500">
                                <i className="fa-solid fa-plus text-4xl"></i>
                                <span className="mt-2 font-semibold">Create New Card</span>
                            </button>
                            {cards.map(card => (
                                <div key={card.id} className="bg-gray-200 dark:bg-neutral-800 rounded-lg shadow-lg overflow-hidden relative group aspect-[3/4]">
                                    {isVideoThumbnail(card.thumbnail) ? (
                                        <video src={card.thumbnail} className="absolute inset-0 w-full h-full object-cover" muted autoPlay loop playsInline />
                                    ) : (
                                        <img src={card.thumbnail} alt={card.cardData.name} className="absolute inset-0 w-full h-full object-cover" />
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40"></div>

                                    <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center z-10">
                                         <button onClick={() => onTogglePrivacy(card.id)} className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all backdrop-blur-sm ${card.isPublic ? 'bg-green-500/50 text-white hover:bg-green-500/80' : 'bg-gray-500/50 text-white hover:bg-gray-500/80'}`} title={card.isPublic ? 'Public - Click to make private' : 'Private - Click to make public'}>
                                            <i className={`fa-solid ${card.isPublic ? 'fa-globe' : 'fa-lock'}`}></i>
                                            <span>{card.isPublic ? 'Public' : 'Private'}</span>
                                        </button>
                                        <div className="flex items-center gap-1 text-white">
                                            <button onClick={() => onEdit(card.id)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors" title="Edit"><i className="fa-solid fa-pencil"></i></button>
                                            <button onClick={() => onShare(card.id)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors" title="Share"><i className="fa-solid fa-share-alt"></i></button>
                                            <button onClick={() => onDelete(card.id)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/20 text-red-400 hover:text-red-500 transition-colors" title="Delete"><i className="fa-solid fa-trash-can"></i></button>
                                        </div>
                                    </div>
                                    
                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
                                        <h2 className="text-xl font-bold truncate" title={card.cardData.name}>
                                            {card.cardData.name}
                                        </h2>
                                        <p className="text-sm opacity-90 truncate">{card.cardData.title} @ {card.cardData.company}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === 'connections' && <Connections currentUser={currentUser} myCards={cards} companyInfo={companyInfo} openChatWith={openChatUser} onChatOpened={() => setOpenChatUser(null)} />}
                {activeTab === 'samples' && <VideoSamplesContent currentUser={currentUser} />}
                {activeTab === 'feedback' && <FeedbackContent currentUser={currentUser} onOpenChat={handleOpenChat} />}
                {activeTab === 'help' && <HelpContent />}
            </main>
        </div>
    );
};

export default Hub;
