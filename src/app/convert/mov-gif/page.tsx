import type { Metadata } from "next";
import MovToGifClient from "./MovToGifClient";

export const metadata: Metadata = {
  title: "MOV to GIF Converter",
  description: "Convert MOV video files to GIF animations online, for free.",
  alternates: { canonical: "/convert/mov-gif" },
};

export default function Page() {
  return (
    <div className="bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-40 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">MOV to GIF Converter</h1>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Best tool to convert MOV to GIF animations online, for free.
            </p>
          </div>
          <MovToGifClient />
          <div className="mt-24 h-40" />
        </div>
      </div>
    </div>
  );
} 