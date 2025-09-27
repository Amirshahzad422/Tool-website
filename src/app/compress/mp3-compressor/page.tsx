import { Metadata } from 'next';
import MP3CompressorClient from './MP3CompressorClient';

export const metadata: Metadata = {
  title: 'MP3 Compressor - Compress MP3 Files Online | Free Tool',
  description: 'Compress MP3 files online for free. Reduce MP3 file size by lowering bitrate while maintaining audio quality. Support for various bitrates and encoding modes.',
  alternates: {
    canonical: '/compress/mp3-compressor',
  },
};

export default function MP3CompressorPage() {
  return (
    <div className="bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-40 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
              MP3 Compressor
            </h1>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Compress your MP3 files to reduce file size by lowering bitrate. 
              Choose from various quality settings to balance file size and audio quality.
            </p>
          </div>
          
          <MP3CompressorClient />
        </div>
      </div>
    </div>
  );
}
