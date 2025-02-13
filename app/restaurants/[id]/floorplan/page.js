'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import RestaurantFloorPlan from '@/components/RestaurantFloorPlan';
import { FaMapMarkerAlt, FaClock, FaPhone, FaStar, FaHome, FaShare, FaBookmark, FaUtensils } from 'react-icons/fa';
import Image from 'next/image';
import PublicFloorPlan from '@/components/PublicFloorPlan';
import { GoogleMap, Marker } from '@react-google-maps/api';

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
      <div className="min-h-screen flex items-center justify-center bg-[#141517]">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FF4F18] border-t-transparent"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#141517]">
        <Image src="/not-found.svg" alt="Not Found" width={250} height={250} />
        <h2 className="text-3xl font-bold text-[#FF4F18]">Restaurant not found</h2>
        <button 
          onClick={() => router.back()}
          className="px-8 py-3 bg-[#FF4F18] text-white rounded-lg hover:bg-[#E76F51] transition-all duration-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141517]">
      {/* Top Navigation */}
      <nav className="bg-[#1A1C1E] border-b border-[#FF4F18]/10">
        <div className="max-w-full mx-auto px-6 py-4 flex justify-between items-center">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white hover:text-[#FF4F18] transition-colors"
          >
            <FaHome className="text-xl" />
            <span className="font-medium">Home</span>
          </button>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-white/80">
              <div className="flex items-center gap-2">
                <FaStar className="text-[#FF4F18]" />
                <span>{restaurant.rating || '4.5'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-[#FF4F18]" />
                <span>{restaurant.location?.address || 'Location not available'}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 text-white hover:text-[#FF4F18] transition-colors"
              >
                <FaShare />
                <span>Share</span>
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 text-white hover:text-[#FF4F18] transition-colors"
              >
                <FaBookmark />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Restaurant Info */}
        <div className="w-[300px] bg-[#1A1C1E] p-6 border-r border-[#FF4F18]/10 overflow-y-auto">
          <h1 className="text-2xl font-bold text-white mb-6">{restaurant.restaurantName}</h1>
          
          {/* Quick Actions */}
          <div className="mb-6 space-y-3">
            <button className="w-full bg-[#FF4F18] text-white rounded-lg py-3 hover:bg-[#E76F51] transition-colors">
              Make a Reservation
            </button>
            <button className="w-full bg-[#1A1C1E] text-[#FF4F18] border border-[#FF4F18] rounded-lg py-3 hover:bg-[#FF4F18]/10 transition-colors">
              View Menu
            </button>
          </div>

          {/* Restaurant Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 text-white mb-2">
                <FaClock className="text-[#FF4F18]" />
                <span className="font-medium">Opening Hours</span>
              </div>
              <p className="text-gray-400 pl-8">
                {formatOpeningHours(restaurant.openingHours)}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 text-white mb-2">
                <FaPhone className="text-[#FF4F18]" />
                <span className="font-medium">Contact</span>
              </div>
              <p className="text-gray-400 pl-8">
                {restaurant.phone || 'Contact not available'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Panel - Floor Plan and Map */}
        <div className="flex-1 p-6 bg-[#141517] overflow-y-auto">
          {/* Floor Plan */}
          <div className="h-[70vh] mb-6 bg-[#1A1C1E] rounded-lg overflow-hidden">
            {restaurant.floorplanData ? (
              <div className="w-full h-full relative">
                <PublicFloorPlan 
                  floorplanData={restaurant.floorplanData}
                  style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center">
                <FaUtensils className="text-4xl text-[#FF4F18] mb-4" />
                <p className="text-gray-400">Floor plan is not available</p>
              </div>
            )}
          </div>

          {/* Map Section */}
          {restaurant.location?.coordinates && (
            <div className="h-[20vh] bg-[#1A1C1E] rounded-lg overflow-hidden">
              <div className="h-full flex">
                <div className="w-[300px] p-6 border-r border-[#FF4F18]/10">
                  <div className="flex items-center gap-3 text-white mb-2">
                    <FaMapMarkerAlt className="text-[#FF4F18]" />
                    <span className="font-medium">Location</span>
                  </div>
                  <p className="text-gray-400">
                    {restaurant.location.address}
                  </p>
                </div>
                <div className="flex-1">
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={restaurant.location.coordinates}
                    zoom={15}
                  >
                    <Marker position={restaurant.location.coordinates} />
                  </GoogleMap>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 