import React, { useState, useCallback, useRef } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/Button';
import { downloadImage, fileToDataURL } from '../utils/imageUtils';
import { ArrowDownTrayIcon, ArrowUturnLeftIcon, SparklesIcon, XMarkIcon } from '../components/icons';
import type { FileWithPreview } from '../types';


// --- Color Conversion Utilities (RGB <-> CIELAB) ---

function rgbToXyz(r: number, g: number, b: number) {
    r /= 255; g /= 255; b /= 255;
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100;
    const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100;
    const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100;
    return { x, y, z };
}

function xyzToLab(x: number, y: number, z: number) {
    x /= 95.047; y /= 100.000; z /= 108.883;
    x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
    y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
    z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);
    const l = (116 * y) - 16;
    const a = 500 * (x - y);
    const b_lab = 200 * (y - z);
    return { l, a, b: b_lab };
}

function rgbToLab(r: number, g: number, b: number) {
    const { x, y, z } = rgbToXyz(r, g, b);
    return xyzToLab(x, y, z);
}

function labToXyz(l: number, a: number, b: number) {
    let y = (l + 16) / 116;
    let x = a / 500 + y;
    let z = y - b / 200;
    x = Math.pow(x, 3) > 0.008856 ? Math.pow(x, 3) : (x - 16 / 116) / 7.787;
    y = Math.pow(y, 3) > 0.008856 ? Math.pow(y, 3) : (y - 16 / 116) / 7.787;
    z = Math.pow(z, 3) > 0.008856 ? Math.pow(z, 3) : (z - 16 / 116) / 7.787;
    x *= 95.047; y *= 100.000; z *= 108.883;
    return { x, y, z };
}

function xyzToRgb(x: number, y: number, z: number) {
    x /= 100; y /= 100; z /= 100;
    let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    let b = x * 0.0557 + y * -0.2040 + z * 1.0570;
    r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
    g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
    b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;
    return {
        r: Math.max(0, Math.min(255, r * 255)),
        g: Math.max(0, Math.min(255, g * 255)),
        b: Math.max(0, Math.min(255, b * 255)),
    };
}

function labToRgb(l: number, a: number, b: number) {
    const { x, y, z } = labToXyz(l, a, b);
    const { r, g, b: rgb_b } = xyzToRgb(x, y, z);
    return { r: Math.round(r), g: Math.round(g), b: Math.round(rgb_b) };
}

type LabColor = { l: number, a: number, b: number };

// Helper to extract LAB pixels from an image
async function getLabPixels(imgSrc: string, canvas: HTMLCanvasElement): Promise<LabColor[]> {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas context not available');

    const img = new Image();
    img.src = imgSrc;
    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
    });

    const MAX_DIM = 150; // Use a downscaled image for stats calculation for performance
    const scale = MAX_DIM / Math.max(img.width, img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const labPixels: LabColor[] = [];
    for (let i = 0; i < imageData.length; i += 4) {
        labPixels.push(rgbToLab(imageData[i], imageData[i + 1], imageData[i + 2]));
    }
    return labPixels;
}

// Helper to calculate mean and standard deviation for each LAB channel
const calculateStats = (pixels: LabColor[]) => {
    const sum = pixels.reduce((acc, p) => ({ l: acc.l + p.l, a: acc.a + p.a, b: acc.b + p.b }), { l: 0, a: 0, b: 0 });
    const mean = {
        l: sum.l / pixels.length,
        a: sum.a / pixels.length,
        b: sum.b / pixels.length,
    };
    const sumSqDiff = pixels.reduce((acc, p) => ({
        l: acc.l + (p.l - mean.l) ** 2,
        a: acc.a + (p.a - mean.a) ** 2,
        b: acc.b + (p.b - mean.b) ** 2,
    }), { l: 0, a: 0, b: 0 });
    const std = {
        l: Math.sqrt(sumSqDiff.l / pixels.length),
        a: Math.sqrt(sumSqDiff.a / pixels.length),
        b: Math.sqrt(sumSqDiff.b / pixels.length),
    };
    return { mean, std };
};

const MatchImageColor: React.FC = () => {
    const [sourceFile, setSourceFile] = useState<FileWithPreview | null>(null);
    const [targetFile, setTargetFile] = useState<FileWithPreview | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleSourceUpload = async (files: File[]) => {
        if (files.length > 0) {
            const file = files[0];
            try {
                const dataUrl = await fileToDataURL(file);
                setSourceFile(Object.assign(file, {
                    preview: dataUrl,
                    id: `${file.name}-${file.lastModified}-source`,
                }));
                setResultUrl(null);
                setError(null);
            } catch (err) {
                setError('Failed to load source image.');
            }
        }
    };

    const handleTargetUpload = async (files: File[]) => {
        if (files.length > 0) {
            const file = files[0];
            try {
                const dataUrl = await fileToDataURL(file);
                setTargetFile(Object.assign(file, {
                    preview: dataUrl,
                    id: `${file.name}-${file.lastModified}-target`,
                }));
                setResultUrl(null);
                setError(null);
            } catch (err) {
                setError('Failed to load target image.');
            }
        }
    };

    const handleMatchColors = useCallback(async () => {
        if (!sourceFile || !targetFile || !canvasRef.current) {
            setError('Please upload both a source and a target image.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResultUrl(null);

        try {
            const canvas = canvasRef.current;
            
            // 1. Calculate stats for source and target images
            const sourcePixelsLab = await getLabPixels(sourceFile.preview, canvas);
            const { mean: sourceMean, std: sourceStd } = calculateStats(sourcePixelsLab);
            
            const targetPixelsLab = await getLabPixels(targetFile.preview, canvas);
            const { mean: targetMean, std: targetStd } = calculateStats(targetPixelsLab);

            // 2. Recolor target image using statistical transfer
            const targetImg = new Image();
            targetImg.src = targetFile.preview;
            await new Promise((resolve, reject) => {
                targetImg.onload = resolve;
                targetImg.onerror = reject;
            });
            
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context not available');
            canvas.width = targetImg.width;
            canvas.height = targetImg.height;
            ctx.drawImage(targetImg, 0, 0);

            const targetImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const targetData = targetImageData.data;

            for (let i = 0; i < targetData.length; i += 4) {
                const targetLab = rgbToLab(targetData[i], targetData[i + 1], targetData[i + 2]);
                
                // Apply color transfer formula for each channel
                const newLab = {
                    l: ((targetLab.l - targetMean.l) * (sourceStd.l / (targetStd.l || 1))) + sourceMean.l,
                    a: ((targetLab.a - targetMean.a) * (sourceStd.a / (targetStd.a || 1))) + sourceMean.a,
                    b: ((targetLab.b - targetMean.b) * (sourceStd.b / (targetStd.b || 1))) + sourceMean.b,
                };

                const newRgbColor = labToRgb(newLab.l, newLab.a, newLab.b);

                targetData[i] = newRgbColor.r;
                targetData[i + 1] = newRgbColor.g;
                targetData[i + 2] = newRgbColor.b;
            }
            
            ctx.putImageData(targetImageData, 0, 0);
            setResultUrl(canvas.toDataURL('image/png'));
        } catch (e: any) {
            setError(e.message || 'An error occurred during color matching.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [sourceFile, targetFile]);
    
    const handleDownload = () => {
        if (!resultUrl || !targetFile) return;
        downloadImage(resultUrl, `color-matched_${targetFile.name}`);
    };
    
    const handleReset = () => {
        setSourceFile(null);
        setTargetFile(null);
        setResultUrl(null);
        setIsLoading(false);
        setError(null);
    };

    const handleRemoveSource = () => {
        setSourceFile(null);
        setResultUrl(null);
    };
    const handleRemoveTarget = () => {
        setTargetFile(null);
        setResultUrl(null);
    };
    
    const ImagePreviewBox: React.FC<{
        title: string;
        file: FileWithPreview | null;
        onUpload: (files: File[]) => void;
        onRemove: () => void;
    }> = ({ title, file, onUpload, onRemove }) => (
        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 space-y-3">
            <h4 className="text-md font-semibold text-white text-center">{title}</h4>
            <div className="bg-black/50 p-2 rounded-lg flex items-center justify-center min-h-[25vh]">
                {!file ? (
                    <ImageUploader onFileSelect={onUpload} multiple={false} accept="image/*" title="" description="Upload an image"/>
                ) : (
                    <div className="relative group w-full h-full flex items-center justify-center">
                        <img src={file.preview} alt={title} className="max-w-full max-h-[25vh] object-contain rounded-md" loading="lazy"/>
                        <button onClick={onRemove} className="absolute top-2 right-2 p-1 bg-red-600/70 text-white rounded-full hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100">
                           <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
    
    const LoadingSpinner = () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
          <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-300">Applying colors...</p>
      </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-zinc-900 rounded-lg p-6 space-y-6 border border-zinc-800">
                    <h3 className="text-lg font-semibold text-white">Color Matching Settings</h3>
                    <p className="text-sm text-gray-400">This tool transfers the color scheme from a source image to a target image using a statistical color transfer method to match the overall mood and lighting.</p>
                    <div className="flex flex-col gap-4 pt-4 border-t border-zinc-800">
                        <Button
                            onClick={handleMatchColors}
                            isLoading={isLoading}
                            icon={<SparklesIcon />}
                            disabled={!sourceFile || !targetFile || isLoading}
                        >
                            Match Colors
                        </Button>
                        <Button onClick={handleDownload} variant="secondary" disabled={!resultUrl}>
                            Download Result
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
                        <p className="font-semibold">Error:</p>
                        <p>{error}</p>
                    </div>
                )}
                
                <Button onClick={handleReset} variant="outline" icon={<ArrowUturnLeftIcon />} disabled={!sourceFile && !targetFile}>
                    Start Over
                </Button>
            </div>
            <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImagePreviewBox title="Source Image (Colors From)" file={sourceFile} onUpload={handleSourceUpload} onRemove={handleRemoveSource} />
                    <ImagePreviewBox title="Target Image (Apply To)" file={targetFile} onUpload={handleTargetUpload} onRemove={handleRemoveTarget} />
                </div>
                
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 space-y-3">
                    <h3 className="text-lg font-semibold text-white text-center">Result</h3>
                    <div className="bg-black/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh] relative checkerboard-bg">
                        {isLoading && <LoadingSpinner />}
                        {!isLoading && !resultUrl && <p className="text-gray-500">Your result will appear here.</p>}
                        {!isLoading && resultUrl && (
                            <img src={resultUrl} alt="Color matched result" className="max-w-full max-h-[60vh] object-contain rounded-md" loading="lazy" />
                        )}
                    </div>
                </div>

                <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
        </div>
    );
};

export default MatchImageColor;
