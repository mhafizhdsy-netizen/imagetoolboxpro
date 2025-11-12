import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../components/Button';
import { generateText } from '../services';
import { AIIcon } from '../components/icons';

const AITextGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 200; 
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [prompt]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setResult('');
    try {
      const generatedText = await generateText(prompt);
      setResult(generatedText);
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleGenerate();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
        <h2 className="text-lg font-semibold text-white">
          AI Text Generator
        </h2>
        <div className="relative">
            <label htmlFor="prompt" className="sr-only">Your Prompt</label>
            <textarea
              ref={textareaRef}
              id="prompt"
              rows={3}
              className="custom-input text-base resize-none block w-full pr-36"
              placeholder="e.g., A short, funny poem about a cat who loves coding..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="absolute bottom-3 right-3">
                <Button 
                  onClick={handleGenerate} 
                  isLoading={isLoading} 
                  icon={<AIIcon />}
                  disabled={!prompt.trim() || isLoading}
                  aria-label="Generate Text"
                >
                  Generate
                </Button>
            </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {isLoading && !result && (
          <div className="flex justify-center items-center p-8 text-gray-400 bg-gray-800 rounded-lg border border-gray-700">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating response...</span>
          </div>
      )}

      {result && (
        <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-white">Generated Result</h3>
            </div>
            <div className="p-6 border-t border-gray-700 bg-gray-900/50 rounded-b-lg">
                <div className="text-gray-200 whitespace-pre-wrap leading-relaxed selection:bg-teal-500/30 prose prose-invert max-w-none prose-p:my-2">{result}</div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AITextGenerator;