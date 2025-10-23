'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function DeliveryPolicyPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = {
    'Shipping Methods and Costs': [
      'Standard: R50 (South Africa), 3-5 days.',
      'Express: R100, 1-2 days.',
      'International: Variable rates, 7-14 days (customs fees apply).',
      'Free over R500 (domestic only).',
    ],
    'Order Processing Time': [
      '1-2 days after Paystack payment.',
      'Longer during peak times; we’ll notify you.',
    ],
    'Delivery Timeframes': [
      'Estimates only; delays possible (weather, customs, carriers).',
      'Ship Monday-Friday, excluding holidays.',
    ],
    'Tracking and Confirmation': [
      'Email with tracking number after shipping.',
      'Track via [Carrier Website].',
    ],
    'Shipping Restrictions': [
      'No P.O. boxes or restricted areas.',
      'Incorrect address may incur re-delivery fees.',
    ],
    'Damaged, Lost, or Undelivered Items': [
      'Damaged: Notify within 48 hours with photos for refund/replacement.',
      'Lost: We’ll investigate within 7 days for refund/reshipment.',
      'Undelivered: Reship with extra fees if address error.',
    ],
    'International Shipping Considerations': [
      'Duties/taxes not included; buyer’s responsibility.',
      'Times vary due to customs.',
    ],
    'Changes to This Policy': ['Updates posted here; check regularly.'],
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
          <h1 className="text-3xl sm:text-4xl font-bold text-emerald-900 drop-shadow-sm">Delivery Policy</h1>
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
            [Your Company Name] delivers orders promptly with reliable carriers. This policy outlines shipping details, compliant with e-commerce standards.
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