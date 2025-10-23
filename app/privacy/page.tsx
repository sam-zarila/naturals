'use client';

import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = {
    'Information We Collect': [
      'Personal details (name, email, address) when you order or sign up.',
      'Payment info (handled securely by Paystack, not stored by us).',
      'Cart and browsing data via Firebase and localStorage.',
      'Automatic data (IP, browser, cookies) for analytics.',
    ],
    'How We Use Your Information': [
      'Process orders and payments with Paystack.',
      'Manage your cart and suggest products.',
      'Send order updates or promotions (with your consent).',
      'Prevent fraud and meet legal requirements.',
    ],
    'Sharing Your Information': [
      'With Paystack for payments and Firebase for storage.',
      'With shipping partners for delivery.',
      'Only if required by law or to protect our rights.',
      'We never sell your data.',
    ],
    'Data Security': ['We use encryption and controls, but no system is 100% secure.'],
    'Your Rights': [
      'Access, update, or delete your data.',
      'Opt out of marketing emails.',
      'Withdraw consent anytime.',
      'Contact us at [Your Email Address]—we’ll respond in 30 days.',
    ],
    'Cookies and Tracking': ['Used for cart and analytics; manage via browser settings.'],
    'Data Retention': ['Kept as needed or per law (e.g., 5 years for transactions).'],
    'International Transfers': ['May transfer data abroad with safeguards.'],
    'Changes to This Policy': ['Updates posted here; continued use means acceptance.'],
    'Contact Us': [
      'Email: [Your Email Address]',
      'Phone: [Your Phone Number]',
      'Address: [Your Address]',
    ],
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-white py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-12"
        >
          <Image
            src="/logo.png"
            width={80}
            height={80}
            alt="Delightful Naturals logo"
            className="mx-auto rounded-full shadow-md mb-4"
          />
          <h1 className="text-3xl sm:text-4xl font-bold text-emerald-900 drop-shadow-sm">Privacy Policy</h1>
          <p className="text-emerald-700 text-base sm:text-lg mt-2">Last updated: October 23, 2025</p>
        </motion.div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-emerald-800 text-center sm:text-left text-sm sm:text-base leading-relaxed bg-white/90 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-md border border-emerald-100"
          >
            At delightfulnaturals respects your privacy and protects your data. This policy covers how we handle your information on delightfulnaturals.co.za, including orders and cart use, complying with POPIA (South Africa) and NDPR (Nigeria).
          </motion.p>

          {Object.entries(sections).map(([title, points], index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-emerald-100"
            >
              <h2
                onClick={() => toggleSection(title)}
                className="text-xl sm:text-2xl font-semibold text-emerald-900 flex items-center justify-between cursor-pointer hover:text-emerald-700 transition-colors"
              >
                <span>{title}</span>
                <span>{activeSection === title ? '▲' : '▼'}</span>
              </h2>
              <AnimatePresence>
                {(activeSection === title || !activeSection) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 space-y-2"
                  >
                    {points.map((point, i) => (
                      <p key={i} className="text-emerald-700 text-sm sm:text-base">
                        {point}
                      </p>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {/* Back to Home Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-8"
          >
            <Link
              href="/"
              className="inline-flex items-center px-5 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg"
            >
              Back to Home
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}