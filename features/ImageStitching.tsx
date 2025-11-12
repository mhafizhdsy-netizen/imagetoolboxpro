import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { downloadImage, loadImageAsDataURLAndDimensions } from '../utils/imageUtils';
import { ArrowDownTrayIcon, ArrowUturnLeftIcon, StitchIcon, XMarkIcon, PlusIcon } from '../components/icons';
import type { FileWithPreview } from '../types';

const ImageStitching: React.FC = () => {
  const [imageFiles, setImageFiles] = useState<FileWithPreview[]>([]);
  const [stitchedImageUrl, setStitchedImageUrl] = useState<string | null>(null);
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // For drag and drop reordering
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    // Revoke old object URLs when component unmounts or imageFiles change
    return () => {
      imageFiles.forEach(file => URL.revokeObjectURL(file.preview));
      if (stitchedImageUrl) {
        URL.revokeObjectURL(stitchedImageUrl);
      }
    };
  }, [imageFiles, stitchedImageUrl]);

  const handleImagesUpload = async (files: File[]) => {
    setError(null);
    setIsProcessing(true);
    const newFilesWithPreviews: FileWithPreview[] = [];
    for (const file of files) {
      try {
        const { dataUrl, width, height } = await loadImageAsDataURLAndDimensions(file);
        newFilesWithPreviews.push(Object.assign(file, {
          preview: dataUrl,
          id: URL.createObjectURL(file), // Use blob URL as unique ID for preview
          width,
          height,
        }));
      } catch (e: any) {
        setError(e.message || `Failed to load image preview or dimensions for ${file.name}.`);
      }
    }
    setImageFiles(prev => [...prev, ...newFilesWithPreviews]);
    setStitchedImageUrl(null); // Clear previous stitched image on new uploads
    setIsProcessing(false);
  };

  const handleRemoveImage = (idToRemove: string) => {
    setImageFiles(prev => {
      const updatedFiles = prev.filter(file => file.id !== idToRemove);
      if (prev.length !== updatedFiles.length) {
        // Only clear stitched image if an image was actually removed
        setStitchedImageUrl(null);
      }
      return updatedFiles;
    });
    setError(null);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragOverItem.current = index;
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // No visual feedback on leave, handled by handleDragEnd
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Clean up any lingering drag-over styles - not strictly needed with simple swap
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const draggedIndex = dragItem.current;
    const droppedIndex = dragOverItem.current;

    if (draggedIndex === null || droppedIndex === null || draggedIndex === droppedIndex) {
      return;
    }

    const newImageFiles = [...imageFiles];
    const [reorderedItem] = newImageFiles.splice(draggedIndex, 1);
    newImageFiles.splice(droppedIndex, 0, reorderedItem);

    setImageFiles(newImageFiles);
    dragItem.current = null;
    dragOverItem.current = null;
    setStitchedImageUrl(null); // Clear generated stitched image on reorder
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        handleImagesUpload(Array.from(e.target.files));
    }
  };


  const stitchImages = useCallback(async () => {
    if (imageFiles.length < 2) {
      setError('Please upload at least two images to stitch.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStitchedImageUrl(null);

    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas element not found.');
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D rendering context.');
      }

      const loadedImages: HTMLImageElement[] = [];
      for (const file of imageFiles) {
        const img = new Image();
        img.src = file.preview;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        loadedImages.push(img);
      }

      let totalWidth = 0;
      let totalHeight = 0;
      let maxWidth = 0;
      let maxHeight = 0;

      // Calculate dimensions for the stitched canvas
      if (direction === 'horizontal') {
        maxHeight = Math.max(...loadedImages.map(img => img.naturalHeight));
        totalWidth = loadedImages.reduce((sum, img) => sum + img.naturalWidth, 0);
        canvas.width = totalWidth;
        canvas.height = maxHeight;
      } else { // vertical
        maxWidth = Math.max(...loadedImages.map(img => img.naturalWidth));
        totalHeight = loadedImages.reduce((sum, img) => sum + img.naturalHeight, 0);
        canvas.width = maxWidth;
        canvas.height = totalHeight;
      }

      ctx.fillStyle = '#111827'; // Tailwind gray-900 for background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let currentX = 0;
      let currentY = 0;

      for (const img of loadedImages) {
        if (direction === 'horizontal') {
          // Align by top, center vertically if needed (not implemented here for simplicity, just draw)
          ctx.drawImage(img, currentX, 0, img.naturalWidth, img.naturalHeight);
          currentX += img.naturalWidth;
        } else { // vertical
          // Align by left, center horizontally if needed (not implemented here for simplicity, just draw)
          ctx.drawImage(img, 0, currentY, img.naturalWidth, img.naturalHeight);
          currentY += img.naturalHeight;
        }
      }

      setStitchedImageUrl(canvas.toDataURL('image/jpeg', 0.9)); // Output as JPG with good quality
    } catch (e: any) {
      console.error('Error stitching images:', e);
      setError(e.message || 'Failed to stitch images. Ensure all images are valid.');
    } finally {
      setIsProcessing(false);
    }
  }, [imageFiles, direction]);

  const handleDownloadStitchedImage = () => {
    if (stitchedImageUrl) {
      downloadImage(stitchedImageUrl, 'stitched_image.jpeg');
    }
  };

  const handleReset = () => {
    setImageFiles([]);
    setStitchedImageUrl(null);
    setDirection('horizontal');
    setIsProcessing(false);
    setError(null);
  };

  const isStitchDisabled = imageFiles.length < 2 || isProcessing;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-gray-800 rounded-lg p-6 space-y-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Image Stitching Settings</h3>

          {/* Stitching Direction */}
          <div className="space-y-2 pt-2 border-t border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-2">Stitching Direction</label>
            <div className="flex rounded-lg overflow-hidden bg-gray-700">
              <button
                className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
                  direction === 'horizontal' ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-600'
                } disabled:opacity-50`}
                onClick={() => { setDirection('horizontal'); setStitchedImageUrl(null); }}
                disabled={imageFiles.length < 2 || isProcessing}
              >
                Horizontal
              </button>
              <button
                className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
                  direction === 'vertical' ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-600'
                } disabled:opacity-50`}
                onClick={() => { setDirection('vertical'); setStitchedImageUrl(null); }}
                disabled={imageFiles.length < 2 || isProcessing}
              >
                Vertical
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-4 border-t border-gray-700">
            <Button onClick={stitchImages} isLoading={isProcessing} icon={<StitchIcon />} disabled={isStitchDisabled}>
              Stitch Images
            </Button>
            <Button onClick={handleDownloadStitchedImage} variant="secondary" disabled={!stitchedImageUrl || isProcessing} icon={<ArrowDownTrayIcon />}>
              Download Stitched Image
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        <Button onClick={handleReset} variant="outline" icon={<ArrowUturnLeftIcon />} disabled={imageFiles.length === 0}>
          Start Over
        </Button>
      </div>

      <div className="lg:col-span-8">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 sticky top-24">
          <h3 className="text-lg font-semibold text-white mb-4 px-2">Your Images & Stitched Preview</h3>
          {!imageFiles.length ? (
            <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh]">
              <ImageUploader
                onFileSelect={handleImagesUpload}
                title="Upload your images to stitch"
                description="Select multiple files or drag & drop here"
                accept="image/*"
                multiple={true}
                disabled={isProcessing}
              />
            </div>
          ) : (
            <>
              <p className="text-gray-400 text-sm mb-3 px-2">
                Uploaded Images ({imageFiles.length}). Drag & drop to reorder.
              </p>
              <div
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 p-2 bg-gray-900/50 rounded-lg mb-6"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {imageFiles.map((file, index) => (
                  <div
                    key={file.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                    className={`relative group aspect-square w-full overflow-hidden rounded-lg border-2 border-gray-700 transition-all duration-200 
                                  ${dragItem.current === index ? 'opacity-50 border-teal-500' : ''}
                                  ${dragOverItem.current === index && dragItem.current !== index ? 'border-teal-400' : ''}`}
                  >
                    <img
                      src={file.preview}
                      alt={`Image ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xl font-bold">{index + 1}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveImage(file.id)}
                      className="absolute top-2 right-2 p-1 bg-red-600/70 text-white rounded-full hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {imageFiles.length > 0 && (
                  <label 
                    htmlFor="add-more-files-input" 
                    className="group flex flex-col items-center justify-center text-center p-2 aspect-square rounded-lg border-2 border-dashed border-gray-600 bg-gray-800/50 text-gray-400 transition-colors hover:border-teal-500 hover:text-teal-400 cursor-pointer focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-teal-400"
                    title="Add more images"
                  >
                    <PlusIcon className="w-8 h-8" />
                    <span className="mt-2 text-sm font-semibold">Add More</span>
                    <input
                      id="add-more-files-input"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      disabled={isProcessing}
                    />
                  </label>
                )}
              </div>

              {isProcessing && (
                <div className="bg-gray-900/50 p-2 rounded-lg flex flex-col items-center justify-center min-h-[20vh] relative">
                  <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-400 mt-4">Stitching images...</p>
                </div>
              )}

              {stitchedImageUrl && !isProcessing ? (
                <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh] relative">
                  <img src={stitchedImageUrl} alt="Stitched preview" className="max-w-full max-h-[80vh] object-contain rounded-md" />
                </div>
              ) : !isProcessing && imageFiles.length > 0 && (
                <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh] text-gray-400">
                  Click "Stitch Images" to see a preview.
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageStitching;