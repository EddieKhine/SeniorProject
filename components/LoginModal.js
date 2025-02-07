"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock } from "@fortawesome/free-solid-svg-icons";

export default function LoginModal({ isOpen, onClose, openSignupModal, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      const data = await response.json();

      // Preserve restaurant owner session while updating only customer session
      localStorage.removeItem("restaurantOwnerUser");
      localStorage.removeItem("restaurantOwnerToken");

      localStorage.setItem("customerUser", JSON.stringify(data.user));
      localStorage.setItem("customerToken", data.token);

      onLoginSuccess(data.user);
      onClose();
    } catch (error) {
      console.error("Unexpected error during login:", error);
      setError("Unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-8 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
          &times;
        </button>
        <h2 className="text-2xl font-bold text-[#F4A261] mb-6 text-center">Customer Login</h2>
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
