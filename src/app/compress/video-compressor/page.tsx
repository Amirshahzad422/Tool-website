import { Metadata } from 'next';
import VideoCompressorClient from './VideoCompressorClient';

export const metadata: Metadata = {
  title: 'Video Compressor - Compress Video Files Online | Free Tool',
  description: 'Compress video files online for free. Reduce video file size while maintaining quality. Support for MP4, AVI, MOV, and more formats.',
  alternates: {
    canonical: '/compress/video-compressor',
  },
};

export default function VideoCompressorPage() {
  return (
    <div className="bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-40 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
              Video Compressor
            </h1>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Compress your video files to reduce file size while maintaining quality. 
              Support for MP4, AVI, MOV, WEBM, and more formats.
            </p>
          </div>
          
          <VideoCompressorClient />
        </div>
      </div>
    </div>
  );
}
