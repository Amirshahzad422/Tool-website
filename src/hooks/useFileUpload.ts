import { useState, useRef, useCallback } from 'react';

export interface FileUploadOptions {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  onFileSelect?: (file: File) => void;
  onError?: (error: string) => void;
}

export interface UploadSource {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}

export const useFileUpload = (options: FileUploadOptions = {}) => {
  const {
    maxFileSize = 100 * 1024 * 1024, // 100MB default
    allowedMimeTypes = [],
    allowedExtensions = [],
    onFileSelect,
    onError
  } = options;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): boolean => {
    // Check file size
    if (file.size > maxFileSize) {
      const errorMsg = `File size exceeds the limit of ${(maxFileSize / (1024 * 1024)).toFixed(0)}MB.`;
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    // Check MIME type (only when the browser provides one)
    if (allowedMimeTypes.length > 0 && file.type && !allowedMimeTypes.includes(file.type)) {
      const errorMsg = 'Invalid file type. Please select a supported file format.';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    // Check file extension
    if (allowedExtensions.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        const errorMsg = 'Invalid file extension. Please select a supported file format.';
        setError(errorMsg);
        onError?.(errorMsg);
        return false;
      }
    }

    setError(null);
    return true;
  }, [maxFileSize, allowedMimeTypes, allowedExtensions, onError]);

  const handleFileSelect = useCallback((file: File) => {
    if (validateFile(file)) {
      onFileSelect?.(file);
    }
  }, [validateFile, onFileSelect]);

  const handleDeviceUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Convert provider share links to direct download URLs
  const toDirectDownloadUrl = useCallback((inputUrl: string): string => {
    try {
      const url = new URL(inputUrl.trim());

      // Dropbox: append dl=1 or replace ?dl=0
      if (url.hostname.includes('dropbox.com')) {
        url.searchParams.set('dl', '1');
        return url.toString();
      }

      // Google Drive: /file/d/<id>/view => uc?export=download&id=<id>
      if (url.hostname.includes('drive.google.com')) {
        const match = url.pathname.match(/\/file\/d\/([^/]+)\//);
        const id = match?.[1] || url.searchParams.get('id');
        if (id) {
          return `https://drive.google.com/uc?export=download&id=${id}`;
        }
      }

      // OneDrive: ensure download=1
      if (url.hostname.includes('1drv.ms') || url.hostname.includes('onedrive.live.com')) {
        if (!url.searchParams.get('download')) url.searchParams.set('download', '1');
        return url.toString();
      }

      // Fallback: return as-is
      return inputUrl;
    } catch {
      return inputUrl;
    }
  }, []);

  // Fetch a file over HTTP(S) and convert to File instance
  const importFromUrl = useCallback(async (rawUrl: string) => {
    const directUrl = toDirectDownloadUrl(rawUrl);
    try {
      const res = await fetch(directUrl, { credentials: 'omit', mode: 'cors' });
      if (!res.ok) throw new Error(`Failed to fetch file (status ${res.status})`);

      const blob = await res.blob();

      // Try to get filename from Content-Disposition
      const cd = res.headers.get('Content-Disposition') || '';
      let filename = '';
      const dispoMatch = cd.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
      if (dispoMatch) {
        filename = decodeURIComponent(dispoMatch[1] || dispoMatch[2] || '').trim();
      }
      if (!filename) {
        try {
          const u = new URL(directUrl);
          filename = (u.pathname.split('/').pop() || 'download').split('?')[0];
        } catch {
          filename = 'download';
        }
      }

      const inferredType = blob.type || 'application/octet-stream';
      const file = new File([blob], filename, { type: inferredType });
      handleFileSelect(file);
      setIsDropdownOpen(false);
    } catch (e: unknown) {
      const msg = (e instanceof Error ? e.message : null) || 'Unable to import file from URL. Some providers may block cross-origin downloads.';
      setError(msg);
      onError?.(msg);
    }
  }, [handleFileSelect, onError, toDirectDownloadUrl]);

  const promptAndImport = useCallback(async (providerLabel: string) => {
    const value = window.prompt(`Paste a public ${providerLabel} link to your file:`);
    if (!value) return;
    await importFromUrl(value);
  }, [importFromUrl]);

  const handleDropboxUpload = useCallback(() => {
    promptAndImport('Dropbox');
  }, [promptAndImport]);

  const handleGoogleDriveUpload = useCallback(() => {
    promptAndImport('Google Drive');
  }, [promptAndImport]);

  const handleOneDriveUpload = useCallback(() => {
    promptAndImport('OneDrive');
  }, [promptAndImport]);

  const handleGenericUrlUpload = useCallback(() => {
    promptAndImport('URL');
  }, [promptAndImport]);

  const uploadSources: UploadSource[] = [
    {
      id: 'device',
      label: 'From Device',
      icon: '💻',
      action: handleDeviceUpload
    },
    // {
    //   id: 'dropbox',
    //   label: 'From Dropbox',
    //   icon: '📦',
    //   action: handleDropboxUpload
    // },
    {
      id: 'google-drive',
      label: 'From Google Drive',
      icon: '☁️',
      action: handleGoogleDriveUpload
    },
    // {
    //   id: 'onedrive',
    //   label: 'From OneDrive',
    //   icon: '📁',
    //   action: handleOneDriveUpload
    // },
    {
      id: 'url',
      label: 'From Url',
      icon: '🔗',
      action: handleGenericUrlUpload
    }
  ];

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    console.log('[useFileUpload] drop, file:', file?.name);
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    fileInputRef,
    isDropdownOpen,
    setIsDropdownOpen,
    error,
    uploadSources,
    handleFileInputChange,
    handleDrop,
    handleDragOver,
    toggleDropdown,
    clearError,
    validateFile
  };
};
