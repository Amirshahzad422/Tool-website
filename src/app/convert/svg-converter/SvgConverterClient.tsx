"use client";

import { useState, useCallback } from "react";
import FileUpload from '@/components/FileUpload';

export default function SvgConverterClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [convertProgress, setConvertProgress] = useState(0);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = ['image/svg+xml'];
  const ALLOWED_EXTENSIONS = ['svg'];

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setConvertedImage(null);
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

    // Simulate upload progress
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(selectedFile.name);
    setError(null);
    setConvertedImage(null);
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
          setFile(selectedFile);
          setUploadingFileName("");

          // Create preview
          const reader = new FileReader();
          reader.onload = (e) => setPreview(e.target?.result as string);
          reader.readAsDataURL(selectedFile);
        }, 200);
      }
      setUploadProgress(current);
    }, 150);
  };

  const handleConvert = async () => {
    if (!file) return;

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
      formData.append('file', file);
      formData.append('format', 'png');

      const res = await fetch('/api/convert/svg-converter', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to convert image');
      }

      const data = await res.json();
      const mimeType = 'image/png';
      setConvertedImage(`data:${mimeType};base64,${data.base64}`);
      setConvertedFileName(file.name.replace(/\.[^/.]+$/, '.png') || `converted.png`);
      setConvertProgress(100);
    } catch (error) {
      console.error('Conversion failed:', error);
      if (error instanceof Error) {
        setError(`Conversion failed: ${error.message}`);
      } else {
        setError('Failed to convert image. Please ensure the file is a valid SVG image.');
      }
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (!convertedImage || !convertedFileName) return;

    const link = document.createElement('a');
    link.href = convertedImage;
    link.download = convertedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [convertedImage, convertedFileName]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Single outer dropzone like Video → GIF */}
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

      {/* Upload progress pill */}
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

      {file && !convertedImage && (
        <button
          onClick={handleConvert}
          disabled={isLoading}
          className="mt-4 w-full py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isLoading ? `Converting… ${Math.round(convertProgress)}%` : 'Convert to PNG'}
        </button>
      )}

      {isLoading && (
        <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2 text-sm text-gray-700">
            <span>Converting…</span>
            <span>{Math.round(convertProgress)}%</span>
          </div>
          <div className="w-full bg-gray-300/50 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-gray-700 to-gray-800 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${convertProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {convertedImage && (
        <button
          onClick={handleDownload}
          className="mt-4 w-full py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
        >
          Download PNG File
        </button>
      )}
    </div>
  );
}
