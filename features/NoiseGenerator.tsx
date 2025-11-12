

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '../components/Button';
import { ArrowDownTrayIcon, ArrowUturnLeftIcon, NoiseIcon, SparklesIcon, XMarkIcon } from '../components/icons';
import { downloadImage } from '../utils/imageUtils';
import { ColorPicker } from '../components/ColorPicker'; // Import the new ColorPicker

// Import SimplexNoise library
import { createNoise2D } from 'simplex-noise'; // Note: createNoise3D is not currently used in 2D generation but is available.

// --- Noise Generation Logic using different algorithms ---

// Helper to create a seeded randomizer for deterministic results
function createSeededRandom(seed: number) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// 1. Simplex Noise (from library)
const getSimplexNoiseFn = (seed: number) => {
  const randomizer = createSeededRandom(seed);
  return createNoise2D(randomizer);
};

// 2. White Noise (custom implementation)
const getWhiteNoiseFn = (seed: number, width: number, height: number) => {
  const rand = createSeededRandom(seed);
  // Pre-generate white noise values to make it "deterministic" per seed
  // Map to [-1, 1] as per Simplex Noise output range
  const noiseMap = new Array(width * height).fill(0).map(() => rand() * 2 - 1);

  return (x: number, y: number) => {
    // x and y here are normalized (0-1) coordinates
    const pixelX = Math.floor(x * width);
    const pixelY = Math.floor(y * height);
    const index = pixelY * width + pixelX;
    // Ensure index is within bounds (can happen with floating point inaccuracies for x,y near 1)
    if (index < 0 || index >= noiseMap.length) return 0; 
    return noiseMap[index];
  };
};

// 3. Basic Value Noise (custom implementation with cosine interpolation)
const getBasicValueNoiseFn = (seed: number, gridSize: number = 16) => { // Increased default grid size for smoother output
  const rand = createSeededRandom(seed);
  const values: number[][] = [];
  for (let i = 0; i <= gridSize; i++) {
    values[i] = [];
    for (let j = 0; j <= gridSize; j++) {
      values[i][j] = rand(); // Random value for each grid point
    }
  }

  // Cosine interpolation helper
  const interpolate = (a: number, b: number, t: number) => {
    const ft = t * Math.PI;
    const f = (1 - Math.cos(ft)) * 0.5;
    return a * (1 - f) + b * f;
  };

  return (x: number, y: number) => {
    const gx = x * gridSize; // Grid X coordinate
    const gy = y * gridSize; // Grid Y coordinate

    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const x1 = x0 + 1;
    const y1 = y0 + 1;

    const fx = gx - x0; // Fractional part of X
    const fy = gy - y0; // Fractional part of Y

    // Get values from the 4 surrounding grid points, wrapping around
    const v00 = values[x0 % (gridSize + 1)][y0 % (gridSize + 1)];
    const v01 = values[x0 % (gridSize + 1)][y1 % (gridSize + 1)];
    const v10 = values[x1 % (gridSize + 1)][y0 % (gridSize + 1)];
    const v11 = values[x1 % (gridSize + 1)][y1 % (gridSize + 1)];

    // Interpolate along X axis
    const i1 = interpolate(v00, v10, fx);
    const i2 = interpolate(v01, v11, fx);

    // Interpolate along Y axis and map to [-1, 1]
    return interpolate(i1, i2, fy) * 2 - 1; 
  };
};

// Main dispatcher to get the active noise function based on type
type NoiseFunction = (x: number, y: number) => number;

const getActiveNoiseFunction = (noiseType: string, seed: number, width: number, height: number): NoiseFunction => {
  switch (noiseType) {
    case 'Simplex':
      return getSimplexNoiseFn(seed);
    case 'WhiteNoise':
      return getWhiteNoiseFn(seed, width, height);
    case 'Value':
      return getBasicValueNoiseFn(seed);
    // For these, we'll still use SimplexNoise as the underlying generator
    // but the labels in the UI differentiate them as variants.
    case 'Perlin':
    case 'Worley':
    case 'Cellular':
    default:
      return getSimplexNoiseFn(seed); // Default to Simplex for other conceptual types
  }
};


const applyFractalNoise = (
  noiseFn: (x: number, y: number) => number,
  x: number, y: number,
  frequency: number, amplitude: number,
  octaves: number, persistence: number, lacunarity: number,
  fractalType: string
): number => {
  let total = 0;
  let currentAmplitude = amplitude;
  let currentFrequency = frequency;

  for (let i = 0; i < octaves; i++) {
    let noiseValue = noiseFn(x * currentFrequency, y * currentFrequency);

    // Apply fractal types (simplified conceptual implementation)
    switch (fractalType) {
      case 'FBM': // Fractional Brownian Motion - standard sum of octaves
        // No modification, just add noise
        break;
      case 'Billow': // Makes valleys into peaks, resulting in a ridged, wavy appearance.
        noiseValue = Math.abs(noiseValue) * 2 - 1; // Maps [-1,1] to [-1,1], making negative values positive.
        break;
      case 'Ridged': // Inverts and makes ridges, often used for mountain-like terrain.
        noiseValue = 1 - Math.abs(noiseValue); // Maps [-1,1] to [0,1], inverting negative parts and emphasizing peaks.
        break;
      case 'Turbulence': // Similar to FBM but often uses absolute value to create a more "turbulent" or "cloudy" look.
        noiseValue = Math.abs(noiseValue);
        break;
      case 'IQ': // "Inverted Quotient" - conceptual, a non-standard term for a division-based distortion.
        // This creates sharp contrasts where noise values are close to zero.
        noiseValue = 1 / (Math.abs(noiseValue) + 0.1); // Add 0.1 to avoid division by zero and soften effect.
        // Normalize the IQ noise value to roughly fit within a reasonable range (crude re-normalization)
        noiseValue = Math.min(1, Math.max(-1, noiseValue * 0.2 - 0.5)); 
        break;
      case 'None':
      default:
        // No modification, use raw noise as if 1 octave
        break;
    }
    
    total += noiseValue * currentAmplitude;
    currentAmplitude *= persistence;
    currentFrequency *= lacunarity;
  }
  // Normalize total noise value to a 0-1 range from a potential [-Octaves, Octaves] range (simplified)
  // A proper normalization might involve tracking max possible amplitude sum.
  return (total + amplitude * (1 / (1 - persistence))) / (2 * amplitude * (1 / (1 - persistence)));
  // The above normalization is a crude approximation. A simpler safe clamp is often used.
  // return Math.max(0, Math.min(1, (total + 1) / 2)); // Simplex noise returns values in [-1, 1], so divide by 2 and shift by 0.5
};

const generateNoiseImage = ({
  width,
  height,
  seed,
  frequency,
  amplitude,
  backgroundColor,
  imageFormat,
  quality,
  noiseType,
  fractalType,
  domainWrap,
  octaves,
  persistence,
  lacunarity,
}: {
  width: number;
  height: number;
  seed: number;
  frequency: number;
  amplitude: number;
  backgroundColor: string;
  imageFormat: 'png' | 'jpeg' | 'webp';
  quality: number; // 0.0 to 1.0
  noiseType: string;
  fractalType: string;
  domainWrap: boolean;
  octaves: number;
  persistence: number;
  lacunarity: number;
}): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    canvas.width = width;
    canvas.height = height;

    // Parse background color
    const bgRgb = hexToRgb(backgroundColor);
    if (!bgRgb) {
        reject(new Error('Invalid background color format.'));
        return;
    }
    
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Get the active noise function based on user selection
    const noiseFn = getActiveNoiseFunction(noiseType, seed, width, height);
    // Create separate noise functions for domain warping for more varied distortion
    const domainWrapNoiseX = getSimplexNoiseFn(seed + 100);
    const domainWrapNoiseY = getSimplexNoiseFn(seed + 200);


    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;

        let nx = x / width; // Normalized X coordinate (0 to 1)
        let ny = y / height; // Normalized Y coordinate (0 to 1)

        // Simple domain warping effect (conceptual)
        if (domainWrap) {
          const wrapStrength = 0.05; // Adjust this for more or less warping
          // Use different seeded simplex noise for the offset to avoid regular patterns
          const offsetX = domainWrapNoiseX(nx * 5, ny * 5) * wrapStrength;
          const offsetY = domainWrapNoiseY(nx * 5, ny * 5) * wrapStrength;
          nx += offsetX;
          ny += offsetY;
        }

        let noiseVal;
        if (fractalType === 'None') {
          // If no fractal, just use the base noise function with current frequency/amplitude
          noiseVal = noiseFn(nx * frequency, ny * frequency) * amplitude;
          noiseVal = (noiseVal + amplitude) / (2 * amplitude); // Normalize to 0-1 range
        } else {
          noiseVal = applyFractalNoise(
            noiseFn,
            nx, ny,
            frequency, amplitude,
            octaves, persistence, lacunarity,
            fractalType
          );
        }
        
        // Ensure noiseVal is within 0-1 range after all calculations
        noiseVal = Math.max(0, Math.min(1, noiseVal));

        // Interpolate between the background color and white based on the noise value
        const r = Math.floor(bgRgb.r * (1 - noiseVal) + 255 * noiseVal);
        const g = Math.floor(bgRgb.g * (1 - noiseVal) + 255 * noiseVal);
        const b = Math.floor(bgRgb.b * (1 - noiseVal) + 255 * noiseVal);

        data[i] = r;         // Red
        data[i + 1] = g;     // Green
        data[i + 2] = b;     // Blue
        data[i + 3] = 255;   // Alpha (fully opaque)
      }
    }
    ctx.putImageData(imageData, 0, 0);

    const mimeType = `image/${imageFormat}`;
    const dataUrl = canvas.toDataURL(mimeType, imageFormat === 'png' ? undefined : quality);
    resolve(dataUrl);
  });
};

// Helper to convert HEX to RGB
const hexToRgb = (hex: string) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};
// --- End Noise Generation Logic ---

const DEFAULT_WIDTH = 512;
const DEFAULT_HEIGHT = 512;
const DEFAULT_SEED = Math.floor(Math.random() * 1000000000); // Start with a random seed
const DEFAULT_FREQUENCY = 0.02;
const DEFAULT_AMPLITUDE = 1.0;
const DEFAULT_NOISE_TYPE = 'Simplex';
const DEFAULT_FRACTAL_TYPE = 'FBM';
const DEFAULT_DOMAIN_WRAP = false;
const DEFAULT_OCTAVES = 4;
const DEFAULT_PERSISTENCE = 0.5;
const DEFAULT_LACUNARITY = 2.0;
const DEFAULT_IMAGE_FORMAT: 'png' | 'jpeg' | 'webp' = 'png';
const DEFAULT_BACKGROUND_COLOR = '#000000';
const DEFAULT_QUALITY = 90;

const NoiseGenerator: React.FC = () => {
  // Use a local ref to track the "initial" seed, as DEFAULT_SEED is random on each mount
  const initialMountSeedRef = useRef(DEFAULT_SEED);
  
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [seed, setSeed] = useState(initialMountSeedRef.current); // Use the initial random seed
  const [frequency, setFrequency] = useState(DEFAULT_FREQUENCY);
  const [amplitude, setAmplitude] = useState(DEFAULT_AMPLITUDE);
  const [noiseType, setNoiseType] = useState(DEFAULT_NOISE_TYPE);
  const [fractalType, setFractalType] = useState(DEFAULT_FRACTAL_TYPE);
  const [domainWrap, setDomainWrap] = useState(DEFAULT_DOMAIN_WRAP);
  const [octaves, setOctaves] = useState(DEFAULT_OCTAVES);
  const [persistence, setPersistence] = useState(DEFAULT_PERSISTENCE);
  const [lacunarity, setLacunarity] = useState(DEFAULT_LACUNARITY);

  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg' | 'webp'>(DEFAULT_IMAGE_FORMAT);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND_COLOR);
  const [quality, setQuality] = useState(DEFAULT_QUALITY); // 1-100, maps to 0.0-1.0 for toDataURL

  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expanded noise type options (with clarification on implementation)
  const noiseTypeOptions = [
    { value: 'Simplex', label: 'Simplex Noise (library)' },
    { value: 'WhiteNoise', label: 'White Noise (custom)' },
    { value: 'Value', label: 'Value Noise (custom)' },
    { value: 'Perlin', label: 'Perlin (Simplex variant)' }, // Uses Simplex library with Perlin label
    { value: 'Worley', label: 'Worley (Simplex variant)' }, // Uses Simplex library with Worley label
    { value: 'Cellular', label: 'Cellular (Simplex variant)' }, // Uses Simplex library with Cellular label
  ];

  const fractalTypeOptions = [
    { value: 'None', label: 'None' },
    { value: 'FBM', label: 'FBM (Standard)' },
    { value: 'Billow', label: 'Billow (Wavy Ridges)' },
    { value: 'Ridged', label: 'Ridged (Sharp Peaks)' },
    { value: 'Turbulence', label: 'Turbulence (Cloudy/Distorted)' },
    { value: 'IQ', label: 'IQ (Inverted Quotient - experimental)' },
  ];

  const randomizeSeed = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 1000000000);
    setSeed(newSeed);
  }, []);

  const handleGenerateNoise = useCallback(async () => {
    if (width <= 0 || height <= 0) {
      setError('Width and Height must be positive numbers.');
      return;
    }
    if (fractalType !== 'None' && octaves <= 0) { // Octaves only relevant if fractal type is not None
      setError('Octaves must be a positive number for fractal noise types.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const url = await generateNoiseImage({
        width,
        height,
        seed,
        frequency,
        amplitude,
        backgroundColor,
        imageFormat,
        quality: quality / 100, // Convert 1-100 to 0.0-1.0
        noiseType,
        fractalType,
        domainWrap,
        octaves: fractalType === 'None' ? 1 : octaves, // If no fractal, use 1 octave effectively
        persistence,
        lacunarity,
      });
      setGeneratedImageUrl(url);
    } catch (e: any) {
      console.error('Error generating noise:', e);
      setError(e.message || 'Failed to generate noise image.');
    } finally {
      setIsLoading(false);
    }
  }, [width, height, seed, frequency, amplitude, backgroundColor, imageFormat, quality, noiseType, fractalType, domainWrap, octaves, persistence, lacunarity]);

  const handleDownload = useCallback(() => {
    if (generatedImageUrl) {
      downloadImage(generatedImageUrl, `noise_${seed}.${imageFormat}`);
    }
  }, [generatedImageUrl, seed, imageFormat]);

  const handleReset = useCallback(() => {
    setWidth(DEFAULT_WIDTH);
    setHeight(DEFAULT_HEIGHT);
    setSeed(initialMountSeedRef.current); // Reset to the initial random seed from mount
    setFrequency(DEFAULT_FREQUENCY);
    setAmplitude(DEFAULT_AMPLITUDE);
    setNoiseType(DEFAULT_NOISE_TYPE);
    setFractalType(DEFAULT_FRACTAL_TYPE);
    setDomainWrap(DEFAULT_DOMAIN_WRAP);
    setOctaves(DEFAULT_OCTAVES);
    setPersistence(DEFAULT_PERSISTENCE);
    setLacunarity(DEFAULT_LACUNARITY);
    setImageFormat(DEFAULT_IMAGE_FORMAT);
    setBackgroundColor(DEFAULT_BACKGROUND_COLOR);
    setQuality(DEFAULT_QUALITY);
    setGeneratedImageUrl(null);
    setIsLoading(false);
    setError(null);
  }, []);

  const isQualitySliderDisabled = imageFormat === 'png';
  const isGenerateDisabled = width <= 0 || height <= 0 || (fractalType !== 'None' && octaves <= 0) || isLoading;
  
  // Check if current settings match default, accounting for initial random seed
  const isDefaultSettings = 
    width === DEFAULT_WIDTH &&
    height === DEFAULT_HEIGHT &&
    seed === initialMountSeedRef.current && // Compare against the initial random seed
    frequency === DEFAULT_FREQUENCY &&
    amplitude === DEFAULT_AMPLITUDE &&
    noiseType === DEFAULT_NOISE_TYPE &&
    fractalType === DEFAULT_FRACTAL_TYPE &&
    domainWrap === DEFAULT_DOMAIN_WRAP &&
    octaves === DEFAULT_OCTAVES &&
    persistence === DEFAULT_PERSISTENCE &&
    lacunarity === DEFAULT_LACUNARITY &&
    imageFormat === DEFAULT_IMAGE_FORMAT &&
    backgroundColor === DEFAULT_BACKGROUND_COLOR &&
    quality === DEFAULT_QUALITY;

  const isResetDisabled = !generatedImageUrl && isDefaultSettings;

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
          <h3 className="text-lg font-semibold text-white">Noise Generation Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="width-input" className="block text-sm font-medium text-gray-300 mb-2">Width (pixels)</label>
              <input
                type="number"
                id="width-input"
                min="1"
                max="2048"
                value={width}
                onChange={(e) => setWidth(Math.max(1, Math.min(2048, parseInt(e.target.value, 10) || 0)))}
                className="custom-input"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="height-input" className="block text-sm font-medium text-gray-300 mb-2">Height (pixels)</label>
              <input
                type="number"
                id="height-input"
                min="1"
                max="2048"
                value={height}
                onChange={(e) => setHeight(Math.max(1, Math.min(2048, parseInt(e.target.value, 10) || 0)))}
                className="custom-input"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="seed-input" className="block text-sm font-medium text-gray-300 mb-2">Seed</label>
            <div className="flex gap-2">
              <input
                type="number"
                id="seed-input"
                min="0"
                max="999999999"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
                className="custom-input flex-grow"
                disabled={isLoading}
              />
              <Button onClick={randomizeSeed} variant="secondary" disabled={isLoading} className="whitespace-nowrap">
                Randomize
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">A unique number to generate a reproducible pattern.</p>
          </div>

          <div>
            <label htmlFor="frequency-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
              <span>Frequency</span>
              <span className="font-mono text-teal-300">{frequency.toFixed(3)}</span>
            </label>
            <input
              type="range"
              id="frequency-slider"
              min="0.001"
              max="0.5"
              step="0.001"
              value={frequency}
              onChange={(e) => setFrequency(parseFloat(e.target.value))}
              className="w-full range-slider"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">Controls the density of the noise patterns (higher = more detail).</p>
          </div>

          <div>
            <label htmlFor="amplitude-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
              <span>Amplitude</span>
              <span className="font-mono text-teal-300">{amplitude.toFixed(2)}</span>
            </label>
            <input
              type="range"
              id="amplitude-slider"
              min="0.1"
              max="5.0"
              step="0.1"
              value={amplitude}
              onChange={(e) => setAmplitude(parseFloat(e.target.value))}
              className="w-full range-slider"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">Adjusts the intensity or height of the noise peaks/valleys.</p>
          </div>

          <div>
            <label htmlFor="noise-type-select" className="block text-sm font-medium text-gray-300 mb-2">Noise Type</label>
            <select
              id="noise-type-select"
              value={noiseType}
              onChange={(e) => setNoiseType(e.target.value)}
              className="custom-input"
              disabled={isLoading}
            >
              {noiseTypeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select the fundamental algorithm for noise generation. Simplex is from a library; White and Value are custom implementations. Perlin, Worley, and Cellular are conceptual variants based on Simplex.
            </p>
          </div>

          <div>
            <label htmlFor="fractal-type-select" className="block text-sm font-medium text-gray-300 mb-2">Fractal Type</label>
            <select
              id="fractal-type-select"
              value={fractalType}
              onChange={(e) => setFractalType(e.target.value)}
              className="custom-input"
              disabled={isLoading}
            >
              {fractalTypeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Applies different patterns and details using multiple layers (octaves) of noise.</p>
          </div>

          {fractalType !== 'None' && (
            <>
              <div>
                <label htmlFor="octaves-input" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                  <span>Octaves</span>
                  <span className="font-mono text-teal-300">{octaves}</span>
                </label>
                <input
                  type="range"
                  id="octaves-input"
                  min="1"
                  max="10"
                  step="1"
                  value={octaves}
                  onChange={(e) => setOctaves(parseInt(e.target.value, 10))}
                  className="w-full range-slider"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">Number of layers of noise for detail (higher = more complex detail).</p>
              </div>

              <div>
                <label htmlFor="persistence-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                  <span>Persistence</span>
                  <span className="font-mono text-teal-300">{persistence.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  id="persistence-slider"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={persistence}
                  onChange={(e) => setPersistence(parseFloat(e.target.value))}
                  className="w-full range-slider"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">Controls how much each successive octave contributes (lower = less impact).</p>
              </div>

              <div>
                <label htmlFor="lacunarity-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                  <span>Lacunarity</span>
                  <span className="font-mono text-teal-300">{lacunarity.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  id="lacunarity-slider"
                  min="1.5"
                  max="3.5"
                  step="0.1"
                  value={lacunarity}
                  onChange={(e) => setLacunarity(parseFloat(e.target.value))}
                  className="w-full range-slider"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">Controls the frequency multiplier for each octave (higher = more fine detail).</p>
              </div>
            </>
          )}

          <div className="flex items-center pt-2 border-t border-gray-700">
            <input
              id="domain-wrap-checkbox"
              type="checkbox"
              checked={domainWrap}
              onChange={(e) => setDomainWrap(e.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-teal-500 focus:ring-teal-500"
              disabled={isLoading}
            />
            <label htmlFor="domain-wrap-checkbox" className="ml-3 block text-sm font-medium text-gray-300">Enable Domain Wrap</label>
            <p className="text-xs text-gray-500 ml-auto">Adds a subtle distortion or "swirling" effect to the noise pattern.</p>
          </div>

          <ColorPicker
            label="Background Color"
            color={backgroundColor}
            onChange={setBackgroundColor}
            disabled={isLoading}
          />

          <div>
            <label htmlFor="image-format-select" className="block text-sm font-medium text-gray-300 mb-2">Image Format</label>
            <select
              id="image-format-select"
              value={imageFormat}
              onChange={(e) => setImageFormat(e.target.value as 'png' | 'jpeg' | 'webp')}
              className="custom-input"
              disabled={isLoading}
            >
              <option value="png">PNG (Lossless)</option>
              <option value="jpeg">JPEG (Lossy)</option>
              <option value="webp">WEBP (Lossy)</option>
            </select>
          </div>

          <div>
            <label htmlFor="quality-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-2">
              <span>Quality ({imageFormat === 'png' ? 'N/A' : 'Lossy'})</span>
              <span className="font-mono text-teal-300 text-lg">{quality}%</span>
            </label>
            <input
              type="range"
              id="quality-slider"
              min="1"
              max="100"
              step="1"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value, 10))}
              className="w-full range-slider"
              disabled={isQualitySliderDisabled || isLoading}
            />
            {isQualitySliderDisabled && <p className="text-xs text-gray-500 mt-1">Quality is not applicable for PNG (lossless) format.</p>}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Button onClick={handleGenerateNoise} isLoading={isLoading} icon={<SparklesIcon />} disabled={isGenerateDisabled}>
            Generate Noise
          </Button>
          <Button onClick={handleDownload} variant="secondary" icon={<ArrowDownTrayIcon />} disabled={!generatedImageUrl || isLoading}>
            Download Image
          </Button>
        </div>
        <Button onClick={handleReset} variant="outline" icon={<ArrowUturnLeftIcon />} disabled={isResetDisabled}>
          Start Over
        </Button>
      </div>

      <div className="lg:col-span-8">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 sticky top-24">
          <h3 className="text-lg font-semibold text-white mb-4 px-2">Generated Noise Preview</h3>
          <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh] overflow-hidden relative checkerboard-bg">
            {isLoading && <LoadingSpinner />}
            {!generatedImageUrl && !isLoading && (
              <p className="text-gray-400 text-sm p-4 text-center">Adjust settings and click 'Generate Noise'</p>
            )}
            {generatedImageUrl && !isLoading && (
              <img src={generatedImageUrl} alt="Generated Noise" className="max-w-full max-h-full object-contain rounded-md" />
            )}
            {error && !isLoading && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 absolute inset-4 flex items-center justify-center text-center">
                <p className="font-semibold">Error: {error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoiseGenerator;