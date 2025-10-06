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
      return false;
    }

    // Check file extension first (more reliable than MIME type)
    if (allowedExtensions.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        const errorMsg = 'Invalid file extension. Please select a supported file format.';
        setError(errorMsg);
        onError?.(errorMsg);
        return false;
      }
    }

    // Check MIME type only if extension check passed and MIME type is provided by browser
    if (allowedMimeTypes.length > 0 && file.type && file.type !== '') {
      // For HEIC files, browsers often report different MIME types, so be more lenient
      const isHeicFile = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
      const isHeicMimeType = allowedMimeTypes.some(mime => mime.includes('heic') || mime.includes('heif'));
      
      if (isHeicFile && isHeicMimeType) {
        // Skip MIME type validation for HEIC files as browsers are inconsistent
        console.log('[useFileUpload] Skipping MIME validation for HEIC file:', file.name);
      } else if (!allowedMimeTypes.includes(file.type)) {
        const errorMsg = 'Invalid file type. Please select a supported file format.';
        setError(errorMsg);
        onError?.(errorMsg);
        return false;
      }
    }

    setError(null);
    return true;
  }, [maxFileSize, allowedMimeTypes, allowedExtensions, onError]);

  const handleFileSelect = useCallback((file: File) => {
    console.log('[useFileUpload] handleFileSelect called with:', file.name);
    if (validateFile(file)) {
      console.log('[useFileUpload] File validation passed, calling onFileSelect');
      onFileSelect?.(file);
    } else {
      console.log('[useFileUpload] File validation failed');
    }
  }, [validateFile, onFileSelect]);

  const handleDeviceUpload = useCallback(() => {
    console.log('[useFileUpload] handleDeviceUpload called');

    // Prefer a transient input to avoid any ref/hydration/overlay issues
    const transient = document.createElement('input');
    transient.type = 'file';

    // Build accept string from provided options
    const mimes = (allowedMimeTypes || []).filter(Boolean);
    const exts = (allowedExtensions || []).filter(Boolean).map(ext => `.${ext.replace(/^\./, '')}`);
    const seen: Record<string, boolean> = {};
    const combined = [...mimes, ...exts].filter(v => (v && !seen[v] ? (seen[v] = true) : false));
    if (combined.length) transient.accept = combined.join(',');

    transient.style.position = 'fixed';
    transient.style.left = '-9999px';
    document.body.appendChild(transient);

    const onTransientChange = (evt: Event) => {
      const input = evt.currentTarget as HTMLInputElement;
      const file = input.files?.[0] || null;
      console.log('[useFileUpload] transient input change file:', file?.name);
      if (file) {
        handleFileSelect(file);
      }
      input.removeEventListener('change', onTransientChange);
      document.body.removeChild(input);
    };

    transient.addEventListener('change', onTransientChange, { once: true } as AddEventListenerOptions);
    transient.click();
  }, [allowedMimeTypes, allowedExtensions, handleFileSelect]);

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
      icon: 'device',
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
      icon: 'drive',
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
      icon: 'url',
      action: handleGenericUrlUpload
    }
  ];

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    console.log('[useFileUpload] handleFileInputChange called with file:', file?.name, 'type:', file?.type);
    if (file) {
      handleFileSelect(file);
      // reset value to allow selecting the same file twice in a row
      input.value = '';
    } else {
      console.log('[useFileUpload] No file received from input change');
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
