"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import FileUpload from '@/components/FileUpload';

export default function VideoToMP3Client() {
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState<File | null>(null);
  const [mp3, setMp3] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [convertedFileSize, setConvertedFileSize] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = [
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm',
    'video/mkv', 'video/3gp', 'video/ogv', 'video/m4v'
  ];
  const ALLOWED_EXTENSIONS = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp', 'ogv', 'm4v'];

  const resetState = () => {
    setVideo(null);
    setMp3(null);
    setConvertedFileName("");
    setConvertedFileSize(0);
    setError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName('');
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      resetState();
      return;
    }
    // Set file immediately so FileUpload shows the action state
    setVideo(selectedFile);
    setError(null);
    setMp3(null);
    setConvertedFileName("");
    setConvertedFileSize(0);
    // Optional: clear any previous upload simulation state
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName('');
  };

  // Initialize ffmpeg ONLY in browser
  useEffect(() => {
    const init = async () => {
      if (typeof window === "undefined") return; // ⛔ prevent SSR
      
      try {
        const { FFmpeg } = await import('@ffmpeg/ffmpeg');
        const instance = new FFmpeg();

        instance.on("log", ({ message }) => console.log(message));
        instance.on("progress", ({ progress }) =>
          setProgress(Math.round(progress * 100))
        );

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await instance.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        setFfmpeg(instance);
        setReady(true);
      } catch (err) {
        console.error("FFmpeg failed to load:", err);
      }
    };

    init();
  }, []);


  // Convert video → mp3
  const convertToMp3 = useCallback(async () => {
    if (!video || !ready || !ffmpeg) return;
    setIsLoading(true);
    setProgress(0);

    try {
      // Use simple, consistent file names
      const inputName = "input.mp4";
      const outputName = "output.mp3";

      // Write input file to FFmpeg filesystem
      await ffmpeg.writeFile(inputName, await fetchFile(video));

      // Execute FFmpeg command
      await ffmpeg.exec([
        "-i", inputName,
        "-vn",                    // No video
        "-c:a", "libmp3lame",     // Audio codec
        "-ar", "44100",           // Sample rate
        "-ac", "2",               // Stereo
        "-b:a", "192k",           // Bitrate
        "-y",                     // Overwrite output
        outputName
      ]);

      // Read output file
      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data as BlobPart], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      setMp3(url);
      setConvertedFileName(video.name.replace(/\.[^/.]+$/, ".mp3"));
      setConvertedFileSize(blob.size);

      // Cleanup temporary files
      try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
      } catch (cleanupError) {
        console.warn("Failed to cleanup temporary files:", cleanupError);
      }
    } catch (err) {
      console.error("Conversion failed:", err);
      alert("Failed to convert video. Please try again with a different file.");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [video, ready, ffmpeg]);

  const handleDownload = () => {
    if (!mp3 || !video) return;
    const link = document.createElement("a");
    link.href = mp3;
    link.download = video.name.replace(/\.[^/.]+$/, ".mp3");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!ready) {
    return (
      <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
        <p className="text-sm text-gray-700">Loading FFmpeg… please wait</p>
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
        actionButtonText="Convert to MP3"
        onAction={convertToMp3}
        isLoading={isLoading}
        showResult={!!mp3}
        resultUrl={mp3 || undefined}
        resultFileName={convertedFileName}
        resultFileSize={convertedFileSize}
        onDownload={handleDownload}
        className="space-y-2"
      />
    </div>
  );
}
