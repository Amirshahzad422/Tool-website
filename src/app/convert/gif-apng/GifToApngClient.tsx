"use client";

import { useState, useEffect, useCallback } from "react";
import FileUpload from '@/components/FileUpload';

export default function GifToApngClient() {
  const [ffmpeg, setFFmpeg] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [gif, setGif] = useState<File | null>(null);
  const [apngUrl, setApngUrl] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [convertedFileSize, setConvertedFileSize] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Loading FFmpeg...");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = ['image/gif'];
  const ALLOWED_EXTENSIONS = ['gif'];

  const resetState = () => {
    setGif(null);
    setApngUrl(null);
    setConvertedFileName('');
    setConvertedFileSize(0);
    setError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName("");
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
    setApngUrl(null);
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
          setGif(selectedFile);
          setUploadingFileName("");
        }, 200);
      }
      setUploadProgress(current);
    }, 150);
  };

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { toBlobURL } = await import("@ffmpeg/util");
        const instance = new FFmpeg();
        instance.on("log", ({ message }) => console.log(message));
        instance.on("progress", ({ progress }) => setProgress(Math.round(progress * 100)));
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await instance.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
        setFFmpeg(instance);
        setReady(true);
        setLoadingMessage("");
      } catch (e) {
        console.error("Failed to load FFmpeg", e);
        setLoadingMessage("Failed to load FFmpeg. Please refresh the page.");
      }
    };
    loadFFmpeg();
  }, []);

  const handleConvert = useCallback(async () => {
    if (!gif) return;
    setIsLoading(true);
    setProgress(0);

    try {
      const form = new FormData();
      form.append('file', gif);
      const res = await fetch('/api/convert/gif-apng', { method: 'POST', body: form });
      if (res.ok) {
        const blob = await res.blob();
        setApngUrl(URL.createObjectURL(blob));
        setConvertedFileSize(blob.size);
        setConvertedFileName(gif.name.replace(/\.[^/.]+$/, ".apng"));
        setIsLoading(false);
        setProgress(0);
        return;
      }
    } catch {}

    if (!ready || !ffmpeg) {
      alert('FFmpeg not ready. Please wait or refresh.');
      setIsLoading(false);
      setProgress(0);
      return;
    }

    try {
      const { fetchFile } = await import("@ffmpeg/util");
      const input = 'input.gif';
      const output = 'output.apng';
      await ffmpeg.writeFile(input, await fetchFile(gif));
      await ffmpeg.exec([
        '-i', input,
        '-plays', '0',
        '-f', 'apng',
        output,
      ]);
      const data = await ffmpeg.readFile(output);
      const blob = new Blob([data as BlobPart], { type: 'image/apng' });
      setApngUrl(URL.createObjectURL(blob));
      setConvertedFileSize(blob.size);
      setConvertedFileName(gif.name.replace(/\.[^/.]+$/, ".apng"));
    } catch (e) {
      console.error('Conversion failed', e);
      alert('Failed to convert. Try a smaller file.');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [gif, ready, ffmpeg]);

  const handleDownload = useCallback(() => {
    if (!apngUrl || !convertedFileName) return;
    const a = document.createElement('a');
    a.href = apngUrl;
    a.download = convertedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [apngUrl, convertedFileName]);

  if (!ready) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">Loading FFmpeg</h4>
        <p className="text-gray-700 mb-4">{loadingMessage || "Loading FFmpeg… please wait"}</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-gray-600 h-2 rounded-full animate-pulse" style={{ width: "60%" }} />
        </div>
      </div>
    );
  }

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
        actionButtonText="Convert to APNG"
        onAction={handleConvert}
        isLoading={isLoading}
        showResult={!!apngUrl}
        resultUrl={apngUrl || undefined}
        resultFileName={convertedFileName}
        resultFileSize={convertedFileSize}
        onDownload={handleDownload}
        className="space-y-2"
      />
    </div>
  );
}