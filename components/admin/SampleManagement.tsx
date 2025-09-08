
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { MediaSample } from '../../types';
import { api } from '../../services/apiService';

const ITEMS_PER_PAGE = 20;

const SampleManagement: React.FC = () => {
    const [samples, setSamples] = useState<MediaSample[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSample, setCurrentSample] = useState<Omit<MediaSample, 'id' | 'likedBy' | 'ratings' | 'avg_rating'>>({ name: '', src: '', type: 'image' });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchSamples = useCallback(async () => {
        setIsLoading(true);
        try {
            const allSamples = await api.getSamples();
            setSamples(allSamples);
        } catch (error) {
            console.error("Failed to load samples:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSamples();
    }, [fetchSamples]);

    const paginatedSamples = useMemo(() => {
        return samples.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [samples, currentPage]);
    
    const totalPages = Math.ceil(samples.length / ITEMS_PER_PAGE);

    const resetModal = () => {
        setEditingId(null);
        setCurrentSample({ name: '', src: '', type: 'image' });
        setIsModalOpen(false);
    };

    const openModalForNew = () => {
        setEditingId(null);
        setCurrentSample({ name: '', src: '', type: 'image' });
        setIsModalOpen(true);
    };
    
    const openModalForEdit = (sample: MediaSample) => {
        setEditingId(sample.id);
        setCurrentSample({ name: sample.name, src: sample.src, type: sample.type });
        setIsModalOpen(true);
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setCurrentSample(prev => ({ ...prev, src: base64String, type: file.type.startsWith('image/') ? 'image' : 'video' }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSave = async () => {
        if (!currentSample.name || !currentSample.src) {
            alert("Sample name and file are required.");
            return;
        }

        if (editingId) {
            await api.updateSample(editingId, currentSample);
        } else {
            await api.createSample(currentSample);
        }
        
        await fetchSamples();
        resetModal();
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this sample?")) {
            await api.deleteSample(id);
            await fetchSamples();
        }
    };

    if (isLoading) {
        return <div className="text-center py-10"><i className="fa-solid fa-spinner fa-spin mr-2"></i> Loading samples...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sample Management</h1>
                <button onClick={openModalForNew} className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-black font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-neutral-200 transition-colors">
                    <i className="fa-solid fa-plus mr-2"></i>Add Sample
                </button>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200 dark:border-neutral-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Edit' : 'Add New'} Sample</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">Sample Name</label>
                                <input type="text" value={currentSample.name} onChange={e => setCurrentSample(s => ({...s, name: e.target.value}))} className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md py-2 px-3 text-gray-900 dark:text-white"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">Media File (Image/Video)</label>
                                <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-200 dark:file:bg-neutral-700 file:text-gray-800 dark:file:text-white hover:file:bg-gray-300 dark:hover:file:bg-neutral-600"/>
                            </div>
                            {currentSample.src && (
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">Preview:</p>
                                    {currentSample.type === 'video' ? (
                                        <video src={currentSample.src} controls className="w-full rounded-md max-h-60" />
                                    ) : (
                                        <img src={currentSample.src} alt="preview" className="w-full rounded-md max-h-60 object-contain" />
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-neutral-800/50 flex justify-end gap-3">
                            <button onClick={resetModal} className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-black font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-neutral-200">Save</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {(paginatedSamples || []).map(sample => (
                    <div key={sample.id} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-md overflow-hidden group">
                        <div className="relative aspect-[9/16] bg-gray-200 dark:bg-neutral-800">
                             {sample.src ? (
                                sample.type === 'video' ? (
                                    <video src={sample.src} className="w-full h-full object-cover" muted autoPlay loop playsInline/>
                                ) : (
                                    <img src={sample.src} alt={sample.name} className="w-full h-full object-cover" />
                                )
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-neutral-400">
                                    <div className="text-center">
                                        <i className="fa-solid fa-image text-4xl mb-2"></i>
                                        <p className="text-sm">No Media</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-3">
                            <div className="flex justify-between items-start">
                                <p className="font-semibold text-sm text-gray-800 dark:text-neutral-200 truncate pr-2 flex-grow" title={sample.name}>{sample.name}</p>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    <button onClick={() => openModalForEdit(sample)} className="text-blue-500 hover:text-blue-700 w-7 h-7 flex items-center justify-center rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50" title="Edit Sample"><i className="fa-solid fa-pencil"></i></button>
                                    <button onClick={() => handleDelete(sample.id)} className="text-red-500 hover:text-red-700 w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" title="Delete Sample"><i className="fa-solid fa-trash-can"></i></button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-neutral-400 mt-1">
                                <div className="flex items-center gap-1" title={`${sample.likedBy?.length || 0} likes`}>
                                    <i className="fa-solid fa-heart text-red-500"></i>
                                    <span>{sample.likedBy?.length || 0}</span>
                                </div>
                                <div className="flex items-center gap-1" title={`${Object.keys(sample.ratings || {}).length} ratings`}>
                                    <i className="fa-solid fa-star text-yellow-400"></i>
                                    <span>{(sample.avg_rating || 0).toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
             {samples.length === 0 && (
                 <p className="p-6 text-center text-gray-500 dark:text-neutral-400">No samples have been added yet.</p>
             )}
             {totalPages > 1 && (
                <div className="p-4 flex items-center justify-center gap-2 border-t border-gray-200 dark:border-neutral-800">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-3 py-1 text-sm rounded-md bg-gray-200 dark:bg-neutral-800 disabled:opacity-50">Previous</button>
                    <span className="text-sm text-gray-700 dark:text-neutral-400">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="px-3 py-1 text-sm rounded-md bg-gray-200 dark:bg-neutral-800 disabled:opacity-50">Next</button>
                </div>
            )}
        </div>
    );
};

export default SampleManagement;
