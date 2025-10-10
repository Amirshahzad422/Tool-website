'use client';

import { useState, useRef } from 'react';
import { FaCrop } from 'react-icons/fa';
import FileUpload from '@/components/FileUpload';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageCropperClient() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 });
  
  // Ensure cropArea is always valid
  const safeCropArea = cropArea && 
    typeof cropArea.x === 'number' && 
    typeof cropArea.y === 'number' && 
    typeof cropArea.width === 'number' && 
    typeof cropArea.height === 'number' &&
    cropArea.width > 0 && 
    cropArea.height > 0
    ? cropArea 
    : { x: 0, y: 0, width: 200, height: 200 };
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageRotation, setImageRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<string>('free');
  const [cropHistory, setCropHistory] = useState<CropArea[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cropWidth, setCropWidth] = useState(200);
  const [cropHeight, setCropHeight] = useState(200);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle file upload
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    try {
      setImageFile(file);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          if (!result) {
            console.error('Failed to read file');
            return;
          }
          
          setUploadedImage(result);
          
          // Reset crop area to center
          setTimeout(() => {
            try {
              if (imageRef.current) {
                const img = imageRef.current;
                const containerWidth = containerRef.current?.clientWidth || 400;
                const containerHeight = containerRef.current?.clientHeight || 300;
                
                const imgWidth = img.naturalWidth;
                const imgHeight = img.naturalHeight;
                
                if (imgWidth === 0 || imgHeight === 0) {
                  console.error('Invalid image dimensions');
                  return;
                }
                
                const scaleX = containerWidth / imgWidth;
                const scaleY = containerHeight / imgHeight;
                const scale = Math.min(scaleX, scaleY);
                
                const displayWidth = imgWidth * scale;
                const displayHeight = imgHeight * scale;
                
                const cropSize = Math.min(displayWidth, displayHeight) * 0.5;
                
                const newCropArea = {
                  x: (displayWidth - cropSize) / 2,
                  y: (displayHeight - cropSize) / 2,
                  width: cropSize,
                  height: cropSize
                };
                
                setCropArea(newCropArea);
                setCropWidth(cropSize);
                setCropHeight(cropSize);
                setCropX(newCropArea.x);
                setCropY(newCropArea.y);
                
                setCropHistory([newCropArea]);
                setHistoryIndex(0);
              }
            } catch (error) {
              console.error('Error setting up crop area:', error);
            }
          }, 100);
        } catch (error) {
          console.error('Error processing uploaded image:', error);
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading file');
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling file upload:', error);
    }
  };


  // Handle crop area dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    try {
      if (!imageRef.current) return;
      
      const rect = imageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if click is inside crop area
      if (x >= safeCropArea.x && x <= safeCropArea.x + safeCropArea.width &&
          y >= safeCropArea.y && y <= safeCropArea.y + safeCropArea.height) {
        setIsDragging(true);
        setDragStart({ x: x - safeCropArea.x, y: y - safeCropArea.y });
      }
    } catch (error) {
      console.error('Error handling mouse down:', error);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    try {
      if (!isDragging || !imageRef.current) return;
      
      const rect = imageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newX = x - dragStart.x;
      const newY = y - dragStart.y;
      
      // Keep crop area within image bounds
      const maxX = rect.width - cropArea.width;
      const maxY = rect.height - cropArea.height;
      
      setCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      }));
    } catch (error) {
      console.error('Error handling mouse move:', error);
    }
  };

  const handleMouseUp = () => {
    try {
      if (isDragging) {
        setIsDragging(false);
        addToHistory();
      }
    } catch (error) {
      console.error('Error handling mouse up:', error);
    }
  };

  // Add crop area to history
  const addToHistory = () => {
    try {
      const newHistory = cropHistory.slice(0, historyIndex + 1);
      newHistory.push(cropArea);
      setCropHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  };

  // Undo/Redo functionality
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCropArea(cropHistory[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < cropHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCropArea(cropHistory[historyIndex + 1]);
    }
  };

  // Rotate image
  const rotateImage = (direction: 'left' | 'right') => {
    const rotation = direction === 'left' ? -90 : 90;
    setImageRotation(prev => (prev + rotation) % 360);
  };

  // Apply aspect ratio
  const applyAspectRatio = (ratio: string) => {
    try {
      setAspectRatio(ratio);
      if (ratio === 'free') return;
      
      const [w, h] = ratio.split(':').map(Number);
      if (isNaN(w) || isNaN(h) || h === 0) {
        console.error('Invalid aspect ratio:', ratio);
        return;
      }
      
      const aspectRatioValue = w / h;
      
      const newHeight = cropWidth / aspectRatioValue;
      setCropHeight(newHeight);
      setCropArea(prev => ({
        ...prev,
        width: cropWidth,
        height: newHeight
      }));
    } catch (error) {
      console.error('Error applying aspect ratio:', error);
    }
  };

  // Handle width change
  const handleWidthChange = (width: number) => {
    try {
      if (width <= 0 || !imageRef.current) return;
      
      const img = imageRef.current;
      const maxWidth = img.clientWidth - safeCropArea.x;
      const constrainedWidth = Math.min(width, maxWidth);
      
      setCropWidth(constrainedWidth);
      
      if (aspectRatio !== 'free') {
        const [w, h] = aspectRatio.split(':').map(Number);
        const aspectRatioValue = w / h;
        const newHeight = constrainedWidth / aspectRatioValue;
        const maxHeight = img.clientHeight - safeCropArea.y;
        const constrainedHeight = Math.min(newHeight, maxHeight);
        
        setCropHeight(constrainedHeight);
        setCropArea(prev => ({
          ...prev,
          width: constrainedWidth,
          height: constrainedHeight
        }));
      } else {
        setCropArea(prev => ({
          ...prev,
          width: constrainedWidth
        }));
      }
    } catch (error) {
      console.error('Error handling width change:', error);
    }
  };

  // Handle height change
  const handleHeightChange = (height: number) => {
    try {
      if (height <= 0 || !imageRef.current) return;
      
      const img = imageRef.current;
      const maxHeight = img.clientHeight - safeCropArea.y;
      const constrainedHeight = Math.min(height, maxHeight);
      
      setCropHeight(constrainedHeight);
      
      if (aspectRatio !== 'free') {
        const [w, h] = aspectRatio.split(':').map(Number);
        const aspectRatioValue = w / h;
        const newWidth = constrainedHeight * aspectRatioValue;
        const maxWidth = img.clientWidth - safeCropArea.x;
        const constrainedWidth = Math.min(newWidth, maxWidth);
        
        setCropWidth(constrainedWidth);
        setCropArea(prev => ({
          ...prev,
          width: constrainedWidth,
          height: constrainedHeight
        }));
      } else {
        setCropArea(prev => ({
          ...prev,
          height: constrainedHeight
        }));
      }
    } catch (error) {
      console.error('Error handling height change:', error);
    }
  };

  // Handle position change
  const handlePositionChange = (x: number, y: number) => {
    try {
      if (!imageRef.current) return;
      
      const img = imageRef.current;
      const maxX = img.clientWidth - safeCropArea.width;
      const maxY = img.clientHeight - safeCropArea.height;
      
      const constrainedX = Math.max(0, Math.min(x, maxX));
      const constrainedY = Math.max(0, Math.min(y, maxY));
      
      setCropX(constrainedX);
      setCropY(constrainedY);
      setCropArea(prev => ({
        ...prev,
        x: constrainedX,
        y: constrainedY
      }));
    } catch (error) {
      console.error('Error handling position change:', error);
    }
  };

  // Crop the image
  const cropImage = () => {
    if (!imageRef.current || !canvasRef.current) {
      setIsProcessing(false);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }
      
      // Calculate the scale factor between displayed image and actual image
      const displayWidth = img.clientWidth;
      const displayHeight = img.clientHeight;
      const actualWidth = img.naturalWidth;
      const actualHeight = img.naturalHeight;
      
      if (displayWidth === 0 || displayHeight === 0 || actualWidth === 0 || actualHeight === 0) {
        setIsProcessing(false);
        return;
      }
      
      const scaleX = actualWidth / displayWidth;
      const scaleY = actualHeight / displayHeight;
      
      // Calculate actual crop coordinates
      const actualCropX = cropArea.x * scaleX;
      const actualCropY = cropArea.y * scaleY;
      const actualCropWidth = cropArea.width * scaleX;
      const actualCropHeight = cropArea.height * scaleY;
      
      // Set canvas size to crop area
      canvas.width = actualCropWidth;
      canvas.height = actualCropHeight;
      
      // Apply rotation if needed
      if (imageRotation !== 0) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((imageRotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }
      
      // Draw the cropped portion
      ctx.drawImage(
        img,
        actualCropX, actualCropY, actualCropWidth, actualCropHeight,
        0, 0, actualCropWidth, actualCropHeight
      );
      
      // Download the cropped image
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `cropped-${imageFile?.name || 'image'}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        setIsProcessing(false);
      }, 'image/png');
    } catch (error) {
      console.error('Error cropping image:', error);
      setIsProcessing(false);
    }
  };

  // Reset crop area
  const resetCrop = () => {
    if (!imageRef.current) return;
    
    const img = imageRef.current;
    const containerWidth = containerRef.current?.clientWidth || 400;
    const containerHeight = containerRef.current?.clientHeight || 300;
    
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    
    const scaleX = containerWidth / imgWidth;
    const scaleY = containerHeight / imgHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const displayWidth = imgWidth * scale;
    const displayHeight = imgHeight * scale;
    
    const cropSize = Math.min(displayWidth, displayHeight) * 0.5;
    
    const newCropArea = {
      x: (displayWidth - cropSize) / 2,
      y: (displayHeight - cropSize) / 2,
      width: cropSize,
      height: cropSize
    };
    
    setCropArea(newCropArea);
    setCropWidth(cropSize);
    setCropHeight(cropSize);
    setCropX(newCropArea.x);
    setCropY(newCropArea.y);
    addToHistory();
  };

  return (
    <>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Image Cropper</h1>
              <p className="text-gray-600">Crop any image online with precision and ease</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {!uploadedImage ? (
            /* Upload Section - Centered */
            <div className="mb-8">
              <FileUpload
                placeholder="Choose Files"
                icon=""
                boxed={true}
                showHelp={true}
                showFileInfo={false}
                maxFileSize={1024 * 1024 * 1024} // 1GB
                allowedMimeTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']}
                allowedExtensions={['jpg', 'jpeg', 'png', 'webp', 'gif']}
                onFileChange={(file) => {
                  if (file) handleFileUpload(file);
                }}
                className="space-y-2"
              />
            </div>
          ) : (
            /* Image Display and Controls */
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex gap-6">
                {/* Left Panel - Controls */}
                <div className="w-80 flex-shrink-0">
                  <div className="bg-gray-800 rounded-lg p-8 space-y-8">
                    {/* Crop Rectangle */}
                    <div>
                      <h3 className="text-white text-xl font-semibold mb-6">Crop Rectangle</h3>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-300 text-sm mb-3 font-medium">Width</label>
                            <input
                              type="number"
                              value={Math.round(cropWidth)}
                              onChange={(e) => handleWidthChange(Number(e.target.value))}
                              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-300 text-sm mb-3 font-medium">Height</label>
                            <input
                              type="number"
                              value={Math.round(cropHeight)}
                              onChange={(e) => handleHeightChange(Number(e.target.value))}
                              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-lg"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-gray-300 text-sm mb-3 font-medium">Aspect Ratio</label>
                          <select
                            value={aspectRatio}
                            onChange={(e) => applyAspectRatio(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-lg"
                          >
                            <option value="free">FreeForm</option>
                            <option value="1:1">1:1</option>
                            <option value="4:3">4:3</option>
                            <option value="16:9">16:9</option>
                            <option value="3:2">3:2</option>
                            <option value="2:3">2:3</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Crop Position */}
                    <div>
                      <h3 className="text-white text-xl font-semibold mb-6">Crop Position</h3>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-300 text-sm mb-3 font-medium">Position (Y)</label>
                            <input
                              type="number"
                              value={Math.round(cropY)}
                              onChange={(e) => handlePositionChange(cropX, Number(e.target.value))}
                              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-300 text-sm mb-3 font-medium">Position (X)</label>
                            <input
                              type="number"
                              value={Math.round(cropX)}
                              onChange={(e) => handlePositionChange(Number(e.target.value), cropY)}
                              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-lg"
                            />
                          </div>
                        </div>
                        
                        <button
                          onClick={resetCrop}
                          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 hover:bg-gray-600 transition-colors font-medium"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                    
                    {/* Crop Button */}
                    <div className="pt-6">
                      <button
                        onClick={cropImage}
                        disabled={isProcessing}
                        className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-semibold text-lg"
                      >
                        <FaCrop className="text-lg" />
                        {isProcessing ? 'Processing...' : 'Crop →'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Image Display */}
                <div className="flex-1 flex justify-center">
                  <div className="space-y-4">
                    {/* Image Info Panel */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <span>Crop Size: {Math.round(safeCropArea.width)} × {Math.round(safeCropArea.height)} px</span>
                          <span>Position: {Math.round(safeCropArea.x)}, {Math.round(safeCropArea.y)}</span>
                        </div>
                        <span>{aspectRatio === 'free' ? 'Free Form' : `${aspectRatio} Ratio`}</span>
                      </div>
                    </div>

                    {/* Image Container */}
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="relative inline-block">
                        <div
                          ref={containerRef}
                          className="relative overflow-hidden rounded-lg"
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                        >
                          <img
                            ref={imageRef}
                            src={uploadedImage}
                            alt="Image to crop"
                            className="max-w-full h-auto block"
                            style={{
                              transform: `rotate(${imageRotation}deg)`,
                              transformOrigin: 'center'
                            }}
                          />
                          
                          {/* Crop Overlay */}
                          <div
                            style={{
                              position: 'absolute',
                              left: safeCropArea.x,
                              top: safeCropArea.y,
                              width: safeCropArea.width,
                              height: safeCropArea.height,
                              border: '2px dashed #ffffff',
                              background: 'transparent',
                              cursor: 'move',
                              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                            }}
                            onMouseDown={handleMouseDown}
                          >
                            {/* Grid Overlay */}
                            <div 
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundImage: `
                                  linear-gradient(to right, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
                                  linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 1px, transparent 1px)
                                `,
                                backgroundSize: `${safeCropArea.width / 3}px ${safeCropArea.height / 3}px`,
                                backgroundPosition: '0 0, 0 0',
                                pointerEvents: 'none'
                              }}
                            />
                            
                            {/* Resize Handles */}
                            <div style={{
                              position: 'absolute',
                              top: '-4px',
                              left: '-4px',
                              width: '10px',
                              height: '10px',
                              background: '#ffffff',
                              border: '2px solid #3b82f6',
                              borderRadius: '50%',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                              cursor: 'nw-resize',
                            }} />
                            <div style={{
                              position: 'absolute',
                              top: '-4px',
                              right: '-4px',
                              width: '10px',
                              height: '10px',
                              background: '#ffffff',
                              border: '2px solid #3b82f6',
                              borderRadius: '50%',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                              cursor: 'ne-resize',
                            }} />
                            <div style={{
                              position: 'absolute',
                              bottom: '-4px',
                              left: '-4px',
                              width: '10px',
                              height: '10px',
                              background: '#ffffff',
                              border: '2px solid #3b82f6',
                              borderRadius: '50%',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                              cursor: 'sw-resize',
                            }} />
                            <div style={{
                              position: 'absolute',
                              bottom: '-4px',
                              right: '-4px',
                              width: '10px',
                              height: '10px',
                              background: '#ffffff',
                              border: '2px solid #3b82f6',
                              borderRadius: '50%',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                              cursor: 'se-resize',
                            }} />
                            <div style={{
                              position: 'absolute',
                              top: '-4px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '10px',
                              height: '10px',
                              background: '#ffffff',
                              border: '2px solid #3b82f6',
                              borderRadius: '50%',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                              cursor: 'n-resize',
                            }} />
                            <div style={{
                              position: 'absolute',
                              bottom: '-4px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '10px',
                              height: '10px',
                              background: '#ffffff',
                              border: '2px solid #3b82f6',
                              borderRadius: '50%',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                              cursor: 's-resize',
                            }} />
                            <div style={{
                              position: 'absolute',
                              left: '-4px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '10px',
                              height: '10px',
                              background: '#ffffff',
                              border: '2px solid #3b82f6',
                              borderRadius: '50%',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                              cursor: 'w-resize',
                            }} />
                            <div style={{
                              position: 'absolute',
                              right: '-4px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '10px',
                              height: '10px',
                              background: '#ffffff',
                              border: '2px solid #3b82f6',
                              borderRadius: '50%',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                              cursor: 'e-resize',
                            }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </>
  );
}
