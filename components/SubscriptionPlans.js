'use client'

import { useState } from 'react'
import { FaCheckCircle, FaCrown } from 'react-icons/fa'
import { motion } from 'framer-motion'

export default function SubscriptionPlans() {
  const [currentPlan] = useState('basic') // Default plan is basic

  return (
    <div className="bg-white py-12 px-6 rounded-2xl">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900 mb-4"
          >
            Your Subscription Plan
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 max-w-2xl mx-auto"
          >
            Upgrade your plan to unlock more features and grow your business
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
          {/* Basic Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className={`relative bg-white rounded-2xl p-8 flex flex-col h-full transform transition-all duration-200 hover:shadow-xl border-2 ${
              currentPlan === 'basic' ? 'border-[#FF4F18]' : 'border-gray-100'
            }`}
          >
            {currentPlan === 'basic' && (
              <div className="absolute -top-4 right-4 bg-[#FF4F18] text-white px-4 py-2 rounded-full text-sm font-semibold">
                Current Plan
              </div>
            )}
            <div className="text-[#FF4F18] text-xl font-semibold mb-4">Basic Plan</div>
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900">THB 1,200</span>
                <span className="text-gray-500 ml-2">/month</span>
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
                <li key={index} className="flex items-start text-gray-600 group">
                  <FaCheckCircle className="text-[#FF4F18] mr-3 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button 
              className={`w-full py-4 px-6 rounded-xl ${
                currentPlan === 'basic'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#FF4F18] text-white hover:bg-[#FF4F18]/90'
              } font-semibold transition-all duration-200 transform hover:scale-[1.02]`}
              disabled={currentPlan === 'basic'}
            >
              {currentPlan === 'basic' ? 'Current Plan' : 'Downgrade'}
            </button>
          </motion.div>

          {/* Professional Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="relative bg-white rounded-2xl p-8 flex flex-col h-full transform transition-all duration-200 hover:shadow-xl border-2 border-gray-100"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
              Most Popular
            </div>
            <div className="text-[#FF4F18] text-xl font-semibold mb-4">Professional Plan</div>
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900">THB 2,800</span>
                <span className="text-gray-500 ml-2">/month</span>
              </div>
            </div>
            {/* Professional plan features */}
            <ul className="space-y-4 mb-8 flex-grow">
              {[
                'Up to 3 floor plans',
                'Real-time reservations with visual seat management',
                'Table grouping feature',
                'Multi-floor support',
                'Google Maps integration',
                'Customer reviews and ratings',
                'SMS and email notifications',
                'Priority email support'
              ].map((feature, index) => (
                <li key={index} className="flex items-start text-gray-600 group">
                  <FaCheckCircle className="text-[#FF4F18] mr-3 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button 
              className="w-full py-4 px-6 rounded-xl bg-[#FF4F18] text-white font-semibold hover:bg-[#FF4F18]/90 transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-[#FF4F18]/20"
            >
              Upgrade Plan
            </button>
          </motion.div>

          {/* Business Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="relative bg-white rounded-2xl p-8 flex flex-col h-full transform transition-all duration-200 hover:shadow-xl border-2 border-gray-100"
          >
            <div className="text-[#FF4F18] text-xl font-semibold mb-4 flex items-center gap-2">
              Business Plan <FaCrown className="text-yellow-500" />
            </div>
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900">THB 5,500</span>
                <span className="text-gray-500 ml-2">/month</span>
              </div>
            </div>
            {/* Business plan features */}
            <ul className="space-y-4 mb-8 flex-grow">
              {[
                'Unlimited floor plans',
                'Advanced real-time seat management',
                'Dynamic table arrangement',
                'Third-party integrations',
                'Custom branding',
                'Customizable menus',
                'Automated waitlist management',
                'Advanced reporting',
                'Priority support (2h response)'
              ].map((feature, index) => (
                <li key={index} className="flex items-start text-gray-600 group">
                  <FaCheckCircle className="text-[#FF4F18] mr-3 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button className="w-full py-4 px-6 rounded-xl bg-[#FF4F18] text-white font-semibold hover:bg-[#FF4F18]/90 transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-[#FF4F18]/20">
              Contact Sales
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 