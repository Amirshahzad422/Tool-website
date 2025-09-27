import type { Metadata } from "next";
import JpegCompressorClient from "./JpegCompressorClient";

export const metadata: Metadata = {
  title: "JPEG Compressor",
  description: "Compress JPEG images with adjustable quality and advanced options.",
  alternates: { canonical: "/compress/jpeg-compressor" },
};

export default function JpegCompressorPage() {
  return (
    <div className="bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-40 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">JPEG Compressor</h1>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Compress .jpg and .jpeg images in your browser. Control quality, enable progressive encoding and optimize using MozJPEG.
            </p>
          </div>
          <JpegCompressorClient />
        </div>
      </div>
    </div>
  );
}


