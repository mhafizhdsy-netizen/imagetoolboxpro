

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { downloadImage } from '../utils/imageUtils';
import { ArrowDownTrayIcon, ArrowUturnLeftIcon, PdfIcon, CheckIcon, XMarkIcon } from '../components/icons';

// PDF.js worker setup
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import JSZip from 'jszip';

// Fix: Directly set the workerSrc to the CDN URL from the import map.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@^4.4.168/build/pdf.worker.min.mjs';

interface GeneratedImage {
  pageNum: number;
  dataUrl: string;
  id: string; // Unique ID for selection
}

const PdfToImage: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null); // State to hold the PDF document object
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfFirstPagePreviewUrl, setPdfFirstPagePreviewUrl] = useState<string | null>(null); // New state for first page preview
  const [currentPageRange, setCurrentPageRange] = useState('all'); // e.g., "all", "1-5", "3,7,9"
  const [dpi, setDpi] = useState(150);
  const [imageFormat, setImageFormat] = useState<'jpeg' | 'png' | 'webp'>('png');
  const [imageQuality, setImageQuality] = useState(0.92); // For JPEG/WEBP
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false); // For conversion process
  const [pdfLoading, setPdfLoading] = useState(false); // For initial PDF file loading
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null); // Hidden canvas for batch conversion
  const abortControllerRef = useRef<AbortController | null>(null); // Ref for AbortController

  // Helper function to safely destroy PDF document and revoke URLs
  const destroyCurrentPdfResources = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Abort any ongoing conversion
      abortControllerRef.current = null;
    }
    if (pdfDocument) {
      pdfDocument.destroy();
      setPdfDocument(null); // Explicitly clear state after destroying
    }
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null); // Explicitly clear state
    }
    if (pdfFirstPagePreviewUrl && pdfFirstPagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pdfFirstPagePreviewUrl);
      setPdfFirstPagePreviewUrl(null); // Explicitly clear state
    }
    // Note: generatedImages URLs are revoked in a separate useEffect below
  }, [pdfDocument, pdfUrl, pdfFirstPagePreviewUrl]); // Depend on relevant states

  // Effect for cleaning up generated image URLs (only generatedImages)
  useEffect(() => {
    const imagesToRevoke = [...generatedImages]; // Capture current images
    return () => {
      imagesToRevoke.forEach(img => URL.revokeObjectURL(img.dataUrl));
    };
  }, [generatedImages]);

  // Effect for revoking PDF URLs when they change or component unmounts (excluding pdfDocument destruction)
  // pdfDocument destruction is now handled solely by destroyCurrentPdfResources
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      if (pdfFirstPagePreviewUrl && pdfFirstPagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfFirstPagePreviewUrl);
      }
    };
  }, [pdfUrl, pdfFirstPagePreviewUrl]);


  const parsePageRange = useCallback((rangeInput: string, totalPages: number): number[] => {
    const pages: Set<number> = new Set();
    const input = rangeInput.toLowerCase().trim();

    if (input === 'all' || input === '') {
      for (let i = 1; i <= totalPages; i++) {
        pages.add(i);
      }
    } else {
      const parts = input.split(',').map(s => s.trim()).filter(Boolean);
      for (const part of parts) {
        if (part.includes('-')) {
          const [startStr, endStr] = part.split('-').map(s => s.trim());
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= totalPages && start <= end) {
            for (let i = start; i <= end; i++) {
              pages.add(i);
            }
          } else {
            throw new Error(`Invalid range: "${part}". Please use valid numbers within 1-${totalPages}.`);
          }
        } else {
          const pageNum = parseInt(part, 10);
          if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            pages.add(pageNum);
          } else {
            throw new Error(`Invalid page number: "${part}". Please use valid numbers within 1-${totalPages}.`);
          }
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  }, []);

  const handlePdfUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    // Explicitly clean up any previous PDF document and its URLs
    // This handles aborting ongoing conversion and destroying pdfDocument/revoking its URL.
    destroyCurrentPdfResources();

    // Reset all other relevant states for a new upload
    setPdfFile(file);
    const url = URL.createObjectURL(file); // Generate new URL
    setPdfUrl(url);
    setNumPages(null);
    setGeneratedImages([]);
    setSelectedImages(new Set());
    setError(null);
    setPdfLoading(true);

    try {
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      setPdfDocument(pdf); // Store the PDF document object
      setNumPages(pdf.numPages);

      // Render first page for preview
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 2.0 }); // Render at 2.0 scale for decent preview
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        await firstPage.render({ canvasContext: tempCtx, viewport: viewport }).promise;
        setPdfFirstPagePreviewUrl(tempCanvas.toDataURL('image/png')); // Use PNG for transparent backgrounds
      }

      setPdfLoading(false);
    } catch (e: any) {
      console.error('Error loading PDF:', e);
      setError(e.message || 'Failed to load PDF. It might be corrupted or password-protected.');
      setPdfLoading(false);
      // Ensure all states are reset on error as well by calling destroyCurrentPdfResources again
      destroyCurrentPdfResources(); // This will clear pdfFile as well via cascade
      setPdfFile(null); // Explicitly set pdfFile to null if loading failed
    }
  };

  const handleConvertPdf = useCallback(async () => {
    if (!pdfFile || !pdfDocument || numPages === null) {
      setError('PDF document is not fully loaded or available.'); // More explicit error message
      setIsLoading(false);
      return;
    }

    // Abort any previous ongoing conversion
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const newAbortController = new AbortController();
    abortControllerRef.current = newAbortController;
    const { signal } = newAbortController;

    setIsLoading(true);
    setGeneratedImages([]);
    setSelectedImages(new Set());
    setError(null);

    try {
      const pagesToRender = parsePageRange(currentPageRange, numPages);
      if (pagesToRender.length === 0) {
        setError('No pages selected for conversion.');
        setIsLoading(false);
        return;
      }

      const pdf = pdfDocument; // Use the already loaded pdfDocument

      const newGeneratedImages: GeneratedImage[] = [];
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas element not found.');
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D rendering context.');
      }

      for (const pageNum of pagesToRender) {
        if (signal.aborted) {
          throw new Error('Conversion aborted.');
        }

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: dpi / 72 }); // Convert DPI to scale

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };
        await page.render(renderContext).promise;

        let dataUrl: string;
        let mimeType: string;

        switch (imageFormat) {
          case 'jpeg':
            mimeType = 'image/jpeg';
            dataUrl = canvas.toDataURL(mimeType, imageQuality);
            break;
          case 'png':
            mimeType = 'image/png';
            dataUrl = canvas.toDataURL(mimeType); // PNG doesn't use quality param
            break;
          case 'webp':
            mimeType = 'image/webp';
            dataUrl = canvas.toDataURL(mimeType, imageQuality);
            break;
          default:
            mimeType = 'image/png';
            dataUrl = canvas.toDataURL(mimeType);
        }

        newGeneratedImages.push({
          pageNum,
          dataUrl,
          id: `page-${pageNum}-${Date.now()}`, // Unique ID for key/selection
        });
      }

      setGeneratedImages(newGeneratedImages);
    } catch (e: any) {
      if (signal.aborted && e.message === 'Conversion aborted.') {
        console.warn('PDF conversion was intentionally aborted.');
        setError('Conversion canceled due to a new action.');
      } else {
        console.error('Error converting PDF:', e);
        setError(e.message || 'Failed to convert PDF. Please check page range and file integrity.');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null; // Clear controller when finished or aborted
    }
  }, [pdfFile, pdfDocument, numPages, currentPageRange, dpi, imageFormat, imageQuality, parsePageRange]);

  const handleDownloadAll = useCallback(async () => {
    if (generatedImages.length === 0) {
      setError('No images generated to download.');
      return;
    }

    setIsLoading(true);
    try {
      const zip = new JSZip();
      for (const img of generatedImages) {
        const base64Data = img.dataUrl.split(',')[1];
        const filename = `${pdfFile?.name.replace('.pdf', '') || 'pdf'}_page_${img.pageNum}.${imageFormat}`;
        zip.file(filename, base64Data, { base64: true });
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const zipBlobUrl = URL.createObjectURL(content);
      downloadImage(zipBlobUrl, `${pdfFile?.name.replace('.pdf', '') || 'pdf'}_images.zip`);
      URL.revokeObjectURL(zipBlobUrl);
    } catch (e: any) {
      setError(e.message || 'Failed to create ZIP file for download.');
    } finally {
      setIsLoading(false);
    }
  }, [generatedImages, pdfFile, imageFormat]);

  const handleDownloadSelected = useCallback(async () => {
    if (selectedImages.size === 0) {
      setError('Please select images to download.');
      return;
    }

    setIsLoading(true);
    try {
      const zip = new JSZip();
      for (const imgId of selectedImages) {
        const img = generatedImages.find(g => g.id === imgId);
        if (img) {
          const base64Data = img.dataUrl.split(',')[1];
          const filename = `${pdfFile?.name.replace('.pdf', '') || 'pdf'}_page_${img.pageNum}.${imageFormat}`;
          zip.file(filename, base64Data, { base64: true });
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const zipBlobUrl = URL.createObjectURL(content);
      downloadImage(zipBlobUrl, `${pdfFile?.name.replace('.pdf', '') || 'pdf'}_selected_images.zip`);
      URL.revokeObjectURL(zipBlobUrl);
    } catch (e: any) {
      setError(e.message || 'Failed to create ZIP file for selected images.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedImages, generatedImages, pdfFile, imageFormat]);

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
    if (selectedImages.size === generatedImages.length && generatedImages.length > 0) {
      setSelectedImages(new Set()); // Deselect all
    } else {
      setSelectedImages(new Set(generatedImages.map(img => img.id))); // Select all
    }
  }, [selectedImages, generatedImages]);

  const handleReset = () => {
    // Abort any ongoing conversion and destroy current PDF resources
    destroyCurrentPdfResources();

    // Clear all other states
    setPdfFile(null);
    setNumPages(null);
    setCurrentPageRange('all');
    setDpi(150);
    setImageFormat('png');
    setImageQuality(0.92);
    setGeneratedImages([]);
    setSelectedImages(new Set());
    setIsLoading(false);
    setPdfLoading(false);
    setError(null);
  };

  const isDownloadEnabled = generatedImages.length > 0 && !isLoading;
  const isSelectedDownloadEnabled = selectedImages.size > 0 && !isLoading;
  const isConvertEnabled = pdfFile !== null && pdfDocument !== null && numPages !== null && !isLoading && !pdfLoading;
  const showQualitySlider = imageFormat === 'jpeg' || imageFormat === 'webp';
  // Disable ImageUploader when any loading/processing is active
  const isUploaderDisabled = pdfLoading || isLoading;

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
          <h3 className="text-lg font-semibold text-white">Conversion Settings</h3>

          {/* Page Range Input */}
          <div>
            <label htmlFor="page-range" className="block text-sm font-medium text-gray-300 mb-2">Page Range</label>
            <input
              type="text"
              id="page-range"
              value={currentPageRange}
              onChange={(e) => setCurrentPageRange(e.target.value)}
              className="custom-input"
              placeholder="e.g., all, 1-5, 3,7,9"
              disabled={!pdfFile || pdfLoading || isLoading}
            />
            {numPages !== null && <p className="text-xs text-gray-500 mt-1">Total {numPages} pages. (Use numbers between 1 and {numPages})</p>}
          </div>

          {/* DPI Slider */}
          <div>
            <label htmlFor="dpi-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
              <span>Resolution (DPI)</span>
              <span className="font-mono text-teal-300 text-lg">{dpi}</span>
            </label>
            <input
              type="range"
              id="dpi-slider"
              min="72"
              max="600"
              step="10"
              value={dpi}
              onChange={(e) => setDpi(parseInt(e.target.value, 10))}
              className="w-full range-slider"
              aria-label="Image Resolution (DPI)"
              disabled={!pdfFile || pdfLoading || isLoading}
            />
          </div>

          {/* Image Format Select */}
          <div>
            <label htmlFor="image-format" className="block text-sm font-medium text-gray-300 mb-2">Image Format</label>
            <select
              id="image-format"
              className="custom-input"
              value={imageFormat}
              onChange={(e) => setImageFormat(e.target.value as 'jpeg' | 'png' | 'webp')}
              disabled={!pdfFile || pdfLoading || isLoading}
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPG</option>
              <option value="webp">WEBP</option>
            </select>
          </div>

          {/* Image Quality Slider (Conditional) */}
          {showQualitySlider && (
            <div>
              <label htmlFor="image-quality-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                <span>Image Quality</span>
                <span className="font-mono text-teal-300 text-lg">{Math.round(imageQuality * 100)}%</span>
              </label>
              <input
                type="range"
                id="image-quality-slider"
                min="0.1"
                max="1"
                step="0.01"
                value={imageQuality}
                onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                className="w-full range-slider"
                aria-label="Image Quality"
                disabled={!pdfFile || pdfLoading || isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">Lower quality results in a smaller file size.</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Button onClick={handleConvertPdf} isLoading={isLoading} icon={<PdfIcon />} disabled={!isConvertEnabled}>
            {isLoading ? 'Converting...' : 'Convert PDF'}
          </Button>
          <Button onClick={handleDownloadAll} variant="secondary" icon={<ArrowDownTrayIcon />} disabled={!isDownloadEnabled || isLoading}>
            Download All ({generatedImages.length})
          </Button>
          <Button onClick={handleDownloadSelected} variant="secondary" icon={<ArrowDownTrayIcon />} disabled={!isSelectedDownloadEnabled || isLoading}>
            Download Selected ({selectedImages.size})
          </Button>
        </div>
        <Button onClick={handleReset} variant="outline" icon={<ArrowUturnLeftIcon />} disabled={!pdfFile && generatedImages.length === 0}>
          Start Over
        </Button>
      </div>

      <div className="lg:col-span-8">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 sticky top-24">
          <h3 className="text-lg font-semibold text-white mb-4 px-2">PDF File & Image Preview</h3>
          {!pdfFile ? (
            <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh]">
              {/* FIX: ImageUploader now correctly accepts disabled prop */}
              <ImageUploader
                onFileSelect={handlePdfUpload}
                title="Upload your PDF file"
                description="Only PDF files are supported"
                accept="application/pdf"
                multiple={false}
                disabled={isUploaderDisabled}
              />
            </div>
          ) : (
            <>
              {pdfLoading && (
                <div className="bg-gray-900/50 p-2 rounded-lg flex flex-col items-center justify-center min-h-[10rem] relative mb-4">
                  <LoadingSpinner />
                  <p className="text-gray-400 mt-2">Loading PDF...</p>
                </div>
              )}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 mb-4">
                  <p className="font-semibold">Error:</p>
                  <p>{error}</p>
                </div>
              )}

              {/* Display PDF first page preview or conversion progress/results */}
              {generatedImages.length === 0 && !isLoading && !pdfLoading && pdfFile && (
                <div className="bg-gray-900/50 p-2 rounded-lg flex flex-col items-center justify-center min-h-[40vh] relative mb-4">
                  {pdfFirstPagePreviewUrl ? (
                    <>
                      <img src={pdfFirstPagePreviewUrl} alt="PDF First Page Preview" className="max-w-full object-contain rounded-md shadow-lg border border-gray-700" />
                      {numPages && <p className="text-gray-400 mt-2">PDF loaded. Total: {numPages} pages.</p>}
                    </>
                  ) : (
                    <div className="text-gray-400 text-sm p-4 text-center">
                      PDF loaded. Ready to convert!
                      {numPages && <p>Total: {numPages} pages.</p>}
                    </div>
                  )}
                </div>
              )}

              {generatedImages.length > 0 && (
                <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-sm text-gray-400">Select images to download individually</span>
                  <Button
                    onClick={handleToggleSelectAll}
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    disabled={generatedImages.length === 0}
                  >
                    {selectedImages.size === generatedImages.length && generatedImages.length > 0 ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              )}
              {isLoading && (
                <div className="bg-gray-900/50 p-2 rounded-lg flex flex-col items-center justify-center min-h-[20vh] relative">
                  <LoadingSpinner />
                  <p className="text-gray-400 mt-4">Converting PDF pages...</p>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2 bg-gray-900/50 rounded-lg">
                {generatedImages.map((img) => (
                  <div
                    key={img.id}
                    className={`relative group aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg border-2 transition-all duration-200 cursor-pointer 
                                ${selectedImages.has(img.id) ? 'border-teal-400 ring-2 ring-teal-400' : 'border-gray-700 hover:border-teal-500/70'}`}
                    onClick={() => handleToggleImageSelection(img.id)}
                  >
                    <img src={img.dataUrl} alt={`Page ${img.pageNum}`} className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-lg font-bold">Page {img.pageNum}</span>
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
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  );
};

export default PdfToImage;