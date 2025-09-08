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
            // For demo purposes, we'll use a simple username/password system
            // In production, you'd want to implement proper authentication
            const { data, error } = await authService.signIn(username + '@example.com', password);
            
            if (error) {
                return { success: false, error: error.message };
            }
            
            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, error: 'Login failed' };
        }
    },

    async signup(username: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
        try {
            const { data, error } = await authService.signUp(username + '@example.com', password, username);
            
            if (error) {
                return { success: false, error: error.message };
            }
            
            // Create user profile
            await userService.createUser({
                username,
                email: username + '@example.com'
            });
            
            return { success: true, user: data.user };
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
            const { data, error } = await cardService.getCardsByUser(userId);
            
            if (error) throw error;
            
            return data.map(card => ({
                id: card.id,
                userId: card.user_id,
                cardData: card.card_data,
                theme: card.theme,
                isPublic: card.is_public,
                createdAt: card.created_at,
                thumbnail: '' // You might want to generate thumbnails
            }));
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

// Export the main API object
export const api = {
    auth,
    cards,
    mediaSamples,
    feedback,
    videoRequests,
    users,
    company,
    connections
};


