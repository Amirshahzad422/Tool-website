import { Metadata } from 'next';
import ColorPickerClient from './ColorPickerClient';

export const metadata: Metadata = {
  title: 'Color Picker - Toolbox',
  description: 'Advanced color picker with support for HEX, RGB, HSV, HSL, and CMYK color formats.',
};

export default function ColorPickerPage() {
  return <ColorPickerClient />;
}
