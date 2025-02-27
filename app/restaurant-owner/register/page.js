"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaPhone, FaUtensils, FaArrowRight } from "react-icons/fa";
import Image from "next/image";

export default function RestaurantOwnerRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    contactNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const payload = { ...formData, role: "restaurant-owner", subscriptionPlan: "basic" };

    try {
      const response = await fetch("/api/restaurant-owner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration failed.");
      } else {
        setMessage("Registration successful! Redirecting...");
        setTimeout(() => router.push("/restaurant-owner"), 2000);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 md:p-8">
      <motion.div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Left Side - Content Image */}
        <div className="w-full md:w-1/2 relative overflow-hidden hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#141517]/80 to-transparent z-10" />
          <Image
            src="/images/body-images/photo-1578474846511-04ba529f0b88.avif"
            alt="Restaurant management"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 z-20 p-12 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-white text-3xl font-bold mb-4">Grow Your Restaurant Business</h3>
              <p className="text-white/90 mb-6">Join thousands of restaurant owners who are transforming their business with our innovative platform.</p>
              
              <div className="space-y-3">
                {["3D Floor Plan Builder", "Easy and User-Friendly Drag and Drop Customization", "Smart Reservation System", "Realtime Monitoring of Restaurant Status"].map((feature, index) => (
                  <motion.div 
                    key={feature}
                    className="flex items-center space-x-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + (index * 0.1) }}
                  >
                    <div className="w-5 h-5 rounded-full bg-[#FF4F18] flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-white/90 text-sm">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <div className="flex justify-between items-center mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-[#FF4F18] to-[#FF8F6B] rounded-xl flex items-center justify-center mr-3">
                <FaUtensils className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">FoodLoft</h2>
            </motion.div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => router.push("/restaurant-owner")}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h3>
            <p className="text-gray-500">Join as a restaurant owner and start managing your business</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative group">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF4F18] transition-colors" />
                <input 
                  type="text" 
                  name="firstName" 
                  placeholder="First Name" 
                  value={formData.firstName} 
                  onChange={handleChange} 
                  required 
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#FF4F18]/20 focus:border-[#FF4F18] transition-all outline-none" 
                />
              </div>
              <div className="relative group">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF4F18] transition-colors" />
                <input 
                  type="text" 
                  name="lastName" 
                  placeholder="Last Name" 
                  value={formData.lastName} 
                  onChange={handleChange} 
                  required 
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#FF4F18]/20 focus:border-[#FF4F18] transition-all outline-none" 
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <div className="relative group">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF4F18] transition-colors" />
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Email Address" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#FF4F18]/20 focus:border-[#FF4F18] transition-all outline-none" 
                />
              </div>

              <div className="relative group">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF4F18] transition-colors" />
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Create Password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#FF4F18]/20 focus:border-[#FF4F18] transition-all outline-none" 
                />
              </div>

              <div className="relative group">
                <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF4F18] transition-colors" />
                <input 
                  type="text" 
                  name="contactNumber" 
                  placeholder="Contact Number" 
                  value={formData.contactNumber} 
                  onChange={handleChange} 
                  required 
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#FF4F18]/20 focus:border-[#FF4F18] transition-all outline-none" 
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-start mt-4"
            >
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-[#FF4F18] focus:ring-[#FF4F18] border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-500">
                  I agree to the <a href="#" className="text-[#FF4F18] hover:text-[#FF4F18]/80">Terms of Service</a> and <a href="#" className="text-[#FF4F18] hover:text-[#FF4F18]/80">Privacy Policy</a>
                </label>
              </div>
            </motion.div>

            <motion.button 
              type="submit" 
              className="w-full py-3 bg-gradient-to-r from-[#FF4F18] to-[#FF8F6B] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#FF4F18]/20 transition-all transform disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center"
              disabled={loading}
              whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(255, 79, 24, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center">
                  Create Account
                  <FaArrowRight className="ml-2" />
                </span>
              )}
            </motion.button>

            {message && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={`p-4 rounded-xl flex items-center ${
                  message.includes("successful") 
                    ? "bg-green-50 border border-green-100" 
                    : "bg-red-50 border border-red-100"
                }`}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                  message.includes("successful") ? "bg-green-100" : "bg-red-100"
                }`}>
                  {message.includes("successful") ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <p className={`text-sm font-medium ${
                  message.includes("successful") ? "text-green-600" : "text-red-500"
                }`}>
                  {message}
                </p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-gray-600 text-sm"
            >
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/restaurant-owner")}
                className="text-[#FF4F18] hover:text-[#FF4F18]/80 font-semibold transition-colors"
              >
                Login here
              </button>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
