

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { downloadImage, loadImageAsDataURLAndDimensions } from '../utils/imageUtils';
import { ArrowDownTrayIcon, ArrowUturnLeftIcon, CollageIcon, XMarkIcon, PlusIcon } from '../components/icons';
import type { FileWithPreview } from '../types';
import { ColorPicker } from '../components/ColorPicker'; // Import new ColorPicker

const MAX_IMAGES = 10;
const DEFAULT_COLS = 2;
const DEFAULT_ROWS = 2;
const DEFAULT_BORDER_WIDTH = 10;
const DEFAULT_BORDER_COLOR = '#111827';
const DEFAULT_BORDER_TEMPLATE = 'grid';

type BorderTemplate = 'none' | 'grid' | 'rounded';

const CollageMaker: React.FC = () => {
  const [imageFiles, setImageFiles] = useState<FileWithPreview[]>([]);
  const [collageUrl, setCollageUrl] = useState<string | null>(null);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [borderWidth, setBorderWidth] = useState(DEFAULT_BORDER_WIDTH);
  const [borderColor, setBorderColor] = useState(DEFAULT_BORDER_COLOR);
  const [borderTemplate, setBorderTemplate] = useState<BorderTemplate>(DEFAULT_BORDER_TEMPLATE);
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
      if (collageUrl) {
        URL.revokeObjectURL(collageUrl);
      }
    };
  }, [imageFiles, collageUrl]);

  const handleImagesUpload = async (files: File[]) => {
    setError(null);
    if (imageFiles.length + files.length > MAX_IMAGES) {
      setError(`You can only upload up to ${MAX_IMAGES - imageFiles.length} more images. Please remove some existing images or try again with fewer files.`);
      return;
    }

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
    setCollageUrl(null); // Clear previous collage on new uploads
    setIsProcessing(false);
  };

  const handleRemoveImage = (idToRemove: string) => {
    setImageFiles(prev => {
      const updatedFiles = prev.filter(file => file.id !== idToRemove);
      if (prev.length !== updatedFiles.length) {
        // Only clear collage if an image was actually removed
        setCollageUrl(null);
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
    setCollageUrl(null); // Clear generated collage on reorder
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


  const generateCollage = useCallback(async () => {
    if (imageFiles.length === 0) {
      setError('Please upload at least one image.');
      return;
    }
    if (rows <= 0 || cols <= 0) {
      setError('Rows and columns must be positive numbers.');
      return;
    }
    if (imageFiles.length > rows * cols) {
      setError(`Too many images for ${rows}x${cols} grid. Reduce images or increase grid size.`);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setCollageUrl(null);

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas element not found.');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get 2D rendering context.');

      const effectiveBorderWidth = borderTemplate === 'none' ? 0 : borderWidth;
      const TARGET_CELL_SIZE = 500;
      const cellWidth = TARGET_CELL_SIZE;
      const cellHeight = TARGET_CELL_SIZE;
      
      // Dynamically calculate the number of rows needed to display all images
      const renderRows = Math.ceil(imageFiles.length / cols);

      canvas.width = cols * cellWidth + (cols + 1) * effectiveBorderWidth;
      canvas.height = renderRows * cellHeight + (renderRows + 1) * effectiveBorderWidth;

      ctx.fillStyle = borderColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let imageIndex = 0;
      for (let r = 0; r < renderRows; r++) {
        for (let c = 0; c < cols; c++) {
          if (imageIndex >= imageFiles.length) break;

          const file = imageFiles[imageIndex];
          const img = new Image();
          img.src = file.preview;

          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
          });

          const dx = effectiveBorderWidth + c * (cellWidth + effectiveBorderWidth);
          const dy = effectiveBorderWidth + r * (cellHeight + effectiveBorderWidth);

          ctx.save();
          
          if (borderTemplate === 'rounded') {
            const cornerRadius = Math.min(cellWidth, cellHeight) * 0.1; // 10% of smallest dimension
            ctx.beginPath();
            ctx.moveTo(dx + cornerRadius, dy);
            ctx.lineTo(dx + cellWidth - cornerRadius, dy);
            ctx.quadraticCurveTo(dx + cellWidth, dy, dx + cellWidth, dy + cornerRadius);
            ctx.lineTo(dx + cellWidth, dy + cellHeight - cornerRadius);
            ctx.quadraticCurveTo(dx + cellWidth, dy + cellHeight, dx + cellWidth - cornerRadius, dy + cellHeight);
            ctx.lineTo(dx + cornerRadius, dy + cellHeight);
            ctx.quadraticCurveTo(dx, dy + cellHeight, dx, dy + cellHeight - cornerRadius);
            ctx.lineTo(dx, dy + cornerRadius);
            ctx.quadraticCurveTo(dx, dy, dx + cornerRadius, dy);
            ctx.closePath();
            ctx.clip();
          }

          const cellAspectRatio = cellWidth / cellHeight;
          const imgAspectRatio = img.naturalWidth / img.naturalHeight;
          
          let sx = 0, sy = 0, sWidth = img.naturalWidth, sHeight = img.naturalHeight;

          if (imgAspectRatio > cellAspectRatio) {
            sWidth = img.naturalHeight * cellAspectRatio;
            sx = (img.naturalWidth - sWidth) / 2;
          } else {
            sHeight = img.naturalWidth / cellAspectRatio;
            sy = (img.naturalHeight - sHeight) / 2;
          }

          ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, cellWidth, cellHeight);
          ctx.restore();
          imageIndex++;
        }
        if (imageIndex >= imageFiles.length) break;
      }

      setCollageUrl(canvas.toDataURL('image/jpeg', 0.9));
    } catch (e: any) {
      console.error('Error generating collage:', e);
      setError(e.message || 'Failed to generate collage. Ensure all images are valid.');
    } finally {
      setIsProcessing(false);
    }
  }, [imageFiles, rows, cols, borderWidth, borderColor, borderTemplate]);

  const handleDownloadCollage = () => {
    if (collageUrl) {
      downloadImage(collageUrl, 'image_collage.jpeg');
    }
  };

  const handleReset = () => {
    setImageFiles([]);
    setCollageUrl(null);
    setCols(DEFAULT_COLS);
    setRows(DEFAULT_ROWS);
    setBorderWidth(DEFAULT_BORDER_WIDTH);
    setBorderColor(DEFAULT_BORDER_COLOR);
    setBorderTemplate(DEFAULT_BORDER_TEMPLATE);
    setIsProcessing(false);
    setError(null);
  };

  const isGenerateDisabled = imageFiles.length === 0 || rows <= 0 || cols <= 0 || imageFiles.length > (rows * cols) || isProcessing;

  const BorderTemplateOptions: { value: BorderTemplate, label: string }[] = [
    { value: 'grid', label: 'Solid Grid' },
    { value: 'rounded', label: 'Rounded Corners' },
    { value: 'none', label: 'None' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-gray-800 rounded-lg p-6 space-y-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Collage Settings</h3>

          {/* Grid Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="rows-input" className="block text-sm font-medium text-gray-300 mb-2">Rows</label>
              <input
                type="number"
                id="rows-input"
                min="0"
                max="5"
                value={rows}
                onChange={(e) => setRows(Math.max(0, Math.min(5, parseInt(e.target.value, 10) || 0)))}
                className="custom-input"
                disabled={imageFiles.length === 0 || isProcessing}
              />
            </div>
            <div>
              <label htmlFor="cols-input" className="block text-sm font-medium text-gray-300 mb-2">Columns</label>
              <input
                type="number"
                id="cols-input"
                min="0"
                max="5"
                value={cols}
                onChange={(e) => setCols(Math.max(0, Math.min(5, parseInt(e.target.value, 10) || 0)))}
                className="custom-input"
                disabled={imageFiles.length === 0 || isProcessing}
              />
            </div>
          </div>
          
          {/* Border Settings */}
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <h4 className="text-md font-semibold text-white">Border Settings</h4>
            <div>
              <label htmlFor="border-template" className="block text-sm font-medium text-gray-300 mb-2">Border Template</label>
              <select
                id="border-template"
                className="custom-input"
                value={borderTemplate}
                onChange={(e) => setBorderTemplate(e.target.value as BorderTemplate)}
                disabled={imageFiles.length === 0 || isProcessing}
              >
                {BorderTemplateOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            
            {borderTemplate !== 'none' && (
              <>
                <div>
                  <label htmlFor="border-width-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                      <span>Border Width</span>
                      <span className="font-mono text-teal-300">{borderWidth}px</span>
                  </label>
                  <input 
                      type="range" 
                      id="border-width-slider"
                      min="0" 
                      max="50"
                      step="1" 
                      value={borderWidth} 
                      onChange={(e) => setBorderWidth(parseInt(e.target.value, 10))}
                      className="w-full range-slider"
                      disabled={imageFiles.length === 0 || isProcessing}
                  />
                </div>
                <ColorPicker
                  label="Border Color"
                  color={borderColor}
                  onChange={setBorderColor}
                  disabled={imageFiles.length === 0 || isProcessing}
                />
              </>
            )}
          </div>


          {(imageFiles.length > 0 && (rows <= 0 || cols <= 0 || imageFiles.length > (rows * cols))) && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
                  <p className="font-semibold">Validation Error</p>
                  {rows <= 0 || cols <= 0 ? (
                      <p>Rows and columns must be greater than 0.</p>
                  ) : (
                      <p>Too many images for a {rows}x{cols} grid. Please increase grid size or remove images.</p>
                  )}
              </div>
          )}

          <div className="flex flex-col gap-4 pt-4 border-t border-gray-700">
            <Button onClick={generateCollage} isLoading={isProcessing} icon={<CollageIcon />} disabled={isGenerateDisabled}>
              Generate Collage
            </Button>
            <Button onClick={handleDownloadCollage} variant="secondary" disabled={!collageUrl || isProcessing} icon={<ArrowDownTrayIcon />}>
              Download Collage
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
          <h3 className="text-lg font-semibold text-white mb-4 px-2">Your Images & Collage Preview</h3>
          {!imageFiles.length ? (
            <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh]">
              <ImageUploader
                onFileSelect={handleImagesUpload}
                title="Upload up to 10 images"
                description="Select multiple files or drag & drop here"
                accept="image/*"
                multiple={true}
                disabled={imageFiles.length >= MAX_IMAGES || isProcessing}
              />
            </div>
          ) : (
            <>
              <p className="text-gray-400 text-sm mb-3 px-2">
                Uploaded Images ({imageFiles.length}/{MAX_IMAGES}). Drag & drop to reorder.
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
                {imageFiles.length < MAX_IMAGES && (
                  <label 
                    htmlFor="add-more-files-input" 
                    className="group flex flex-col items-center justify-center text-center p-2 aspect-square rounded-lg border-2 border-dashed border-gray-600 bg-gray-800/50 text-gray-400 transition-colors hover:border-teal-500 hover:text-teal-400 cursor-pointer focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-teal-400"
                    title={`Add up to ${MAX_IMAGES - imageFiles.length} more images`}
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
                      disabled={isProcessing || imageFiles.length >= MAX_IMAGES}
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
                  <p className="text-gray-400 mt-4">Generating collage...</p>
                </div>
              )}

              {collageUrl && !isProcessing ? (
                <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh] relative">
                  <img src={collageUrl} alt="Collage preview" className="max-w-full max-h-[80vh] object-contain rounded-md" />
                </div>
              ) : !isProcessing && imageFiles.length > 0 && (
                <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh] text-gray-400">
                  Click "Generate Collage" to see a preview.
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

export default CollageMaker;