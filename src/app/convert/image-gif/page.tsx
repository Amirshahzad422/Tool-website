import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image to GIF Converter",
  description: "Convert multiple image files into an animated GIF with high quality. Supports JPG, PNG, WEBP formats with customizable settings.",
  alternates: { canonical: "/convert/image-gif" },
};

import ImageToGifClient from "./ImageToGifClient";

export default function ImageToGifPage() {
  return (
    <div className="bg-white">
              <div className="w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-40 min-h-screen">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              Image to GIF Converter
            </h1>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Convert multiple images into an animated GIF with customizable settings. Perfect for creating slideshows, animations, and visual sequences.
            </p>
          </div>
          <ImageToGifClient />
          <div className="mt-24 h-40" />
        </div>
      </div>
    </div>
  );
}
