

import React from 'react';
import type { BusinessCardData, ContactInfo, ThemeColors } from './types';
import type { Language } from './contexts/LanguageContext';
import { ko } from './locales/ko';
import { en } from './locales/en';
import { ja } from './locales/ja';

// Language-aware default card data generator
export const getDefaultCardData = (language: Language = 'en'): BusinessCardData => {
  const translations = { ko, en, ja };
  const t = translations[language];
  
  return {
    bannerImage: {
      src: '',
      aspectRatio: 1,
    },
    profilePicture: {
      src: '',
      aspectRatio: 1,
    },
    name: t.editor.sampleName,
    title: 'CEO & Founder',
    company: 'ONEPAGE',
    bio: t.editor.sampleBio,
    contactInfo: [
      { id: '550e8400-e29b-41d4-a716-446655440011', type: 'phone', value: '82)10-1234-5678' },
      { id: '550e8400-e29b-41d4-a716-446655440012', type: 'email', value: 'rero45@naver.com' },
      { id: '550e8400-e29b-41d4-a716-446655440013', type: 'address', value: t.editor.sampleAddress },
      { id: '550e8400-e29b-41d4-a716-446655440014', type: 'website', value: 'rawstudio.kr' },
    ],
    socialLinks: [
      { id: '550e8400-e29b-41d4-a716-446655440021', platform: 'instagram', url: 'https://instagram.com' },
      { id: '550e8400-e29b-41d4-a716-446655440022', platform: 'youtube', url: 'https://www.youtube.com/@ONEPAGE' },
    ],
    careerHistory: [
      { id: '550e8400-e29b-41d4-a716-446655440001', title: '2D Supervisor → Colorist → Compositor', company: 'SEOULVISION', startDate: '2008', endDate: '2018', description: t.editor.sampleCareerDesc1},
      { id: '550e8400-e29b-41d4-a716-446655440002', title: 'CEO & Founder', company: 'ONEPAGE', startDate: '2018', endDate: 'Present', description: t.editor.sampleCareerDesc2}
    ],
    fontFamily: 'system-ui, sans-serif',
  // Name
  nameFontSize: 28,
  nameFontWeight: 700,
  nameFontColor: '#1F2937', // Default to Arctic primary
  // Title
  titleFontSize: 16,
  titleFontWeight: 500,
  titleFontColor: '#374151', // Default to Arctic text
  // Company
  companyFontSize: 18,
  companyFontWeight: 600,
  companyFontColor: '#1F2937', // Default to Arctic primary
  // Base
  baseFontSize: 14,
  baseFontWeight: 400,
  baseFontColor: '#374151', // Default to Arctic text
    layout: 'classic',
  };
};

// Backward compatibility - use English as default
export const DEFAULT_CARD_DATA: BusinessCardData = getDefaultCardData('en');

export const CONTACT_TYPES: ContactInfo['type'][] = ['email', 'phone', 'website', 'address', 'youtube'];
export const SOCIAL_PLATFORMS = ['linkedin', 'github', 'twitter', 'facebook', 'instagram', 'youtube', 'tiktok', 'telegram', 'discord', 'threads', 'mastodon', 'website'];

export const THEMES: { [key: string]: ThemeColors } = {
  Arctic: { background: '#F9FAFB', text: '#374151', primary: '#1F2937', accent: '#E5E7EB' },
  Midnight: { background: '#111827', text: '#D1D5DB', primary: '#FFFFFF', accent: '#4B5563' },
  PastelPink: { background: '#FADADD', text: '#5C3C40', primary: '#E87A90', accent: '#F4B3C2' },
  MintGreen: { background: '#E0F2E9', text: '#3E5B50', primary: '#78C8A6', accent: '#A9D9C3' },
  SkyBlue: { background: '#D6EAF8', text: '#3A506B', primary: '#85C1E9', accent: '#AED6F1' },
  Lavender: { background: '#EAE6F3', text: '#4A4259', primary: '#B19CDA', accent: '#D2C4E7' },
  Sunset: { background: '#FFF7ED', text: '#7C2D12', primary: '#EA580C', accent: '#FED7AA' },
  Oceanic: { background: '#F0F9FF', text: '#164E63', primary: '#0891B2', accent: '#E0F2FE' },
};

export const FONT_OPTIONS: { [key: string]: string } = {
  'Sans Serif': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  'Serif': 'Georgia, Cambria, "Times New Roman", Times, serif',
  'Monospace': '"Courier New", Courier, monospace',
  'Playful': '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif',
  'Elegant': 'Garamond, "Hoefler Text", "Baskerville Old Face", serif',
};

// SVG thumbnails for layouts, encoded as data URIs
const classicThumb = `data:image/svg+xml,%3Csvg width='100' height='150' viewBox='0 0 100 150' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100' height='150' fill='%23E5E7EB'/%3E%3Crect width='100' height='50' fill='%239CA3AF'/%3E%3Ccircle cx='50' cy='50' r='15' fill='%23E5E7EB' stroke='%239CA3AF' stroke-width='2'/%3E%3Crect x='25' y='80' width='50' height='5' fill='%239CA3AF'/%3E%3Crect x='30' y='90' width='40' height='3' fill='%239CA3AF'/%3E%3C/svg%3E`;
const minimalistThumb = `data:image/svg+xml,%3Csvg width='100' height='150' viewBox='0 0 100 150' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100' height='150' fill='%23E5E7EB'/%3E%3Crect x='20' y='40' width='60' height='6' fill='%239CA3AF'/%3E%3Crect x='25' y='55' width='50' height='4' fill='%239CA3AF'/%3E%3Crect x='30' y='70' width='40' height='2' fill='%239CA3AF'/%3E%3Crect x='30' y='75' width='40' height='2' fill='%239CA3AF'/%3E%3C/svg%3E`;
const bannerFocusThumb = `data:image/svg+xml,%3Csvg width='100' height='150' viewBox='0 0 100 150' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100' height='150' fill='%23E5E7EB'/%3E%3Crect width='100' height='75' fill='%239CA3AF'/%3E%3Ccircle cx='50' cy='90' r='15' fill='%23E5E7EB' stroke='%239CA3AF' stroke-width='2'/%3E%3Crect x='25' y='115' width='50' height='5' fill='%239CA3AF'/%3E%3Crect x='30' y='125' width='40' height='3' fill='%239CA3AF'/%3E%3C/svg%3E`;
const modernThumb = `data:image/svg+xml,%3Csvg width='100' height='150' viewBox='0 0 100 150' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100' height='150' fill='%23E5E7EB'/%3E%3Ccircle cx='25' cy='30' r='15' fill='%239CA3AF'/%3E%3Crect x='50' y='20' width='40' height='5' fill='%239CA3AF'/%3E%3Crect x='50' y='30' width='35' height='3' fill='%239CA3AF'/%3E%3Crect x='50' y='38' width='30' height='3' fill='%239CA3AF'/%3E%3Crect y='60' width='100' height='40' fill='%239CA3AF'/%3E%3Crect x='25' y='115' width='50' height='5' fill='%239CA3AF'/%3E%3Crect x='30' y='125' width='40' height='3' fill='%239CA3AF'/%3E%3C/svg%3E`;

export const LAYOUTS: { [key: string]: { name: string; thumbnail: string; } } = {
  classic: { name: 'Classic', thumbnail: classicThumb },
  'banner-focus': { name: 'Banner Focus', thumbnail: bannerFocusThumb },
  modern: { name: 'Modern', thumbnail: modernThumb },
  minimalist: { name: 'Minimalist', thumbnail: minimalistThumb },
};


export const CONTACT_ICON_MAP: Record<ContactInfo['type'], React.ReactNode> = {
  phone: <i className="fa-solid fa-phone"></i>,
  email: <i className="fa-solid fa-envelope"></i>,
  website: <i className="fa-solid fa-globe"></i>,
  address: <i className="fa-solid fa-location-dot"></i>,
  youtube: <i className="fa-brands fa-youtube"></i>
};

export const SOCIAL_ICON_MAP: Record<string, React.ReactNode> = {
  linkedin: <i className="fa-brands fa-linkedin"></i>,
  github: <i className="fa-brands fa-github"></i>,
  twitter: <i className="fa-brands fa-twitter"></i>,
  facebook: <i className="fa-brands fa-facebook"></i>,
  instagram: <i className="fa-brands fa-instagram"></i>,
  youtube: <i className="fa-brands fa-youtube"></i>,
  tiktok: <i className="fa-brands fa-tiktok"></i>,
  telegram: <i className="fa-brands fa-telegram"></i>,
  discord: <i className="fa-brands fa-discord"></i>,
  threads: <i className="fa-brands fa-threads"></i>,
  mastodon: <i className="fa-brands fa-mastodon"></i>,
  website: <i className="fa-solid fa-globe"></i>,
};

export const SOCIAL_URL_TEMPLATES: Record<string, string> = {
  linkedin: 'https://www.linkedin.com/in/',
  github: 'https://github.com/',
  twitter: 'https://twitter.com/',
  facebook: 'https://www.facebook.com/',
  instagram: 'https://www.instagram.com/',
  youtube: 'https://www.youtube.com/',
  tiktok: 'https://www.tiktok.com/@',
  threads: 'https://www.threads.net/@',
  telegram: 'https://t.me/',
  website: 'https://',
};