'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FaTools } from "react-icons/fa";

export default function DesktopNavbar() {
  const [openConvert, setOpenConvert] = useState(false);
  const [openCompress, setOpenCompress] = useState(false);
  const [openTools, setOpenTools] = useState(false);
  const pathname = usePathname();

  const closeAll = () => {
    setOpenConvert(false);
    setOpenCompress(false);
    setOpenTools(false);
  };

  useEffect(() => {
    // Close any open menus when the route changes
    closeAll();
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md hidden md:block">
      <nav className="w-full px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="group flex items-center gap-3 font-bold tracking-tight text-2xl text-gray-900 hover:text-gray-700 transition-colors">
            <FaTools className="w-8 h-8 text-[#080c2a] group-hover:scale-110 transition-transform duration-200" />
            <span className="text-gray-900">Toolbox</span>
          </Link>
          <div className="hidden md:flex items-center gap-3 text-base">
            {/* Convert */}
            <div
              className="relative"
              onMouseEnter={() => setOpenConvert(true)}
              onMouseLeave={() => setOpenConvert(false)}
            >
              <button
                className="relative text-gray-800 hover:text-gray-900 transition-all duration-200 font-semibold px-5 py-3 rounded-lg hover:bg-white/60 flex items-center gap-2"
                aria-haspopup="menu"
                aria-expanded={openConvert}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Convert
                  <svg className={`w-5 h-5 transition-transform ${openConvert ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {openConvert && (
                <div className="transition-all duration-200 absolute left-0 top-full mt-2 rounded-xl border border-gray-200 bg-white shadow-xl p-5 z-[99999] min-w-[1200px]">
                  <div className="absolute -top-2 left-10 w-4 h-4 bg-white border-t border-l border-gray-200 rotate-45"></div>
                  <div className="grid grid-cols-5 gap-8 divide-x divide-gray-200">
                    {/* Video & Audio */}
                    <div className="space-y-1 pr-6">
                      <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Video & Audio</h4>
                      <Link href="/convert/audio-converter" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"><span>Audio Converter</span></Link>
                      <Link href="/convert/mp3-converter" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>MP3 Converter</span></Link>
                      <Link href="/convert/mp4-mp3" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>MP4 to MP3</span></Link>
                      <Link href="/convert/video-mp3" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>Video to MP3</span></Link>
                      <Link href="/convert/mp4-converter" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>MP4 Converter</span></Link>
                      <Link href="/convert/mov-mp4" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>MOV to MP4</span></Link>
                      <Link href="/convert/mp3-ogg" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>MP3 to OGG</span></Link>
                    </div>
                    {/* Image */}
                    <div className="space-y-1 px-6">
                      <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Image</h4>
                      <Link href="/convert/image-converter" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>Image Converter</span></Link>
                      <Link href="/convert/webp-png" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>WEBP to PNG</span></Link>
                      <Link href="/convert/jfif-png" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>JFIF to PNG</span></Link>
                      <Link href="/convert/heic-jpg" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>HEIC to JPG</span></Link>
                      <Link href="/convert/heic-png" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>HEIC to PNG</span></Link>
                      <Link href="/convert/webp-jpg" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>WEBP to JPG</span></Link>
                      <Link href="/convert/svg-converter" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>SVG to PNG</span></Link>
                    </div>
                    {/* PDF & More */}
                    <div className="space-y-1 px-6">
                      <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">PDF & More</h4>
                      <Link href="/convert/pdf-to-images" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>PDF to Images</span></Link>
                      <Link href="/convert/image-to-pdf" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>Image to PDF</span></Link>
                      <Link href="/convert/video-gif" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>Video to GIF</span></Link>
                      <Link href="/convert/mp4-gif" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>MP4 to GIF</span></Link>
                      <Link href="/convert/webm-gif" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>WEBM to GIF</span></Link>
                      <Link href="/convert/gif-mp4" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>GIF to MP4</span></Link>
                      <Link href="/convert/image-gif" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>Image to GIF</span></Link>
                    </div>
                    {/* GIF */}
                    <div className="space-y-1 px-6">
                      <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">GIF</h4>
                      <Link href="/convert/video-gif" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>Video to GIF</span></Link>
                      <Link href="/convert/mp4-gif" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>MP4 to GIF</span></Link>
                      <Link href="/convert/webm-gif" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>WEBM to GIF</span></Link>
                      <Link href="/convert/apng-gif" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>APNG to GIF</span></Link>
                      <Link href="/convert/gif-mp4" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>GIF to MP4</span></Link>
                      <Link href="/convert/gif-apng" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>GIF to APNG</span></Link>
                      <Link href="/convert/image-gif" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>Image to GIF</span></Link>
                      <Link href="/convert/mov-gif" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>MOV to GIF</span></Link>
                      <Link href="/convert/avi-gif" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>AVI to GIF</span></Link>
                    </div>
                    {/* Others */}
                    <div className="space-y-1 pl-6">
                      <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Others</h4>
                      <Link href="/convert/unit-converter" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>Unit Converter</span></Link>
                      <Link href="/convert/time-converter" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>Time Converter</span></Link>
                      <Link href="/convert/archive-converter" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>Archive Converter</span></Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Compress */}
            <div
              className="relative"
              onMouseEnter={() => setOpenCompress(true)}
              onMouseLeave={() => setOpenCompress(false)}
            >
              <button
                className="relative text-gray-800 hover:text-gray-900 transition-all duration-200 font-semibold px-5 py-3 rounded-lg hover:bg-white/60 flex items-center gap-2"
                aria-haspopup="menu"
                aria-expanded={openCompress}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Compress
                  <svg className={`w-5 h-5 transition-transform ${openCompress ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {openCompress && (
                <div className="transition-all duration-200 absolute left-0 top-full mt-2 rounded-xl border border-gray-200 bg-white shadow-xl p-5 z-[99999] min-w-[1200px]">
                  <div className="absolute -top-2 left-10 w-4 h-4 bg-white border-t border-l border-gray-200 rotate-45"></div>
                  <div className="grid grid-cols-4 gap-8 divide-x divide-gray-200">
                    {/* Video & Audio */}
                    <div className="space-y-1 pr-6">
                      <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Video & Audio</h4>
                      <Link href="/compress/video-compressor" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>Video Compressor</span></Link>
                      <Link href="/compress/mp3-compressor" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>MP3 Compressor</span></Link>
                      <Link href="/compress/wav-compressor" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>WAV Compressor</span></Link>
                    </div>
                    {/* Image */}
                    <div className="space-y-1 px-6">
                      <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Image</h4>
                      <Link href="/compress/image-compressor" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>Image Compressor</span></Link>
                      <Link href="/compress/jpeg-compressor" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>JPEG Compressor</span></Link>
                      <Link href="/compress/png-compressor" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>PNG Compressor</span></Link>
                    </div>
                    {/* PDF & Documents */}
                    <div className="space-y-1 px-6">
                      <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">PDF & Documents</h4>
                      <Link href="/compress/pdf-compressor" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>PDF Compressor</span></Link>
                    </div>
                    {/* GIF */}
                    <div className="space-y-1 pl-6">
                      <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">GIF</h4>
                      <Link href="/compress/gif-compressor" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"><span>GIF Compressor</span></Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Tools */}
            <div
              className="relative"
              onMouseEnter={() => setOpenTools(true)}
              onMouseLeave={() => setOpenTools(false)}
            >
              <button
                className="relative text-gray-800 hover:text-gray-900 transition-all duration-200 font-semibold px-5 py-3 rounded-lg hover:bg-white/60 flex items-center gap-2"
                aria-haspopup="menu"
                aria-expanded={openTools}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Tools
                  <svg className={`w-5 h-5 transition-transform ${openTools ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {openTools && (
                <div className="transition-all duration-200 absolute left-0 top-full mt-2 rounded-xl border border-gray-200 bg-white shadow-xl p-5 z-[99999] min-w-[400px]">
                  <div className="absolute -top-2 left-10 w-4 h-4 bg-white border-t border-l border-gray-200 rotate-45"></div>
                  <div className="grid grid-cols-1 gap-4">
                    {/* Color & Design Tools */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Color & Design</h4>
                      <Link href="/tools/color-picker" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
                        <span>Color Picker</span>
                      </Link>
                    </div>
                    {/* Audio Tools */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Audio Tools</h4>
                      <Link href="/tools/audio-joiner" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded"></div>
                        <span>Audio Joiner</span>
                      </Link>
                      <Link href="/tools/audio-trimmer" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded"></div>
                        <span>Audio Trimmer</span>
                      </Link>
                    </div>
                    {/* Video Tools */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Video Tools</h4>
                      <Link href="/tools/video-joiner" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded"></div>
                        <span>Video Joiner</span>
                      </Link>
                    </div>
                    {/* Utility Tools */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Utility Tools</h4>
                      <Link href="/tools/image-cropper" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-teal-500 rounded"></div>
                        <span>Image Cropper</span>
                      </Link>
                      <Link href="/tools/image-rotate" onClick={closeAll} className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded"></div>
                        <span>Rotate Image</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* API, Pricing */}
            <Link href="/api" className="text-gray-800 hover:text-gray-900 transition-all duration-200 font-semibold px-5 py-3 rounded-lg">API</Link>
            <Link href="/pricing" className="text-gray-800 hover:text-gray-900 transition-all duration-200 font-semibold px-5 py-3 rounded-lg">Pricing</Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="relative py-1 px-5 bg-[#080c2a] rounded-lg text-lg text-white hover:bg-[#080c2a]/90 transition-all duration-200 font-semibold group shadow-lg"
          >
            <span className="relative z-10">Login</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}


