import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import type { Media } from '../types';

interface MediaEditorModalProps {
    media: Omit<Media, 'zoom' | 'position'>;
    isCircleCrop: boolean;
    targetAspectRatio: number;
    onSave: (mediaUpdate: Partial<Media>) => void;
    onClose: () => void;
}

const MediaEditorModal: React.FC<MediaEditorModalProps> = ({ media, isCircleCrop, targetAspectRatio, onSave, onClose }) => {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [mediaSize, setMediaSize] = useState({ width: 0, height: 0 });
    const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isVideo = media.src.startsWith('data:video');

    useLayoutEffect(() => {
        if (mediaRef.current && containerRef.current) {
            const container = containerRef.current;
            const mediaEl = mediaRef.current;
            
            const onMediaLoad = () => {
                const naturalWidth = isVideo ? (mediaEl as HTMLVideoElement).videoWidth : (mediaEl as HTMLImageElement).naturalWidth;
                const naturalHeight = isVideo ? (mediaEl as HTMLVideoElement).videoHeight : (mediaEl as HTMLImageElement).naturalHeight;
                
                if (!naturalWidth || !naturalHeight) {
                    console.error("Media has invalid dimensions.");
                    return;
                }
                
                const { clientWidth, clientHeight } = container;
                const mediaAspect = naturalWidth / naturalHeight;
                const containerAspect = clientWidth / clientHeight;

                let width, height;
                if (mediaAspect > containerAspect) {
                    height = clientHeight;
                    width = height * mediaAspect;
                } else {
                    width = clientWidth;
                    height = width / mediaAspect;
                }
                setMediaSize({ width, height });
                setPosition({ x: 0, y: 0 });
                setZoom(1);
            };

            if (isVideo) {
                (mediaEl as HTMLVideoElement).onloadedmetadata = onMediaLoad;
            } else {
                (mediaEl as HTMLImageElement).onload = onMediaLoad;
            }
            if ((!isVideo && (mediaEl as HTMLImageElement).complete) || (isVideo && (mediaEl as HTMLVideoElement).readyState > 0)) {
                onMediaLoad();
            }
        }
    }, [media.src, isVideo]);
    
    const getBoundedPosition = useCallback((pos: {x:number, y:number}, currentZoom: number) => {
        if (!containerRef.current || !mediaSize.width) return pos;
        const { clientWidth, clientHeight } = containerRef.current;
        const scaledWidth = mediaSize.width * currentZoom;
        const scaledHeight = mediaSize.height * currentZoom;
        const x_bound = Math.max(0, (scaledWidth - clientWidth) / 2);
        const y_bound = Math.max(0, (scaledHeight - clientHeight) / 2);
        return {
            x: Math.max(-x_bound, Math.min(x_bound, pos.x)),
            y: Math.max(-y_bound, Math.min(y_bound, pos.y)),
        };
    }, [mediaSize]);

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newZoom = parseFloat(e.target.value);
        setZoom(newZoom);
        setPosition(prevPos => getBoundedPosition(prevPos, newZoom));
    };

    const handlePanStart = (clientX: number, clientY: number) => {
        setIsDragging(true);
        setDragStart({ x: clientX - position.x, y: clientY - position.y });
    };

    const handlePanMove = useCallback((clientX: number, clientY: number) => {
        if (isDragging) {
            const newPos = { x: clientX - dragStart.x, y: clientY - dragStart.y };
            setPosition(getBoundedPosition(newPos, zoom));
        }
    }, [isDragging, dragStart, zoom, getBoundedPosition]);

    const handlePanEnd = useCallback(() => { setIsDragging(false); }, []);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => handlePanMove(e.clientX, e.clientY);
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 1) handlePanMove(e.touches[0].clientX, e.touches[0].clientY);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', handlePanEnd);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('touchend', handlePanEnd);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', handlePanEnd);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', handlePanEnd);
        };
    }, [handlePanMove, handlePanEnd]);

    const handleSaveClick = () => {
        if (isVideo) {
            onSave({ src: media.src, zoom, position }); // Send position directly
        } else {
            const image = mediaRef.current as HTMLImageElement;
            const container = containerRef.current!;
            if (!image.complete || image.naturalWidth === 0) return;

            const outputResolution = 1024;
            const canvas = document.createElement('canvas');
            canvas.width = isCircleCrop ? outputResolution : outputResolution;
            canvas.height = isCircleCrop ? outputResolution : (outputResolution / targetAspectRatio);
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const scaleRatio = image.naturalWidth / mediaSize.width;
            const sWidth = (container.clientWidth / zoom) * scaleRatio;
            const sHeight = (container.clientHeight / zoom) * scaleRatio;
            const sX = (image.naturalWidth - sWidth) / 2 - (position.x * scaleRatio);
            const sY = (image.naturalHeight - sHeight) / 2 - (position.y * scaleRatio);

            if (isCircleCrop) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
                ctx.clip();
            }
            ctx.drawImage(image, sX, sY, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
            if (isCircleCrop) ctx.restore();

            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            onSave({ src: dataUrl, aspectRatio: canvas.width / canvas.height });
        }
    };
    
    const mediaStyle: React.CSSProperties = {
        position: 'absolute', top: '50%', left: '50%',
        width: `${mediaSize.width}px`, height: `${mediaSize.height}px`,
        maxWidth: 'none',
        objectFit: 'cover',
        transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
        cursor: isDragging ? 'grabbing' : 'grab',
        willChange: 'transform',
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 dark:border-neutral-800"><h2 className="text-lg font-bold text-center text-gray-900 dark:text-white">Edit Media</h2></div>
                <div className="p-4 flex-grow min-h-0 flex items-center justify-center">
                    <div
                        ref={containerRef}
                        className="w-full bg-black overflow-hidden relative"
                        style={{ aspectRatio: targetAspectRatio, borderRadius: isCircleCrop ? '50%' : '8px' }}
                        onMouseDown={(e) => handlePanStart(e.clientX, e.clientY)}
                        onTouchStart={(e) => e.touches.length === 1 && handlePanStart(e.touches[0].clientX, e.touches[0].clientY)}
                    >
                        {media.src && (isVideo ? 
                            <video ref={mediaRef as React.RefObject<HTMLVideoElement>} src={media.src} style={mediaStyle} loop muted playsInline autoPlay crossOrigin="anonymous"/> : 
                            <img ref={mediaRef as React.RefObject<HTMLImageElement>} src={media.src} style={mediaStyle} alt="Editing preview" crossOrigin="anonymous"/>
                        )}
                        {isCircleCrop && <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] rounded-full pointer-events-none"></div>}
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-neutral-400">
                        <i className="fa-solid fa-magnifying-glass-minus"></i>
                        <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={handleZoomChange} className="w-full h-2 bg-gray-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" aria-label="Zoom control"/>
                        <i className="fa-solid fa-magnifying-glass-plus"></i>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-neutral-800/50 flex justify-end gap-3 rounded-b-xl">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors">Cancel</button>
                    <button onClick={handleSaveClick} className="px-5 py-2 bg-gray-900 text-white dark:bg-white dark:text-black font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-neutral-200 transition-colors">Apply</button>
                </div>
            </div>
        </div>
    );
};

export default MediaEditorModal;
