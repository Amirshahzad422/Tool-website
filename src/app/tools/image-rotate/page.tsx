import { Metadata } from 'next';
import ImageRotateClient from './ImageRotateClient';

export const metadata: Metadata = {
  title: 'Rotate Image - Toolbox',
  description: 'Rotate any image online with our advanced image rotation tool. Free, fast, and easy to use with rotation and straightening options.',
};

export default function ImageRotatePage() {
  return <ImageRotateClient />;
}

