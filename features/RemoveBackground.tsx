import React, { useState, useEffect } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { downloadImage } from '../utils/imageUtils';
import { removeBackgroundWithAI } from '../services/backgroundRemovalService';
import { RemoveBgIcon, ArrowDownTrayIcon, ArrowUturnLeftIcon, AIIcon } from '../components/icons';
import { ImageComparator } from '../components/ImageComparator';

const RemoveBackground: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (resultUrl && resultUrl.startsWith('blob:')) {
                URL.revokeObjectURL(resultUrl);
            }
        };
    }, [resultUrl]);

    const handleImageUpload = (files: File[]) => {
        if (files.length > 0) {
            const file = files[0];
            setImageFile(file);
            setImageUrl(URL.createObjectURL(file));
            setResultUrl(null);
            setError(null);
        }
    };

    const handleRemoveBackground = async () => {
        if (!imageFile) return;
        setIsLoading(true);
        setResultUrl(null);
        setError(null);
        try {
            const result = await removeBackgroundWithAI(imageFile);
            setResultUrl(result);
        } catch (error: any) {
            setError(error.message || "An unknown error occurred while removing the background.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        if (!resultUrl || !imageFile) return;
        const originalName = imageFile.name.substring(0, imageFile.name.lastIndexOf('.'));
        const filename = `bg-removed_${originalName}.png`;
        downloadImage(resultUrl, filename);
    };

    const handleReset = () => {
        setImageFile(null);
        setImageUrl(null);
        setResultUrl(null);
        setError(null);
    };
    
    const AIInfoBox = () => (
        <div className="p-4 bg-gray-900/70 text-gray-400 border border-gray-700 rounded-lg text-sm">
            <p><span className="font-semibold text-teal-400">Powered by AI:</span> This tool uses an API for high-quality results. Set your own key in settings for higher usage limits.</p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-6">
                    <h3 className="text-lg font-semibold text-white">Background Removal</h3>
                      <AIInfoBox />
                    <p className="text-sm text-gray-400">The AI will automatically detect the subject and remove the background, providing a transparent PNG.</p>
                      <div className="flex flex-col gap-4 pt-4 border-t border-gray-700">
                        <Button icon={<RemoveBgIcon />} onClick={handleRemoveBackground} isLoading={isLoading} disabled={!imageFile}>
                            {isLoading ? 'Processing...' : 'Remove Background'}
                        </Button>
                        <Button icon={<ArrowDownTrayIcon />} onClick={handleDownload} variant="secondary" disabled={!resultUrl}>
                            Download Result
                        </Button>
                    </div>
                </div>
                
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
                        <p className="font-semibold">An error occurred</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                )}
                
                <Button icon={<ArrowUturnLeftIcon />} onClick={handleReset} variant="outline" disabled={!imageFile}>
                    Start Over
                </Button>
            </div>
            <div className="lg:col-span-8">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 sticky top-24 space-y-4">
                    {!imageFile ? (
                        <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh]">
                            <ImageUploader onFileSelect={handleImageUpload} multiple={false} accept="image/*" />
                        </div>
                    ) : (
                        <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh] relative">
                            {isLoading && (
                                <>
                                    <img src={imageUrl ?? ''} alt="Processing" className="max-w-full object-contain rounded-md opacity-40"/>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 bg-gray-900/50">
                                        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="mt-4 text-sm">Processing...</span>
                                    </div>
                                </>
                            )}
                            {!isLoading && resultUrl && imageUrl && (
                                <div className="w-full checkerboard-bg rounded-lg">
                                    <ImageComparator 
                                        beforeSrc={imageUrl} 
                                        afterSrc={resultUrl}
                                        beforeLabel='Original'
                                        afterLabel='Result'
                                    />
                                </div>
                            )}
                            {!isLoading && !resultUrl && imageUrl && (
                                <img src={imageUrl} alt="Original" className="max-w-full object-contain rounded-md"/>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RemoveBackground;