import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowsLeftRightIcon } from './icons';

interface ImageComparatorProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export const ImageComparator: React.FC<ImageComparatorProps> = ({
  beforeSrc,
  afterSrc,
  beforeLabel = 'BEFORE',
  afterLabel = 'AFTER',
  className = '',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeImageRef = useRef<HTMLImageElement>(null);
  
  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  }, []);

  const handleInteractionStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const handleInteractionMove = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      handleMove(clientX);
    };

    const handleInteractionEnd = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleInteractionMove as EventListener);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchmove', handleInteractionMove as EventListener);
      window.removeEventListener('touchend', handleInteractionEnd);
    };

    window.addEventListener('mousemove', handleInteractionMove as EventListener);
    window.addEventListener('mouseup', handleInteractionEnd);
    window.addEventListener('touchmove', handleInteractionMove as EventListener);
    window.addEventListener('touchend', handleInteractionEnd);
  }, [handleMove]);

  useEffect(() => {
    const setContainerHeight = () => {
      if (beforeImageRef.current && containerRef.current) {
        const img = beforeImageRef.current;
        const containerWidth = containerRef.current.offsetWidth;
        if (img.naturalWidth > 0 && containerWidth > 0) {
          const aspectRatio = img.naturalHeight / img.naturalWidth;
          const newHeight = containerWidth * aspectRatio;
          containerRef.current.style.height = `${newHeight}px`;
        }
      }
    };

    const img = beforeImageRef.current;
    if (img) {
      if (img.complete) {
        setContainerHeight();
      } else {
        img.addEventListener('load', setContainerHeight);
      }
    }
    window.addEventListener('resize', setContainerHeight);

    return () => {
      if (img) {
        img.removeEventListener('load', setContainerHeight);
      }
      window.removeEventListener('resize', setContainerHeight);
    };
  }, [beforeSrc]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-full mx-auto select-none overflow-hidden rounded-lg ${className}`}
    >
      {/* Before Image (Right side) - clipped to be visible only to the right of the slider */}
      <div
        className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
        <img
          ref={beforeImageRef}
          src={beforeSrc}
          alt="Before"
          className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
          draggable="false"
          loading="lazy"
        />
      </div>

      {/* After Image (Left side) - clipped to be visible only to the left of the slider */}
      <div
        className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={afterSrc}
          alt="After"
          className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
          draggable="false"
          loading="lazy"
        />
      </div>

      <div 
        className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md pointer-events-none z-10"
        style={{ opacity: sliderPosition < 90 ? 1 : 0, transition: 'opacity 0.2s' }}
      >
        {beforeLabel}
      </div>
       <div 
        className="absolute bottom-4 left-4 bg-black/60 text-white text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md pointer-events-none z-10"
        style={{ opacity: sliderPosition > 10 ? 1 : 0, transition: 'opacity 0.2s' }}
      >
        {afterLabel}
      </div>

      <div
        className="absolute top-0 bottom-0 w-1 bg-white/75 cursor-ew-resize group"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        onMouseDown={handleInteractionStart}
        onTouchStart={handleInteractionStart}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 text-gray-800 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110">
          <ArrowsLeftRightIcon className="text-xl"/>
        </div>
      </div>
    </div>
  );
};
