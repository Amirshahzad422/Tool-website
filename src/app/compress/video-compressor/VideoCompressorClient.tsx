'use client';

import { useState, useRef, useEffect } from 'react';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { FFmpeg } from '@ffmpeg/ffmpeg';
import FileUpload from '@/components/FileUpload';

interface CompressionSettings {
  quality: 'high' | 'medium' | 'low';
  resolution: 'original' | '720p' | '480p' | '360p';
  fps: 'original' | '30' | '24' | '15';
  bitrate: 'auto' | '1000k' | '500k' | '250k';
}

export default function VideoCompressorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading video compressor...");
  const [compressedFileName, setCompressedFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [settings, setSettings] = useState<CompressionSettings>({
    quality: 'medium',
    resolution: '720p',
    fps: '30',
    bitrate: '500k'
  });
  
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
  const ALLOWED_MIME_TYPES = [
    'video/mp4', 'video/avi', 'video/quicktime', 'video/webm', 'video/x-msvideo',
    'video/x-ms-wmv', 'video/3gpp', 'video/x-flv', 'video/x-matroska'
  ];
  const ALLOWED_EXTENSIONS = ['mp4', 'avi', 'mov', 'webm', 'mkv', 'flv', 'wmv', '3gp', 'm4v'];

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

        setLoadingMessage("Loading FFmpeg core...");
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        setFfmpegLoaded(true);
        setLoadingMessage("Video compressor ready!");
        console.log('FFmpeg loaded successfully');
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        setError('Failed to load video compressor. Please refresh the page.');
      }
    };

    loadFFmpeg();
  }, []);

  const resetState = () => {
    setFile(null);
    setCompressedFile(null);
    setCompressedFileName("");
    setError(null);
    setProgress(0);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName("");
  };

  const handleFileChange = (selectedFile: File | null) => {
    console.log('[VideoCompressor] handleFileChange:', selectedFile?.name || selectedFile);
    // If file was cleared/removed
    if (!selectedFile) {
      resetState();
      return;
    }

    // Set file immediately so UI (settings/button) appears right away
    setFile(selectedFile);
    setError(null);
    setCompressedFile(null);
    setCompressedFileName("");
    setProgress(0);
    
    // Reset upload states - no simulation needed
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName("");
    
    console.log('[VideoCompressor] File set, compression options should be visible now');
  };

  const handleCompress = async () => {
    if (!file || !ffmpegLoaded || !ffmpegRef.current) return;

    setIsLoading(true);
    setProgress(0);
    setError(null);

    try {
      // First try server-side compression
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quality', settings.quality);
      formData.append('resolution', settings.resolution);
      formData.append('fps', settings.fps);
      formData.append('bitrate', settings.bitrate);

      try {
        const response = await fetch('/api/compress/video', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const blob = await response.blob();
          setCompressedFile(blob);
          setCompressedFileName(`compressed_${file.name}`);
          setIsLoading(false);
          return;
        }
      } catch (serverError) {
        console.log('Server compression failed, falling back to client-side');
      }

      // Client-side compression fallback
      const ffmpeg = ffmpegRef.current;
      
      // Write input file to FFmpeg filesystem
      await ffmpeg.writeFile('input.mp4', await fetchFile(file));
      
      // Build FFmpeg command based on settings
      // eslint-disable-next-line prefer-const
      let command = ['-i', 'input.mp4'];
      
      // Video codec and quality - More aggressive compression
      switch (settings.quality) {
        case 'high':
          command.push('-c:v', 'libx264', '-crf', '28', '-preset', 'slow', '-profile:v', 'baseline');
          break;
        case 'medium':
          command.push('-c:v', 'libx264', '-crf', '32', '-preset', 'medium', '-profile:v', 'baseline');
          break;
        case 'low':
          command.push('-c:v', 'libx264', '-crf', '35', '-preset', 'fast', '-profile:v', 'baseline');
          break;
      }
      
      // Resolution
      if (settings.resolution !== 'original') {
        switch (settings.resolution) {
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
      
      // Audio codec - More aggressive audio compression
      command.push('-c:a', 'aac', '-b:a', '64k', '-ac', '2');
      
      // Additional compression options
      command.push('-movflags', '+faststart');
      
      // Output
      command.push('-y', 'output.mp4');
      
      // Execute FFmpeg command
      await ffmpeg.exec(command);
      
      // Read output file
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data as BlobPart], { type: 'video/mp4' });
      
      setCompressedFile(blob);
      setCompressedFileName(`compressed_${file.name}`);
      
      // Cleanup
      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile('output.mp4');
      
    } catch (error) {
      console.error('Compression failed:', error);
      setError('Compression failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (compressedFile) {
      const url = URL.createObjectURL(compressedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = compressedFileName || `compressed_${file?.name || 'video.mp4'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };


  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-transparent p-8">
        <div className="space-y-6">
          {/* File Upload */}
          <div className="mt-16 sm:mt-20 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-16 sm:p-20 text-center min-h-[220px]">
            <div className="flex justify-center">
              <div className="w-full max-w-xs">
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
                  <span className="text-sm text-gray-800">Uploading {uploadingFileName}…</span>
                </div>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gray-700 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {/* Selected File Summary */}
          {file && !isUploading && (
            <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{file.name}</div>
                  <div className="text-xs text-gray-600">{formatFileSize(file.size)}</div>
                </div>
                <button onClick={resetState} className="text-sm text-gray-600 hover:text-red-600 transition-colors">Remove</button>
              </div>
            </div>
          )}

          {/* Compression Settings */}
          {file && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Compression Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality
                  </label>
                  <select
                    value={settings.quality}
                    onChange={(e) => setSettings({...settings, quality: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                  >
                    <option value="high">High Quality (30% smaller)</option>
                    <option value="medium">Medium Quality (50% smaller)</option>
                    <option value="low">Low Quality (70% smaller)</option>
                  </select>
                </div>

                {/* Resolution */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution
                  </label>
                  <select
                    value={settings.resolution}
                    onChange={(e) => setSettings({...settings, resolution: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                  >
                    <option value="original">Original Resolution</option>
                    <option value="720p">720p (HD)</option>
                    <option value="480p">480p (SD)</option>
                    <option value="360p">360p (Low)</option>
                  </select>
                </div>

                {/* FPS */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frame Rate
                  </label>
                  <select
                    value={settings.fps}
                    onChange={(e) => setSettings({...settings, fps: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                  >
                    <option value="original">Original FPS</option>
                    <option value="30">30 FPS</option>
                    <option value="24">24 FPS</option>
                    <option value="15">15 FPS</option>
                  </select>
                </div>

                {/* Bitrate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bitrate
                  </label>
                  <select
                    value={settings.bitrate}
                    onChange={(e) => setSettings({...settings, bitrate: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                  >
                    <option value="auto">Auto (Recommended)</option>
                    <option value="800k">800 kbps</option>
                    <option value="500k">500 kbps</option>
                    <option value="300k">300 kbps</option>
                    <option value="150k">150 kbps</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl" role="alert">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Compress Button */}
          {file && (
            <button
              onClick={handleCompress}
              disabled={isLoading || !ffmpegLoaded}
              className="mt-4 w-full py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Compressing… {progress}%
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Compress Video
                  </>
                )}
              </span>
            </button>
          )}

          {/* Progress Bar */}
          {isLoading && (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Compressing video...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-300/50 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-gray-600 to-gray-700 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Download Button */}
          {compressedFile && (
            <button
              onClick={handleDownload}
              className="mt-4 w-full py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Compressed Video
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
