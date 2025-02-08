'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RestaurantOwnerNavbar from '@/components/RestaurantOwnerNavbar'
import RestaurantInformation from '@/components/RestaurantInformation'
import SubscriptionPlans from '@/components/SubscriptionPlans'
import { RiRestaurantLine, RiLayoutLine, RiCalendarLine, RiVipCrownLine, RiUserLine } from 'react-icons/ri'
import { motion } from 'framer-motion'
import OwnerProfile from '@/components/OwnerProfile'

export default function RestaurantSetupDashboard() {
  const router = useRouter()
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('owner-profile')

  useEffect(() => {
    console.log('Active section changed to:', activeSection);
  }, [activeSection]);

  useEffect(() => {
    const fetchRestaurantProfile = async () => {
      const token = localStorage.getItem("restaurantOwnerToken");
      const userId = localStorage.getItem("restaurantOwnerUser");
      if (!token) {
        alert("Unauthorized! Please log in.");
        router.push('/login');
        return;
      }

      try {
        const response = await fetch("/api/restaurants", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setRestaurant(data);
        } else {
          alert("Failed to fetch restaurant profile");
        }
      } catch (error) {
        console.error("Error fetching restaurant profile:", error);
        alert("An error occurred while fetching the profile");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantProfile();
  }, [router]);

  if (loading) {
    return (
      <>
        <RestaurantOwnerNavbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      </>
    );
  }

  if (!restaurant) {
    return (
      <>
        <RestaurantOwnerNavbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-xl">No restaurant profile found</div>
        </div>
      </>
    );
  }

  return (
    <>
      <RestaurantOwnerNavbar />
      <div className="flex min-h-[calc(100vh-64px)] bg-gray-100 pt-24">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg fixed left-0 top-16 h-[calc(100vh-64px)] border-r border-gray-200">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 px-3">Dashboard</h2>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveSection('owner-profile')}
                className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                  activeSection === 'owner-profile'
                    ? 'bg-orange-50 text-orange-600 font-medium shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <RiUserLine className={`text-xl ${activeSection === 'owner-profile' ? 'text-orange-600' : 'text-gray-400'}`} />
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveSection('profile')}
                className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                  activeSection === 'profile'
                    ? 'bg-orange-50 text-orange-600 font-medium shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                type="button"
              >
                <RiRestaurantLine className={`text-xl ${activeSection === 'profile' ? 'text-orange-600' : 'text-gray-400'}`} />
                <span>Restaurant Profile</span>
              </button>
              
              <button
                onClick={() => setActiveSection('floorplan')}
                className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                  activeSection === 'floorplan'
                    ? 'bg-orange-50 text-orange-600 font-medium shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                type="button"
              >
                <RiLayoutLine className={`text-xl ${activeSection === 'floorplan' ? 'text-orange-600' : 'text-gray-400'}`} />
                <span>Floor Plan</span>
              </button>
              
              <button
                onClick={() => setActiveSection('reservation')}
                className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                  activeSection === 'reservation'
                    ? 'bg-orange-50 text-orange-600 font-medium shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <RiCalendarLine className={`text-xl ${activeSection === 'reservation' ? 'text-orange-600' : 'text-gray-400'}`} />
                <span>Reservation</span>
              </button>
              
              <button
                onClick={() => setActiveSection('subscription')}
                className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                  activeSection === 'subscription'
                    ? 'bg-orange-50 text-orange-600 font-medium shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <RiVipCrownLine className={`text-xl ${activeSection === 'subscription' ? 'text-orange-600' : 'text-gray-400'}`} />
                <span>Subscription</span>
              </button>
              
              
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64 px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            {activeSection === 'profile' && (
              <RestaurantInformation 
                restaurant={restaurant} 
                onEditClick={() => router.push('/restaurant-owner/setup/edit')}
              />
            )}
            {activeSection === 'floorplan' && (
              <div>Floor Plan Component</div>
            )}
            {activeSection === 'reservation' && (
              <div>Reservation Component</div>
            )}
            {activeSection === 'subscription' && (
              <div className="mt-4">
                <SubscriptionPlans />
              </div>
            )}
            {activeSection === 'owner-profile' && (
              <OwnerProfile />
            )}
          </motion.div>
        </div>
      </div>
    </>
  )
}
