import type { Metadata } from "next";
import SvgConverterClient from "./SvgConverterClient";

export const metadata: Metadata = {
  title: "SVG to PNG",
  description: "Convert SVG images to PNG format with high quality and transparency support.",
  alternates: { canonical: "/convert/svg-converter" },
};

export default function SvgConverterPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 pt-16 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              SVG to PNG Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert SVG images to PNG format with high quality and transparency support.
            </p>
          </div>
          
          <SvgConverterClient />
        </div>
      </div>
    </div>
  );
}
