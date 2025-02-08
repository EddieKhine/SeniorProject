"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

export default function RestaurantOwnerLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/restaurant-owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const data = await response.json();

      localStorage.removeItem("customerUser");
      localStorage.removeItem("customerToken");

      localStorage.setItem("restaurantOwnerUser", JSON.stringify(data.user));
      localStorage.setItem("restaurantOwnerToken", data.token);
      
      // Navigate based on restaurant association
      if (data.user.hasRestaurant) {
        router.push('/restaurant-owner/setup/dashboard');
      } else {
        router.push('/restaurant-owner/setup');
      }
      
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-black">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
          &times;
        </button>
        <h2 className="text-2xl font-bold text-[#F4A261] mb-6 text-center">
          Restaurant Owner Login
        </h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full pl-10 border-b border-gray-300 focus:border-[#F4A261] focus:outline-none py-3" />
          </div>
          <div className="relative">
            <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full pl-10 border-b border-gray-300 focus:border-[#F4A261] focus:outline-none py-3" />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" className={`w-full py-3 ${loading ? "bg-gray-400" : "bg-[#F4A261]"} text-white font-semibold rounded-md hover:bg-[#E07B5D] transition`} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
