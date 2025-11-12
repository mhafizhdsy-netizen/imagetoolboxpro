

import React from 'react';
import { SparklesIcon } from '../components/icons';

interface PlaceholderToolProps {
  toolName: string;
}

const PlaceholderTool: React.FC<PlaceholderToolProps> = ({ toolName }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-800/60 rounded-xl border border-slate-700/80 h-96">
      <div className="p-4 bg-indigo-500/20 rounded-full mb-6">
        {/* FIX: SparklesIcon now correctly accepts className due to update in icons.tsx */}
        <SparklesIcon className="w-10 h-10 text-indigo-400" />
      </div>
      <h2 className="text-3xl font-bold mb-2">{toolName}</h2>
      <p className="text-slate-400 max-w-md">
        This powerful feature is currently under development and will be available soon. Stay tuned for updates!
      </p>
    </div>
  );
};

export default PlaceholderTool;