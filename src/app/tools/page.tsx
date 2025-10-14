import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tools - Toolbox',
  description: 'Various utility tools including color picker, image resizer, and more.',
};

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Tools</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our collection of utility tools to help you with various tasks
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Color Picker Tool */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Color Picker</h3>
                  <p className="text-gray-600 text-sm">Pick and convert colors</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Advanced color picker with support for multiple color formats including HEX, RGB, HSV, HSL, and CMYK.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">HEX</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">RGB</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">HSV</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">HSL</span>
                <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full">CMYK</span>
              </div>
              <a
                href="/tools/color-picker"
                className="block w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
              >
                Use Color Picker
              </a>
            </div>
          </div>

          {/* Image Cropper Tool */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Image Cropper</h3>
                  <p className="text-gray-600 text-sm">Crop images with precision</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Crop any image online with our advanced image cropper tool. Free, fast, and easy to use with multiple aspect ratios.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">Free Crop</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Aspect Ratios</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Rotate</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Undo/Redo</span>
              </div>
              <a
                href="/tools/image-cropper"
                className="block w-full bg-gradient-to-r from-green-500 to-teal-500 text-white text-center py-3 rounded-lg font-semibold hover:from-green-600 hover:to-teal-600 transition-all duration-200"
              >
                Use Image Cropper
              </a>
            </div>
          </div>

          {/* Rotate Image Tool */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Rotate Image</h3>
                  <p className="text-gray-600 text-sm">Rotate and straighten images</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Rotate any image online with our advanced rotation tool. Rotate 90°, flip, or straighten images with precision angle control.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Rotate 90°</span>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">Straighten</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Angle Control</span>
                <span className="px-3 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">Reset</span>
              </div>
              <a
                href="/tools/image-rotate"
                className="block w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-center py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
              >
                Use Rotate Image
              </a>
            </div>
          </div>

          {/* Audio Joiner Tool */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Audio Joiner</h3>
                  <p className="text-gray-600 text-sm">Merge multiple audio files</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Combine multiple audio files into one seamlessly. Support for MP3, WAV, M4A, OGG, FLAC and more with drag-and-drop reordering.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Merge Audio</span>
                <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full">Reorder</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Preview</span>
                <span className="px-3 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">Multiple Formats</span>
              </div>
              <a
                href="/tools/audio-joiner"
                className="block w-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-center py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200"
              >
                Use Audio Joiner
              </a>
            </div>
          </div>

          {/* Audio Trimmer Tool */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4h10a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Audio Trimmer</h3>
                  <p className="text-gray-600 text-sm">Trim and cut audio files</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Trim your audio files with precision. Upload any audio file and cut it to the exact length you need with visual timeline controls.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Precise Trim</span>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">Visual Timeline</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Multiple Formats</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">Easy to Use</span>
              </div>
              <a
                href="/tools/audio-trimmer"
                className="block w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-center py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all duration-200"
              >
                Use Audio Trimmer
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
