import { Metadata } from 'next';
import ImageCropperClient from './ImageCropperClient';

export const metadata: Metadata = {
  title: 'Image Cropper - Toolbox',
  description: 'Crop any image online with our advanced image cropper tool. Free, fast, and easy to use.',
};

export default function ImageCropperPage() {
  return <ImageCropperClient />;
}
