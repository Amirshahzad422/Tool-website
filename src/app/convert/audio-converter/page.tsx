import type { Metadata } from "next";
import AudioConverterClient from "./AudioConverterClient";

export const metadata: Metadata = {
  title: "Audio Converter",
  description: "Convert audio files between MP3, WAV, OGG, FLAC, AAC, M4A, and WMA formats. Fast, accurate, and easy-to-use audio conversion tool.",
  alternates: { canonical: "/convert/audio-converter" },
};

export default function AudioConverterPage() {
  return (
    <div className="bg-white">
              <div className="w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-40 min-h-screen">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              Audio Converter
            </h1>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Convert audio files between popular formats including MP3, WAV, OGG, FLAC, AAC, M4A, and WMA. Choose your preferred quality settings and download the converted audio file instantly.
            </p>
          </div>
          <AudioConverterClient />
          <div className="mt-24 h-40" />
        </div>
      </div>
    </div>
  );
}
