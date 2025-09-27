import type { Metadata } from "next";
import GifToApngClient from "./GifToApngClient";

export const metadata: Metadata = {
  title: "GIF to APNG Converter",
  description: "Convert GIF files to APNG format online.",
  alternates: { canonical: "/convert/gif-apng" },
};

export default function Page() {
  return (
    <div className="bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-40 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">GIF to APNG Converter</h1>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Convert animated GIFs to APNG format while preserving transparency.
            </p>
          </div>
          <GifToApngClient />
          <div className="mt-24 h-40" />
        </div>
      </div>
    </div>
  );
} 