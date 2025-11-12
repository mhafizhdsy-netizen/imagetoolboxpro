import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { downloadImage } from '../utils/imageUtils';
import { ArrowDownTrayIcon, ArrowUturnLeftIcon, XMarkIcon } from '../components/icons';
import ReactCrop, { Crop, PixelCrop, makeAspectCrop, centerCrop } from 'react-image-crop';

// Simple debounce hook for better performance on crop updates
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const CropImage: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  const [croppedPixelDimensions, setCroppedPixelDimensions] = useState<{ width: number; height: number } | null>(null);

  // Debounce the completedCrop state to avoid excessive re-rendering during dragging
  const debouncedCompletedCrop = useDebounce(completedCrop, 200);

  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setCroppedImageUrl(null);
      setCrop(undefined); // Clear crop when new image is uploaded
      setCompletedCrop(undefined);
      setAspectRatio(undefined); // Reset aspect ratio
      setCroppedPixelDimensions(null);
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 70, // Start with a default crop percentage
        },
        aspectRatio,
        width,
        height,
      ),
      width,
      height,
    );
    setCrop(initialCrop);
    setCompletedCrop(initialCrop as PixelCrop); // Immediately set completed crop on load
  }, [aspectRatio]);

  // Effect to draw the cropped image onto a canvas when debouncedCompletedCrop changes
  useEffect(() => {
    if (
      debouncedCompletedCrop?.width &&
      debouncedCompletedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      const image = imgRef.current;
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelRatio = window.devicePixelRatio;

      canvas.width = Math.floor(debouncedCompletedCrop.width * scaleX * pixelRatio);
      canvas.height = Math.floor(debouncedCompletedCrop.height * scaleY * pixelRatio);

      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingQuality = 'high';

      const cropX = debouncedCompletedCrop.x * scaleX;
      const cropY = debouncedCompletedCrop.y * scaleY;

      ctx.drawImage(
        image,
        cropX,
        cropY,
        debouncedCompletedCrop.width * scaleX,
        debouncedCompletedCrop.height * scaleY,
        0,
        0,
        debouncedCompletedCrop.width * scaleX,
        debouncedCompletedCrop.height * scaleY,
      );

      setCroppedImageUrl(canvas.toDataURL(imageFile?.type || 'image/png'));
      setCroppedPixelDimensions({
        width: Math.floor(debouncedCompletedCrop.width * scaleX),
        height: Math.floor(debouncedCompletedCrop.height * scaleY),
      });
    } else {
      setCroppedImageUrl(null); // Clear cropped URL if crop is invalid or not complete
      setCroppedPixelDimensions(null);
    }
  }, [debouncedCompletedCrop, imageFile]);

  const handleDownload = () => {
    if (!croppedImageUrl || !imageFile) return;
    const filename = `cropped_${imageFile.name}`;
    downloadImage(croppedImageUrl, filename);
  };

  const handleReset = () => {
    setImageFile(null);
    setImageUrl(null);
    setCroppedImageUrl(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setAspectRatio(undefined);
    setCroppedPixelDimensions(null);
  };

  const handleClearCrop = () => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setCroppedImageUrl(null); // Clear the result as well
    setCroppedPixelDimensions(null);
  };

  const handleAspectRatioButtonClick = (newAspect: number | undefined) => {
    setAspectRatio(newAspect);
    if (imgRef.current) {
      setCrop(
        centerCrop(
          makeAspectCrop(
            {
              unit: '%',
              width: 70,
              height: 70,
            },
            newAspect,
            imgRef.current.naturalWidth,
            imgRef.current.naturalHeight,
          ),
          imgRef.current.naturalWidth,
          imgRef.current.naturalHeight,
        ),
      );
    }
  };

  const aspectRatioButtons = [
    { label: 'Free', value: undefined },
    { label: '1:1', value: 1 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
    { label: '4:3', value: 4 / 3 },
    { label: '3:4', value: 3 / 4 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gray-800 rounded-lg p-6 space-y-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white">Crop Settings</h3>
        
        {/* Aspect Ratio Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
          <div className="flex flex-wrap gap-2">
            {aspectRatioButtons.map((ar) => (
              <Button
                key={ar.label}
                variant={aspectRatio === ar.value ? 'primary' : 'secondary'}
                onClick={() => handleAspectRatioButtonClick(ar.value)}
                disabled={!imageFile}
                className="px-4 py-2"
              >
                {ar.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Real-time Dimensions Display */}
        {completedCrop && croppedPixelDimensions && (
          <div className="pt-4 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Selected Crop Dimensions</h4>
            <p className="text-xl font-mono text-teal-300">
              {croppedPixelDimensions.width}px × {croppedPixelDimensions.height}px
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={handleClearCrop} 
            variant="secondary" 
            disabled={!imageFile || !crop} 
            icon={<XMarkIcon />}
            className="w-full"
          >
            Clear Crop Selection
          </Button>
          <Button 
            onClick={handleDownload} 
            disabled={!croppedImageUrl} 
            icon={<ArrowDownTrayIcon />}
            className="w-full"
          >
            Download Cropped Image
          </Button>
        </div>
        <Button onClick={handleReset} variant="outline" icon={<ArrowUturnLeftIcon />} disabled={!imageFile}>
          Start Over
        </Button>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Interactive Cropper</h3>
        <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh] overflow-hidden relative">
          {!imageFile ? (
            <ImageUploader onFileSelect={handleImageUpload} multiple={false} accept="image/*" title="Upload an image to crop" description="Select an area and download the cropped result."/>
          ) : (
            <ReactCrop 
                crop={crop} 
                onChange={(_, percentCrop) => setCrop(percentCrop)} 
                onComplete={(c) => setCompletedCrop(c)} 
                aspect={aspectRatio}
                minWidth={10}
                minHeight={10}
                className="flex-grow flex items-center justify-center max-h-[80vh]"
            >
                <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imageUrl ?? ''}
                    onLoad={onImageLoad}
                    className="max-w-full max-h-full object-contain"
                />
            </ReactCrop>
          )}
          <canvas
              ref={previewCanvasRef}
              style={{
                  display: 'none', // Hidden canvas for actual cropping
              }}
          />
        </div>
      </div>

      {croppedImageUrl && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Cropped Result Preview</h3>
              <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[30vh]">
                  <img src={croppedImageUrl} alt="Cropped Result" className="max-w-full max-h-full object-contain rounded-md" />
              </div>
          </div>
      )}
    </div>
  );
};

export default CropImage;