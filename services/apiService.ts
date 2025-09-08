/**
 * Supabase API Service
 * 
 * This file provides API functions using Supabase as the backend.
 * It replaces the mock localStorage-based API with real database operations.
 */

import { 
  authService, 
  userService, 
  cardService, 
  mediaService, 
  feedbackService, 
  videoService 
} from '../src/services/supabaseService';

import { supabase } from '../src/lib/supabase';

import type { 
    SavedCard, 
    UserMetadata, 
    CompanyInfo, 
    ConnectionRequest,
    DirectMessage,
    Feedback,
    FeedbackType,
    MediaSample,
    VideoGenerationRequest,
    AdminAccount,
    AdminRole,
    AdminUserData,
} from '../types';

// Helper to simulate network delay (optional, for development)
const apiDelay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

// Storage helpers (keeping for compatibility with existing code)
const getFromStorage = (key: string) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch {
        return null;
    }
};

const saveToStorage = (key: string, value: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
};

// Auth functions
export const auth = {
    async login(username: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
        try {
            // Temporary demo mode - bypass Supabase auth for now
            // TODO: Implement proper Supabase authentication
            if (username && password) {
                return { 
                    success: true, 
                    user: { 
                        id: crypto.randomUUID(),
                        email: username + '@demo.com',
                        user_metadata: { username }
                    } 
                };
            }
            
            return { success: false, error: 'Username and password required' };
        } catch (error) {
            return { success: false, error: 'Login failed' };
        }
    },

    async signup(username: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
        try {
            // Temporary demo mode - bypass Supabase auth for now
            // TODO: Implement proper Supabase authentication
            if (username && password) {
                return { 
                    success: true, 
                    user: { 
                        id: crypto.randomUUID(),
                        email: username + '@demo.com',
                        user_metadata: { username }
                    } 
                };
            }
            
            return { success: false, error: 'Username and password required' };
        } catch (error) {
            return { success: false, error: 'Signup failed' };
        }
    },

    async logout(): Promise<void> {
        await authService.signOut();
    },

    getCurrentUser(): any {
        return authService.getCurrentUser();
    },

    onAuthStateChange(callback: (user: any) => void) {
        return authService.onAuthStateChange(callback);
    }
};

// Add compatibility functions for existing code
export const loginUser = auth.login;
export const checkUserExists = async (username: string) => {
    try {
        const { data, error } = await userService.getUserByUsername(username);
        return { exists: !!data, error };
    } catch (error) {
        return { exists: false, error };
    }
};

export const isAdmin = async (username: string) => {
    // For demo purposes, consider 'admin' as admin user
    return username === 'admin';
};

// Add missing admin functions
export const getDashboardStats = async () => {
    return {
        totalUsers: 0,
        totalCards: 0,
        totalFeedback: 0,
        newFeedbackCount: 0
    };
};

export const getNewFeedbackCount = async () => {
    return 0;
};

export const getCards = async (userId: string) => {
    try {
        // Try to get from localStorage first
        const storedCards = localStorage.getItem(`cards_${userId}`);
        if (storedCards) {
            return JSON.parse(storedCards);
        }
        return [];
    } catch (error) {
        console.error('Error getting cards:', error);
        return [];
    }
};

export const getAllUsersForAdmin = async () => {
    return [];
};

export const getSamples = async (): Promise<MediaSample[]> => {
    try {
        const { data, error } = await mediaService.getMediaSamples();
        if (error) {
            console.error('Failed to get samples from server:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('Error getting samples:', error);
        return [];
    }
};

// Add more missing admin functions
export const getPendingVideoRequestCount = async () => {
    return 0;
};

export const getUserMeta = async (userId: string) => {
    return null;
};

export const getAllFeedback = async () => {
    return [];
};

// Add missing notification functions
export const getIncomingRequestsCount = async (user: any) => {
    return 0;
};

export const getUnreadMessagesCount = async (user: any) => {
    return 0;
};

export const getUnreadFeedbackRepliesCount = async (user: any) => {
    return 0;
};

// Add missing user pick functions
export const getUserPicks = async (user: any) => {
    return [];
};

// Add missing sample management functions
export const createSample = async (sampleData: Omit<MediaSample, 'id' | 'likedBy' | 'ratings' | 'avg_rating'>): Promise<MediaSample> => {
    try {
        // If sample has a file (src is base64), upload to Supabase Storage
        let fileUrl = sampleData.src;
        
        if (sampleData.src && typeof sampleData.src === 'string' && sampleData.src.startsWith('data:')) {
            // Convert base64 to File and upload
            const response = await fetch(sampleData.src);
            const blob = await response.blob();
            const file = new File([blob], `${sampleData.name}.${sampleData.type === 'video' ? 'mp4' : 'jpg'}`, {
                type: blob.type
            });
            
            const fileName = `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${sampleData.type === 'video' ? 'mp4' : 'jpg'}`;
            const { data: uploadData, error: uploadError } = await mediaService.uploadMediaFile(file, fileName);
            
            if (uploadError) {
                console.error('Failed to upload file:', uploadError);
                throw uploadError;
            }
            
            fileUrl = await mediaService.getMediaFileUrl(fileName);
        }
        
        const newSample: MediaSample = {
            id: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: sampleData.name,
            src: fileUrl,
            type: sampleData.type,
            likedBy: [],
            ratings: {},
            avg_rating: 0,
            created_at: new Date().toISOString()
        };

        // Save to database
        const { data, error } = await supabase
            .from('media_samples')
            .insert([newSample])
            .select()
            .single();
            
        if (error) {
            console.error('Failed to save sample to database:', error);
            throw error;
        }
        
        return data;
    } catch (error) {
        console.error('Error creating sample:', error);
        throw error;
    }
};

export const updateSample = async (id: string, sampleData: Omit<MediaSample, 'id' | 'likedBy' | 'ratings' | 'avg_rating'>): Promise<void> => {
    try {
        const { error } = await supabase
            .from('media_samples')
            .update(sampleData)
            .eq('id', id);
            
        if (error) {
            console.error('Failed to update sample:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error updating sample:', error);
        throw error;
    }
};

export const deleteSample = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('media_samples')
            .delete()
            .eq('id', id);
            
        if (error) {
            console.error('Failed to delete sample:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error deleting sample:', error);
        throw error;
    }
};

export const toggleUserPick = async (user: string, sampleId: string): Promise<string[]> => {
    try {
        const userPicks = JSON.parse(localStorage.getItem(`userPicks_${user}`) || '[]');
        const index = userPicks.indexOf(sampleId);
        if (index > -1) {
            userPicks.splice(index, 1);
        } else {
            userPicks.push(sampleId);
        }
        localStorage.setItem(`userPicks_${user}`, JSON.stringify(userPicks));
        return userPicks;
    } catch (error) {
        console.error('Error toggling user pick:', error);
        return [];
    }
};

export const createVideoRequest = async (requestData: Omit<VideoGenerationRequest, 'id' | 'status' | 'timestamp'>): Promise<VideoGenerationRequest> => {
    try {
        const requests = JSON.parse(localStorage.getItem('videoRequests') || '[]');
        const newRequest: VideoGenerationRequest = {
            id: Date.now().toString(),
            username: requestData.username,
            prompt: requestData.prompt,
            selectedSampleIds: requestData.selectedSampleIds,
            status: 'pending',
            timestamp: new Date().toISOString()
        };
        requests.push(newRequest);
        localStorage.setItem('videoRequests', JSON.stringify(requests));
        return newRequest;
    } catch (error) {
        console.error('Error creating video request:', error);
        throw error;
    }
};

// Add missing API functions
export const getFeedback = async (): Promise<any[]> => {
    try {
        const feedback = JSON.parse(localStorage.getItem('feedback') || '[]');
        return feedback;
    } catch (error) {
        console.error('Error getting feedback:', error);
        return [];
    }
};

export const getDiscoverableUsers = async (): Promise<any[]> => {
    try {
        const users = JSON.parse(localStorage.getItem('discoverableUsers') || '[]');
        return users;
    } catch (error) {
        console.error('Error getting discoverable users:', error);
        return [];
    }
};

export const getConnections = async (): Promise<any[]> => {
    try {
        const connections = JSON.parse(localStorage.getItem('connections') || '[]');
        return connections;
    } catch (error) {
        console.error('Error getting connections:', error);
        return [];
    }
};

export const createConnection = async (connectionData: any): Promise<any> => {
    try {
        const connections = JSON.parse(localStorage.getItem('connections') || '[]');
        const newConnection = {
            id: Date.now().toString(),
            ...connectionData,
            createdAt: new Date().toISOString()
        };
        connections.push(newConnection);
        localStorage.setItem('connections', JSON.stringify(connections));
        return newConnection;
    } catch (error) {
        console.error('Error creating connection:', error);
        throw error;
    }
};

// Helper function to clear localStorage
const clearOldData = () => {
    try {
        // Clear old data that might be taking up space
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('cards_') || key.startsWith('temp_') || key.startsWith('userPicks_') || key === 'videoRequests')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Also clear old media samples if they're too large
        const mediaSamples = localStorage.getItem('mediaSamples');
        if (mediaSamples && mediaSamples.length > 1024 * 1024) { // 1MB limit
            console.warn('Clearing large media samples data');
            localStorage.removeItem('mediaSamples');
        }
    } catch (error) {
        console.warn('Failed to clear old data:', error);
    }
};

// Add missing saveCards function
export const saveCards = async (userId: string, cards: SavedCard[]): Promise<void> => {
    try {
        // Save cards to localStorage for demo mode
        // TODO: Implement proper Supabase database saving
        const storageKey = `cards_${userId}`;
        const cardsWithTimestamps = cards.map(card => ({
            ...card,
            createdAt: card.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));
        
        localStorage.setItem(storageKey, JSON.stringify(cardsWithTimestamps));
        console.log(`Saved ${cards.length} cards for user ${userId}`);
    } catch (error) {
        console.error('Error saving cards:', error);
        throw error;
    }
};

// Card management functions
export const cards = {
    async saveCard(cardData: SavedCard): Promise<SavedCard> {
        try {
            const { data, error } = await cardService.createCard({
                user_id: cardData.userId,
                card_data: cardData.cardData,
                theme: cardData.theme,
                is_public: cardData.isPublic
            });
            
            if (error) throw error;
            
            return {
                ...cardData,
                id: data.id,
                createdAt: data.created_at
            };
        } catch (error) {
            console.error('Error saving card:', error);
            throw error;
        }
    },

    async getCardsByUser(userId: string): Promise<SavedCard[]> {
        try {
            // Use localStorage for demo mode
            // TODO: Implement proper Supabase database fetching
            const storedCards = localStorage.getItem(`cards_${userId}`);
            if (storedCards) {
                return JSON.parse(storedCards);
            }
            return [];
        } catch (error) {
            console.error('Error fetching cards:', error);
            return [];
        }
    },

    async getPublicCards(): Promise<SavedCard[]> {
        try {
            const { data, error } = await cardService.getPublicCards();
            
            if (error) throw error;
            
            return data.map(card => ({
                id: card.id,
                userId: card.user_id,
                cardData: card.card_data,
                theme: card.theme,
                isPublic: card.is_public,
                createdAt: card.created_at,
                thumbnail: '',
                username: card.users?.username
            }));
        } catch (error) {
            console.error('Error fetching public cards:', error);
            return [];
        }
    },

    async updateCard(cardId: string, updates: Partial<SavedCard>): Promise<SavedCard> {
        try {
            const { data, error } = await cardService.updateCard(cardId, {
                card_data: updates.cardData,
                theme: updates.theme,
                is_public: updates.isPublic
            });
            
            if (error) throw error;
            
            return {
                id: data.id,
                userId: data.user_id,
                cardData: data.card_data,
                theme: data.theme,
                isPublic: data.is_public,
                createdAt: data.created_at,
                thumbnail: ''
            };
        } catch (error) {
            console.error('Error updating card:', error);
            throw error;
        }
    },

    async deleteCard(cardId: string): Promise<void> {
        try {
            const { error } = await cardService.deleteCard(cardId);
            if (error) throw error;
        } catch (error) {
            console.error('Error deleting card:', error);
            throw error;
        }
    }
};

// Media samples functions
export const mediaSamples = {
    async getSamples(): Promise<MediaSample[]> {
        try {
            const { data, error } = await mediaService.getMediaSamples();
            
            if (error) throw error;
            
            return data.map(sample => ({
                id: sample.id,
                name: sample.name,
                src: sample.src,
                type: sample.type,
                ratings: sample.ratings || {},
                likedBy: sample.liked_by || []
            }));
        } catch (error) {
            console.error('Error fetching media samples:', error);
            return [];
        }
    },

    async updateRating(sampleId: string, userId: string, rating: number): Promise<void> {
        try {
            const { error } = await mediaService.updateMediaSampleRating(sampleId, userId, rating);
            if (error) throw error;
        } catch (error) {
            console.error('Error updating rating:', error);
            throw error;
        }
    },

    async toggleLike(sampleId: string, userId: string): Promise<void> {
        try {
            const { error } = await mediaService.toggleMediaSampleLike(sampleId, userId);
            if (error) throw error;
        } catch (error) {
            console.error('Error toggling like:', error);
            throw error;
        }
    }
};

// Feedback functions
export const feedback = {
    async submitFeedback(feedbackData: Omit<Feedback, 'id' | 'timestamp'>): Promise<Feedback> {
        try {
            const { data, error } = await feedbackService.createFeedback({
                user_id: feedbackData.userId,
                type: feedbackData.type,
                message: feedbackData.message
            });
            
            if (error) throw error;
            
            return {
                id: data.id,
                userId: data.user_id,
                type: data.type,
                message: data.message,
                timestamp: data.created_at
            };
        } catch (error) {
            console.error('Error submitting feedback:', error);
            throw error;
        }
    },

    async getFeedbackByUser(userId: string): Promise<Feedback[]> {
        try {
            const { data, error } = await feedbackService.getFeedbackByUser(userId);
            
            if (error) throw error;
            
            return data.map(feedback => ({
                id: feedback.id,
                userId: feedback.user_id,
                type: feedback.type,
                message: feedback.message,
                timestamp: feedback.created_at
            }));
        } catch (error) {
            console.error('Error fetching feedback:', error);
            return [];
        }
    }
};

// Video request functions
export const videoRequests = {
    async createRequest(requestData: Omit<VideoGenerationRequest, 'id' | 'status' | 'timestamp'>): Promise<VideoGenerationRequest> {
        try {
            const { data, error } = await videoService.createVideoRequest({
                username: requestData.username,
                prompt: requestData.prompt,
                selected_sample_ids: requestData.selectedSampleIds,
                status: 'pending'
            });
            
            if (error) throw error;
            
            return {
                id: data.id,
                username: data.username,
                prompt: data.prompt,
                selectedSampleIds: data.selected_sample_ids,
                status: data.status,
                timestamp: data.created_at
            };
        } catch (error) {
            console.error('Error creating video request:', error);
            throw error;
        }
    },

    async getRequestsByUser(username: string): Promise<VideoGenerationRequest[]> {
        try {
            const { data, error } = await videoService.getVideoRequestsByUser(username);
            
            if (error) throw error;
            
            return data.map(request => ({
                id: request.id,
                username: request.username,
                prompt: request.prompt,
                selectedSampleIds: request.selected_sample_ids,
                status: request.status,
                timestamp: request.created_at
            }));
        } catch (error) {
            console.error('Error fetching video requests:', error);
            return [];
        }
    }
};

// User management functions (for admin)
export const users = {
    async getAllUsers(): Promise<any[]> {
        // This would need to be implemented with proper admin permissions
        return [];
    },

    async updateUserRole(userId: string, role: string): Promise<void> {
        // This would need to be implemented with proper admin permissions
    }
};

// Company info (keeping as localStorage for now)
export const company = {
    async getInfo(): Promise<CompanyInfo | null> {
        return getFromStorage('companyInfo');
    },

    async updateInfo(info: CompanyInfo): Promise<void> {
        saveToStorage('companyInfo', info);
    }
};

// Add getCompanyInfo function for compatibility
export const getCompanyInfo = company.getInfo;

// Connection functions (keeping as localStorage for now)
export const connections = {
    async getConnections(userId: string): Promise<any[]> {
        return getFromStorage(`connections_${userId}`) || [];
    },

    async sendConnectionRequest(request: ConnectionRequest): Promise<void> {
        const requests = getFromStorage('connectionRequests') || [];
        requests.push(request);
        saveToStorage('connectionRequests', requests);
    },

    async getConnectionRequests(userId: string): Promise<ConnectionRequest[]> {
        const requests = getFromStorage('connectionRequests') || [];
        return requests.filter((req: ConnectionRequest) => req.toUserId === userId);
    },

    async sendMessage(message: DirectMessage): Promise<void> {
        const messages = getFromStorage('directMessages') || [];
        messages.push(message);
        saveToStorage('directMessages', messages);
    },

    async getMessages(userId: string): Promise<DirectMessage[]> {
        const messages = getFromStorage('directMessages') || [];
        return messages.filter((msg: DirectMessage) => 
            msg.fromUserId === userId || msg.toUserId === userId
        );
    }
};

// Additional missing API functions
const getAllVideoRequests = async (): Promise<VideoGenerationRequest[]> => {
    try {
        await apiDelay();
        const requests = getFromStorage('videoRequests') || [];
        return requests;
    } catch (error) {
        console.error('Failed to get all video requests:', error);
        return [];
    }
};

const saveCompanyInfo = async (companyInfo: CompanyInfo): Promise<boolean> => {
    try {
        await apiDelay();
        return saveToStorage('companyInfo', companyInfo);
    } catch (error) {
        console.error('Failed to save company info:', error);
        return false;
    }
};

const getRequests = async (): Promise<ConnectionRequest[]> => {
    try {
        await apiDelay();
        const requests = getFromStorage('connectionRequests') || [];
        return requests;
    } catch (error) {
        console.error('Failed to get requests:', error);
        return [];
    }
};

const getAllMessages = async (): Promise<DirectMessage[]> => {
    try {
        await apiDelay();
        const messages = getFromStorage('directMessages') || [];
        return messages;
    } catch (error) {
        console.error('Failed to get all messages:', error);
        return [];
    }
};

// Use mock authentication temporarily to avoid auth errors
const mockAuth = {
    login: async (email: string, password: string) => {
        await apiDelay();
        return { 
            data: { user: { id: 'mock-user', email } }, 
            error: null 
        };
    },
    register: async (email: string, password: string, username: string) => {
        await apiDelay();
        return { 
            data: { user: { id: 'mock-user', email, username } }, 
            error: null 
        };
    },
    logout: async () => {
        await apiDelay();
        return { error: null };
    },
    getCurrentUser: async () => {
        await apiDelay();
        return { 
            data: { user: { id: 'mock-user', email: 'test@example.com' } }, 
            error: null 
        };
    }
};

// Export the main API object
export const api = {
    // Use mock auth temporarily
    auth: mockAuth,
    cards,
    mediaSamples,
    feedback,
    videoRequests,
    users,
    company,
    connections,
    getCompanyInfo,
    loginUser,
    checkUserExists,
    isAdmin,
    getDashboardStats,
    getNewFeedbackCount,
    getCards,
    getAllUsersForAdmin,
    getSamples,
    getPendingVideoRequestCount,
    getUserMeta,
    getAllFeedback,
    getIncomingRequestsCount,
    getUnreadMessagesCount,
    getUnreadFeedbackRepliesCount,
    getUserPicks,
    saveCards,
    createSample,
    updateSample,
    deleteSample,
    toggleUserPick,
    createVideoRequest,
    getFeedback,
    getDiscoverableUsers,
    getConnections,
    createConnection,
    // Additional missing functions
    getAllVideoRequests,
    saveCompanyInfo,
    getRequests,
    getAllMessages
};
