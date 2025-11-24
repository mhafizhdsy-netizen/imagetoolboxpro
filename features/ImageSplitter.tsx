

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { downloadZip } from '../utils/imageUtils';
import { ArrowDownTrayIcon, ArrowUturnLeftIcon, GridIcon, CheckIcon, XMarkIcon } from '../components/icons';

interface SplitImage {
  id: string; // Unique ID for selection/keying
  dataUrl: string;
  filename: string;
  row: number; // 0-based row index
  col: number; // 0-based column index
}

type SplitMethod = 'rows' | 'cols' | 'grid';

const ImageSplitter: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('rows'); // New state for split method
  const [splitImages, setSplitImages] = useState<SplitImage[]>([]
  );
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null); // Hidden canvas for splitting logic

  // Revoke object URLs when splitImages change or component unmounts
  useEffect(() => {
    const imagesToRevoke = splitImages; 
    return () => {
      imagesToRevoke.forEach(img => URL.revokeObjectURL(img.dataUrl));
    };
  }, [splitImages]);

  // Revoke image preview URL when component unmounts or imageFile changes
  useEffect(() => {
    const currentImageUrl = imageUrl;
    return () => {
      if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl);
      }
    };
  }, [imageUrl]);

  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      // Revoke previous imageUrl if exists
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setSplitImages([]);
      setSelectedImages(new Set());
      setError(null);
      setRows(2); // Reset to default
      setCols(2); // Reset to default
      setSplitMethod('rows'); // Reset split method
    }
  };

  const handleSplitImage = useCallback(() => {
    if (!imageUrl || !imageFile) {
      setError('Please upload an image first.');
      return;
    }

    let effectiveRows = 0;
    let effectiveCols = 0;

    if (splitMethod === 'rows') {
      effectiveRows = Math.max(1, rows);
      effectiveCols = 1;
    } else if (splitMethod === 'cols') {
      effectiveRows = 1;
      effectiveCols = Math.max(1, cols);
    } else { // splitMethod === 'grid'
      effectiveRows = Math.max(1, rows);
      effectiveCols = Math.max(1, cols);
    }

    // This check is mostly redundant due to Math.max(1,x) but good for safety
    if (effectiveRows < 1 || effectiveCols < 1) { 
      setError('Number of splits must be at least 1.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSplitImages([]); // Clear previous split images
    setSelectedImages(new Set());

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        setError('Canvas element not found.');
        setIsLoading(false);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Failed to get canvas 2D context.');
        setIsLoading(false);
        return;
      }

      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const fileExtension = imageFile.type.split('/')[1] || 'png'; // Default to png if type is unknown

      const newSplitImages: SplitImage[] = [];
      
      // Calculate base slice dimensions and remainders
      const baseSliceWidth = Math.floor(imgWidth / effectiveCols);
      const remainderWidth = imgWidth % effectiveCols;

      const baseSliceHeight = Math.floor(imgHeight / effectiveRows);
      const remainderHeight = imgHeight % effectiveRows;

      let currentY = 0;
      for (let r = 0; r < effectiveRows; r++) {
        // Distribute remainder height to the first 'remainderHeight' rows
        const sliceHeight = baseSliceHeight + (r < remainderHeight ? 1 : 0);
        let currentX = 0;
        for (let c = 0; c < effectiveCols; c++) {
          // Distribute remainder width to the first 'remainderWidth' columns in each row
          const sliceWidth = baseSliceWidth + (c < remainderWidth ? 1 : 0);

          canvas.width = sliceWidth;
          canvas.height = sliceHeight;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            img,
            currentX,     // Source X
            currentY,     // Source Y
            sliceWidth,   // Source Width
            sliceHeight,  // Source Height
            0,            // Destination X
            0,            // Destination Y
            sliceWidth,   // Destination Width
            sliceHeight   // Destination Height
          );

          const dataUrl = canvas.toDataURL(imageFile.type);
          newSplitImages.push({
            id: `R${r + 1}C${c + 1}-${Date.now()}`,
            dataUrl,
            filename: `${imageFile.name.split('.')[0]}_R${r + 1}C${c + 1}.${fileExtension}`,
            row: r,
            col: c,
          });
          currentX += sliceWidth;
        }
        currentY += sliceHeight;
      }

      setSplitImages(newSplitImages);
      setIsLoading(false);
    };
    img.onerror = () => {
      setError('Failed to load image for splitting.');
      setIsLoading(false);
    };
  }, [imageUrl, imageFile, rows, cols, splitMethod]);

  const handleDownloadAll = useCallback(() => {
    if (splitImages.length === 0) {
      setError('No images to download. Please split an image first.');
      return;
    }
    const filenameBase = imageFile?.name.split('.')[0] || 'image';
    downloadZip(splitImages, `${filenameBase}_split_images.zip`);
  }, [splitImages, imageFile]);

  const handleDownloadSelected = useCallback(() => {
    if (selectedImages.size === 0) {
      setError('Please select at least one image to download.');
      return;
    }
    const imagesToDownload = splitImages.filter(img => selectedImages.has(img.id));
    const filenameBase = imageFile?.name.split('.')[0] || 'image';
    downloadZip(imagesToDownload, `${filenameBase}_selected_split_images.zip`);
  }, [selectedImages, splitImages, imageFile]);

  const handleToggleImageSelection = useCallback((id: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    if (selectedImages.size === splitImages.length && splitImages.length > 0) {
      setSelectedImages(new Set()); // Deselect all
    } else {
      setSelectedImages(new Set(splitImages.map(img => img.id))); // Select all
    }
  }, [selectedImages, splitImages]);

  const handleReset = () => {
    setImageFile(null);
    setImageUrl(null); // This will trigger useEffect to revoke URL
    setRows(2);
    setCols(2);
    setSplitMethod('rows');
    setSplitImages([]); // This will trigger useEffect to revoke URLs
    setSelectedImages(new Set());
    setIsLoading(false);
    setError(null);
  };

  // Determine the effective number of columns for UI display grid
  const currentEffectiveColsForPreview = (splitMethod === 'rows') ? 1 : Math.max(1, cols);

  // Disable split button logic:
  const isSplitButtonDisabled = !imageFile || isLoading || 
                                (splitMethod === 'rows' && rows === 0) || 
                                (splitMethod === 'cols' && cols === 0) ||
                                (splitMethod === 'grid' && (rows === 0 || cols === 0));

  const isDownloadAllDisabled = splitImages.length === 0 || isLoading;
  const isDownloadSelectedDisabled = selectedImages.size === 0 || isLoading;
  const isResetDisabled = !imageFile && splitImages.length === 0;

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
          <h3 className="text-lg font-semibold text-white">Splitter Settings</h3>

          {/* Split Method Selector */}
          <div className="space-y-2 pt-2 border-t border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-2">Split Method</label>
            <div className="flex rounded-lg overflow-hidden bg-gray-700">
              <button
                className={`flex-1 py-2 px-1 text-sm font-medium transition-colors ${
                  splitMethod === 'rows' ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-600'
                } disabled:opacity-50`}
                onClick={() => setSplitMethod('rows')}
                disabled={!imageFile || isLoading}
              >
                Horizontal
              </button>
              <button
                className={`flex-1 py-2 px-1 text-sm font-medium transition-colors ${
                  splitMethod === 'cols' ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-600'
                } disabled:opacity-50`}
                onClick={() => setSplitMethod('cols')}
                disabled={!imageFile || isLoading}
              >
                Vertical
              </button>
              <button
                className={`flex-1 py-2 px-1 text-sm font-medium transition-colors ${
                  splitMethod === 'grid' ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-600'
                } disabled:opacity-50`}
                onClick={() => setSplitMethod('grid')}
                disabled={!imageFile || isLoading}
              >
                Grid
              </button>
            </div>
          </div>

          {/* Number of Splits Input (Conditional) */}
          {splitMethod === 'rows' && (
            <div>
              <label htmlFor="rows-input" className="block text-sm font-medium text-gray-300 mb-2">Number of Horizontal Splits (Rows)</label>
              <input
                type="number"
                id="rows-input"
                min="0" // Allow 0 to be typed
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value, 10) || 0)}
                className="custom-input"
                disabled={!imageFile || isLoading}
                aria-label="Number of Rows for Horizontal Split"
              />
              {rows === 0 && <p className="text-xs text-red-400 mt-1">Number of rows cannot be 0. Will be treated as 1.</p>}
            </div>
          )}

          {splitMethod === 'cols' && (
            <div>
              <label htmlFor="cols-input" className="block text-sm font-medium text-gray-300 mb-2">Number of Vertical Splits (Columns)</label>
              <input
                type="number"
                id="cols-input"
                min="0" // Allow 0 to be typed
                value={cols}
                onChange={(e) => setCols(parseInt(e.target.value, 10) || 0)}
                className="custom-input"
                disabled={!imageFile || isLoading}
                aria-label="Number of Columns for Vertical Split"
              />
              {cols === 0 && <p className="text-xs text-red-400 mt-1">Number of columns cannot be 0. Will be treated as 1.</p>}
            </div>
          )}

          {splitMethod === 'grid' && (
            <>
              <div>
                <label htmlFor="rows-input" className="block text-sm font-medium text-gray-300 mb-2">Number of Rows</label>
                <input
                  type="number"
                  id="rows-input"
                  min="0" // Allow 0 to be typed
                  value={rows}
                  onChange={(e) => setRows(parseInt(e.target.value, 10) || 0)}
                  className="custom-input"
                  disabled={!imageFile || isLoading}
                  aria-label="Number of Rows for Grid Split"
                />
                {rows === 0 && <p className="text-xs text-red-400 mt-1">Number of rows cannot be 0. Will be treated as 1.</p>}
              </div>
              <div>
                <label htmlFor="cols-input" className="block text-sm font-medium text-gray-300 mb-2">Number of Columns</label>
                <input
                  type="number"
                  id="cols-input"
                  min="0" // Allow 0 to be typed
                  value={cols}
                  onChange={(e) => setCols(parseInt(e.target.value, 10) || 0)}
                  className="custom-input"
                  disabled={!imageFile || isLoading}
                  aria-label="Number of Columns for Grid Split"
                />
                {cols === 0 && <p className="text-xs text-red-400 mt-1">Number of columns cannot be 0. Will be treated as 1.</p>}
              </div>
            </>
          )}
          
          <div className="flex flex-col gap-4 pt-4 border-t border-gray-700">
            <Button onClick={handleSplitImage} isLoading={isLoading} icon={<GridIcon />} disabled={isSplitButtonDisabled}>
              Split Image
            </Button>
            <Button onClick={handleDownloadAll} variant="secondary" icon={<ArrowDownTrayIcon />} disabled={isDownloadAllDisabled}>
              Download All ({splitImages.length})
            </Button>
            <Button onClick={handleDownloadSelected} variant="secondary" icon={<ArrowDownTrayIcon />} disabled={isDownloadSelectedDisabled}>
              Download Selected ({selectedImages.size})
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        <Button onClick={handleReset} variant="outline" icon={<ArrowUturnLeftIcon />} disabled={isResetDisabled}>
          Start Over
        </Button>
      </div>

      <div className="lg:col-span-8">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 sticky top-24">
          <h3 className="text-lg font-semibold text-white mb-4 px-2">Image Preview & Split Results</h3>
          {!imageFile ? (
            <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh]">
              <ImageUploader
                onFileSelect={handleImageUpload}
                title="Upload your image to split"
                description="Choose a file or drag & drop here"
                accept="image/*"
                multiple={false}
              />
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="bg-gray-900/50 p-2 rounded-lg flex flex-col items-center justify-center min-h-[20vh] relative mb-4">
                  <LoadingSpinner />
                  <p className="text-gray-400 mt-4">Splitting image...</p>
                </div>
              )}

              {splitImages.length === 0 && !isLoading && (
                <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh] relative">
                  <img src={imageUrl ?? ''} alt="Original Preview" className="max-w-full object-contain rounded-md" loading="lazy" />
                </div>
              )}

              {splitImages.length > 0 && !isLoading && (
                <>
                  <div className="flex justify-between items-center mb-4 px-2">
                    <span className="text-sm text-gray-400">Select images to download separately</span>
                    <Button
                      onClick={handleToggleSelectAll}
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      disabled={splitImages.length === 0}
                    >
                      {selectedImages.size === splitImages.length && splitImages.length > 0 ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  <div
                    className={`grid gap-4 p-2 bg-gray-900/50 rounded-lg 
                      ${currentEffectiveColsForPreview === 1 
                        ? 'grid-cols-1' 
                        : `grid-cols-${Math.min(currentEffectiveColsForPreview, 2)} sm:grid-cols-${Math.min(currentEffectiveColsForPreview, 3)} md:grid-cols-${Math.min(currentEffectiveColsForPreview, 4)} lg:grid-cols-${Math.min(currentEffectiveColsForPreview, 6)}`}`
                    }
                  >
                    {splitImages.map((img) => (
                      <div
                        key={img.id}
                        className={`relative group aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg border-2 transition-all duration-200 cursor-pointer
                                    ${selectedImages.has(img.id) ? 'border-teal-400 ring-2 ring-teal-400' : 'border-gray-700 hover:border-teal-500/70'}`}
                        onClick={() => handleToggleImageSelection(img.id)}
                      >
                        <img src={img.dataUrl} alt={img.filename} className="object-cover w-full h-full" loading="lazy" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-lg font-bold">
                            R{img.row + 1}C{img.col + 1}
                          </span>
                          <div className="absolute top-2 right-2">
                            {/* FIX: CheckIcon now correctly accepts className */}
                            {selectedImages.has(img.id) ? (
                              <CheckIcon className="w-5 h-5 text-teal-400 bg-black/70 rounded-full p-0.5" />
                            ) : (
                              // FIX: XMarkIcon now correctly accepts className
                              <XMarkIcon className="w-5 h-5 text-gray-400 bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  );
};

export default ImageSplitter;
