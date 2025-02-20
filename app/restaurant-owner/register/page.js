"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaPhone, FaUtensils } from "react-icons/fa";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <motion.div
        className="bg-white p-8 rounded-3xl shadow-xl max-w-2xl w-full"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 bg-gradient-to-r from-[#FF4F18] to-[#FF8F6B] rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <FaUtensils className="text-white text-2xl" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Join FoodLoft</h2>
          <p className="text-gray-500">Create your restaurant owner account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="relative group">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF4F18] transition-colors" />
              <input 
                type="text" 
                name="firstName" 
                placeholder="First Name" 
                value={formData.firstName} 
                onChange={handleChange} 
                required 
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#FF4F18]/20 focus:border-[#FF4F18] transition-all outline-none" 
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
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#FF4F18]/20 focus:border-[#FF4F18] transition-all outline-none" 
              />
            </div>
          </div>

          <div className="relative group">
            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF4F18] transition-colors" />
            <input 
              type="email" 
              name="email" 
              placeholder="Email Address" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#FF4F18]/20 focus:border-[#FF4F18] transition-all outline-none" 
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
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#FF4F18]/20 focus:border-[#FF4F18] transition-all outline-none" 
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
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#FF4F18]/20 focus:border-[#FF4F18] transition-all outline-none" 
            />
          </div>

          <motion.button 
            type="submit" 
            className="w-full py-3 bg-[#FF4F18] text-white font-semibold rounded-xl hover:bg-[#FF4F18]/90 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-[#FF4F18]/20"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : "Create Account"}
          </motion.button>

          {message && (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className={`text-center p-4 rounded-xl ${
                message.includes("successful") 
                  ? "bg-green-50 text-green-600 border border-green-100" 
                  : "bg-red-50 text-red-500 border border-red-100"
              }`}
            >
              {message}
            </motion.p>
          )}

          <p className="text-center text-gray-600 text-sm">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/restaurant-owner")}
              className="text-[#FF4F18] hover:text-[#FF4F18]/80 font-semibold transition-colors"
            >
              Login here
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
