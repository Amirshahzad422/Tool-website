"use client";

import { useEffect, useState } from "react";
import FileUpload from '@/components/FileUpload';

export default function ImageToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [convertedPdfUrl, setConvertedPdfUrl] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [convertedFileSize, setConvertedFileSize] = useState<number>(0);
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
    // Add immediately so UI updates right away
    setFiles(prev => {
      const exists = prev.some(f => f.name === selectedFile.name && f.size === selectedFile.size);
      if (exists) return prev;
      return [...prev, selectedFile];
    });
    setError(null);
    setConvertedPdfUrl(null);
    setConvertedFileName('');
    // Clear simulated upload state
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName("");
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
      // Track result size for FileUpload summary
      try {
        // blob.size is reliable for response.blob()
        setConvertedFileSize(blob.size);
      } catch {}
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
                  actionButtonText="Convert to PDF"
                  onAction={handleConvert}
                  isLoading={isLoading}
                  showResult={!!convertedPdfUrl}
                  resultUrl={convertedPdfUrl || undefined}
                  resultFileName={convertedFileName}
                  resultFileSize={convertedFileSize}
                  onDownload={handleDownload}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
