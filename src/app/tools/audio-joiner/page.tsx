import { Metadata } from 'next';
import AudioJoinerClient from './AudioJoinerClient';

export const metadata: Metadata = {
  title: 'Audio Joiner / Merger - Toolbox',
  description: 'Combine multiple audio files into one. Free online audio merger tool supporting MP3, WAV, M4A, and more formats.',
};

export default function AudioJoinerPage() {
  return <AudioJoinerClient />;
}

