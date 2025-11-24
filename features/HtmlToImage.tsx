import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../components/Button';
import { generateImageFromDescription, describeHtmlContent } from '../services';
import { ArrowDownTrayIcon, ArrowUturnLeftIcon, AIIcon } from '../components/icons';
import { downloadImage } from '../utils/imageUtils';

const HtmlToImage: React.FC = () => {
  const [htmlInput, setHtmlInput] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descriptionText, setDescriptionText] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 300; // Max height for the textarea
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [htmlInput]);

  const handleGenerateImage = async () => {
    if (!htmlInput.trim()) {
      setError('Please enter some HTML content.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);
    setDescriptionText(null);

    try {
      // Step 1: Describe the HTML content using AI
      const description = await describeHtmlContent(htmlInput);
      setDescriptionText(description);

      // Step 2: Generate an image from the description using AI
      // For simplicity, we'll let the generateImageFromDescription handle aspect ratio defaults.
      // If you need specific dimensions, you could try to parse them from the HTML or have user inputs.
      const imageUrl = await generateImageFromDescription(description);
      setGeneratedImageUrl(imageUrl);

    } catch (e: any) {
      setError(e.message || 'An unknown error occurred during image generation.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (generatedImageUrl) {
        downloadImage(generatedImageUrl, 'ai_generated_from_html.jpg');
    }
  };

  const handleReset = () => {
    setHtmlInput('');
    setGeneratedImageUrl(null);
    setIsLoading(false);
    setError(null);
    setDescriptionText(null);
  };
  
  const LoadingSpinner = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg text-gray-300">
        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="mt-4 text-sm">Generating AI image...</span>
        {!descriptionText ? 
          <span className="text-xs text-gray-500 mt-1">First, AI is describing your HTML...</span> : 
          <span className="text-xs text-gray-500 mt-1">Now, AI is creating an image from the description...</span>
        }
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-zinc-900 rounded-lg p-6 space-y-4 border border-zinc-800">
            <h3 className="text-lg font-semibold text-white">1. Input HTML Content</h3>
            <p className="text-sm text-gray-400">Enter or paste your HTML. The AI will first describe it, then generate an image based on that description.</p>
            <textarea
              ref={textareaRef}
              className="custom-input font-mono text-xs !rounded-xl"
              placeholder="e.g., <div class='card'><h2>Hello World</h2></div>"
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
              disabled={isLoading}
            />
        </div>
        
        {descriptionText && !isLoading && (
            <div className="bg-zinc-900 rounded-lg p-6 space-y-3 border border-zinc-800">
                <h3 className="text-lg font-semibold text-white">2. AI's Understanding</h3>
                <div className="p-4 bg-black/50 rounded-md text-sm text-gray-300 italic border border-zinc-700">
                  "{descriptionText}"
                </div>
            </div>
        )}

        <div className="flex flex-col gap-4">
            <Button onClick={handleGenerateImage} isLoading={isLoading} icon={<AIIcon />}>
                Generate Image with AI
            </Button>
            <Button onClick={handleDownload} variant="secondary" disabled={!generatedImageUrl || isLoading} icon={<ArrowDownTrayIcon />}>
                Download Generated Image
            </Button>
            <Button onClick={handleReset} variant="outline" icon={<ArrowUturnLeftIcon />}>
                Start Over
            </Button>
        </div>

         {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
                <p className="font-semibold">Error:</p>
                <p>{error}</p>
            </div>
        )}
      </div>

      <div className="lg:col-span-7">
        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 sticky top-24">
            <h3 className="text-lg font-semibold text-white mb-4 px-2">3. Generated Image</h3>
            <div className="bg-black/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh] relative">
                {isLoading && <LoadingSpinner />}
                {!isLoading && !generatedImageUrl && (
                    <div className="text-center text-gray-500">
                        <p>Your AI-generated image will appear here.</p>
                    </div>
                )}
                {!isLoading && generatedImageUrl && (
                    <img
                        ref={imageRef}
                        src={generatedImageUrl}
                        alt="AI-generated from HTML description"
                        className="max-w-full object-contain rounded-md"
                        loading="lazy"
                    />
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default HtmlToImage;
