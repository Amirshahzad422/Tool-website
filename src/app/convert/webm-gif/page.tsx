import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WEBM to GIF Converter",
  description: "Convert WEBM video files to animated GIF format with high quality. Supports WEBM format with optimized settings.",
  alternates: { canonical: "/convert/webm-gif" },
};

import WebmToGifClient from "./WebmToGifClient";

export default function WebmToGifPage() {
  return (
    <div className="bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-40 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              WEBM to GIF Converter
            </h1>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Convert WEBM video files to animated GIF format with optimized quality. Perfect for creating shareable animated content from your WEBM videos.
            </p>
          </div>
          <WebmToGifClient />
          <div className="mt-24 h-40" />
        </div>
      </div>
    </div>
  );
}


