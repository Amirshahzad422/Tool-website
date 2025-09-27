import type { Metadata } from "next";
import ApngToGifClient from "./ApngToGifClient";

export const metadata: Metadata = {
  title: "APNG to GIF Converter",
  description: "Convert APNG files to GIF format online.",
  alternates: { canonical: "/convert/apng-gif" },
};

export default function Page() {
  return (
    <div className="bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-40 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">APNG to GIF Converter</h1>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Coming soon. This tool will convert APNG files to GIF.
            </p>
          </div>
          <ApngToGifClient />
          <div className="mt-24 h-40" />
        </div>
      </div>
    </div>
  );
} 