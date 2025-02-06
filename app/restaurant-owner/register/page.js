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
    restaurantName: "",
    address: "",
    city: "",
    cuisineType: "",
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
        setTimeout(() => router.push("/restaurant-owner/dashboard"), 2000);
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
        className="bg-white p-10 rounded-lg shadow-lg max-w-2xl w-full"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl font-bold text-[#3A2E2B] mb-6 text-center">Register as a Restaurant Owner</h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-black">
          {/* Owner Info */}
          <div className="grid grid-cols-2 gap-4">
            <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required className="p-3 border rounded-md w-full" />
            <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required className="p-3 border rounded-md w-full" />
          </div>
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="p-3 border rounded-md w-full" />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required className="p-3 border rounded-md w-full" />
          <input type="text" name="contactNumber" placeholder="Contact Number" value={formData.contactNumber} onChange={handleChange} required className="p-3 border rounded-md w-full" />
          
          {/* Restaurant Info */}
          <h3 className="text-xl font-semibold mt-4">Your First Restaurant</h3>
          <input type="text" name="restaurantName" placeholder="Restaurant Name" value={formData.restaurantName} onChange={handleChange} required className="p-3 border rounded-md w-full" />
          <input type="text" name="address" placeholder="Restaurant Address" value={formData.address} onChange={handleChange} required className="p-3 border rounded-md w-full" />
          <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} required className="p-3 border rounded-md w-full" />
          <input type="text" name="cuisineType" placeholder="Cuisine Type (e.g. Italian, Thai)" value={formData.cuisineType} onChange={handleChange} required className="p-3 border rounded-md w-full" />
          
          <button type="submit" className="w-full py-3 bg-[#F4A261] text-white font-semibold rounded-md hover:bg-[#E07B5D] transition" disabled={loading}>
            {loading ? "Registering..." : "Sign Up"}
          </button>
          {message && <p className="text-center text-gray-700 mt-3">{message}</p>}
        </form>
      </motion.div>
    </div>
  );
}
