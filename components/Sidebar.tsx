import React from 'react';
import { TOOLS } from '../constants';
import type { Tool } from '../types';
import { AppIcon, XMarkIcon } from './icons';

interface SidebarProps {
  activeTool: Tool | null;
  setActiveTool: (tool: Tool | null) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTool, setActiveTool, isSidebarOpen, setIsSidebarOpen }) => {
  const handleToolClick = (tool: Tool) => {
    setActiveTool(tool);
    setIsSidebarOpen(false); // Close sidebar on tool selection on mobile
  };

  const goToHome = () => {
    setActiveTool(null);
    setIsSidebarOpen(false);
  }

  const utilityToolNames = ['API Key Settings', 'FAQ'];
  const mainTools = TOOLS.filter(tool => !utilityToolNames.includes(tool.name));
  const faqTool = TOOLS.find(tool => tool.name === 'FAQ');
  const settingsTool = TOOLS.find(tool => tool.name === 'API Key Settings');


  const ToolButton: React.FC<{ tool: Tool }> = ({ tool }) => (
    <button
      key={tool.name}
      onClick={() => handleToolClick(tool)}
      className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 group relative ${
        activeTool?.name === tool.name
          ? 'bg-gray-700/60 text-white'
          : 'text-gray-400 hover:bg-gray-700/40 hover:text-white'
      }`}
    >
      {activeTool?.name === tool.name && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-teal-400 rounded-r-full"></span>
      )}
      <span className="w-6 mr-4 text-center text-lg">{tool.icon}</span>
      <span className="truncate">{tool.name}</span>
    </button>
  );

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 bg-black/60 z-20 lg:hidden transition-opacity ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      ></div>

      <aside
        className={`w-64 bg-gray-900/80 backdrop-blur-lg border-r border-gray-700/60 flex flex-col
          fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button 
          onClick={goToHome}
          className="flex items-center justify-between h-20 px-4 border-b border-gray-700/60 w-full hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-lg text-2xl text-teal-300">
                <AppIcon />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Toolbox Pro</h1>
          </div>
          <div className="lg:hidden">
            {/* FIX: XMarkIcon now correctly accepts className as its only prop, resolving the 'faClass missing' error */}
            <XMarkIcon
              className="p-2.5 text-gray-400"
              onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(false); }}
            >
              <span className="sr-only">Close sidebar</span>
            </XMarkIcon>
          </div>
        </button>
        <nav className="flex-1 flex flex-col px-4 py-6 overflow-y-auto">
          <div className="space-y-1.5">
            {mainTools.map((tool) => (
              <ToolButton key={tool.name} tool={tool} />
            ))}
          </div>

          <div className="mt-auto pt-6 border-t border-gray-700/60 space-y-1.5">
            {faqTool && <ToolButton tool={faqTool} />}
            {settingsTool && <ToolButton tool={settingsTool} />}
          </div>
        </nav>
      </aside>
    </>
  );
};