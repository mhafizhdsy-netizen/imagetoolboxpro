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
      // If we wanted to specify width/height, we could add inputs for them.
      const resultImageUrl = await generateImageFromDescription(description);
      setGeneratedImageUrl(resultImageUrl);
    } catch (e: any) {
      console.error('Error generating image from HTML:', e);
      setError(e.message || 'Failed to generate image from HTML.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedImageUrl) {
      downloadImage(generatedImageUrl, 'html-screenshot.jpeg');
    }
  };

  const handleReset = () => {
    setHtmlInput('');
    setGeneratedImageUrl(null);
    setIsLoading(false);
    setError(null);
    setDescriptionText(null);
  };

  const AIInfoBox = () => (
    <div className="p-4 bg-gray-900/70 text-gray-400 border border-gray-700 rounded-lg text-sm">
        <p><span className="font-semibold text-teal-400">Powered by AI:</span> This tool first uses AI to understand your HTML, then generates an image based on that understanding. Complex layouts may require more descriptive HTML or prompts.</p>
        <p className="mt-2">Image generation can take a few moments. For optimal results, keep HTML concise and clear.</p>
    </div>
  );

  const LoadingSpinner = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
        <h2 className="text-lg font-semibold text-white">
          HTML to Image Converter
        </h2>
        <AIInfoBox />
        <div className="relative">
          <label htmlFor="html-input" className="sr-only">HTML Content</label>
          <textarea
            ref={textareaRef}
            id="html-input"
            rows={5}
            className="custom-input text-base resize-none block w-full pr-36"
            placeholder="e.g., <h1>Hello World!</h1><p>This is a simple paragraph.</p>"
            value={htmlInput}
            onChange={(e) => setHtmlInput(e.target.value)}
            disabled={isLoading}
          />
          <div className="absolute bottom-3 right-3">
            <Button
              onClick={handleGenerateImage}
              isLoading={isLoading}
              icon={<AIIcon />}
              disabled={!htmlInput.trim() || isLoading}
              aria-label="Generate Image"
            >
              Generate Image
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

      {(isLoading || generatedImageUrl) && (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 px-2">Result Preview</h3>
            <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center min-h-[40vh] relative">
              {isLoading && <LoadingSpinner />}
              {generatedImageUrl && !isLoading ? (
                  <img ref={imageRef} src={generatedImageUrl} alt="Generated from HTML" className="max-w-full object-contain rounded-md" />
              ) : !isLoading && (
                  <div className="text-gray-400 text-sm p-4 text-center">Your image will appear here</div>
              )}
            </div>
            {descriptionText && !isLoading && (
                <div className="mt-4 p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg text-sm text-teal-300">
                    <p className="font-semibold">AI's understanding:</p>
                    <p>{descriptionText}</p>
                </div>
            )}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Button onClick={handleDownload} variant="secondary" disabled={!generatedImageUrl} icon={<ArrowDownTrayIcon />}>
          Download Image
        </Button>
        <Button onClick={handleReset} variant="outline" icon={<ArrowUturnLeftIcon />} disabled={!htmlInput && !generatedImageUrl}>
          Start Over
        </Button>
      </div>
    </div>
  );
};

export default HtmlToImage;