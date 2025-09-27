import type { Metadata } from "next";
import GifCompressorClient from "./GifCompressorClient";

export const metadata: Metadata = {
  title: "GIF Compressor",
  description: "Compress GIFs by reducing fps, colors, and dimensions.",
  alternates: { canonical: "/compress/gif-compressor" },
};

export default function GifCompressorPage() {
  return (
    <div className="bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-40 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">GIF Compressor</h1>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Compress animated GIF files by reducing frame rate, colors, and dimensions.
              Optimize GIFs for web use while maintaining visual quality.
            </p>
          </div>
          <GifCompressorClient />
        </div>
      </div>
    </div>
  );
}


