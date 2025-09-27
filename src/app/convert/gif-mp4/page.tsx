import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GIF to MP4 Converter",
  description: "Convert animated GIF files to MP4 video format with high quality. Supports GIF format with optimized settings.",
  alternates: { canonical: "/convert/gif-mp4" },
};

import GifToMp4Client from "./GifToMp4Client";

export default function GifToMp4Page() {
  return (
    <div className="bg-white">
              <div className="w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-40 min-h-screen">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              GIF to MP4 Converter
            </h1>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Convert animated GIFs to MP4 video format with smooth playback. Perfect for creating high-quality videos from your animated GIFs.
            </p>
          </div>
          <GifToMp4Client />
          <div className="mt-24 h-40" />
        </div>
      </div>
    </div>
  );
}


