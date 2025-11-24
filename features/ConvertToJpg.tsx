import React, { useState, useCallback } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { downloadZip, loadImageAsDataURLAndDimensions, dataURLToBlob } from '../utils/imageUtils';
import { ArrowDownTrayIcon, ArrowUturnLeftIcon, ConvertToJpgIcon, XMarkIcon, PlusIcon } from '../components/icons';
import type { FileWithPreview } from '../types';

interface ConvertedResult {
  id: string;
  originalFilename: string;
  dataUrl: string;
  originalSize: number;
  convertedSize: number;
}

const ConvertToJpg: React.FC = () => {
  const [imageFiles, setImageFiles] = useState<FileWithPreview[]>([]);
  const [convertedResults, setConvertedResults] = useState<ConvertedResult[]>([]);
  const [quality, setQuality] = useState(0.92);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImageUpload = async (files: File[]) => {
    const newFiles: FileWithPreview[] = [];
    for (const file of files) {
      try {
        const { dataUrl } = await loadImageAsDataURLAndDimensions(file);
        newFiles.push(Object.assign(file, {
          preview: dataUrl,
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
        }));
      } catch (error) {
        console.error("Failed to load image preview:", error);
      }
    }
    setImageFiles(prev => [...prev, ...newFiles]);
    setConvertedResults([]);
  };
  
  const performConversion = useCallback(async () => {
    if (imageFiles.length === 0) return;
    
    setIsProcessing(true);
    setConvertedResults([]);
    setProgress(0);
    
    const results: ConvertedResult[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const img = new Image();
      img.src = file.preview;
      await new Promise(resolve => { img.onload = resolve; });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      const mimeType = 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, quality);
      const blob = dataURLToBlob(dataUrl);

      results.push({
        id: file.id,
        originalFilename: file.name,
        dataUrl,
        originalSize: file.size,
        convertedSize: blob.size,
      });

      setProgress(((i + 1) / imageFiles.length) * 100);
    }
    
    setConvertedResults(results);
    setIsProcessing(false);
  }, [imageFiles, quality]);

  const handleDownload = async () => {
    if (convertedResults.length === 0) return;
    const filesToZip = convertedResults.map(result => {
      const originalName = result.originalFilename.substring(0, result.originalFilename.lastIndexOf('.'));
      return {
          dataUrl: result.dataUrl,
          filename: `${originalName}.jpg`
      };
    });
    await downloadZip(filesToZip, 'converted_to_jpg.zip');
  };
  
  const handleRemoveImage = (idToRemove: string) => {
    setImageFiles(prev => prev.filter(file => file.id !== idToRemove));
    setConvertedResults([]);
  };
  
  const handleReset = () => {
      setImageFiles([]);
      setConvertedResults([]);
      setIsProcessing(false);
      setProgress(0);
  }
  
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  const totalOriginalSize = convertedResults.reduce((acc, r) => acc + r.originalSize, 0);
  const totalConvertedSize = convertedResults.reduce((acc, r) => acc + r.convertedSize, 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        handleImageUpload(Array.from(e.target.files));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-zinc-900 rounded-lg p-6 space-y-6 border border-zinc-800">
            <h3 className="text-lg font-semibold text-white">JPG Quality</h3>
            <div>
                <label htmlFor="quality-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                    <span>Quality</span>
                    <span className="font-mono text-[#1DB954] text-lg">{Math.round(quality * 100)}</span>
                </label>
                <input 
                    type="range" 
                    id="quality-slider"
                    min="0.1" 
                    max="1" 
                    step="0.01"
                    value={quality} 
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full range-slider"
                    aria-label="JPG Quality"
                    disabled={imageFiles.length === 0}
                />
            </div>
            {convertedResults.length > 0 && (
                <div className="text-sm text-gray-400 space-y-1 pt-4 border-t border-zinc-800">
                    <p>Total Original Size: <span className="font-semibold text-gray-200">{formatBytes(totalOriginalSize)}</span></p>
                    <p>Total Converted Size: <span className="font-semibold text-gray-200">{formatBytes(totalConvertedSize)}</span></p>
                    <p>Reduction: <span className="font-semibold text-green-400">{(((totalOriginalSize - totalConvertedSize) / totalOriginalSize) * 100).toFixed(1)}%</span></p>
                </div>
            )}
        </div>
        
        <div className="flex flex-col gap-4">
          <Button onClick={performConversion} isLoading={isProcessing} icon={<ConvertToJpgIcon />} disabled={imageFiles.length === 0}>
            {isProcessing ? `Converting... (${Math.round(progress)}%)` : `Convert All to JPG (${imageFiles.length})`}
          </Button>
          <Button onClick={handleDownload} variant="secondary" disabled={convertedResults.length === 0} icon={<ArrowDownTrayIcon />}>
            Download All as ZIP
          </Button>
        </div>
          <Button onClick={handleReset} variant="outline" icon={<ArrowUturnLeftIcon />} disabled={imageFiles.length === 0}>
            Start Over
        </Button>
      </div>
      <div className="lg:col-span-8">
        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 sticky top-24">
            <h3 className="text-lg font-semibold text-white mb-4 px-2">Image Queue</h3>
            {imageFiles.length === 0 ? (
                <div className="bg-black/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh]">
                    <ImageUploader onFileSelect={handleImageUpload} multiple={true} accept="image/*" title="Upload images to convert to JPG" description="PNG, WEBP, BMP and other formats are supported" />
                </div>
             ) : (
                <div className="space-y-4">
                     {isProcessing && (
                        <div className="w-full bg-zinc-700 rounded-full h-2.5">
                            <div className="bg-[#1DB954] h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.2s ease-in-out' }}></div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2 min-h-[40vh] bg-black/50 rounded-lg max-h-[70vh] overflow-y-auto">
                       {imageFiles.map((file) => (
                           <div key={file.id} className="relative group aspect-square w-full overflow-hidden rounded-lg border-2 border-zinc-800">
                               <img src={convertedResults.find(r => r.id === file.id)?.dataUrl || file.preview} alt={file.name} className="object-cover w-full h-full" loading="lazy"/>
                               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                   <span className="text-white text-xs text-center p-1 truncate">{file.name}</span>
                               </div>
                               <button onClick={() => handleRemoveImage(file.id)} className="absolute top-1 right-1 p-1 bg-red-600/70 text-white rounded-full hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100">
                                   <XMarkIcon className="w-4 h-4" />
                               </button>
                           </div>
                       ))}
                        <label htmlFor="add-more-files-input" className="group flex flex-col items-center justify-center text-center p-2 aspect-square rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 text-gray-400 transition-colors hover:border-[#1DB954] hover:text-[#1DB954] cursor-pointer">
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

export default ConvertToJpg;
