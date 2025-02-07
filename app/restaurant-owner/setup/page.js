"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaUtensils, FaMapMarkerAlt, FaChair, FaChartLine, FaRocket } from "react-icons/fa";
import RestaurantProfileForm from "@/components/RestaurantProfileForm";
import RestaurantOwnerNavbar from "@/components/RestaurantOwnerNavbar";

export default function RestaurantOwnerOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    // Check for authentication
    const token = localStorage.getItem('restaurantOwnerToken');
    const user = localStorage.getItem('restaurantOwnerUser');

    if (!token || !user) {
      // Redirect to login if not authenticated
      router.push('/restaurant-owner');
    } else {
      // Set the token in state
      setAuthToken(token);
    }

    setIsLoading(false);
  }, [router]);

  const steps = [
    { id: 1, title: "Welcome", icon: FaUtensils, description: "Get started with FoodLoft" },
    { id: 2, title: "Profile", icon: FaMapMarkerAlt, description: "Restaurant details" },
    { id: 3, title: "Floor Plan", icon: FaChair, description: "Layout setup" },
    { id: 4, title: "Setup", icon: FaChartLine, description: "Configure settings" },
    { id: 5, title: "Launch", icon: FaRocket, description: "Go live" },
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E76F51]"></div>
      </div>
    );
  }

  return (
    <>
      <RestaurantOwnerNavbar />
      <div className="min-h-screen bg-white pt-20">
        {/* Side Progress Bar */}
        <div className="fixed left-0 top-20 h-[calc(100vh-5rem)] w-96 bg-gradient-to-b from-[#2D2522] to-[#3A2E2B] p-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-2">Restaurant Setup</h2>
            <p className="text-gray-400 text-sm">Step {step} of {steps.length}</p>
            <div className="mt-4 h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#F4A261] to-[#E76F51] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
          
          <div className="space-y-3">
            {steps.map((s) => (
              <motion.div
                key={s.id}
                className={`flex flex-col p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                  step === s.id 
                    ? 'bg-gradient-to-r from-[#F4A261] to-[#E76F51] text-[#3A2E2B] shadow-lg' 
                    : 'text-white hover:bg-white/10'
                }`}
                onClick={() => setStep(s.id)}
              >
                <div className="flex items-center">
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
                </div>
                <span className={`text-sm mt-1 ${step === s.id ? 'text-[#3A2E2B]/70' : 'text-gray-400'}`}>
                  {s.description}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="ml-96 p-12 bg-gray-50/50 min-h-[calc(100vh-5rem)]">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto"
          >
            {step === 1 && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-5xl font-bold text-[#3A2E2B] leading-tight">
                    Welcome to <span className="text-[#E76F51]">FoodLoft</span>
                  </h1>
                  <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                    Transform your restaurant management with our innovative platform. 
                    Let's create a digital presence that matches your restaurant's excellence.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-6 mt-12">
                  {[
                    { title: '3D Floor Planning', desc: 'Design your space visually' },
                    { title: 'Smart Reservations', desc: 'Automated booking management' },
                    { title: 'Real-time Analytics', desc: 'Data-driven insights' }
                  ].map((feature) => (
                    <motion.div
                      whileHover={{ y: -5 }}
                      key={feature.title}
                      className="p-6 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 border border-gray-100"
                    >
                      <h3 className="text-xl font-semibold mb-2 text-[#3A2E2B]">{feature.title}</h3>
                      <p className="text-gray-600">{feature.desc}</p>
                    </motion.div>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(2)}
                  className="mt-8 px-8 py-4 bg-gradient-to-r from-[#F4A261] to-[#E76F51] text-white rounded-xl 
                  font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Start Setup →
                </motion.button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <RestaurantProfileForm 
                  onProfileSubmit={() => setStep(3)}
                  className="text-[#3A2E2B]"
                  authToken={authToken}
                />
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Restaurant Floor Plan</h2>
                <p className="text-gray-600 mb-6">Design your restaurant's layout using our interactive 3D floor plan editor.</p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => router.push("/floorplan")}
                    className="px-6 py-3 bg-gradient-to-r from-[#F4A261] to-[#E76F51] text-white rounded-md 
                    hover:shadow-lg transition-all duration-300"
                  >
                    Open Floor Plan Editor
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="px-6 py-3 bg-white text-[#3A2E2B] border border-gray-200 rounded-md 
                    hover:bg-gray-50 transition-colors"
                  >
                    Skip for Now
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
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
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
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
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
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
