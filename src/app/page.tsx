import Link from 'next/link';
import { FaTools } from "react-icons/fa";

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FaTools className="w-12 h-12 text-[#080c2a]" />
            <h1 className="text-4xl font-bold text-gray-900">Toolbox</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive collection of conversion and compression tools for multimedia files
          </p>
        </div>

        {/* Convert Tools */}
        <div className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Convert Tools</h2>
            <p className="text-gray-600">Transform files from one format to another</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Video & Audio */}
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">🎵 Video & Audio</h3>
              <div className="space-y-3">
                <Link href="/convert/audio-converter" className="block text-gray-700 hover:text-[#080c2a] transition-colors">Audio Converter</Link>
                <Link href="/convert/mp3-converter" className="block text-gray-700 hover:text-[#080c2a] transition-colors">MP3 Converter</Link>
                <Link href="/convert/mp4-mp3" className="block text-gray-700 hover:text-[#080c2a] transition-colors">MP4 to MP3</Link>
                <Link href="/convert/video-mp3" className="block text-gray-700 hover:text-[#080c2a] transition-colors">Video to MP3</Link>
                <Link href="/convert/mp4-converter" className="block text-gray-700 hover:text-[#080c2a] transition-colors">MP4 Converter</Link>
                <Link href="/convert/mov-mp4" className="block text-gray-700 hover:text-[#080c2a] transition-colors">MOV to MP4</Link>
                <Link href="/convert/mp3-ogg" className="block text-gray-700 hover:text-[#080c2a] transition-colors">MP3 to OGG</Link>
              </div>
            </div>

            {/* Image */}
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">🖼️ Image</h3>
              <div className="space-y-3">
                <Link href="/convert/image-converter" className="block text-gray-700 hover:text-[#080c2a] transition-colors">Image Converter</Link>
                <Link href="/convert/webp-png" className="block text-gray-700 hover:text-[#080c2a] transition-colors">WEBP to PNG</Link>
                <Link href="/convert/jfif-png" className="block text-gray-700 hover:text-[#080c2a] transition-colors">JFIF to PNG</Link>
                <Link href="/convert/heic-jpg" className="block text-gray-700 hover:text-[#080c2a] transition-colors">HEIC to JPG</Link>
                <Link href="/convert/heic-png" className="block text-gray-700 hover:text-[#080c2a] transition-colors">HEIC to PNG</Link>
                <Link href="/convert/webp-jpg" className="block text-gray-700 hover:text-[#080c2a] transition-colors">WEBP to JPG</Link>
                <Link href="/convert/svg-converter" className="block text-gray-700 hover:text-[#080c2a] transition-colors">SVG to PNG</Link>
              </div>
            </div>

            {/* PDF & Documents */}
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">📄 PDF & Documents</h3>
              <div className="space-y-3">
                <Link href="/convert/pdf-to-images" className="block text-gray-700 hover:text-[#080c2a] transition-colors">PDF to Images</Link>
                <Link href="/convert/image-to-pdf" className="block text-gray-700 hover:text-[#080c2a] transition-colors">Image to PDF</Link>
                <Link href="/convert/heic-pdf" className="block text-gray-700 hover:text-[#080c2a] transition-colors">HEIC to PDF</Link>
                <Link href="/convert/jpg-pdf" className="block text-gray-700 hover:text-[#080c2a] transition-colors">JPG to PDF</Link>
              </div>
            </div>

            {/* GIF */}
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">🎞️ GIF</h3>
              <div className="space-y-3">
                <Link href="/convert/video-gif" className="block text-gray-700 hover:text-[#080c2a] transition-colors">Video to GIF</Link>
                <Link href="/convert/mp4-gif" className="block text-gray-700 hover:text-[#080c2a] transition-colors">MP4 to GIF</Link>
                <Link href="/convert/webm-gif" className="block text-gray-700 hover:text-[#080c2a] transition-colors">WEBM to GIF</Link>
                <Link href="/convert/apng-gif" className="block text-gray-700 hover:text-[#080c2a] transition-colors">APNG to GIF</Link>
                <Link href="/convert/gif-mp4" className="block text-gray-700 hover:text-[#080c2a] transition-colors">GIF to MP4</Link>
                <Link href="/convert/gif-apng" className="block text-gray-700 hover:text-[#080c2a] transition-colors">GIF to APNG</Link>
                <Link href="/convert/image-gif" className="block text-gray-700 hover:text-[#080c2a] transition-colors">Image to GIF</Link>
                <Link href="/convert/mov-gif" className="block text-gray-700 hover:text-[#080c2a] transition-colors">MOV to GIF</Link>
                <Link href="/convert/avi-gif" className="block text-gray-700 hover:text-[#080c2a] transition-colors">AVI to GIF</Link>
              </div>
            </div>

            {/* Utilities */}
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">📏 Utilities</h3>
              <div className="space-y-3">
                <Link href="/convert/unit-converter" className="block text-gray-700 hover:text-[#080c2a] transition-colors">Unit Converter</Link>
                <Link href="/convert/time-converter" className="block text-gray-700 hover:text-[#080c2a] transition-colors">Time Converter</Link>
                <Link href="/convert/age-calculator" className="block text-gray-700 hover:text-[#080c2a] transition-colors">Age Calculator</Link>
                <Link href="/convert/archive-converter" className="block text-gray-700 hover:text-[#080c2a] transition-colors">Archive Converter</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Compress Tools */}
        <div className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Compress Tools</h2>
            <p className="text-gray-600">Reduce file sizes without losing quality</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Video & Audio */}
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">🎵 Video & Audio</h3>
              <div className="space-y-3">
                <Link href="/compress/video-compressor" className="block text-gray-700 hover:text-[#080c2a] transition-colors">Video Compressor</Link>
                <Link href="/compress/mp3-compressor" className="block text-gray-700 hover:text-[#080c2a] transition-colors">MP3 Compressor</Link>
                <Link href="/compress/wav-compressor" className="block text-gray-700 hover:text-[#080c2a] transition-colors">WAV Compressor</Link>
              </div>
            </div>

            {/* Image */}
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">🖼️ Image</h3>
              <div className="space-y-3">
                <Link href="/compress/image-compressor" className="block text-gray-700 hover:text-[#080c2a] transition-colors">Image Compressor</Link>
                <Link href="/compress/jpeg-compressor" className="block text-gray-700 hover:text-[#080c2a] transition-colors">JPEG Compressor</Link>
                <Link href="/compress/png-compressor" className="block text-gray-700 hover:text-[#080c2a] transition-colors">PNG Compressor</Link>
              </div>
            </div>

            {/* PDF */}
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">📄 PDF</h3>
              <div className="space-y-3">
                <Link href="/compress/pdf-compressor" className="block text-gray-700 hover:text-[#080c2a] transition-colors">PDF Compressor</Link>
              </div>
            </div>

            {/* GIF */}
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">🎞️ GIF</h3>
              <div className="space-y-3">
                <Link href="/compress/gif-compressor" className="block text-gray-700 hover:text-[#080c2a] transition-colors">GIF Compressor</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-[#080c2a] hover:bg-[#080c2a]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#080c2a] shadow-lg transition-colors"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
