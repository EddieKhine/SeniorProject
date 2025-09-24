'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RestaurantInformation from '@/components/RestaurantInformation'
import RestaurantProfileForm from '@/components/RestaurantProfileForm'
import SubscriptionManagement from '@/components/SubscriptionManagement'
import { RiRestaurantLine, RiLayoutLine, RiCalendarLine, RiVipCrownLine, RiUserLine, RiMessage2Line, RiTeamLine, RiBarChartLine } from 'react-icons/ri'
import { motion } from 'framer-motion'
import OwnerProfile from '@/components/OwnerProfile'
import RestaurantFloorPlan from '@/components/RestaurantFloorPlan'
import RestaurantOwnerChat from '@/components/RestaurantOwnerChat'
import RestaurantBookingManager from '@/components/RestaurantBookingManager'
import RestaurantReservation from '@/components/RestaurantReservation'
import StaffManagement from '@/components/StaffManagement'
import Link from 'next/link'
import Image from 'next/image'
import { FaHome, FaSignOutAlt } from 'react-icons/fa'

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
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('owner-profile')
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [floorplan, setFloorplan] = useState(null)
  const [token, setToken] = useState(null)
  const [restaurantId, setRestaurantId] = useState(null)
  const [activeTab, setActiveTab] = useState('list')
  const [isFloorplanLoading, setIsFloorplanLoading] = useState(false)

  const fetchRestaurantProfile = async () => {
    try {
      const storedToken = localStorage.getItem("restaurantOwnerToken");
      const response = await fetch("/api/restaurants", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRestaurant(data.restaurant);
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

    // Get restaurant owner data
    const ownerData = localStorage.getItem('restaurantOwnerUser');
    if (ownerData) {
      const { userId } = JSON.parse(ownerData);
      setRestaurantId(userId);
    }

    fetchRestaurantProfile();
  }, [router]);

  const fetchFloorplan = async () => {
    if (!restaurant?.floorplanId) return;

    try {
      setIsFloorplanLoading(true);
      const response = await fetch(`/api/scenes/${restaurant.floorplanId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFloorplan(data.data);
      }
    } catch (error) {
      console.error("Error fetching floorplan:", error);
    } finally {
      setIsFloorplanLoading(false);
    }
  };

  useEffect(() => {
    if (restaurant?.floorplanId) {
      if (activeSection === 'floorplan' || (activeSection === 'reservation' && activeTab === 'book')) {
        fetchFloorplan();
      }
    }
  }, [restaurant, activeSection, token, activeTab]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("restaurantOwnerUser");
      localStorage.removeItem("restaurantOwnerToken");
      localStorage.removeItem("restaurantData");
      router.push("/restaurant-owner");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'book' && !floorplan && restaurant?.floorplanId) {
      fetchFloorplan();
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Sidebar */}
      <div className="w-72 bg-white/80 backdrop-blur-lg shadow-lg fixed left-0 top-0 h-screen border-r border-gray-100">
        <div className="p-6 flex flex-col h-full">
          {/* Logo or Brand Name */}
          <div className="mb-8">
            <Link href="/restaurant-owner" className="flex items-center space-x-3">
              <Image
                src="/images/FoodLoft_Logo-02.png"
                alt="FoodLoft Logo"
                width={130}
                height={40}
                className="h-auto w-auto"
                priority
              />
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-2">
            <button
              onClick={() => setActiveSection('owner-profile')}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                activeSection === 'owner-profile'
                  ? 'bg-[#FF4F18] text-white font-medium shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#FF4F18]'
              }`}
            >
              <RiUserLine className="text-xl" />
              <span className="text-sm">Profile</span>
            </button>

            <button
              onClick={() => setActiveSection('profile')}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                activeSection === 'profile'
                  ? 'bg-[#FF4F18] text-white font-medium shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#FF4F18]'
              }`}
              type="button"
            >
              <RiRestaurantLine className="text-xl" />
              <span className="text-sm">Restaurant Profile</span>
            </button>
            
            <button
              onClick={() => setActiveSection('floorplan')}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                activeSection === 'floorplan'
                  ? 'bg-[#FF4F18] text-white font-medium shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#FF4F18]'
              }`}
              type="button"
            >
              <RiLayoutLine className="text-xl" />
              <span className="text-sm">Floor Plan</span>
            </button>
            
            <button
              onClick={() => setActiveSection('reservation')}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                activeSection === 'reservation'
                  ? 'bg-[#FF4F18] text-white font-medium shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#FF4F18]'
              }`}
            >
              <RiCalendarLine className="text-xl" />
              <span className="text-sm">Reservation</span>
            </button>
            
            <button
              onClick={() => setActiveSection('subscription-management')}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                activeSection === 'subscription-management'
                  ? 'bg-[#FF4F18] text-white font-medium shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#FF4F18]'
              }`}
            >
              <RiVipCrownLine className="text-xl" />
              <span className="text-sm">Subscription & Usage</span>
            </button>
            
            <button
              onClick={() => setActiveSection('staff')}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                activeSection === 'staff'
                  ? 'bg-[#FF4F18] text-white font-medium shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#FF4F18]'
              }`}
            >
              <RiTeamLine className="text-xl" />
              <span className="text-sm">Staff Management</span>
            </button>
            
            <button
              onClick={() => setActiveSection('messages')}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                activeSection === 'messages'
                  ? 'bg-[#FF4F18] text-white font-medium shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#FF4F18]'
              }`}
            >
              <RiMessage2Line className="text-xl" />
              <span className="text-sm">Messages</span>
            </button>
            <Link
              href="/restaurant-owner"
              className="flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200
                text-gray-600 hover:bg-gray-50 hover:text-[#FF4F18]"
            >
              <FaHome className="text-xl" />
              <span className="text-sm">Home</span>
            </Link>

            {/* Sign Out Button at Bottom */}
            <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full p-3 rounded-lg text-red-500 hover:bg-red-50 transition-all duration-200"
              >
                <FaSignOutAlt className="text-xl" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-72 p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-800">
              {activeSection === 'owner-profile' && 'Owner Profile'}
              {activeSection === 'profile' && 'Restaurant Profile'}
              {activeSection === 'floorplan' && 'Floor Plan'}
              {activeSection === 'reservation' && 'Reservations'}
              {activeSection === 'subscription-management' && 'Subscription & Usage'}
              {activeSection === 'staff' && 'Staff Management'}
              {activeSection === 'messages' && 'Messages'}
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your restaurant settings and information
            </p>
          </div>

          {/* Content Sections */}
          {activeSection === 'profile' && (
            <div className="space-y-6">
              {!restaurant && !isCreatingNew ? (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Create Your Restaurant Profile
                  </h2>
                  <button
                    onClick={() => setIsCreatingNew(true)}
                    className="px-4 py-2 rounded-lg bg-[#FF4F18] text-white hover:bg-[#FF4F18]/90 
                             transition-all duration-200 flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Create Restaurant Profile
                  </button>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-[#F2F4F7]">
                  {isCreatingNew ? (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-[#141517]">
                          Create Restaurant Profile
                        </h2>
                        <button 
                          onClick={() => setIsCreatingNew(false)}
                          className="text-[#64748B] hover:text-[#141517]"
                        >
                          Cancel
                        </button>
                      </div>
                      <RestaurantProfileForm 
                        mode="create"
                        initialData={null}
                        onSubmitSuccess={(newRestaurant) => {
                          console.log('Create success:', newRestaurant);
                          setRestaurant(newRestaurant);
                          setIsCreatingNew(false);
                        }}
                        onCancel={() => setIsCreatingNew(false)}
                      />
                    </div>
                  ) : (
                    <RestaurantInformation 
                      restaurant={restaurant}
                      onEditClick={(updatedRestaurant) => {
                        console.log('Edit click:', updatedRestaurant);
                        setRestaurant(updatedRestaurant);
                      }}
                      onUpdateSuccess={(updatedRestaurant) => {
                        console.log('Update success:', updatedRestaurant);
                        setRestaurant(updatedRestaurant);
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )}
          {activeSection === 'floorplan' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#F2F4F7]">
              {restaurant ? (
                <RestaurantFloorPlan 
                  token={token}
                  restaurantId={restaurant._id}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#64748B]">No restaurant selected.</p>
                </div>
              )}
            </div>
          )}
          {activeSection === 'reservation' && (
            <div className="bg-white rounded-xl shadow-sm border border-[#F2F4F7] h-[calc(100vh-120px)]">
              {restaurant ? (
                <div className="h-full flex flex-col">
                  {/* Tab Navigation */}
                  <div className="border-b border-[#F2F4F7]">
                    <div className="flex space-x-4 px-6 py-4">
                      <button
                        onClick={() => handleTabChange('list')}
                        className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                          activeTab === 'list'
                            ? 'bg-[#FF4F18] text-white font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-[#FF4F18]'
                        }`}
                      >
                        Reservation List
                      </button>
                      <button
                        onClick={() => handleTabChange('book')}
                        className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                          activeTab === 'book'
                            ? 'bg-[#FF4F18] text-white font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-[#FF4F18]'
                        }`}
                      >
                        Booking Manager
                      </button>
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-hidden">
                    {activeTab === 'list' ? (
                      <RestaurantReservation restaurantId={restaurant._id} />
                    ) : isFloorplanLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#FF4F18] border-t-transparent"></div>
                        <p className="ml-3 text-gray-600">Loading floorplan...</p>
                      </div>
                    ) : (
                      <RestaurantBookingManager 
                        restaurantId={restaurant._id} 
                        floorplanData={floorplan}
                        floorplanId={restaurant.floorplanId}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#64748B]">Please create a restaurant profile first</p>
                </div>
              )}
            </div>
          )}
          {activeSection === 'subscription-management' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#F2F4F7] mt-4">
              <SubscriptionManagement ownerId={restaurantId} />
            </div>
          )}
          {activeSection === 'owner-profile' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#F2F4F7]">
              <OwnerProfile />
            </div>
          )}
          {activeSection === 'staff' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#F2F4F7]">
              <StaffManagement restaurantId={restaurant?._id} />
            </div>
          )}
          {activeSection === 'messages' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#F2F4F7]">
              <RestaurantOwnerChat restaurantId={restaurantId} />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
