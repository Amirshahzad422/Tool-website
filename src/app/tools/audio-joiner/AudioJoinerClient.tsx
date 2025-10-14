'use client';

import { useState, useRef, useEffect } from 'react';
import { FaPlus, FaTrash, FaGripVertical, FaPlay, FaPause, FaDownload, FaCut, FaVolumeUp, FaClock, FaExpand, FaRandom } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';

interface AudioFile {
  id: string;
  file: File;
  name: string;
  duration: number;
  size: string;
  trimmedStart: number;
  trimmedEnd: number;
  isTrimmed: boolean;
  waveform?: number[];
  volume: number; // Volume level (0.0 to 1.0)
  volumeSegments: VolumeSegment[]; // Volume adjustments for specific segments
}

interface VolumeSegment {
  id: string;
  startTime: number;
  endTime: number;
  volume: number; // Volume multiplier (0.0 to 2.0)
  isActive: boolean;
}

interface TrimSettings {
  start: number;
  end: number;
  isActive: boolean;
}

export default function AudioJoinerClient() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedAudioUrl, setMergedAudioUrl] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [trimSettings, setTrimSettings] = useState<TrimSettings>({ start: 0, end: 0, isActive: false });
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('timeline');
  const [isGeneratingWaveform, setIsGeneratingWaveform] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<{fileId: string, segmentId: string} | null>(null);
  const [volumeModalOpen, setVolumeModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      try {
      const audio = new Audio();
        const objectUrl = URL.createObjectURL(file);
        audio.src = objectUrl;
        
        const cleanup = () => {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch (e) {
            // Ignore cleanup errors
          }
        };

      audio.addEventListener('loadedmetadata', () => {
          const duration = audio.duration;
          cleanup();
          resolve(isNaN(duration) || !isFinite(duration) ? 0 : duration);
        }, { once: true });

        audio.addEventListener('error', (e) => {
          console.warn('Error loading audio metadata:', e);
          cleanup();
        resolve(0);
        }, { once: true });

        // Set a timeout to prevent hanging
        setTimeout(() => {
          cleanup();
          resolve(0);
        }, 10000); // 10 second timeout

      } catch (error) {
        console.warn('Error setting up audio duration detection:', error);
        resolve(0);
      }
    });
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      try {
      const video = document.createElement('video');
      video.preload = 'metadata';
        const objectUrl = URL.createObjectURL(file);
        video.src = objectUrl;
        
        const cleanup = () => {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch (e) {
            // Ignore cleanup errors
          }
        };

      video.addEventListener('loadedmetadata', () => {
          const duration = video.duration;
          cleanup();
          resolve(isNaN(duration) || !isFinite(duration) ? 0 : duration);
        }, { once: true });

        video.addEventListener('error', (e) => {
          console.warn('Error loading video metadata:', e);
          cleanup();
        resolve(0);
        }, { once: true });

        // Set a timeout to prevent hanging
        setTimeout(() => {
          cleanup();
          resolve(0);
        }, 10000); // 10 second timeout

      } catch (error) {
        console.warn('Error setting up video duration detection:', error);
        resolve(0);
      }
    });
  };

  const generateWaveform = async (file: File): Promise<number[]> => {
    return new Promise((resolve) => {
      try {
        // Check if Web Audio API is available
        if (!window.AudioContext && !(window as any).webkitAudioContext) {
          console.warn('Web Audio API not available, generating mock waveform');
          resolve(generateMockWaveform());
          return;
        }

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const fileReader = new FileReader();
        
        fileReader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            
            // Check if arrayBuffer is valid
            if (!arrayBuffer || arrayBuffer.byteLength === 0) {
              console.warn('Invalid audio data, generating mock waveform');
              resolve(generateMockWaveform());
              return;
            }

            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Check if audioBuffer is valid
            if (!audioBuffer || audioBuffer.length === 0) {
              console.warn('Invalid audio buffer, generating mock waveform');
              resolve(generateMockWaveform());
              return;
            }

            const channelData = audioBuffer.getChannelData(0);
            const samples = 100; // Number of waveform points
            const blockSize = Math.floor(channelData.length / samples);
            
            if (blockSize === 0) {
              console.warn('Audio too short, generating mock waveform');
              resolve(generateMockWaveform());
              return;
            }

            const waveform: number[] = [];
            
            for (let i = 0; i < samples; i++) {
              let sum = 0;
              for (let j = 0; j < blockSize; j++) {
                sum += Math.abs(channelData[i * blockSize + j]);
              }
              waveform.push(sum / blockSize);
            }
            
            resolve(waveform);
          } catch (error) {
            console.warn('Error generating waveform:', error);
            resolve(generateMockWaveform());
          } finally {
            // Clean up audio context
            try {
              await audioContext.close();
            } catch (e) {
              // Ignore cleanup errors
            }
          }
        };

        fileReader.onerror = () => {
          console.warn('FileReader error, generating mock waveform');
          resolve(generateMockWaveform());
        };
        
        fileReader.readAsArrayBuffer(file);
      } catch (error) {
        console.warn('Error setting up waveform generation:', error);
        resolve(generateMockWaveform());
      }
    });
  };

  const generateMockWaveform = (): number[] => {
    // Generate a mock waveform for files that can't be decoded
    const waveform: number[] = [];
    for (let i = 0; i < 100; i++) {
      // Create a simple sine wave pattern
      const value = Math.sin(i * 0.1) * 0.3 + Math.random() * 0.2;
      waveform.push(Math.abs(value));
    }
    return waveform;
  };

  const shuffleFiles = () => {
    const shuffled = [...audioFiles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setAudioFiles(shuffled);
  };

  const openTrimModal = (fileId: string) => {
    const file = audioFiles.find(f => f.id === fileId);
    if (file) {
      setSelectedFileId(fileId);
      setTrimSettings({
        start: file.trimmedStart,
        end: file.trimmedEnd || file.duration,
        isActive: true
      });
    }
  };

  const applyTrim = () => {
    if (!selectedFileId) return;
    
    setAudioFiles(prev => prev.map(file => 
      file.id === selectedFileId 
        ? {
            ...file,
            trimmedStart: trimSettings.start,
            trimmedEnd: trimSettings.end,
            isTrimmed: true
          }
        : file
    ));
    
    setTrimSettings({ start: 0, end: 0, isActive: false });
    setSelectedFileId(null);
  };

  const resetTrim = (fileId: string) => {
    setAudioFiles(prev => prev.map(file => 
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
    setAudioFiles(prev => prev.map(file => 
      file.id === id 
        ? { ...file, volume: Math.max(0, Math.min(1, volume)) }
        : file
    ));
    
    // Update volume of currently playing audio if it's this file
    if (audioRefs.current[id] && currentlyPlaying === id) {
      audioRefs.current[id].volume = volume;
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

    setAudioFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, volumeSegments: [...file.volumeSegments, newSegment] }
        : file
    ));
  };

  const updateVolumeSegment = (fileId: string, segmentId: string, volume: number) => {
    setAudioFiles(prev => prev.map(file => 
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
    setAudioFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { 
            ...file, 
            volumeSegments: file.volumeSegments.filter(segment => segment.id !== segmentId)
          }
        : file
    ));
  };

  const toggleVolumeSegment = (fileId: string, segmentId: string) => {
    setAudioFiles(prev => prev.map(file => 
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
      try {
      // Try to get duration using video element for better compatibility
      let duration = 0;
      try {
        if (file.type.startsWith('video/')) {
          duration = await getVideoDuration(file);
        } else {
          duration = await getAudioDuration(file);
        }
      } catch (error) {
          console.warn('Error getting duration for file:', file.name, error);
        duration = 0;
      }
        
        // Generate waveform for better visualization
        setIsGeneratingWaveform(true);
        let waveform: number[] = [];
        try {
          waveform = await generateWaveform(file);
        } catch (error) {
          console.warn('Error generating waveform for file:', file.name, error);
          waveform = generateMockWaveform();
        }
        setIsGeneratingWaveform(false);
      
      newAudioFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        duration,
        size: formatFileSize(file.size),
          trimmedStart: 0,
          trimmedEnd: duration || 0,
          isTrimmed: false,
          waveform,
          volume: 1.0, // Default volume at 100%
          volumeSegments: [], // No volume segments initially
        });
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        // Still add the file but with default values
        newAudioFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          duration: 0,
          size: formatFileSize(file.size),
          trimmedStart: 0,
          trimmedEnd: 0,
          isTrimmed: false,
          waveform: generateMockWaveform(),
          volume: 1.0, // Default volume at 100%
          volumeSegments: [], // No volume segments initially
        });
      }
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

  // const handleDragLeave = () => {
  //   setIsDragOver(false);
  // };

  const removeFile = (id: string) => {
    setAudioFiles(prev => prev.filter(file => file.id !== id));
    if (audioRefs.current[id]) {
      audioRefs.current[id].pause();
      delete audioRefs.current[id];
    }
  };

  const togglePlayPause = (id: string, audioUrl: string) => {
    try {
    // Pause all other audio
    Object.entries(audioRefs.current).forEach(([key, audio]) => {
      if (key !== id) {
          try {
        audio.pause();
          } catch (e) {
            console.warn('Error pausing audio:', e);
          }
      }
    });

    if (!audioRefs.current[id]) {
        try {
      const audio = new Audio(audioUrl);
      audioRefs.current[id] = audio;
          
      audio.addEventListener('ended', () => {
        setCurrentlyPlaying(null);
          }, { once: true });

          audio.addEventListener('error', (e) => {
            console.warn('Audio playback error:', e);
            setCurrentlyPlaying(null);
            // Clean up the failed audio reference
            delete audioRefs.current[id];
          }, { once: true });
        } catch (error) {
          console.warn('Error creating audio element:', error);
          return;
        }
    }

    const audio = audioRefs.current[id];
      if (!audio) return;

    if (currentlyPlaying === id) {
        try {
      audio.pause();
      setCurrentlyPlaying(null);
        } catch (e) {
          console.warn('Error pausing audio:', e);
          setCurrentlyPlaying(null);
        }
    } else {
        try {
          // Find the audio file to get trim settings and volume
          const audioFile = audioFiles.find(f => f.id === id);
          if (audioFile) {
            if (audioFile.isTrimmed) {
              // Set the current time to the trimmed start position
              audio.currentTime = audioFile.trimmedStart;
            }
            // Set the volume
            audio.volume = audioFile.volume;
          }
          
          audio.play().catch((error) => {
            console.warn('Error playing audio:', error);
            setCurrentlyPlaying(null);
          });
      setCurrentlyPlaying(id);
        } catch (e) {
          console.warn('Error starting audio playback:', e);
          setCurrentlyPlaying(null);
        }
      }
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
    const newFiles = [...audioFiles];
    const draggedFile = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
      newFiles.splice(dragOverIndex, 0, draggedFile);
    setAudioFiles(newFiles);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
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
        formData.append('trimmedStart', audioFile.trimmedStart.toString());
        formData.append('trimmedEnd', audioFile.trimmedEnd.toString());
        formData.append('isTrimmed', audioFile.isTrimmed.toString());
        formData.append('volume', audioFile.volume.toString());
        formData.append('volumeSegments', JSON.stringify(audioFile.volumeSegments));
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

  const totalDuration = audioFiles.reduce((acc, file) => {
    const trimmedDuration = file.isTrimmed ? (file.trimmedEnd - file.trimmedStart) : file.duration;
    return acc + trimmedDuration;
  }, 0);

  const WaveformVisualizer = ({ waveform, duration, trimmedStart, trimmedEnd, isTrimmed, volumeSegments, fileId }: { 
    waveform: number[], 
    duration: number, 
    trimmedStart: number, 
    trimmedEnd: number, 
    isTrimmed: boolean,
    volumeSegments: VolumeSegment[],
    fileId: string
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<number | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = (x / canvas.width) * duration;
      
      setIsSelecting(true);
      setSelectionStart(time);
      setSelectionEnd(time);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isSelecting) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = (x / canvas.width) * duration;
      
      setSelectionEnd(time);
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isSelecting && selectionStart !== null && selectionEnd !== null) {
        const start = Math.min(selectionStart, selectionEnd);
        const end = Math.max(selectionStart, selectionEnd);
        
        if (end - start > 0.1) { // Minimum 0.1 second selection
          addVolumeSegment(fileId, start, end, 1.0);
        }
      } else {
        // Check if clicking on a volume segment
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const time = (x / canvas.width) * duration;
          
          const clickedSegment = volumeSegments.find(segment => 
            segment.isActive && time >= segment.startTime && time <= segment.endTime
          );
          
          if (clickedSegment) {
            setSelectedSegment({ fileId, segmentId: clickedSegment.id });
            setVolumeModalOpen(true);
          }
        }
      }
      
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    };

    useEffect(() => {
      if (!canvasRef.current || !waveform.length) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Draw background
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, width, height);

      // Draw waveform
      const barWidth = width / waveform.length;
      
      waveform.forEach((value, index) => {
        const barHeight = (value * height * 0.6) + (height * 0.2);
        const x = index * barWidth;
        const y = (height - barHeight) / 2;
        
        // Color based on trim status
        if (isTrimmed) {
          const timePosition = (index / waveform.length) * duration;
          if (timePosition >= trimmedStart && timePosition <= trimmedEnd) {
            ctx.fillStyle = '#3b82f6'; // Blue for trimmed section
          } else {
            ctx.fillStyle = '#d1d5db'; // Light gray for trimmed out section
          }
        } else {
          ctx.fillStyle = '#6b7280'; // Gray for untrimmed
        }
        
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      });

      // Draw volume segments
      volumeSegments.forEach(segment => {
        if (!segment.isActive) return;
        
        const startX = (segment.startTime / duration) * width;
        const endX = (segment.endTime / duration) * width;
        const segmentWidth = endX - startX;
        
        // Volume overlay
        const alpha = segment.volume > 1 ? 0.3 : 0.5;
        const color = segment.volume > 1 ? '#10b981' : '#ef4444';
        ctx.fillStyle = `rgba(${segment.volume > 1 ? '16, 185, 129' : '239, 68, 68'}, ${alpha})`;
        ctx.fillRect(startX, 0, segmentWidth, height);
        
        // Volume indicator line
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, height - 5);
        ctx.lineTo(endX, height - 5);
        ctx.stroke();
        
        // Volume text
        ctx.fillStyle = color;
        ctx.font = '10px Arial';
        ctx.fillText(`${Math.round(segment.volume * 100)}%`, startX + 2, height - 8);
      });
      
      // Draw selection
      if (isSelecting && selectionStart !== null && selectionEnd !== null) {
        const startX = (Math.min(selectionStart, selectionEnd) / duration) * width;
        const endX = (Math.max(selectionStart, selectionEnd) / duration) * width;
        
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.fillRect(startX, 0, endX - startX, height);
        
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX, height);
        ctx.moveTo(endX, 0);
        ctx.lineTo(endX, height);
        ctx.stroke();
      }
      
      // Draw trim indicators
      if (isTrimmed) {
        const startX = (trimmedStart / duration) * width;
        const endX = (trimmedEnd / duration) * width;
        
        // Highlight trimmed section
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fillRect(startX, 0, endX - startX, height);
        
        // Start line with label
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX, height);
        ctx.stroke();
        
        // End line with label
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(endX, 0);
        ctx.lineTo(endX, height);
        ctx.stroke();
      }
    }, [waveform, duration, trimmedStart, trimmedEnd, isTrimmed, volumeSegments, isSelecting, selectionStart, selectionEnd]);

  return (
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={200}
          height={40}
          className="w-full h-10 bg-gray-100 rounded-lg border border-gray-200 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span className="text-blue-600 font-medium">Click & drag to select segments for volume control</span>
          {volumeSegments.length > 0 && (
            <span className="text-green-600 font-medium">
              {volumeSegments.filter(s => s.isActive).length} volume segments
            </span>
          )}
        </div>
        {isTrimmed && (
          <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              Start: {formatDuration(trimmedStart)}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              End: {formatDuration(trimmedEnd)}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              ? 'border-[#080c2a] bg-gray-100 scale-[1.02]'
              : isGeneratingWaveform
              ? 'border-[#080c2a] bg-gray-100'
              : 'border-gray-300 bg-white hover:border-[#080c2a] hover:bg-gray-50'
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
              <div className={`w-20 h-20 bg-[#080c2a] rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 ${isDragOver ? 'scale-110' : ''}`}>
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
                {isGeneratingWaveform ? 'Processing Files...' : 'Add Audio or Video Files'}
              </h3>
              <p className="text-gray-600 text-lg mb-2">
                {isGeneratingWaveform 
                  ? 'Generating waveforms and analyzing audio files...' 
                  : isDragOver 
                    ? 'Drop your files here!' 
                    : 'Drag and drop files here or click to browse'
                }
              </p>
              <p className="text-sm text-gray-500">
                {isGeneratingWaveform 
                  ? 'Please wait while we process your files'
                  : 'Audio from videos will be automatically extracted'
                }
              </p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isGeneratingWaveform}
              className={`px-8 py-4 text-white rounded-xl font-bold transition-all duration-200 shadow-xl text-lg ${
                isGeneratingWaveform
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#080c2a] hover:bg-[#080c2a]/90 hover:shadow-2xl transform hover:scale-105'
              }`}
            >
              <span className="flex items-center gap-3">
                {isGeneratingWaveform ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Choose Files
                  </>
                )}
              </span>
            </button>

            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full font-medium">MP3</span>
              <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full font-medium">WAV</span>
              <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full font-medium">M4A</span>
              <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full font-medium">OGG</span>
              <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full font-medium">MP4</span>
              <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full font-medium">AVI</span>
              <span className="text-gray-400">& more</span>
            </div>
          </div>
        </div>

        {/* Audio Files List */}
        {audioFiles.length > 0 && (
          <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#080c2a] rounded-lg flex items-center justify-center shadow-lg">
                  <FaVolumeUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    Professional Audio Timeline
                    <span className="px-3 py-1 bg-[#080c2a] text-white rounded-full text-sm font-bold shadow-md">
                      {audioFiles.length}
                    </span>
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <FaClock className="w-4 h-4" />
                      <strong>Total Duration:</strong> {formatDuration(totalDuration)}
                    </span>
                    <span>•</span>
                    <span className="text-[#080c2a] font-medium">
                      {audioFiles.filter(f => f.isTrimmed).length} files trimmed
                    </span>
                    <span>•</span>
                    <span className="text-purple-600 font-medium">
                      {audioFiles.reduce((acc, f) => acc + f.volumeSegments.filter(s => s.isActive).length, 0)} volume segments
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode(viewMode === 'list' ? 'timeline' : 'list')}
                  className="px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2"
                >
                  <FaExpand className="text-sm" />
                  {viewMode === 'list' ? 'Timeline View' : 'List View'}
                </button>
                <button
                  onClick={shuffleFiles}
                  className="px-4 py-2.5 text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2"
                >
                  <FaRandom className="text-sm" />
                  Shuffle
                </button>
              <button
                onClick={() => setAudioFiles([])}
                className="px-5 py-2.5 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2 transform hover:scale-105"
              >
                <FaTrash className="text-sm" />
                Clear All
              </button>
              </div>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-blue-800">
                    <strong>Drag & Drop:</strong> Use the <FaGripVertical className="inline mx-1" /> handle to reorder files. They'll merge in the order shown.
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Volume Control:</strong> Click & drag on waveform to select segments, then adjust volume levels. Click existing segments to edit them.
                  </p>
                </div>
                </div>
              </div>

            {/* Timeline View */}
            {viewMode === 'timeline' ? (
              <div className="space-y-4">
                {audioFiles.map((audioFile, index) => (
                  <div
                    key={audioFile.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                    className={`bg-gray-50 rounded-xl border-2 transition-all cursor-move hover:shadow-lg ${
                      draggedIndex === index 
                        ? 'border-[#080c2a] opacity-50 scale-105 shadow-xl' 
                        : dragOverIndex === index 
                          ? 'border-blue-400 bg-blue-50 scale-[1.02]' 
                          : 'border-gray-200'
                    } ${audioFile.isTrimmed ? 'ring-2 ring-[#080c2a]/20' : ''}`}
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        {/* Drag Handle */}
                        <div className="text-gray-400 cursor-grab active:cursor-grabbing hover:text-[#080c2a] transition-colors p-2 rounded-lg hover:bg-gray-100">
                          <FaGripVertical className="text-xl" />
            </div>

                        {/* Order Number */}
                        <div className="flex-shrink-0 w-12 h-12 bg-[#080c2a] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {index + 1}
                        </div>

                        {/* File Icon */}
                        <div className="flex-shrink-0">
                          {audioFile.file.type.startsWith('video/') ? (
                            <div className="relative">
                              <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                </svg>
                              </div>
                              <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                                VIDEO
                              </div>
                            </div>
                          ) : (
                            <div className="w-14 h-14 bg-gray-600 rounded-xl flex items-center justify-center shadow-lg">
                              <FaVolumeUp className="w-7 h-7 text-white" />
                            </div>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate text-lg">{audioFile.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <FaClock className="w-4 h-4" />
                              {formatDuration(audioFile.duration)}
                              {audioFile.isTrimmed && (
                                <span className="text-[#080c2a] font-medium">
                                  (trimmed: {formatDuration(audioFile.trimmedEnd - audioFile.trimmedStart)})
                                </span>
                              )}
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

                        {/* Volume Control */}
                        <div className="flex items-center gap-2 mr-4">
                          <FaVolumeUp className="text-gray-500 text-sm" />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={audioFile.volume}
                            onChange={(e) => updateVolume(audioFile.id, parseFloat(e.target.value))}
                            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            title={`Volume: ${Math.round(audioFile.volume * 100)}%`}
                          />
                          <span className="text-xs text-gray-500 w-8">
                            {Math.round(audioFile.volume * 100)}%
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => togglePlayPause(audioFile.id, URL.createObjectURL(audioFile.file))}
                            className={`p-3 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
                              currentlyPlaying === audioFile.id 
                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                            title={currentlyPlaying === audioFile.id ? "Pause" : "Play"}
                          >
                            {currentlyPlaying === audioFile.id ? (
                              <FaPause className="text-lg" />
                            ) : (
                              <FaPlay className="text-lg" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => openTrimModal(audioFile.id)}
                            className="p-3 text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                            title="Trim audio"
                          >
                            <FaCut className="text-lg" />
                          </button>
                          
                          {audioFile.isTrimmed && (
                            <button
                              onClick={() => resetTrim(audioFile.id)}
                              className="p-3 text-white bg-gray-500 hover:bg-gray-600 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                              title="Reset trim"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                          
                          <button
                            onClick={() => removeFile(audioFile.id)}
                            className="p-3 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                            title="Remove file"
                          >
                            <IoMdClose className="text-xl" />
                          </button>
                        </div>
                      </div>

                      {/* Waveform Visualization */}
                      {audioFile.waveform && audioFile.waveform.length > 0 && (
                        <div className="ml-16">
                            <WaveformVisualizer
                              waveform={audioFile.waveform}
                              duration={audioFile.duration}
                              trimmedStart={audioFile.trimmedStart}
                              trimmedEnd={audioFile.trimmedEnd}
                              isTrimmed={audioFile.isTrimmed}
                              volumeSegments={audioFile.volumeSegments}
                              fileId={audioFile.id}
                            />
                        </div>
                      )}

                      {/* Volume Segments List */}
                      {audioFile.volumeSegments.length > 0 && (
                        <div className="ml-16 mt-3">
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <FaVolumeUp className="text-blue-500" />
                              Volume Segments ({audioFile.volumeSegments.filter(s => s.isActive).length} active)
                            </h4>
                            <div className="space-y-2">
                              {audioFile.volumeSegments.map(segment => (
                                <div
                                  key={segment.id}
                                  className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                                    segment.isActive 
                                      ? 'bg-blue-50 border-blue-200' 
                                      : 'bg-gray-100 border-gray-300 opacity-60'
                                  }`}
                                  onClick={() => {
                                    setSelectedSegment({ fileId: audioFile.id, segmentId: segment.id });
                                    setVolumeModalOpen(true);
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${
                                      segment.volume > 1 ? 'bg-green-500' : segment.volume < 1 ? 'bg-red-500' : 'bg-blue-500'
                                    }`}></div>
                                    <span className="text-sm font-medium text-gray-700">
                                      {formatDuration(segment.startTime)} - {formatDuration(segment.endTime)}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      segment.volume > 1 
                                        ? 'bg-green-100 text-green-700' 
                                        : segment.volume < 1 
                                          ? 'bg-red-100 text-red-700' 
                                          : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {Math.round(segment.volume * 100)}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleVolumeSegment(audioFile.id, segment.id);
                                      }}
                                      className={`p-1 rounded text-xs transition-colors ${
                                        segment.isActive 
                                          ? 'text-red-600 hover:bg-red-100' 
                                          : 'text-green-600 hover:bg-green-100'
                                      }`}
                                      title={segment.isActive ? 'Disable segment' : 'Enable segment'}
                                    >
                                      {segment.isActive ? 'Disable' : 'Enable'}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeVolumeSegment(audioFile.id, segment.id);
                                      }}
                                      className="p-1 text-red-600 hover:bg-red-100 rounded text-xs transition-colors"
                                      title="Remove segment"
                                    >
                                      <IoMdClose className="text-sm" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
            <div className="space-y-3">
              {audioFiles.map((audioFile, index) => (
                <div
                  key={audioFile.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                    onDragLeave={handleDragLeave}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-2 transition-all cursor-move hover:bg-gray-100 ${
                    draggedIndex === index ? 'border-blue-500 opacity-50' : 'border-gray-200'
                    } ${audioFile.isTrimmed ? 'ring-2 ring-purple-200' : ''}`}
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
                          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center shadow-md">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                        </div>
                        <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shadow">
                          VIDEO
                        </div>
                      </div>
                    ) : (
                        <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center shadow-md">
                          <FaVolumeUp className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate text-base">{audioFile.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                          <FaClock className="w-4 h-4" />
                        {formatDuration(audioFile.duration)}
                          {audioFile.isTrimmed && (
                            <span className="text-[#080c2a] font-medium">
                              (trimmed: {formatDuration(audioFile.trimmedEnd - audioFile.trimmedStart)})
                            </span>
                          )}
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

                    {/* Volume Control */}
                    <div className="flex items-center gap-2 mr-4">
                      <FaVolumeUp className="text-gray-500 text-sm" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={audioFile.volume}
                        onChange={(e) => updateVolume(audioFile.id, parseFloat(e.target.value))}
                        className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        title={`Volume: ${Math.round(audioFile.volume * 100)}%`}
                      />
                      <span className="text-xs text-gray-500 w-8">
                        {Math.round(audioFile.volume * 100)}%
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePlayPause(audioFile.id, URL.createObjectURL(audioFile.file))}
                        className="p-3 text-white bg-[#080c2a] hover:bg-[#080c2a]/90 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                    title="Preview audio"
                  >
                    {currentlyPlaying === audioFile.id ? (
                      <FaPause className="text-lg" />
                    ) : (
                      <FaPlay className="text-lg" />
                    )}
                  </button>

                      <button
                        onClick={() => openTrimModal(audioFile.id)}
                        className="p-3 text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                        title="Trim audio"
                      >
                        <FaCut className="text-lg" />
                      </button>
                      
                      {audioFile.isTrimmed && (
                        <button
                          onClick={() => resetTrim(audioFile.id)}
                          className="p-3 text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                          title="Reset trim"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                      
                  <button
                    onClick={() => removeFile(audioFile.id)}
                        className="p-3 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                    title="Remove file"
                  >
                    <IoMdClose className="text-xl" />
                  </button>
                    </div>
                </div>
              ))}
            </div>
            )}

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
                className="w-full px-6 py-5 bg-[#080c2a] text-white rounded-xl font-bold hover:bg-[#080c2a]/90 transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 text-lg transform hover:scale-[1.02]"
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
          <div className="bg-gray-50 rounded-2xl shadow-2xl p-8 border-2 border-gray-200">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-[#080c2a] rounded-full flex items-center justify-center mx-auto shadow-xl">
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
                  <div className="w-10 h-10 bg-[#080c2a] rounded-lg flex items-center justify-center shadow-md">
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
                className="px-10 py-5 bg-[#080c2a] text-white rounded-xl font-bold hover:bg-[#080c2a]/90 transition-all duration-200 shadow-2xl hover:shadow-lg flex items-center justify-center gap-3 mx-auto text-xl transform hover:scale-105"
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

        {/* Volume Control Modal */}
        {volumeModalOpen && selectedSegment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FaVolumeUp className="text-blue-500" />
                    Volume Control
                  </h3>
                  <button
                    onClick={() => {
                      setVolumeModalOpen(false);
                      setSelectedSegment(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                  >
                    <IoMdClose className="text-xl" />
                  </button>
                </div>

                {(() => {
                  const file = audioFiles.find(f => f.id === selectedSegment.fileId);
                  const segment = file?.volumeSegments.find(s => s.id === selectedSegment.segmentId);
                  if (!file || !segment) return null;

                  return (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <h4 className="font-semibold text-gray-900 mb-2">{file.name}</h4>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Segment:</span> {formatDuration(segment.startTime)} - {formatDuration(segment.endTime)}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">
                          Volume Level: {Math.round(segment.volume * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={segment.volume}
                          onChange={(e) => updateVolumeSegment(file.id, segment.id, parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>0% (Mute)</span>
                          <span>100% (Normal)</span>
                          <span>200% (Boost)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateVolumeSegment(file.id, segment.id, 0.5)}
                          className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          -50%
                        </button>
                        <button
                          onClick={() => updateVolumeSegment(file.id, segment.id, 1.0)}
                          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => updateVolumeSegment(file.id, segment.id, 1.5)}
                          className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          +50%
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <button
                          onClick={() => toggleVolumeSegment(file.id, segment.id)}
                          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                            segment.isActive 
                              ? 'bg-red-500 text-white hover:bg-red-600' 
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {segment.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => {
                            removeVolumeSegment(file.id, segment.id);
                            setVolumeModalOpen(false);
                            setSelectedSegment(null);
                          }}
                          className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Remove Segment
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Trim Modal */}
        {trimSettings.isActive && selectedFileId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <FaCut className="text-blue-500" />
                    Trim Audio File
                  </h3>
                  <button
                    onClick={() => {
                      setTrimSettings({ start: 0, end: 0, isActive: false });
                      setSelectedFileId(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                  >
                    <IoMdClose className="text-2xl" />
                  </button>
                </div>

                {(() => {
                  const file = audioFiles.find(f => f.id === selectedFileId);
                  if (!file) return null;
                  
                  return (
                    <div className="space-y-6">
                  {/* File Info */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <FaVolumeUp className="text-blue-500" />
                      {file.name}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FaClock className="text-blue-500" />
                        Duration: {formatDuration(file.duration)}
                      </span>
                      <span>Size: {file.size}</span>
                    </div>
                  </div>

                      {/* Waveform */}
                      {file.waveform && file.waveform.length > 0 && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Waveform Preview
                          </label>
                          <WaveformVisualizer
                            waveform={file.waveform}
                            duration={file.duration}
                            trimmedStart={trimSettings.start}
                            trimmedEnd={trimSettings.end}
                            isTrimmed={true}
                            volumeSegments={file.volumeSegments}
                            fileId={file.id}
                          />
                        </div>
                      )}

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

                        {/* Time Range Slider */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Visual Time Selector
                          </label>
                          <div className="relative">
                            <input
                              type="range"
                              min="0"
                              max={file.duration}
                              step="0.1"
                              value={trimSettings.start}
                              onChange={(e) => setTrimSettings(prev => ({
                                ...prev,
                                start: Math.max(0, Math.min(parseFloat(e.target.value), prev.end - 0.1))
                              }))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <input
                              type="range"
                              min="0"
                              max={file.duration}
                              step="0.1"
                              value={trimSettings.end}
                              onChange={(e) => setTrimSettings(prev => ({
                                ...prev,
                                end: Math.min(file.duration, Math.max(parseFloat(e.target.value), prev.start + 0.1))
                              }))}
                              className="absolute top-0 w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0:00</span>
                            <span>{formatDuration(file.duration)}</span>
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

        {/* Help Section */}
        {audioFiles.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Professional Audio Joiner Features</h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[#080c2a] font-bold">
                  1
                </div>
                <p><strong>Upload Multiple Files:</strong> Support for unlimited audio/video files with drag & drop</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[#080c2a] font-bold">
                  2
                </div>
                <p><strong>Professional Timeline:</strong> Visual waveform display with timeline and list views</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[#080c2a] font-bold">
                  3
                </div>
                <p><strong>Advanced Trimming:</strong> Trim individual files with precise start/end time controls</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[#080c2a] font-bold">
                  4
                </div>
                <p><strong>Smart Reordering:</strong> Drag & drop reordering, shuffle feature, and visual indicators</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[#080c2a] font-bold">
                  5
                </div>
                <p><strong>Preview & Merge:</strong> Preview each file, then merge with professional quality output</p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-gray-900 mb-2">✨ Professional Features</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Waveform visualization for each audio file</li>
                <li>• Precise trimming with visual feedback</li>
                <li>• Timeline and list view modes</li>
                <li>• Shuffle and advanced reordering</li>
                <li>• Support for all audio/video formats</li>
                <li>• Real-time duration calculations</li>
                <li>• Professional UI with smooth animations</li>
                <li>• 100% free and secure processing</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

