

export interface SocialLink {
  id: string; // For React key
  platform: string;
  url: string;
}

export interface ContactInfo {
  id:string; // For React key
  type: 'phone' | 'email' | 'website' | 'address' | 'youtube';
  value: string;
}

export interface CareerEntry {
  id:string; // For React key
  title: string;
  company: string;
  startDate: string;
  endDate: string; // Can be 'Present'
  description: string;
}

export interface ThemeColors {
  background: string;
  text: string;
  primary: string;
  accent: string;
}

export interface Media {
  src: string; // URL or base64
  aspectRatio: number; // width / height
  zoom?: number; // For video scaling
  position?: { x: number; y: number }; // For video positioning in pixels
}

export interface BusinessCardData {
  profilePicture: Media;
  bannerImage: Media;
  name: string;
  title: string;
  company: string;
  bio: string;
  contactInfo: ContactInfo[];
  socialLinks: SocialLink[];
  careerHistory: CareerEntry[];
  fontFamily: string;
  // Name
  nameFontSize: number;
  nameFontWeight: number;
  nameFontColor: string;
  // Title
  titleFontSize: number;
  titleFontWeight: number;
  titleFontColor: string;
  // Company
  companyFontSize: number;
  companyFontWeight: number;
  companyFontColor: string;
  // Base
  baseFontSize: number;
  baseFontWeight: number;
  baseFontColor: string;
  layout: 'classic' | 'modern' | 'minimalist' | 'banner-focus';
}

export interface SavedCard {
  id: string;
  cardData: BusinessCardData;
  theme: ThemeColors;
  thumbnail: string; // dataURL
  isPublic: boolean;
}

export interface AdminUserData {
  username: string;
  profilePicture: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  title: string;
  company: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  aiUses: number;
  cardCount: number;
  connectionCount: number;
  joinDate: number;
  points: number;
  inquiryCount: number;
  memo: string;
  profession: string;
}

export interface UserMetadata {
  orderStatus: 'pending' | 'confirmed' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed';
  aiUses: number;
  joinDate: number;
  points: number;
  memo?: string;
}

export type FeedbackType = 'Inquiry' | 'Bug Report' | 'Suggestion' | 'Praise';

export interface Feedback {
  id: string;
  username: string;
  type: FeedbackType;
  message: string;
  timestamp: number;
  status: 'Submitted' | 'Replied';
  reply?: string;
  readByUser?: boolean;
}

export interface MediaSample {
  id: string;
  name: string;
  src: string; // dataURL
  type: 'image' | 'video';
  likedBy: string[]; // Array of usernames who liked it
  ratings: { [userId: string]: number }; // e.g., { "user1": 5, "user2": 4 }
  avgRating: number;
}

export interface VideoGenerationRequest {
  id: string;
  username: string;
  prompt: string; // Will be used for the inquiry message
  selectedSampleIds?: string[]; // Array of sample IDs
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: number;
  adminNotes?: string;
}

export interface CompanyInfo {
    logo: string; // dataURL
    slogan: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    legal: string;
}

export type AdminRole = 'Super Admin' | 'Content Manager' | 'Support Specialist' | 'Read-only';

export interface AdminAccount {
    id: string;
    username: string;
    role: AdminRole;
    lastLogin: number;
}

export interface DirectMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  sharedCardId?: string; // ID of the card from the sender's collection
  timestamp: number;
  read: boolean;
}

export interface ConnectionRequest {
    from: string;
    to: string;
}
