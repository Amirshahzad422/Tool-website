'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_MIME_TYPES = ['image/gif'];
const ALLOWED_EXTENSIONS = ['gif'];

export default function GifCompressorClient() {
  const [gifFile, setGifFile] = useState<File | null>(null);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [compressedFileName, setCompressedFileName] = useState<string>('');
  const [compressedFileSize, setCompressedFileSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setGifFile(selectedFile);
      setError(null);
      setOutUrl(null);
      setCompressedFileName('');
      setCompressedFileSize(0);
    } else {
      setGifFile(null);
      setOutUrl(null);
      setCompressedFileName('');
      setCompressedFileSize(0);
      setError(null);
    }
  };

  const compress = async () => {
    if (!gifFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', gifFile);
      formData.append('quality', '0.8'); // Default quality

      const response = await fetch('/api/compress/gif', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Compression failed');
      }

      const data = await response.json();

      if (data.success && data.compressedData) {
        // Convert base64 to blob
        const binaryString = atob(data.compressedData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'image/gif' });
        const url = URL.createObjectURL(blob);
        
        setOutUrl(url);
        setCompressedFileSize(data.compressedSize);
        setCompressedFileName(data.fileName);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Compression error:', err);
      setError('Some internal error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const download = () => {
    if (outUrl) {
      const link = document.createElement('a');
      link.href = outUrl;
      link.download = compressedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
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
        actionButtonText="Compress GIF"
        onAction={compress}
        isLoading={isProcessing}
        showResult={!!outUrl}
        resultUrl={outUrl || undefined}
        resultFileName={compressedFileName}
        resultFileSize={compressedFileSize}
        onDownload={download}
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