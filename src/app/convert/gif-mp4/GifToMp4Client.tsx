"use client";

import { useState, useEffect, useCallback } from "react";
import FileUpload from '@/components/FileUpload';

export default function GifToMp4Client() {
  const [ffmpeg, setFFmpeg] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [gif, setGif] = useState<File | null>(null);
  const [mp4Url, setMp4Url] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
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
    setMp4Url(null);
    setConvertedFileName('');
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
    setMp4Url(null);
    setConvertedFileName('');

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
        console.log('FFmpeg loaded successfully');
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

    // Try server route first
    try {
      const form = new FormData();
      form.append('file', gif);
      const res = await fetch('/api/convert/gif-mp4', { method: 'POST', body: form });
      if (res.ok) {
        const blob = await res.blob();
        setMp4Url(URL.createObjectURL(blob));
        setConvertedFileName(gif.name.replace(/\.[^/.]+$/, ".mp4"));
        setIsLoading(false);
        setProgress(0);
        return;
      }
    } catch {}

    // Fallback to client-side
    if (!ready || !ffmpeg) {
      alert('FFmpeg not ready. Please wait or refresh.');
      setIsLoading(false);
      setProgress(0);
      return;
    }

    try {
      const { fetchFile } = await import("@ffmpeg/util");
      const input = 'input.gif';
      const output = 'output.mp4';
      await ffmpeg.writeFile(input, await fetchFile(gif));
      await ffmpeg.exec([
        '-i', input,
        '-movflags', 'faststart',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        output,
      ]);
      const data = await ffmpeg.readFile(output);
      const blob = new Blob([data as BlobPart], { type: 'video/mp4' });
      setMp4Url(URL.createObjectURL(blob));
      setConvertedFileName(gif.name.replace(/\.[^/.]+$/, ".mp4"));
    } catch (e) {
      console.error('Conversion failed', e);
      alert('Failed to convert. Try a smaller file.');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [gif, ready, ffmpeg]);

  const handleDownload = useCallback(() => {
    if (!mp4Url || !convertedFileName) return;
    const a = document.createElement('a');
    a.href = mp4Url;
    a.download = convertedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [mp4Url, convertedFileName]);


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
      {/* Single outer dropzone to match other tools */}
      <div className="mt-16 sm:mt-20 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-16 sm:p-20 text-center min-h-[220px]">
        <div className="flex justify-center">
          <div className="w-full max-w-xs">
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
              className="space-y-2"
            />
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-600">Max file size 1GB. <a href="#" className="underline">Sign Up</a> for more</p>
        <p className="mt-1 text-xs text-gray-500">By proceeding, you agree to our <a href="#" className="underline">Terms of Use</a>.</p>
      </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-800">Uploading {uploadingFileName}…</span>
                </div>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Progress Bar */}
          {isLoading && (
            <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Converting GIF</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Processing...</span>
                  <span className="text-sm font-medium text-gray-900">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-700 h-2 rounded-full transition-all" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Converting GIF to MP4 video with optimized settings...
                </p>
              </div>
            </div>
          )}

          {/* Convert Button - Only show after file upload and before conversion */}
          {gif && !mp4Url && (
            <button
              onClick={handleConvert}
              disabled={isLoading}
              className="mt-4 w-full py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Converting to MP4...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Convert to MP4
                  </>
                )}
              </span>
            </button>
          )}

          {/* Download Button - Only show after conversion */}
          {mp4Url && (
            <button
              onClick={handleDownload}
              className="mt-4 w-full py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download MP4 File
              </span>
            </button>
          )}
        </div>
  );
}

