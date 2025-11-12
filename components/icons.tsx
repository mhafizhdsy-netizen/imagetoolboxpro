

import React from 'react';

// Wrapper untuk menghindari pengulangan pengetikan React.FC
const Icon: React.FC<{ faClass: string }> = ({ faClass }) => <i className={faClass}></i>;

// Ikon untuk Sidebar (dengan fa-fw untuk perataan lebar tetap)
export const AIIcon: React.FC = () => <Icon faClass="fa-solid fa-wand-magic-sparkles fa-fw" />;
export const DocumentIconSidebar: React.FC = () => <Icon faClass="fa-solid fa-file-lines fa-fw" />; // Renamed from DocumentIcon
export const ResizeIcon: React.FC = () => <Icon faClass="fa-solid fa-expand fa-fw" />;
export const RotateIcon: React.FC = () => <Icon faClass="fa-solid fa-rotate fa-fw" />;
export const CropIcon: React.FC = () => <Icon faClass="fa-solid fa-crop-simple fa-fw" />;
export const CompressIcon: React.FC = () => <Icon faClass="fa-solid fa-compress fa-fw" />;
export const ConvertToJpgIcon: React.FC = () => <Icon faClass="fa-solid fa-file-arrow-down fa-fw" />;
export const RemoveBgIcon: React.FC = () => <Icon faClass="fa-solid fa-wand-magic fa-fw" />;
export const UpscaleIcon: React.FC = () => <Icon faClass="fa-solid fa-up-right-and-down-left-from-center fa-fw" />;
export const SharpenIcon: React.FC = () => <Icon faClass="fa-solid fa-diamond fa-fw" />;
export const BlurIcon: React.FC = () => <Icon faClass="fa-solid fa-face-meh-blank fa-fw" />;
export const WatermarkIcon: React.FC = () => <Icon faClass="fa-solid fa-water fa-fw" />;
export const ColorSwatchIcon: React.FC = () => <Icon faClass="fa-solid fa-palette fa-fw" />;
export const GearIcon: React.FC = () => <Icon faClass="fa-solid fa-gear fa-fw" />;
export const PdfIcon: React.FC = () => <Icon faClass="fa-solid fa-file-pdf fa-fw" />; // New PDF Icon
export const GridIcon: React.FC = () => <Icon faClass="fa-solid fa-table-cells fa-fw" />; // New Grid Icon

// Ikon yang digunakan di bagian lain UI (tombol, header, dll.) - tidak perlu fa-fw
export const AppIcon: React.FC = () => <Icon faClass="fa-solid fa-toolbox" />;
export const XMarkIcon: React.FC = () => <Icon faClass="fa-solid fa-xmark" />;
export const Bars3Icon: React.FC = () => <Icon faClass="fa-solid fa-bars" />;
export const PhotoIcon: React.FC = () => <Icon faClass="fa-solid fa-image" />;
export const DocumentIconNoFw: React.FC = () => <Icon faClass="fa-solid fa-file-lines" />; // New icon without fa-fw
export const ArrowDownTrayIcon: React.FC = () => <Icon faClass="fa-solid fa-download" />;
export const ArrowUturnLeftIcon: React.FC = () => <Icon faClass="fa-solid fa-arrow-rotate-left" />;
export const ArrowUturnRightIcon: React.FC = () => <Icon faClass="fa-solid fa-arrow-rotate-right" />;
export const ViewfinderCircleIcon: React.FC = () => <Icon faClass="fa-solid fa-crosshairs" />;
export const CheckIcon: React.FC = () => <Icon faClass="fa-solid fa-check" />;

// Ekspor ulang AIIcon sebagai SparklesIcon untuk kompatibilitas jika diperlukan
export const SparklesIcon: React.FC = () => <Icon faClass="fa-solid fa-wand-magic-sparkles" />;