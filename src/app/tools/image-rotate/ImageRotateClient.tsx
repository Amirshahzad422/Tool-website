'use client';

import { useState, useRef } from 'react';
import { FaRotate, FaDownload } from 'react-icons/fa6';
import FileUpload from '@/components/FileUpload';

export default function ImageRotateClient() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [straightenAngle, setStraightenAngle] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileUpload = (file: File) => {
    try {
      setImageFile(file);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          setUploadedImage(e.target.result as string);
          setRotation(0);
          setStraightenAngle(0);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error loading image:', error);
    }
  };

  const rotateClockwise = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const rotateCounterClockwise = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleStraightenChange = (value: number) => {
    setStraightenAngle(value);
  };

  const resetRotation = () => {
    setRotation(0);
    setStraightenAngle(0);
  };

  const downloadRotatedImage = async () => {
    if (!uploadedImage || !canvasRef.current || !imageRef.current) return;

    try {
      setIsProcessing(true);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = imageRef.current;
      const totalRotation = rotation + straightenAngle;
      const radians = (totalRotation * Math.PI) / 180;

      // Calculate new canvas dimensions
      const cos = Math.abs(Math.cos(radians));
      const sin = Math.abs(Math.sin(radians));
      const newWidth = img.width * cos + img.height * sin;
      const newHeight = img.width * sin + img.height * cos;

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Clear and draw rotated image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radians);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `rotated-${imageFile?.name || 'image.png'}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        setIsProcessing(false);
      }, 'image/png');
    } catch (error) {
      console.error('Error downloading image:', error);
      setIsProcessing(false);
    }
  };

  const totalRotation = rotation + straightenAngle;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Rotate Image</h1>
              <p className="text-gray-600">Rotate and straighten any image online with ease</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {!uploadedImage ? (
            <div className="mb-8">
              <FileUpload
                onFileChange={(file) => {
                  if (file) handleFileUpload(file);
                }}
                boxed={true}
                showHelp={true}
                className="space-y-2"
              />
            </div>
          ) : (
            /* Rotate Interface */
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex gap-6">
                {/* Left Panel - Controls */}
                <div className="w-80 flex-shrink-0">
                  <div className="bg-gray-800 rounded-lg p-8 space-y-8">
                    {/* Rotation Buttons */}
                    <div>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <button
                          onClick={rotateCounterClockwise}
                          className="flex flex-col items-center justify-center gap-3 px-6 py-8 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
                        >
                          <FaRotate className="text-3xl transform -scale-x-100" />
                          <span className="text-sm font-medium">Clock Wise</span>
                        </button>
                        <button
                          onClick={rotateClockwise}
                          className="flex flex-col items-center justify-center gap-3 px-6 py-8 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
                        >
                          <FaRotate className="text-3xl" />
                          <span className="text-sm font-medium">Counter Clock Wise</span>
                        </button>
                      </div>
                    </div>

                    {/* Straighten Slider */}
                    <div>
                      <h3 className="text-white text-xl font-semibold mb-6">Straighten</h3>
                      
                      <div className="space-y-4">
                        <div className="relative">
                          <input
                            type="range"
                            min="-45"
                            max="45"
                            value={straightenAngle}
                            onChange={(e) => handleStraightenChange(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            style={{
                              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((straightenAngle + 45) / 90) * 100}%, #374151 ${((straightenAngle + 45) / 90) * 100}%, #374151 100%)`
                            }}
                          />
                          <div className="flex justify-between mt-2 text-xs text-gray-400">
                            <span>-45°</span>
                            <span className="text-white font-semibold">{straightenAngle}°</span>
                            <span>45°</span>
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm">Rotate image in any angle</p>
                      </div>
                    </div>

                    {/* Reset Button */}
                    <div>
                      <button
                        onClick={resetRotation}
                        className="w-full px-6 py-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors border border-gray-600 font-semibold text-lg"
                      >
                        Reset
                      </button>
                    </div>

                    {/* Download Button */}
                    <div>
                      <button
                        onClick={downloadRotatedImage}
                        disabled={isProcessing}
                        className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-semibold text-lg"
                      >
                        <FaDownload className="text-lg" />
                        {isProcessing ? 'Processing...' : 'Download'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Image Display */}
                <div className="flex-1 flex justify-center items-center">
                  <div className="bg-gray-100 rounded-lg p-8 w-full flex items-center justify-center min-h-[600px]">
                    <div className="relative inline-block">
                      <img
                        ref={imageRef}
                        src={uploadedImage}
                        alt="Uploaded"
                        className="max-w-full max-h-[550px] object-contain"
                        style={{
                          transform: `rotate(${totalRotation}deg)`,
                          transition: 'transform 0.3s ease',
                        }}
                        crossOrigin="anonymous"
                      />
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

