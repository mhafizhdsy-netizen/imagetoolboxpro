import React, { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { downloadImage } from '../utils/imageUtils';
import { ArrowDownTrayIcon, ArrowUturnLeftIcon, ResizeIcon } from '../components/icons';

const ResizeImage: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [newDimensions, setNewDimensions] = useState({ width: '', height: '' });
  const [resizedUrl, setResizedUrl] = useState<string | null>(null);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scale, setScale] = useState(100);

  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setOriginalDimensions({ width: img.width, height: img.height });
      setNewDimensions({ width: String(img.width), height: String(img.height) });
      setScale(100);
    };
  }, [imageUrl]);

  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      setImageFile(files[0]);
      setImageUrl(URL.createObjectURL(files[0]));
      setResizedUrl(null);
    }
  };

  // Effect 1: When scale changes (from slider), update the width/height inputs
  useEffect(() => {
    if (originalDimensions.width > 0) {
      const newWidth = Math.round(originalDimensions.width * (scale / 100));
      const newHeight = Math.round(originalDimensions.height * (scale / 100));
      if (String(newWidth) !== newDimensions.width || String(newHeight) !== newDimensions.height) {
        setNewDimensions({ width: String(newWidth), height: String(newHeight) });
      }
    }
  }, [scale, originalDimensions]);

  // Effect 2: When width/height inputs change, update the slider
  useEffect(() => {
    const widthNum = parseInt(newDimensions.width, 10);
    if (!isNaN(widthNum) && originalDimensions.width > 0) {
      const newScale = Math.round((widthNum / originalDimensions.width) * 100);
      if (scale !== newScale) {
        setScale(newScale);
      }
    }
  }, [newDimensions, originalDimensions]);

  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) && value !== '') return;

    if (keepAspectRatio && originalDimensions.width > 0 && originalDimensions.height > 0) {
      if (name === 'width') {
        const newHeight = Math.round((numValue / originalDimensions.width) * originalDimensions.height);
        setNewDimensions({ width: value, height: String(newHeight || '') });
      } else {
        const newWidth = Math.round((numValue / originalDimensions.height) * originalDimensions.width);
        setNewDimensions({ width: String(newWidth || ''), height: value });
      }
    } else {
      setNewDimensions(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(parseInt(e.target.value, 10));
  };

  const performResize = useCallback(() => {
    if (!imageUrl || !newDimensions.width || !newDimensions.height) return;
    setIsProcessing(true);
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
          setIsProcessing(false);
          return;
      }
      canvas.width = parseInt(newDimensions.width, 10);
      canvas.height = parseInt(newDimensions.height, 10);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL(imageFile?.type);
      setResizedUrl(dataUrl);
      setIsProcessing(false);
    };
     img.onerror = () => {
        setIsProcessing(false);
        alert('Failed to load image for resizing.');
    };
  }, [imageUrl, newDimensions, imageFile]);

  const handleDownload = () => {
    if (!resizedUrl || !imageFile) return;
    const filename = `resized_${newDimensions.width}x${newDimensions.height}_${imageFile.name}`;
    downloadImage(resizedUrl, filename);
  };

  const handleReset = () => {
    setImageFile(null);
    setImageUrl(null);
    setResizedUrl(null);
    setOriginalDimensions({ width: 0, height: 0 });
    setNewDimensions({ width: '', height: '' });
    setScale(100);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-gray-800 rounded-lg p-6 space-y-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white">Resize Options</h3>
            <div>
              <label htmlFor="scale-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                  <span>Scale</span>
                  <span className="font-mono text-teal-300 text-lg">{scale}%</span>
              </label>
              <input 
                  type="range" 
                  id="scale-slider"
                  min="10" 
                  max="200" 
                  value={scale} 
                  onChange={handleScaleChange}
                  className="w-full range-slider"
                  aria-label="Image Scale"
                  disabled={!imageFile}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="width" className="block text-sm font-medium text-gray-300 mb-2">Width</label>
                    <input type="number" id="width" name="width" value={newDimensions.width} onChange={handleDimensionChange} className="custom-input" disabled={!imageFile}/>
                </div>
                <div>
                    <label htmlFor="height" className="block text-sm font-medium text-gray-300 mb-2">Height</label>
                    <input type="number" id="height" name="height" value={newDimensions.height} onChange={handleDimensionChange} className="custom-input" disabled={!imageFile}/>
                </div>
            </div>
            <div className="flex items-center">
                <input id="aspect-ratio" type="checkbox" checked={keepAspectRatio} onChange={(e) => setKeepAspectRatio(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-teal-500 focus:ring-teal-500" disabled={!imageFile}/>
                <label htmlFor="aspect-ratio" className="ml-3 block text-sm font-medium text-gray-300">Keep aspect ratio</label>
            </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <Button onClick={performResize} isLoading={isProcessing} icon={<ResizeIcon />} disabled={!imageFile}>
            Resize Image
          </Button>
          <Button onClick={handleDownload} variant="secondary" disabled={!resizedUrl} icon={<ArrowDownTrayIcon />}>
            Download Resized Image
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
                <ImageUploader onFileSelect={handleImageUpload} multiple={false} accept="image/*" />
              ) : (
                <img src={resizedUrl ?? imageUrl ?? ''} alt="Preview" className="max-w-full object-contain rounded-md"/>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ResizeImage;