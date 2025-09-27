'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useFileUpload, FileUploadOptions } from '@/hooks/useFileUpload';
import { ChevronDownIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface FileUploadProps extends FileUploadOptions {
  className?: string;
  placeholder?: string;
  icon?: string;
  showFileInfo?: boolean;
  boxed?: boolean; // new prop to toggle outer dashed box
  showHelp?: boolean; // new prop to show/hide helper text
  onFileChange?: (file: File | null) => void;
}

export default function FileUpload({
  className = '',
  placeholder = 'Choose Files',
  icon = '📁',
  showFileInfo = true,
  boxed = true,
  showHelp = true,
  onFileChange,
  ...hookOptions
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    fileInputRef,
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
        className="border-2 border-dashed border-gray-300 rounded-2xl p-10 sm:p-14 text-center hover:border-gray-400 transition-all duration-200 cursor-pointer group bg-white/60 w-full max-w-4xl mx-auto"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {children}
      </div>
    ) : (
      <div className={`text-center ${className}`} onDrop={handleDrop} onDragOver={handleDragOver}>
        {children}
      </div>
    )
  );

  return (
    <div className={`space-y-4 relative z-10 bg-transparent ${boxed ? '' : className}`}>
      <Wrapper>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            console.log('[FileUpload] Inline onChange triggered!');
            handleFileInputChange(e);
          }}
          className="hidden"
          // Temporarily remove accept attribute to test
          // accept={[
          //   ...(hookOptions.allowedMimeTypes || []),
          //   ...((hookOptions.allowedExtensions || []).map(ext => `.${ext}`))
          // ].filter(Boolean).join(',')}
        />
        {icon && (
          <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">
            {icon}
          </div>
        )}
        <div 
          className="relative inline-block" 
          ref={dropdownRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            type="button"
            className={`px-6 sm:px-8 py-3 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all duration-200 flex items-center gap-2 mx-auto min-w-[220px] ${isDropdownOpen ? 'rounded-t-xl rounded-b-none' : 'rounded-xl'}`}
            onClick={() => {
              console.log('[FileUpload] Button clicked!');
              console.log('[FileUpload] fileInputRef.current:', fileInputRef.current);
              fileInputRef.current?.click();
            }}
          >
            {placeholder}
            <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 w-full bg-indigo-500 text-white rounded-b-xl shadow-2xl border border-indigo-400 border-t-0 overflow-hidden" style={{ zIndex: 99998 }}>
              <div className="py-1">
                {uploadSources.map((source) => (
                  <button
                    key={source.id}
                    onClick={(e) => { e.stopPropagation(); source.action(); }}
                    className="w-full px-4 py-3 text-left hover:bg-indigo-400/90 transition-colors duration-150 flex items-center gap-3 border-b border-indigo-400/60 last:border-b-0"
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
            <p className="mt-4 text-sm text-gray-600">Max file size 1GB. <a href="#" className="underline">Sign Up</a> for more</p>
            <p className="mt-1 text-xs text-gray-500">By proceeding, you agree to our <a href="#" className="underline">Terms of Use</a>.</p>
          </>
        )}
      </Wrapper>

      {selectedFile && showFileInfo && (
        <div className="p-4 bg-white/70 border border-gray-200 rounded-xl backdrop-blur-sm relative z-10">
          <div className="flex items-center space-x-3">
            {icon && <span className="text-2xl">{icon}</span>}
            <div className="flex-1">
              <div className="font-medium text-gray-900">{selectedFile.name}</div>
              <div className="text-sm text-gray-600">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</div>
            </div>
            <button onClick={handleRemoveFile} className="text-gray-500 hover:text-red-600 transition-colors">
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative z-10" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
    </div>
  );
}
