
import React, { useState, useEffect, useMemo } from 'react';
import type { MediaSample, VideoGenerationRequest } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/apiService';

interface VideoSamplesContentProps {
    currentUser: string;
}

const StarRating: React.FC<{
    rating: number;
    onRate: (rating: number) => void;
    size?: string;
}> = ({ rating, onRate, size = 'text-lg' }) => {
    return (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        onRate(star);
                    }}
                    className={`transition-colors duration-150 ${size} ${star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-neutral-600 hover:text-yellow-300'}`}
                    aria-label={`Rate ${star} star`}
                >
                    <i className="fa-solid fa-star"></i>
                </button>
            ))}
        </div>
    );
};

const VideoSamplesContent: React.FC<VideoSamplesContentProps> = ({ currentUser }) => {
    const { t, tWithFallback } = useLanguage();
    const [samples, setSamples] = useState<MediaSample[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSample, setSelectedSample] = useState<MediaSample | null>(null);
    const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
    const [selectedInquirySampleId, setSelectedInquirySampleId] = useState<string>('');
    const [inquiryMessage, setInquiryMessage] = useState('');
    const [inquiryStatus, setInquiryStatus] = useState<'idle' | 'sending' | 'success'>('idle');
    const [myPicks, setMyPicks] = useState<string[]>([]);
    const [activeView, setActiveView] = useState<'all' | 'myPicks'>('all');


    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [allSamples, userPicks] = await Promise.all([
                    api.getSamples(),
                    api.getUserPicks(currentUser)
                ]);
                setSamples(allSamples);
                setMyPicks(userPicks);
            } catch (error) {
                console.error("Failed to load samples and user picks:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [currentUser]);

    const handleLike = async (sampleId: string) => {
        const updatedSamples = await api.toggleSampleLike(sampleId, currentUser);
        setSamples(updatedSamples);
    };

    const handleRate = async (sampleId: string, rating: number) => {
        const updatedSamples = await api.rateSample(sampleId, currentUser, rating);
        setSamples(updatedSamples);
    };

    const handleTogglePick = async (sampleId: string) => {
        const newPicks = await api.toggleUserPick(currentUser, sampleId);
        setMyPicks(newPicks);
    };

    const displayedSamples = useMemo(() => {
        if (activeView === 'myPicks') {
            return samples.filter(s => myPicks.includes(s.id));
        }
        return samples;
    }, [samples, myPicks, activeView]);

    const handleSendInquiry = async () => {
        if (!selectedInquirySampleId) {
            alert('Please select a sample to inquire about.');
            return;
        }
        if (!inquiryMessage.trim()) {
            alert('Please enter a message for your inquiry.');
            return;
        }
        setInquiryStatus('sending');
    
        const newRequest: Omit<VideoGenerationRequest, 'id' | 'status' | 'timestamp'> = {
            username: currentUser,
            prompt: inquiryMessage,
            selectedSampleIds: [selectedInquirySampleId],
        };
    
        try {
            await api.createVideoRequest(newRequest);
            setInquiryStatus('success');
            setTimeout(() => {
                setInquiryStatus('idle');
                setIsInquiryModalOpen(false);
                setSelectedInquirySampleId('');
                setInquiryMessage('');
            }, 2000);
        } catch (error) {
            console.error("Failed to send inquiry:", error);
            alert("An error occurred while sending your message.");
            setInquiryStatus('idle');
        }
    };

    if (isLoading) {
        return <div className="text-center py-10"><i className="fa-solid fa-spinner fa-spin mr-2"></i> {tWithFallback('mediaSamples.loading', 'Loading samples...')}</div>;
    }

    const ViewToggleButton: React.FC<{ view: 'all' | 'myPicks'; label: string; count?: number }> = ({ view, label, count }) => (
        <button
            onClick={() => setActiveView(view)}
            className={`px-6 py-2 font-semibold text-sm transition-colors relative ${activeView === view ? 'border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200 border-b-2 border-transparent'}`}
        >
            {label}
            {typeof count !== 'undefined' && <span className="ml-2 text-xs font-normal text-gray-400 dark:text-neutral-500">({count})</span>}
        </button>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {selectedSample && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSample(null)}>
                    <div className="bg-white dark:bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{selectedSample.name}</h3>
                            <button onClick={() => setSelectedSample(null)} className="text-2xl text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white">&times;</button>
                        </div>
                        <div className="flex-grow p-4 flex items-center justify-center">
                             {selectedSample.type === 'video' ? (
                                <video src={selectedSample.src} className="max-w-full max-h-[70vh]" controls autoPlay loop />
                            ) : (
                                <img src={selectedSample.src} alt={selectedSample.name} className="max-w-full max-h-[70vh] object-contain" />
                            )}
                        </div>
                    </div>
                </div>
            )}
             {isInquiryModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{tWithFallback('mediaSamples.productionInquiry', 'Production Inquiry')}</h2>
                            <button onClick={() => setIsInquiryModalOpen(false)} className="p-2 -mr-2"><i className="fa-solid fa-times text-xl"></i></button>
                        </div>
                        <div className="p-6 space-y-4 flex-grow overflow-y-auto">
                           <p className="text-gray-600 dark:text-neutral-400 text-sm mt-2">{tWithFallback('mediaSamples.inquiryDescription', 'Interested in a video like one of our samples? Select one from the list, describe your project, and our team will get back to you shortly.')}</p>
                            <div>
                                <label htmlFor="inquirySampleSelect" className="block text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">{tWithFallback('mediaSamples.selectSample', 'Select a Sample')}</label>
                                <select
                                    id="inquirySampleSelect"
                                    value={selectedInquirySampleId}
                                    onChange={(e) => setSelectedInquirySampleId(e.target.value)}
                                    className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                >
                                    <option value="">{tWithFallback('mediaSamples.chooseSample', '-- Choose a sample --')}</option>
                                    {samples.map(sample => (
                                        <option key={sample.id} value={sample.id}>{sample.name}</option>
                                    ))}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="inquiryMessage" className="block text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">{tWithFallback('mediaSamples.yourMessage', 'Your Message')}</label>
                                <textarea
                                    id="inquiryMessage"
                                    rows={4}
                                    value={inquiryMessage}
                                    onChange={(e) => setInquiryMessage(e.target.value)}
                                    placeholder={tWithFallback('mediaSamples.messagePlaceholder', 'Tell us about your project or ask any questions...')}
                                    className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-neutral-800/50 flex justify-end items-center gap-4">
                            {inquiryStatus === 'success' && <p className="text-sm text-green-600 dark:text-green-400"><i className="fa-solid fa-check mr-2"></i>{tWithFallback('mediaSamples.inquirySent', 'Inquiry sent successfully!')}</p>}
                            <button
                                onClick={handleSendInquiry}
                                disabled={inquiryStatus !== 'idle' || samples.length === 0}
                                className="px-6 py-2 bg-gray-900 text-white dark:bg-white dark:text-black font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
                            >
                                {inquiryStatus === 'sending' ? tWithFallback('mediaSamples.sending', 'Sending...') : tWithFallback('mediaSamples.sendInquiry', 'Send Inquiry')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-left">{tWithFallback('mediaSamples.title', 'Media Samples')}</h2>
                    <button onClick={() => setIsInquiryModalOpen(true)} className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-black font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-neutral-200 transition-colors">
                        <i className="fa-solid fa-paper-plane mr-2"></i>{tWithFallback('mediaSamples.productionInquiry', 'Production Inquiry')}
                    </button>
                </div>
                
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                        {tWithFallback('mediaSamples.videoRecommendation', '배너·프로필, "영상"으로 만들면 더 효과적입니다. 제작 문의해보세요')}
                    </p>
                </div>
                
                <div className="flex justify-start mb-6 border-b border-gray-200 dark:border-neutral-800">
                    <ViewToggleButton view="all" label={tWithFallback('mediaSamples.allSamples', 'All Samples')} count={samples.length} />
                    <ViewToggleButton view="myPicks" label={tWithFallback('mediaSamples.myPicks', 'My Picks')} count={myPicks.length} />
                </div>
                
                {displayedSamples.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {displayedSamples.map(sample => (
                            <div key={sample.id} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
                                <div className="aspect-[9/16] bg-gray-200 dark:bg-neutral-800 cursor-pointer relative group" onClick={() => setSelectedSample(sample)}>
                                    {sample.type === 'video' ? (
                                        <video src={sample.src} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                                    ) : (
                                        <img src={sample.src} alt={sample.name} className="w-full h-full object-cover" />
                                    )}
                                    {sample.type === 'video' && (
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                            <i className="fa-solid fa-play-circle text-white text-5xl"></i>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 flex-grow flex flex-col">
                                    <p className="font-bold text-sm truncate text-gray-800 dark:text-white" title={sample.name}>{sample.name}</p>
                                    <div className="mt-2 flex-grow">
                                        <StarRating 
                                            rating={sample.ratings[currentUser] || 0}
                                            onRate={(rating) => handleRate(sample.id, rating)}
                                            size="text-base"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-neutral-400 mt-2">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5" title={`${Object.keys(sample.ratings).length} ratings`}>
                                                <i className="fa-solid fa-star text-yellow-400"></i>
                                                <span>{sample.avgRating.toFixed(1)}</span>
                                            </div>
                                            <button onClick={() => handleLike(sample.id)} title="Like" className="flex items-center gap-1.5">
                                                <i className={`fa-solid fa-heart transition-colors ${sample.likedBy.includes(currentUser) ? 'text-red-500' : 'text-gray-400 dark:text-neutral-500 hover:text-red-400'}`}></i>
                                                <span>{sample.likedBy.length}</span>
                                            </button>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleTogglePick(sample.id); }}
                                            title={myPicks.includes(sample.id) ? "Remove from My Picks" : "Add to My Picks"}
                                            className="text-lg"
                                        >
                                            <i className={`fa-solid fa-bookmark transition-colors ${myPicks.includes(sample.id) ? 'text-blue-500' : 'text-gray-300 dark:text-neutral-600 hover:text-blue-400'}`}></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 px-4 bg-white dark:bg-neutral-900 border-2 border-dashed border-gray-300 dark:border-neutral-800 rounded-lg">
                        {activeView === 'myPicks' ? (
                            <>
                                <i className="fa-solid fa-bookmark text-5xl text-gray-400 dark:text-neutral-600"></i>
                                <p className="mt-4 text-lg text-gray-500 dark:text-neutral-400">You haven't picked any samples yet.</p>
                                <p className="text-sm text-gray-400 dark:text-neutral-500">Click the bookmark icon on a sample to add it to your picks!</p>
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-photo-film text-5xl text-gray-400 dark:text-neutral-600"></i>
                                <p className="mt-4 text-lg text-gray-500 dark:text-neutral-400">No media samples are available at the moment.</p>
                                <p className="text-sm text-gray-400 dark:text-neutral-500">Please check back later!</p>
                            </>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default VideoSamplesContent;
