import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { fileToBase64, downloadImage } from '../utils/imageUtils';
import { generateMemeCaption } from '../services';
import { AIIcon, ArrowDownTrayIcon, ArrowUturnLeftIcon } from '../components/icons';


const MemeGenerator: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [topText, setTopText] = useState('Top Text');
  const [bottomText, setBottomText] = useState('Bottom Text');
  const [memeDataUrl, setMemeDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      setImageFile(files[0]);
      setImageUrl(URL.createObjectURL(files[0]));
    }
  };

  const drawMeme = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !imageUrl) return;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const fontSize = canvas.width / 12;
      ctx.font = `bold ${fontSize}px Impact`;
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = fontSize / 20;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const topY = canvas.height * 0.05;
      ctx.strokeText(topText.toUpperCase(), canvas.width / 2, topY);
      ctx.fillText(topText.toUpperCase(), canvas.width / 2, topY);

      ctx.textBaseline = 'bottom';
      const bottomY = canvas.height * 0.95;
      ctx.strokeText(bottomText.toUpperCase(), canvas.width / 2, bottomY);
      ctx.fillText(bottomText.toUpperCase(), canvas.width / 2, bottomY);
      
      setMemeDataUrl(canvas.toDataURL('image/jpeg'));
    };
  }, [imageUrl, topText, bottomText]);

  useEffect(() => {
    if (imageUrl) {
      drawMeme();
    }
  }, [imageUrl, topText, bottomText, drawMeme]);

  const handleGenerateCaption = async () => {
    if (!imageFile) return;
    setIsLoading(true);
    try {
      const base64Image = await fileToBase64(imageFile);
      const caption = await generateMemeCaption({ base64Image, mimeType: imageFile.type });
      setTopText(caption.topText);
      setBottomText(caption.bottomText);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to generate caption.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if(!memeDataUrl || !imageFile) return;
    const filename = `meme_${imageFile.name.split('.')[0]}.jpg`;
    downloadImage(memeDataUrl, filename);
  };

  const handleReset = () => {
    setImageFile(null);
    setImageUrl(null);
    setMemeDataUrl(null);
    setTopText('Top Text');
    setBottomText('Bottom Text');
  }

  const LoadingSpinner = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-gray-800 rounded-lg p-6 space-y-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white">Sesuaikan Meme Anda</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="top-text" className="block text-sm font-medium text-gray-300 mb-2">Teks Atas</label>
                <input type="text" id="top-text" value={topText} onChange={(e) => setTopText(e.target.value)} className="custom-input" disabled={!imageFile}/>
              </div>
              <div>
                <label htmlFor="bottom-text" className="block text-sm font-medium text-gray-300 mb-2">Teks Bawah</label>
                <input type="text" id="bottom-text" value={bottomText} onChange={(e) => setBottomText(e.target.value)} className="custom-input" disabled={!imageFile}/>
              </div>
            </div>
            <div className="flex flex-col gap-4 pt-4 border-t border-gray-700">
                <Button icon={<AIIcon />} onClick={handleGenerateCaption} isLoading={isLoading} disabled={!imageFile}>
                    Buat dengan AI
                </Button>
                <Button icon={<ArrowDownTrayIcon />} onClick={handleDownload} variant="secondary" disabled={!memeDataUrl}>
                    Unduh Meme
                </Button>
            </div>
        </div>
         <Button icon={<ArrowUturnLeftIcon />} onClick={handleReset} variant="outline" disabled={!imageFile}>
            Mulai Ulang
        </Button>
      </div>
      <div className="lg:col-span-8">
         <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 sticky top-24">
            <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center relative min-h-[40vh]">
                {!imageFile ? (
                  <ImageUploader onFileSelect={handleImageUpload} multiple={false} accept="image/*" />
                ) : (
                  <>
                    {isLoading && <LoadingSpinner />}
                    {memeDataUrl ? (
                        <img src={memeDataUrl} alt="Meme preview" className="max-w-full object-contain rounded-md" />
                    ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center rounded-md">
                            <p className="text-gray-400">Memuat Pratinjau...</p>
                        </div>
                    )}
                     <canvas ref={canvasRef} className="hidden"></canvas>
                  </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MemeGenerator;