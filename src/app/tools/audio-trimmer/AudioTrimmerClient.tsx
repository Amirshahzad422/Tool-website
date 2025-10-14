'use client';

import { useState, useRef, useEffect } from 'react';
import { FaUpload, FaPlay, FaPause, FaDownload, FaCut, FaMusic, FaClock, FaTrash, FaFileAudio } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';

interface AudioFile {
  id: string;
  file: File;
  name: string;
  duration: number;
  size: string;
  url: string;
}

interface TrimSettings {
  start: number;
  end: number;
  isActive: boolean;
}

interface MiddleTrimSettings {
  start: number;
  end: number;
  isActive: boolean;
}

export default function AudioTrimmerClient() {
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trimmedAudioUrl, setTrimmedAudioUrl] = useState<string | null>(null);
  const [trimSettings, setTrimSettings] = useState<TrimSettings>({ start: 0, end: 0, isActive: false });
  const [middleTrimSettings, setMiddleTrimSettings] = useState<MiddleTrimSettings>({ start: 0, end: 0, isActive: false });
  const [trimMode, setTrimMode] = useState<'start-end' | 'middle-remove'>('start-end');
  const [outputFormat, setOutputFormat] = useState('mp3');
  const [currentTime, setCurrentTime] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatFileSize = (bytes: number): string => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      
      const timeout = setTimeout(() => {
        reject(new Error('Timeout loading audio metadata'));
      }, 10000);

      audio.onloadedmetadata = () => {
        clearTimeout(timeout);
        resolve(audio.duration);
      };

      audio.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load audio metadata'));
      };

      audio.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
      alert(`Please select an audio or video file. ${file.name} is not supported.`);
      return;
    }

    try {
      const duration = await getAudioDuration(file);
      const url = URL.createObjectURL(file);
      
      const newAudioFile: AudioFile = {
        id: Date.now().toString(),
        file,
        name: file.name,
        duration,
        size: formatFileSize(file.size),
        url
      };

      setAudioFile(newAudioFile);
      setTrimSettings({
        start: 0,
        end: duration,
        isActive: false
      });
      setMiddleTrimSettings({
        start: 0,
        end: duration,
        isActive: false
      });
      setCurrentTime(0);
      setIsPlaying(false);
      setTrimmedAudioUrl(null);
      
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Failed to process the audio file. Please try a different file.');
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const seekToTime = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const trimAudio = async () => {
    if (!audioFile) return;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', audioFile.file);
      
      if (trimMode === 'start-end') {
        formData.append('startTime', trimSettings.start.toString());
        formData.append('endTime', trimSettings.end.toString());
      } else {
        // For middle removal, we need to create two segments and merge them
        formData.append('middleTrimStart', middleTrimSettings.start.toString());
        formData.append('middleTrimEnd', middleTrimSettings.end.toString());
        formData.append('trimMode', 'middle-remove');
      }
      
      formData.append('outputFormat', outputFormat);

      const response = await fetch('/api/tools/audio-trimmer', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Audio trimming failed');
        } catch {
          throw new Error(errorText || 'Audio trimming failed');
        }
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setTrimmedAudioUrl(url);
    } catch (err: any) {
      console.error('Audio trimming error:', err);
      alert('Failed to trim audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetFile = () => {
    if (audioFile) {
      URL.revokeObjectURL(audioFile.url);
    }
    setAudioFile(null);
    setTrimSettings({ start: 0, end: 0, isActive: false });
    setMiddleTrimSettings({ start: 0, end: 0, isActive: false });
    setCurrentTime(0);
    setIsPlaying(false);
    setTrimmedAudioUrl(null);
  };

  const openTrimModal = () => {
    if (audioFile) {
      setTrimSettings({
        start: 0,
        end: audioFile.duration,
        isActive: true
      });
    }
  };

  const applyTrim = () => {
    setTrimSettings(prev => ({ ...prev, isActive: false }));
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <style>{`
        .slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }
        
        .slider::-webkit-slider-track {
          background: #e5e7eb;
          height: 8px;
          border-radius: 4px;
        }
        
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          background: #3b82f6;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .slider::-webkit-slider-thumb:hover {
          background: #2563eb;
        }
        
        .slider::-moz-range-track {
          background: #e5e7eb;
          height: 8px;
          border-radius: 4px;
          border: none;
        }
        
        .slider::-moz-range-thumb {
          background: #3b82f6;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
        
        .slider::-moz-range-thumb:hover {
          background: #2563eb;
        }
      `}</style>
      
      {/* Header */}
      <div className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-1">Audio Trimmer</h1>
            <p className="text-gray-300 text-sm">
              Trim and cut your audio files with precision
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {!audioFile ? (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#080c2a] rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                <FaMusic className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Audio File</h2>
              <p className="text-gray-600 mb-6">
                Drag and drop your audio file here or click to browse
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-[#080c2a] transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,video/*,.mp3,.wav,.aac,.ogg,.flac,.m4a,.mp4,.avi,.mov,.mkv,.webm"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#080c2a] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#080c2a]/90 transition-colors flex items-center gap-2 mx-auto"
                >
                  <FaUpload className="w-5 h-5" />
                  Choose Audio File
                </button>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {['MP3', 'WAV', 'AAC', 'OGG', 'FLAC', 'M4A', '& more'].map((format) => (
                    <span key={format} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-xl p-8">
            {/* File Info */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <FaFileAudio className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{audioFile.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FaClock className="text-blue-500" />
                        Duration: {formatDuration(audioFile.duration)}
                      </span>
                      <span>Size: {audioFile.size}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={resetFile}
                  className="text-red-500 hover:text-red-700 transition-colors p-2"
                  title="Remove file"
                >
                  <FaTrash className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Audio Player */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={togglePlayPause}
                  className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  {isPlaying ? <FaPause className="w-5 h-5" /> : <FaPlay className="w-5 h-5" />}
                </button>
                <div className="flex-1">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(audioFile.duration)}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max={audioFile.duration}
                      step="0.1"
                      value={currentTime}
                      onChange={(e) => seekToTime(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>
              </div>
              
              <audio
                ref={audioRef}
                src={audioFile.url}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleAudioEnded}
                className="hidden"
              />
            </div>

            {/* Trim Controls */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <FaCut className="text-blue-500" />
                Trim Options
              </h3>

              {/* Trim Mode Selection */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setTrimMode('start-end')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      trimMode === 'start-end' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Trim Start & End
                  </button>
                  <button
                    onClick={() => setTrimMode('middle-remove')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      trimMode === 'middle-remove' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Remove Middle Part
                  </button>
                </div>
              </div>

              {/* Visual Timeline */}
              <div className="mb-4">
                <div className="relative bg-gray-200 rounded-lg h-16 p-2">
                  <div className="relative w-full h-full bg-gray-300 rounded-md overflow-hidden">
                    {trimMode === 'start-end' ? (
                      <>
                        {/* Trimmed Section Highlight */}
                        <div 
                          className="absolute top-0 h-full bg-green-400 rounded-md opacity-60"
                          style={{
                            left: `${(trimSettings.start / audioFile.duration) * 100}%`,
                            width: `${((trimSettings.end - trimSettings.start) / audioFile.duration) * 100}%`
                          }}
                        />
                        
                        {/* Start Handle */}
                        <div 
                          className="absolute top-0 w-4 h-full bg-blue-600 cursor-ew-resize rounded-l-md flex items-center justify-center hover:bg-blue-700 transition-colors"
                          style={{ left: `${(trimSettings.start / audioFile.duration) * 100}%` }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const startX = e.clientX;
                            const startValue = trimSettings.start;
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const deltaX = moveEvent.clientX - startX;
                              const timelineWidth = (e.target as HTMLElement).parentElement!.parentElement!.offsetWidth - 16;
                              const deltaTime = (deltaX / timelineWidth) * audioFile.duration;
                              const newStart = Math.max(0, Math.min(startValue + deltaTime, trimSettings.end - 0.1));
                              
                              setTrimSettings(prev => ({ ...prev, start: newStart }));
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        >
                          <div className="w-2 h-8 bg-white rounded-full"></div>
                        </div>
                        
                        {/* End Handle */}
                        <div 
                          className="absolute top-0 w-4 h-full bg-red-600 cursor-ew-resize rounded-r-md flex items-center justify-center hover:bg-red-700 transition-colors"
                          style={{ left: `${(trimSettings.end / audioFile.duration) * 100}%` }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const startX = e.clientX;
                            const startValue = trimSettings.end;
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const deltaX = moveEvent.clientX - startX;
                              const timelineWidth = (e.target as HTMLElement).parentElement!.parentElement!.offsetWidth - 16;
                              const deltaTime = (deltaX / timelineWidth) * audioFile.duration;
                              const newEnd = Math.min(audioFile.duration, Math.max(startValue + deltaTime, trimSettings.start + 0.1));
                              
                              setTrimSettings(prev => ({ ...prev, end: newEnd }));
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        >
                          <div className="w-2 h-8 bg-white rounded-full"></div>
                        </div>
                        
                        {/* Time Markers */}
                        <div className="absolute top-0 left-0 w-full h-full flex justify-between items-center px-3 pointer-events-none">
                          <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-1 rounded shadow-sm">
                            {formatDuration(trimSettings.start)}
                          </span>
                          <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-1 rounded shadow-sm">
                            {formatDuration(trimSettings.end)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Middle Section to Remove */}
                        <div 
                          className="absolute top-0 h-full bg-red-400 rounded-md opacity-60"
                          style={{
                            left: `${(middleTrimSettings.start / audioFile.duration) * 100}%`,
                            width: `${((middleTrimSettings.end - middleTrimSettings.start) / audioFile.duration) * 100}%`
                          }}
                        />
                        
                        {/* Start Handle */}
                        <div 
                          className="absolute top-0 w-4 h-full bg-blue-600 cursor-ew-resize rounded-l-md flex items-center justify-center hover:bg-blue-700 transition-colors"
                          style={{ left: `${(middleTrimSettings.start / audioFile.duration) * 100}%` }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const startX = e.clientX;
                            const startValue = middleTrimSettings.start;
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const deltaX = moveEvent.clientX - startX;
                              const timelineWidth = (e.target as HTMLElement).parentElement!.parentElement!.offsetWidth - 16;
                              const deltaTime = (deltaX / timelineWidth) * audioFile.duration;
                              const newStart = Math.max(0, Math.min(startValue + deltaTime, middleTrimSettings.end - 0.1));
                              
                              setMiddleTrimSettings(prev => ({ ...prev, start: newStart }));
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        >
                          <div className="w-2 h-8 bg-white rounded-full"></div>
                        </div>
                        
                        {/* End Handle */}
                        <div 
                          className="absolute top-0 w-4 h-full bg-red-600 cursor-ew-resize rounded-r-md flex items-center justify-center hover:bg-red-700 transition-colors"
                          style={{ left: `${(middleTrimSettings.end / audioFile.duration) * 100}%` }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const startX = e.clientX;
                            const startValue = middleTrimSettings.end;
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const deltaX = moveEvent.clientX - startX;
                              const timelineWidth = (e.target as HTMLElement).parentElement!.parentElement!.offsetWidth - 16;
                              const deltaTime = (deltaX / timelineWidth) * audioFile.duration;
                              const newEnd = Math.min(audioFile.duration, Math.max(startValue + deltaTime, middleTrimSettings.start + 0.1));
                              
                              setMiddleTrimSettings(prev => ({ ...prev, end: newEnd }));
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        >
                          <div className="w-2 h-8 bg-white rounded-full"></div>
                        </div>
                        
                        {/* Time Markers */}
                        <div className="absolute top-0 left-0 w-full h-full flex justify-between items-center px-3 pointer-events-none">
                          <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-1 rounded shadow-sm">
                            {formatDuration(middleTrimSettings.start)}
                          </span>
                          <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-1 rounded shadow-sm">
                            {formatDuration(middleTrimSettings.end)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Time Labels */}
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  {trimMode === 'start-end' ? (
                    <>
                      <span className="bg-blue-100 px-2 py-1 rounded">Start: {formatDuration(trimSettings.start)}</span>
                      <span className="bg-green-100 px-2 py-1 rounded">Keep: {formatDuration(trimSettings.end - trimSettings.start)}</span>
                      <span className="bg-red-100 px-2 py-1 rounded">End: {formatDuration(trimSettings.end)}</span>
                    </>
                  ) : (
                    <>
                      <span className="bg-blue-100 px-2 py-1 rounded">Start: {formatDuration(middleTrimSettings.start)}</span>
                      <span className="bg-red-100 px-2 py-1 rounded">Remove: {formatDuration(middleTrimSettings.end - middleTrimSettings.start)}</span>
                      <span className="bg-green-100 px-2 py-1 rounded">End: {formatDuration(middleTrimSettings.end)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Time Inputs */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {trimMode === 'start-end' ? 'Start Time (seconds)' : 'Remove Start (seconds)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={audioFile.duration}
                    step="0.1"
                    value={trimMode === 'start-end' ? trimSettings.start : middleTrimSettings.start}
                    onChange={(e) => {
                      const value = Math.max(0, Math.min(parseFloat(e.target.value) || 0, audioFile.duration));
                      if (trimMode === 'start-end') {
                        setTrimSettings(prev => ({ ...prev, start: Math.min(value, prev.end - 0.1) }));
                      } else {
                        setMiddleTrimSettings(prev => ({ ...prev, start: Math.min(value, prev.end - 0.1) }));
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white hover:border-blue-400 focus:outline-none focus:border-blue-500 transition-all duration-200 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {trimMode === 'start-end' ? 'End Time (seconds)' : 'Remove End (seconds)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={audioFile.duration}
                    step="0.1"
                    value={trimMode === 'start-end' ? trimSettings.end : middleTrimSettings.end}
                    onChange={(e) => {
                      const value = Math.min(audioFile.duration, Math.max(parseFloat(e.target.value) || 0, 0));
                      if (trimMode === 'start-end') {
                        setTrimSettings(prev => ({ ...prev, end: Math.max(value, prev.start + 0.1) }));
                      } else {
                        setMiddleTrimSettings(prev => ({ ...prev, end: Math.max(value, prev.start + 0.1) }));
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white hover:border-blue-400 focus:outline-none focus:border-blue-500 transition-all duration-200 font-medium"
                  />
                </div>
              </div>

              {/* Duration Display */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-green-700 flex items-center gap-2">
                    <FaClock className="text-green-500" />
                    {trimMode === 'start-end' ? 'Final Duration:' : 'Remaining Duration:'}
                  </span>
                  <span className="text-lg font-bold text-green-900">
                    {trimMode === 'start-end' 
                      ? formatDuration(trimSettings.end - trimSettings.start)
                      : formatDuration(audioFile.duration - (middleTrimSettings.end - middleTrimSettings.start))
                    }
                  </span>
                </div>
                <div className="mt-2 text-xs text-green-600">
                  Original: {formatDuration(audioFile.duration)} → Final: {trimMode === 'start-end' 
                    ? formatDuration(trimSettings.end - trimSettings.start)
                    : formatDuration(audioFile.duration - (middleTrimSettings.end - middleTrimSettings.start))
                  }
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={trimAudio}
                disabled={isProcessing}
                className="w-full bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCut className="w-5 h-5" />
                    {trimMode === 'start-end' ? 'Trim Audio' : 'Remove Middle Part'}
                  </>
                )}
              </button>
            </div>

            {/* Trimmed Audio Preview */}
            {trimmedAudioUrl && (
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                  <FaMusic className="text-green-500" />
                  Trimmed Audio Preview
                </h3>
                <div className="text-center">
                  <audio
                    src={trimmedAudioUrl}
                    controls
                    className="w-full max-w-md mx-auto"
                  >
                    Your browser does not support the audio element.
                  </audio>
                  <div className="mt-4">
                    <a
                      href={trimmedAudioUrl}
                      download={`trimmed_audio.${outputFormat}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FaDownload className="text-lg" />
                      Download Trimmed Audio
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
