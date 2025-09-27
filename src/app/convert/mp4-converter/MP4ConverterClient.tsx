'use client';

import { useState, useRef, useEffect } from 'react';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { FFmpeg } from '@ffmpeg/ffmpeg';
import FileUpload from '@/components/FileUpload';

interface ConversionSettings {
  quality: 'high' | 'medium' | 'low';
  resolution: 'original' | '1080p' | '720p' | '480p' | '360p';
  fps: 'original' | '60' | '30' | '24' | '15';
  bitrate: 'auto' | '5000k' | '3000k' | '2000k' | '1000k' | '500k';
  audioCodec: 'aac' | 'mp3' | 'copy';
  videoCodec: 'h264' | 'h265';
}

export default function MP4ConverterClient() {
  const [file, setFile] = useState<File | null>(null);
  const [convertedFile, setConvertedFile] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [settings, setSettings] = useState<ConversionSettings>({
    quality: 'medium',
    resolution: 'original',
    fps: 'original',
    bitrate: 'auto',
    audioCodec: 'aac',
    videoCodec: 'h264'
  });
  
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = [
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm',
    'video/mkv', 'video/3gp', 'video/ogv', 'video/m4v', 'video/quicktime'
  ];
  const ALLOWED_EXTENSIONS = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp', 'ogv', 'm4v', 'qt'];

  const resetState = () => {
    setFile(null);
    setConvertedFile(null);
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
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(selectedFile.name);
    setError(null);
    setConvertedFile(null);

    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 20 + 5;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(100);
          setFile(selectedFile);
          setUploadingFileName('');
        }, 200);
      }
      setUploadProgress(current);
    }, 150);
  };

  // Load FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      
      try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        ffmpeg.on('log', ({ message }) => {
          console.log('FFmpeg log:', message);
        });
        
        ffmpeg.on('progress', ({ progress }) => {
          setProgress(Math.round(progress * 100));
        });

        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        setFfmpegLoaded(true);
        console.log('FFmpeg loaded successfully');
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        setError('Failed to load video converter. Please refresh the page.');
      }
    };

    loadFFmpeg();
  }, []);


  const handleConvert = async () => {
    if (!file || !ffmpegLoaded || !ffmpegRef.current) return;

    setIsLoading(true);
    setProgress(0);
    setError(null);

    try {
      // First try server-side conversion
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quality', settings.quality);
      formData.append('resolution', settings.resolution);
      formData.append('fps', settings.fps);
      formData.append('bitrate', settings.bitrate);
      formData.append('audioCodec', settings.audioCodec);
      formData.append('videoCodec', settings.videoCodec);

      try {
        const response = await fetch('/api/convert/mp4', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const blob = await response.blob();
          setConvertedFile(blob);
          setIsLoading(false);
          return;
        }
      } catch (serverError) {
        console.log('Server conversion failed, falling back to client-side');
      }

      // Client-side conversion fallback
      const ffmpeg = ffmpegRef.current;
      
      // Write input file to FFmpeg filesystem
      const inputName = 'input.mp4';
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      
      // Build FFmpeg command based on settings
      // eslint-disable-next-line prefer-const
      let command = ['-i', inputName];
      
      // Video codec
      if (settings.videoCodec === 'h265') {
        command.push('-c:v', 'libx265');
      } else {
        command.push('-c:v', 'libx264');
      }
      
      // Quality settings
      switch (settings.quality) {
        case 'high':
          command.push('-crf', '18');
          break;
        case 'medium':
          command.push('-crf', '23');
          break;
        case 'low':
          command.push('-crf', '28');
          break;
      }
      
      // Resolution
      if (settings.resolution !== 'original') {
        switch (settings.resolution) {
          case '1080p':
            command.push('-vf', 'scale=1920:1080');
            break;
          case '720p':
            command.push('-vf', 'scale=1280:720');
            break;
          case '480p':
            command.push('-vf', 'scale=854:480');
            break;
          case '360p':
            command.push('-vf', 'scale=640:360');
            break;
        }
      }
      
      // FPS
      if (settings.fps !== 'original') {
        command.push('-r', settings.fps);
      }
      
      // Bitrate
      if (settings.bitrate !== 'auto') {
        command.push('-b:v', settings.bitrate);
      }
      
      // Audio codec
      if (settings.audioCodec === 'copy') {
        command.push('-c:a', 'copy');
      } else {
        command.push('-c:a', settings.audioCodec);
        command.push('-b:a', '128k');
      }
      
      // Output
      command.push('-y', 'output.mp4');
      
      // Execute FFmpeg command
      await ffmpeg.exec(command);
      
      // Read output file
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data as BlobPart], { type: 'video/mp4' });
      
      setConvertedFile(blob);
      
      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile('output.mp4');
      
    } catch (error) {
      console.error('Conversion failed:', error);
      setError('Conversion failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (convertedFile) {
      const url = URL.createObjectURL(convertedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted_${file?.name?.replace(/\.[^/.]+$/, '') || 'video'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Single outer dropzone like Video → GIF */}
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

      {/* Upload progress pill */}
      {isUploading && (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-800">Uploading {uploadingFileName}…</span>
            <span className="text-sm text-gray-600">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gray-700 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {file && !convertedFile && (
        <button
          onClick={handleConvert}
          disabled={isLoading}
          className="mt-4 w-full py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isLoading ? `Converting… ${Math.round(progress)}%` : 'Convert to MP4'}
        </button>
      )}

      {convertedFile && (
        <button
          onClick={handleDownload}
          className="mt-4 w-full py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
        >
          Download MP4 File
        </button>
      )}
    </div>
  );
}
