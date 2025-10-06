"use client";

import { useState, useCallback } from "react";
import FileUpload from '@/components/FileUpload';

export default function JfifToPngClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [convertedFileSize, setConvertedFileSize] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [convertProgress, setConvertProgress] = useState(0);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg'];
  const ALLOWED_EXTENSIONS = ['jfif'];

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setConvertedImage(null);
    setConvertedFileName('');
    setConvertedFileSize(0);
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
    // Set immediately so FileUpload shows action state
    setFile(selectedFile);
    setError(null);
    setConvertedImage(null);
    setConvertedFileName('');
    setConvertedFileSize(0);

    // Optional preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);

    // Clear simulated states
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName("");
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

      const res = await fetch('/api/convert/jfif-png', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to convert image');
      }

      const data = await res.json();
      setConvertedImage(`data:image/png;base64,${data.base64}`);
      setConvertedFileName(file.name.replace(/\.jfif$/i, '.png') || 'converted.png');
      
      // Calculate file size from base64
      const base64Size = (data.base64.length * 3) / 4;
      setConvertedFileSize(Math.round(base64Size));
      
      setConvertProgress(100);
    } catch (error) {
      console.error('Conversion failed:', error);
      setError('Failed to convert image. Please try again.');
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
        actionButtonText="Convert to PNG"
        onAction={handleConvert}
        isLoading={isLoading}
        showResult={!!convertedImage}
        resultUrl={convertedImage || undefined}
        resultFileName={convertedFileName}
        resultFileSize={convertedFileSize}
        onDownload={handleDownload}
        className="space-y-2"
      />
    </div>
  );
}
