import React from 'react';
import { Bars3Icon } from './icons';

interface HeaderProps {
  toolName: string;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ toolName, setIsSidebarOpen }) => {
  return (
    <header className="flex-shrink-0 bg-black/70 backdrop-blur-lg border-b border-zinc-800/60 z-10 sticky top-0">
      <div className="flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              type="button"
              className="p-2.5 -ml-2.5 text-gray-400 lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Bars3Icon />
            </button>
            <h2 className="text-xl font-bold text-gray-100 tracking-tight truncate">{toolName}</h2>
        </div>
      </div>
    </header>
  );
};