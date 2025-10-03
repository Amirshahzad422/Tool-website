import React, { useEffect, useState } from "react";

interface FilePreviewProps {
  file: File;
}

export default function FilePreview({ file }: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isHeic, setIsHeic] = useState(false);

  const fileName = file.name;
  const fileType = file.type;
  const fileSize = (file.size / (1024 * 1024)).toFixed(2);

  const isImage = fileType.startsWith("image/");
  const isVideo = fileType.startsWith("video/");
  const isAudio = fileType.startsWith("audio/");
  const isPdf = fileType === "application/pdf";

  // Detect HEIC/HEIF even if MIME type is missing
  useEffect(() => {
    const lower = fileName.toLowerCase();
    if (
      fileType === "image/heic" ||
      fileType === "image/heif" ||
      lower.endsWith(".heic") ||
      lower.endsWith(".heif")
    ) {
      setIsHeic(true);
    }
  }, [fileName, fileType]);

  // Generate preview URL
  useEffect(() => {
    let url: string | null = null;

    const generatePreview = async () => {
      try {
        if (isHeic) {
          // Only convert HEIC on client-side
          if (typeof window !== 'undefined') {
            const heic2any = (await import('heic2any')).default;
            const convertedBlob = await heic2any({
              blob: file,
              toType: "image/jpeg",
              quality: 0.9,
            });
            const blob = Array.isArray(convertedBlob)
              ? convertedBlob[0]
              : convertedBlob;
            url = URL.createObjectURL(blob);
            setPreviewUrl(url);
          } else {
            // Server-side: show placeholder
            setPreviewUrl(null);
          }
        } else if (isImage || isVideo || isAudio || isPdf) {
          url = URL.createObjectURL(file);
          setPreviewUrl(url);
        } else {
          setPreviewUrl(null);
        }
      } catch (err) {
        console.error("Preview generation failed:", err);
        setPreviewUrl(null);
      }
    };

    generatePreview();

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file, isHeic, isImage, isVideo, isAudio, isPdf]);

  const renderPreview = () => {
    if (isHeic) {
      return previewUrl ? (
        <img
          src={previewUrl}
          alt={fileName}
          className="w-full h-48 object-contain rounded-lg border border-gray-200"
        />
      ) : (
        <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center mb-2 mx-auto">
              <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zM7 4h10v12H7V4zm0 14h10v2H7v-2z"/>
              </svg>
            </div>
            <p className="text-sm text-gray-600">HEIC Preview</p>
            <p className="text-xs text-gray-500 mt-1">Preview not available</p>
          </div>
        </div>
      );
    }
    
    if (isImage) {
      return previewUrl ? (
        <img
          src={previewUrl}
          alt={fileName}
          className="w-full h-48 object-contain rounded-lg border border-gray-200"
        />
      ) : (
        <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
          <p className="text-gray-600">Image preview not available</p>
        </div>
      );
    }

    if (isVideo) {
      return (
        <video
          src={previewUrl || ""}
          controls
          className="w-full h-48 object-contain rounded-lg border border-gray-200"
        />
      );
    }

    if (isAudio) {
      return (
        <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg border">
          <audio src={previewUrl || ""} controls className="w-full max-w-xs" />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg border">
          <div className="text-center">
            <div className="text-6xl mb-2">📄</div>
            <p className="text-sm text-gray-600">PDF File</p>
          </div>
        </div>
      );
    }

    // Generic file preview
    return (
      <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg border">
        <div className="text-center">
          <div className="text-6xl mb-2">📁</div>
          <p className="text-sm text-gray-600">No preview available</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {renderPreview()}
      <div className="text-center">
        <p className="font-medium text-gray-900 truncate" title={fileName}>
          {fileName}
        </p>
        <p className="text-sm text-gray-500">{fileSize} MB</p>
      </div>
    </div>
  );
}
