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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FF4F18] border-t-transparent"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white">
        <Image src="/not-found.svg" alt="Not Found" width={250} height={250} />
        <h2 className="text-3xl font-bold text-[#141517]">Restaurant not found</h2>
        <button 
          onClick={() => router.back()}
          className="px-8 py-3 bg-[#FF4F18] text-white rounded-lg hover:bg-[#FF4F18]/90 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-lg bg-white/80">
        <div className="max-w-full mx-auto px-6 py-4 flex justify-between items-center">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-700 hover:text-[#FF4F18] transition-colors"
          >
            <FaHome className="text-xl" />
            <span className="font-medium">Home</span>
          </button>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-gray-600">
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
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-[#FF4F18] transition-colors"
              >
                <FaShare />
                <span>Share</span>
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF4F18] text-white rounded-lg hover:bg-[#FF4F18]/90 transition-all shadow-md hover:shadow-lg"
              >
                <FaBookmark />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with Glass Effect */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Restaurant Info */}
        <div className="w-[400px] bg-white/80 backdrop-blur-sm p-6 border-r border-gray-100 overflow-y-auto shadow-lg">
          <h1 className="text-2xl font-bold text-[#141517] mb-6">{restaurant.restaurantName}</h1>
          
          {/* Quick Actions */}
          <div className="mb-6 space-y-3">
            <button className="w-full bg-[#FF4F18] text-white rounded-lg py-3 hover:bg-[#FF4F18]/90 transition-all shadow-md hover:shadow-lg">
              Make a Reservation
            </button>
            <button className="w-full bg-white text-[#FF4F18] border-2 border-[#FF4F18] rounded-lg py-3 hover:bg-[#FF4F18]/5 transition-all">
              View Menu
            </button>
          </div>

          {/* Restaurant Details with Cards */}
          <div className="space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 text-[#141517] mb-2">
                <FaUtensils className="text-[#FF4F18]" />
                <span className="font-medium">About</span>
              </div>
              <p className="text-gray-600 pl-8">
                {restaurant.description || 'No description available'}
              </p>
            </div>

            {/* Hours Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 text-[#141517] mb-2">
                <FaClock className="text-[#FF4F18]" />
                <span className="font-medium">Opening Hours</span>
              </div>
              <p className="text-gray-600 pl-8 whitespace-pre-line">
                {formatOpeningHours(restaurant.openingHours)}
              </p>
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 text-[#141517] mb-2">
                <FaPhone className="text-[#FF4F18]" />
                <span className="font-medium">Contact</span>
              </div>
              <p className="text-gray-600 pl-8">
                {restaurant.phone || 'Contact not available'}
              </p>
            </div>

            {/* Map Card */}
            {restaurant.location?.coordinates && (
              <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 text-[#141517] mb-2">
                  <FaMapMarkerAlt className="text-[#FF4F18]" />
                  <span className="font-medium">Location</span>
                </div>
                <p className="text-gray-600 pl-8 mb-3">
                  {restaurant.location.address}
                </p>
                <div className="h-[200px] rounded-lg overflow-hidden">
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={restaurant.location.coordinates}
                    zoom={15}
                  >
                    <Marker position={restaurant.location.coordinates} />
                  </GoogleMap>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Panel - Floor Plan */}
        <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          <div className="h-[calc(100vh-120px)] bg-white rounded-xl shadow-lg overflow-hidden">
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
                <p className="text-gray-500">Floor plan is not available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 