
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { downloadImage } from '../utils/imageUtils';
import { ArrowDownTrayIcon, ArrowUturnLeftIcon, WatermarkIcon, PhotoIcon, DocumentIconNoFw } from '../components/icons';
import { ColorPicker } from '../components/ColorPicker'; // Import the new ColorPicker

const WatermarkImage: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [watermarkedUrl, setWatermarkedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Watermark Settings
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('Your Watermark');
  const [watermarkImageFile, setWatermarkImageFile] = useState<File | null>(null);
  const [watermarkImageUrl, setWatermarkImageUrl] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0.5);
  const [size, setSize] = useState(5); // in percentage of image width
  const [color, setColor] = useState('#ffffff');
  const [position, setPosition] = useState<'bottom-right' | 'top-left' | 'center' | 'bottom-left' | 'top-right'>('bottom-right');
  const [isTiled, setIsTiled] = useState(false); // New state for tiling

  const applyWatermark = useCallback(() => {
    if (!imageUrl) return;
    setIsProcessing(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) {
        setIsProcessing(false);
        return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        ctx.drawImage(img, 0, 0);

        ctx.globalAlpha = opacity;

        if (isTiled) {
            let tileWidth, tileHeight, stepX, stepY;
            const paddingFactor = 0.05; // 5% padding relative to canvas width for gap

            if (watermarkType === 'text') {
                const fontSize = (canvas.width * size) / 100;
                ctx.font = `bold ${fontSize}px Arial`;
                ctx.fillStyle = color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Approximate text width for tiling step calculation
                const textMetrics = ctx.measureText(text);
                tileWidth = textMetrics.width;
                tileHeight = fontSize * 1.2; // A bit more than font size for vertical spacing

                stepX = tileWidth + (canvas.width * paddingFactor);
                stepY = tileHeight + (canvas.height * paddingFactor);

                for (let y = 0; y < canvas.height + tileHeight; y += stepY) {
                    for (let x = 0; x < canvas.width + tileWidth; x += stepX) {
                        ctx.fillText(text, x + tileWidth / 2, y + tileHeight / 2); // Center text in its tile slot
                    }
                }
            } else if (watermarkType === 'image' && watermarkImageUrl) {
                const watermarkImg = new Image();
                watermarkImg.crossOrigin = 'anonymous';
                watermarkImg.src = watermarkImageUrl;
                watermarkImg.onload = () => {
                    tileWidth = (canvas.width * size) / 100;
                    tileHeight = (watermarkImg.naturalHeight / watermarkImg.naturalWidth) * tileWidth;
                    
                    stepX = tileWidth + (canvas.width * paddingFactor);
                    stepY = tileHeight + (canvas.height * paddingFactor);

                    for (let y = 0; y < canvas.height + tileHeight; y += stepY) {
                        for (let x = 0; x < canvas.width + tileWidth; x += stepX) {
                            ctx.drawImage(watermarkImg, x, y, tileWidth, tileHeight);
                        }
                    }
                    const dataUrl = canvas.toDataURL(imageFile?.type || 'image/png');
                    setWatermarkedUrl(dataUrl);
                    setIsProcessing(false);
                };
                watermarkImg.onerror = () => {
                    setIsProcessing(false);
                    alert("Failed to load watermark image.");
                };
                return; // Exit early as watermarkImg.onload will handle final steps
            }
        } else { // Single watermark placement
            const margin = canvas.width * 0.02;

            if (watermarkType === 'text') {
                const fontSize = (canvas.width * size) / 100;
                ctx.font = `bold ${fontSize}px Arial`;
                ctx.fillStyle = color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                let x = canvas.width / 2;
                let y = canvas.height / 2;

                if (position === 'bottom-right') {
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'bottom';
                    x = canvas.width - margin;
                    y = canvas.height - margin;
                } else if (position === 'top-left') {
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    x = margin;
                    y = margin;
                } else if (position === 'top-right') {
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'top';
                    x = canvas.width - margin;
                    y = margin;
                } else if (position === 'bottom-left') {
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'bottom';
                    x = margin;
                    y = canvas.height - margin;
                }

                ctx.fillText(text, x, y);
            } else if (watermarkType === 'image' && watermarkImageUrl) {
                const watermarkImg = new Image();
                watermarkImg.crossOrigin = 'anonymous'; // Ensure proper loading for drawing
                watermarkImg.src = watermarkImageUrl;
                watermarkImg.onload = () => {
                    const watermarkWidth = (canvas.width * size) / 100;
                    const watermarkHeight = (watermarkImg.naturalHeight / watermarkImg.naturalWidth) * watermarkWidth;

                    let x = (canvas.width - watermarkWidth) / 2;
                    let y = (canvas.height - watermarkHeight) / 2;

                    if (position === 'bottom-right') {
                        x = canvas.width - watermarkWidth - margin;
                        y = canvas.height - watermarkHeight - margin;
                    } else if (position === 'top-left') {
                        x = margin;
                        y = margin;
                    } else if (position === 'top-right') {
                        x = canvas.width - watermarkWidth - margin;
                        y = margin;
                    } else if (position === 'bottom-left') {
                        x = margin;
                        y = canvas.height - watermarkHeight - margin;
                    }
                    
                    ctx.drawImage(watermarkImg, x, y, watermarkWidth, watermarkHeight);
                    const dataUrl = canvas.toDataURL(imageFile?.type || 'image/png');
                    setWatermarkedUrl(dataUrl);
                    setIsProcessing(false);
                };
                watermarkImg.onerror = () => {
                    setIsProcessing(false);
                    alert("Failed to load watermark image.");
                };
                return; // Exit early as watermarkImg.onload will handle final steps
            }
        }
        
        const dataUrl = canvas.toDataURL(imageFile?.type || 'image/png');
        setWatermarkedUrl(dataUrl);
        setIsProcessing(false);
    };
    img.onerror = () => {
        setIsProcessing(false);
        alert("Failed to load base image for watermarking.");
    }

  }, [imageUrl, watermarkType, text, watermarkImageUrl, opacity, size, color, position, isTiled, imageFile]);

  useEffect(() => {
    if (imageUrl) {
        applyWatermark();
    }
  }, [imageUrl, watermarkType, text, watermarkImageUrl, opacity, size, color, position, isTiled, applyWatermark]);

  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
        const file = files[0];
        setImageFile(file);
        setImageUrl(URL.createObjectURL(file));
        setWatermarkedUrl(null);
    }
  };

  const handleWatermarkImageUpload = (files: File[]) => {
    if (files.length > 0) {
        const file = files[0];
        setWatermarkImageFile(file);
        setWatermarkImageUrl(URL.createObjectURL(file));
    }
  };
  
  const handleDownload = () => {
    if (!watermarkedUrl || !imageFile) return;
    const filename = `watermarked_${imageFile.name}`;
    downloadImage(watermarkedUrl, filename);
  };

  const handleReset = () => {
    setImageFile(null);
    setImageUrl(null);
    setWatermarkedUrl(null);
    setWatermarkType('text');
    setText('Your Watermark');
    setWatermarkImageFile(null);
    setWatermarkImageUrl(null);
    setOpacity(0.5);
    setSize(5);
    setColor('#ffffff');
    setPosition('bottom-right');
    setIsTiled(false); // Reset tiling state
  };

  const isWatermarkReady = imageFile && (watermarkType === 'text' ? text.trim() !== '' : watermarkImageUrl !== null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-gray-800 rounded-lg p-6 space-y-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white">Watermark Settings</h3>

            {/* Watermark Type Selector */}
            <div className="space-y-2 pt-2 border-t border-gray-700">
                <label className="block text-sm font-medium text-gray-300 mb-2">Watermark Type</label>
                <div className="flex rounded-lg overflow-hidden bg-gray-700">
                    <button
                        className={`flex-1 flex items-center justify-center py-2 px-3 text-sm font-medium transition-colors ${
                            watermarkType === 'text' ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-600'
                        } disabled:opacity-50`}
                        onClick={() => setWatermarkType('text')}
                        disabled={!imageFile}
                    >
                        <DocumentIconNoFw /> <span className="ml-2">Text</span>
                    </button>
                    <button
                        className={`flex-1 flex items-center justify-center py-2 px-3 text-sm font-medium transition-colors ${
                            watermarkType === 'image' ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-600'
                        } disabled:opacity-50`}
                        onClick={() => setWatermarkType('image')}
                        disabled={!imageFile}
                    >
                        <PhotoIcon /> <span className="ml-2">Image</span>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {watermarkType === 'text' ? (
                    <>
                        <div>
                            <label htmlFor="watermark-text" className="block text-sm font-medium text-gray-300 mb-2">Watermark Text</label>
                            <input type="text" id="watermark-text" value={text} onChange={(e) => setText(e.target.value)} className="custom-input" disabled={!imageFile}/>
                        </div>
                        <ColorPicker
                          label="Color"
                          color={color}
                          onChange={setColor}
                          disabled={!imageFile}
                        />
                    </>
                ) : ( // watermarkType === 'image'
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Watermark Image</label>
                        {!watermarkImageUrl ? (
                            <ImageUploader 
                                onFileSelect={handleWatermarkImageUpload} 
                                title="Upload Watermark Image" 
                                description="PNG, JPG, WEBP"
                                multiple={false}
                                accept="image/*"
                            />
                        ) : (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-700 bg-gray-900/50 flex items-center justify-center">
                                <img src={watermarkImageUrl} alt="Watermark preview" className="max-w-full max-h-full object-contain p-2" />
                                <button
                                    onClick={() => { setWatermarkImageFile(null); setWatermarkImageUrl(null); }}
                                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors text-sm"
                                    title="Remove watermark image"
                                >
                                    &times;
                                </button>
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Recommended: PNG with transparent background.</p>
                    </div>
                )}
              
                <div>
                <label htmlFor="size-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                    <span>Size</span>
                    <span className="font-mono text-teal-300">{size}%</span>
                </label>
                <input type="range" id="size-slider" min="1" max="50" step="1" value={size} onChange={(e) => setSize(parseFloat(e.target.value))} className="w-full range-slider" disabled={!imageFile}/>
              </div>

              <div>
                <label htmlFor="opacity-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                    <span>Opacity</span>
                    <span className="font-mono text-teal-300">{Math.round(opacity * 100)}%</span>
                </label>
                <input type="range" id="opacity-slider" min="0" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full range-slider" disabled={!imageFile}/>
              </div>

              {/* New Tiling Option */}
              <div className="flex items-center pt-4 border-t border-gray-700">
                  <input 
                      id="tile-watermark" 
                      type="checkbox" 
                      checked={isTiled} 
                      onChange={(e) => setIsTiled(e.target.checked)} 
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-teal-500 focus:ring-teal-500" 
                      disabled={!imageFile}
                  />
                  <label htmlFor="tile-watermark" className="ml-3 block text-sm font-medium text-gray-300">Tile Watermark</label>
              </div>

              <div>
                <label htmlFor="position-select" className="block text-sm font-medium text-gray-300 mb-2">Position</label>
                <select 
                    id="position-select" 
                    value={position} 
                    onChange={(e) => setPosition(e.target.value as any)} 
                    className="custom-input" 
                    disabled={!imageFile || isTiled} // Disable if tiling is active
                >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="center">Center</option>
                </select>
                {isTiled && <p className="text-xs text-gray-500 mt-1">Position is ignored when tiling is active.</p>}
            </div>
            </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <Button onClick={applyWatermark} isLoading={isProcessing} icon={<WatermarkIcon />} disabled={!isWatermarkReady}>
            Apply Watermark
          </Button>
          <Button onClick={handleDownload} variant="secondary" disabled={!watermarkedUrl} icon={<ArrowDownTrayIcon />}>
            Download Watermarked Image
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
                <>
                  <img src={watermarkedUrl ?? imageUrl ?? ''} alt="Preview" className="max-w-full object-contain rounded-md"/>
                  <canvas ref={canvasRef} className="hidden"></canvas>
                </>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default WatermarkImage;
