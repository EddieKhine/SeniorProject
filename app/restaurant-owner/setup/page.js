"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaUtensils, FaMapMarkerAlt, FaChair, FaChartLine, FaRocket } from "react-icons/fa";
import RestaurantProfileForm from "@/components/RestaurantProfileForm";
import RestaurantOwnerNavbar from "@/components/RestaurantOwnerNavbar";

export default function RestaurantOwnerOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const steps = [
    { id: 1, title: "Welcome", icon: FaUtensils },
    { id: 2, title: "Profile", icon: FaMapMarkerAlt },
    { id: 3, title: "Floor Plan", icon: FaChair },
    { id: 4, title: "Setup", icon: FaChartLine },
    { id: 5, title: "Launch", icon: FaRocket },
  ];

  // Static restaurant data for demo
  const restaurant = {
    name: "Delicious Bites",
    type: "Fine Dining",
    location: "123 Food Street, NYC",
    hours: "10 AM - 11 PM",
    tables: 12,
  };

  const progressPercentage = (step / steps.length) * 100;

  return (
    <>
    <RestaurantOwnerNavbar />
    <div className="min-h-screen bg-white">
      {/* Side Progress Bar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-[#3A2E2B] p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Restaurant Setup</h2>
          <div className="mt-2 h-2 w-full bg-gray-700 rounded-full">
            <motion.div
              className="h-full bg-[#F4A261] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          {steps.map((s) => (
            <motion.div
              key={s.id}
              className={`flex items-center p-4 rounded-lg cursor-pointer transition-all ${
                step === s.id 
                  ? 'bg-[#F4A261] text-[#3A2E2B]' 
                  : 'text-white hover:bg-[#4a3e3b]'
              }`}
              onClick={() => setStep(s.id)}
            >
              <s.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{s.title}</span>
              {step > s.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto text-green-500"
                >
                  ✓
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="ml-80 p-12">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          {step === 1 && (
            <div className="space-y-6">
              <h1 className="text-4xl font-bold text-[#3A2E2B]">Welcome to FoodLoft</h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Transform your restaurant management with our innovative platform. 
                Let's create a digital presence that matches your restaurant's excellence.
              </p>
              <div className="grid grid-cols-3 gap-6 mt-8">
                {['3D Floor Planning', 'Smart Reservations', 'Real-time Analytics'].map((feature) => (
                  <div key={feature} className="p-6 bg-[#3A2E2B] text-white rounded-xl hover:bg-[#4a3e3b] transition-colors">
                    <h3 className="text-lg font-semibold mb-2">{feature}</h3>
                    <p className="text-gray-300">Experience the future of restaurant management</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="mt-8 px-8 py-4 bg-[#F4A261] text-[#3A2E2B] rounded-lg font-medium 
                hover:bg-[#f5b081] transition-colors shadow-lg"
              >
                Start Setup
              </button>
            </div>
          )}

          {step === 2 && (
           <RestaurantProfileForm 
           onProfileSubmit={() => setStep(3)}
           className="text-[#3A2E2B]"
         />
          )}

          {step === 3 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Restaurant Floor Plan</h2>
              <p className="text-gray-600">Here is a static example of your floor plan.</p>
              <img src="/floorplan-demo.png" alt="Floor Plan Demo" className="rounded-lg mt-4 shadow-md" />
              <button
                onClick={() => setStep(4)}
                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Next: Add Tables
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Add Tables & Seating</h2>
              <p className="text-gray-600">You have <strong>{restaurant.tables}</strong> tables set up.</p>
              <button
                onClick={() => setStep(5)}
                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Next: Dashboard
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
              <p className="text-gray-600">Your restaurant is now ready to manage reservations.</p>
              <button
                onClick={() => setStep(6)}
                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Next: Preview & Go Live
              </button>
            </div>
          )}

          {step === 6 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Preview & Go Live</h2>
              <p className="text-gray-600">Your restaurant is now visible to customers. Congratulations!</p>
              <button
                onClick={() => router.push("/owner/dashboard")}
                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
    </>
  );
}
