import React, { useState, useCallback } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { downloadImage } from '../utils/imageUtils';
import { ArrowUturnLeftIcon, ArrowUturnRightIcon, RotateIcon, ArrowDownTrayIcon } from '../components/icons';

const RotateImage: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0); // in degrees
  const [rotatedImageUrl, setRotatedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      setImageFile(files[0]);
      setImageUrl(URL.createObjectURL(files[0]));
      setRotation(0);
      setRotatedImageUrl(null);
    }
  };
  
  const applyRotation = useCallback(() => {
    if (!imageUrl) return;
    setIsProcessing(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        setIsProcessing(false);
        return;
    }

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      // Calculate new canvas dimensions based on rotation to prevent cropping
      const radians = (rotation * Math.PI) / 180;
      const absCos = Math.abs(Math.cos(radians));
      const absSin = Math.abs(Math.sin(radians));
      
      const newWidth = Math.round(img.naturalWidth * absCos + img.naturalHeight * absSin);
      const newHeight = Math.round(img.naturalWidth * absSin + img.naturalHeight * absCos);

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Translate to center of canvas
      ctx.translate(newWidth / 2, newHeight / 2);
      ctx.rotate(radians);
      // Draw image so its center aligns with canvas center
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      
      const dataUrl = canvas.toDataURL(imageFile?.type || 'image/png');
      setRotatedImageUrl(dataUrl);
      setIsProcessing(false);
    };
    img.onerror = () => {
        setIsProcessing(false);
        alert('Failed to load image for rotation.');
    };
  }, [imageUrl, rotation, imageFile]);

  const handleRotate = (degrees: number) => {
    setRotation(prev => (prev + degrees) % 360);
  };

  const handleDownload = () => {
    if (!rotatedImageUrl || !imageFile) return;
    const filename = `rotated_${rotation}_${imageFile.name}`;
    downloadImage(rotatedImageUrl, filename);
  };

  const handleReset = () => {
    setImageFile(null);
    setImageUrl(null);
    setRotation(0);
    setRotatedImageUrl(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-zinc-900 rounded-lg p-6 space-y-6 border border-zinc-800">
            <h3 className="text-lg font-semibold text-white">Rotate Options</h3>
            <div>
              <label htmlFor="rotation-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                  <span>Rotation Angle</span>
                  <span className="font-mono text-[#1DB954] text-lg">{rotation}°</span>
              </label>
              <input 
                  type="range" 
                  id="rotation-slider"
                  min="0" 
                  max="359" 
                  value={rotation} 
                  onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                  className="w-full range-slider"
                  aria-label="Rotation Angle"
                  disabled={!imageFile}
              />
            </div>
            <div className="flex justify-between gap-2 pt-4 border-t border-zinc-800">
                <Button onClick={() => handleRotate(-90)} variant="secondary" icon={<ArrowUturnLeftIcon />} disabled={!imageFile}>
                    Rotate Left
                </Button>
                <Button onClick={() => handleRotate(90)} variant="secondary" icon={<ArrowUturnRightIcon />} disabled={!imageFile}>
                    Rotate Right
                </Button>
            </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <Button onClick={applyRotation} isLoading={isProcessing} icon={<RotateIcon />} disabled={!imageFile}>
            Apply Rotation
          </Button>
          <Button onClick={handleDownload} variant="secondary" disabled={!rotatedImageUrl} icon={<ArrowDownTrayIcon />}>
            Download Rotated Image
          </Button>
        </div>
          <Button onClick={handleReset} variant="outline" icon={<ArrowUturnLeftIcon />} disabled={!imageFile}>
            Start Over
        </Button>
      </div>
      <div className="lg:col-span-8">
        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 sticky top-24">
            <div className="bg-black/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh] overflow-hidden">
              {!imageFile ? (
                <ImageUploader onFileSelect={handleImageUpload} multiple={false} accept="image/*" />
              ) : (
                <img src={rotatedImageUrl ?? imageUrl ?? ''} alt="Preview" className="max-w-full object-contain rounded-md"/>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default RotateImage;