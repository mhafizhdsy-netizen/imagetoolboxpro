import type React from 'react';

export interface Tool {
  name: string;
  icon: React.ReactNode;
  component: React.FC;
  description: string;
}

// Extend File interface to include a preview URL and a unique ID for drag-and-drop and display
export interface FileWithPreview extends File {
  preview: string;
  id: string;
  width?: number; // Store natural width
  height?: number; // Store natural height
}
