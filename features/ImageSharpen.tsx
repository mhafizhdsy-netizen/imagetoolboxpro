import React, { useState } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { downloadImage } from '../utils/imageUtils';
import { upscaleImageWithAI } from '../services/backgroundRemovalService';
import { SharpenIcon, ArrowDownTrayIcon, ArrowUturnLeftIcon } from '../components/icons';
import { ImageComparator } from '../components/ImageComparator';

const ImageSharpen: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'side-by-side'>('single');

  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setUpscaledUrl(null);
      setViewMode('single');
    }
  };
  
  const applyAIUpscale = async () => {
    if (!imageFile) return;
    setIsLoading(true);
    setUpscaledUrl(null);
    try {
        const resultUrl = await upscaleImageWithAI(imageFile);
        setUpscaledUrl(resultUrl);
    } catch (error: any) {
        alert(error.message || "An unknown error occurred with AI Upscaler.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!upscaledUrl || !imageFile) return;
    const filename = `upscaled_${imageFile.name}`;
    downloadImage(upscaledUrl, filename);
  };
  
  const handleReset = () => {
    setImageFile(null);
    setImageUrl(null);
    setUpscaledUrl(null);
  }

  const AIInfoBox = () => (
    <div className="p-4 bg-black/70 text-gray-400 border border-zinc-800 rounded-lg text-sm">
        <p><span className="font-semibold text-[#1DB954]">Note:</span> This AI tool enhances resolution and details, effectively sharpening your image.</p>
        <p className="mt-2">Images over 1000x1000 may be downscaled to meet API limits.</p>
    </div>
  );

  const LoadingSpinner = () => (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
      </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 space-y-6">
            <h3 className="text-lg font-semibold text-white">AI Image Sharpen</h3>
            <AIInfoBox />
            <div className="flex flex-col gap-4 pt-4 border-t border-zinc-800">
                <Button icon={<SharpenIcon />} onClick={applyAIUpscale} isLoading={isLoading} disabled={!imageFile}>Sharpen with AI</Button>
                <Button icon={<ArrowDownTrayIcon />} onClick={handleDownload} variant="secondary" disabled={!upscaledUrl}>
                    Download
                </Button>
            </div>
        </div>
          <Button icon={<ArrowUturnLeftIcon />} onClick={handleReset} variant="outline" disabled={!imageFile}>
            Start Over
        </Button>
      </div>
      <div className="lg:col-span-8">
        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 sticky top-24">
            {!imageFile ? (
              <div className="bg-black/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh]">
                <ImageUploader onFileSelect={handleImageUpload} multiple={false} accept="image/*" />
              </div>
            ) : (
            <>
                <div className="flex justify-center mb-4">
                  <div className="inline-flex rounded-full shadow-sm bg-zinc-800/50 p-1">
                    <button onClick={() => setViewMode('single')} className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${viewMode === 'single' ? 'bg-[#1DB954] text-black' : 'text-gray-300 hover:bg-zinc-700'}`}>
                      Result
                    </button>
                    <button onClick={() => setViewMode('side-by-side')} disabled={!upscaledUrl} className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${viewMode === 'side-by-side' ? 'bg-[#1DB954] text-black' : 'text-gray-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed'}`}>
                      Compare
                    </button>
                  </div>
                </div>
                {viewMode === 'single' ? (
                    <div className="bg-black/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh] relative">
                      {isLoading && <LoadingSpinner />}
                      <img src={upscaledUrl ?? imageUrl ?? ''} alt="Preview" className="max-w-full object-contain rounded-md" loading="lazy" />
                    </div>
                ) : (
                  <div className="bg-black/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh] relative">
                    {isLoading && <LoadingSpinner />}
                    {!isLoading && upscaledUrl && imageUrl && (
                      <ImageComparator 
                        beforeSrc={imageUrl} 
                        afterSrc={upscaledUrl}
                        beforeLabel='Original'
                        afterLabel='Sharpened'
                      />
                    )}
                  </div>
                )}
                {upscaledUrl && !isLoading && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                        <p className="font-medium text-sm text-green-300">Sharpening applied successfully!</p>
                    </div>
                )}
            </>
            )}
        </div>
      </div>
    </div>
  );
};

export default ImageSharpen;
