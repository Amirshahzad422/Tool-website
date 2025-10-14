'use client';

import { useState, useRef, useEffect } from 'react';
import { FaPlus, FaTrash, FaGripVertical, FaPlay, FaPause, FaDownload, FaCut, FaVolumeUp, FaClock, FaExpand, FaRandom, FaVideo } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';

interface VideoFile {
  id: string;
  file: File;
  name: string;
  duration: number;
  size: string;
  trimmedStart: number;
  trimmedEnd: number;
  isTrimmed: boolean;
  waveform?: number[];
  volume: number;
  volumeSegments: VolumeSegment[];
  resolution: string;
  fps: number;
  transition?: TransitionSettings;
}

interface VolumeSegment {
  id: string;
  startTime: number;
  endTime: number;
  volume: number;
  isActive: boolean;
}

interface TransitionSettings {
  type: 'none' | 'fade' | 'slide' | 'zoom' | 'dissolve';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

interface TrimSettings {
  start: number;
  end: number;
  isActive: boolean;
}

export default function VideoJoinerClient() {
  const [videoFiles, setVideoFiles] = useState<VideoFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [trimSettings, setTrimSettings] = useState<TrimSettings>({ start: 0, end: 0, isActive: false });
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('timeline');
  const [isGeneratingWaveform, setIsGeneratingWaveform] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<{fileId: string, segmentId: string} | null>(null);
  const [volumeModalOpen, setVolumeModalOpen] = useState(false);
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
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

  const applyTrim = () => {
    if (!selectedFileId) return;
    
    setVideoFiles(prev => prev.map(file => {
      if (file.id === selectedFileId) {
        return {
          ...file,
          trimmedStart: trimSettings.start,
          trimmedEnd: trimSettings.end,
          isTrimmed: true,
          duration: trimSettings.end - trimSettings.start
        };
      }
      return file;
    }));
    
    setTrimSettings({ start: 0, end: 0, isActive: false });
    setSelectedFileId(null);
  };

  const openTrimModal = (fileId: string) => {
    const file = videoFiles.find(f => f.id === fileId);
    if (file) {
      setSelectedFileId(fileId);
      setTrimSettings({
        start: file.trimmedStart,
        end: file.trimmedEnd || file.duration,
        isActive: true
      });
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      const timeout = setTimeout(() => {
        reject(new Error('Timeout getting video duration'));
      }, 10000);

      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.onerror = () => {
        clearTimeout(timeout);
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Error loading video metadata'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const getVideoMetadata = async (file: File): Promise<{resolution: string, fps: number}> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      const timeout = setTimeout(() => {
        reject(new Error('Timeout getting video metadata'));
      }, 10000);

      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        window.URL.revokeObjectURL(video.src);
        resolve({
          resolution: `${video.videoWidth}x${video.videoHeight}`,
          fps: 30
        });
      };

      video.onerror = () => {
        clearTimeout(timeout);
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Error loading video metadata'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const generateMockWaveform = (): number[] => {
    const waveform: number[] = [];
    for (let i = 0; i < 100; i++) {
      const value = Math.sin(i * 0.1) * 0.3 + Math.random() * 0.2;
      waveform.push(Math.abs(value));
    }
    return waveform;
  };

  const generateWaveform = async (file: File): Promise<number[]> => {
    return new Promise((resolve) => {
      try {
        console.log('Generating mock waveform for video file:', file.name);
        resolve(generateMockWaveform());
      } catch (error) {
        console.warn('Error generating waveform:', error);
        resolve(generateMockWaveform());
      }
    });
  };

  const shuffleFiles = () => {
    setVideoFiles(prev => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  };

  const resetTrim = (fileId: string) => {
    setVideoFiles(prev => prev.map(file => 
      file.id === fileId 
        ? {
            ...file,
            trimmedStart: 0,
            trimmedEnd: file.duration,
            isTrimmed: false
          }
        : file
    ));
  };

  const updateVolume = (id: string, volume: number) => {
    setVideoFiles(prev => prev.map(file => 
      file.id === id 
        ? { ...file, volume: Math.max(0, Math.min(1, volume)) }
        : file
    ));
    
    if (videoRefs.current[id] && currentlyPlaying === id) {
      videoRefs.current[id].volume = volume;
    }
  };

  const addVolumeSegment = (fileId: string, startTime: number, endTime: number, volume: number) => {
    const segmentId = `${Date.now()}-${Math.random()}`;
    const newSegment: VolumeSegment = {
      id: segmentId,
      startTime,
      endTime,
      volume: Math.max(0, Math.min(2, volume)),
      isActive: true
    };

    setVideoFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, volumeSegments: [...file.volumeSegments, newSegment] }
        : file
    ));
  };

  const updateVolumeSegment = (fileId: string, segmentId: string, volume: number) => {
    setVideoFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { 
            ...file, 
            volumeSegments: file.volumeSegments.map(segment => 
              segment.id === segmentId 
                ? { ...segment, volume: Math.max(0, Math.min(2, volume)) }
                : segment
            )
          }
        : file
    ));
  };

  const removeVolumeSegment = (fileId: string, segmentId: string) => {
    setVideoFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { 
            ...file, 
            volumeSegments: file.volumeSegments.filter(segment => segment.id !== segmentId)
          }
        : file
    ));
  };

  const toggleVolumeSegment = (fileId: string, segmentId: string) => {
    setVideoFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { 
            ...file, 
            volumeSegments: file.volumeSegments.map(segment => 
              segment.id === segmentId 
                ? { ...segment, isActive: !segment.isActive }
                : segment
            )
          }
        : file
    ));
  };

  const updateTransition = (fileId: string, transition: TransitionSettings) => {
    setVideoFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, transition }
        : file
    ));
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const allFiles = Array.from(files);
    const validFilesArray = allFiles.filter(file => 
      file.type.startsWith('video/') ||
      file.name.toLowerCase().match(/\.(mp4|avi|mov|mkv|webm|wmv|flv|m4v|3gp)$/)
    );

    if (validFilesArray.length < allFiles.length) {
      const rejectedCount = allFiles.length - validFilesArray.length;
      alert(`${rejectedCount} file(s) were rejected. Please select video files.`);
    }

    if (validFilesArray.length === 0) {
      return;
    }

    const newVideoFiles: VideoFile[] = [];
    
    for (const file of validFilesArray) {
      try {
        let duration = 0;
        let resolution = 'Unknown';
        let fps = 30;
        
        try {
          duration = await getVideoDuration(file);
          const metadata = await getVideoMetadata(file);
          resolution = metadata.resolution;
          fps = metadata.fps;
        } catch (error) {
          console.warn('Error getting video metadata for file:', file.name, error);
          duration = 0;
        }

        let waveform: number[] = [];
        try {
          setIsGeneratingWaveform(true);
          waveform = await generateWaveform(file);
        } catch (error) {
          console.warn('Error generating waveform for file:', file.name, error);
          waveform = generateMockWaveform();
        }
        setIsGeneratingWaveform(false);

        newVideoFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          duration,
          size: formatFileSize(file.size),
          trimmedStart: 0,
          trimmedEnd: duration || 0,
          isTrimmed: false,
          waveform,
          volume: 1.0,
          volumeSegments: [],
          resolution,
          fps,
          transition: { type: 'none', duration: 0 }
        });
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        newVideoFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          duration: 0,
          size: formatFileSize(file.size),
          trimmedStart: 0,
          trimmedEnd: 0,
          isTrimmed: false,
          waveform: generateMockWaveform(),
          volume: 1.0,
          volumeSegments: [],
          resolution: 'Unknown',
          fps: 30,
          transition: { type: 'none', duration: 0 }
        });
      }
    }

    setVideoFiles(prev => [...prev, ...newVideoFiles]);
  };

  const removeFile = (id: string) => {
    setVideoFiles(prev => prev.filter(file => file.id !== id));
    
    if (videoRefs.current[id]) {
      videoRefs.current[id].pause();
      delete videoRefs.current[id];
    }
  };

  const togglePlayPause = (id: string, videoUrl: string) => {
    try {
      setCurrentlyPlaying(id);
    } catch (error) {
      console.warn('Error in togglePlayPause:', error);
      setCurrentlyPlaying(null);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      setVideoFiles(prev => {
        const newFiles = [...prev];
        const draggedFile = newFiles[draggedIndex];
        newFiles.splice(draggedIndex, 1);
        newFiles.splice(dragOverIndex, 0, draggedFile);
        return newFiles;
      });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const mergeVideoFiles = async () => {
    if (videoFiles.length === 0) {
      alert('Please add at least one video file');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      videoFiles.forEach((videoFile, index) => {
        formData.append('files', videoFile.file);
        formData.append('order', index.toString());
        formData.append('trimmedStart', videoFile.trimmedStart.toString());
        formData.append('trimmedEnd', videoFile.trimmedEnd.toString());
        formData.append('isTrimmed', videoFile.isTrimmed.toString());
        formData.append('volume', videoFile.volume.toString());
        formData.append('volumeSegments', JSON.stringify(videoFile.volumeSegments));
        formData.append('resolution', videoFile.resolution);
        formData.append('fps', videoFile.fps.toString());
        formData.append('transition', JSON.stringify(videoFile.transition));
      });

      const response = await fetch('/api/tools/video-joiner', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Video merging failed');
        } catch {
          throw new Error(errorText || 'Video merging failed');
        }
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setMergedVideoUrl(url);
    } catch (err: any) {
      console.error('Video merging error:', err);
      alert('Some internal error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalDuration = videoFiles.reduce((acc, file) => {
    const trimmedDuration = file.isTrimmed ? (file.trimmedEnd - file.trimmedStart) : file.duration;
    return acc + trimmedDuration;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-900">
      <style jsx>{`
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
            <h1 className="text-2xl font-bold text-white mb-1">Video Joiner</h1>
            <p className="text-gray-300 text-sm">
              Join multiple videos into one seamless video
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {videoFiles.length === 0 ? (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#080c2a] rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                <FaVideo className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Video Files</h2>
              <p className="text-gray-600 mb-6">
                Drag and drop files here or click to browse
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-[#080c2a] transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="video/*,.mp4,.avi,.mov,.mkv,.webm,.wmv,.flv,.m4v,.3gp"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#080c2a] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#080c2a]/90 transition-colors flex items-center gap-2 mx-auto"
                >
                  <FaPlus className="w-5 h-5" />
                  Choose Files
                </button>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {['MP4', 'AVI', 'MOV', 'MKV', 'WEBM', 'WMV', '& more'].map((format) => (
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
        <div className="flex h-[calc(100vh-80px)]">
          {/* Main Video Preview Area */}
          <div className="flex-1 bg-gray-800 p-6">
            <div className="h-full bg-black rounded-lg flex items-center justify-center relative">
              <div className="w-full h-full flex items-center justify-center">
                {currentlyPlaying ? (
                  <video
                    key={currentlyPlaying}
                    src={URL.createObjectURL(videoFiles.find(f => f.id === currentlyPlaying)?.file!)}
                    className="max-w-full max-h-full object-contain"
                    controls
                    autoPlay
                    onLoadedMetadata={(e) => {
                      const video = e.target as HTMLVideoElement;
                      const videoFile = videoFiles.find(f => f.id === currentlyPlaying);
                      if (videoFile) {
                        video.volume = videoFile.volume;
                      }
                    }}
                    onPlay={() => {
                      setCurrentlyPlaying(currentlyPlaying);
                    }}
                    onPause={() => {
                      setCurrentlyPlaying(currentlyPlaying);
                    }}
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <FaVideo className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Select a video to preview</h3>
                    <p className="text-gray-400">Click the play button on any video to preview it</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Right Control Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-6">
          <div className="space-y-6">
            {/* Add More Files */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*,.mp4,.avi,.mov,.mkv,.webm,.wmv,.flv,.m4v,.3gp"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <FaPlus className="w-4 h-4" />
                  Add more files
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Shuffle Button */}
            {videoFiles.length > 1 && (
              <div>
                <button
                  onClick={shuffleFiles}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <FaRandom className="w-4 h-4" />
                  Shuffle Videos
                </button>
              </div>
            )}

            {/* Video List */}
            {videoFiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Videos ({videoFiles.length})</h3>
                  <button
                    onClick={() => setVideoFiles([])}
                    className="text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {videoFiles.map((videoFile, index) => (
                    <div
                      key={videoFile.id}
                      className={`bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors cursor-pointer border-2 ${
                        currentlyPlaying === videoFile.id ? 'border-blue-500' : 'border-transparent'
                      }`}
                      onClick={() => togglePlayPause(videoFile.id, URL.createObjectURL(videoFile.file))}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-gray-600 rounded flex items-center justify-center">
                          <FaVideo className="w-4 h-4 text-gray-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{videoFile.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{formatDuration(videoFile.duration)}</span>
                            <span>•</span>
                            <span>{videoFile.resolution}</span>
                            <span>•</span>
                            <span>{videoFile.fps} FPS</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openTrimModal(videoFile.id);
                            }}
                            className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                            title="Trim video"
                          >
                            <FaCut className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(videoFile.id);
                            }}
                            className="text-gray-400 hover:text-red-400 transition-colors p-1"
                            title="Remove video"
                          >
                            <IoMdClose className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Bottom Export Panel */}
        {videoFiles.length > 0 && (
          <div className="bg-gray-800 border-t border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-6">
                <div>
                  <h3 className="text-white font-semibold mb-1">Final output — {formatDuration(totalDuration)}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Video size, px — {videoFiles[0]?.resolution || 'Unknown'}</span>
                    <div className="flex items-center gap-2">
                      <span>Format —</span>
                      <select className="bg-gray-700 text-white px-2 py-1 rounded text-sm border border-gray-600">
                        <option>MP4</option>
                        <option>AVI</option>
                        <option>MOV</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={mergeVideoFiles}
                disabled={isProcessing}
                className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                  isProcessing 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Export'}
              </button>
            </div>

            {/* Timeline */}
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              {videoFiles.map((videoFile, index) => (
              <div key={videoFile.id} className="flex-shrink-0">
                <div 
                  className={`bg-gray-700 rounded-lg p-3 w-32 cursor-pointer transition-all hover:bg-gray-600 ${
                    currentlyPlaying === videoFile.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => togglePlayPause(videoFile.id, URL.createObjectURL(videoFile.file))}
                >
                  <div className="w-full h-16 bg-gray-600 rounded mb-2 flex items-center justify-center relative">
                    <FaVideo className="w-6 h-6 text-gray-400" />
                    {currentlyPlaying === videoFile.id && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded flex items-center justify-center">
                        <FaPlay className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-white text-xs font-medium truncate">{videoFile.name}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{formatDuration(videoFile.duration)}</span>
                    <span>{videoFile.resolution}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add More Videos Placeholder */}
            <div className="flex-shrink-0">
              <div 
                className="bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg p-3 w-32 h-24 flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <FaPlus className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-gray-400 text-xs">Add more videos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trim Modal */}
      {trimSettings.isActive && selectedFileId && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FaCut className="text-blue-500" />
                  Trim Video File
                </h3>
                <button
                  onClick={() => {
                    setTrimSettings({ start: 0, end: 0, isActive: false });
                    setSelectedFileId(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
                >
                  <IoMdClose className="text-2xl" />
                </button>
              </div>

              {(() => {
                const file = videoFiles.find(f => f.id === selectedFileId);
                if (!file) return null;
                
                return (
                  <div className="space-y-6">
                    {/* File Info */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FaVideo className="text-blue-500" />
                        {file.name}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <FaClock className="text-blue-500" />
                          Duration: {formatDuration(file.duration)}
                        </span>
                        <span>Size: {file.size}</span>
                        <span>Resolution: {file.resolution}</span>
                      </div>
                    </div>

                    {/* Trim Controls */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <FaCut className="text-blue-500" />
                          Set Trim Points
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Start Time (seconds)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={file.duration}
                              step="0.1"
                              value={trimSettings.start}
                              onChange={(e) => setTrimSettings(prev => ({
                                ...prev,
                                start: Math.max(0, Math.min(parseFloat(e.target.value) || 0, prev.end - 0.1))
                              }))}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white hover:border-blue-400 focus:outline-none focus:border-blue-500 transition-all duration-200 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              End Time (seconds)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={file.duration}
                              step="0.1"
                              value={trimSettings.end}
                              onChange={(e) => setTrimSettings(prev => ({
                                ...prev,
                                end: Math.min(file.duration, Math.max(parseFloat(e.target.value) || 0, prev.start + 0.1))
                              }))}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white hover:border-blue-400 focus:outline-none focus:border-blue-500 transition-all duration-200 font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Duration Display */}
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-green-700 flex items-center gap-2">
                            <FaClock className="text-green-500" />
                            Trimmed Duration:
                          </span>
                          <span className="text-lg font-bold text-green-900">
                            {formatDuration(trimSettings.end - trimSettings.start)}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-green-600">
                          Original: {formatDuration(file.duration)} → Trimmed: {formatDuration(trimSettings.end - trimSettings.start)}
                        </div>
                      </div>

                      {/* Visual Timeline with Trim Handles */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Visual Timeline with Trim Handles
                        </label>
                        <div className="relative bg-gray-200 rounded-lg h-8 p-1">
                          {/* Timeline Background */}
                          <div className="relative w-full h-full bg-gray-300 rounded-md overflow-hidden">
                            {/* Trimmed Section Highlight */}
                            <div 
                              className="absolute top-0 h-full bg-green-400 rounded-md opacity-60"
                              style={{
                                left: `${(trimSettings.start / file.duration) * 100}%`,
                                width: `${((trimSettings.end - trimSettings.start) / file.duration) * 100}%`
                              }}
                            />
                            
                            {/* Start Trim Handle */}
                            <div 
                              className="absolute top-0 w-3 h-full bg-blue-600 cursor-ew-resize rounded-l-md flex items-center justify-center"
                              style={{ left: `${(trimSettings.start / file.duration) * 100}%` }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                const startX = e.clientX;
                                const startValue = trimSettings.start;
                                
                                const handleMouseMove = (moveEvent: MouseEvent) => {
                                  const deltaX = moveEvent.clientX - startX;
                                  const timelineWidth = (e.target as HTMLElement).parentElement!.offsetWidth;
                                  const deltaTime = (deltaX / timelineWidth) * file.duration;
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
                              <div className="w-1 h-4 bg-white rounded-full"></div>
                            </div>
                            
                            {/* End Trim Handle */}
                            <div 
                              className="absolute top-0 w-3 h-full bg-red-600 cursor-ew-resize rounded-r-md flex items-center justify-center"
                              style={{ left: `${(trimSettings.end / file.duration) * 100}%` }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                const startX = e.clientX;
                                const startValue = trimSettings.end;
                                
                                const handleMouseMove = (moveEvent: MouseEvent) => {
                                  const deltaX = moveEvent.clientX - startX;
                                  const timelineWidth = (e.target as HTMLElement).parentElement!.offsetWidth;
                                  const deltaTime = (deltaX / timelineWidth) * file.duration;
                                  const newEnd = Math.min(file.duration, Math.max(startValue + deltaTime, trimSettings.start + 0.1));
                                  
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
                              <div className="w-1 h-4 bg-white rounded-full"></div>
                </div>
                            
                            {/* Time Markers */}
                            <div className="absolute top-0 left-0 w-full h-full flex justify-between items-center px-2 pointer-events-none">
                              <span className="text-xs font-semibold text-gray-600 bg-white px-1 rounded">
                                {formatDuration(trimSettings.start)}
                              </span>
                              <span className="text-xs font-semibold text-gray-600 bg-white px-1 rounded">
                                {formatDuration(trimSettings.end)}
                              </span>
              </div>
                          </div>
                        </div>
                        
                        {/* Timeline Labels */}
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span className="bg-blue-100 px-2 py-1 rounded">Start: {formatDuration(trimSettings.start)}</span>
                          <span className="bg-green-100 px-2 py-1 rounded">Duration: {formatDuration(trimSettings.end - trimSettings.start)}</span>
                          <span className="bg-red-100 px-2 py-1 rounded">End: {formatDuration(trimSettings.end)}</span>
                        </div>
                        
                        {/* Quick Trim Buttons */}
                        <div className="mt-4 space-y-2">
                          <div className="text-xs font-semibold text-gray-700 mb-2">Quick Trim Options:</div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setTrimSettings(prev => ({ ...prev, start: 0 }))}
                              className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              Start from Beginning
                            </button>
                            <button
                              onClick={() => setTrimSettings(prev => ({ ...prev, end: file.duration }))}
                              className="px-3 py-2 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              End at Finish
                            </button>
                            <button
                              onClick={() => {
                                const center = file.duration / 2;
                                const halfTrim = Math.min(5, file.duration / 4);
                                setTrimSettings({
                                  start: Math.max(0, center - halfTrim),
                                  end: Math.min(file.duration, center + halfTrim),
                                  isActive: true
                                });
                              }}
                              className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              Center 10s
                            </button>
                            <button
                              onClick={() => setTrimSettings({
                                start: 0,
                                end: file.duration,
                                isActive: true
                              })}
                              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Reset Trim
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setTrimSettings({ start: 0, end: 0, isActive: false });
                          setSelectedFileId(null);
                        }}
                        className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={applyTrim}
                        className="px-8 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Apply Trim
                      </button>
                </div>
              </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Merged Video Preview Modal */}
      {mergedVideoUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Merged Video</h3>
                <button
                  onClick={() => setMergedVideoUrl(null)}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
                >
                  <IoMdClose className="text-xl" />
                </button>
              </div>
              <div className="text-center">
                <video
                  src={mergedVideoUrl}
                  controls
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                  style={{ maxHeight: '500px' }}
                >
                  Your browser does not support the video tag.
                </video>
                <div className="mt-6">
                <a
                  href={mergedVideoUrl}
                  download="merged_video.mp4"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FaDownload className="text-lg" />
                  Download Merged Video
                </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}