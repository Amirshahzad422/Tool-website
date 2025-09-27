import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MP4 to GIF Converter",
  description: "Best tool to convert MP4 to GIF animations online, for free.",
  alternates: { canonical: "/convert/mp4-gif" },
};

import Mp4ToGifClient from "./Mp4ToGifClient";

export default function Mp4ToGifPage() {
  return (
    <div className="bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-40 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              MP4 to GIF Converter
            </h1>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Best tool to convert MP4 to GIF animations online, for free.
            </p>
          </div>
          <Mp4ToGifClient />
          <div className="mt-24 h-40" />
        </div>
      </div>
    </div>
  );
}


