"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaUtensils, FaCheckCircle, FaChevronRight } from "react-icons/fa";

export default function RestaurantOwnerOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Static restaurant data for demo
  const restaurant = {
    name: "Delicious Bites",
    type: "Fine Dining",
    location: "123 Food Street, NYC",
    hours: "10 AM - 11 PM",
    tables: 12,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff0e5] to-[#f4a261] flex flex-col items-center text-center p-10">
      {/* Step Navigation */}
      <div className="flex space-x-4 mb-6">
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <motion.div
            key={num}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-white font-bold cursor-pointer transition ${
              step === num ? "bg-[#3A2E2B]" : "bg-gray-400"
            }`}
            onClick={() => setStep(num)}
          >
            {num}
          </motion.div>
        ))}
      </div>

      {/* Steps */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
          <h1 className="text-4xl font-bold text-[#3A2E2B] mb-6">Welcome to the Future of Restaurant Management</h1>
          <p className="text-lg text-gray-700 mb-8">
            Let's set up your restaurant and create a stunning **3D floor plan** to maximize your space efficiency.
          </p>
          <button
            onClick={() => setStep(2)}
            className="bg-[#3A2E2B] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1e1a18] transition"
          >
            Get Started
          </button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-[#3A2E2B] mb-6">Restaurant Profile</h2>
          <div className="text-left text-gray-700">
            <p><strong>Name:</strong> {restaurant.name}</p>
            <p><strong>Type:</strong> {restaurant.type}</p>
            <p><strong>Location:</strong> {restaurant.location}</p>
            <p><strong>Operating Hours:</strong> {restaurant.hours}</p>
          </div>
          <button
            onClick={() => setStep(3)}
            className="mt-6 px-6 py-3 bg-[#F4A261] text-white rounded-md hover:bg-[#d87c42]"
          >
            Next: Setup Floor Plan
          </button>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-[#3A2E2B] mb-6">Restaurant Floor Plan</h2>
          <p className="text-gray-700">Here is a static example of your floor plan.</p>
          <img src="/floorplan-demo.png" alt="Floor Plan Demo" className="rounded-lg mt-4 shadow-md" />
          <button
            onClick={() => setStep(4)}
            className="mt-6 px-6 py-3 bg-[#F4A261] text-white rounded-md hover:bg-[#d87c42]"
          >
            Next: Add Tables
          </button>
        </motion.div>
      )}

      {step === 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-[#3A2E2B] mb-6">Add Tables & Seating</h2>
          <p className="text-gray-700">You have <strong>{restaurant.tables}</strong> tables set up.</p>
          <button
            onClick={() => setStep(5)}
            className="mt-6 px-6 py-3 bg-[#F4A261] text-white rounded-md hover:bg-[#d87c42]"
          >
            Next: Dashboard
          </button>
        </motion.div>
      )}

      {step === 5 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-[#3A2E2B] mb-6">Dashboard Overview</h2>
          <p className="text-gray-700">Your restaurant is now ready to manage reservations.</p>
          <button
            onClick={() => setStep(6)}
            className="mt-6 px-6 py-3 bg-[#F4A261] text-white rounded-md hover:bg-[#d87c42]"
          >
            Next: Preview & Go Live
          </button>
        </motion.div>
      )}

      {step === 6 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-[#3A2E2B] mb-6">Preview & Go Live</h2>
          <p className="text-gray-700">Your restaurant is now visible to customers. Congratulations!</p>
          <button
            onClick={() => router.push("/owner/dashboard")}
            className="mt-6 px-6 py-3 bg-[#3A2E2B] text-white rounded-md hover:bg-[#1e1a18]"
          >
            Go to Dashboard
          </button>
        </motion.div>
      )}
    </div>
  );
}
