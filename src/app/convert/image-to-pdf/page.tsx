"use client";

import { useEffect, useState } from "react";
import FileUpload from '@/components/FileUpload';

export default function ImageToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [convertedPdfUrl, setConvertedPdfUrl] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [convertProgress, setConvertProgress] = useState(0);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'svg'];

  const resetState = () => {
    setFiles([]);
    setConvertedPdfUrl(null);
    setConvertedFileName('');
    setError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName("");
    setConvertProgress(0);
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      resetState();
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(selectedFile.name);
    setError(null);
    setConvertedPdfUrl(null);
    setConvertedFileName('');

    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 20 + 5;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(100);
          setFiles(prev => {
            const exists = prev.some(f => f.name === selectedFile.name && f.size === selectedFile.size);
            if (exists) return prev;
            return [...prev, selectedFile];
          });
          setUploadingFileName("");
        }, 200);
      }
      setUploadProgress(current);
    }, 150);
  };

  async function handleConvert() {
    if (files.length === 0) return;

    setIsLoading(true);
    setConvertProgress(0);
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 15 + 5;
      if (current >= 95) current = 95;
      setConvertProgress(current);
    }, 200);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/convert/image-to-pdf", { method: "POST", body: formData });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to convert images to PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      setConvertedPdfUrl(url);
      setConvertedFileName("images.pdf");
      setConvertProgress(100);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? `Conversion failed: ${err.message}` : 'Conversion failed. Please try again.');
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  }

  function handleDownload() {
    if (!convertedPdfUrl || !convertedFileName) return;
    const a = document.createElement("a");
    a.href = convertedPdfUrl;
    a.download = convertedFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  useEffect(() => {
    return () => {
      // no persistent URLs to revoke here
    };
  }, [files]);

  return (
    <div className="bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-40 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Image to PDF Converter</h1>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">Convert images to PDF format with high quality and professional layout.</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-transparent p-8">
              <div className="space-y-6">
                <FileUpload
                  placeholder="Choose Files"
                  icon=""
                  maxFileSize={MAX_FILE_SIZE}
                  allowedMimeTypes={ALLOWED_MIME_TYPES}
                  allowedExtensions={ALLOWED_EXTENSIONS}
                  onFileChange={handleFileChange}
                  onError={setError}
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">Max file size 1GB. <a href="#" className="underline">Sign Up</a> for more</p>
            <p className="mt-1 text-xs text-gray-500">By proceeding, you agree to our <a href="#" className="underline">Terms of Use</a>.</p>
          </div>

          {isUploading && (
            <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-800">Uploading {uploadingFileName}…</span>
                <span className="text-sm text-gray-600">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gray-700 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {files.length > 0 && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-4 backdrop-blur-sm mt-4">
              <div className="text-sm text-gray-700 font-medium mb-2">Selected images ({files.length})</div>
              <ul className="max-h-40 overflow-auto space-y-1 text-sm text-gray-700">
                {files.map((f, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span className="truncate mr-3">{f.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {files.length > 0 && !convertedPdfUrl && (
            <button
              onClick={handleConvert}
              disabled={isLoading}
              className="mt-4 w-full py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isLoading ? `Converting… ${Math.round(convertProgress)}%` : 'Convert to PDF'}
            </button>
          )}

          {isLoading && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm mt-4">
              <div className="flex items-center justify-between mb-2 text-sm text-gray-700">
                <span>Converting…</span>
                <span>{Math.round(convertProgress)}%</span>
              </div>
              <div className="w-full bg-gray-300/50 rounded-full h-2">
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 h-2 rounded-full transition-all duration-300 ease-out" style={{ width: `${convertProgress}%` }} />
              </div>
            </div>
          )}

          {convertedPdfUrl && (
            <button
              onClick={handleDownload}
              className="mt-4 w-full py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
            >
              Download PDF File
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
