import Link from 'next/link';
import { FaTools } from "react-icons/fa";

export default function APIPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FaTools className="w-12 h-12 text-[#080c2a]" />
            <h1 className="text-4xl font-bold text-gray-900">API</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Programmatic access to our conversion and compression tools
          </p>
        </div>

        {/* Coming Soon Content */}
        <div className="bg-white shadow-lg rounded-xl p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#080c2a] rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">To be implemented</h2>
            <p className="text-lg text-gray-600 mb-6">
              We're working on providing API access to all our tools. 
              Check back soon for developers' documentation and API endpoints.
            </p>
          </div>

          {/* Features Preview */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Planned Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-[#080c2a] rounded-full mr-3"></div>
                  <span className="text-gray-700">REST API endpoints</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-[#080c2a] rounded-full mr-3"></div>
                  <span className="text-gray-700">Batch processing support</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-[#080c2a] rounded-full mr-3"></div>
                  <span className="text-gray-700">Custom format support</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-[#080c2a] rounded-full mr-3"></div>
                  <span className="text-gray-700">Webhook notifications</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-[#080c2a] rounded-full mr-3"></div>
                  <span className="text-gray-700">SDK for popular languages</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-[#080c2a] rounded-full mr-3"></div>
                  <span className="text-gray-700">Comprehensive documentation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Interested in early access?</h3>
            <p className="text-gray-600 mb-4">
              Get notified when our API is ready and receive priority access.
            </p>
            <button className="inline-flex items-center px-6 py-2 border border-[#080c2a] text-base font-medium rounded-lg text-[#080c2a] hover:bg-[#080c2a] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#080c2a] transition-colors">
              Notify Me
            </button>
          </div>

          {/* Back to Home */}
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-[#080c2a] hover:bg-[#080c2a]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#080c2a] shadow-lg transition-colors"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
