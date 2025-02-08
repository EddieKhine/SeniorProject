'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RestaurantOwnerNavbar from '@/components/RestaurantOwnerNavbar'

export default function RestaurantSetupDashboard() {
  const router = useRouter()
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)

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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-8 text-black">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Restaurant Profile</h1>
            
            <div className="space-y-8 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Restaurant Name</h3>
                  <p className="text-lg">{restaurant.restaurantName}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Cuisine Type</h3>
                  <p className="text-lg">{restaurant.cuisineType}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Location</h3>
                <p className="text-lg">{restaurant.location}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-lg">{restaurant.description}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Opening Hours</h3>
                <div className="space-y-4">
                  {Object.entries(restaurant.openingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4">
                      <span className="w-28 text-sm font-medium capitalize">{day}</span>
                      <span className="text-lg">
                        {hours.open} - {hours.close}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => router.push('/restaurant-owner/setup/edit')}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-[1.02]"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
