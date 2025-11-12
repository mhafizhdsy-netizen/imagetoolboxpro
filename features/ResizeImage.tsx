import React, { useState, useCallback, useMemo } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { downloadZip, loadImageAsDataURLAndDimensions } from '../utils/imageUtils';
import { ArrowDownTrayIcon, ArrowUturnLeftIcon, ResizeIcon, XMarkIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon } from '../components/icons';
import type { FileWithPreview } from '../types';

interface ResizeSettings {
    id: string;
    percentage: number;
    width: number;
    height: number;
    keepAspectRatio: boolean;
}

interface ResizedResult {
    id: string;
    originalFilename: string;
    dataUrl: string;
}

export const ResizeImage: React.FC = () => {
    const [imageFiles, setImageFiles] = useState<FileWithPreview[]>([]);
    const [resizeSettings, setResizeSettings] = useState<ResizeSettings[]>([]);
    const [resizedResults, setResizedResults] = useState<ResizedResult[]>([]);
    const [globalPercentage, setGlobalPercentage] = useState(100);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const originalDimensionsMap = useMemo(() => {
        return imageFiles.reduce((acc, file) => {
            acc[file.id] = { width: file.width || 0, height: file.height || 0 };
            return acc;
        }, {} as Record<string, { width: number; height: number }>);
    }, [imageFiles]);


    const handleImageUpload = async (files: File[]) => {
        const newFiles: FileWithPreview[] = [];

        for (const file of files) {
            try {
                const { dataUrl, width, height } = await loadImageAsDataURLAndDimensions(file);
                const id = `${file.name}-${file.lastModified}-${Math.random()}`;
                newFiles.push(Object.assign(file, {
                    preview: dataUrl,
                    id,
                    width,
                    height,
                }));
            } catch (error) {
                console.error("Failed to load image preview:", error);
            }
        }

        const newSettings = newFiles.map(file => ({
            id: file.id,
            percentage: 100,
            width: file.width || 0,
            height: file.height || 0,
            keepAspectRatio: true,
        }));

        setImageFiles(prev => [...prev, ...newFiles]);
        setResizeSettings(prev => [...prev, ...newSettings]);
        setResizedResults([]);
    };

    const handleApplyToAll = () => {
        setResizeSettings(prevSettings =>
            prevSettings.map(setting => {
                const original = originalDimensionsMap[setting.id];
                if (!original) return setting;
                const newWidth = Math.round(original.width * (globalPercentage / 100));
                const newHeight = Math.round(original.height * (globalPercentage / 100));
                return { ...setting, percentage: globalPercentage, width: newWidth, height: newHeight };
            })
        );
    };

    const handlePerImageSettingChange = (id: string, newValues: Partial<ResizeSettings>) => {
        setResizeSettings(prevSettings =>
            prevSettings.map(setting => {
                if (setting.id !== id) return setting;

                const original = originalDimensionsMap[id];
                if (!original || original.width === 0 || original.height === 0) return setting;
                const aspectRatio = original.width / original.height;
                
                let updatedSetting = { ...setting, ...newValues };

                if (newValues.percentage !== undefined) {
                    updatedSetting.width = Math.round(original.width * (newValues.percentage / 100));
                    updatedSetting.height = Math.round(original.height * (newValues.percentage / 100));
                } else if (newValues.width !== undefined) {
                    updatedSetting.percentage = Math.round((newValues.width / original.width) * 100);
                    if (updatedSetting.keepAspectRatio) {
                        updatedSetting.height = Math.round(newValues.width / aspectRatio);
                    }
                } else if (newValues.height !== undefined) {
                    updatedSetting.percentage = Math.round((newValues.height / original.height) * 100);
                    if (updatedSetting.keepAspectRatio) {
                        updatedSetting.width = Math.round(newValues.height * aspectRatio);
                    }
                }

                return updatedSetting;
            })
        );
    };

    const performResize = useCallback(async () => {
        if (imageFiles.length === 0) return;

        setIsProcessing(true);
        setResizedResults([]);
        setProgress(0);
        
        const results: ResizedResult[] = [];
        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            const settings = resizeSettings.find(s => s.id === file.id);
            if (!settings) continue;

            const img = new Image();
            img.src = file.preview;
            await new Promise(resolve => { img.onload = resolve; });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            canvas.width = settings.width;
            canvas.height = settings.height;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL(file.type);
            
            results.push({
                id: file.id,
                originalFilename: file.name,
                dataUrl,
            });

            setProgress(((i + 1) / imageFiles.length) * 100);
        }
        
        setResizedResults(results);
        setIsProcessing(false);
    }, [imageFiles, resizeSettings]);

    const handleDownload = async () => {
        if (resizedResults.length === 0) return;
        const filesToZip = resizedResults.map(result => {
            return {
                dataUrl: result.dataUrl,
                filename: `resized_${result.originalFilename}`
            };
        });
        await downloadZip(filesToZip, 'resized_images.zip');
    };

    const handleRemoveImage = (idToRemove: string) => {
        setImageFiles(prev => prev.filter(file => file.id !== idToRemove));
        setResizeSettings(prev => prev.filter(setting => setting.id !== idToRemove));
        setResizedResults(prev => prev.filter(result => result.id !== idToRemove));
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(idToRemove);
            return newSet;
        });
    };

    const handleReset = () => {
        setImageFiles([]);
        setResizeSettings([]);
        setResizedResults([]);
        setIsProcessing(false);
        setProgress(0);
        setGlobalPercentage(100);
        setExpandedIds(new Set());
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleImageUpload(Array.from(e.target.files));
        }
    };
    
    const handleToggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleExpandAll = () => {
        setExpandedIds(new Set(imageFiles.map(f => f.id)));
    };

    const handleCollapseAll = () => {
        setExpandedIds(new Set());
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-gray-800 rounded-lg p-6 space-y-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white">Global Settings</h3>
                    <div>
                        <label htmlFor="global-scale-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                            <span>Resize by Percentage</span>
                            <span className="font-mono text-teal-300 text-lg">{globalPercentage}%</span>
                        </label>
                        <input
                            type="range"
                            id="global-scale-slider"
                            min="1"
                            max="200"
                            value={globalPercentage}
                            onChange={(e) => setGlobalPercentage(parseInt(e.target.value, 10))}
                            className="w-full range-slider"
                            disabled={imageFiles.length === 0}
                        />
                    </div>
                    <Button onClick={handleApplyToAll} variant="secondary" disabled={imageFiles.length === 0}>
                        Apply to All
                    </Button>
                </div>
                <div className="flex flex-col gap-4">
                    <Button onClick={performResize} isLoading={isProcessing} icon={<ResizeIcon />} disabled={imageFiles.length === 0}>
                        {isProcessing ? `Resizing... (${Math.round(progress)}%)` : `Resize All (${imageFiles.length})`}
                    </Button>
                    <Button onClick={handleDownload} variant="secondary" disabled={resizedResults.length === 0} icon={<ArrowDownTrayIcon />}>
                        Download All as ZIP
                    </Button>
                </div>
                <Button onClick={handleReset} variant="outline" icon={<ArrowUturnLeftIcon />} disabled={imageFiles.length === 0}>
                    Start Over
                </Button>
            </div>
            <div className="lg:col-span-8">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 sticky top-24">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="text-lg font-semibold text-white">Image Queue</h3>
                        {imageFiles.length > 0 && (
                            <div className="flex gap-2">
                                <Button onClick={handleExpandAll} variant="outline" className="px-3 py-1 text-xs">Expand All</Button>
                                <Button onClick={handleCollapseAll} variant="outline" className="px-3 py-1 text-xs">Collapse All</Button>
                            </div>
                        )}
                    </div>
                    
                    {imageFiles.length === 0 ? (
                        <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh]">
                            <ImageUploader onFileSelect={handleImageUpload} multiple={true} accept="image/*" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                             {isProcessing && (
                                <div className="w-full bg-gray-700 rounded-full h-2.5">
                                    <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.2s ease-in-out' }}></div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2 bg-gray-900/50 rounded-lg max-h-[70vh] overflow-y-auto">
                               {imageFiles.map((file) => {
                                   const setting = resizeSettings.find(s => s.id === file.id);
                                   const result = resizedResults.find(r => r.id === file.id);
                                   if (!setting) return null;
                                   const isExpanded = expandedIds.has(file.id);
                                   return (
                                       <div key={file.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-4">
                                           <div className="relative group aspect-video w-full overflow-hidden rounded-lg bg-gray-900">
                                               <img src={result?.dataUrl || file.preview} alt={file.name} className="object-contain w-full h-full"/>
                                               <button onClick={() => handleRemoveImage(file.id)} className="absolute top-2 right-2 p-1 bg-red-600/70 text-white rounded-full hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100 z-10">
                                                   <XMarkIcon className="w-4 h-4" />
                                               </button>
                                           </div>
                                           <div className="flex justify-between items-start cursor-pointer" onClick={() => handleToggleExpand(file.id)}>
                                                <div className="text-xs text-gray-400">
                                                    <p className="truncate font-semibold text-gray-200">{file.name}</p>
                                                    <p>Original: {originalDimensionsMap[file.id]?.width} x {originalDimensionsMap[file.id]?.height}px</p>
                                                    <p>New: {setting.width} x {setting.height}px</p>
                                                </div>
                                                <button className="p-1 text-gray-400 hover:text-white transition-colors" aria-label={isExpanded ? 'Collapse controls' : 'Expand controls'}>
                                                    {isExpanded ? <ChevronUpIcon className="w-5 h-5"/> : <ChevronDownIcon className="w-5 h-5"/>}
                                                </button>
                                           </div>
                                           <div className={`transition-all duration-300 ease-in-out overflow-hidden space-y-4 ${isExpanded ? 'max-h-[500px] opacity-100 pt-4 border-t border-gray-700' : 'max-h-0 opacity-0'}`}>
                                               <div>
                                                    <label htmlFor={`scale-${file.id}`} className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                                                        <span>Scale</span>
                                                        <span className="font-mono text-teal-300">{setting.percentage}%</span>
                                                    </label>
                                                    <input
                                                        type="range"
                                                        id={`scale-${file.id}`}
                                                        min="1"
                                                        max="200"
                                                        value={setting.percentage}
                                                        onChange={(e) => handlePerImageSettingChange(file.id, { percentage: parseInt(e.target.value, 10) })}
                                                        className="w-full range-slider"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label htmlFor={`width-${file.id}`} className="block text-sm font-medium text-gray-300 mb-2">Width</label>
                                                        <input type="number" id={`width-${file.id}`} value={setting.width} onChange={(e) => handlePerImageSettingChange(file.id, { width: parseInt(e.target.value, 10) || 0 })} className="custom-input"/>
                                                    </div>
                                                    <div>
                                                        <label htmlFor={`height-${file.id}`} className="block text-sm font-medium text-gray-300 mb-2">Height</label>
                                                        <input type="number" id={`height-${file.id}`} value={setting.height} onChange={(e) => handlePerImageSettingChange(file.id, { height: parseInt(e.target.value, 10) || 0 })} className="custom-input"/>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <input id={`aspect-ratio-${file.id}`} type="checkbox" checked={setting.keepAspectRatio} onChange={(e) => handlePerImageSettingChange(file.id, { keepAspectRatio: e.target.checked })} className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-teal-500 focus:ring-teal-500"/>
                                                    <label htmlFor={`aspect-ratio-${file.id}`} className="ml-3 block text-sm font-medium text-gray-300">Keep aspect ratio</label>
                                                </div>
                                           </div>
                                       </div>
                                   );
                               })}
                                <label htmlFor="add-more-files-input" className="group flex flex-col items-center justify-center text-center p-4 min-h-[200px] rounded-lg border-2 border-dashed border-gray-600 bg-gray-800/50 text-gray-400 transition-colors hover:border-teal-500 hover:text-teal-400 cursor-pointer">
                                    <PlusIcon className="w-8 h-8" />
                                    <span className="mt-2 text-sm font-semibold">Add More</span>
                                    <input id="add-more-files-input" type="file" className="sr-only" accept="image/*" multiple onChange={handleFileChange} />
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
