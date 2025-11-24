import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Button } from '../components/Button';
import { CheckIcon } from '../components/icons';

const ApiKeyManager: React.FC = () => {
  const { 
    // FIX: Removed Gemini key from settings context as it should come from environment variables.
    upscalerApiKey, setUpscalerApiKey,
    bgRemoverApiKey, setBgRemoverApiKey
  } = useSettings();

  // FIX: Removed local state for Gemini key.
  const [localRapidApiKey, setLocalRapidApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    // Since both RapidAPI keys should be the same, use whichever is available.
    setLocalRapidApiKey(bgRemoverApiKey || upscalerApiKey);
  }, [upscalerApiKey, bgRemoverApiKey]);

  const handleSave = () => {
    setSaveStatus('saving');
    // FIX: Removed saving of Gemini key.
    // Set both RapidAPI-dependent keys with the single value
    setUpscalerApiKey(localRapidApiKey);
    setBgRemoverApiKey(localRapidApiKey);
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    }, 500);
  };

  const ApiCard = ({ title, description, link, linkText, value, onChange, placeholder }: any) => (
    <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 space-y-4">
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-[#1DB954]">{title}</h3>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        <div>
            <label htmlFor={`${title}-key`} className="sr-only">{title} API Key</label>
            <input
                type="password"
                id={`${title}-key`}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="custom-input"
            />
            <p className="text-xs text-gray-500 mt-2">Get your free key from <a href={link} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#1DB954]">{linkText}</a>.</p>
        </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
       <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          API Key Settings
        </h2>
        <p className="mt-4 text-lg leading-8 text-gray-400">
          Manage keys for AI features. Keys are stored locally in your browser. The Google Gemini key is configured centrally.
        </p>
      </div>

      <div className="space-y-6">
        {/* FIX: Removed ApiCard for Google Gemini to comply with API key guidelines. */}
        <ApiCard
          title="RapidAPI Key"
          description="One key for: Background Remover, Upscaler, Image Sharpening & Face Blur."
          link="https://rapidapi.com/hub"
          linkText="RapidAPI Hub"
          value={localRapidApiKey}
          onChange={(e: any) => setLocalRapidApiKey(e.target.value)}
          placeholder="Enter your RapidAPI key"
        />
        
        <div className="flex justify-end pt-4">
            <Button onClick={handleSave} isLoading={saveStatus === 'saving'}>
                {saveStatus === 'saved' ? <><CheckIcon className="mr-2 -ml-1 h-5 w-5" /> Saved!</> : 'Save All Settings'}
            </Button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;