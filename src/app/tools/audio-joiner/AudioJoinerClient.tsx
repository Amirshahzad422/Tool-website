'use client';

import { useState, useRef } from 'react';
import { FaPlus, FaTrash, FaGripVertical, FaPlay, FaPause, FaDownload } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';

interface AudioFile {
  id: string;
  file: File;
  name: string;
  duration: number;
  size: string;
}

export default function AudioJoinerClient() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedAudioUrl, setMergedAudioUrl] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
        URL.revokeObjectURL(audio.src);
      });
      audio.addEventListener('error', () => {
        resolve(0);
        URL.revokeObjectURL(audio.src);
      });
    });
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      video.addEventListener('loadedmetadata', () => {
        resolve(video.duration);
        URL.revokeObjectURL(video.src);
      });
      video.addEventListener('error', () => {
        resolve(0);
        URL.revokeObjectURL(video.src);
      });
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const allFiles = Array.from(files);
    const validFilesArray = allFiles.filter(file => 
      file.type.startsWith('audio/') || 
      file.type.startsWith('video/') ||
      file.name.toLowerCase().match(/\.(mp3|wav|m4a|ogg|flac|aac|wma|mp4|avi|mov|mkv|webm|wmv)$/)
    );

    // Show error if invalid files were selected
    if (validFilesArray.length < allFiles.length) {
      const rejectedCount = allFiles.length - validFilesArray.length;
      alert(`${rejectedCount} file(s) were rejected. Please select audio or video files.`);
    }

    if (validFilesArray.length === 0) {
      return;
    }

    const newAudioFiles: AudioFile[] = [];
    
    for (const file of validFilesArray) {
      // Try to get duration using video element for better compatibility
      let duration = 0;
      try {
        if (file.type.startsWith('video/')) {
          duration = await getVideoDuration(file);
        } else {
          duration = await getAudioDuration(file);
        }
      } catch (error) {
        console.error('Error getting duration:', error);
        duration = 0;
      }
      
      newAudioFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        duration,
        size: formatFileSize(file.size),
      });
    }

    setAudioFiles(prev => [...prev, ...newAudioFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const removeFile = (id: string) => {
    setAudioFiles(prev => prev.filter(file => file.id !== id));
    if (audioRefs.current[id]) {
      audioRefs.current[id].pause();
      delete audioRefs.current[id];
    }
  };

  const togglePlayPause = (id: string, audioUrl: string) => {
    // Pause all other audio
    Object.entries(audioRefs.current).forEach(([key, audio]) => {
      if (key !== id) {
        audio.pause();
      }
    });

    if (!audioRefs.current[id]) {
      const audio = new Audio(audioUrl);
      audioRefs.current[id] = audio;
      audio.addEventListener('ended', () => {
        setCurrentlyPlaying(null);
      });
    }

    const audio = audioRefs.current[id];
    if (currentlyPlaying === id) {
      audio.pause();
      setCurrentlyPlaying(null);
    } else {
      audio.play();
      setCurrentlyPlaying(id);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const newFiles = [...audioFiles];
    const draggedFile = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, draggedFile);

    setAudioFiles(newFiles);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const mergeAudioFiles = async () => {
    if (audioFiles.length < 2) {
      alert('Please add at least 2 audio files to merge');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      audioFiles.forEach((audioFile, index) => {
        formData.append('files', audioFile.file);
        formData.append('order', index.toString());
      });

      const response = await fetch('/api/tools/audio-joiner', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to merge audio files');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setMergedAudioUrl(url);
    } catch (error) {
      console.error('Error merging audio:', error);
      alert('Failed to merge audio files. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadMergedAudio = () => {
    if (!mergedAudioUrl) return;

    const a = document.createElement('a');
    a.href = mergedAudioUrl;
    a.download = 'merged-audio.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = audioFiles.reduce((acc, file) => acc + file.duration, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Audio Joiner / Merger</h1>
            <p className="text-gray-600">Combine multiple audio files into one seamlessly</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Upload Area */}
        <div
          className={`relative border-3 border-dashed rounded-2xl p-12 text-center mb-8 transition-all duration-300 ${
            isDragOver
              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 scale-[1.02]'
              : 'border-gray-300 bg-white hover:border-purple-300 hover:bg-gray-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className={`w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 ${isDragOver ? 'scale-110' : ''}`}>
                <FaPlus className="text-4xl text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Add Audio or Video Files
              </h3>
              <p className="text-gray-600 text-lg mb-2">
                {isDragOver ? 'Drop your files here!' : 'Drag and drop files here or click to browse'}
              </p>
              <p className="text-sm text-gray-500">
                Audio from videos will be automatically extracted
              </p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg"
            >
              <span className="flex items-center gap-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Choose Files
              </span>
            </button>

            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">MP3</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">WAV</span>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">M4A</span>
              <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full font-medium">OGG</span>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">MP4</span>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">AVI</span>
              <span className="text-gray-400">& more</span>
            </div>
          </div>
        </div>

        {/* Audio Files List */}
        {audioFiles.length > 0 && (
          <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    Files Queue
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-sm font-bold shadow-md">
                      {audioFiles.length}
                    </span>
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <strong>Total Duration:</strong> {formatDuration(totalDuration)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAudioFiles([])}
                className="px-5 py-2.5 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2 transform hover:scale-105"
              >
                <FaTrash className="text-sm" />
                Clear All
              </button>
            </div>

            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-100">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-1">💡 Pro Tip</p>
                  <p className="text-sm text-gray-700">
                    Drag files with the <FaGripVertical className="inline" /> handle to reorder them. Files will be merged in the exact order shown below.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {audioFiles.map((audioFile, index) => (
                <div
                  key={audioFile.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-2 transition-all cursor-move hover:bg-gray-100 ${
                    draggedIndex === index ? 'border-blue-500 opacity-50' : 'border-gray-200'
                  }`}
                >
                  {/* Drag Handle */}
                  <div className="text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600 transition-colors">
                    <FaGripVertical className="text-xl" />
                  </div>

                  {/* Order Number */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md">
                    {index + 1}
                  </div>

                  {/* File Icon & Type Badge */}
                  <div className="flex-shrink-0">
                    {audioFile.file.type.startsWith('video/') ? (
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                        </div>
                        <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shadow">
                          VIDEO
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate text-base">{audioFile.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {formatDuration(audioFile.duration)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        {audioFile.size}
                      </span>
                      {audioFile.file.type.startsWith('video/') && (
                        <>
                          <span>•</span>
                          <span className="text-yellow-600 font-medium">Audio will be extracted</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Play/Pause Button */}
                  <button
                    onClick={() => togglePlayPause(audioFile.id, URL.createObjectURL(audioFile.file))}
                    className="p-3 text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                    title="Preview audio"
                  >
                    {currentlyPlaying === audioFile.id ? (
                      <FaPause className="text-lg" />
                    ) : (
                      <FaPlay className="text-lg" />
                    )}
                  </button>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(audioFile.id)}
                    className="p-3 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                    title="Remove file"
                  >
                    <IoMdClose className="text-xl" />
                  </button>
                </div>
              ))}
            </div>

            {/* Merge Button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              {audioFiles.length < 2 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Add at least 2 files to merge them together.
                  </p>
                </div>
              )}
              <button
                onClick={mergeAudioFiles}
                disabled={isProcessing || audioFiles.length < 2}
                className="w-full px-6 py-5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 text-lg transform hover:scale-[1.02]"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Processing & Merging...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                    </svg>
                    <span>Merge {audioFiles.length} Files into One</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Merged Audio Result */}
        {mergedAudioUrl && (
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl shadow-2xl p-8 border-2 border-green-200">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <span className="text-xl">🎉</span>
                </div>
              </div>
              
              <h3 className="text-3xl font-bold text-gray-900 mb-3">Audio Merged Successfully!</h3>
              <p className="text-gray-700 mb-8 text-lg">Your {audioFiles.length} audio files have been seamlessly combined into one</p>

              {/* Audio Player */}
              <div className="bg-white rounded-xl p-8 mb-8 shadow-lg border border-gray-200">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Preview Your Merged Audio</h4>
                </div>
                <audio
                  controls
                  src={mergedAudioUrl}
                  className="w-full"
                  style={{ maxWidth: '100%' }}
                />
              </div>

              {/* Download Button */}
              <button
                onClick={downloadMergedAudio}
                className="px-10 py-5 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-teal-600 transition-all duration-200 shadow-2xl hover:shadow-green-500/50 flex items-center justify-center gap-3 mx-auto text-xl transform hover:scale-105"
              >
                <FaDownload className="text-2xl" />
                Download Merged Audio
              </button>
              
              <p className="text-sm text-gray-600 mt-4">
                File format: MP3 • Ready to use anywhere
              </p>
            </div>
          </div>
        )}

        {/* Help Section */}
        {audioFiles.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to use Audio Joiner</h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                  1
                </div>
                <p><strong>Add Audio Files:</strong> Click "Choose Audio Files" or drag and drop multiple audio/video files</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                  2
                </div>
                <p><strong>Arrange Order:</strong> Drag files to reorder them. Files will be merged in the order shown</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                  3
                </div>
                <p><strong>Preview:</strong> Use the play button to preview each audio file before merging</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                  4
                </div>
                <p><strong>Merge & Download:</strong> Click "Merge Audio Files" and download your combined audio</p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">✨ Features</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Support for multiple audio formats (MP3, WAV, M4A, OGG, FLAC, AAC)</li>
                <li>• Support for video files (MP4, AVI, MOV) - audio will be extracted</li>
                <li>• Drag and drop reordering</li>
                <li>• Preview audio before merging</li>
                <li>• No file size limits</li>
                <li>• 100% free and secure - server-side processing</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

