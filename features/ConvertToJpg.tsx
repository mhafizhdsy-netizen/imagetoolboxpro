import React, { useState, useCallback } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { downloadImage } from '../utils/imageUtils';
import { ArrowDownTrayIcon, ArrowUturnLeftIcon, ConvertToJpgIcon } from '../components/icons';

const ConvertToJpg: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.92);
  const [isConverting, setIsConverting] = useState(false);
  const [originalSize, setOriginalSize] = useState(0);
  const [convertedSize, setConvertedSize] = useState(0);

  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setOriginalSize(file.size);
      setConvertedUrl(null);
      setConvertedSize(0);
    }
  };
  
  const performConversion = useCallback(() => {
    if (!imageUrl) return;
    
    setIsConverting(true);
    setConvertedUrl(null);
    
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
          setIsConverting(false);
          return;
      }
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const mimeType = 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, quality);
      setConvertedUrl(dataUrl);
      
      // Calculate new size
      const base64Data = dataUrl.split(',')[1];
      const binaryData = atob(base64Data);
      setConvertedSize(binaryData.length);
      setIsConverting(false);
    };
    img.onerror = () => {
        setIsConverting(false);
        alert('Failed to load image for conversion.');
    }
  }, [imageUrl, quality]);

  const handleDownload = () => {
    if (!convertedUrl || !imageFile) return;
    const originalName = imageFile.name.substring(0, imageFile.name.lastIndexOf('.'));
    const filename = `${originalName}.jpg`;
    downloadImage(convertedUrl, filename);
  };
  
  const handleReset = () => {
      setImageFile(null);
      setImageUrl(null);
      setConvertedUrl(null);
      setOriginalSize(0);
      setConvertedSize(0);
  }
  
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-gray-800 rounded-lg p-6 space-y-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white">JPG Quality</h3>
            <div>
                <label htmlFor="quality-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                    <span>Quality</span>
                    <span className="font-mono text-teal-300 text-lg">{Math.round(quality * 100)}</span>
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
                    disabled={!imageFile}
                />
            </div>
            {convertedSize > 0 && (
                <div className="text-sm text-gray-400 space-y-1 pt-4 border-t border-gray-700">
                    <p>Original Size: <span className="font-semibold text-gray-200">{formatBytes(originalSize)}</span></p>
                    <p>Converted Size: <span className="font-semibold text-gray-200">{formatBytes(convertedSize)}</span></p>
                      <p>Reduction: <span className="font-semibold text-green-400">{(((originalSize - convertedSize) / originalSize) * 100).toFixed(1)}%</span></p>
                </div>
            )}
        </div>
        
        <div className="flex flex-col gap-4">
          <Button onClick={performConversion} isLoading={isConverting} icon={<ConvertToJpgIcon />} disabled={!imageFile}>
            Convert to JPG
          </Button>
          <Button onClick={handleDownload} variant="secondary" disabled={!convertedUrl} icon={<ArrowDownTrayIcon />}>
            Download JPG
          </Button>
        </div>
          <Button onClick={handleReset} variant="outline" icon={<ArrowUturnLeftIcon />} disabled={!imageFile}>
            Start Over
        </Button>
      </div>
      <div className="lg:col-span-8">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 sticky top-24">
            <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh] overflow-hidden">
              {!imageFile ? (
                <ImageUploader onFileSelect={handleImageUpload} multiple={false} accept="image/*" title="Upload an image to convert to JPG" description="PNG, WEBP, BMP and other formats are supported" />
              ) : (
                <img src={convertedUrl ?? imageUrl ?? ''} alt="Preview" className="max-w-full object-contain rounded-md"/>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ConvertToJpg;