'use client'

import { useState } from 'react'
import { FaCheckCircle } from 'react-icons/fa'
import { motion } from 'framer-motion'

export default function SubscriptionPlans() {
  return (
    <div className="bg-gradient-to-b from-[#2D3436] to-[#1A1C1E] py-12 px-6 rounded-2xl">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-4"
          >
            Choose Your Plan
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-300 max-w-2xl mx-auto"
          >
            Select the perfect plan that suits your restaurant's needs and scale your business
          </motion.p>
        </div>

        {/* Pricing Cards - Updated Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
          {/* Basic Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700 flex flex-col h-full transform transition-all duration-200 hover:shadow-xl"
          >
            <div className="text-[#F4A261] text-xl font-semibold mb-4">Basic Plan</div>
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white">THB 1,200</span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              {[
                'Restaurant profile listing on the platform',
                '1 floor plan for customization',
                'Real-time table reservation management',
                'Custom table and chair sizing',
                'Email notifications for reservations',
                'Basic customer support'
              ].map((feature, index) => (
                <li key={index} className="flex items-start text-gray-300 group">
                  <FaCheckCircle className="text-[#F4A261] mr-3 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-gray-700 to-gray-600 text-white font-semibold hover:from-gray-600 hover:to-gray-500 transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800">
              Get Started
            </button>
          </motion.div>

          {/* Professional Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="relative bg-gradient-to-br from-[#F4A261] to-[#E76F51] rounded-2xl p-8 flex flex-col h-full transform transition-all duration-200 hover:shadow-xl"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
              Most Popular
            </div>
            <div className="text-white text-xl font-semibold mb-4">Professional Plan</div>
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white">THB 2,800</span>
                <span className="text-white/80 ml-2">/month</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              {[
                'Up to 3 floor plans (perfect for multi-floor or larger restaurants)',
                'Real-time reservations with visual seat management',
                'Table grouping feature (for large parties)',
                'Multi-floor support (dropdown to switch between floors)',
                'Google Maps integration for customer convenience',
                'Customer reviews and ratings display',
                'SMS and email notifications for customers',
                'Priority email support'
              ].map((feature, index) => (
                <li key={index} className="flex items-start text-white group">
                  <FaCheckCircle className="text-white mr-3 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button className="w-full py-4 px-6 rounded-xl bg-white text-[#F4A261] font-semibold hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#F4A261]">
              Get Started
            </button>
          </motion.div>

          {/* Business Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700 flex flex-col h-full transform transition-all duration-200 hover:shadow-xl"
          >
            <div className="text-[#F4A261] text-xl font-semibold mb-4">Business Plan</div>
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white">THB 5,500</span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              {[
                'Unlimited floor plans (suitable for large restaurants, cruise ships, or chains)',
                'Advanced real-time seat management',
                'Dynamic table arrangement feature (easily adjust table sizes)',
                'Integration with third-party services (e.g., LINE, WhatsApp)',
                'Custom branding (logo, colors) on the platform',
                'Customizable menus for reservations (seasonal, VIP access)',
                'Automated reservation reminders and waitlist management',
                'Advanced reporting (reservation trends, revenue, and customer behavior)',
                'Priority support (response within 2 hours)'
              ].map((feature, index) => (
                <li key={index} className="flex items-start text-gray-300 group">
                  <FaCheckCircle className="text-[#F4A261] mr-3 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-gray-700 to-gray-600 text-white font-semibold hover:from-gray-600 hover:to-gray-500 transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800">
              Contact Sales
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 