import { Caveat } from "next/font/google";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

export const metadata = {
  title: "Terms & Conditions - Frame",
  description: "Terms & Conditions for Frame - Twibbonize App",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className={`${caveat.className} text-4xl font-bold text-emerald-700 mb-8`}>
            Terms & Conditions
          </h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing and using Frame ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Use License</h2>
              <p className="text-gray-700 mb-4">
                Permission is granted to temporarily use Frame for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Use the service for any commercial purpose without written consent</li>
                <li>Attempt to reverse engineer or hack the service</li>
                <li>Upload harmful, offensive, or illegal content</li>
                <li>Violate any applicable local, state, national or international law</li>
                <li>Impersonate other users or provide false identity information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Accounts</h2>
              <p className="text-gray-700 mb-4">
                Frame operates on an accessibility-first model:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Visitors:</strong> Can browse, use frames, and download results without creating an account</li>
                <li><strong>Creators:</strong> Must create an account only to upload custom frames</li>
                <li>You are responsible for maintaining the confidentiality of your account information</li>
                <li>You agree to accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Content and Intellectual Property</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">Your Content</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>You retain ownership of content you upload</li>
                <li>By uploading frames, you grant us a license to display and distribute them publicly</li>
                <li>You must have rights to all content you upload</li>
                <li>You are responsible for ensuring your content doesn't infringe on others' rights</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">Public Analytics</h3>
              <p className="text-gray-700 mb-4">
                All frame usage statistics, popularity metrics, and creator rankings are made publicly available as part of our transparency commitment. By using the service, you consent to this public analytics approach.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Prohibited Uses</h2>
              <p className="text-gray-700 mb-4">You may not use Frame:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>To submit false or misleading information</li>
                <li>To upload or transmit viruses or any other type of malicious code</li>
                <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Availability</h2>
              <p className="text-gray-700 mb-4">
                We strive to maintain service availability but cannot guarantee uninterrupted access. We reserve the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Modify or discontinue the service with reasonable notice</li>
                <li>Remove content that violates these terms</li>
                <li>Suspend or terminate accounts for violations</li>
                <li>Update these terms as needed</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Privacy and Data</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Disclaimer</h2>
              <p className="text-gray-700 mb-4">
                The information on this service is provided on an "as is" basis. To the fullest extent permitted by law, this Company:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Excludes all representations and warranties relating to this service and its contents</li>
                <li>Does not guarantee the accuracy, completeness, or reliability of user-generated content</li>
                <li>Will not be liable for any loss or damage arising from use of the service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitations</h2>
              <p className="text-gray-700 mb-4">
                In no event shall Frame or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use Frame, even if Frame or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These terms and conditions are governed by and construed in accordance with applicable law and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to update these Terms & Conditions at any time. Changes will be effective immediately upon posting. Your continued use of Frame after any changes constitutes acceptance of those changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms & Conditions, please contact us through our support channels within the application.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}