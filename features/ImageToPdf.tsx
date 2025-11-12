

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { downloadImage, loadImageAsDataURLAndDimensions } from '../utils/imageUtils'; // Changed to loadImageAsDataURLAndDimensions
import { ArrowDownTrayIcon, ArrowUturnLeftIcon, PdfIcon, XMarkIcon, PlusIcon } from '../components/icons';
import { jsPDF } from 'jspdf';
import type { FileWithPreview } from '../types'; // Import FileWithPreview

// Helper to load image as Data URL
const loadImageAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Removed ImageFileWithPreview interface as it's now in types.ts

const ImageToPdf: React.FC = () => {
  const [imageFiles, setImageFiles] = useState<FileWithPreview[]>([]);
  const [pageSize, setPageSize] = useState('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState(10); // in mm
  const [upscaleSmallerImages, setUpscaleSmallerImages] = useState(false); // New state for upscaling
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For drag and drop reordering
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Revoke old blob URLs when component unmounts or pdfBlobUrl changes
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      imageFiles.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [pdfBlobUrl, imageFiles]);

  const handleImagesUpload = async (files: File[]) => {
    setError(null);
    setPdfBlobUrl(null);
    setIsProcessing(true); // Indicate processing for new uploads
    const newFilesWithPreviews: FileWithPreview[] = [];
    for (const file of files) {
      try {
        const { dataUrl, width, height } = await loadImageAsDataURLAndDimensions(file); // Use utility
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
    setIsProcessing(false); // End processing for new uploads
  };

  const handleRemoveImage = (idToRemove: string) => {
    setImageFiles(prev => prev.filter(file => file.id !== idToRemove));
    setPdfBlobUrl(null);
    setError(null);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragOverItem.current = index;
    // Add visual feedback to the item being dragged over
    if (e.currentTarget) {
        e.currentTarget.classList.add('border-teal-400');
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget) {
        e.currentTarget.classList.remove('border-teal-400');
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Clean up any lingering drag-over styles
    if (e.currentTarget) {
        e.currentTarget.classList.remove('border-teal-400');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const draggedIndex = dragItem.current;
    const droppedIndex = dragOverItem.current;

    if (draggedIndex === null || droppedIndex === null || draggedIndex === droppedIndex) {
      // Clean up drag-over styles for the dropped item
      if (e.currentTarget) {
          e.currentTarget.classList.remove('border-teal-400');
      }
      return;
    }

    const newImageFiles = [...imageFiles];
    const [reorderedItem] = newImageFiles.splice(draggedIndex, 1);
    newImageFiles.splice(droppedIndex, 0, reorderedItem);

    setImageFiles(newImageFiles);
    dragItem.current = null;
    dragOverItem.current = null;
    setPdfBlobUrl(null); // Clear generated PDF on reorder
    // Clean up drag-over styles for the dropped item
    if (e.currentTarget) {
        e.currentTarget.classList.remove('border-teal-400');
    }
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


  const generatePdf = useCallback(async () => {
    if (imageFiles.length === 0) {
      setError('Please upload at least one image.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setPdfBlobUrl(null);

    try {
      const doc = new jsPDF({
        orientation: orientation === 'portrait' ? 'p' : 'l',
        unit: 'mm',
        format: pageSize,
      });

      let imagesToProcess = [...imageFiles]; // Create a mutable copy

      if (upscaleSmallerImages && imageFiles.length > 1) {
        let largestWidth = 0;
        let largestHeight = 0;

        // Find the maximum natural width and height among all images
        for (const file of imageFiles) {
          if (file.width && file.width > largestWidth) largestWidth = file.width;
          if (file.height && file.height > largestHeight) largestHeight = file.height;
        }

        const upscaledImagesPromises = imagesToProcess.map(file => {
          return new Promise<FileWithPreview>((resolve) => {
            if (file.width && file.height && (file.width < largestWidth || file.height < largestHeight)) {
              // Only upscale if the image is actually smaller in at least one dimension than the largest found
              const img = new Image();
              img.src = file.preview;
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(file); return; }

                const aspectRatio = img.naturalWidth / img.naturalHeight;
                let newWidth = largestWidth;
                let newHeight = largestHeight;

                // Calculate dimensions to fit within largestWidth x largestHeight while maintaining aspect ratio
                if (aspectRatio > (largestWidth / largestHeight)) {
                  // Image is relatively wider, fit by target width
                  newHeight = largestWidth / aspectRatio;
                } else {
                  // Image is relatively taller, fit by target height
                  newWidth = largestHeight * aspectRatio;
                }

                canvas.width = newWidth;
                canvas.height = newHeight;
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                const upscaledPreview = canvas.toDataURL(file.type);
                resolve({ ...file, preview: upscaledPreview, width: newWidth, height: newHeight });
              };
              img.onerror = () => {
                console.warn(`Failed to upscale image: ${file.name}`);
                resolve(file); // Resolve with original file on error
              };
            } else {
              resolve(file); // No upscaling needed or applied
            }
          });
        });
        imagesToProcess = await Promise.all(upscaledImagesPromises);
      }


      const addImageToPdf = (imgData: string) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = imgData;
          img.onload = () => {
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            const imgWidth = img.width;
            const imgHeight = img.height;

            const marginX = margin;
            const marginY = margin;

            const effectivePageWidth = pageWidth - 2 * marginX;
            const effectivePageHeight = pageHeight - 2 * marginY;

            const imgAspectRatio = imgWidth / imgHeight;
            const pageAspectRatio = effectivePageWidth / effectivePageHeight;

            let finalImgWidth = effectivePageWidth;
            let finalImgHeight = effectivePageHeight;

            if (imgAspectRatio > pageAspectRatio) {
              // Image is wider than page aspect ratio, fit by width
              finalImgHeight = effectivePageWidth / imgAspectRatio;
            } else {
              // Image is taller than page aspect ratio, fit by height
              finalImgWidth = effectivePageHeight * imgAspectRatio;
            }
            
            // If image is larger than effective page, scale it down.
            if (finalImgWidth > effectivePageWidth) {
                finalImgWidth = effectivePageWidth;
                finalImgHeight = effectivePageWidth / imgAspectRatio;
            }
            if (finalImgHeight > effectivePageHeight) {
                finalImgHeight = effectivePageHeight;
                finalImgWidth = effectivePageHeight * imgAspectRatio;
            }

            const x = marginX + (effectivePageWidth - finalImgWidth) / 2;
            const y = marginY + (effectivePageHeight - finalImgHeight) / 2;
            
            doc.addImage(imgData, 'JPEG', x, y, finalImgWidth, finalImgHeight);
            resolve(null); // Resolve with null as no value is needed
          };
          img.onerror = () => {
            console.error('Failed to load image for PDF:', imgData);
            resolve(null); // Resolve to allow other images to process
          };
        });
      };

      for (let i = 0; i < imagesToProcess.length; i++) {
        const file = imagesToProcess[i];
        if (i > 0) {
          doc.addPage();
        }
        await addImageToPdf(file.preview);
      }

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfBlobUrl(url);
    } catch (e: any) {
      console.error('Error generating PDF:', e);
      setError(e.message || 'Failed to generate PDF. Ensure all images are valid.');
    } finally {
      setIsProcessing(false);
    }
  }, [imageFiles, pageSize, orientation, margin, upscaleSmallerImages]);

  const handleDownloadPdf = () => {
    if (pdfBlobUrl) {
      downloadImage(pdfBlobUrl, 'images_to_pdf.pdf');
    }
  };

  const handleReset = () => {
    setImageFiles([]);
    setPageSize('A4');
    setOrientation('portrait');
    setMargin(10);
    setUpscaleSmallerImages(false); // Reset upscale option
    setPdfBlobUrl(null);
    setIsProcessing(false);
    setError(null);
  };

  const PageSizeOptions = [
    { value: 'A4', label: 'A4 (210 x 297mm)' },
    { value: 'Letter', label: 'Letter (216 x 279mm)' },
    { value: 'A3', label: 'A3 (297 x 420mm)' },
    { value: 'Legal', label: 'Legal (216 x 356mm)' },
    { value: 'Tabloid', label: 'Tabloid (279 x 432mm)' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-gray-800 rounded-lg p-6 space-y-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">PDF Settings</h3>

          {/* Page Size */}
          <div>
            <label htmlFor="page-size" className="block text-sm font-medium text-gray-300 mb-2">Page Size</label>
            <select
              id="page-size"
              className="custom-input"
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value)}
              disabled={imageFiles.length === 0}
            >
              {PageSizeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Orientation */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Orientation</label>
            <div className="flex rounded-lg overflow-hidden bg-gray-700">
              <button
                className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
                  orientation === 'portrait' ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-600'
                } disabled:opacity-50`}
                onClick={() => setOrientation('portrait')}
                disabled={imageFiles.length === 0}
              >
                Portrait
              </button>
              <button
                className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
                  orientation === 'landscape' ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-600'
                } disabled:opacity-50`}
                onClick={() => setOrientation('landscape')}
                disabled={imageFiles.length === 0}
              >
                Landscape
              </button>
            </div>
          </div>

          {/* Margins */}
          <div>
            <label htmlFor="margin-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
              <span>Page Margins</span>
              <span className="font-mono text-teal-300 text-lg">{margin}mm</span>
            </label>
            <input
              type="range"
              id="margin-slider"
              min="0"
              max="50"
              step="1"
              value={margin}
              onChange={(e) => setMargin(parseInt(e.target.value, 10))}
              className="w-full range-slider"
              aria-label="Page Margins"
              disabled={imageFiles.length === 0}
            />
          </div>

          {/* Upscale Smaller Images Toggle */}
          <div className="flex items-center pt-4 border-t border-gray-700">
              <input
                  id="upscale-images"
                  type="checkbox"
                  checked={upscaleSmallerImages}
                  onChange={(e) => setUpscaleSmallerImages(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-teal-500 focus:ring-teal-500"
                  disabled={imageFiles.length < 2} // Disable if less than 2 images
              />
              <label htmlFor="upscale-images" className="ml-3 block text-sm font-medium text-gray-300">
                  Upscale Smaller Images
              </label>
          </div>
          {imageFiles.length > 0 && imageFiles.length < 2 && (
              <p className="text-xs text-gray-500 mt-1">Upload at least 2 images to enable the upscale option.</p>
          )}
          {upscaleSmallerImages && (
              <p className="text-xs text-gray-500 mt-1">Smaller images will be upscaled to match the dimensions of the largest image (maintaining aspect ratio).</p>
          )}

        </div>

        <div className="flex flex-col gap-4">
          <Button onClick={generatePdf} isLoading={isProcessing} icon={<PdfIcon />} disabled={imageFiles.length === 0}>
            Generate PDF
          </Button>
          <Button onClick={handleDownloadPdf} variant="secondary" disabled={!pdfBlobUrl} icon={<ArrowDownTrayIcon />}>
            Download PDF
          </Button>
        </div>
        <Button onClick={handleReset} variant="outline" icon={<ArrowUturnLeftIcon />} disabled={imageFiles.length === 0}>
          Start Over
        </Button>
      </div>

      <div className="lg:col-span-8">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 sticky top-24">
          <h3 className="text-lg font-semibold text-white mb-4 px-2">Your Images</h3>
          {!imageFiles.length ? (
            <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh]">
              <ImageUploader
                onFileSelect={handleImagesUpload} 
                title="Upload your images to create a PDF"
                description="Select multiple files or drag & drop here"
                accept="image/*"
                multiple={true}
              />
            </div>
          ) : (
            <>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2 min-h-[40vh] bg-gray-900/50 rounded-lg"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {imageFiles.map((file, index) => (
                  <div
                    key={file.id} // Use unique ID for key
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                    className={`relative group aspect-square w-full overflow-hidden rounded-lg border-2 border-transparent transition-all duration-200 
                                  ${dragItem.current === index ? 'opacity-50 border-teal-500' : ''}
                                  ${dragOverItem.current === index && dragItem.current !== index ? 'border-teal-400' : ''}`}
                  >
                    <img
                      src={file.preview}
                      alt={`Page ${index + 1}`}
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
                      {/* FIX: XMarkIcon now correctly accepts className as its only prop, resolving the 'faClass missing' error */}
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
              <p className="text-gray-500 text-sm mt-3 px-2">Drag and drop images to reorder the pages.</p>
            </>
          )}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}
          {pdfBlobUrl && !isProcessing && (
            <div className="mt-4 p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg text-center">
              <p className="font-medium text-sm text-teal-300">PDF generated successfully! Download now.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageToPdf;