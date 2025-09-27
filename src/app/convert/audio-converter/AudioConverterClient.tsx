'use client';

import { useState, useCallback } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import FileUpload from '@/components/FileUpload';

type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac' | 'aac' | 'm4a' | 'wma' | 'aiff' | 'au';

export default function AudioConverterClient() {
  const [file, setFile] = useState<File | null>(null);
  const [convertedAudioUrl, setConvertedAudioUrl] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>('');
  const [target, setTarget] = useState<AudioFormat>('mp3');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [convertProgress, setConvertProgress] = useState(0);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = [
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4',
    'audio/x-m4a', 'audio/wave', 'audio/x-wav', 'audio/vorbis', 'audio/x-ms-wma',
    'audio/aiff', 'audio/basic'
  ];
  const ALLOWED_EXTENSIONS: AudioFormat[] = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'aiff', 'au'];

  const resetState = () => {
    setFile(null);
    setConvertedAudioUrl(null);
    setConvertedFileName('');
    setError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName('');
    setConvertProgress(0);
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
    setConvertedAudioUrl(null);
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
          setFile(selectedFile);
          setUploadingFileName('');
        }, 200);
      }
      setUploadProgress(current);
    }, 150);
  };

  const handleConvert = useCallback(async () => {
    if (!file) {
      setError('Please upload an audio file first.');
      return;
    }
    setIsLoading(true);
    setConvertProgress(0);
    setError(null);
    setConvertedAudioUrl(null);
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 15 + 5;
      if (current >= 95) current = 95;
      setConvertProgress(current);
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFormat', target);
      formData.append('quality', '192');

      const response = await fetch('/api/convert/audio-converter', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Audio conversion failed.');
      }

      const result = await response.json();

      // Convert base64 to blob
      const byteCharacters = atob(result.audioData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: result.mimeType });

      const url = URL.createObjectURL(blob);
      setConvertedAudioUrl(url);
      setConvertedFileName(result.fileName);
      setConvertProgress(100);
    } catch (err: any) {
      console.error('Conversion error:', err);
      setError(err.message || 'Failed to convert audio. Please try again.');
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  }, [file, target]);

  const handleDownload = () => {
    if (convertedAudioUrl && convertedFileName) {
      const a = document.createElement('a');
      a.href = convertedAudioUrl;
      a.download = convertedFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const getFileIcon = (extension: string): string => {
    switch (extension.toLowerCase()) {
      case 'mp3': return '🎵';
      case 'wav': return '🔊';
      case 'ogg': return '🎶';
      case 'flac': return '🎼';
      case 'aac': return '🎧';
      case 'm4a': return '🍎';
      case 'wma': return '🪟';
      case 'aiff': return '🎚️';
      case 'au': return '🔔';
      default: return '🎵';
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

      {file && !convertedAudioUrl && (
        <button
          onClick={handleConvert}
          disabled={isLoading}
          className="mt-4 w-full py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isLoading ? `Converting… ${Math.round(convertProgress)}%` : `Convert to ${target.toUpperCase()}`}
        </button>
      )}

      {convertedAudioUrl && (
        <button
          onClick={handleDownload}
          className="mt-4 w-full py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
        >
          Download {target.toUpperCase()} File
        </button>
      )}
    </div>
  );
}
