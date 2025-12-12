import { Caveat } from "next/font/google";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

export const metadata = {
  title: "Privacy Policy - Frame",
  description: "Privacy Policy for Frame - Twibbonize App",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className={`${caveat.className} text-4xl font-bold text-emerald-700 mb-8`}>
            Privacy Policy
          </h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to Frame ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Frame application and services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">Personal Information</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Account information (email address, username, display name)</li>
                <li>Profile information (bio, country, profile pictures)</li>
                <li>Authentication data when using Google Sign-In</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">Usage Information</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Frame creation and usage analytics</li>
                <li>App interaction data</li>
                <li>Device and browser information</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">Content</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Images and frames you upload or create</li>
                <li>Public frame data and analytics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Provide and maintain our frame creation services</li>
                <li>Process your account registration and authentication</li>
                <li>Display public frame analytics and statistics</li>
                <li>Improve our services and user experience</li>
                <li>Communicate with you about service updates</li>
                <li>Ensure platform security and prevent abuse</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information Sharing</h2>
              <p className="text-gray-700 mb-4">
                We believe in transparency and making frame analytics publicly accessible. Here's what we share:
              </p>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">Public Information</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Frame usage statistics and popularity metrics</li>
                <li>Creator profiles and public frame galleries</li>
                <li>Trending frames and top creator rankings</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">Service Providers</h3>
              <p className="text-gray-700 mb-4">
                We may share information with trusted service providers who help us operate our platform, including Firebase (Google) for authentication and database services, and Supabase for file storage.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Access and review your personal information</li>
                <li>Update or correct your profile data</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of certain communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy, please contact us through our support channels within the application.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}