"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faUser, faPhone, faLock, faUtensils } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

export default function SignupModal({ isOpen, onClose, openLoginModal }) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [message, setMessage] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
  
    // Validate email format
    const isValidEmail = (email) => {
      const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return regex.test(email);
    };
  
    if (!isValidEmail(email)) {
      setMessage('Please enter a valid email address.');
      return;
    }
  
    // Ensure contact number contains only numbers
    const isValidPhone = /^[0-9]+$/.test(contactNumber);
    if (!isValidPhone) {
      setMessage('Please enter a valid contact number.');
      return;
    }
  
    const payload = { email, firstName, lastName, password, contactNumber };
    console.log('Payload:', payload);
  
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      const data = await res.json();
      console.log('Response:', data);
  
      if (!res.ok) {
        setMessage(data.message || "Signup failed");
        return;
      }
  
      setMessage("Signup successful!");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Signup error:", error);
      setMessage("An error occurred during signup.");
    }
  };

  const handleGoogleSignup = () => {
    signIn("google");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg w-[90%] max-w-[350px] shadow-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500">
          &times;
        </button>

        <div className="flex flex-col items-center mb-8">
          <FontAwesomeIcon icon={faUtensils} className="text-5xl text-[#F4A261] mb-4" />
          <h2 className="text-2xl font-bold text-center text-[#F4A261]">Welcome to FoodLoft</h2>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="relative">
            <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full pl-10 border-b border-gray-300 focus:border-[#F4A261] focus:outline-none py-3 text-black text-lg"
            />
          </div>
          <div className="relative">
            <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full pl-10 border-b border-gray-300 focus:border-[#F4A261] focus:outline-none py-3 text-black text-lg"
            />
          </div>

          <div className="relative">
            <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 border-b border-gray-300 focus:border-[#F4A261] focus:outline-none py-3 text-black text-lg"
            />
          </div>

          <div className="relative">
            <FontAwesomeIcon icon={faPhone} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Contact Number"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              required
              className="w-full pl-10 border-b border-gray-300 focus:border-[#F4A261] focus:outline-none py-3 text-black text-lg"
            />
          </div>

          <div className="relative">
            <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 border-b border-gray-300 focus:border-[#F4A261] focus:outline-none py-3 text-black text-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#F4A261] text-black font-semibold rounded-md hover:bg-[#E07B5D] transition text-lg"
          >
            Submit
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-gray-500">{message}</p>
        )}

        <div className="flex justify-center mt-6">
          <button
            onClick={handleGoogleSignup}
            className="w-full py-3 bg-white text-[#F4A261] font-semibold rounded-md shadow-md hover:bg-[#F4A261] hover:text-white transition flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faGoogle} className="mr-3" />
            Sign Up with Google
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <button onClick={openLoginModal} className="text-[#F4A261] hover:text-[#E07B5D]">
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
