"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaUtensils, FaCheckCircle, FaSignInAlt, FaDoorOpen, FaTimes } from "react-icons/fa";
import RestaurantOwnerLoginModal from "@/components/RestaurantOwnerLoginModal";
import RestaurantOwnerNavbar from '@/components/RestaurantOwnerNavbar';

export default function RestaurantOwnerHome() {
  const router = useRouter();
  const [showDemo, setShowDemo] = useState(false); // Toggle Demo Section
  const [showLoginModal, setShowLoginModal] = useState(false);
  const benefits = [  
    "Easy Drag & Drop 3D Layout Builder",
    "Customers Can Select & Reserve Their Seats",
    "Increase Reservations & Maximize Space Efficiency",
    "Real-Time Floor Plan Updates & Seat Availability",
  ];
  const handleLoginSuccess = (user) => {
    console.log("Logged in user ", user);
    // Get the token from localStorage
    const token = localStorage.getItem('restaurantOwnerToken');
    // Use simple string path instead of object
    router.push('/restaurant-owner/setup');
  }
  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleRegisterClick = () => {
    router.push('/restaurant-owner/register');
  };

  return (
    <>
      <RestaurantOwnerNavbar onLoginClick={handleLoginClick} />
      
      {/* Split-screen hero section */}
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left side - Content */}
        <div className="lg:w-1/2 bg-gradient-to-br from-[#2D3436] to-[#1A1C1E] p-8 lg:p-16 flex items-center">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6">
                Design Your Space,
                <span className="block mt-2 text-[#F4A261]">Delight Your Guests</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Create immersive 3D floor plans that transform the dining experience and maximize your restaurant's potential.
              </p>
              
              {/* Interactive Feature Pills */}
              <div className="flex flex-wrap gap-4 mb-8">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="bg-white/10 backdrop-blur px-4 py-2 rounded-full"
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(244,162,97,0.2)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="text-white">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="bg-[#F4A261] text-white px-8 py-4 rounded-lg font-medium"
                  onClick={handleRegisterClick}
                >
                  Register Now
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="bg-transparent border-2 border-[#F4A261] text-[#F4A261] px-8 py-4 rounded-lg font-medium"
                  onClick={() => setShowDemo(true)}
                >
                  Watch Demo
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right side - Interactive 3D Preview */}
        <div className="lg:w-1/2 bg-[#1A1C1E] relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1 }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
              {/* Interactive hotspots */}
              <motion.div
                className="absolute top-1/4 left-1/4 w-12 h-12 cursor-pointer"
                whileHover={{ scale: 1.2 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-[#F4A261] rounded-full animate-ping opacity-75"></div>
                  <div className="relative bg-[#F4A261] w-full h-full rounded-full flex items-center justify-center">
                    <FaUtensils className="text-white" />
                  </div>
                </div>
              </motion.div>
              {/* Add more hotspots as needed */}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Pricing Section - Modern Horizontal Layout */}
      <div className="bg-gradient-to-b from-[#2D3436] to-[#1A1C1E] py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold text-white mb-4"
            >
              SUBSCRIPTIONS
            </motion.h2>
          </div>

          {/* Pricing Cards - Horizontal Scroll on Mobile */}
          <div className="flex flex-nowrap overflow-x-auto gap-6 pb-8 px-4 -mx-4 md:mx-0 md:flex-wrap md:justify-center">
            {/* Basic Plan */}
            <motion.div
              whileHover={{ y: -8 }}
              className="w-[340px] flex-shrink-0 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700 flex flex-col"
            >
              <div className="text-[#F4A261] text-lg font-medium mb-4">Basic Plan</div>
              <div className="mb-6">
                <span className="text-2xl font-bold text-white">THB 1,200</span>
                <span className="text-gray-400">/month</span>
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
                  <li key={index} className="flex items-start text-gray-300">
                    <FaCheckCircle className="text-[#F4A261] mr-3 mt-1 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 px-6 rounded-xl bg-gray-700 text-white hover:bg-gray-600 transition-colors mt-auto">
                Get Started
              </button>
            </motion.div>

            {/* Professional Plan */}
            <motion.div
              whileHover={{ y: -8 }}
              className="w-[340px] flex-shrink-0 bg-gradient-to-br from-[#F4A261] to-[#E76F51] rounded-2xl p-8 relative flex flex-col"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm">
                Most Popular
              </div>
              <div className="text-white text-lg font-medium mb-4">Professional Plan</div>
              <div className="mb-6">
                <span className="text-2xl font-bold text-white">THB 2,800</span>
                <span className="text-white/80">/month</span>
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
                  <li key={index} className="flex items-start text-white">
                    <FaCheckCircle className="text-white mr-3 mt-1 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 px-6 rounded-xl bg-white text-[#F4A261] hover:bg-gray-100 transition-colors mt-auto">
                Get Started
              </button>
            </motion.div>

            {/* Business Plan */}
            <motion.div
              whileHover={{ y: -8 }}
              className="w-[340px] flex-shrink-0 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700 flex flex-col"
            >
              <div className="text-[#F4A261] text-lg font-medium mb-4">Business Plan</div>
              <div className="mb-6">
                <span className="text-2xl font-bold text-white">THB 5,500</span>
                <span className="text-gray-400">/month</span>
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
                  <li key={index} className="flex items-start text-gray-300">
                    <FaCheckCircle className="text-[#F4A261] mr-3 mt-1 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 px-6 rounded-xl bg-gray-700 text-white hover:bg-gray-600 transition-colors mt-auto">
                Contact Sales
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* FAQ Preview */}
      <div className="mt-20 text-center">
        <p className="text-gray-400 mb-4">Have questions? Check our FAQ</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="text-[#F4A261] hover:text-[#E76F51] transition-colors"
        >
          View FAQ →
        </motion.button>
      </div>

      {/* Demo Modal */}
      {showDemo && (
        <motion.div
          className="mt-16 bg-white p-10 rounded-lg shadow-lg max-w-4xl relative"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Close Button */}
          <button
            onClick={() => setShowDemo(false)}
            className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition"
          >
            <FaTimes />
          </button>

          <h2 className="text-3xl font-bold text-[#3A2E2B] mb-6">Live Demo</h2>
          <p className="text-gray-700 mb-4">
            Experience how the interactive 3D floor plan looks and functions before implementing it.
          </p>

          {/* DEMO IMAGE OR VIDEO (Replace with actual content later) */}
          <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-gray-600 text-lg">[Demo Preview Placeholder]</span>
          </div>

          <p className="text-gray-700 mt-6">
            Interested in creating your own? <strong>Sign up now</strong> and start designing your restaurant layout!
          </p>

          <div className="flex gap-4 justify-center mt-6">
            <button
              onClick={() => router.push("/owner/register")}
              className="bg-[#F4A261] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-[#E07B5D] transition"
            >
              Get Started
            </button>
            <button
              onClick={() => router.push("/owner/login")}
              className="bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-gray-900 transition"
            >
              Log In
            </button>
          </div>
        </motion.div>
      )}

      <RestaurantOwnerLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}