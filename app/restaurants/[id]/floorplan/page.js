'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import RestaurantFloorPlan from '@/components/RestaurantFloorPlan';
import { FaMapMarkerAlt, FaClock, FaPhone, FaStar, FaHome, FaShare, FaBookmark, FaUtensils } from 'react-icons/fa';
import Image from 'next/image';
import PublicFloorPlan from '@/components/PublicFloorPlan';

export default function RestaurantFloorplanPage({ params }) {
  const restaurantId = use(params).id;
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchRestaurantAndFloorplan = async () => {
      try {
        console.log('Fetching restaurant data for ID:', restaurantId);
        const response = await fetch(`/api/restaurants/${restaurantId}/public-floorplan`);
        if (!response.ok) {
          console.error('Failed to fetch restaurant:', response.status);
          throw new Error('Failed to fetch restaurant');
        }
        
        const data = await response.json();
        console.log('Received restaurant data:', data);
        
        if (!data.floorplanId) {
          console.warn('No floorplan ID in restaurant data');
        }
        
        setRestaurant(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchRestaurantAndFloorplan();
    }
  }, [restaurantId]);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: restaurant.restaurantName,
        text: `Check out ${restaurant.restaurantName} on our platform!`,
        url: window.location.href,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    // Add logic to save to user's favorites
  };

  // Format opening hours for display
  const formatOpeningHours = (hours) => {
    if (!hours) return 'Hours not available';
    
    // Get current day
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Format a single day's hours
    const formatDayHours = (dayHours) => {
      if (!dayHours || !dayHours.open || !dayHours.close) return 'Closed';
      return `${dayHours.open} - ${dayHours.close}`;
    };

    // Convert long weekday name to match your schema
    const getDayKey = (day) => {
      const dayMap = {
        'sunday': 'sunday',
        'monday': 'monday',
        'tuesday': 'tuesday',
        'wednesday': 'wednesday',
        'thursday': 'thursday',
        'friday': 'friday',
        'saturday': 'saturday'
      };
      return dayMap[day];
    };

    // If we want to show today's hours
    const dayKey = getDayKey(today);
    if (hours[dayKey]) {
      return `Today: ${formatDayHours(hours[dayKey])}`;
    }

    // Show all days
    return Object.entries(hours)
      .map(([day, hours]) => {
        const formattedDay = day.charAt(0).toUpperCase() + day.slice(1);
        return `${formattedDay}: ${formatDayHours(hours)}`;
      })
      .join('\n');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <Image src="/not-found.svg" alt="Not Found" width={200} height={200} />
        <h2 className="text-2xl font-bold text-gray-800">Restaurant not found</h2>
        <button 
          onClick={() => router.back()}
          className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors"
          >
            <FaHome className="text-xl" />
            <span>Back to Home</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Restaurant Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {restaurant.restaurantName}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="flex items-center gap-1">
                  <FaStar className="text-yellow-400" />
                  {restaurant.rating || '4.5'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <FaMapMarkerAlt className="text-orange-500" />
                  {restaurant.location || 'Location not available'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`p-2 rounded-full transition-colors ${
                isSaved ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'
              }`}
            >
              <FaBookmark className="text-2xl" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="space-y-6">
            {/* Restaurant Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Restaurant Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FaClock className="text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-500">Opening Hours</p>
                    <p className="font-medium whitespace-pre-line">
                      {formatOpeningHours(restaurant.openingHours)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaPhone className="text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-500">Contact</p>
                    <p className="font-medium">{restaurant.phone || 'Contact not available'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaUtensils className="text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-500">Cuisine</p>
                    <p className="font-medium">{restaurant.cuisine || 'Various Cuisines'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                  Make a Reservation
                </button>
                <button className="w-full py-3 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition-colors">
                  View Menu
                </button>
              </div>
            </div>
          </div>

          {/* Floor Plan */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Interactive Floor Plan</h2>
              <p className="text-gray-600 mb-6">
                Explore our restaurant layout and choose your preferred seating
              </p>
              {restaurant.floorplanData ? (
                <div className="min-h-[500px] relative">
                  <PublicFloorPlan floorplanData={restaurant.floorplanData} />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Floor plan is not available for this restaurant
                </div>
              )}
              {/* Debug information */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
                <p>Debug Info:</p>
                <p>Restaurant ID: {restaurantId}</p>
                <p>Floorplan ID: {restaurant.floorplanId || 'Not available'}</p>
                <p>Objects in floorplan: {restaurant.floorplanData?.objects?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 