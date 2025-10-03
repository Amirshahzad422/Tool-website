'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useFileUpload, FileUploadOptions } from '@/hooks/useFileUpload';
import { ChevronDownIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { AiOutlineFileAdd } from "react-icons/ai";
import { FaDownload } from "react-icons/fa";
import Loader from './Loader';

interface FileUploadProps extends FileUploadOptions {
  className?: string;
  placeholder?: string;
  icon?: string;
  showFileInfo?: boolean;
  boxed?: boolean; // new prop to toggle outer dashed box
  showHelp?: boolean; // new prop to show/hide helper text
  onFileChange?: (file: File | null) => void;
  actionButtonText?: string; // Text for the action button (e.g., "Convert to MP3", "Compress PNG")
  onAction?: () => void; // Callback when action button is clicked
  isLoading?: boolean; // Whether the action is in progress
  showResult?: boolean; // Whether to show result preview
  resultUrl?: string; // URL for result preview
  resultFileName?: string; // Name for result file
  resultFileSize?: number; // Size of result file in bytes
  onDownload?: () => void; // Callback for download button
}

export default function FileUpload({
  className = '',
  placeholder = 'Choose Files',
  icon = '📁',
  showFileInfo = true,
  boxed = true,
  showHelp = true,
  onFileChange,
  actionButtonText,
  onAction,
  isLoading = false,
  showResult = false,
  resultUrl,
  resultFileName,
  resultFileSize,
  onDownload,
  ...hookOptions
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    fileInputRef: hookFileInputRef,
    isDropdownOpen,
    setIsDropdownOpen,
    error,
    uploadSources,
    handleFileInputChange,
    handleDrop,
    handleDragOver,
    clearError
  } = useFileUpload({
    ...hookOptions,
    onFileSelect: (file) => {
      setSelectedFile(file);
      console.log('[FileUpload] onFileChange ->', file?.name);
      onFileChange?.(file);
      clearError();
    },
    onError: (error) => {
      console.error('File upload error:', error);
    }
  });

  // Use the hook's ref
  const fileInputRef = hookFileInputRef;

  const handleRemoveFile = () => {
    setSelectedFile(null);
    console.log('[FileUpload] remove file');
    onFileChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    clearError();
  };

  const handleMouseEnter = () => setIsDropdownOpen(true);
  const handleMouseLeave = () => setIsDropdownOpen(false);

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    boxed ? (
      <div
        className="relative border-2 border-dashed border-gray-300 rounded-2xl p-10 sm:p-14 text-center hover:border-gray-400 transition-all duration-200 cursor-pointer group bg-white/60 w-full max-w-4xl mx-auto min-h-[300px] flex items-center justify-center"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col items-center justify-center space-y-6">
          {children}
        </div>
      </div>
    ) : (
      <div className={`relative text-center border border-gray-200 rounded-xl p-8 min-h-[200px] flex items-center justify-center ${className}`} onDrop={handleDrop} onDragOver={handleDragOver}>
        <div className="flex flex-col items-center justify-center space-y-4">
          {children}
        </div>
      </div>
    )
  );

  // // Show loading state
  // if (isLoading) {
  //   return (
  //     <div className={`space-y-4 relative z-10 bg-transparent ${boxed ? '' : className}`}>
  //       <Loader />
  //     </div>
  //   );
  // }

  // Show result state
  if (showResult && resultUrl && resultFileName) {
    return (
      <div className={`space-y-4 relative z-10 bg-transparent ${boxed ? '' : className}`}>
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left: Original file info */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Original File</h3>
              <div>
                <p className="font-medium text-gray-900 truncate" title={selectedFile?.name}>
                  {selectedFile?.name}
                </p>
                <p className="text-sm text-gray-500">{selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : '0'} MB</p>
              </div>
            </div>

            {/* Center: Download button */}
            <div className="flex items-center justify-center">
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="px-5 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-lg flex items-center gap-2"
                >
                  <FaDownload className="w-5 h-5" />
                  Download File
                </button>
              )}
            </div>

            {/* Right: Result info */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Result</h3>
              <div>
                <p className="font-medium text-gray-900 truncate" title={resultFileName}>
                  {resultFileName}
                </p>
                <p className="text-sm text-gray-500">
                  {resultFileSize ? `${(resultFileSize / (1024 * 1024)).toFixed(2)} MB` : 'File ready'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative z-10" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
      </div>
    );
  }

  // Show file selected state with action button
  if (selectedFile && actionButtonText && onAction) {
    return (
      <div className={`space-y-4 relative z-10 bg-transparent ${boxed ? '' : className}`}>
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left: File info */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Selected File</h3>
              <div>
                <p className="font-medium text-gray-900 truncate" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>

            {/* Center: Action button or loader */}
            <div className="flex items-center justify-center">
              {isLoading ? (
                <Loader />
              ) : (
                <button
                  onClick={onAction}
                  disabled={isLoading}
                  className="px-5 py-3 bg-[#080c2a] text-white font-semibold rounded-xl hover:bg-[#080c2a]/90 transition-colors disabled:opacity-50 shadow-lg"
                >
                  {actionButtonText}
                </button>
              )}
            </div>

            {/* Right: Result info */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Result</h3>
              {showResult && resultFileName ? (
                <div>
                  <p className="font-medium text-gray-900 truncate" title={resultFileName}>
                    {resultFileName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {resultFileSize ? `${(resultFileSize / (1024 * 1024)).toFixed(2)} MB` : 'File ready'}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  {/* <div className="text-4xl">📄</div> */}
                  <p className="text-sm text-gray-500">No result yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative z-10" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
      </div>
    );
  }

  // Show file upload state (default)
  return (
    <div className={`space-y-4 relative z-10 bg-transparent ${boxed ? '' : className}`}>
      <Wrapper>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="absolute opacity-0 w-full h-full cursor-pointer z-10"
          style={{ top: 0, left: 0 }}
          accept={(function(){
            const mimes = (hookOptions.allowedMimeTypes || []).filter(Boolean);
            const exts = (hookOptions.allowedExtensions || []).filter(Boolean).map(ext => `.${ext.replace(/^\./, '')}`);
            const seen: Record<string, boolean> = {};
            const combined = [...mimes, ...exts].filter(v => (v && !seen[v] ? (seen[v] = true) : false));
            const val = combined.join(',');
            return val || undefined as unknown as string; // undefined removes the attribute
          })()}
        />
        {/* {icon && (
          <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">
            {icon}
          </div>
        )} */}
        <div
          className="relative inline-block"
          ref={dropdownRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="px-2 sm:px-4 py-3 font-semibold text-white bg-[#080c2a] hover:bg-[#080c2a]/90 transition-all duration-200 flex items-center gap-4 mx-auto min-w-[160px] shadow-lg rounded-md pointer-events-none">
            <AiOutlineFileAdd className="w-5 h-5" />
            {placeholder}
            <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {isDropdownOpen && (
            <div
              className="absolute left-0 right-0 w-full bg-[#080c2a] text-white rounded-md shadow-2xl border border-indigo-400 border-t-0 overflow-hidden mt-1"
              style={{ zIndex: 99998 }}
            >
              <div className="py-1">
                {uploadSources.map((source) => (
                  <button
                    key={source.id}
                    onClick={(e) => { e.stopPropagation(); source.action(); }}
                    className="w-full px-4 py-3 text-left hover:bg-[#080c2a]/90 transition-colors duration-150 flex items-center gap-3 border-b border-white last:border-b-0"
                  >
                    <span className="text-xl flex-shrink-0">{source.icon}</span>
                    <span className="font-medium whitespace-nowrap">{source.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {showHelp && (
          <>
            <p className="mt-4 text-sm text-gray-600">Max file size 100MB. <a href="/login" className="underline">Login</a> for more</p>
            <p className="mt-1 text-xs text-gray-500">By proceeding, you agree to our <a href="#" className="underline">Terms of Use</a>.</p>
          </>
        )}
      </Wrapper>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative z-10" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
    </div>
  );
}