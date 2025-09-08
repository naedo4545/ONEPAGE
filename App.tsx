


import React, { useState, useCallback, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import CardForm from './components/CardForm';
import CardPreview from './components/CardPreview';
import LoginModal from './components/LoginModal';
import Hub from './components/Hub';
import AdminPage from './components/AdminPage';
import LanguageSelector from './components/LanguageSelector';
import LanguageToggle from './components/LanguageToggle';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import type { BusinessCardData, SocialLink, ContactInfo, ThemeColors, CareerEntry, SavedCard, UserMetadata, CompanyInfo } from './types';
import { DEFAULT_CARD_DATA, THEMES, getDefaultCardData } from './constants';
import { api } from './services/apiService';

declare global {
  interface Window {
    Kakao: any;
  }
  interface Navigator {
    share(data?: ShareData): Promise<void>;
    canShare(data?: ShareData): boolean;
  }
}

// Helper function to compress and base64 encode data
const compressAndEncode = async (data: object): Promise<string> => {
    const jsonString = JSON.stringify(data);
    const stream = new Blob([jsonString], { type: 'application/json' }).stream().pipeThrough(new CompressionStream('gzip'));
    const compressedBlob = await new Response(stream).blob();
    // Using fetch to convert blob to base64 is a robust way to handle it in browser
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressedBlob);
    });
    return dataUrl.split(',', 2)[1];
};

const toUrlSafeBase64 = (base64: string): string => {
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

const fromUrlSafeBase64 = (safeBase64: string): string => {
    let base64 = safeBase64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return base64;
};


// Helper function to decode from base64 and decompress
const decodeAndDecompress = async (base64: string): Promise<any> => {
    const compressedBlob = await (await fetch(`data:application/octet-stream;base64,${base64}`)).blob();
    const stream = compressedBlob.stream().pipeThrough(new DecompressionStream('gzip'));
    const decompressedBlob = await new Response(stream).blob();
    const jsonString = await decompressedBlob.text();
    return JSON.parse(jsonString);
};

const Footer: React.FC<{ info: CompanyInfo | null }> = ({ info }) => {
    if (!info) return null;
    return (
        <footer className="bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-gray-600 dark:text-neutral-400 text-sm">
                <div className="space-y-4">
                    {info.logo && <img src={info.logo} alt={info.name} className="h-10 w-auto" />}
                    <p>{info.slogan}</p>
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Contact</h4>
                    <p>{info.address}</p>
                    <p>{info.email}</p>
                    <p>{info.phone}</p>
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Legal</h4>
                    <p>{info.legal}</p>
                    <p>© {new Date().getFullYear()} {info.name}. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
};


const AppContent: React.FC = () => {
  const { t, tWithFallback, language } = useLanguage();
  const [cardData, setCardData] = useState<BusinessCardData>(() => getDefaultCardData(language));
  const [theme, setTheme] = useState<ThemeColors>(THEMES.Arctic);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string>('');
  const cardPreviewRef = useRef<HTMLDivElement>(null);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [isKakaoSdkReady, setIsKakaoSdkReady] = useState(false);
  const [receivedCard, setReceivedCard] = useState<Omit<SavedCard, 'id' | 'thumbnail' | 'isPublic'> | null>(null);
  const receivedCardPreviewRef = useRef<HTMLDivElement>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [appMode, setAppMode] = useState<'hub' | 'editor'>('hub');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [mobileSheetSection, setMobileSheetSection] = useState<string | null>(null);
  const [isPreviewFullScreen, setIsPreviewFullScreen] = useState(false);
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const [uiTheme, setUiTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('ui-theme') === 'light') {
        return 'light';
    }
    return 'dark';
  });

  // Effect to manage UI theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(uiTheme);
    localStorage.setItem('ui-theme', uiTheme);
  }, [uiTheme]);

  // Effect to check if language selector should be shown
  useEffect(() => {
    const hasSelectedLanguage = localStorage.getItem('onepage-language');
    if (!hasSelectedLanguage) {
      setShowLanguageSelector(true);
    }
  }, []);
  

  // One-time setup effect to handle initialization and shared cards
  useEffect(() => {
    const initializeApp = async () => {
        // Handle incoming card first, before anything else
        const urlParams = new URLSearchParams(window.location.search);
        const cardDataParam = urlParams.get('card');
        if (cardDataParam) {
            try {
                const standardBase64 = fromUrlSafeBase64(cardDataParam);
                const data = await decodeAndDecompress(standardBase64);
                if (data.cardData && data.theme) {
                    setReceivedCard(data);
                } else {
                    throw new Error("Invalid card data structure");
                }
            } catch (error) {
                console.error("Failed to process shared card data:", error);
                alert("The shared card link seems to be invalid or corrupted.");
                // Clean the URL to prevent re-processing on hot-reload or navigation
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }

        // A script in index.html now handles clearing sessionStorage before React loads.
        // We still reset the React state here to ensure a clean slate on every mount,
        // which guarantees the login screen is always displayed on a fresh start.
        setCurrentUser(null);
        setIsAdmin(false);

        if (window.Kakao && process.env.KAKAO_APP_KEY) {
          if (!window.Kakao.isInitialized()) {
            window.Kakao.init(process.env.KAKAO_APP_KEY);
            setIsKakaoSdkReady(true);
          }
        }
        
        const info = await api.getCompanyInfo();
        setCompanyInfo(info);
        setIsLoadingApp(false);
    };

    // This event listener handles cases where the page is restored from the back-forward cache (bfcache).
    // Some browsers preserve the entire page state, including React state, which would bypass our
    // initialization logic. Reloading the page ensures we always start fresh.
    const handlePageShow = (event: PageTransitionEvent) => {
        if (event.persisted) {
            window.location.reload();
        }
    };

    window.addEventListener('pageshow', handlePageShow);
    
    initializeApp();

    return () => {
        window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
        if (currentUser) {
            try {
                const [cards, meta] = await Promise.all([
                    api.getCards(currentUser),
                    api.getUserMeta(currentUser)
                ]);
                setSavedCards(cards);
                setUserMetadata(meta);
            } catch (error) {
                console.error("Failed to load user data", error);
                setSavedCards([]);
                setUserMetadata(null);
            }
        } else {
            setSavedCards([]);
            setUserMetadata(null);
        }
    };
    loadUserData();
  }, [currentUser]);


  const updateSavedCards = async (newCards: SavedCard[]): Promise<boolean> => {
    if (!currentUser) return false;
    try {
        await api.saveCards(currentUser, newCards);
        setSavedCards(newCards);
        return true;
    } catch (error) {
        console.error("Failed to save cards:", error);
        return false;
    }
  };

  const decrementAiUses = useCallback(async () => {
    if (!currentUser || !userMetadata) return;
    const newUses = Math.max(0, userMetadata.aiUses - 1);
    const newMeta = { ...userMetadata, aiUses: newUses };
    await api.updateUserMeta(currentUser, newMeta);
    setUserMetadata(newMeta);
  }, [currentUser, userMetadata]);
  
  const handleSaveCard = async () => {
    if (!cardPreviewRef.current) return;
    
    let thumbnail: string;
    // Prioritize banner image for thumbnail if it's not a video
    if (cardData.bannerImage.src && !cardData.bannerImage.src.startsWith('data:video')) {
        thumbnail = cardData.bannerImage.src;
    } else {
        setExportMessage('Saving thumbnail...');
        setIsExporting(true);
        const canvas = await html2canvas(cardPreviewRef.current, { scale: 0.5, useCORS: true });
        thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        setIsExporting(false);
        setExportMessage('');
    }
    
    let success = false;
    if (editingCardId) {
       // Update existing card
      const updatedCards = savedCards.map(card => 
        card.id === editingCardId 
        ? { ...card, cardData, theme, thumbnail } // isPublic is preserved
        : card
      );
      success = await updateSavedCards(updatedCards);
    } else {
      // Create new card
      const newCardId = crypto.randomUUID();
      const newCard: SavedCard = {
        id: newCardId,
        cardData,
        theme,
        thumbnail,
        isPublic: true, // Default to public
      };
      success = await updateSavedCards([...savedCards, newCard]);
      if (success) {
        setEditingCardId(newCardId); // Set the ID so subsequent saves are updates
      }
    }
    
    if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
    }

    setIsExporting(false);
    setExportMessage('');
  };

  const handleCreateNewCard = () => {
    setCardData(DEFAULT_CARD_DATA);
    setTheme(THEMES.Arctic);
    setEditingCardId(null);
    setAppMode('editor');
  };

  const handleEditCard = (cardId: string) => {
    const cardToLoad = savedCards.find(c => c.id === cardId);
    if (cardToLoad) {
      setCardData(cardToLoad.cardData);
      setTheme(cardToLoad.theme);
      setEditingCardId(cardId);
      setAppMode('editor');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if(window.confirm('Are you sure you want to delete this card?')) {
        const updatedCards = savedCards.filter(c => c.id !== cardId);
        await updateSavedCards(updatedCards);
    }
  };
  
  const handleTogglePrivacy = async (cardId: string) => {
    const updatedCards = savedCards.map(card => {
        if (card.id === cardId) {
            return { ...card, isPublic: !card.isPublic };
        }
        return card;
    });
    await updateSavedCards(updatedCards);
  };

  const handleDataChange = useCallback((field: keyof BusinessCardData, value: any) => {
    setCardData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const handleThemeChange = useCallback((newTheme: ThemeColors) => {
    setTheme(newTheme);
    // Automatically adjust font colors for better contrast with the new theme
    setCardData(prev => ({
        ...prev,
        nameFontColor: newTheme.primary,
        titleFontColor: newTheme.text,
        companyFontColor: newTheme.primary,
        baseFontColor: newTheme.text,
    }));
  }, []);

  const handleThemeColorChange = useCallback((colorName: keyof ThemeColors, value: string) => {
    setTheme(prev => ({...prev, [colorName]: value}));
  }, []);
  
  const handleStyleReset = useCallback(() => {
    setTheme(THEMES.Arctic);
    setCardData(prev => ({
        ...prev,
        fontFamily: DEFAULT_CARD_DATA.fontFamily,
        nameFontSize: DEFAULT_CARD_DATA.nameFontSize,
        nameFontWeight: DEFAULT_CARD_DATA.nameFontWeight,
        nameFontColor: THEMES.Arctic.primary,
        titleFontSize: DEFAULT_CARD_DATA.titleFontSize,
        titleFontWeight: DEFAULT_CARD_DATA.titleFontWeight,
        titleFontColor: THEMES.Arctic.text,
        companyFontSize: DEFAULT_CARD_DATA.companyFontSize,
        companyFontWeight: DEFAULT_CARD_DATA.companyFontWeight,
        companyFontColor: THEMES.Arctic.primary,
        baseFontSize: DEFAULT_CARD_DATA.baseFontSize,
        baseFontWeight: DEFAULT_CARD_DATA.baseFontWeight,
        baseFontColor: THEMES.Arctic.text,
    }));
  }, []);
  
  const handleTypographyReset = useCallback(() => {
    setCardData(prev => ({
        ...prev,
        fontFamily: DEFAULT_CARD_DATA.fontFamily,
        nameFontSize: DEFAULT_CARD_DATA.nameFontSize,
        nameFontWeight: DEFAULT_CARD_DATA.nameFontWeight,
        nameFontColor: theme.primary,
        titleFontSize: DEFAULT_CARD_DATA.titleFontSize,
        titleFontWeight: DEFAULT_CARD_DATA.titleFontWeight,
        titleFontColor: theme.text,
        companyFontSize: DEFAULT_CARD_DATA.companyFontSize,
        companyFontWeight: DEFAULT_CARD_DATA.companyFontWeight,
        companyFontColor: theme.primary,
        baseFontSize: DEFAULT_CARD_DATA.baseFontSize,
        baseFontWeight: DEFAULT_CARD_DATA.baseFontWeight,
        baseFontColor: theme.text,
    }));
  }, [theme]);
  
  const handleMediaReset = useCallback(() => {
    setCardData(prev => ({
        ...prev,
        bannerImage: DEFAULT_CARD_DATA.bannerImage,
        profilePicture: DEFAULT_CARD_DATA.profilePicture,
    }));
  }, []);

  const handleBasicInfoReset = useCallback(() => {
      setCardData(prev => ({
          ...prev,
          name: '',
          title: '',
          company: '',
          bio: '',
      }));
  }, []);

  const handleContactInfoReset = useCallback(() => {
      setCardData(prev => ({ ...prev, contactInfo: [{ id: crypto.randomUUID(), type: 'email', value: '' }] }));
  }, []);

  const handleSocialLinksReset = useCallback(() => {
      setCardData(prev => ({ ...prev, socialLinks: [{ id: crypto.randomUUID(), platform: 'website', url: '' }] }));
  }, []);

  const handleCareerHistoryReset = useCallback(() => {
      setCardData(prev => ({ ...prev, careerHistory: [{ id: crypto.randomUUID(), title: '', company: '', startDate: '', endDate: '', description: '' }] }));
  }, []);


  const handleContactInfoChange = useCallback((newContacts: ContactInfo[]) => {
    setCardData(prev => ({ ...prev, contactInfo: newContacts }));
  }, []);

  const handleSocialLinksChange = useCallback((newLinks: SocialLink[]) => {
    setCardData(prev => ({ ...prev, socialLinks: newLinks }));
  }, []);
  
  const handleCareerHistoryChange = useCallback((newHistory: CareerEntry[]) => {
    setCardData(prev => ({ ...prev, careerHistory: newHistory }));
  }, []);

  const handleGenerateBio = useCallback(async () => {
    if (!currentUser || !userMetadata || userMetadata.aiUses <= 0) {
      alert('AI 사용 횟수가 부족합니다.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.generateBio(cardData.name, cardData.title, cardData.company);
      if (response.success && response.bio) {
        setCardData(prev => ({ ...prev, bio: response.bio }));
        await decrementAiUses();
      } else {
        alert('AI 생성을 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Failed to generate bio:', error);
      alert('AI 생성을 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  }, [currentUser, userMetadata, cardData.name, cardData.title, cardData.company, decrementAiUses]);

  
  const handleDownload = async (format: 'png') => {
    if (!cardPreviewRef.current) return;
    setExportMessage(`Generating ${format.toUpperCase()}...`);
    setIsExporting(true);

    await new Promise(resolve => setTimeout(resolve, 200));

    const canvas = await html2canvas(cardPreviewRef.current, { 
      scale: 1,
      useCORS: true,
      backgroundColor: null,
    });
    
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${cardData.name.replace(/\s/g, '_')}_business_card.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExporting(false);
    setExportMessage('');
  };
  
  const handleKakaoShare = (url: string) => {
    if (!isKakaoSdkReady) {
      alert("To enable Kakao sharing, please provide a KAKAO_APP_KEY in your environment variables.");
      return;
    }
    
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text: `Check out my digital business card:\n${cardData.name} | ${cardData.title} @ ${cardData.company}`,
      link: {
        mobileWebUrl: url,
        webUrl: url,
      },
    });
  };

  const getDataForSharing = () => {
    const isEditingSavedCard = editingCardId && savedCards.some(c => c.id === editingCardId);
    if (isEditingSavedCard) {
      const savedCard = savedCards.find(c => c.id === editingCardId)!;
      return {
        cardData: savedCard.cardData,
        theme: savedCard.theme,
      };
    }
    // For new cards or if something is weird
    return { cardData, theme };
  };

  const createAndShareLink = async (dataToShare: { cardData: BusinessCardData, theme: ThemeColors }) => {
    setExportMessage('Creating share link...');
    setIsExporting(true);
    try {
        // Create a simplified version for sharing to reduce size
        const simplifiedData = {
            cardData: {
                name: dataToShare.cardData.name,
                title: dataToShare.cardData.title,
                company: dataToShare.cardData.company,
                bio: dataToShare.cardData.bio,
                contactInfo: dataToShare.cardData.contactInfo,
                socialLinks: dataToShare.cardData.socialLinks,
                careerHistory: dataToShare.cardData.careerHistory
            },
            theme: dataToShare.theme
        };

        const encodedData = await compressAndEncode(simplifiedData);
        const safeEncodedData = toUrlSafeBase64(encodedData);
        
        // Check if URL is too long (browsers have URL length limits)
        const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
        const url = `${baseUrl}?card=${safeEncodedData}`;
        
        if (url.length > 2000) { // Most browsers support up to 2000-8000 characters
            console.warn("URL too long, using simplified sharing");
            // Use a simple sharing approach without URL encoding
            const cardName = dataToShare.cardData.name;
            const shareText = cardName ? 
                `${cardName}의 디지털 명함을 확인해보세요!` : 
                '디지털 명함을 확인해보세요!';
            
            if (navigator.share && navigator.canShare) {
                try {
                    await navigator.share({
                        title: '디지털 명함',
                        text: shareText,
                        url: baseUrl
                    });
                } catch (shareError) {
                    console.log("Web Share API failed, falling back to copy:", shareError);
                    await navigator.clipboard.writeText(shareText + ' ' + baseUrl);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                }
            } else {
                await navigator.clipboard.writeText(shareText + ' ' + baseUrl);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            }
        } else {
            const cardName = dataToShare.cardData.name;
            const sharePayload = {
                title: cardName ? `${cardName}'s Business Card` : 'Digital Business Card',
                text: cardName ? `Check out ${cardName}'s digital business card.` : 'Check out my digital business card.',
                url: url,
            };

            // Check if Web Share API is available and supported
            if (navigator.share && navigator.canShare && navigator.canShare(sharePayload)) {
                try {
                    await navigator.share(sharePayload);
                } catch (shareError) {
                    console.log("Web Share API failed, falling back to copy:", shareError);
                    // Fallback to clipboard
                    await navigator.clipboard.writeText(url);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                }
            } else {
                console.log("Web Share API not supported, falling back to copy.");
                // Fallback to clipboard
                await navigator.clipboard.writeText(url);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            }
        }
    } catch (error) {
        console.error("Failed to create or share link:", error);
        // More user-friendly error message
        alert("링크 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
        setIsExporting(false);
        setExportMessage('');
    }
  };
  
  const handleShare = () => {
    const dataToShare = getDataForSharing();
    createAndShareLink(dataToShare);
  };
  
  const handleShareCardFromHub = (cardId: string) => {
      const cardToShare = savedCards.find(c => c.id === cardId);
      if (cardToShare) {
          if (!cardToShare.isPublic) {
              alert("This card is private. Please make it public before sharing.");
              return;
          }
          const { cardData, theme } = cardToShare;
          createAndShareLink({ cardData, theme });
      } else {
          alert("Could not find the card to share.");
      }
  };

  const handleCopyShareLink = async () => {
    setExportMessage('Creating share link...');
    setIsExporting(true);
    const dataToShare = getDataForSharing();
    try {
        const encodedData = await compressAndEncode(dataToShare);
        const safeEncodedData = toUrlSafeBase64(encodedData);
        const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
        const url = `${baseUrl}?card=${safeEncodedData}`;
        await navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
        console.error("Failed to create share link:", error);
        alert("Could not create a shareable link.");
    } finally {
        setIsExporting(false);
        setExportMessage('');
    }
  };

  const handleAddReceivedCard = async () => {
    if (!receivedCard || !receivedCardPreviewRef.current || !currentUser) return;

    const canvas = await html2canvas(receivedCardPreviewRef.current, { scale: 0.5, useCORS: true });
    const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
    
    const newCard: SavedCard = {
      id: crypto.randomUUID(),
      cardData: receivedCard.cardData,
      theme: receivedCard.theme,
      thumbnail,
      isPublic: true,
    };
    await updateSavedCards([...savedCards, newCard]);
    setReceivedCard(null);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleLogin = async (username: string) => {
    const adminStatus = await api.isAdmin(username);
    setCurrentUser(username);
    setIsAdmin(adminStatus);
    if (!adminStatus) {
        setAppMode('hub');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setAppMode('hub'); // Reset to hub view on logout
  };
  
  const toggleUiTheme = () => {
    setUiTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleCompanyInfoUpdate = async () => {
    const info = await api.getCompanyInfo();
    setCompanyInfo(info);
  };

  if (isLoadingApp) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#282728]">
            <i className="fa-solid fa-spinner fa-spin text-4xl text-gray-500 dark:text-neutral-400"></i>
        </div>
    );
  }

  // Show language selector if no language has been selected
  if (showLanguageSelector) {
    return (
      <LanguageSelector 
        showAsModal={true} 
        onLanguageSelect={() => setShowLanguageSelector(false)} 
      />
    );
  }
  
  const ThemeToggleButton = () => (
    <button 
        onClick={toggleUiTheme} 
        title={`Switch to ${uiTheme === 'dark' ? 'light' : 'dark'} mode`} 
        className="bg-gray-200 dark:bg-neutral-800 text-gray-800 dark:text-white font-semibold py-2 px-3 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors text-sm"
    >
        {uiTheme === 'dark' ? <i className="fa-solid fa-sun"></i> : <i className="fa-solid fa-moon"></i>}
    </button>
  );

  const renderEditor = () => {
      const editorSections: {title: string, icon: string}[] = [
        { title: 'Appearance', icon: 'fa-swatchbook' },
        { title: 'Media', icon: 'fa-photo-film' },
        { title: 'Basic Information', icon: 'fa-id-card' },
        { title: 'Contact Information', icon: 'fa-address-book' },
        { title: 'Social Media Links', icon: 'fa-share-nodes' },
        { title: 'Career History', icon: 'fa-briefcase' },
    ];
      
      const ActionButtons = () => (
         <>
            <div className="flex justify-center gap-3 flex-nowrap bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm p-2 rounded-xl shadow-lg">
                <button title={editingCardId ? 'Update Card' : 'Save Card'} onClick={handleSaveCard} disabled={isExporting || saveSuccess} className="bg-gray-900 text-white dark:bg-white dark:text-black font-semibold py-2 px-5 rounded-lg hover:bg-gray-700 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center text-base disabled:opacity-50 disabled:cursor-not-allowed">
                    {saveSuccess ? (
                        <><i className="fa-solid fa-check text-green-500 mr-2"></i><span className="hidden sm:inline">Saved!</span></>
                    ) : (
                        <><i className="fa-solid fa-save mr-2"></i><span className="hidden sm:inline">{editingCardId ? 'Update' : 'Save'}</span></>
                    )}
                </button>
                <button title="Download as PNG" onClick={() => handleDownload('png')} disabled={isExporting} className="bg-gray-900 text-white dark:bg-white dark:text-black font-semibold py-2 px-5 rounded-lg hover:bg-gray-700 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center text-base disabled:opacity-50 disabled:cursor-wait">
                    <i className="fa-solid fa-image"></i>
                </button>
                 <button title={copySuccess ? "Link Copied!" : "Copy Share Link"} onClick={handleCopyShareLink} disabled={isExporting} className="bg-gray-900 text-white dark:bg-white dark:text-black font-semibold py-2 px-5 rounded-lg hover:bg-gray-700 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center text-base disabled:opacity-50">
                     {copySuccess ? <i className="fa-solid fa-check text-green-500"></i> : <i className="fa-solid fa-link"></i>}
                </button>
                <button title="Share" onClick={handleShare} disabled={isExporting} className="bg-gray-900 text-white dark:bg-white dark:text-black font-semibold py-2 px-5 rounded-lg hover:bg-gray-700 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center text-base disabled:opacity-50">
                    <i className="fa-solid fa-share-alt"></i>
                </button>
            </div>
            {isExporting && (
                <div className="text-center text-sm text-gray-500 dark:text-neutral-400 mt-2">
                     <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                     {exportMessage || 'Processing...'}
                </div>
            )}
        </>
      );
      
      return (
        <main className="flex flex-col lg:flex-row lg:gap-12 w-full h-screen max-h-screen overflow-hidden max-w-screen-2xl mx-auto">
            {/* Preview Pane */}
            <div 
              className={`flex-1 lg:w-1/2 flex flex-col items-center relative lg:sticky lg:top-0 h-screen lg:h-auto transition-all duration-300
                ${isPreviewFullScreen 
                    ? 'fixed inset-0 z-40 bg-gray-100 dark:bg-[#282728] p-4 overflow-y-auto justify-center' 
                    : 'p-4 overflow-y-auto pt-16 lg:pt-8 pb-40 lg:pb-4 justify-start'
                }`
              }
            >
               <div className="fixed top-4 left-4 z-50 lg:hidden">
                  <button
                      onClick={() => setIsPreviewFullScreen(prev => !prev)}
                      title={isPreviewFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                      className="w-10 h-10 bg-black/30 text-white rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-black/50"
                  >
                      <i className={`fa-solid ${isPreviewFullScreen ? 'fa-compress' : 'fa-expand'}`}></i>
                  </button>
               </div>
               <div className={`w-full hidden lg:flex justify-between items-center mb-4 border-b border-gray-200 dark:border-neutral-800 pb-4 ${isPreviewFullScreen ? 'hidden' : ''}`}>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {editingCardId ? tWithFallback('editor.editCard', 'Edit Card') : tWithFallback('editor.createNewCard', 'Create New Card')}
                    </h1>
                    <div className="flex items-center gap-3">
                        <ThemeToggleButton />
                        <button onClick={() => setAppMode('hub')} className="bg-gray-200 dark:bg-neutral-800 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors text-sm">
                            <i className="fa-solid fa-times mr-2"></i>{tWithFallback('editor.close', 'Close')}
                        </button>
                    </div>
                </div>
                <div 
                  className={`transition-all duration-300 w-full max-w-md lg:pb-0`}
                >
                  <CardPreview data={cardData} theme={theme} ref={cardPreviewRef} isExporting={isExporting} />
                </div>
                <div className={`fixed lg:static bottom-4 left-4 right-4 lg:bottom-auto lg:left-auto lg:right-auto lg:mt-6 flex-col items-center gap-3 z-20 hidden lg:flex ${isPreviewFullScreen ? 'hidden' : ''}`}>
                     <ActionButtons/>
                </div>
            </div>

            {/* Form Pane (Desktop) */}
            <div className={`hidden lg:flex w-full lg:w-1/2 bg-transparent border-l-0 border-t-2 lg:border-t-0 border-gray-200 dark:border-neutral-800 flex-col h-full ${isPreviewFullScreen ? 'hidden' : ''}`}>
               <div className="flex-grow overflow-y-auto lg:pr-6 lg:pt-8">
                  <CardForm 
                    data={cardData}
                    theme={theme}
                    userMetadata={userMetadata}
                    onThemeChange={handleThemeChange}
                    onThemeColorChange={handleThemeColorChange}
                    onStyleReset={handleStyleReset}
                    onTypographyReset={handleTypographyReset}
                    onMediaReset={handleMediaReset}
                    onBasicInfoReset={handleBasicInfoReset}
                    onContactInfoReset={handleContactInfoReset}
                    onSocialLinksReset={handleSocialLinksReset}
                    onCareerHistoryReset={handleCareerHistoryReset}
                    onDataChange={handleDataChange}
                    onContactInfoChange={handleContactInfoChange}
                    onSocialLinksChange={handleSocialLinksChange}
                    onCareerHistoryChange={handleCareerHistoryChange}
                  />
               </div>
            </div>

            {/* --- MOBILE UI --- */}
            <div className={`lg:hidden ${isPreviewFullScreen ? 'hidden' : ''}`}>
                {/* Mobile top header (fixed) */}
                <div className="fixed top-0 left-0 right-0 z-20 p-4 pl-16 flex justify-between items-center bg-gray-50/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-neutral-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {editingCardId ? 'Edit Card' : 'Create New Card'}
                    </h2>
                    <div className="flex items-center gap-3">
                        <ThemeToggleButton />
                        <button onClick={() => setAppMode('hub')} className="text-xl text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white">
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </div>
                </div>
                
                {/* Mobile Action Buttons */}
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 lg:hidden">
                    <ActionButtons />
                </div>


                {/* Mobile bottom icon tabs (fixed) */}
                <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.1)] p-2">
                    <div className="flex justify-around items-center gap-1 overflow-x-auto">
                        {editorSections.map(section => (
                            <button 
                                key={section.title} 
                                title={section.title}
                                onClick={() => setMobileSheetSection(section.title)} 
                                className="flex items-center justify-center p-2 rounded-full w-14 h-14 shrink-0 hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 transition-colors"
                            >
                                <i className={`fa-solid ${section.icon} text-xl`}></i>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mobile Bottom Sheet for Editing */}
                {mobileSheetSection && (
                  <div className="fixed top-0 left-0 right-0 bottom-[4.5rem] bg-black/60 z-30" onClick={() => setMobileSheetSection(null)}>
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-gray-50 dark:bg-neutral-900 rounded-t-2xl max-h-[calc(50vh-4.5rem)] flex flex-col"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-lg">{mobileSheetSection}</h3>
                        <button onClick={() => setMobileSheetSection(null)} className="p-2 -mr-2"><i className="fa-solid fa-times text-xl"></i></button>
                      </div>

                      <div className="flex-grow overflow-y-auto">
                        <CardForm 
                          data={cardData}
                          theme={theme}
                          userMetadata={userMetadata}
                          onThemeChange={handleThemeChange}
                          onThemeColorChange={handleThemeColorChange}
                          onStyleReset={handleStyleReset}
                          onTypographyReset={handleTypographyReset}
                          onMediaReset={handleMediaReset}
                          onBasicInfoReset={handleBasicInfoReset}
                          onContactInfoReset={handleContactInfoReset}
                          onSocialLinksReset={handleSocialLinksReset}
                          onCareerHistoryReset={handleCareerHistoryReset}
                          onDataChange={handleDataChange}
                          onContactInfoChange={handleContactInfoChange}
                          onSocialLinksChange={handleSocialLinksChange}
                          onCareerHistoryChange={handleCareerHistoryChange}
                          onGenerateBio={handleGenerateBio}
                          isGeneratingBio={isGenerating}
                          activeSection={mobileSheetSection}
                        />
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </main>
      );
  };
  
  const renderReceivedCardModal = () => {
    if (!receivedCard) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="received-card-title">
            <div className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 p-6 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                <h2 id="received-card-title" className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">You've Received a Business Card!</h2>
                <div className={`transition-all duration-300 max-w-md mx-auto`}>
                    <CardPreview 
                        ref={receivedCardPreviewRef} 
                        data={receivedCard.cardData} 
                        theme={receivedCard.theme} 
                    />
                </div>
                <div className="flex justify-center gap-4 mt-6">
                    {currentUser && (
                        <button onClick={handleAddReceivedCard} className="px-6 py-2 bg-gray-900 text-white dark:bg-white dark:text-black font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-neutral-200 transition-colors">
                            <i className="fa-solid fa-plus mr-2"></i>Add to My Cards
                        </button>
                    )}
                    <button 
                        onClick={() => {
                            setReceivedCard(null);
                            window.history.replaceState({}, document.title, window.location.pathname);
                        }} 
                        className="px-6 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
                    >
                        Dismiss
                    </button>
                </div>
                {!currentUser && (
                    <p className="text-center text-sm text-gray-500 dark:text-neutral-400 mt-4">Please log in to save this card to your collection.</p>
                )}
            </div>
        </div>
    );
  };

  if (!currentUser) {
    return (
        <>
            {renderReceivedCardModal()}
            <LoginModal onLogin={handleLogin} companyInfo={companyInfo} />
        </>
    );
  }

  if (isAdmin) {
    return (
        <>
            {renderReceivedCardModal()}
            <AdminPage currentUser={currentUser} onLogout={handleLogout} onCompanyInfoUpdate={handleCompanyInfoUpdate} />
        </>
    );
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col`}>
      {renderReceivedCardModal()}
      <div className="flex-grow">
        {appMode === 'hub' ? (
          <div className="p-4 sm:p-6 lg:p-8">
            <Hub 
              currentUser={currentUser}
              cards={savedCards}
              onCreate={handleCreateNewCard}
              onEdit={handleEditCard}
              onDelete={handleDeleteCard}
              onShare={handleShareCardFromHub}
              onLogout={handleLogout}
              onTogglePrivacy={handleTogglePrivacy}
              uiTheme={uiTheme}
              onToggleUiTheme={toggleUiTheme}
              companyInfo={companyInfo}
            />
          </div>
        ) : renderEditor()}
      </div>
      
      {appMode === 'hub' && <Footer info={companyInfo} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;