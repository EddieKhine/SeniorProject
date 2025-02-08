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
  return (
    <>
      <RestaurantOwnerNavbar onLoginClick={handleLoginClick} />
      <div className="min-h-screen bg-[url('/images/restaurant-bg.jpg')] bg-cover bg-center bg-fixed">
        <div className="min-h-screen bg-gradient-to-b from-black/70 to-black/40 backdrop-blur-sm">
          <div className="container mx-auto flex flex-col items-center text-center p-6 md:p-10 pt-32 md:pt-40">
            {/* Hero Section */}
            {!showDemo && (
              <motion.div
                className="max-w-5xl relative z-10"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[#F4A261] to-transparent"></div>
                <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight tracking-tight">
                  Transform Your Restaurant with
                  <span className="block mt-4 bg-gradient-to-r from-[#F4A261] via-[#E07B5D] to-[#F4A261] text-transparent bg-clip-text">
                    Interactive 3D Floor Plans
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed">
                  Create stunning interactive 3D floor plans that enhance your customers'
                  <span className="font-semibold text-[#F4A261]"> booking experience</span> while optimizing your space.
                </p>
                <div className="flex flex-col sm:flex-row gap-8 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: '#E07B5D' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/owner/register")}
                    className="bg-[#F4A261] text-white px-12 py-6 rounded-full text-lg font-semibold shadow-[0_0_20px_rgba(244,162,97,0.3)] hover:shadow-[0_0_30px_rgba(244,162,97,0.5)] transition-all duration-300"
                  >
                    Get Started Free
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDemo(true)}
                    className="bg-white/10 backdrop-blur-md text-white px-12 py-6 rounded-full text-lg font-semibold border-2 border-white/30 hover:bg-white/20 transition-all duration-300 hover:border-white/50"
                  >
                    View Demo
                  </motion.button>
                </div>
                
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[#F4A261] to-transparent"></div>
                <div className="absolute -left-10 top-1/2 transform -translate-y-1/2 w-1 h-32 bg-gradient-to-b from-transparent via-[#F4A261] to-transparent hidden lg:block"></div>
                <div className="absolute -right-10 top-1/2 transform -translate-y-1/2 w-1 h-32 bg-gradient-to-b from-transparent via-[#F4A261] to-transparent hidden lg:block"></div>
              </motion.div>
            )}

            {/* Benefits Section */}
            {!showDemo && (
              <div className="mt-40 max-w-6xl w-full">
                <h2 className="text-5xl font-bold text-white mb-20 text-center">Why Choose Us?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start space-x-6 bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-white/20 transition-all duration-300"
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.15)' }}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <FaCheckCircle className="text-[#F4A261] text-3xl flex-shrink-0 mt-1" />
                      <p className="text-gray-200 text-lg">{benefit}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Subscription Section */}
            {!showDemo && (
              <div className="mt-40 max-w-6xl w-full">
                <h2 className="text-5xl font-bold text-white mb-20 text-center">Choose Your Plan</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Basic Plan */}
                  <motion.div
                    className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10 relative overflow-hidden group"
                    whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.15)' }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#F4A261]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-2xl font-bold text-white mb-4">Basic Plan</h3>
                    <p className="text-3xl font-bold text-[#F4A261] mb-6">฿1,200<span className="text-lg text-gray-300 font-normal">/month</span></p>
                    <ul className="text-left text-gray-200 space-y-4">
                      <li>Restaurant profile listing on the platform</li>
                      <li>1 floor plan for customization</li>
                      <li>Real-time table reservation management</li>
                      <li>Custom table and chair sizing</li>
                      <li>Email notifications for reservations</li>
                      <li>Basic customer support</li>
                    </ul>
                  </motion.div>

                  {/* Professional Plan */}
                  <motion.div
                    className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10 relative overflow-hidden group"
                    whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.15)' }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#F4A261]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-2xl font-bold text-white mb-4">Professional Plan</h3>
                    <p className="text-3xl font-bold text-[#F4A261] mb-6">฿2,800<span className="text-lg text-gray-300 font-normal">/month</span></p>
                    <ul className="text-left text-gray-200 space-y-4">
                      <li>Up to 3 floor plans</li>
                      <li>Real-time reservations with visual seat management</li>
                      <li>Table grouping feature for large parties</li>
                      <li>Google Maps integration for customer convenience</li>
                      <li>Customer reviews and ratings display</li>
                      <li>SMS and email notifications</li>
                    </ul>
                  </motion.div>

                  {/* Business Plan */}
                  <motion.div
                    className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10 relative overflow-hidden group"
                    whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.15)' }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#F4A261]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-2xl font-bold text-white mb-4">Business Plan</h3>
                    <p className="text-3xl font-bold text-[#F4A261] mb-6">฿5,500<span className="text-lg text-gray-300 font-normal">/month</span></p>
                    <ul className="text-left text-gray-200 space-y-4">
                      <li>Unlimited floor plans</li>
                      <li>Advanced real-time seat management</li>
                      <li>Dynamic table arrangement features</li>
                      <li>Integration with third-party services</li>
                      <li>Custom branding (logo, colors)</li>
                      <li>Priority support (response within 2 hours)</li>
                    </ul>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Call-to-Action Section */}
            {!showDemo && (
              <motion.div
                className="mt-40 bg-white/10 backdrop-blur-md p-16 rounded-3xl border border-white/10 max-w-4xl w-full"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Restaurant?</h2>
                <p className="text-xl text-gray-200 mb-8">
                  Join thousands of restaurants already using our 3D floor plan solution.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/restaurant-owner/register")}
                    className="bg-[#F4A261] text-white px-10 py-5 rounded-full font-semibold shadow-[0_0_20px_rgba(244,162,97,0.3)] hover:shadow-[0_0_30px_rgba(244,162,97,0.5)] transition-all duration-300"
                  >
                    Start Free Trial
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowLoginModal(true)}
                    className="bg-white/10 backdrop-blur-md text-white px-10 py-5 rounded-full font-semibold border-2 border-white/30 hover:bg-white/20 transition-all duration-300"
                  >
                    Log In
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* DEMO SECTION (Only visible when "View Demo" is clicked) */}
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
          </div>
        </div>
      </div>
      <RestaurantOwnerLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}