import React, { useState } from 'react';
import { TOOLS } from '../constants';
import { ChevronDownIcon, ChevronUpIcon } from '../components/icons';

const toolDescriptions: Record<string, React.ReactNode> = {
    'Collage Maker': (
        <div className="space-y-2">
            <p>Create beautiful photo collages from your images. This tool allows you to:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li>Upload up to 10 images to include in your collage.</li>
                <li>Drag and drop images to reorder them.</li>
                <li>Customize the grid layout by setting the number of rows and columns.</li>
                <li>Adjust the border width and color between images, or remove the border entirely.</li>
                <li>Choose from different border styles, such as solid grid or rounded corners.</li>
            </ul>
            <p>The tool automatically resizes and crops your images to fit perfectly within the grid cells, creating a clean and professional-looking result.</p>
        </div>
    ),
    'Image Stitching': (
         <div className="space-y-2">
            <p>Combine multiple images into one single, long image. This is perfect for stitching together panoramas, long screenshots, or comic strips.</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li>Upload two or more images.</li>
                <li>Drag and drop to arrange them in the correct order.</li>
                <li>Choose to stitch them together either <strong>horizontally</strong> (side-by-side) or <strong>vertically</strong> (top-to-bottom).</li>
            </ul>
            <p>The tool aligns the images edge-to-edge to create a seamless final picture.</p>
        </div>
    ),
    'AI Meme Generator': (
        <div className="space-y-2">
            <p>Instantly create funny memes with the power of AI. Simply upload an image, and our AI will suggest hilarious captions for you.</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li>Upload any image you think has meme potential.</li>
                <li>Click "Generate with AI" to get a clever top and bottom text suggestion.</li>
                <li>Manually edit the text to perfect your joke. The text uses the classic "Impact" font with a white fill and black stroke for maximum meme-ability.</li>
                <li>Download your creation and share it with the world!</li>
            </ul>
        </div>
    ),
    'AI Text Generator': (
        <div className="space-y-2">
            <p>A versatile writing assistant powered by the Gemini AI. Generate creative and useful text for any purpose.</p>
             <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li>Write a prompt describing what you want the AI to write (e.g., "a short poem about the moon," "three marketing slogans for a coffee shop").</li>
                <li>The AI will generate a text-based response based on your prompt.</li>
                <li>This tool is perfect for brainstorming ideas, overcoming writer's block, or quickly generating content.</li>
            </ul>
        </div>
    ),
    'Noise Generator': (
        <div className="space-y-2">
            <p>Create procedural noise textures with a highly customizable set of parameters. This tool is for artists and developers who need unique, generated patterns.</p>
             <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li>Set the exact dimensions (width/height) of your texture.</li>
                <li>Use a "Seed" for reproducible results, or randomize it for new patterns.</li>
                <li>Choose from different noise algorithms (e.g., Simplex, Value) and fractal types (e.g., FBM, Ridged) for different visual styles.</li>
                <li>Fine-tune parameters like Frequency, Amplitude, Octaves, Persistence, and Lacunarity to control the detail and complexity of the noise.</li>
                <li>Customize the background color and download your texture in PNG, JPG, or WEBP format.</li>
            </ul>
        </div>
    ),
    'Resize Image': (
        <div className="space-y-2">
            <p>Resize one or multiple images with powerful and flexible controls. This tool offers both bulk and individual adjustments.</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li><strong>Bulk Processing:</strong> Upload multiple images at once.</li>
                <li><strong>Global Settings:</strong> Use the main slider to set a resize percentage and apply it to all images simultaneously.</li>
                <li><strong>Individual Control:</strong> Each image gets its own control panel where you can resize by percentage or enter exact pixel dimensions (width/height).</li>
                <li><strong>Aspect Ratio Lock:</strong> Keep the original proportions of your images to avoid distortion.</li>
                <li><strong>Efficient UI:</strong> Collapse or expand controls for individual images or all at once to keep your workspace tidy.</li>
                <li>Download all resized images in a convenient ZIP file.</li>
            </ul>
        </div>
    ),
    'Rotate Image': (
         <div className="space-y-2">
            <p>Easily correct the orientation of your images. You can:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li>Rotate images in 90-degree increments with the "Rotate Left" and "Rotate Right" buttons.</li>
                <li>Use the slider for fine-grained control to rotate your image to any angle between 0 and 359 degrees.</li>
            </ul>
            <p>The canvas automatically adjusts its size to ensure no part of your rotated image is cropped.</p>
        </div>
    ),
    'Crop Image': (
         <div className="space-y-2">
            <p>Cut out parts of your image with precision. This feature includes:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li><strong>Freeform Cropping:</strong> Drag the handles to select any rectangular area you want.</li>
                <li><strong>Fixed Aspect Ratios:</strong> Choose from common ratios like 1:1 (square), 16:9 (widescreen), 4:3, and their portrait equivalents. This is great for social media posts.</li>
                <li><strong>Live Preview:</strong> See a preview of your cropped result in real-time as you adjust the selection.</li>
            </ul>
        </div>
    ),
    'Compress Image': (
         <div className="space-y-2">
            <p>Reduce the file size of your images for faster web loading and easier sharing, with support for bulk processing.</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li>Upload multiple images to compress them all with the same settings.</li>
                <li>Choose your desired output format: <strong>JPG</strong> (best for photos), <strong>WEBP</strong> (modern and efficient), or <strong>PNG</strong> (lossless, but larger file size).</li>
                <li>Adjust the quality/effort slider to find the perfect balance between file size and image quality.</li>
                <li>See a summary of the total size reduction before downloading all compressed images in a ZIP file.</li>
            </ul>
        </div>
    ),
    'Convert to JPG': (
         <div className="space-y-2">
            <p>Convert various image formats (like PNG, WEBP, BMP, GIF) into the universally compatible JPG format. This is a bulk-processing tool.</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li>Upload multiple images of different formats.</li>
                <li>Use the quality slider to control the compression level of the output JPG files.</li>
                <li>Convert all images with one click and download them as a ZIP file.</li>
            </ul>
        </div>
    ),
    'Convert from JPG': (
         <div className="space-y-2">
            <p>Convert your JPG images into other formats. This is useful when you need transparency (PNG) or modern web optimization (WEBP). This tool also supports bulk processing.</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li>Upload multiple JPG files.</li>
                <li>Choose an output format: <strong>PNG</strong> (for transparency), <strong>WEBP</strong> (for modern web use), or static <strong>GIF</strong>.</li>
                <li>For WEBP, you can adjust the quality slider to manage file size.</li>
                <li>Download all your converted images in a single ZIP file.</li>
            </ul>
        </div>
    ),
    'Remove Background': (
        <div className="space-y-2">
            <p>Automatically remove the background from an image using a powerful AI model. This tool is perfect for creating profile pictures, product photos, or graphic design elements.</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li>Upload an image with a clear subject (e.g., a person, car, or object).</li>
                <li>The AI will detect the foreground and erase the background, leaving a transparent result.</li>
                <li>Use the interactive slider to compare the original and the result.</li>
                <li>Download the final image as a transparent PNG file.</li>
            </ul>
             <p><strong>Note:</strong> This feature relies on an external API. You can use the default shared key or add your own personal key in "API Key Settings" for higher usage limits.</p>
        </div>
    ),
    'Upscale Image': (
        <div className="space-y-2">
            <p>Increase the resolution of your images using AI. This tool intelligently adds detail to make your photos look larger and clearer, which also has a sharpening effect.</p>
             <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li>Upload a low-resolution or small image.</li>
                <li>The AI model will analyze the image and upscale it, enhancing details and clarity.</li>
                <li>Use the interactive slider to compare the original and the upscaled version side-by-side.</li>
            </ul>
            <p><strong>Note:</strong> This feature relies on an external API. You can use the default shared key or add your own personal key in "API Key Settings" for higher usage limits.</p>
        </div>
    ),
    'Sharpen Image': (
        <div className="space-y-2">
            <p>Enhance the clarity and detail of your photos using an AI model. This tool is a specialized form of upscaling that focuses on making edges and textures crisper.</p>
             <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li>Upload a blurry or soft-focus image.</li>
                <li>The AI analyzes the image and intelligently sharpens details without adding significant noise.</li>
                <li>Use the interactive "before and after" slider to see the dramatic improvement in real-time.</li>
            </ul>
            <p><strong>Note:</strong> This feature relies on an external API. You can use the default shared key or add your own personal key in "API Key Settings" for higher usage limits.</p>
        </div>
    ),
    'Watermark Image': (
         <div className="space-y-2">
            <p>Add a custom watermark to your images to protect your work or add branding. You have full control over the watermark's appearance.</p>
             <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li>Choose between a <strong>text</strong> or <strong>image</strong> watermark.</li>
                <li>Customize text, color, size, opacity, and position.</li>
                <li>Upload your own logo (a transparent PNG is recommended) to use as an image watermark.</li>
                <li>Enable the <strong>tiling</strong> option to repeat the watermark across the entire image for maximum protection.</li>
            </ul>
        </div>
    ),
    'Pick Color From Image': (
        <div className="space-y-2">
            <p>Extract a beautiful color palette from any uploaded image. This tool is perfect for designers, artists, and developers looking for inspiration.</p>
             <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li>Upload an image to automatically analyze its most prominent colors.</li>
                <li>A palette of up to 12 dominant colors is generated.</li>
                <li>Simply click on any color swatch in the palette to copy its HEX code to your clipboard.</li>
            </ul>
        </div>
    ),
    'HTML to Image': (
        <div className="space-y-2">
            <p>A unique, two-step AI tool that converts HTML code into a visual representation. It does not render the HTML directly, but interprets it creatively.</p>
             <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li><strong>Step 1:</strong> You provide HTML code. An AI model analyzes it and generates a concise text description of its content and purpose.</li>
                <li><strong>Step 2:</strong> That text description is then fed to another AI model which generates an image based on the description.</li>
                <li>The AI's intermediate text description is shown to you, providing insight into its "understanding" of your code.</li>
            </ul>
             <p>This is a creative tool for visualizing web components, email templates, or any HTML snippet in an artistic way.</p>
        </div>
    ),
    'Image to PDF': (
         <div className="space-y-2">
            <p>Combine multiple images into a single, easy-to-share PDF document.</p>
             <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li>Upload multiple images.</li>
                <li>Drag and drop to reorder the images, which will determine their page order in the PDF.</li>
                <li>Customize PDF settings like page size (A4, Letter, etc.), orientation (portrait/landscape), and margins.</li>
                <li>Optionally upscale smaller images to match the dimensions of the largest one for a consistent look.</li>
            </ul>
        </div>
    ),
    'PDF to Image': (
         <div className="space-y-2">
            <p>Extract pages from a PDF document and convert them into high-quality images.</p>
             <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li>Upload a PDF file.</li>
                <li>Specify a page range to convert (e.g., "all", "1-5", "3,7,9").</li>
                <li>Set the desired output resolution (DPI) and image format (PNG, JPG, WEBP).</li>
                <li>Preview the converted images, select the ones you need, and download them individually or as a ZIP file.</li>
            </ul>
        </div>
    ),
    'Image Splitter': (
        <div className="space-y-2">
            <p>Divide a single image into multiple smaller pieces or tiles. This is ideal for creating grid posts for social media (like Instagram), preparing assets for game development, or simply breaking up a large image.</p>
             <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                <li>Choose your split method: <strong>Horizontal</strong> (into rows), <strong>Vertical</strong> (into columns), or a full <strong>Grid</strong> (rows and columns).</li>
                <li>Specify the exact number of rows and/or columns you want.</li>
                <li>The tool precisely calculates and slices the image, ensuring no pixels are lost.</li>
                <li>Preview all the resulting tiles, select the ones you want, and download them as a ZIP file.</li>
            </ul>
        </div>
    ),
};


const FaqPage: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0); // Start with the first item open

    // Fix: Moved from module scope to component scope to prevent circular dependency error.
    // Exclude FAQ and API Settings from appearing in the FAQ list itself
    const faqTools = TOOLS.filter(tool => tool.name !== 'API Key Settings' && tool.name !== 'FAQ');

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="max-w-4xl mx-auto page-enter-animation">
            <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                    Frequently Asked Questions
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                    Find detailed information about each tool in the Image Toolbox Pro.
                </p>
            </div>

            <div className="space-y-4">
                {faqTools.map((tool, index) => (
                    <div key={tool.name} className="bg-gray-800/60 border border-gray-700/80 rounded-lg overflow-hidden transition-all duration-300">
                        <button
                            onClick={() => toggleFaq(index)}
                            className="w-full flex justify-between items-center p-5 text-left text-lg font-semibold text-gray-100 hover:bg-gray-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                            aria-expanded={openIndex === index}
                        >
                            <span className="flex items-center gap-4">
                                <span className="text-2xl text-teal-300">{tool.icon}</span>
                                {tool.name}
                            </span>
                            <span>
                                {openIndex === index ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
                            </span>
                        </button>
                        <div
                            className={`transition-all duration-500 ease-in-out overflow-hidden ${openIndex === index ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                            <div className="p-5 pt-0">
                               <div className="border-t border-gray-700 pt-4 text-gray-300 prose prose-invert max-w-none prose-p:my-2 prose-ul:my-2">
                                {toolDescriptions[tool.name] || <p>No detailed description available for this tool yet.</p>}
                               </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FaqPage;