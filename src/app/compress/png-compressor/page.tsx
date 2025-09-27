import type { Metadata } from "next";
import PngCompressorClient from "./PngCompressorClient";

export const metadata: Metadata = {
  title: "PNG Compressor",
  description: "Compress PNG images with palette and compression optimizations.",
  alternates: { canonical: "/compress/png-compressor" },
};

export default function PngCompressorPage() {
  return (
    <div className="bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-40 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">PNG Compressor</h1>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Compress .png images in your browser or via server. Tune compression level and palette optimization.
            </p>
          </div>
          <PngCompressorClient />
        </div>
      </div>
    </div>
  );
}


