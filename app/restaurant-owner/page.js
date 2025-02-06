"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaUtensils, FaCheckCircle, FaSignInAlt, FaDoorOpen, FaTimes } from "react-icons/fa";
import RestaurantOwnerLoginModal from "@/components/RestaurantOwnerLoginModal";

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
    router.push('/restaurant-owner/setup')
  }
  return (
    <div className="min-h-screen bg-gradient-to-r from-[#f3e7e9] to-[#e3eeff] flex flex-col items-center text-center p-10">
      {/* Hero Section */}
      {!showDemo && (
        <motion.div
          className="max-w-3xl"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[#3A2E2B] mb-6">
            Transform Your Restaurant with a <span className="text-[#F4A261]">3D Floor Plan</span>
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            Seamlessly create and display an interactive 3D floor plan for your restaurant.
            Give customers a better <strong>booking experience</strong> while optimizing table management.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push("/owner/register")}
              className="bg-[#F4A261] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-[#E07B5D] transition"
            >
              Get Started
            </button>
            <button
              onClick={() => setShowDemo(true)}
              className="bg-white text-[#F4A261] px-6 py-3 rounded-lg font-semibold shadow-md border hover:bg-[#F4A261] hover:text-white transition"
            >
              View Demo
            </button>
          </div>
        </motion.div>
      )}

      {/* Benefits Section */}
      {!showDemo && (
        <div className="mt-16 max-w-4xl text-left">
          <h2 className="text-3xl font-bold text-[#3A2E2B] mb-6 text-center">Why Choose Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                className="flex items-center space-x-4 bg-white p-6 rounded-lg shadow-md"
                whileHover={{ scale: 1.05 }}
              >
                <FaCheckCircle className="text-[#F4A261] text-4xl" />
                <p className="text-gray-700 font-medium">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Subscription Section */}
      {!showDemo && (
        <div className="mt-16 max-w-6xl text-left">
          <h2 className="text-3xl font-bold text-[#3A2E2B] mb-6 text-center">Subscriptions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <motion.div
              className="bg-white p-6 rounded-lg shadow-md text-center"
              whileHover={{ scale: 1.05 }}
            >
              <h3 className="text-2xl font-bold text-[#F4A261] mb-4">Basic Plan</h3>
              <p className="text-lg font-semibold text-gray-700 mb-4">THB 1,200/month</p>
              <ul className="text-left text-gray-700 space-y-2">
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
              className="bg-white p-6 rounded-lg shadow-md text-center"
              whileHover={{ scale: 1.05 }}
            >
              <h3 className="text-2xl font-bold text-[#F4A261] mb-4">Professional Plan</h3>
              <p className="text-lg font-semibold text-gray-700 mb-4">THB 2,800/month</p>
              <ul className="text-left text-gray-700 space-y-2">
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
              className="bg-white p-6 rounded-lg shadow-md text-center"
              whileHover={{ scale: 1.05 }}
            >
              <h3 className="text-2xl font-bold text-[#F4A261] mb-4">Business Plan</h3>
              <p className="text-lg font-semibold text-gray-700 mb-4">THB 5,500/month</p>
              <ul className="text-left text-gray-700 space-y-2">
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
          className="mt-16 bg-white p-10 rounded-lg shadow-lg max-w-3xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-[#3A2E2B]">Ready to Get Started?</h2>
          <p className="text-gray-700 mt-4">
            Sign up now and start designing your restaurant layout in just a few clicks.
          </p>
          <div className="flex gap-4 justify-center mt-6">
            <button
              onClick={() => router.push("/restaurant-owner/register")}
              className="bg-[#F4A261] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-[#E07B5D] transition"
            >
              Register Now
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-gray-900 transition"
            >
              Log In
            </button>
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
  );
}