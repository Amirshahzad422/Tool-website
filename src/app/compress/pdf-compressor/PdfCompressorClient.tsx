"use client";

import { useCallback, useRef, useState } from "react";
import FileUpload from '@/components/FileUpload';

export default function PdfCompressorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dpi, setDpi] = useState<number>(150); // target image DPI
  const [jpegQuality, setJpegQuality] = useState<number>(0.8);
  const [isProcessing, setIsProcessing] = useState(false);
  const [origSize, setOrigSize] = useState<number>(0);
  const [outSize, setOutSize] = useState<number>(0);
  const [compressedFileName, setCompressedFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<string>("medium");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = ['application/pdf'];
  const ALLOWED_EXTENSIONS = ['pdf'];

  const resetState = () => {
    setFile(null);
    setResultUrl(null);
    setCompressedFileName("");
    setError(null);
    setOrigSize(0);
    setOutSize(0);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName("");
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;
    // Simulate upload progress similar to GIF compressor
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(selectedFile.name);
    setResultUrl(null);
    setCompressedFileName("");
    setError(null);

    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 20 + 5;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(100);
          setFile(selectedFile);
          setOrigSize(selectedFile.size);
          setUploadingFileName("");
        }, 200);
      }
      setUploadProgress(current);
    }, 150);
  };

  // Server compression: basic re-save for now
  const compressViaApi = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("dpi", String(dpi));
      form.append("jpegQuality", String(Math.round(jpegQuality * 100)));
      form.append("compressionLevel", compressionLevel);
      const resp = await fetch("/api/compress/pdf", { method: "POST", body: form });
      if (!resp.ok) throw new Error("API compression failed");
      const blob = await resp.blob();
      setOutSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setCompressedFileName(file.name.replace(/\.[^/.]+$/, "") + "-compressed.pdf");
    } catch (e) {
      console.error(e);
      setError("PDF compression failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, dpi, jpegQuality, compressionLevel]);

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = compressedFileName || file.name.replace(/\.[^/.]+$/, "") + "-compressed.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };


  const fmt = (b: number) => {
    if (!b) return "0 B";
    const u = ["B","KB","MB","GB"]; let i = 0; let v = b;
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    return v.toFixed(2) + " " + u[i];
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-transparent p-8">
        <div className="space-y-6">
          {/* File Upload */}
          <div className="mt-16 sm:mt-20 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-16 sm:p-20 text-center min-h-[220px]">
            <div className="flex justify-center">
              <div className="w-full max-w-xs">
                <FileUpload
                  placeholder="Choose Files"
                  icon=""
                  boxed={false}
                  showHelp={false}
                  maxFileSize={MAX_FILE_SIZE}
                  allowedMimeTypes={ALLOWED_MIME_TYPES}
                  allowedExtensions={ALLOWED_EXTENSIONS}
                  onFileChange={handleFileChange}
                  onError={setError}
                  className="space-y-2"
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">Max file size 1GB. <a href="#" className="underline">Sign Up</a> for more</p>
            <p className="mt-1 text-xs text-gray-500">By proceeding, you agree to our <a href="#" className="underline">Terms of Use</a>.</p>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">Uploading {uploadingFileName}…</span>
                </div>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gray-700 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {/* Compression Settings */}
          {file && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Compression Settings</h3>
              
              <div className="space-y-4">
                {/* Compression Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compression Level
                  </label>
                  <select
                    value={compressionLevel}
                    onChange={(e) => setCompressionLevel(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                  >
                    <option value="low">Low (Fast, minimal compression)</option>
                    <option value="medium">Medium (Balanced)</option>
                    <option value="high">High (Slow, maximum compression)</option>
                  </select>
                </div>

                {/* Image DPI */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Image DPI: {dpi}
                  </label>
                  <input
                    type="range"
                    min={72}
                    max={300}
                    step={12}
                    value={dpi}
                    onChange={(e) => setDpi(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-300/50 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Low (72 DPI)</span>
                    <span>High (300 DPI)</span>
                  </div>
                </div>

                {/* JPEG Quality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    JPEG Quality: {Math.round(jpegQuality * 100)}%
                  </label>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={jpegQuality}
                    onChange={(e) => setJpegQuality(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-300/50 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Low (10%)</span>
                    <span>High (100%)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl" role="alert">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Compress Button */}
          {file && (
            <button
              onClick={compressViaApi}
              disabled={isProcessing}
              className="mt-4 w-full py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-3">
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Compressing…
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Compress PDF
                  </>
                )}
              </span>
            </button>
          )}

          {/* Download Button */}
          {resultUrl && (
            <button
              onClick={download}
              className="mt-4 w-full py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Compressed PDF
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


