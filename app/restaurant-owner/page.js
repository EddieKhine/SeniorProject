"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaUtensils, FaCheckCircle, FaSignInAlt, FaDoorOpen, FaTimes, FaArrowRight } from "react-icons/fa";
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
    <div className="min-h-screen bg-gradient-to-b from-[#141517] to-[#1C1D21]">
      <RestaurantOwnerNavbar onLoginClick={handleLoginClick} />
      
      {/* Enhanced Hero Section */}
      <section className="relative min-h-[90vh] overflow-hidden">
        {/* Background Image with Enhanced Overlay */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-gradient-to-b from-[#141517]/80 via-[#141517]/60 to-[#141517]/40 z-10" 
            style={{ backdropFilter: 'blur(1.5px)' }}
          />
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.95, 1, 0.95],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="absolute inset-0"
          >
            <img
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop"
              alt="Modern Restaurant Kitchen"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>

        {/* Modernized Grid Pattern */}
        <div className="absolute inset-0 opacity-5 z-20">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#FF4F18]/20 to-transparent" />
          <div className="grid grid-cols-[repeat(40,minmax(0,1fr))] h-full">
            {[...Array(40)].map((_, i) => (
              <div key={i} className="border-r border-white/10 h-full" />
            ))}
          </div>
        </div>

        <div className="container mx-auto px-6 py-32 relative z-30">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Enhanced Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-10"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-block px-6 py-2 bg-gradient-to-r from-[#FF4F18]/20 to-[#FF4F18]/10 
                         rounded-full mb-8 backdrop-blur-sm border border-[#FF4F18]/20"
              >
                <span className="text-[#FF4F18] font-medium tracking-wide">For Restaurant Owners</span>
              </motion.div>
              
              <h1 className="text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight tracking-tight">
                Revolutionize Your
                <span className="block mt-3 bg-gradient-to-r from-[#FF4F18] to-[#FF8F6B] text-transparent bg-clip-text">
                  Restaurant Management
                </span>
              </h1>

              <p className="text-white/80 text-xl leading-relaxed mb-12 max-w-xl">
                Transform your restaurant operations with our innovative 3D floor plan and reservation system. 
              </p>

              {/* Enhanced CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: '#FF6B18' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRegisterClick}
                  className="group flex items-center justify-center gap-3 bg-gradient-to-r from-[#FF4F18] to-[#FF6B18] 
                           text-white px-8 py-4 rounded-xl font-medium transition-all duration-300 shadow-lg 
                           shadow-[#FF4F18]/20 hover:shadow-xl hover:shadow-[#FF4F18]/30"
                >
                  Start Free Trial
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDemo(true)}
                  className="flex items-center justify-center gap-3 bg-white/5 backdrop-blur-sm text-white 
                           px-8 py-4 rounded-xl font-medium hover:bg-white/10 transition-all duration-300 
                           border border-white/10 hover:border-white/20"
                >
                  Watch Demo
                </motion.button>
              </div>
            </motion.div>

            {/* Enhanced Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative z-10"
            >
              <div className="grid grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-2xl
                             hover:bg-white/10 transition-all duration-300 group"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-[#FF4F18]/20 to-[#FF4F18]/10 
                                 rounded-xl flex items-center justify-center mb-6 
                                 group-hover:from-[#FF4F18]/30 group-hover:to-[#FF4F18]/20 transition-all duration-300"
                    >
                      <FaCheckCircle className="text-[#FF4F18] text-2xl" />
                    </div>
                    <p className="text-white/90 font-medium text-lg leading-relaxed">{benefit}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Decorative Elements */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#FF4F18]/10 rounded-full blur-[100px] z-20" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FF4F18]/10 rounded-full blur-[100px] z-20" />
      </section>

      {/* Pricing Section - Modern Stacked Cards */}
      <section className="py-24 relative bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-gray-900"
            >
              SUBSCRIPTIONS
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Basic Plan */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-white rounded-2xl p-8 relative group shadow-lg hover:shadow-xl transition-all"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Basic Plan</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">THB 1,200</span>
                <span className="text-gray-500">/month</span>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Features:</h4>
                <ul className="space-y-3">
                  {[
                    "Restaurant profile listing on the platform",
                    "1 floor plan for customization",
                    "Real-time table reservation management",
                    "Custom table and chair sizing",
                    "Email notifications for reservations",
                    "Basic customer support"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-600">
                      <FaCheckCircle className="text-[#FF4F18] mt-1 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Professional Plan */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-[#FF4F18] rounded-2xl p-8 relative group shadow-xl"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full shadow-lg">
                <span className="text-[#FF4F18] text-sm font-medium">Most Popular</span>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">Professional Plan</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold text-white">THB 2,800</span>
                <span className="text-white/80">/month</span>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Features:</h4>
                <ul className="space-y-3">
                  {[
                    "Up to 3 floor plans (perfect for multi-floor or larger restaurants)",
                    "Real-time reservations with visual seat management",
                    "Table grouping feature (for large parties)",
                    "Multi-floor support (dropdown to switch between floors)",
                    "Google Maps integration for customer convenience",
                    "Customer reviews and ratings display",
                    "SMS and email notifications for customers",
                    "Priority email support"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-white/90">
                      <FaCheckCircle className="text-white mt-1 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Business Plan */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-white rounded-2xl p-8 relative group shadow-lg hover:shadow-xl transition-all"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Business Plan</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">THB 5,500</span>
                <span className="text-gray-500">/month</span>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Features:</h4>
                <ul className="space-y-3">
                  {[
                    "Unlimited floor plans (suitable for large restaurants, cruise ships, or chains)",
                    "Advanced real-time seat management",
                    "Dynamic table arrangement feature (easily adjust table sizes)",
                    "Integration with third-party services (e.g., LINE, WhatsApp)",
                    "Custom branding (logo, colors) on the platform",
                    "Customizable menus for reservations (seasonal, VIP access)",
                    "Automated reservation reminders and waitlist management",
                    "Advanced reporting (reservation trends, revenue, and customer behavior)",
                    "Priority support (response within 2 hours)"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-600">
                      <FaCheckCircle className="text-[#FF4F18] mt-1 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FF4F18]/5 rounded-full blur-3xl -z-10" />
      </section>

      {/* Rest of the components (Demo Modal, Login Modal) */}
      <RestaurantOwnerLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}