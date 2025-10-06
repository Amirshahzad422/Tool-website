'use client';

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-4">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-gray-300 mb-4">404</div>
          <div className="w-24 h-1 bg-[#080c2a] mx-auto rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            The page you tried to open doesn't exist
          </p>
          <p className="text-sm text-gray-500">
            The page might have been moved, deleted, or you might have entered the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="w-full px-6 py-3 bg-[#080c2a] text-white font-semibold rounded-xl hover:bg-[#080c2a]/90 transition-colors shadow-lg"
          >
            Return to last opened page
          </button>
          
          <Link
            href="/"
            className="block w-full px-6 py-3 border-2 border-[#080c2a] text-[#080c2a] font-semibold rounded-xl hover:bg-[#080c2a]/5 transition-colors"
          >
            Return to Home
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">
            Need help finding what you're looking for?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/convert"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Browse Converters
            </Link>
            <Link
              href="/compress"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Browse Compressors
            </Link>
            <Link
              href="/tools"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              All Tools
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
