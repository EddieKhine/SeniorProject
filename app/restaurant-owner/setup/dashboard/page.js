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

export default function RestaurantSetupDashboard() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('owner-profile')
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [floorplan, setFloorplan] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const storedToken = localStorage.getItem("restaurantOwnerToken");
    if (!storedToken) {
      router.push('/restaurant-owner/login');
      return;
    }
    setToken(storedToken);

    const fetchRestaurantProfiles = async () => {
      try {
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
              <div className="space-y-6">
                {/* Restaurant Profile Selector */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                  <h2 className="text-xl font-semibold text-[#3A2E2B] mb-4">Your Restaurant Profiles</h2>
                  <div className="flex flex-wrap gap-4">
                    {restaurants.map((rest) => (
                      <button
                        key={rest._id}
                        onClick={() => setSelectedRestaurant(rest)}
                        className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                          selectedRestaurant?._id === rest._id
                            ? 'bg-[#F4A261] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {rest.restaurantName}
                      </button>
                    ))}
                    <button
                      onClick={handleCreateNewRestaurant}
                      className="px-4 py-2 rounded-lg bg-[#E76F51] text-white hover:bg-[#E76F51]/90 transition-all duration-200 flex items-center gap-2"
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
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Create New Restaurant</h2>
                      <button 
                        onClick={() => setIsCreatingNew(false)}
                        className="text-gray-600 hover:text-gray-800"
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
                    <RestaurantInformation 
                      restaurant={selectedRestaurant}
                      onEditClick={(updatedRestaurant) => {
                        setRestaurants(prev => 
                          prev.map(r => r._id === updatedRestaurant._id ? updatedRestaurant : r)
                        );
                        setSelectedRestaurant(updatedRestaurant);
                        fetchRestaurantProfiles(); // Refresh the list after update
                      }}
                    />
                  )
                )}
              </div>
            )}
            {activeSection === 'floorplan' && (
              <div>
                {selectedRestaurant ? (
                  <RestaurantFloorPlan 
                    token={token}
                    restaurantId={selectedRestaurant._id}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="mb-4">No restaurant selected.</p>
                  </div>
                )}
              </div>
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
