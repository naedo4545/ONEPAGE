/**
 * MOCK API Service
 * 
 * This file simulates a backend API for data persistence.
 * In a real-world application, the localStorage calls would be replaced with
 * `fetch` calls to a secure, backend server that interacts with a database
 * like Firestore or a SQL database.
 * 
 * The functions are made `async` to replicate the asynchronous nature of
 * network requests.
 */

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

// Helper to simulate network delay
const apiDelay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

// --- Generic LocalStorage Helpers ---

const getFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key "${key}":`, error);
        return defaultValue;
    }
};

const saveToStorage = (key: string, data: any): void => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error writing to localStorage key "${key}":`, error);
        if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
            alert("Could not save data. Your browser's storage is full. Please clear some site data.");
        } else {
            alert("An unexpected error occurred while saving data.");
        }
        throw error; // Re-throw to allow callers to handle it
    }
};

// --- Initial Data Seeding (for demonstration) ---
const seedInitialData = () => {
    if (!localStorage.getItem('seeded-v2')) {
        const admins: Record<string, {password: string, role: AdminRole, lastLogin: number}> = {
            'admin': { password: 'admin', role: 'Super Admin', lastLogin: Date.now() },
        };
        const adminAccounts: AdminAccount[] = [
            { id: 'admin-1', username: 'admin', role: 'Super Admin', lastLogin: Date.now() }
        ];
        saveToStorage('digital-card-admins', admins);
        saveToStorage('digital-card-admin-accounts', adminAccounts);
        
        const companyInfo = {
            logo: '', name: 'ONEPAGE', slogan: 'My brand in one page',
            address: '123 Tech Lane, Silicon Valley, CA', phone: '1-800-555-TECH', email: 'contact@videocard.studio',
            legal: 'All rights reserved.'
        };
        saveToStorage('digital-card-company-info', companyInfo);

        // Seed some sample data
        const sampleMedia: MediaSample[] = [
            { id: crypto.randomUUID(), name: "Neon City Drive", src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", type: "video", likedBy: [], ratings: {}, avgRating: 0 },
            { id: crypto.randomUUID(), name: "Abstract Sphere", src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", type: "video", likedBy: [], ratings: {}, avgRating: 0 },
        ];
        saveToStorage('digital-card-samples', sampleMedia);


        localStorage.setItem('seeded-v2', 'true');
    }
};

seedInitialData();


// --- API Function Definitions ---

export const api = {
    // --- Auth & Users ---
    async loginUser(username: string, password: string): Promise<boolean> {
        await apiDelay();
        const users = getFromStorage<Record<string, string>>('digital-card-users', {});
        const admins = getFromStorage<Record<string, {password: string, lastLogin: number}>>('digital-card-admins', {});
        if ((users[username] && users[username] === password) || (admins[username] && admins[username].password === password)) {
            if (admins[username]) { // Update last login for admins
                admins[username].lastLogin = Date.now();
                saveToStorage('digital-card-admins', admins);
                const adminAccounts = getFromStorage<AdminAccount[]>('digital-card-admin-accounts', []);
                const adminAcc = adminAccounts.find(a => a.username === username);
                if (adminAcc) {
                    adminAcc.lastLogin = Date.now();
                    saveToStorage('digital-card-admin-accounts', adminAccounts);
                }
            }
            return true;
        }
        return false;
    },

    async checkUserExists(username: string): Promise<boolean> {
        await apiDelay();
        const users = getFromStorage<Record<string, string>>('digital-card-users', {});
        const admins = getFromStorage<Record<string, any>>('digital-card-admins', {});
        return !!(users[username] || admins[username]);
    },

    async createUser(username: string, password: string): Promise<void> {
        await apiDelay();
        const users = getFromStorage<Record<string, string>>('digital-card-users', {});
        users[username] = password;
        saveToStorage('digital-card-users', users);

        const allMeta = getFromStorage<Record<string, UserMetadata>>('digital-card-user-meta', {});
        const newUserMeta: UserMetadata = {
            orderStatus: 'pending', paymentStatus: 'pending', aiUses: 3, joinDate: Date.now(), points: 0,
        };
        allMeta[username] = newUserMeta;
        saveToStorage('digital-card-user-meta', allMeta);
    },

    async isAdmin(username: string): Promise<boolean> {
        await apiDelay();
        const admins = getFromStorage<Record<string, any>>('digital-card-admins', {});
        return !!admins[username];
    },

    async deleteUser(username: string): Promise<void> {
        await apiDelay();
        const users = getFromStorage<Record<string, string>>('digital-card-users', {});
        delete users[username];
        saveToStorage('digital-card-users', users);

        const allMeta = getFromStorage<Record<string, UserMetadata>>('digital-card-user-meta', {});
        delete allMeta[username];
        saveToStorage('digital-card-user-meta', allMeta);

        localStorage.removeItem(`digital-business-cards-${username}`);
        localStorage.removeItem(`digital-card-user-picks-${username}`);

        const allConnections = getFromStorage<Record<string, string[]>>('digital-card-connections', {});
        delete allConnections[username];
        for (const user in allConnections) {
            allConnections[user] = allConnections[user].filter(conn => conn !== username);
        }
        saveToStorage('digital-card-connections', allConnections);
        
        let requests = getFromStorage<ConnectionRequest[]>('digital-card-connection-requests', []);
        requests = requests.filter(r => r.from !== username && r.to !== username);
        saveToStorage('digital-card-connection-requests', requests);

        let messages = getFromStorage<DirectMessage[]>('digital-card-messages', []);
        messages = messages.filter(m => m.from !== username && m.to !== username);
        saveToStorage('digital-card-messages', messages);
        
        let feedback = getFromStorage<Feedback[]>('digital-card-feedback', []);
        feedback = feedback.filter(f => f.username !== username);
        saveToStorage('digital-card-feedback', feedback);
    },

    async getAllUsersForAdmin(): Promise<AdminUserData[]> {
        await apiDelay();
        const users = getFromStorage<Record<string, string>>('digital-card-users', {});
        const allMeta = getFromStorage<Record<string, UserMetadata>>('digital-card-user-meta', {});
        const allConnections = getFromStorage<Record<string, string[]>>('digital-card-connections', {});
        const allFeedback = getFromStorage<Feedback[]>('digital-card-feedback', []);

        return Object.keys(users).map(username => {
            const cards = getFromStorage<SavedCard[]>(`digital-business-cards-${username}`, []);
            const meta = allMeta[username] || { plan: 'Free', aiUses: 0, joinDate: Date.now(), points: 0, memo: '' };
            const firstCard = cards[0]?.cardData;

            return {
                username,
                profilePicture: firstCard?.profilePicture.src || '',
                name: firstCard?.name || username,
                email: firstCard?.contactInfo.find(c => c.type === 'email')?.value || '',
                phone: firstCard?.contactInfo.find(c => c.type === 'phone')?.value || '',
                address: firstCard?.contactInfo.find(c => c.type === 'address')?.value || '',
                title: firstCard?.title || '',
                company: firstCard?.company || '',
                plan: meta.plan,
                aiUses: meta.aiUses,
                cardCount: cards.length,
                connectionCount: (allConnections[username] || []).length,
                joinDate: meta.joinDate,
                points: meta.points,
                inquiryCount: allFeedback.filter(f => f.username === username && f.type === 'Inquiry').length,
                memo: meta.memo || '',
                profession: firstCard?.title || '', // Just an example
            };
        });
    },

    // --- Cards ---
    async getCards(username: string): Promise<SavedCard[]> {
        await apiDelay();
        return getFromStorage<SavedCard[]>(`digital-business-cards-${username}`, []);
    },

    async getCardById(username: string, cardId: string): Promise<SavedCard | null> {
        await apiDelay();
        const cards = getFromStorage<SavedCard[]>(`digital-business-cards-${username}`, []);
        return cards.find(c => c.id === cardId) || null;
    },

    async saveCards(username: string, cards: SavedCard[]): Promise<void> {
        await apiDelay();
        saveToStorage(`digital-business-cards-${username}`, cards);
    },

    // --- User Metadata ---
    async getUserMeta(username: string): Promise<UserMetadata> {
        await apiDelay();
        const allMeta = getFromStorage<Record<string, UserMetadata>>('digital-card-user-meta', {});
        if (allMeta[username]) {
            return allMeta[username];
        }
        const defaultMeta: UserMetadata = { plan: 'Free', aiUses: 3, joinDate: Date.now(), points: 0 };
        allMeta[username] = defaultMeta;
        saveToStorage('digital-card-user-meta', allMeta);
        return defaultMeta;
    },
    async updateUserMeta(username: string, meta: UserMetadata): Promise<void> {
        await apiDelay();
        const allMeta = getFromStorage<Record<string, UserMetadata>>('digital-card-user-meta', {});
        allMeta[username] = meta;
        saveToStorage('digital-card-user-meta', allMeta);
    },

    async updateUserMemo(username: string, memo: string): Promise<void> {
        await apiDelay();
        const allMeta = getFromStorage<Record<string, UserMetadata>>('digital-card-user-meta', {});
        if (allMeta[username]) {
            allMeta[username].memo = memo;
            saveToStorage('digital-card-user-meta', allMeta);
        }
    },

    async addUserPoints(username: string, points: number): Promise<void> {
        await apiDelay();
        const allMeta = getFromStorage<Record<string, UserMetadata>>('digital-card-user-meta', {});
        if (allMeta[username]) {
            allMeta[username].points = (allMeta[username].points || 0) + points;
            saveToStorage('digital-card-user-meta', allMeta);
        }
    },

    async updateUserOrderStatus(username: string, orderStatus: UserMetadata['orderStatus']): Promise<void> {
        await apiDelay();
        const allMeta = getFromStorage<Record<string, UserMetadata>>('digital-card-user-meta', {});
        if (allMeta[username]) {
            allMeta[username].orderStatus = orderStatus;
            saveToStorage('digital-card-user-meta', allMeta);
        }
    },

    async updateUserPaymentStatus(username: string, paymentStatus: UserMetadata['paymentStatus']): Promise<void> {
        await apiDelay();
        const allMeta = getFromStorage<Record<string, UserMetadata>>('digital-card-user-meta', {});
        if (allMeta[username]) {
            allMeta[username].paymentStatus = paymentStatus;
            saveToStorage('digital-card-user-meta', allMeta);
        }
    },

    // --- Company Info ---
    async getCompanyInfo(): Promise<CompanyInfo | null> {
        await apiDelay();
        return getFromStorage<CompanyInfo | null>('digital-card-company-info', null);
    },
    async saveCompanyInfo(info: CompanyInfo): Promise<void> {
        await apiDelay();
        saveToStorage('digital-card-company-info', info);
    },
    
    // --- Connections & Messaging ---
    async getDiscoverableUsers(currentUser: string) {
        await apiDelay();
        const users = getFromStorage<Record<string, string>>('digital-card-users', {});
        const admins = getFromStorage<Record<string, {password: string}>>('digital-card-admins', {});
        const adminUsernames = Object.keys(admins);

        return Object.keys(users)
            .filter(username => username !== currentUser && !adminUsernames.includes(username))
            .map(username => {
                const cards = getFromStorage<SavedCard[]>(`digital-business-cards-${username}`, []);
                const firstPublicCard = cards.find(card => card.isPublic) || cards[0];
                if (!firstPublicCard) return null;
                return {
                    username,
                    name: firstPublicCard.cardData.name || username,
                    profilePicture: firstPublicCard.cardData.profilePicture.src || '',
                    title: firstPublicCard.cardData.title || '',
                    company: firstPublicCard.cardData.company || '',
                };
            })
            .filter((user): user is NonNullable<typeof user> => user !== null);
    },
    async getConnections(user: string): Promise<string[]> {
        await apiDelay();
        const allConnections = getFromStorage<Record<string, string[]>>('digital-card-connections', {});
        return allConnections[user] || [];
    },
    async getRequests(): Promise<ConnectionRequest[]> {
        await apiDelay();
        return getFromStorage<ConnectionRequest[]>('digital-card-connection-requests', []);
    },
    async getIncomingRequestsCount(user: string): Promise<number> {
        await apiDelay();
        const requests = await this.getRequests();
        return requests.filter(r => r.to === user).length;
    },
    async sendConnectionRequest(from: string, to: string): Promise<ConnectionRequest[]> {
        await apiDelay();
        const requests = getFromStorage<ConnectionRequest[]>('digital-card-connection-requests', []);
        if (!requests.some(r => r.from === from && r.to === to)) {
            const newRequests = [...requests, { from, to }];
            saveToStorage('digital-card-connection-requests', newRequests);
            return newRequests;
        }
        return requests;
    },
    async cancelConnectionRequest(from: string, to: string): Promise<ConnectionRequest[]> {
        await apiDelay();
        let requests = getFromStorage<ConnectionRequest[]>('digital-card-connection-requests', []);
        requests = requests.filter(r => !(r.from === from && r.to === to));
        saveToStorage('digital-card-connection-requests', requests);
        return requests;
    },
    async declineConnectionRequest(currentUser: string, fromUser: string): Promise<ConnectionRequest[]> {
        await apiDelay();
        let requests = getFromStorage<ConnectionRequest[]>('digital-card-connection-requests', []);
        requests = requests.filter(r => !(r.to === currentUser && r.from === fromUser));
        saveToStorage('digital-card-connection-requests', requests);
        return requests;
    },
    async acceptConnectionRequest(currentUser: string, fromUser: string): Promise<[ConnectionRequest[], string[]]> {
        await apiDelay();
        // Remove the specific pending request
        let requests = getFromStorage<ConnectionRequest[]>('digital-card-connection-requests', []);
        requests = requests.filter(r => !(r.to === currentUser && r.from === fromUser));
        saveToStorage('digital-card-connection-requests', requests);

        // Add mutual connections
        const allConnections = getFromStorage<Record<string, string[]>>('digital-card-connections', {});
        const currentUserConns = new Set<string>(allConnections[currentUser] || []);
        const fromUserConns = new Set<string>(allConnections[fromUser] || []);
        currentUserConns.add(fromUser);
        fromUserConns.add(currentUser);
        allConnections[currentUser] = Array.from(currentUserConns);
        allConnections[fromUser] = Array.from(fromUserConns);
        saveToStorage('digital-card-connections', allConnections);

        return [requests, allConnections[currentUser] || []];
    },

    // --- Messaging ---
    async getMessages(user: string) {
        await apiDelay();
        const all = getFromStorage<DirectMessage[]>('digital-card-messages', []);
        return all
            .filter(m => m.from === user || m.to === user)
            .sort((a, b) => a.timestamp - b.timestamp);
    },
    async getAllMessages() {
        await apiDelay();
        return getFromStorage<DirectMessage[]>('digital-card-messages', []).sort((a, b) => a.timestamp - b.timestamp);
    },
    async sendMessage(message: Omit<DirectMessage, 'id'>) {
        await apiDelay();
        const all = getFromStorage<DirectMessage[]>('digital-card-messages', []);
        const newMsg: DirectMessage = { id: crypto.randomUUID(), ...message };
        all.push(newMsg);
        saveToStorage('digital-card-messages', all);
        return all.sort((a, b) => a.timestamp - b.timestamp);
    },
    async markMessagesAsRead(user: string, otherUser: string) {
        await apiDelay();
        const all = getFromStorage<DirectMessage[]>('digital-card-messages', []);
        for (const m of all) {
            if (m.to === user && m.from === otherUser && !m.read) {
                m.read = true;
            }
        }
        saveToStorage('digital-card-messages', all);
        return all
            .filter(m => m.from === user || m.to === user)
            .sort((a, b) => a.timestamp - b.timestamp);
    },

    // --- Samples ---
    async getSamples() {
        await apiDelay();
        return getFromStorage<MediaSample[]>('digital-card-samples', []);
    },
    async createSample(sample: Omit<MediaSample, 'id' | 'likedBy' | 'ratings' | 'avgRating'>) {
        await apiDelay();
        const samples = getFromStorage<MediaSample[]>('digital-card-samples', []);
        const newSample: MediaSample = {
            id: crypto.randomUUID(),
            name: sample.name,
            src: sample.src,
            type: sample.type,
            likedBy: [],
            ratings: {},
            avgRating: 0,
        };
        samples.push(newSample);
        saveToStorage('digital-card-samples', samples);
        return samples;
    },
    async updateSample(id: string, sample: Omit<MediaSample, 'id' | 'likedBy' | 'ratings' | 'avgRating'>) {
        await apiDelay();
        const samples = getFromStorage<MediaSample[]>('digital-card-samples', []);
        const idx = samples.findIndex(s => s.id === id);
        if (idx !== -1) {
            samples[idx] = {
                ...samples[idx],
                name: sample.name,
                src: sample.src,
                type: sample.type,
            };
            saveToStorage('digital-card-samples', samples);
        }
        return samples;
    },
    async deleteSample(id: string) {
        await apiDelay();
        let samples = getFromStorage<MediaSample[]>('digital-card-samples', []);
        samples = samples.filter(s => s.id !== id);
        saveToStorage('digital-card-samples', samples);
        return samples;
    },
    async toggleSampleLike(sampleId: string, username: string) {
        await apiDelay();
        const samples = getFromStorage<MediaSample[]>('digital-card-samples', []);
        const s = samples.find(x => x.id === sampleId);
        if (s) {
            const set = new Set<string>(s.likedBy);
            if (set.has(username)) set.delete(username); else set.add(username);
            s.likedBy = Array.from(set);
            saveToStorage('digital-card-samples', samples);
        }
        return samples;
    },
    async rateSample(sampleId: string, username: string, rating: number) {
        await apiDelay();
        const samples = getFromStorage<MediaSample[]>('digital-card-samples', []);
        const s = samples.find(x => x.id === sampleId);
        if (s) {
            s.ratings[username] = rating;
            const values = Object.values(s.ratings);
            s.avgRating = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            saveToStorage('digital-card-samples', samples);
        }
        return samples;
    },

    // --- User picks for samples ---
    async getUserPicks(username: string) {
        await apiDelay();
        return getFromStorage<string[]>(`digital-card-user-picks-${username}`, []);
    },
    async toggleUserPick(username: string, sampleId: string) {
        await apiDelay();
        const picks = new Set<string>(getFromStorage<string[]>(`digital-card-user-picks-${username}`, []));
        if (picks.has(sampleId)) picks.delete(sampleId); else picks.add(sampleId);
        const result = Array.from(picks);
        saveToStorage(`digital-card-user-picks-${username}`, result);
        return result;
    },

    // --- Video Generation Requests ---
    async createVideoRequest(req: Omit<VideoGenerationRequest, 'id' | 'status' | 'timestamp'>) {
        await apiDelay();
        const requests = getFromStorage<VideoGenerationRequest[]>('digital-card-video-requests', []);
        const newReq: VideoGenerationRequest = {
            id: crypto.randomUUID(),
            username: req.username,
            prompt: req.prompt,
            selectedSampleIds: req.selectedSampleIds,
            status: 'Pending',
            timestamp: Date.now(),
        };
        requests.push(newReq);
        saveToStorage('digital-card-video-requests', requests);
    },
    async getAllVideoRequests() {
        await apiDelay();
        return getFromStorage<VideoGenerationRequest[]>('digital-card-video-requests', []).sort((a, b) => b.timestamp - a.timestamp);
    },
    async updateVideoRequestStatus(id: string, status: VideoGenerationRequest['status']) {
        await apiDelay();
        const requests = getFromStorage<VideoGenerationRequest[]>('digital-card-video-requests', []);
        const idx = requests.findIndex(r => r.id === id);
        if (idx !== -1) {
            requests[idx] = { ...requests[idx], status };
            saveToStorage('digital-card-video-requests', requests);
        }
        return requests;
    },

    // --- Admin chat helpers ---
    async getAllChatUsers() {
        await apiDelay();
        const users = getFromStorage<Record<string, string>>('digital-card-users', {});
        const result: { username: string; name: string; profilePicture: string }[] = [];
        for (const username of Object.keys(users)) {
            if (username === 'admin') continue;
            const cards = getFromStorage<SavedCard[]>(`digital-business-cards-${username}`, []);
            const firstCard = cards[0]?.cardData;
            result.push({
                username,
                name: firstCard?.name || username,
                profilePicture: firstCard?.profilePicture?.src || '',
            });
        }
        return result;
    },
};