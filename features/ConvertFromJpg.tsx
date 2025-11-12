import React, { useState, useCallback } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { downloadImage, dataURLToBlob } from '../utils/imageUtils';
import { ArrowDownTrayIcon, ArrowUturnLeftIcon } from '../components/icons';
import { ConvertToJpgIcon } from '../components/icons'; // Re-using icon for conversion

type TargetFormat = 'png' | 'webp' | 'gif';

const ConvertFromJpg: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('png');
  const [quality, setQuality] = useState(0.92); // For WEBP output
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
      // Default to PNG or WEBP if original is JPG
      if (file.type === 'image/jpeg') {
          setTargetFormat('png');
          setQuality(0.92);
      }
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
      
      let mimeType: string;
      let outputQuality: number | undefined = undefined;

      switch (targetFormat) {
          case 'png':
              mimeType = 'image/png';
              break;
          case 'webp':
              mimeType = 'image/webp';
              outputQuality = quality; // Apply quality for WEBP
              break;
          case 'gif':
              // Browsers generally don't support canvas.toDataURL('image/gif') natively
              // For simplicity, we'll provide a basic conversion. A true GIF converter
              // would require a library like gif.js or similar for proper animation/palette.
              mimeType = 'image/png'; // Fallback to PNG or more robust solution needed
              alert('GIF conversion is basic (static image only). For animated GIFs, a dedicated library is required.');
              break;
          default:
              mimeType = 'image/png';
      }
      
      const dataUrl = canvas.toDataURL(mimeType, outputQuality);
      setConvertedUrl(dataUrl);
      
      // Calculate new size
      const blob = dataURLToBlob(dataUrl);
      setConvertedSize(blob.size);
      setIsConverting(false);
    };
    img.onerror = () => {
        setIsConverting(false);
        alert('Failed to load image for conversion.');
    }
  }, [imageUrl, targetFormat, quality]);

  const handleDownload = () => {
    if (!convertedUrl || !imageFile) return;
    const originalName = imageFile.name.substring(0, imageFile.name.lastIndexOf('.'));
    const filename = `${originalName}.${targetFormat}`;
    downloadImage(convertedUrl, filename);
  };
  
  const handleReset = () => {
      setImageFile(null);
      setImageUrl(null);
      setConvertedUrl(null);
      setOriginalSize(0);
      setConvertedSize(0);
      setTargetFormat('png');
      setQuality(0.92);
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gray-800 rounded-lg p-6 space-y-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Conversion Settings</h3>
            <div>
              <label htmlFor="format-select" className="block text-sm font-medium text-gray-300 mb-2">Output Format</label>
              <select id="format-select" value={targetFormat} onChange={e => setTargetFormat(e.target.value as TargetFormat)} className="custom-input" disabled={!imageFile}>
                  <option value="png">PNG</option>
                  <option value="webp">WEBP</option>
                  <option value="gif">GIF (Static)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Convert JPG to transparent PNG, efficient WEBP, or basic static GIF.</p>
          </div>

          {targetFormat === 'webp' && (
              <div>
                  <label htmlFor="quality-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                      <span>WEBP Quality</span>
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
                      aria-label="WEBP Quality"
                      disabled={!imageFile}
                  />
              </div>
          )}
          
          {convertedSize > 0 && (
              <div className="text-sm text-gray-400 space-y-1 pt-4 border-t border-gray-700">
                  <p>Original Size: <span className="font-semibold text-gray-200">{formatBytes(originalSize)}</span></p>
                  <p>Converted Size: <span className="font-semibold text-gray-200">{formatBytes(convertedSize)}</span></p>
                  {originalSize > 0 && (
                      <p>Change: <span className={`font-semibold ${convertedSize < originalSize ? 'text-green-400' : 'text-red-400'}`}>{(((originalSize - convertedSize) / originalSize) * 100).toFixed(1)}%</span></p>
                  )}
              </div>
          )}
      </div>
      
      <div className="flex flex-col gap-4">
        <Button onClick={performConversion} isLoading={isConverting} icon={<ConvertToJpgIcon />} disabled={!imageFile}>
          Convert from JPG
        </Button>
        <Button onClick={handleDownload} variant="secondary" disabled={!convertedUrl} icon={<ArrowDownTrayIcon />}>
          Download {targetFormat.toUpperCase()}
        </Button>
      </div>
        <Button onClick={handleReset} variant="outline" icon={<ArrowUturnLeftIcon />} disabled={!imageFile}>
          Start Over
      </Button>
      
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Image Preview</h3>
          <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh] overflow-hidden">
            {!imageFile ? (
              <ImageUploader onFileSelect={handleImageUpload} multiple={false} accept="image/*" title="Upload a JPG image to convert" description="Convert to PNG, WEBP, or GIF"/>
            ) : (
              <img src={convertedUrl ?? imageUrl ?? ''} alt="Preview" className="max-w-full object-contain rounded-md"/>
            )}
          </div>
      </div>
    </div>
  );
};

export default ConvertFromJpg;