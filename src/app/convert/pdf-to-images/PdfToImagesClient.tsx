"use client";

import { useMemo, useState, useEffect } from "react";
import FileUpload from '@/components/FileUpload';

export default function PdfToImagesClient() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<Array<{ name: string; url: string }>>([]);
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [convertProgress, setConvertProgress] = useState(0);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_MIME_TYPES = ['application/pdf'];
  const ALLOWED_EXTENSIONS = ['pdf'];

  const resetState = () => {
    setFile(null);
    setImages([]);
    setError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadingFileName("");
    setConvertProgress(0);
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      resetState();
      return;
    }
    // Simulate upload progress UI
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(selectedFile.name);
    setError(null);
    setImages([]);

    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 20 + 5;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(100);
          setFile(selectedFile);
          setUploadingFileName("");
        }, 200);
      }
      setUploadProgress(current);
    }, 150);
  };

  useEffect(() => {
    // Load PDF.js from CDN
    const loadPdfJs = () => {
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
          const workerScript = document.createElement('script');
          workerScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          workerScript.onload = () => {
            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = workerScript.src;
            setPdfjsLoaded(true);
            resolve();
          };
          workerScript.onerror = () => reject(new Error('Failed to load PDF.js worker'));
          document.head.appendChild(workerScript);
        };
        script.onerror = () => reject(new Error('Failed to load PDF.js'));
        document.head.appendChild(script);
      });
    };

    loadPdfJs().catch(error => {
      console.error('Error loading PDF.js:', error);
    });

    return () => {
      const scripts = document.querySelectorAll('script[src*="pdf.js"]');
      scripts.forEach(script => script.remove());
    };
  }, []);

  async function handleConvert() {
    if (!file) return;
    setIsLoading(true);
    setConvertProgress(0);
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 15 + 5;
      if (current >= 95) current = 95;
      setConvertProgress(current);
    }, 200);
    setImages([]);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("target", "png");
      form.append("density", "144");
      const res = await fetch("/api/convert/pdf-to-images", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to convert PDF");

      const imgs: Array<{ name: string; url: string }> = [];
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) throw new Error("PDF.js not loaded yet. Please wait a moment and try again.");

      for (const page of data.pages) {
        try {
          const binaryString = window.atob(page.base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let j = 0; j < binaryString.length; j++) bytes[j] = binaryString.charCodeAt(j);
          const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
          const pageObj = await pdf.getPage(1);
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) throw new Error("Canvas context not available");
          const viewport = pageObj.getViewport({ scale: 144 / 72 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await pageObj.render({ canvasContext: context, viewport, canvas }).promise;
          const imageDataUrl = canvas.toDataURL('image/png', 0.9);
          const imageName = page.filename.replace('.pdf', '.png');
          imgs.push({ name: imageName, url: imageDataUrl });
        } catch (pageError) {
          console.error(`Error converting page ${page.filename}:`, pageError);
        }
      }

      setImages(imgs);
      setConvertProgress(100);
    } catch (e) {
      console.warn("Server conversion failed, trying client-side fallback with PDF.js");
      if (!pdfjsLoaded) {
        setError("PDF.js is still loading. Please wait a moment and try again.");
        return;
      }
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) throw new Error("PDF.js not available");
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        const out: Array<{ name: string; url: string }> = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const scale = 144 / 72;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          canvas.width = viewport.width as number;
          canvas.height = viewport.height as number;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          const url = canvas.toDataURL("image/png");
          out.push({ name: `page-${i}.png`, url });
        }
        setImages(out);
        setConvertProgress(100);
      } catch (clientErr) {
        console.error(clientErr);
        setError("Conversion failed. Please try again.");
      }
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  }

  function handleDownloadImage(imageUrl: string, imageName: string) {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = imageName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Single outer dropzone like Video → GIF */}
      <div className="mt-16 sm:mt-20 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-16 sm:p-20 text-center min-h-[220px]">
        <div className="flex justify-center">
          <div className="w-full max-w-xs">
            <FileUpload
              placeholder="Choose Files"
              icon=""
              boxed={false}
              showHelp={false}
              maxFileSize={MAX_FILE_SIZE}
              allowedMimeTypes={ALLOWED_MIME_TYPES}
              allowedExtensions={ALLOWED_EXTENSIONS}
              onFileChange={handleFileChange}
              onError={setError}
              className="space-y-2"
            />
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-600">Max file size 1GB. <a href="#" className="underline">Sign Up</a> for more</p>
        <p className="mt-1 text-xs text-gray-500">By proceeding, you agree to our <a href="#" className="underline">Terms of Use</a>.</p>
      </div>

      {/* Upload progress pill */}
      {isUploading && (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-800">Uploading {uploadingFileName}…</span>
            <span className="text-sm text-gray-600">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gray-700 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* PDF.js Status */}
      {!pdfjsLoaded && (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            <span className="text-sm text-gray-700">Loading PDF.js…</span>
          </div>
        </div>
      )}
      {pdfjsLoaded && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✓</span>
            <span className="text-sm text-green-700 font-medium">PDF.js ready for conversion</span>
          </div>
        </div>
      )}

      {/* Convert Button */}
      {file && images.length === 0 && (
        <button
          onClick={handleConvert}
          disabled={isLoading || !pdfjsLoaded}
          className="mt-4 w-full py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isLoading ? `Converting… ${Math.round(convertProgress)}%` : 'Convert to Images'}
        </button>
      )}

      {/* Converting Progress */}
      {isLoading && (
        <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2 text-sm text-gray-700">
            <span>Converting PDF…</span>
            <span>{Math.round(convertProgress)}%</span>
          </div>
          <div className="w-full bg-gray-300/50 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-gray-700 to-gray-800 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${convertProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Download All Button */}
      {images.length > 0 && (
        <button
          onClick={() => {
            images.forEach((img, index) => {
              setTimeout(() => handleDownloadImage(img.url, img.name), index * 300);
            });
          }}
          className="mt-4 w-full py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
        >
          Download All Images ({images.length})
        </button>
      )}
    </div>
  );
}
