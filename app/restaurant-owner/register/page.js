"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#f3e7e9] to-[#e3eeff] p-8">
      <motion.div
        className="bg-white p-10 rounded-xl shadow-2xl max-w-2xl w-full"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h2 className="text-3xl font-bold text-[#3A2E2B] mb-2 text-center">Register as a Restaurant Owner</h2>
        <p className="text-gray-600 text-center mb-8">Join our platform and start managing your restaurant today</p>
        
        <form onSubmit={handleSubmit} className="space-y-6 text-black">
          {/* Owner Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input 
                type="text" 
                id="firstName"
                name="firstName" 
                placeholder="Enter your first name" 
                value={formData.firstName} 
                onChange={handleChange} 
                required 
                className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-[#F4A261] focus:border-transparent transition-all outline-none" 
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input 
                type="text" 
                id="lastName"
                name="lastName" 
                placeholder="Enter your last name" 
                value={formData.lastName} 
                onChange={handleChange} 
                required 
                className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-[#F4A261] focus:border-transparent transition-all outline-none" 
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              id="email"
              name="email" 
              placeholder="your@email.com" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-[#F4A261] focus:border-transparent transition-all outline-none" 
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              id="password"
              name="password" 
              placeholder="Create a strong password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-[#F4A261] focus:border-transparent transition-all outline-none" 
            />
          </div>

          <div>
            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
            <input 
              type="text" 
              id="contactNumber"
              name="contactNumber" 
              placeholder="Enter your contact number" 
              value={formData.contactNumber} 
              onChange={handleChange} 
              required 
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-[#F4A261] focus:border-transparent transition-all outline-none" 
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-4 bg-[#F4A261] text-white font-semibold rounded-lg hover:bg-[#E07B5D] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Registering...
              </span>
            ) : "Sign Up"}
          </button>

          {message && (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className={`text-center p-3 rounded-lg ${
                message.includes("successful") 
                  ? "bg-green-50 text-green-800" 
                  : "bg-red-50 text-red-800"
              }`}
            >
              {message}
            </motion.p>
          )}
        </form>
      </motion.div>
    </div>
  );
}
