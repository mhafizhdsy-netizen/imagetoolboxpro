
import React from 'react';
import { Button } from './Button';
import { XMarkIcon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  // FIX: Removed Gemini API key logic to comply with guidelines.
  // The Gemini API key must be sourced from environment variables and not managed through the UI.
  // This component is now a placeholder as its only function was to set the Gemini key.

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-slate-800 w-full max-w-md rounded-xl shadow-2xl border border-slate-700/50 p-6 space-y-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          aria-label="Close settings"
        >
          {/* FIX: XMarkIcon now correctly accepts className as its only prop, resolving the 'faClass missing' error */}
          <XMarkIcon className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-white">API Key Settings</h2>

        <div className="space-y-4">
            <p className="text-sm text-slate-400 pt-1">
              The Google Gemini API key is configured centrally and cannot be changed here.
            </p>
        </div>
        
        <div className="flex justify-end gap-4 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};