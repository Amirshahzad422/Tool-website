'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FaTools } from "react-icons/fa";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openConvert, setOpenConvert] = useState(false);
  const [openCompress, setOpenCompress] = useState(false);
  const [cvVideoAudio, setCvVideoAudio] = useState(false);
  const [cvImage, setCvImage] = useState(false);
  const [cvPdf, setCvPdf] = useState(false);
  const [cvGif, setCvGif] = useState(false);
  const [cvUnits, setCvUnits] = useState(false);
  const [cpVideoAudio, setCpVideoAudio] = useState(false);
  const [cpImage, setCpImage] = useState(false);
  const [cpPdf, setCpPdf] = useState(false);
  const [cpGif, setCpGif] = useState(false);

  const closeAll = () => {
    setMobileOpen(false);
    setOpenConvert(false);
    setOpenCompress(false);
    setCvVideoAudio(false);
    setCvImage(false);
    setCvPdf(false);
    setCvGif(false);
    setCvUnits(false);
    setCpVideoAudio(false);
    setCpImage(false);
    setCpPdf(false);
    setCpGif(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 md:hidden">
      <nav className="w-full px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-12">
          <Link href="/" className="group flex items-center gap-3 font-bold tracking-tight text-2xl text-gray-900 hover:text-gray-700 transition-colors">
            <FaTools className="w-8 h-8 text-[#080c2a] group-hover:scale-110 transition-transform duration-200" />
            <span className="text-gray-900">Toolbox</span>
          </Link>

          {/* Desktop nav (hidden in mobile component) */}
          <div className="hidden md:flex items-center gap-1 text-base"></div>
        </div>

        {/* Mobile toggle */}
        <button
          aria-label="Toggle Menu"
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/40 backdrop-blur-sm border border-gray-300/60 text-gray-900"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4">
          <div className="rounded-2xl border border-gray-300/50 bg-white/60 backdrop-blur-md shadow-lg p-4 space-y-2">
            <Link href="/" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 font-semibold hover:bg-white/70">Home</Link>

            {/* Convert root */}
            <button
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-900 font-semibold hover:bg-white/70"
              onClick={() => setOpenConvert((v) => !v)}
            >
              <span>Convert</span>
              <svg className={`w-5 h-5 transition-transform ${openConvert ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openConvert && (
              <div className="space-y-1 pl-2">
                <Link href="/convert" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">All Converters</Link>

                {/* Convert > Video & Audio */}
                <button
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70"
                  onClick={() => setCvVideoAudio((v) => !v)}
                >
                  <span>🎵 Video & Audio</span>
                  <svg className={`w-5 h-5 transition-transform ${cvVideoAudio ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {cvVideoAudio && (
                  <div className="space-y-1 pl-3">
                    <Link href="/convert/audio-converter" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">Audio Converter</Link>
                    <Link href="/convert/mp3-converter" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">MP3 Converter</Link>
                    <Link href="/convert/mp4-mp3" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">MP4 to MP3</Link>
                    <Link href="/convert/video-mp3" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">Video to MP3</Link>
                    <Link href="/convert/mp4-converter" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">MP4 Converter</Link>
                    <Link href="/convert/mov-mp4" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">MOV to MP4</Link>
                    <Link href="/convert/mp3-ogg" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">MP3 to OGG</Link>
                  </div>
                )}

                {/* Convert > Image */}
                <button
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70"
                  onClick={() => setCvImage((v) => !v)}
                >
                  <span>🖼️ Image</span>
                  <svg className={`w-5 h-5 transition-transform ${cvImage ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {cvImage && (
                  <div className="space-y-1 pl-3">
                    <Link href="/convert/image-converter" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">Image Converter</Link>
                    <Link href="/convert/webp-png" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">WEBP to PNG</Link>
                    <Link href="/convert/jfif-png" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">JFIF to PNG</Link>
                    <Link href="/convert/heic-jpg" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">HEIC to JPG</Link>
                    <Link href="/convert/heic-png" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">HEIC to PNG</Link>
                    <Link href="/convert/webp-jpg" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">WEBP to JPG</Link>
                    <Link href="/convert/svg-converter" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">SVG to PNG</Link>
                  </div>
                )}

                {/* Convert > PDF & Documents */}
                <button
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70"
                  onClick={() => setCvPdf((v) => !v)}
                >
                  <span>📄 PDF & Documents</span>
                  <svg className={`w-5 h-5 transition-transform ${cvPdf ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {cvPdf && (
                  <div className="space-y-1 pl-3">
                    <Link href="/convert/pdf-to-images" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">PDF to Images</Link>
                    <Link href="/convert/image-to-pdf" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">Image to PDF</Link>
                    <Link href="/convert/heic-pdf" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">HEIC to PDF</Link>
                    <Link href="/convert/jpg-pdf" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">JPG to PDF</Link>
                  </div>
                )}

                {/* Convert > GIF */}
                <button
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70"
                  onClick={() => setCvGif((v) => !v)}
                >
                  <span>🎞️ GIF</span>
                  <svg className={`w-5 h-5 transition-transform ${cvGif ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {cvGif && (
                  <div className="space-y-1 pl-3">
                    <Link href="/convert/video-gif" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">Video to GIF</Link>
                    <Link href="/convert/mp4-gif" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">MP4 to GIF</Link>
                    <Link href="/convert/webm-gif" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">WEBM to GIF</Link>
                    <Link href="/convert/gif-mp4" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">GIF to MP4</Link>
                    <Link href="/convert/image-gif" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">Image to GIF</Link>
                  </div>
                )}

                {/* Convert > Units */}
                <button
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70"
                  onClick={() => setCvUnits((v) => !v)}
                >
                  <span>📏 Units & Time</span>
                  <svg className={`w-5 h-5 transition-transform ${cvUnits ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {cvUnits && (
                  <div className="space-y-1 pl-3">
                    <Link href="/convert/unit-converter" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">Unit Converter</Link>
                    <Link href="/convert/time-converter" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">Time Converter</Link>
                    <Link href="/convert/age-calculator" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">Age Calculator</Link>
                  </div>
                )}
              </div>
            )}

            {/* Compress root */}
            <button
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-900 font-semibold hover:bg-white/70"
              onClick={() => setOpenCompress((v) => !v)}
            >
              <span>Compress</span>
              <svg className={`w-5 h-5 transition-transform ${openCompress ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openCompress && (
              <div className="space-y-1 pl-2">
                <Link href="/compress" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">All Compressors</Link>

                {/* Compress > Video & Audio */}
                <button
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70"
                  onClick={() => setCpVideoAudio((v) => !v)}
                >
                  <span>🎵 Video & Audio</span>
                  <svg className={`w-5 h-5 transition-transform ${cpVideoAudio ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {cpVideoAudio && (
                  <div className="space-y-1 pl-3">
                    <Link href="/compress/video-compressor" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">Video Compressor</Link>
                    <Link href="/compress/mp3-compressor" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">MP3 Compressor</Link>
                    <Link href="/compress/wav-compressor" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">WAV Compressor</Link>
                  </div>
                )}

                {/* Compress > Image */}
                <button
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70"
                  onClick={() => setCpImage((v) => !v)}
                >
                  <span>🖼️ Image</span>
                  <svg className={`w-5 h-5 transition-transform ${cpImage ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {cpImage && (
                  <div className="space-y-1 pl-3">
                    <Link href="/compress/image-compressor" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">Image Compressor</Link>
                    <Link href="/compress/jpeg-compressor" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">JPEG Compressor</Link>
                    <Link href="/compress/png-compressor" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">PNG Compressor</Link>
                  </div>
                )}

                {/* Compress > PDF & Documents */}
                <button
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70"
                  onClick={() => setCpPdf((v) => !v)}
                >
                  <span>📄 PDF & Documents</span>
                  <svg className={`w-5 h-5 transition-transform ${cpPdf ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {cpPdf && (
                  <div className="space-y-1 pl-3">
                    <Link href="/compress/pdf-compressor" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">PDF Compressor</Link>
                  </div>
                )}

                {/* Compress > GIF */}
                <button
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70"
                  onClick={() => setCpGif((v) => !v)}
                >
                  <span>🎞️ GIF</span>
                  <svg className={`w-5 h-5 transition-transform ${cpGif ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {cpGif && (
                  <div className="space-y-1 pl-3">
                    <Link href="/compress/gif-compressor" onClick={closeAll} className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-white/70">GIF Compressor</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}


