'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_MIME_TYPES = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv', 'video/m4v'];
const ALLOWED_EXTENSIONS = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'];

export default function VideoCompressorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [compressedFileName, setCompressedFileName] = useState<string>('');
  const [compressedFileSize, setCompressedFileSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setCompressedFile(null);
      setCompressedFileName('');
      setCompressedFileSize(0);
    } else {
      setFile(null);
      setCompressedFile(null);
      setCompressedFileName('');
      setCompressedFileSize(0);
      setError(null);
    }
  };

  const compress = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quality', '0.8'); // Default quality

      const response = await fetch('/api/compress/video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Compression failed');
      }

      // Video compression APIs typically return the compressed file directly as binary data
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Compression failed - empty file received');
      }
      
      setCompressedFile(blob as File);
      setCompressedFileSize(blob.size);
      setCompressedFileName(`compressed_${file.name}`);
    } catch (err: any) {
      console.error('Compression error:', err);
      setError('Some internal error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (compressedFile) {
      const link = document.createElement('a');
      const url = URL.createObjectURL(compressedFile);
      link.href = url;
      link.download = compressedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <FileUpload
        placeholder="Choose Files"
        icon=""
        boxed={false}
        showHelp={false}
        showFileInfo={false}
        maxFileSize={MAX_FILE_SIZE}
        allowedMimeTypes={ALLOWED_MIME_TYPES}
        allowedExtensions={ALLOWED_EXTENSIONS}
        onFileChange={handleFileChange}
        onError={setError}
        actionButtonText="Compress Video"
        onAction={compress}
        isLoading={isLoading}
        showResult={!!compressedFile}
        resultUrl={compressedFile ? URL.createObjectURL(compressedFile) : undefined}
        resultFileName={compressedFileName}
        resultFileSize={compressedFileSize}
        onDownload={handleDownload}
        className="space-y-2"
      />
      
      {/* Display error message if any */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <div className="text-red-600 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Compression Error</h3>
              <p className="text-sm mt-1 text-red-700">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  compress();
                }}
                className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}