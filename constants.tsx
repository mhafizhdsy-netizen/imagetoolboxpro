
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
  GridIcon // New Import for Grid Icon
} from './components/icons';

// Import feature components
import AITextGenerator from './features/AITextGenerator';
import MemeGenerator from './features/MemeGenerator';
import ResizeImage from './features/ResizeImage';
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


export const TOOLS: Tool[] = [
  { name: 'AI Meme Generator', icon: <AIIcon />, component: MemeGenerator, description: 'Buat meme viral dengan teks yang dihasilkan AI berdasarkan gambar Anda.' },
  { name: 'AI Text Generator', icon: <DocumentIconSidebar />, component: AITextGenerator, description: 'Hasilkan teks kreatif untuk tujuan apa pun dengan kekuatan AI.' },
  { name: 'Resize Image', icon: <ResizeIcon />, component: ResizeImage, description: 'Ubah ukuran dimensi gambar Anda menjadi ukuran yang tepat dalam piksel.' },
  { name: 'Rotate Image', icon: <RotateIcon />, component: RotateImage, description: 'Putar gambar Anda dengan mudah ke sudut yang sempurna.' },
  { name: 'Crop Image', icon: <CropIcon />, component: CropImage, description: 'Potong gambar dengan rasio aspek tetap atau pemotongan bentuk bebas.' },
  { name: 'Compress Image', icon: <CompressIcon />, component: CompressImage, description: 'Kurangi ukuran file gambar Anda dengan kualitas yang dapat disesuaikan.' },
  { name: 'Convert to JPG', icon: <ConvertToJpgIcon />, component: ConvertToJpg, description: 'Konversi gambar PNG, WEBP, atau format lain ke format JPG.' },
  { name: 'Convert from JPG', icon: <ConvertToJpgIcon />, component: ConvertFromJpg, description: 'Konversi gambar JPG ke format PNG, WEBP, atau format lainnya.' },
  { name: 'Remove Background', icon: <RemoveBgIcon />, component: RemoveBackground, description: 'Hapus latar belakang secara otomatis dari gambar dengan AI.' },
  { name: 'Upscale Image', icon: <UpscaleIcon />, component: UpscaleImage, description: 'Tingkatkan resolusi gambar Anda menggunakan AI untuk kualitas yang lebih tinggi.' },
  { name: 'Sharpen Image', icon: <SharpenIcon />, component: ImageSharpen, description: 'Tingkatkan detail dan pertajam gambar Anda dengan AI.' },
  // { name: 'Blur Faces', icon: <BlurIcon />, component: BlurFace, description: 'Deteksi dan buramkan wajah secara otomatis untuk melindungi privasi.' }, // Removed
  { name: 'Watermark Image', icon: <WatermarkIcon />, component: WatermarkImage, description: 'Tambahkan teks atau logo kustom sebagai watermark pada gambar Anda.' },
  { name: 'Pick Color From Image', icon: <ColorSwatchIcon />, component: ColorFromImage, description: 'Ekstrak palet warna yang dominan dari gambar apa pun.' }, // Renamed
  // Removed 'Photo Editor' entry
  { name: 'HTML to Image', icon: <DocumentIconSidebar />, component: HtmlToImage, description: 'Konversi cuplikan kode HTML menjadi gambar dengan AI.' },
  { name: 'Image to PDF', icon: <PdfIcon />, component: ImageToPdf, description: 'Gabungkan banyak gambar menjadi satu dokumen PDF.' }, // New Tool
  { name: 'PDF to Image', icon: <PdfIcon />, component: PdfToImage, description: 'Konversi dokumen PDF menjadi serangkaian gambar.' }, // New Tool
  { name: 'Image Splitter', icon: <GridIcon />, component: ImageSplitter, description: 'Bagi gambar besar menjadi beberapa bagian yang lebih kecil berdasarkan baris dan kolom.' }, // New Tool
  { name: 'API Key Settings', icon: <GearIcon />, component: ApiKeyManager, description: 'Kelola kunci API Anda untuk layanan pihak ketiga.' },
];