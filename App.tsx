import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TOOLS } from './constants';
import type { Tool } from './types';
import { SettingsProvider } from './contexts/SettingsContext';
import HomePage from './features/HomePage';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const ActiveComponent = activeTool?.component;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    // Prevent background scrolling when the mobile sidebar is open
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  return (
    <SettingsProvider>
      <div className="flex min-h-screen bg-gray-900 text-gray-200 font-sans">
        <Sidebar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            toolName={activeTool ? activeTool.name : 'Image Toolbox Pro'}
            setIsSidebarOpen={setIsSidebarOpen}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {ActiveComponent ? (
                 <div key={activeTool?.name} className="page-enter-animation">
                    <ActiveComponent />
                  </div>
              ) : (
                <HomePage setActiveTool={setActiveTool} />
              )}
            </div>
          </main>
          {/* Footer Section - Enhanced Design */}
          <footer className="flex-shrink-0 bg-gradient-to-t from-gray-900 via-gray-900/90 to-transparent border-t border-gray-800/70 p-6 sm:p-8 text-center text-sm text-gray-400">
            <p className="tracking-wide text-gray-500 hover:text-gray-400 transition-colors duration-200">
              &copy; {currentYear} <span className="text-teal-400 font-semibold">Copyright By Rio</span>, All Rights Reserved.
            </p>
          </footer>
        </div>
      </div>
    </SettingsProvider>
  );
};

export default App;