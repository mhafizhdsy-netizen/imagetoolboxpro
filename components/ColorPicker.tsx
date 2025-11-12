
import React, { useState, useRef, useEffect, useCallback } from 'react';

// --- Helper Functions for Color Conversion ---
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => r + r + g + g + b + b));
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
};

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const rgbToHsv = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToRgb = (h: number, s: number, v: number) => {
  s /= 100; v /= 100;
  const i = Math.floor(h / 60);
  const f = h / 60 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
};

// Simple throttle hook to limit state updates on high-frequency events
const useThrottle = (callback: (...args: any[]) => void, delay: number) => {
    const timeoutRef = useRef<number | null>(null);
    const callbackRef = useRef(callback);
    
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    return useCallback((...args: any[]) => {
        if (!timeoutRef.current) {
            callbackRef.current(...args);
            timeoutRef.current = window.setTimeout(() => {
                timeoutRef.current = null;
            }, delay);
        }
    }, [delay]);
};


// --- Color Picker Component ---
interface ColorPickerProps {
  label?: string;
  color: string;
  onChange: (newColor: string) => void;
  disabled?: boolean;
}

const PRESET_COLORS = [
  '#FFFFFF', '#E5E7EB', '#9CA3AF', '#4B5563', '#1F2937', '#111827',
  '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#14B8A6',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, color, onChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(color); // Local state for text input
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Sync local input state when external color prop changes
  useEffect(() => {
    if (color.toUpperCase() !== inputValue.toUpperCase()) {
      setInputValue(color);
    }
  }, [color]);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setInputValue(newText);
    // Validate and update parent state if it's a valid hex code
    if (/^#([0-9A-F]{6})$/i.test(newText) || /^#([0-9A-F]{3})$/i.test(newText)) {
      onChange(newText.toUpperCase());
    }
  };

  const handleInputBlur = () => {
    // On blur, if the input is not a valid hex, revert to the last valid color
    if (!/^#([0-9A-F]{6})$/i.test(inputValue) && !/^#([0-9A-F]{3})$/i.test(inputValue)) {
      setInputValue(color);
    }
  };
  
  const rgb = hexToRgb(color) || { r: 0, g: 0, b: 0 };
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  
  // Throttle the onChange callback for performance during drag
  const throttledOnChange = useThrottle(onChange, 16); // ~60fps updates

  const SaturationValuePicker: React.FC = () => {
    const areaRef = useRef<HTMLDivElement>(null);

    const handleMove = useCallback((clientX: number, clientY: number) => {
      if (!areaRef.current) return;
      const rect = areaRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
      
      const s = (x / rect.width) * 100;
      const v = 100 - (y / rect.height) * 100;
      
      const { r, g, b } = hsvToRgb(hsv.h, s, v);
      throttledOnChange(rgbToHex(r, g, b));
    }, [hsv.h, throttledOnChange]);

    const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      // Prevent scrolling on touch devices
      if ('touches' in e.nativeEvent) {
          e.preventDefault();
      }

      const moveEventName = 'touches' in e.nativeEvent ? 'touchmove' : 'mousemove';
      const endEventName = 'touches' in e.nativeEvent ? 'touchend' : 'mouseup';

      const initialClientX = 'touches' in e.nativeEvent ? e.nativeEvent.touches[0].clientX : e.nativeEvent.clientX;
      const initialClientY = 'touches' in e.nativeEvent ? e.nativeEvent.touches[0].clientY : e.nativeEvent.clientY;
      handleMove(initialClientX, initialClientY);

      const onMove = (moveEvent: MouseEvent | TouchEvent) => {
        const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
        const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
        handleMove(clientX, clientY);
      };
      
      const onEnd = () => {
        document.removeEventListener(moveEventName, onMove as EventListener);
        document.removeEventListener(endEventName, onEnd);
      };

      document.addEventListener(moveEventName, onMove as EventListener);
      document.addEventListener(endEventName, onEnd);
    }, [handleMove]);


    return (
      <div 
        ref={areaRef}
        className="relative w-full h-40 rounded-md cursor-pointer touch-none"
        style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
        onMouseDown={handleInteraction}
        onTouchStart={handleInteraction}
      >
        <div 
          className="absolute inset-0" 
          style={{ background: 'linear-gradient(to right, #fff, rgba(255,255,255,0))' }}
        />
        <div 
          className="absolute inset-0" 
          style={{ background: 'linear-gradient(to top, #000, rgba(0,0,0,0))' }}
        />
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
          }}
        />
      </div>
    );
  };
  
  const HueSlider: React.FC = () => {
    const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newHue = parseFloat(e.target.value);
      const { r, g, b } = hsvToRgb(newHue, hsv.s, hsv.v);
      onChange(rgbToHex(r, g, b));
    };

    return (
      <input
        type="range"
        min="0"
        max="360"
        value={hsv.h}
        onChange={handleHueChange}
        className="color-picker-hue-slider w-full"
      />
    );
  };

  return (
    <div className="relative">
      {label && <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>}
      <div className="flex items-center gap-3">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-10 h-10 rounded-md border-2 transition-all duration-200 ${isOpen ? 'border-teal-400 ring-2 ring-teal-400/50' : 'border-gray-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500'}`}
          style={{ backgroundColor: color }}
          disabled={disabled}
          aria-label={`Current color is ${color}. Click to open color picker.`}
        />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="custom-input font-mono text-sm w-28"
          disabled={disabled}
        />
      </div>
      
      {isOpen && (
        <div
          ref={popoverRef}
          className="color-picker-popover absolute z-10 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 space-y-4"
        >
          <SaturationValuePicker />
          <HueSlider />
          
          <div className="grid grid-cols-8 gap-1.5">
            {PRESET_COLORS.map(preset => (
              <button
                key={preset}
                type="button"
                className="w-full aspect-square rounded-md border border-gray-600/50 transition-transform hover:scale-110"
                style={{ backgroundColor: preset }}
                onClick={() => {
                  onChange(preset);
                }}
                aria-label={`Select color ${preset}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
