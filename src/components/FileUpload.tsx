'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useFileUpload, FileUploadOptions } from '@/hooks/useFileUpload';
import { ChevronDownIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { AiOutlineFileAdd } from "react-icons/ai";
import { FaDownload, FaFolderPlus, FaLink } from "react-icons/fa";
import { SiGoogledrive } from "react-icons/si";
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
    clearError,
    toggleDropdown
  } = useFileUpload({
    ...hookOptions,
    onFileSelect: (file) => {
      console.log('[FileUpload] onFileSelect called with:', file?.name);
      setSelectedFile(file);
      console.log('[FileUpload] selectedFile state set to:', file?.name);
      console.log('[FileUpload] onFileChange ->', file?.name);
      onFileChange?.(file);
      clearError();
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

  // Use click to toggle dropdown to prevent accidental close when moving cursor
  const handleMouseEnter = () => {};
  const handleMouseLeave = () => {};

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    boxed ? (
      <div
        className="relative border-3 border-double border-gray-300 rounded-2xl p-5 sm:p-14 text-center bg-gray-100 w-full max-w-4xl mx-auto min-h-[300px] flex items-center justify-center"
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
                  <FaDownload className="hidden md:block w-5 h-5" />
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
  console.log('[FileUpload] Render check - selectedFile:', selectedFile?.name, 'actionButtonText:', actionButtonText, 'onAction:', !!onAction);
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
        {/* {icon && (
          <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">
            {icon}
          </div>
        )} */}
        <div
          className="relative inline-block z-20"
          ref={dropdownRef}
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          {/* Compound button: left label triggers file input, right chevron toggles dropdown */}
          <div className="inline-flex items-stretch rounded-md shadow-lg overflow-hidden">
            <label className="relative px-3 sm:px-4 py-3 font-semibold text-white bg-[#080c2a] flex items-center gap-3 cursor-pointer select-none">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  console.log('[FileUpload] native <input> onChange file:', f?.name);
                  handleFileInputChange(e);
                }}
                className="sr-only"
                accept={(function(){
                  const mimes = (hookOptions.allowedMimeTypes || []).filter(Boolean);
                  const exts = (hookOptions.allowedExtensions || []).filter(Boolean).map(ext => `.${ext.replace(/^\./, '')}`);
                  const seen: Record<string, boolean> = {};
                  const combined = [...mimes, ...exts].filter(v => (v && !seen[v] ? (seen[v] = true) : false));
                  const val = combined.join(',');
                  return val || undefined as unknown as string; // undefined removes the attribute
                })()}
              />
              <AiOutlineFileAdd className="hidden md:block w-5 h-5" />
              {placeholder}
            </label>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleDropdown(); }}
              className="px-3 py-3 bg-[#080c2a] text-white border-l border-white/20 hover:bg-[#080c2a]/90"
              aria-expanded={isDropdownOpen}
              aria-label="More upload options"
            >
              <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {isDropdownOpen && (
            <div
              className="absolute left-0 right-0 w-full bg-[#080c2a] text-white rounded-md shadow-2xl border border-indigo-400 border-t-0 overflow-hidden mt-1"
              style={{ zIndex: 99998 }}
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <div className="py-1">
                {uploadSources.map((source) => (
                  <button
                    key={source.id}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      console.log('[FileUpload] Dropdown option clicked:', source.label);
                      if (source.id === 'device') {
                        // Ensure file dialog opens without being interrupted
                        const inputEl = fileInputRef.current;
                        if (inputEl) {
                          const closeOnChange = () => {
                            setIsDropdownOpen(false);
                            inputEl.removeEventListener('change', closeOnChange);
                          };
                          inputEl.addEventListener('change', closeOnChange, { once: true } as AddEventListenerOptions);
                        }
                        // Defer action to next frame for stability
                        requestAnimationFrame(() => source.action());
                      } else {
                        source.action();
                        setIsDropdownOpen(false);
                      }
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-[#080c2a]/90 transition-colors duration-150 flex items-center gap-3 border-b border-white last:border-b-0"
                  >
                    <span className="text-xl flex-shrink-0">
                      {source.icon === 'device' && <FaFolderPlus className="w-5 h-5" />}
                      {source.icon === 'drive' && <SiGoogledrive className="w-5 h-5" />}
                      {source.icon === 'url' && <FaLink className="w-5 h-5" />}
                      {!['device', 'drive', 'url'].includes(source.icon) && <span>{source.icon}</span>}
                    </span>
                    <span className="font-medium whitespace-nowrap">{source.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {showHelp && (
          <>
            <p className="mt-4 text-sm text-gray-600">Max file size 1GB. <a href="/login" className="underline text-[#080c2a] hover:text-[#080c2a]/90">Login</a> for more</p>
            <p className="mt-1 text-xs text-gray-500">By proceeding, you agree to our <a href="/terms" className="underline text-gray-600 hover:text-gray-700">Terms of Use</a>.</p>
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