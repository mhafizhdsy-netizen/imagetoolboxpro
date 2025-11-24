import React, { useState } from 'react';
import { TOOLS } from '../constants';
import type { Tool } from '../types';
import { MagnifyingGlassIcon } from '../components/icons';

interface HomePageProps {
  setActiveTool: (tool: Tool) => void;
}

const HomePage: React.FC<HomePageProps> = ({ setActiveTool }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const displayTools = TOOLS.filter(tool => tool.name !== 'API Key Settings');

  const filteredTools = displayTools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-enter-animation">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          Image Toolbox Pro
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
          All your image processing needs in one place. Select a tool below to get started.
        </p>

        {/* Search Bar */}
        <div className="mt-8 max-w-xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="search"
              name="search"
              id="search"
              className="custom-input pl-11 !rounded-full"
              placeholder="Search for a tool..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search for tools"
            />
          </div>
        </div>
      </div>

      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTools.map((tool) => (
            <button
              key={tool.name}
              onClick={() => setActiveTool(tool)}
              className="group bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl p-6 text-left transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#1DB954]/10 hover:border-[#1DB954]/30"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-zinc-800 rounded-lg text-[#1DB954] text-2xl mb-5 group-hover:bg-[#1DB954]/20 group-hover:text-green-300 transition-colors">
                {tool.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-100 mb-2">{tool.name}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {tool.description}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-white">No Tools Found</h3>
          <p className="mt-2 text-gray-400">
            Your search for "{searchQuery}" did not match any tools. Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
};

export default HomePage;