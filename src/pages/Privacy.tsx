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
                Couple Games Hub ("we," "us," "our," or "Company") located at <strong>https://games.shizzandsparkles.fun/</strong> is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. Please read this policy carefully. If you do not agree with our practices, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Information We Collect
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-semibold mb-3">
                When you use Couple Games Hub (https://games.shizzandsparkles.fun/), we collect the following types of information:
              </p>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>Account Information:</strong> Email address, name, password, and authentication credentials when you sign up or log in via Google OAuth.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>Game Data:</strong> Game history, scores, achievements, statistics, and gameplay time across all 13 games (Tic-Tac-Toe, Pictionary, Scrabble, Word Scramble, etc.).</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>Device Information:</strong> Device type, operating system, browser version, IP address, and unique device identifiers for security and analytics.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>Usage Analytics:</strong> Pages visited, time spent in each game, features used, leaderboard interactions, and engagement patterns.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>Google OAuth Data:</strong> When authenticating through Google, we collect email and profile information per Google's authorization scope.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>Cookies & Tracking:</strong> We use cookies, session storage, and Vercel Analytics for user experience optimization and analytical insights.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. Use of Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                We use the information we collect to enhance your gaming experience and operate Couple Games Hub effectively. Specifically, we use your data to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li>Create, authenticate, and manage your user account securely</li>
                <li>Track your game progress, scores, and achievement history</li>
                <li>Display personalized leaderboards and statistics on your profile</li>
                <li>Enable multiplayer gameplay between you and your partner</li>
                <li>Send you account notifications and game invitations (optional)</li>
                <li>Analyze usage patterns to improve game quality and user experience</li>
                <li>Detect and prevent fraudulent activity and unauthorized access</li>
                <li>Comply with legal requirements and enforce our Terms of Service</li>
                <li>Provide customer support and respond to inquiries</li>
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
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                We implement comprehensive security measures to protect your personal data:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Secure HTTPS encryption for all data transmission</li>
                <li>Secure password hashing and storage</li>
                <li>Access controls and authentication protocols</li>
                <li>Regular security audits and updates</li>
                <li>Firebase and Supabase security infrastructure</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                However, no security system is 100% secure. We cannot guarantee absolute protection against all cyber threats. Your use of our service is at your own risk. We are not liable for unauthorized access to your account resulting from weak passwords or account compromise.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5.5 Data Retention and Deletion
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                We retain your personal data as long as your account is active or as needed to provide you with the service. You can request deletion of your account and associated data at any time:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li>When you delete your account, all game history and personal data is permanently removed within 30 days</li>
                <li>Aggregated, anonymized data may be retained for analytics purposes</li>
                <li>We may retain data if required by law or legitimate business purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Contact Us With Privacy Questions
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                If you have questions or comments about this Privacy Policy, please contact us:
              </p>
              <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4 border border-pink-200 dark:border-pink-800 space-y-3">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Website:</strong> <a href="https://games.shizzandsparkles.fun/" className="text-pink-600 dark:text-pink-400 hover:underline" target="_blank" rel="noopener noreferrer">https://games.shizzandsparkles.fun/</a>
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Terms of Service:</strong> <a href="/terms" className="text-pink-600 dark:text-pink-400 hover:underline">https://games.shizzandsparkles.fun/terms</a>
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  We will respond to any privacy inquiries within 30 days of receipt.
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
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Our service relies on third-party providers to operate. These services have access to specific information:
              </p>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>Firebase:</strong> Stores user authentication, game sessions, and real-time data synchronization</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>Supabase:</strong> Stores game history, statistics, and user profiles</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>Google OAuth:</strong> Handles authentication and provides email/profile verification</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">•</span>
                  <span><strong>Vercel Analytics:</strong> Collects anonymized usage analytics for performance monitoring</span>
                </li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                Each third-party service has its own privacy policy. We encourage you to review them, but we are not responsible for their practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Children's Privacy
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Couple Games Hub is designed for and intended to be used by adults (18+), and is not intended for children under the age of 13. We comply with the Children's Online Privacy Protection Act (COPPA) and do not knowingly collect personal information from children under 13.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                If we become aware that a user is a child under 13, we will immediately suspend the account and delete all associated personal information within 30 days. If you believe your child has created an account with us, please contact us immediately using the information in Section 6.
              </p>
            </section>

            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Last Updated:</strong> March 23, 2026<br />
                <strong>Service:</strong> Couple Games Hub (https://games.shizzandsparkles.fun/)<br />
                <strong>Data Protection:</strong> Your privacy is important to us. This policy is subject to applicable privacy laws.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
