"use client";

import { useState, useCallback } from "react";
import FileUpload from '@/components/FileUpload';

export default function HeicToPdfClient() {
  const [files, setFiles] = useState<File[]>([]);
  const [convertedPdf, setConvertedPdf] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [convertedFileSize, setConvertedFileSize] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [convertProgress, setConvertProgress] = useState(0);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = ['image/heic', 'image/heif'];
  const ALLOWED_EXTENSIONS = ['heic', 'heif'];

  const resetState = () => {
    setFiles([]);
    setConvertedPdf(null);
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
    // Simulate upload progress and accumulate files
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(selectedFile.name);
    setError(null);
    setConvertedPdf(null);
    setConvertedFileName('');
    setConvertedFileSize(0);

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


  const handleConvert = async () => {
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
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });

      const res = await fetch('/api/convert/heic-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to convert images');
      }

      const data = await res.json();
      setConvertedPdf(`data:application/pdf;base64,${data.base64}`);
      setConvertedFileName(files.length === 1 
        ? files[0].name.replace(/\.heic$/i, '.pdf')
        : 'converted.pdf');
      
      // Calculate file size from base64
      const base64Size = (data.base64.length * 3) / 4;
      setConvertedFileSize(Math.round(base64Size));
      
      setConvertProgress(100);
    } catch (error) {
      console.error('Conversion failed:', error);
      if (error instanceof Error) {
        alert(`Conversion failed: ${error.message}`);
      } else {
        alert('Failed to convert images. Please ensure all files are valid HEIC images and try again.');
      }
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (!convertedPdf || !convertedFileName) return;

    const link = document.createElement('a');
    link.href = convertedPdf;
    link.download = convertedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [convertedPdf, convertedFileName]);


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
        actionButtonText="Convert to PDF"
        onAction={handleConvert}
        isLoading={isLoading}
        showResult={!!convertedPdf}
        resultUrl={convertedPdf || undefined}
        resultFileName={convertedFileName}
        resultFileSize={convertedFileSize}
        onDownload={handleDownload}
        className="space-y-2"
      />
    </div>
  );
}