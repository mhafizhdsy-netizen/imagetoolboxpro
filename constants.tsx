import React from 'react';
import type { Tool } from './types';
import {
  AIIcon,
  ResizeIcon,
  RotateIcon,
  ConvertToJpgIcon,
  CompressIcon,
  CropIcon,
  UpscaleIcon,
  RemoveBgIcon,
  WatermarkIcon,
  // Removed BlurIcon
  SharpenIcon,
  GearIcon,
  ColorSwatchIcon,
  DocumentIconSidebar, // Changed from DocumentIcon
  PdfIcon, // New Import for PDF Icon
  GridIcon, // New Import for Grid Icon
  NoiseIcon, // New Import for Noise Icon
  CollageIcon, // New Import for Collage Icon
  StitchIcon, // New Import for Stitch Icon
  QuestionMarkCircleIcon, // New Import for FAQ Icon
} from './components/icons';

// Import feature components
import AITextGenerator from './features/AITextGenerator';
import MemeGenerator from './features/MemeGenerator';
import { ResizeImage } from './features/ResizeImage';
import RotateImage from './features/RotateImage';
import ConvertToJpg from './features/ConvertToJpg';
import CompressImage from './features/CompressImage';
import CropImage from './features/CropImage';
import ConvertFromJpg from './features/ConvertFromJpg';
import UpscaleImage from './features/UpscaleImage';
import RemoveBackground from './features/RemoveBackground';
import WatermarkImage from './features/WatermarkImage';
// Removed BlurFace import
import ImageSharpen from './features/ImageSharpen';
import ApiKeyManager from './features/ApiKeyManager';
import ColorFromImage from './features/ColorFromImage';
import HtmlToImage from './features/HtmlToImage';
import ImageToPdf from './features/ImageToPdf'; // New import for ImageToPdf
import PdfToImage from './features/PdfToImage'; // New import for PdfToImage
import ImageSplitter from './features/ImageSplitter'; // New import for ImageSplitter
import NoiseGenerator from './features/NoiseGenerator'; // New import for NoiseGenerator
import CollageMaker from './features/CollageMaker'; // New import for CollageMaker
import ImageStitching from './features/ImageStitching'; // New import for ImageStitching
import FaqPage from './features/FaqPage'; // New import for FAQ page


export const TOOLS: Tool[] = [
  { name: 'Collage Maker', icon: <CollageIcon />, component: CollageMaker, description: 'Create collages from up to 10 of your images.' },
  { name: 'Image Stitching', icon: <StitchIcon />, component: ImageStitching, description: 'Combine given images to get one large image.' },
  { name: 'AI Meme Generator', icon: <AIIcon />, component: MemeGenerator, description: 'Create viral memes with AI-generated text based on your image.' },
  { name: 'AI Text Generator', icon: <DocumentIconSidebar />, component: AITextGenerator, description: 'Generate creative text for any purpose with the power of AI.' },
  { name: 'Noise Generator', icon: <NoiseIcon />, component: NoiseGenerator, description: 'Generate procedural noise textures with customizable parameters.' }, // New Tool
  { name: 'Resize Image', icon: <ResizeIcon />, component: ResizeImage, description: 'Resize the dimensions of your image to exact pixel sizes.' },
  { name: 'Rotate Image', icon: <RotateIcon />, component: RotateImage, description: 'Easily rotate your image to the perfect angle.' },
  { name: 'Crop Image', icon: <CropIcon />, component: CropImage, description: 'Crop images with fixed aspect ratios or freeform cropping.' },
  { name: 'Compress Image', icon: <CompressIcon />, component: CompressImage, description: 'Reduce the file size of your images with adjustable quality.' },
  { name: 'Convert to JPG', icon: <ConvertToJpgIcon />, component: ConvertToJpg, description: 'Convert PNG, WEBP, or other image formats to the JPG format.' },
  { name: 'Convert from JPG', icon: <ConvertToJpgIcon />, component: ConvertFromJpg, description: 'Convert JPG images to PNG, WEBP, or other formats.' },
  { name: 'Remove Background', icon: <RemoveBgIcon />, component: RemoveBackground, description: 'Automatically remove the background from images with AI.' },
  { name: 'Upscale Image', icon: <UpscaleIcon />, component: UpscaleImage, description: 'Increase the resolution of your images using AI for higher quality.' },
  { name: 'Sharpen Image', icon: <SharpenIcon />, component: ImageSharpen, description: 'Enhance details and sharpen your images with AI.' },
  // { name: 'Blur Faces', icon: <BlurIcon />, component: BlurFace, description: 'Automatically detect and blur faces to protect privacy.' }, // Removed
  { name: 'Watermark Image', icon: <WatermarkIcon />, component: WatermarkImage, description: 'Add custom text or a logo as a watermark to your images.' },
  { name: 'Pick Color From Image', icon: <ColorSwatchIcon />, component: ColorFromImage, description: 'Extract the dominant color palette from any image.' }, // Renamed
  // Removed 'Photo Editor' entry
  { name: 'HTML to Image', icon: <DocumentIconSidebar />, component: HtmlToImage, description: 'Convert HTML code snippets into images with AI.' },
  { name: 'Image to PDF', icon: <PdfIcon />, component: ImageToPdf, description: 'Combine multiple images into a single PDF document.' }, // New Tool
  { name: 'PDF to Image', icon: <PdfIcon />, component: PdfToImage, description: 'Convert a PDF document into a series of images.' }, // New Tool
  { name: 'Image Splitter', icon: <GridIcon />, component: ImageSplitter, description: 'Split a large image into several smaller parts based on rows and columns.' }, // New Tool
  { name: 'FAQ', icon: <QuestionMarkCircleIcon />, component: FaqPage, description: 'Find answers to common questions about the tools.' },
  { name: 'API Key Settings', icon: <GearIcon />, component: ApiKeyManager, description: 'Manage your API keys for third-party services.' },
];