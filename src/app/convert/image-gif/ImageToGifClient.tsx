"use client";

import { useState, useCallback, useEffect } from "react";
import FileUpload from '@/components/FileUpload';

export default function ImageToGifClient() {
  const [images, setImages] = useState<File[]>([]);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [convertedFileSize, setConvertedFileSize] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [delay, setDelay] = useState(500); // milliseconds between frames
  const [loop, setLoop] = useState(true);
  const [ffmpeg, setFFmpeg] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading FFmpeg...");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per image
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

  const resetState = () => {
    setImages([]);
    setGifUrl(null);
    setConvertedFileName('');
    setConvertedFileSize(0);
    setError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName("");
  };

  const handleFileChange = (selectedFiles: File[] | null) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      resetState();
      return;
    }
    const first = selectedFiles[0];
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(first.name + (selectedFiles.length > 1 ? ` +${selectedFiles.length - 1}` : ''));
    setError(null);
    setGifUrl(null);
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
          setImages(prev => {
            const existing = new Set(prev.map(f => `${f.name}:${f.size}`));
            const toAdd = selectedFiles.filter(f => !existing.has(`${f.name}:${f.size}`));
            return [...prev, ...toAdd];
          });
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
        console.log('FFmpeg loaded successfully');
      } catch (e) {
        console.error("Failed to load FFmpeg", e);
        setLoadingMessage("Failed to load FFmpeg. Please refresh the page.");
      }
    };
    loadFFmpeg();
  }, []);


  const handleConvert = useCallback(async () => {
    if (images.length === 0) return;
    
    setIsLoading(true);
    setProgress(0);

    // Try server-side conversion first
    try {
      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });
      formData.append('delay', delay.toString());
      formData.append('loop', loop.toString());

      const response = await fetch('/api/convert/image-gif', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setGifUrl(url);
        setConvertedFileSize(blob.size);
        setConvertedFileName("animated.gif");
        setIsLoading(false);
        setProgress(0);
        return;
      } else {
        console.log('Server-side conversion failed, trying client-side...');
      }
    } catch (serverError) {
      console.log('Server-side conversion error, trying client-side...', serverError);
    }

    // Fallback to client-side conversion
    if (!ready || !ffmpeg) {
      alert('FFmpeg not ready. Please wait for it to load or refresh the page.');
      setIsLoading(false);
      setProgress(0);
      return;
    }

    try {
      const { fetchFile } = await import("@ffmpeg/util");
      
      // Write all images to FFmpeg filesystem with correct extensions
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const extension = image.type === 'image/jpeg' ? 'jpg' : 
                         image.type === 'image/png' ? 'png' : 
                         image.type === 'image/webp' ? 'webp' : 'png';
        const inputName = `input_${i.toString().padStart(3, '0')}.${extension}`;
        const fileData = await fetchFile(image);
        await ffmpeg.writeFile(inputName, fileData);
      }

      // Convert all images to PNG first
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const extension = image.type === 'image/jpeg' ? 'jpg' : 
                         image.type === 'image/png' ? 'png' : 
                         image.type === 'image/webp' ? 'webp' : 'png';
        const inputName = `input_${i.toString().padStart(3, '0')}.${extension}`;
        const outputName = `frame_${i.toString().padStart(3, '0')}.png`;
        
        await ffmpeg.exec([
          '-i', inputName,
          '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos',
          outputName
        ]);
      }

      // Create GIF from PNG frames
      const outputName = "output.gif";
      const loopFlag = loop ? "0" : "1";
      
      await ffmpeg.exec([
        '-y',
        '-framerate', `${1000 / delay}`,
        '-i', 'frame_%03d.png',
        '-loop', loopFlag,
        '-f', 'gif',
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data as BlobPart], { type: "image/gif" });
      const url = URL.createObjectURL(blob);

      setGifUrl(url);
      setConvertedFileSize(blob.size);
      setConvertedFileName("animated.gif");
      console.log('Client-side conversion successful');
    } catch (err) {
      console.error("Both server and client conversion failed:", err);
      alert("Failed to convert images to GIF. Please try with fewer images or refresh the page.");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [images, delay, loop, ready, ffmpeg]);

  const handleDownload = useCallback(() => {
    if (!gifUrl || !convertedFileName) return;
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = convertedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [gifUrl, convertedFileName]);


  if (!ready) {
    return (
      <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
        <div className="text-6xl mb-4">⚙️</div>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">Loading FFmpeg</h4>
        <p className="text-gray-700 mb-4">{loadingMessage || "Loading FFmpeg… please wait"}</p>
        <div className="w-full bg-gray-300/50 rounded-full h-2">
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
        onFileChange={(files) => handleFileChange(files ? Array.isArray(files) ? files : [files] : null)}
        onError={setError}
        actionButtonText="Convert to GIF"
        onAction={handleConvert}
        isLoading={isLoading}
        showResult={!!gifUrl}
        resultUrl={gifUrl || undefined}
        resultFileName={convertedFileName}
        resultFileSize={convertedFileSize}
        onDownload={handleDownload}
        className="space-y-2"
      />
    </div>
  );
}
