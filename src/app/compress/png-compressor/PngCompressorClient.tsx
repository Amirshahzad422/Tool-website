'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_MIME_TYPES = ['image/png'];
const ALLOWED_EXTENSIONS = ['png'];

export default function PngCompressorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [compressedFileName, setCompressedFileName] = useState<string>('');
  const [outSize, setOutSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResultUrl(null);
      setCompressedFileName('');
      setOutSize(0);
    } else {
      setFile(null);
      setResultUrl(null);
      setCompressedFileName('');
      setOutSize(0);
      setError(null);
    }
  };

  const compress = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quality', '0.8'); // Default quality

      const response = await fetch('/api/compress/png', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Compression failed');
      }

      // PNG compression APIs typically return the compressed file directly as binary data
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Compression failed - empty file received');
      }
      
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setOutSize(blob.size);
      setCompressedFileName(`compressed_${file.name}`);
    } catch (err: any) {
      console.error('Compression error:', err);
      setError('Some internal error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const download = () => {
    if (resultUrl) {
      const link = document.createElement('a');
      link.href = resultUrl;
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
        boxed={true}
        showHelp={true}
        maxFileSize={MAX_FILE_SIZE}
        allowedMimeTypes={ALLOWED_MIME_TYPES}
        allowedExtensions={ALLOWED_EXTENSIONS}
        onFileChange={handleFileChange}
        onError={setError}
        actionButtonText="Compress PNG"
        onAction={compress}
        isLoading={isProcessing}
        showResult={!!resultUrl}
        resultUrl={resultUrl || undefined}
        resultFileName={compressedFileName}
        resultFileSize={outSize}
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