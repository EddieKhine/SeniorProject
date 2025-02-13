'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RestaurantOwnerNavbar from '@/components/RestaurantOwnerNavbar'
import RestaurantInformation from '@/components/RestaurantInformation'
import RestaurantProfileForm from '@/components/RestaurantProfileForm'
import SubscriptionPlans from '@/components/SubscriptionPlans'
import { RiRestaurantLine, RiLayoutLine, RiCalendarLine, RiVipCrownLine, RiUserLine } from 'react-icons/ri'
import { motion } from 'framer-motion'
import OwnerProfile from '@/components/OwnerProfile'
import RestaurantFloorPlan from '@/components/RestaurantFloorPlan'

const RESTAURANT_CATEGORIES = [
  "Buffet",
  "Cafe",
  "Casual Dining",
  "Fine Dining",
  "BBQ",
  "Fast Food",
  "Seafood",
  "Steakhouse",
  "Italian",
  "Japanese",
  "Thai",
  "Chinese",
  "Indian",
  "Mexican",
  "Vegetarian",
  "Food Court",
  "Bistro",
  "Pub & Bar",
  "Food Truck"
];

export default function RestaurantSetupDashboard() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('owner-profile')
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [floorplan, setFloorplan] = useState(null)
  const [token, setToken] = useState(null)

  const fetchRestaurantProfiles = async () => {
    try {
      const storedToken = localStorage.getItem("restaurantOwnerToken");
      const response = await fetch("/api/restaurants", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRestaurants(data.restaurants);
        if (data.restaurants.length > 0) {
          setSelectedRestaurant(data.restaurants[0]);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("restaurantOwnerToken");
    if (!storedToken) {
      router.push('/restaurant-owner/login');
      return;
    }
    setToken(storedToken);

    fetchRestaurantProfiles();
  }, [router]);

  const fetchFloorplan = async () => {
    if (!selectedRestaurant?.floorplanId) return;

    try {
      const response = await fetch(`/api/scenes/${selectedRestaurant.floorplanId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFloorplan(data);
      }
    } catch (error) {
      console.error("Error fetching floorplan:", error);
    }
  };

  useEffect(() => {
    if (selectedRestaurant?.floorplanId && activeSection === 'floorplan') {
      fetchFloorplan();
    }
  }, [selectedRestaurant, activeSection, token]);

  const handleCreateNewRestaurant = () => {
    setIsCreatingNew(true);
  };

  const handleFormSuccess = (newRestaurant) => {
    setRestaurants(prev => [...prev, newRestaurant]);
    setSelectedRestaurant(newRestaurant);
    setIsCreatingNew(false);
    // Fetch updated list of restaurants
    fetchRestaurantProfiles();
  };

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

  if (!restaurants.length) {
    return (
      <>
        <RestaurantOwnerNavbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-xl">No restaurants found</div>
        </div>
      </>
    );
  }

  return (
    <>
      <RestaurantOwnerNavbar />
      <div className="flex min-h-[calc(100vh-64px)] bg-gradient-to-b from-[#FFFFFF] to-[#F8FAFC]">
        {/* Sidebar */}
        <div className="w-64 bg-white/95 backdrop-blur-lg shadow-lg fixed left-0 top-20 h-[calc(100vh-80px)] border-r border-[#F2F4F7] mt-4 rounded-r-2xl">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-[#141517] mb-6 px-3">Dashboard</h2>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveSection('owner-profile')}
                className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                  activeSection === 'owner-profile'
                    ? 'bg-[#FF4F18] text-white font-medium shadow-lg'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#141517]'
                }`}
              >
                <RiUserLine className={`text-xl ${activeSection === 'owner-profile' ? 'text-white' : 'text-[#64748B]'}`} />
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveSection('profile')}
                className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                  activeSection === 'profile'
                    ? 'bg-[#FF4F18] text-white font-medium shadow-lg'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#141517]'
                }`}
                type="button"
              >
                <RiRestaurantLine className={`text-xl ${activeSection === 'profile' ? 'text-white' : 'text-[#64748B]'}`} />
                <span>Restaurant Profile</span>
              </button>
              
              <button
                onClick={() => setActiveSection('floorplan')}
                className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                  activeSection === 'floorplan'
                    ? 'bg-[#FF4F18] text-white font-medium shadow-lg'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#141517]'
                }`}
                type="button"
              >
                <RiLayoutLine className={`text-xl ${activeSection === 'floorplan' ? 'text-white' : 'text-[#64748B]'}`} />
                <span>Floor Plan</span>
              </button>
              
              <button
                onClick={() => setActiveSection('reservation')}
                className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                  activeSection === 'reservation'
                    ? 'bg-[#FF4F18] text-white font-medium shadow-lg'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#141517]'
                }`}
              >
                <RiCalendarLine className={`text-xl ${activeSection === 'reservation' ? 'text-white' : 'text-[#64748B]'}`} />
                <span>Reservation</span>
              </button>
              
              <button
                onClick={() => setActiveSection('subscription')}
                className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                  activeSection === 'subscription'
                    ? 'bg-[#FF4F18] text-white font-medium shadow-lg'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#141517]'
                }`}
              >
                <RiVipCrownLine className={`text-xl ${activeSection === 'subscription' ? 'text-white' : 'text-[#64748B]'}`} />
                <span>Subscription</span>
              </button>
              
              
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64 px-8 mt-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            {activeSection === 'profile' && (
              <div className="space-y-6">
                {/* Restaurant Profile Selector */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-[#F2F4F7] mb-6">
                  <h2 className="text-xl font-semibold text-[#141517] mb-4">Your Restaurant Profiles</h2>
                  <div className="flex flex-wrap gap-4">
                    {restaurants.map((rest) => (
                      <button
                        key={rest._id}
                        onClick={() => setSelectedRestaurant(rest)}
                        className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                          selectedRestaurant?._id === rest._id
                            ? 'bg-[#FF4F18] text-white'
                            : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F2F4F7] hover:text-[#141517] border border-[#E2E8F0]'
                        }`}
                      >
                        {rest.restaurantName}
                      </button>
                    ))}
                    <button
                      onClick={handleCreateNewRestaurant}
                      className="px-4 py-2 rounded-lg bg-[#FF4F18] text-white hover:opacity-90 transition-all duration-200 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add New Restaurant
                    </button>
                  </div>
                </div>

                {/* Restaurant Form or Information */}
                {isCreatingNew ? (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-[#F2F4F7]">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-[#141517]">Create New Restaurant</h2>
                      <button 
                        onClick={() => setIsCreatingNew(false)}
                        className="text-[#64748B] hover:text-[#141517]"
                      >
                        Cancel
                      </button>
                    </div>
                    <RestaurantProfileForm 
                      mode="create"
                      onSubmitSuccess={handleFormSuccess}
                      authToken={localStorage.getItem("restaurantOwnerToken")}
                      onProfileSubmit={() => {
                        setIsCreatingNew(false);
                        fetchRestaurantProfiles();
                      }}
                    />
                  </div>
                ) : (
                  selectedRestaurant && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-[#F2F4F7]">
                      <RestaurantInformation 
                        restaurant={selectedRestaurant}
                        onEditClick={(updatedRestaurant) => {
                          setRestaurants(prev => 
                            prev.map(r => r._id === updatedRestaurant._id ? updatedRestaurant : r)
                          );
                          setSelectedRestaurant(updatedRestaurant);
                        }}
                        onUpdateSuccess={fetchRestaurantProfiles}
                      />
                    </div>
                  )
                )}
              </div>
            )}
            {activeSection === 'floorplan' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-[#F2F4F7]">
                {selectedRestaurant ? (
                  <RestaurantFloorPlan 
                    token={token}
                    restaurantId={selectedRestaurant._id}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[#64748B]">No restaurant selected.</p>
                  </div>
                )}
              </div>
            )}
            {activeSection === 'reservation' && (
              <div>Reservation Component</div>
            )}
            {activeSection === 'subscription' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-[#F2F4F7] mt-4">
                <SubscriptionPlans />
              </div>
            )}
            {activeSection === 'owner-profile' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-[#F2F4F7]">
                <OwnerProfile />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  )
}
