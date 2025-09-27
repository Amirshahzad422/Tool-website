import type { Metadata } from "next";
import PdfCompressorClient from "./PdfCompressorClient";

export const metadata: Metadata = {
  title: "PDF Compressor",
  description: "Compress PDFs by downscaling embedded images and re-saving.",
  alternates: { canonical: "/compress/pdf-compressor" },
};

export default function PdfCompressorPage() {
  return (
    <div className="bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-40 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">PDF Compressor</h1>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Compress PDF files by optimizing embedded images, reducing DPI, and applying advanced compression techniques.
              Reduce file size while maintaining document quality.
            </p>
          </div>
          <PdfCompressorClient />
        </div>
      </div>
    </div>
  );
}


