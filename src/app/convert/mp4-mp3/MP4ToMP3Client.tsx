'use client';

import { useState, useCallback } from 'react';
import FileUpload from '@/components/FileUpload';

export default function MP4ToMP3Client() {
  const [file, setFile] = useState<File | null>(null);
  const [convertedAudioUrl, setConvertedAudioUrl] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>('');
  const [convertedFileSize, setConvertedFileSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetState = () => {
    setFile(null);
    setConvertedAudioUrl(null);
    setConvertedFileName('');
    setConvertedFileSize(0);
    setError(null);
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setConvertedAudioUrl(null);
      setConvertedFileName('');
      setConvertedFileSize(0);
    } else {
      resetState();
    }
  };

  // Server-side conversion
  const handleServerSideConversion = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quality', '192'); // Default quality
      
      const response = await fetch('/api/convert/mp4-mp3', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server-side conversion failed');
      }
      
      const data = await response.json();
      
      // Check if it's a warning about no audio
      if (!data.success && data.warning && !data.hasAudio) {
        setError(data.warning);
        return; // Don't throw error, just set warning and return
      }
      
      if (data.success && data.audioData) {
        // Convert base64 to blob
        const binaryString = atob(data.audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        
        setConvertedAudioUrl(url);
        setConvertedFileSize(data.convertedSize);
        setConvertedFileName(data.fileName);
      } else {
        throw new Error('Invalid response from server');
      }
      
    } catch (error) {
      console.error('Server-side conversion error:', error);
      throw error;
    }
  };


  const handleConvert = useCallback(async () => {
    if (!file) {
      setError('No file selected');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await handleServerSideConversion(file);
    } catch (err: any) {
      console.error('Conversion error:', err);
      
      // Check if it's a warning about no audio
      if (err.message?.includes('does not contain any audio track')) {
        setError('⚠️ The selected video file does not contain any audio track. Please select a video file with audio.');
      } else {
        // Generic error for all other cases
        setError('Some internal error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  const handleDownload = () => {
    if (convertedAudioUrl) {
      const link = document.createElement('a');
      link.href = convertedAudioUrl;
      link.download = convertedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <FileUpload
        allowedExtensions={['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v']}
        onFileChange={handleFileChange}
        onAction={handleConvert}
        onError={setError}
        isLoading={isLoading}
        showResult={!!convertedAudioUrl}
        resultUrl={convertedAudioUrl || undefined}
        resultFileName={convertedFileName}
        resultFileSize={convertedFileSize}
        onDownload={handleDownload}
        actionButtonText="Convert to MP3"
        className="space-y-2"
      />
      
      {/* Display error/warning message if any */}
      {error && (
        <div className={`mt-4 p-4 rounded-xl ${
          error.includes('⚠️') || error.includes('does not contain any audio track')
            ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${
              error.includes('⚠️') || error.includes('does not contain any audio track')
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}>
              {error.includes('⚠️') || error.includes('does not contain any audio track') ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              <h3 className={`text-sm font-medium ${
                error.includes('⚠️') || error.includes('does not contain any audio track')
                  ? 'text-yellow-800'
                  : 'text-red-800'
              }`}>
                {error.includes('⚠️') || error.includes('does not contain any audio track')
                  ? 'No Audio Track Found'
                  : 'Conversion Error'
                }
              </h3>
              <p className={`text-sm mt-1 ${
                error.includes('⚠️') || error.includes('does not contain any audio track')
                  ? 'text-yellow-700'
                  : 'text-red-700'
              }`}>
                {error}
              </p>
              {!error.includes('⚠️') && !error.includes('does not contain any audio track') && (
                <button
                  onClick={() => {
                    setError(null);
                    handleConvert();
                  }}
                  className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}