import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Privacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Privacy Policy
          </h1>

          <div className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Introduction
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Couple Games Hub ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Information We Collect
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-semibold mb-3">
                We may collect information about you in a variety of ways. The information we may collect on the site includes:
              </p>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>Account Information:</strong> When you create an account, we collect your email address, name, and authentication credentials for login purposes.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>Game Data:</strong> We collect information about your gameplay, including game history, scores, achievements, and statistics to provide personalized experiences and leaderboards.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>Device Information:</strong> We may collect device type, operating system, browser type, and device identifiers for analytics and improvement purposes.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>Usage Data:</strong> We automatically collect information about your interaction with our services, including pages visited, time spent, and features used.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>OAuth Data:</strong> If you authenticate through Google or other third-party providers, we collect information per their authorization (email, basic profile).</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>Cookies and Analytics:</strong> We use cookies and similar tracking technologies for analytics, preferences, and service improvement through Vercel Analytics.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. Use of Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the site to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li>Create and manage your user account</li>
                <li>Process your game data and track your progress</li>
                <li>Generate personalized reports through the Leaderboard and Profile pages</li>
                <li>Email you regarding your account or game activity</li>
                <li>Analyze website usage through analytics tools</li>
                <li>Improve our services based on user behavior and preferences</li>
                <li>Detect fraud and maintain service security</li>
                <li>Comply with legal obligations and enforce our Terms of Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Disclosure of Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We may share information we have collected about you in certain situations:
              </p>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>By Law or to Protect Rights:</strong> If required by law or if we believe that disclosure is necessary to protect our rights, your rights, privacy, safety, or the property of others.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>Third-Party Service Providers:</strong> We may share information with vendors who assist us in operating our website and conducting our business (Firebase, Supabase, Google OAuth, Vercel Analytics).</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>Third-Party Links:</strong> Our site may contain links to other sites that are not operated by us. This Privacy Policy applies only to information collected through our service.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>Aggregated Data:</strong> We may share aggregated, non-personally identifiable information with third parties for research, marketing, analytics, and other purposes.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Security of Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We use administrative, technical, and physical security measures to protect your personal information. However, no method of transmission over the Internet or method of electronic storage is 100% secure. We cannot guarantee absolute security of your information. Your use of our service is at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Contact Us With Privacy Questions
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                If you have questions or comments about this Privacy Policy, please contact us at:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Email:</strong> support@couplegameshub.com
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Changes to This Privacy Policy
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We may update this Privacy Policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons. We will notify you of any changes by updating the "Last Updated" date and will ensure that your rights under this Privacy Policy are not negatively impacted.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Your Privacy Rights
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li>The right to access your personal data</li>
                <li>The right to correct inaccurate data</li>
                <li>The right to request deletion of your data</li>
                <li>The right to opt-out of marketing communications</li>
                <li>The right to data portability</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                To exercise any of these rights, please contact us using the information provided in Section 6.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Third-Party Services
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Our service integrates with third-party services including Firebase, Supabase, Google OAuth, and Vercel Analytics. These third parties have their own privacy policies governing how they collect and use your information. We encourage you to review their privacy policies as we are not responsible for their privacy practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Children's Privacy
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information and terminate the child's account.
              </p>
            </section>

            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last Updated: March 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
