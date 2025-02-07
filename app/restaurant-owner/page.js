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
  return (
    <>
    <RestaurantOwnerNavbar />
      <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] via-[#e9ecef] to-[#dee2e6] flex flex-col items-center text-center p-6 md:p-10 pt-20">
        {/* Hero Section */}
        {!showDemo && (
          <motion.div
            className="max-w-4xl"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-[#2D3436] mb-8 leading-tight">
              Transform Your Restaurant with 
              <span className="bg-gradient-to-r from-[#F4A261] to-[#E07B5D] text-transparent bg-clip-text"> 3D Floor Plans</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Create stunning interactive 3D floor plans that enhance your customers' 
              <span className="font-semibold text-[#F4A261]"> booking experience</span> while optimizing your space.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/owner/register")}
                className="bg-gradient-to-r from-[#F4A261] to-[#E07B5D] text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Get Started Free
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDemo(true)}
                className="bg-white text-[#2D3436] px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-[#F4A261]"
              >
                View Demo
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Benefits Section */}
        {!showDemo && (
          <div className="mt-24 max-w-5xl w-full">
            <h2 className="text-4xl font-bold text-[#2D3436] mb-12 text-center">Why Choose Us?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  className="flex items-start space-x-6 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all"
                  whileHover={{ scale: 1.02 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <FaCheckCircle className="text-[#F4A261] text-3xl flex-shrink-0 mt-1" />
                  <p className="text-gray-700 text-lg">{benefit}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Subscription Section */}
        {!showDemo && (
          <div className="mt-24 max-w-6xl w-full">
            <h2 className="text-4xl font-bold text-[#2D3436] mb-12 text-center">Choose Your Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Basic Plan */}
              <motion.div
                className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg relative overflow-hidden group"
                whileHover={{ scale: 1.03 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#F4A261]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <h3 className="text-2xl font-bold text-[#2D3436] mb-4">Basic Plan</h3>
                <p className="text-3xl font-bold text-[#F4A261] mb-6">฿1,200<span className="text-lg text-gray-500 font-normal">/month</span></p>
                <ul className="text-left text-gray-600 space-y-4">
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
                className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg relative overflow-hidden group"
                whileHover={{ scale: 1.03 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#F4A261]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <h3 className="text-2xl font-bold text-[#2D3436] mb-4">Professional Plan</h3>
                <p className="text-3xl font-bold text-[#F4A261] mb-6">฿2,800<span className="text-lg text-gray-500 font-normal">/month</span></p>
                <ul className="text-left text-gray-600 space-y-4">
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
                className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg relative overflow-hidden group"
                whileHover={{ scale: 1.03 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#F4A261]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <h3 className="text-2xl font-bold text-[#2D3436] mb-4">Business Plan</h3>
                <p className="text-3xl font-bold text-[#F4A261] mb-6">฿5,500<span className="text-lg text-gray-500 font-normal">/month</span></p>
                <ul className="text-left text-gray-600 space-y-4">
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
            className="mt-24 bg-white/80 backdrop-blur-sm p-12 rounded-2xl shadow-lg max-w-4xl w-full"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-[#2D3436] mb-6">Ready to Transform Your Restaurant?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of restaurants already using our 3D floor plan solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/restaurant-owner/register")}
                className="bg-gradient-to-r from-[#F4A261] to-[#E07B5D] text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Start Free Trial
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLoginModal(true)}
                className="bg-[#2D3436] text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
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

        <RestaurantOwnerLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    </>
  );
}