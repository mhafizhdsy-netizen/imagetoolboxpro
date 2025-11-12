import React, { useState, useCallback } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { downloadImage, dataURLToBlob } from '../utils/imageUtils';
import { ArrowDownTrayIcon, ArrowUturnLeftIcon, CompressIcon } from '../components/icons';

type TargetFormat = 'jpeg' | 'webp' | 'png';

const CompressImage: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.8);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('jpeg');
  const [isCompressing, setIsCompressing] = useState(false);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);

  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setOriginalSize(file.size);
      if (file.type === 'image/png') {
        setTargetFormat('png');
      } else {
        setTargetFormat('jpeg');
      }
      setCompressedUrl(null);
      setCompressedSize(0);
    }
  };
  
  const performCompression = useCallback(() => {
    if (!imageUrl) return;
    
    setIsCompressing(true);
    setCompressedUrl(null);
    
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
          setIsCompressing(false);
          return;
      }
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const mimeType = `image/${targetFormat}`;
      const dataUrl = canvas.toDataURL(mimeType, quality);
      setCompressedUrl(dataUrl);
      
      const blob = dataURLToBlob(dataUrl);
      setCompressedSize(blob.size);
      setIsCompressing(false);
    };
    img.onerror = () => {
        setIsCompressing(false);
        alert('Failed to load image for compression.');
    }
  }, [imageUrl, quality, targetFormat]);

  const handleDownload = () => {
    if (!compressedUrl || !imageFile) return;
    const originalName = imageFile.name.substring(0, imageFile.name.lastIndexOf('.'));
    const filename = `compressed_${originalName}.${targetFormat}`;
    downloadImage(compressedUrl, filename);
  };
  
  const handleReset = () => {
      setImageFile(null);
      setImageUrl(null);
      setCompressedUrl(null);
      setOriginalSize(0);
      setCompressedSize(0);
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
    <div className="space-y-8">
      <div className="bg-gray-800 rounded-lg p-6 space-y-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Compression Settings</h3>
            <div>
              <label htmlFor="format-select" className="block text-sm font-medium text-gray-300 mb-2">Output Format</label>
              <select id="format-select" value={targetFormat} onChange={e => setTargetFormat(e.target.value as TargetFormat)} className="custom-input" disabled={!imageFile}>
                  <option value="jpeg">JPG</option>
                  <option value="webp">WEBP</option>
                  <option value="png">PNG</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">{targetFormat === 'png' ? 'PNG is lossless but larger. For max compression, use JPG or WEBP.' : 'JPG and WEBP offer better compression.'}</p>
          </div>
          <div>
              <label htmlFor="quality-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                  <span>Quality / Effort</span>
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
                  aria-label="Compression Quality"
                  disabled={!imageFile}
              />
          </div>
          {compressedSize > 0 && (
              <div className="text-sm text-gray-400 space-y-1 pt-4 border-t border-gray-700">
                  <p>Original Size: <span className="font-semibold text-gray-200">{formatBytes(originalSize)}</span></p>
                  <p>Compressed Size: <span className="font-semibold text-gray-200">{formatBytes(compressedSize)}</span></p>
                  <p>Reduction: <span className={`font-semibold ${originalSize > compressedSize ? 'text-green-400' : 'text-red-400'}`}>{(((originalSize - compressedSize) / originalSize) * 100).toFixed(1)}%</span></p>
              </div>
          )}
      </div>
      
      <div className="flex flex-col gap-4">
        <Button onClick={performCompression} isLoading={isCompressing} icon={<CompressIcon />} disabled={!imageFile}>
          Compress Image
        </Button>
        <Button onClick={handleDownload} variant="secondary" disabled={!compressedUrl} icon={<ArrowDownTrayIcon />}>
          Download Compressed Image
        </Button>
      </div>
        <Button onClick={handleReset} variant="outline" icon={<ArrowUturnLeftIcon />} disabled={!imageFile}>
          Start Over
      </Button>
      
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
          <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh] overflow-hidden">
            {!imageFile ? (
              <ImageUploader onFileSelect={handleImageUpload} multiple={false} accept="image/*" title="Upload an image to compress"/>
            ) : (
              <img src={compressedUrl ?? imageUrl ?? ''} alt="Preview" className="max-w-full object-contain rounded-md"/>
            )}
          </div>
      </div>
    </div>
  );
};

export default CompressImage;