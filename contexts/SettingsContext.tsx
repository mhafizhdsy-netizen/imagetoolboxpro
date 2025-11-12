
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface SettingsContextType {
  upscalerApiKey: string;
  setUpscalerApiKey: (key: string) => void;
  bgRemoverApiKey: string;
  setBgRemoverApiKey: (key: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// FIX: Removed old storage key as it's no longer needed for Gemini key migration.
const SETTINGS_STORAGE_KEY = 'image-toolbox-settings';

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // FIX: Removed state management for Gemini API key to comply with guidelines.
  // The key must be sourced from process.env.API_KEY only.
  const [upscalerApiKey, setUpscalerApiKeyState] = useState<string>('');
  const [bgRemoverApiKey, setBgRemoverApiKeyState] = useState<string>('');

  // Load settings from localStorage on initial render
  useEffect(() => {
    try {
      const savedSettingsRaw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettingsRaw) {
        const savedSettings = JSON.parse(savedSettingsRaw);
        // FIX: Removed logic for loading Gemini API key.
        if (typeof savedSettings.upscalerApiKey === 'string') {
          setUpscalerApiKeyState(savedSettings.upscalerApiKey);
        }
        if (typeof savedSettings.bgRemoverApiKey === 'string') {
            setBgRemoverApiKeyState(savedSettings.bgRemoverApiKey);
        } else if (typeof savedSettings.slazzerApiKey === 'string') { // Migration from old key
            setBgRemoverApiKeyState(savedSettings.slazzerApiKey);
        }
      } 
      // FIX: Removed migration logic for old Gemini key.
    } catch (error) {
        console.error("Failed to load settings from localStorage", error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
        // FIX: Removed geminiApiKey from saved settings.
        const settings = { upscalerApiKey, bgRemoverApiKey };
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error("Failed to save settings to localStorage", error);
    }
  }, [upscalerApiKey, bgRemoverApiKey]);

  // FIX: Removed setter for Gemini API key.
  
  const setUpscalerApiKey = (key: string) => {
    setUpscalerApiKeyState(key);
  };

  const setBgRemoverApiKey = (key: string) => {
    setBgRemoverApiKeyState(key);
  };

  return (
    <SettingsContext.Provider value={{ 
        upscalerApiKey, setUpscalerApiKey,
        bgRemoverApiKey, setBgRemoverApiKey
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
