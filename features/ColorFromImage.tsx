import React, { useState, useRef, useCallback } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { ArrowUturnLeftIcon } from '../components/icons';

interface ColorPalette {
  hex: string;
  count: number;
}

const ColorFromImage: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<ColorPalette[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const extractPalette = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const MAX_WIDTH = 200;
    const scale = MAX_WIDTH / img.width;
    canvas.width = MAX_WIDTH;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colorCounts: { [key: string]: number } = {};
    const step = 4 * 5; // Sample every 5 pixels

    for (let i = 0; i < imageData.length; i += step) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
      colorCounts[hex] = (colorCounts[hex] || 0) + 1;
    }
    
    const sortedPalette = Object.entries(colorCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 12)
      .map(([hex, count]) => ({ hex, count }));
      
    setPalette(sortedPalette);
    setIsLoading(false);
  }, []);

  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setIsLoading(true);
      setImageFile(file);
      setPalette([]);
      const url = URL.createObjectURL(file);
      setImageUrl(url);

      const img = new Image();
      img.src = url;
      img.onload = () => extractPalette(img);
      img.onerror = () => setIsLoading(false);
    }
  };
  
  const handleColorClick = (hex: string) => {
      navigator.clipboard.writeText(hex).then(() => {
          setCopiedColor(hex);
          setTimeout(() => setCopiedColor(null), 1500);
      });
  };

  const handleReset = () => {
    setImageFile(null);
    setImageUrl(null);
    setPalette([]);
    setIsLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-zinc-900 rounded-lg p-6 space-y-4 border border-zinc-800">
            <h3 className="text-lg font-semibold text-white">Color Palette Extractor</h3>
            <p className="text-sm text-gray-400">
              This tool analyzes your image to find the most dominant colors. Click on any color swatch to copy its HEX code to your clipboard.
            </p>
        </div>
        <Button onClick={handleReset} variant="outline" icon={<ArrowUturnLeftIcon />} disabled={!imageFile}>
            Start Over
        </Button>
      </div>
      <div className="lg:col-span-8">
        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 sticky top-24">
          <div className="bg-black/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh] mb-6">
            {!imageFile ? (
              <ImageUploader onFileSelect={handleImageUpload} multiple={false} accept="image/*" title="Get Color Palette from Image" />
            ) : (
              <img src={imageUrl ?? ''} alt="Uploaded preview" className="max-w-full object-contain rounded-md" loading="lazy" />
            )}
          </div>

          <h2 className="text-xl font-bold text-white mb-4 px-2">Extracted Colors</h2>
          {isLoading ? (
              <div className="text-gray-400 px-2">Extracting palette...</div>
          ) : palette.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {palette.map(({ hex }) => (
                    <div key={hex} className="space-y-2 group" onClick={() => handleColorClick(hex)}>
                        <div 
                          style={{ backgroundColor: hex }} 
                          className="h-24 rounded-lg shadow-lg border-2 border-transparent group-hover:border-[#1DB954] transition-all cursor-pointer relative"
                        >
                           {copiedColor === hex && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-md">
                              <span className="text-white text-xs font-bold">Copied!</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-mono text-center text-gray-300 group-hover:text-white cursor-pointer">{hex}</p>
                    </div>
                ))}
            </div>
          ) : imageFile && (
            <div className="text-gray-400 px-2">No palette generated yet.</div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default ColorFromImage;
