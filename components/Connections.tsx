
import React, { useState, useEffect, useMemo } from 'react';
import type { SavedCard, DirectMessage, CompanyInfo } from '../types';
import CardPreview from './CardPreview';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/apiService';

interface ConnectionUser {
    username: string;
    name: string;
    profilePicture: string;
    title: string;
    company: string;
}

interface ConnectionRequest {
    from: string;
    to: string;
}

interface Conversation {
    username: string;
    messages: DirectMessage[];
    lastMessage: DirectMessage | null;
    unreadCount: number;
}

interface ConnectionsProps {
    currentUser: string;
    myCards: SavedCard[];
    openChatWith?: string | null;
    onChatOpened?: () => void;
    companyInfo: CompanyInfo | null;
}

const Connections: React.FC<ConnectionsProps> = ({ currentUser, myCards, openChatWith, onChatOpened, companyInfo }) => {
    const { t, tWithFallback } = useLanguage();
    const [allUsers, setAllUsers] = useState<ConnectionUser[]>([]);
    const [myConnections, setMyConnections] = useState<string[]>([]);
    const [requests, setRequests] = useState<ConnectionRequest[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [activeConversationUser, setActiveConversationUser] = useState<ConnectionUser | null>(null);
    const [messageText, setMessageText] = useState('');
    const [selectedCardId, setSelectedCardId] = useState<string | ''>('');
    const [viewingCard, setViewingCard] = useState<SavedCard | null>(null);

    const publicCards = useMemo(() => myCards.filter(c => c.isPublic), [myCards]);

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            try {
                const [
                    discoverableUsers, 
                    connections, 
                    allRequests, 
                    userMessages
                ] = await Promise.all([
                    api.getDiscoverableUsers(currentUser),
                    api.getConnections(currentUser),
                    api.getRequests(),
                    api.getMessages(currentUser)
                ]);
                
                setAllUsers(discoverableUsers);
                setMyConnections(connections);
                setRequests(allRequests);
                setMessages(userMessages);

            } catch (error) {
                console.error("Failed to fetch connection data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, [currentUser]);

    const { incomingRequests, outgoingRequestsUsernames, mutualConnections, usersToFind } = useMemo(() => {
        const incoming = requests.filter(r => r.to === currentUser);
        const outgoingUsernames = requests.filter(r => r.from === currentUser).map(r => r.to);
        
        const mutual = myConnections; // Assuming myConnections is already the list of mutual connections

        const usersToFind = allUsers.filter(user => 
            !mutual.includes(user.username) &&
            !outgoingUsernames.includes(user.username) &&
            (user.username.toLowerCase().includes(searchTerm.toLowerCase()) || user.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        return { 
            incomingRequests: incoming, 
            outgoingRequestsUsernames: outgoingUsernames,
            mutualConnections: mutual,
            usersToFind,
        };
    }, [requests, currentUser, myConnections, allUsers, searchTerm]);

     const conversations = useMemo<Conversation[]>(() => {
        const conversationsMap = new Map<string, DirectMessage[]>();
        messages.forEach(msg => {
            const otherUser = msg.from === currentUser ? msg.to : msg.from;
            if (!conversationsMap.has(otherUser)) {
                conversationsMap.set(otherUser, []);
            }
            conversationsMap.get(otherUser)!.push(msg);
        });

        mutualConnections.forEach(username => {
            if (!conversationsMap.has(username)) {
                conversationsMap.set(username, []);
            }
        });

        return Array.from(conversationsMap.entries())
            .map(([username, userMessages]) => ({
                username,
                messages: userMessages,
                lastMessage: userMessages.length > 0 ? userMessages.sort((a, b) => a.timestamp - b.timestamp)[userMessages.length - 1] : null,
                unreadCount: userMessages.filter(m => m.to === currentUser && !m.read).length
            }))
            .sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));

    }, [messages, mutualConnections, currentUser]);
    
    const handleSendRequest = async (toUser: string) => {
        const newRequests = await api.sendConnectionRequest(currentUser, toUser);
        setRequests(newRequests);
    };

    const handleCancelRequest = async (toUser: string) => {
        const newRequests = await api.cancelConnectionRequest(currentUser, toUser);
        setRequests(newRequests);
    };
    
    const handleAcceptRequest = async (fromUser: string) => {
        const [newRequests, myNewConns] = await api.acceptConnectionRequest(currentUser, fromUser);
        setRequests(newRequests);
        setMyConnections(myNewConns);
    };

    const handleDeclineRequest = async (fromUser: string) => {
        const newRequests = await api.declineConnectionRequest(currentUser, fromUser);
        setRequests(newRequests);
    };
    
    const getUserData = (username: string): ConnectionUser => {
        if (username === 'admin') {
            return {
                username: 'admin',
                name: 'Administrator',
                profilePicture: companyInfo?.logo || `https://ui-avatars.com/api/?name=Admin&background=random`,
                title: 'Support',
                company: companyInfo?.name || '',
            };
        }
        return allUsers.find(u => u.username === username) || { username, name: username, profilePicture: '', title: '', company: '' };
    };

    const markConversationAsRead = async (otherUsername: string) => {
        const updatedMessages = await api.markMessagesAsRead(currentUser, otherUsername);
        setMessages(updatedMessages);
    };
    
    const openConversationModal = (user: ConnectionUser) => {
        setActiveConversationUser(user);
        markConversationAsRead(user.username);
    };

    const handleSendMessage = async () => {
        if (!activeConversationUser || !messageText.trim()) return;
        
        const newMessage: Omit<DirectMessage, 'id'> = {
            from: currentUser,
            to: activeConversationUser.username,
            message: messageText,
            sharedCardId: selectedCardId || undefined,
            timestamp: Date.now(),
            read: false,
        };
        const updatedMessages = await api.sendMessage(newMessage);
        setMessages(updatedMessages);
        setMessageText('');
        setSelectedCardId('');
    };
    
    const handleViewSharedCard = async (message: DirectMessage) => {
        if (!message.sharedCardId) return;
        const card = await api.getCardById(message.from, message.sharedCardId);
        if(card) setViewingCard(card);
    };

    useEffect(() => {
        if (openChatWith) {
            const userToOpen = getUserData(openChatWith);
            if (userToOpen) {
                // We need to make sure the conversation list is updated before opening the modal.
                // A timeout helps ensure the state from the parent has propagated.
                setTimeout(() => openConversationModal(userToOpen), 0);
            }
            if (onChatOpened) {
                onChatOpened();
            }
        }
    }, [openChatWith]);


    const UserListItem: React.FC<{ user: ConnectionUser, children: React.ReactNode }> = ({ user, children }) => (
        <li className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg">
            <div className="flex items-center gap-4 min-w-0">
                <img src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} className="w-12 h-12 rounded-full object-cover bg-gray-200 dark:bg-neutral-700" />
                <div className="space-y-0.5 min-w-0">
                    <div className="font-bold text-gray-900 dark:text-white truncate">{user.name}</div>
                    {(user.title || user.company) && (
                        <div className="text-sm text-gray-600 dark:text-neutral-300 truncate">
                            {user.title}{user.title && user.company ? ' @ ' : ''}{user.company}
                        </div>
                    )}
                    <div className="text-sm text-gray-500 dark:text-neutral-400">@{user.username}</div>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">{children}</div>
        </li>
    );
    
    const baseButtonClass = "px-4 py-1.5 text-xs font-semibold rounded-md transition-colors";
    
    const renderModals = () => (
        <>
            {viewingCard && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setViewingCard(null)}>
                    <div className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 p-6 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <CardPreview data={viewingCard.cardData} theme={viewingCard.theme} />
                    </div>
                </div>
            )}
            {activeConversationUser && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Chat with @{activeConversationUser.username}</h2>
                            <button onClick={() => setActiveConversationUser(null)} className="p-2 -mr-2"><i className="fa-solid fa-times text-xl"></i></button>
                        </div>
                        <div className="p-4 space-y-4 flex-grow overflow-y-auto">
                           {(conversations.find(c => c.username === activeConversationUser.username)?.messages || []).map(msg => (
                               <div key={msg.id} className={`flex items-end gap-2 ${msg.from === currentUser ? 'justify-end' : 'justify-start'}`}>
                                    {msg.from !== currentUser && <img src={getUserData(msg.from).profilePicture || `https://ui-avatars.com/api/?name=${getUserData(msg.from).name}&background=random`} alt={getUserData(msg.from).name} className="w-6 h-6 rounded-full mb-1" />}
                                    <div className={`p-3 rounded-2xl max-w-[80%] ${msg.from === currentUser ? 'bg-gray-900 text-white dark:bg-white dark:text-black rounded-br-none' : 'bg-gray-200 dark:bg-neutral-700 rounded-bl-none'}`}>
                                        <p className="text-sm">{msg.message}</p>
                                        {msg.sharedCardId && (
                                            <button onClick={() => handleViewSharedCard(msg)} className={`mt-2 text-xs flex items-center gap-2 px-3 py-1.5 rounded-md ${msg.from === currentUser ? 'bg-black/20 hover:bg-black/30' : 'bg-black/10 dark:bg-black/20 hover:bg-black/20 dark:hover:bg-black/30'}`}>
                                                <i className="fa-solid fa-id-card"></i> View Shared Card
                                            </button>
                                        )}
                                        <p className={`text-xs mt-1 opacity-70 ${msg.from === currentUser ? 'text-right' : 'text-left'}`}>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                               </div>
                           ))}
                        </div>
                        <div className="p-4 border-t border-gray-200 dark:border-neutral-800 space-y-2">
                             <select value={selectedCardId} onChange={e => setSelectedCardId(e.target.value)} className="w-full text-xs bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md py-1 px-2 text-gray-900 dark:text-white">
                                <option value="">Don't attach a card</option>
                                {publicCards.map(card => (
                                    <option key={card.id} value={card.id}>Attach: {card.cardData.name}</option>
                                ))}
                            </select>
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
        </>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            {renderModals()}

            <section>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{tWithFallback('connections.findUsers', 'Find Users')}</h2>
                <input 
                    type="text"
                    placeholder={tWithFallback('connections.searchPlaceholder', 'Search for users by name or username...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white mb-4"
                />
                {isLoading ? <div className="text-center py-6"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div> : (
                    <ul className="space-y-3">
                        {usersToFind.map(user => (
                             <UserListItem key={user.username} user={user}>
                                <button onClick={() => handleSendRequest(user.username)} className={`${baseButtonClass} bg-gray-900 text-white dark:bg-white dark:text-black hover:bg-gray-700 dark:hover:bg-neutral-200`}>
                                    <i className="fa-solid fa-plus mr-2"></i>{tWithFallback('connections.connect', 'Connect')}
                                </button>
                            </UserListItem>
                        ))}
                        {outgoingRequestsUsernames.length > 0 && searchTerm.trim() === '' && <hr className="my-6 border-gray-200 dark:border-neutral-700"/>}
                        {outgoingRequestsUsernames.map(username => {
                             const user = getUserData(username);
                             if (!user || (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase()) && !user.username.toLowerCase().includes(searchTerm.toLowerCase()))) return null;
                             return (
                                <UserListItem key={username} user={user}>
                                    <button onClick={() => handleCancelRequest(username)} className={`${baseButtonClass} bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600`}>
                                        <i className="fa-solid fa-clock mr-2"></i>Request Sent
                                    </button>
                                </UserListItem>
                            )
                        })}
                        {usersToFind.length === 0 && searchTerm && outgoingRequestsUsernames.every(u => !u.toLowerCase().includes(searchTerm.toLowerCase())) && (
                             <p className="text-center text-gray-500 dark:text-neutral-400 py-4">No users found matching your search.</p>
                        )}
                    </ul>
                )}
            </section>
            
            {incomingRequests.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Connection Requests ({incomingRequests.length})</h2>
                    <ul className="space-y-3">
                        {incomingRequests.map(req => {
                            const user = getUserData(req.from);
                            return (
                                <UserListItem key={req.from} user={user}>
                                    <button onClick={() => handleAcceptRequest(req.from)} className={`${baseButtonClass} bg-green-600 text-white hover:bg-green-700`}>Accept</button>
                                    <button onClick={() => handleDeclineRequest(req.from)} className={`${baseButtonClass} bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600`}>Decline</button>
                                </UserListItem>
                            );
                        })}
                    </ul>
                </section>
            )}

            <section>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{tWithFallback('connections.conversations', 'Conversations')} ({conversations.length})</h2>
                {isLoading ? <div className="text-center py-6"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div> : conversations.length > 0 ? (
                    <div className="space-y-2">
                        {conversations.map(convo => {
                            const user = getUserData(convo.username);
                            return(
                               <div key={convo.username} onClick={() => openConversationModal(user)} className="flex items-center p-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800/50 cursor-pointer">
                                   <div className="flex items-center gap-4 flex-grow min-w-0">
                                        <img src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} className="w-12 h-12 rounded-full object-cover bg-gray-200 dark:bg-neutral-700" />
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-neutral-400 truncate">
                                                {convo.lastMessage ? (
                                                    <span>{convo.lastMessage.from === currentUser ? tWithFallback('connections.you', 'You: ') : ''}{convo.lastMessage.message}</span>
                                                ) : (
                                                    tWithFallback('connections.startConversation', `Start a conversation with @${convo.username}`)
                                                )}
                                            </p>
                                        </div>
                                   </div>
                                   <div className="flex flex-col items-end shrink-0 ml-4">
                                       <p className="text-xs text-gray-400 dark:text-neutral-500 mb-1">{convo.lastMessage ? new Date(convo.lastMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : ''}</p>
                                       {convo.unreadCount > 0 && <span className="h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-xs text-white">{convo.unreadCount}</span>}
                                   </div>
                               </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-10 px-4 bg-white dark:bg-neutral-900 border-2 border-dashed border-gray-300 dark:border-neutral-800 rounded-lg">
                        <i className="fa-solid fa-users-slash text-4xl text-gray-400 dark:text-neutral-600"></i>
                        <p className="mt-4 text-gray-500 dark:text-neutral-400">{tWithFallback('connections.noConnectionsOrMessages', 'You have no connections or messages yet.')}</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Connections;
