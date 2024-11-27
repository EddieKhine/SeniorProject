"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faUtensils } from "@fortawesome/free-solid-svg-icons";

export default function LoginModal({ isOpen, onClose, openSignupModal, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading state
    setError(""); // Clear previous error

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

      const result = await response.json();
      console.log("Login successful", result);

      const userData = { name: result.name, email: result.email };

      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }

      onClose();
    } catch (error) {
      console.error("Unexpected error during login:", error);
      setError("Unexpected error occurred. Please try again.");
    } finally {
      setLoading(false); // End loading state
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-8 relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
          &times;
        </button>

        <div className="flex flex-col items-center mb-8">
          <FontAwesomeIcon icon={faUtensils} className="text-5xl text-[#F4A261] mb-4" />
          <h2 className="text-2xl font-bold text-center text-[#F4A261]">Welcome to FoodLoft</h2>
        </div>

        <div className="w-full border-b border-gray-300 mb-6"></div>

        <form onSubmit={handleLogin} className="w-full">
          <div className="relative mb-6">
            <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full pl-10 border-b-2 border-gray-300 focus:outline-none focus:border-[#F4A261] py-2 text-black"
            />
          </div>

          <div className="relative mb-6">
            <FontAwesomeIcon icon={faLock} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full pl-10 border-b-2 border-gray-300 focus:outline-none focus:border-[#F4A261] py-2 text-black"
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button
            type="submit"
            className={`w-full py-3 mt-6 ${loading ? 'bg-gray-400' : 'bg-[#F4A261] hover:bg-[#E07B5D]'} text-black font-semibold rounded-md transition`}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <button onClick={openSignupModal} className="text-[#F4A261] hover:text-[#E07B5D]">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
