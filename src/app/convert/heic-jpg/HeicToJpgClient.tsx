"use client";

import { useState, useCallback } from "react";
import FileUpload from '@/components/FileUpload';

export default function HeicToJpgClient() {
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
  const ALLOWED_MIME_TYPES = ['image/heic', 'image/heif'];
  const ALLOWED_EXTENSIONS = ['heic', 'heif'];

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

    // Set file immediately for FileUpload component
    setFile(selectedFile);
    setError(null);
    setConvertedImage(null);
    setConvertedFileName('');
    setConvertedFileSize(0);
    setPreview(null);

    // Simulate upload progress (HEIC preview not available)
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(selectedFile.name);

    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 20 + 5;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(100);
          setUploadingFileName("");
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

      const res = await fetch('/api/convert/heic-jpg', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to convert image');
      }

      const data = await res.json();
      const base64Data = data.base64;
      setConvertedImage(`data:image/jpeg;base64,${base64Data}`);
      setConvertedFileName(file.name.replace(/\.heic$/i, '.jpg') || 'converted.jpg');
      
      // Calculate file size from base64
      const base64Size = (base64Data.length * 3) / 4;
      setConvertedFileSize(Math.round(base64Size));
      
      setConvertProgress(100);
    } catch (error) {
      console.error('Conversion failed:', error);
      if (error instanceof Error) {
        setError(`Conversion failed: ${error.message}`);
      } else {
        setError('Failed to convert image. Please ensure the file is a valid HEIC image from an iPhone or compatible device.');
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
        actionButtonText="Convert to JPG"
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
