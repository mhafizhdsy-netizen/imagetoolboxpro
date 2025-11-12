import React, { useCallback, useState } from 'react';
import { PhotoIcon } from './icons';

interface ImageUploaderProps {
  onFileSelect: (files: File[]) => void; // Consolidated prop for file selection (single or multiple)
  title?: string;
  description?: string;
  accept?: string; // New prop for accepted file types
  multiple?: boolean; // New prop to control multiple file selection
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onFileSelect,
  title = "Upload your file", 
  description = "Click to select or drag and drop a file here",
  accept = "image/*", // Default to images
  multiple = true // Default to multiple
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(Array.from(e.target.files));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Filter files if `multiple` is false to only take the first one
      const files = multiple ? Array.from(e.dataTransfer.files) : [e.dataTransfer.files[0]];
      onFileSelect(files);
    }
  }, [onFileSelect, multiple]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <label
        htmlFor="file-upload"
        className={`group relative flex justify-center w-full rounded-2xl border-2 border-dashed p-12 lg:p-24 text-center transition-all duration-300 ease-in-out cursor-pointer
        ${isDragging 
          ? 'border-solid border-teal-400 bg-gray-800/50' 
          : 'border-gray-700 hover:border-teal-500/70'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`text-6xl text-gray-600 transition-all duration-300 ease-in-out ${isDragging ? 'scale-110 text-teal-400' : 'group-hover:text-gray-500'}`}>
            <PhotoIcon />
          </div>
          <div>
            <span className="mt-2 block text-lg font-semibold text-gray-100">{title}</span>
            <span className="mt-1 block text-sm text-gray-500">{description}</span>
          </div>
        </div>
        <input 
          id="file-upload" 
          name="file-upload" 
          type="file" 
          className="sr-only" 
          onChange={handleFileChange} 
          accept={accept} 
          multiple={multiple} 
        />
      </label>
    </div>
  );
};