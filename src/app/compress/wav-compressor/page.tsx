import { Metadata } from 'next';
import WAVCompressorClient from './WAVCompressorClient';

export const metadata: Metadata = {
  title: 'WAV Compressor - Compress WAV Files Online | Free Tool',
  description: 'Compress WAV files online for free. Reduce WAV file size by downsampling or converting to MP3. Support for various bit depths and sample rates.',
  alternates: {
    canonical: '/compress/wav-compressor',
  },
};

export default function WAVCompressorPage() {
  return (
    <div className="bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-40 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
              WAV Compressor
            </h1>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Compress your WAV files to reduce file size. Choose between downsampling 
              the WAV file or converting to MP3 for maximum compression.
            </p>
          </div>
          
          <WAVCompressorClient />
        </div>
      </div>
    </div>
  );
}
