"use client";

import { useCallback, useRef, useState } from "react";
import FileUpload from '@/components/FileUpload';

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

export default function ImageCompressorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(0.7);
  const [maxWidth, setMaxWidth] = useState<number>(1920);
  const [maxHeight, setMaxHeight] = useState<number>(1080);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [compressedFileName, setCompressedFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setCompressedUrl(null);
    setCompressedFileName("");
    setError(null);
    setOriginalSize(0);
    setCompressedSize(0);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName("");
  };

  const handleTestClick = () => {
    console.log('[ImageCompressor] Test button clicked!');
    setFile(new File(['test'], 'test.jpg', { type: 'image/jpeg' }));
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;
    alert('handleFileChange called with: ' + (selectedFile?.name || 'no file'));
    console.log('[ImageCompressor] handleFileChange:', selectedFile?.name || selectedFile);
    
    // Set file immediately so UI (settings/button) appears right away
    setFile(selectedFile);
    setOriginalSize(selectedFile.size);
    setCompressedUrl(null);
    setCompressedFileName("");
    setError(null);
    
    // Create preview immediately
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    
    // Reset upload states - no simulation needed
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName("");
    
    console.log('[ImageCompressor] File set, compression options should be visible now');
  };

  const drawToCanvas = async (img: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    let targetW = img.naturalWidth;
    let targetH = img.naturalHeight;

    if (maxWidth > 0 || maxHeight > 0) {
      const ratioW = maxWidth > 0 ? maxWidth / targetW : 1;
      const ratioH = maxHeight > 0 ? maxHeight / targetH : 1;
      const ratio = Math.min(ratioW || 1, ratioH || 1);
      if (ratio > 0 && ratio < 1) {
        targetW = Math.floor(targetW * ratio);
        targetH = Math.floor(targetH * ratio);
      }
    }

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(img, 0, 0, targetW, targetH);
    return canvas;
  };

  const handleCompress = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    setCompressedUrl(null);
    setError(null);
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = URL.createObjectURL(file);
      await img.decode();

      const canvas = await drawToCanvas(img);
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), format, quality)
      );
      if (!blob) throw new Error("Compression failed");

      setCompressedSize(blob.size);
      const url = URL.createObjectURL(blob);
      setCompressedUrl(url);
      const ext = format === "image/png" ? "png" : format === "image/webp" ? "webp" : "jpg";
      setCompressedFileName(file.name.replace(/\.[^/.]+$/, "") + "-compressed." + ext);
    } catch (e) {
      console.error(e);
      setError("Failed to compress image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, format, quality, maxWidth, maxHeight]);

  const handleDownload = () => {
    if (!compressedUrl || !file) return;
    const a = document.createElement("a");
    a.href = compressedUrl;
    a.download = compressedFileName || file.name.replace(/\.[^/.]+$/, "") + "-compressed." + (format === "image/png" ? "png" : format === "image/webp" ? "webp" : "jpg");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
        actionButtonText="Compress Image"
        onAction={handleCompress}
        isLoading={isProcessing}
        showResult={!!compressedUrl}
        resultUrl={compressedUrl || undefined}
        resultFileName={compressedFileName}
        resultFileSize={compressedSize}
        onDownload={handleDownload}
        className="space-y-2"
      />
    </div>
  );
}