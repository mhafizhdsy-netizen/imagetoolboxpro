import React from 'react';
import { TOOLS } from '../constants';
import type { Tool } from '../types';

interface HomePageProps {
  setActiveTool: (tool: Tool) => void;
}

const HomePage: React.FC<HomePageProps> = ({ setActiveTool }) => {
  const displayTools = TOOLS.filter(tool => tool.name !== 'API Key Settings');

  return (
    <div className="page-enter-animation">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          Image Toolbox Pro
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
          All your image processing needs in one place. Select a tool below to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayTools.map((tool) => (
          <button
            key={tool.name}
            onClick={() => setActiveTool(tool)}
            className="group bg-gray-800/50 hover:bg-gray-800/80 border border-gray-700/60 rounded-xl p-6 text-left transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-teal-500/10"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-gray-700/50 rounded-lg text-teal-300 text-2xl mb-5 group-hover:bg-teal-500/20 group-hover:text-teal-200 transition-colors">
              {tool.icon}
            </div>
            <h3 className="text-lg font-bold text-gray-100 mb-2">{tool.name}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {tool.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;