import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use - Toolbox",
  description: "Terms of Use for Toolbox - Convert & Compress",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 pt-16 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Terms of Use
            </h1>
            <p className="text-lg text-gray-700">
              Please read these terms carefully before using our services.
            </p>
          </div>
          
          <div className="prose prose-lg max-w-none">
            <div className="bg-gray-50 rounded-xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using Toolbox, you accept and agree to be bound by the terms and provision of this agreement.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use License</h2>
              <p className="text-gray-700 mb-4">
                Permission is granted to temporarily use Toolbox for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. We do not store your files permanently and process them securely.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. File Processing</h2>
              <p className="text-gray-700 mb-4">
                Files are processed in your browser or on our secure servers. We do not retain copies of your files after processing.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                In no event shall Toolbox or its suppliers be liable for any damages arising out of the use or inability to use the materials on Toolbox.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Use, please contact us.
              </p>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
