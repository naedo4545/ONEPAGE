
import React, { useRef, useState } from 'react';
import type { Media, UserMetadata } from '../types';
import MediaEditorModal from './MediaEditorModal';
import { useLanguage } from '../contexts/LanguageContext';

interface ImageUploaderProps {
    label: string;
    value: Media;
    onValueChange: (value: Media) => void;
    aspectRatio: "16:9" | "1:1" | "9:16";
    userMetadata: UserMetadata | null;
    skipEditor?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ label, value, onValueChange, aspectRatio, userMetadata, skipEditor = false }) => {
    const { tWithFallback } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [editorConfig, setEditorConfig] = useState<{ media: Omit<Media, 'zoom' | 'position'>, isCircleCrop: boolean } | null>(null);
    
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [url, setUrl] = useState('');

    const handleProcessedMedia = (src: string, fileAspectRatio: number) => {
        if (skipEditor) {
            onValueChange({ src, aspectRatio: fileAspectRatio });
        } else {
             setEditorConfig({
                media: { src, aspectRatio: fileAspectRatio },
                isCircleCrop: aspectRatio === '1:1',
            });
        }
    };

    const processFileAndOpenEditor = (file: File) => {
        const handleProcessedFile = (src: string, fileAspectRatio: number) => {
             handleProcessedMedia(src, fileAspectRatio);
        };

        const processAndResizeImage = (imageSource: ImageBitmap | HTMLImageElement, originalFileType: string) => {
            const MAX_DIMENSION = 1280;
            const originalWidth = 'naturalWidth' in imageSource ? imageSource.naturalWidth : imageSource.width;
            const originalHeight = 'naturalHeight' in imageSource ? imageSource.naturalHeight : imageSource.height;

            let width = originalWidth;
            let height = originalHeight;

            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                if (width > height) {
                    height = Math.round((height * MAX_DIMENSION) / width);
                    width = MAX_DIMENSION;
                } else {
                    width = Math.round((width * MAX_DIMENSION) / height);
                    height = MAX_DIMENSION;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.drawImage(imageSource, 0, 0, width, height);
                const resizedDataUrl = canvas.toDataURL(originalFileType, 0.85);
                handleProcessedFile(resizedDataUrl, width / height);
            } else {
                console.error("Canvas 2D context not available. Falling back to original file.");
                const reader = new FileReader();
                reader.onload = e => handleProcessedFile(e.target?.result as string, originalWidth / originalHeight);
                reader.readAsDataURL(file);
            }
        };

        if (file.type.startsWith('image/')) {
            if (window.createImageBitmap) {
                createImageBitmap(file, { imageOrientation: 'from-image' })
                    .then(imageBitmap => {
                        processAndResizeImage(imageBitmap, file.type);
                    })
                    .catch(e => {
                        console.error("createImageBitmap failed, using fallback. Image may be incorrectly oriented.", e);
                        const reader = new FileReader();
                        reader.onload = e => {
                            const img = new Image();
                            img.onload = () => processAndResizeImage(img, file.type);
                            img.src = e.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                    });
            } else {
                const reader = new FileReader();
                reader.onload = e => {
                    const img = new Image();
                    img.onload = () => processAndResizeImage(img, file.type);
                    img.src = e.target?.result as string;
                };
                reader.readAsDataURL(file);
            }
        } else if (file.type.startsWith('video/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64String = e.target?.result as string;
                if (!base64String) return;

                const video = document.createElement('video');
                let fired = false; 

                const handleSuccess = () => {
                    if (fired) return;
                    fired = true;
                    handleProcessedFile(base64String, video.videoWidth / video.videoHeight);
                };

                const handleError = () => {
                    if (fired) return;
                    fired = true;
                    console.warn("Could not determine video dimensions. Falling back to default aspect ratio.");
                    handleProcessedFile(base64String, 16 / 9);
                };

                video.onloadedmetadata = handleSuccess;
                video.onerror = handleError;
                video.src = base64String;

                setTimeout(() => {
                    if (!fired) {
                        handleError();
                    }
                }, 3000); 
            };
            reader.readAsDataURL(file);
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) processFileAndOpenEditor(file);
    };

    const triggerFileSelect = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Allow re-uploading the same file
            fileInputRef.current?.click();
        }
    };

    
    const handleUrlLoad = async () => {
        if (!url.trim()) return;
        setIsLoading(true);
        setLoadingMessage('Loading from URL...');
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);
            const blob = await response.blob();

            const reader = new FileReader();
            reader.onload = (e) => {
                const base64String = e.target?.result as string;
                if (!base64String) {
                    throw new Error('Could not read file from URL.');
                }

                if (blob.type.startsWith('image/')) {
                    const img = new Image();
                    img.onload = () => handleProcessedMedia(base64String, img.naturalWidth / img.naturalHeight);
                    img.src = base64String;
                } else if (blob.type.startsWith('video/')) {
                    const video = document.createElement('video');
                    video.onloadedmetadata = () => handleProcessedMedia(base64String, video.videoWidth / video.videoHeight);
                    video.src = base64String;
                } else {
                    throw new Error(`Unsupported content type: ${blob.type}`);
                }
            };
            reader.onerror = () => { throw new Error('Error reading blob from URL'); };
            reader.readAsDataURL(blob);

        } catch (error) {
            console.error("URL loading error:", error);
            alert("Could not load media from the URL. This might be due to a network error or the server's CORS policy. Please try another URL or upload the file directly.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
            setActiveTool(null);
            setUrl('');
        }
    };


    const handleSaveCrop = (mediaUpdate: Partial<Media>) => {
        if (editorConfig) {
            const originalMedia = editorConfig.media;
            const finalMedia: Media = {
                src: mediaUpdate.src || originalMedia.src,
                aspectRatio: mediaUpdate.aspectRatio || originalMedia.aspectRatio,
                zoom: mediaUpdate.zoom,
                position: mediaUpdate.position,
            };
            onValueChange(finalMedia);
        }
        setEditorConfig(null);
    };

    const ToolButton: React.FC<{ icon: string; label: string; tool: string; }> = ({ icon, label, tool }) => {
        const isActive = activeTool === tool;
        return (
            <button
                onClick={() => {
                    if (tool === 'upload') {
                        triggerFileSelect();
                        setActiveTool(null);
                    } else {
                        setActiveTool(isActive ? null : tool);
                    }
                }}
                title={label}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-xs w-full transition-colors ${
                    isActive ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'bg-gray-200 dark:bg-neutral-700/50 hover:bg-gray-300 dark:hover:bg-neutral-700'
                }`}
            >
                <i className={`fa-solid ${icon} text-base`}></i>
                <span>{label}</span>
            </button>
        );
    };

    const isVideo = value.src.startsWith('data:video') || /\.(mp4|webm|ogg)$/i.test(value.src);
    const aspectRatioValue = aspectRatio === "16:9" ? 16/9 : aspectRatio === "9:16" ? 9/16 : 1;

    return (
        <div className="space-y-2">
            {editorConfig && (
                <MediaEditorModal
                    media={editorConfig.media}
                    isCircleCrop={editorConfig.isCircleCrop}
                    targetAspectRatio={aspectRatioValue}
                    onSave={handleSaveCrop}
                    onClose={() => setEditorConfig(null)}
                />
            )}
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-600 dark:text-neutral-400">{label}</label>
            </div>
            <div 
                className="w-full bg-gray-100 dark:bg-neutral-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-neutral-700 flex items-center justify-center text-gray-500 dark:text-neutral-500 hover:border-black dark:hover:border-white transition-colors cursor-pointer overflow-hidden relative group"
                style={{ aspectRatio: aspectRatioValue }}
                onClick={triggerFileSelect}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => { if (e.key === 'Enter') triggerFileSelect(); }}
            >
                {isLoading ? (
                    <div className="p-4 text-center">
                        <i className="fa-solid fa-spinner fa-spin text-3xl text-gray-900 dark:text-white"></i>
                        <p className="mt-2 text-sm text-gray-900 dark:text-white">{loadingMessage}</p>
                    </div>
                ) : value.src ? (
                    isVideo ? (
                        <div className="w-full h-full overflow-hidden">
                             <video 
                                src={value.src}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `translate(${value.position?.x || 0}px, ${value.position?.y || 0}px) scale(${value.zoom || 1})` }}
                                muted autoPlay loop playsInline key={value.src}
                             />
                        </div>
                    ) : (
                        <img src={value.src} alt="Media preview" className="w-full h-full object-cover" />
                    )
                ) : (
                    <div className="text-center">
                        <i className="fa-solid fa-cloud-arrow-up text-3xl"></i>
                        <p className="mt-1 text-sm">{tWithFallback('editor.clickToUpload', 'Click to upload')}</p>
                    </div>
                )}
                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-white font-semibold">{tWithFallback('editor.clickToUpload', 'Click to Upload')}</span>
                 </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />

            <div className="grid grid-cols-2 gap-2 mt-2 text-gray-800 dark:text-white">
                <ToolButton icon="fa-upload" label={tWithFallback('editor.upload', 'Upload')} tool="upload" />
                <ToolButton icon="fa-link" label={tWithFallback('editor.url', 'URL')} tool="url" />
            </div>
            
            {activeTool === 'url' && (
                <div className="p-3 bg-gray-200/50 dark:bg-neutral-800/50 rounded-lg">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder={tWithFallback('editor.pasteUrl', 'Paste image or video URL...')}
                            className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm py-1.5 px-3 text-gray-900 dark:text-white text-sm"
                        />
                        <button onClick={handleUrlLoad} disabled={!url} className="px-4 py-1.5 bg-gray-900 text-white dark:bg-white dark:text-black text-xs font-semibold rounded-md hover:bg-gray-700 dark:hover:bg-neutral-200 disabled:opacity-50">
                           {tWithFallback('editor.load', 'Load')}
                        </button>
                    </div>
                </div>
            )}


        </div>
    );
};

export default ImageUploader;
