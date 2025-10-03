'use client';

import { useState, useRef, useEffect } from 'react';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { FFmpeg } from '@ffmpeg/ffmpeg';
import FileUpload from '@/components/FileUpload';

interface ConversionSettings {
  quality: 'high' | 'medium' | 'low';
  bitrate: 'auto' | '320' | '256' | '192' | '128' | '96' | '64';
  sampleRate: 'original' | '48000' | '44100' | '22050' | '11025';
  channels: 'original' | 'stereo' | 'mono';
  encodingMode: 'vbr' | 'cbr' | 'abr';
}

export default function MP3ToOggClient() {
  const [file, setFile] = useState<File | null>(null);
  const [convertedFile, setConvertedFile] = useState<Blob | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [convertedFileSize, setConvertedFileSize] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [settings, setSettings] = useState<ConversionSettings>({
    quality: 'medium',
    bitrate: 'auto',
    sampleRate: 'original',
    channels: 'original',
    encodingMode: 'vbr'
  });
  
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4',
    'audio/x-m4a', 'audio/wave', 'audio/x-wav', 'audio/vorbis'
  ];
  const ALLOWED_EXTENSIONS = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'aiff', 'au'];

  const resetState = () => {
    setFile(null);
    setConvertedFile(null);
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
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(selectedFile.name);
    setError(null);
    setConvertedFile(null);
    setConvertedFileName("");
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
        setError('Failed to load audio converter. Please refresh the page.');
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
      formData.append('bitrate', settings.bitrate);
      formData.append('sampleRate', settings.sampleRate);
      formData.append('channels', settings.channels);
      formData.append('encodingMode', settings.encodingMode);

      try {
        const response = await fetch('/api/convert/mp3-ogg', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const blob = await response.blob();
          setConvertedFile(blob);
          setConvertedFileName(file.name.replace(/\.[^/.]+$/, ".ogg"));
          setConvertedFileSize(blob.size);
          setIsLoading(false);
          return;
        }
      } catch (serverError) {
        console.log('Server conversion failed, falling back to client-side');
      }

      // Client-side conversion fallback
      const ffmpeg = ffmpegRef.current;
      
      // Write input file to FFmpeg filesystem
      const inputName = 'input.mp3';
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      
      // Build FFmpeg command based on settings
      // eslint-disable-next-line prefer-const
      let command = ['-i', inputName];
      
      // Audio codec
      command.push('-c:a', 'libvorbis');
      
      // Quality settings
      switch (settings.quality) {
        case 'high':
          command.push('-q:a', '6');
          break;
        case 'medium':
          command.push('-q:a', '4');
          break;
        case 'low':
          command.push('-q:a', '2');
          break;
      }
      
      // Sample rate
      if (settings.sampleRate !== 'original') {
        command.push('-ar', settings.sampleRate);
      }
      
      // Channels
      if (settings.channels !== 'original') {
        if (settings.channels === 'mono') {
          command.push('-ac', '1');
        } else {
          command.push('-ac', '2');
        }
      }
      
      // Encoding mode and bitrate
      if (settings.encodingMode === 'cbr' && settings.bitrate !== 'auto') {
        command.push('-b:a', `${settings.bitrate}k`);
      } else if (settings.encodingMode === 'abr' && settings.bitrate !== 'auto') {
        command.push('-abr', '1', '-b:a', `${settings.bitrate}k`);
      }
      
      // Output
      command.push('-y', 'output.ogg');
      
      // Execute FFmpeg command
      await ffmpeg.exec(command);
      
      // Read output file
      const data = await ffmpeg.readFile('output.ogg');
      const blob = new Blob([data as BlobPart], { type: 'audio/ogg' });
      
      setConvertedFile(blob);
      setConvertedFileName(file.name.replace(/\.[^/.]+$/, ".ogg"));
      setConvertedFileSize(blob.size);
      
      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile('output.ogg');
      
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
      a.download = `converted_${file?.name?.replace(/\.[^/.]+$/, '') || 'audio'}.ogg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
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
        actionButtonText="Convert to OGG"
        onAction={handleConvert}
        isLoading={isLoading}
        showResult={!!convertedFile}
        resultUrl={convertedFile ? URL.createObjectURL(convertedFile) : undefined}
        resultFileName={convertedFileName}
        resultFileSize={convertedFileSize}
        onDownload={handleDownload}
        className="space-y-2"
      />
    </div>
  );

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
          {isLoading ? `Converting… ${Math.round(progress)}%` : 'Convert to OGG'}
        </button>
      )}

      {convertedFile && (
        <button
          onClick={handleDownload}
          className="mt-4 w-full py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
        >
          Download OGG File
        </button>
      )}
    </div>
  );
}
