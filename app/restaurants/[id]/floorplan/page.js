'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RestaurantFloorPlan from '@/components/RestaurantFloorPlan';
import { use } from 'react';
import { FaMapMarkerAlt, FaClock, FaPhone, FaStar, FaHome, FaShare, FaBookmark } from 'react-icons/fa';
import Image from 'next/image';

export default function RestaurantFloorplanPage({ params }) {
  const restaurantId = use(params).id;
  const [restaurant, setRestaurant] = useState(null);
  const [floorplanId, setFloorplanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchRestaurantAndFloorplan = async () => {
      try {
        const response = await fetch(`/api/restaurants/${restaurantId}/public-floorplan`);
        if (!response.ok) throw new Error('Failed to fetch restaurant');
        
        const data = await response.json();
        setRestaurant(data);
        if (data.floorplanId) {
          setFloorplanId(data.floorplanId);
        }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!restaurant || !floorplanId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Image src="/not-found.svg" alt="Not Found" width={200} height={200} />
        <h2 className="text-2xl font-bold text-gray-800">
          {!restaurant ? "Restaurant not found" : "No floor plan available"}
        </h2>
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
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors"
          >
            <FaHome className="text-xl" />
            <span className="font-medium">Home</span>
          </button>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleShare}
              className="p-2 text-gray-600 hover:text-orange-500 transition-colors"
              title="Share"
            >
              <FaShare />
            </button>
            <button
              onClick={handleSave}
              className={`p-2 transition-colors ${isSaved ? 'text-orange-500' : 'text-gray-600 hover:text-orange-500'}`}
              title="Save to favorites"
            >
              <FaBookmark />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-64 bg-gradient-to-r from-orange-400 to-red-500">
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-8 left-8 right-8">
          <h1 className="text-4xl font-bold text-white mb-2">{restaurant.restaurantName}</h1>
          <div className="flex items-center gap-4 text-white/90">
            <span className="flex items-center gap-1">
              <FaStar className="text-yellow-400" />
              {restaurant.rating || '4.5'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FaMapMarkerAlt />
              {restaurant.location || 'Location'}
            </span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Restaurant Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Restaurant Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FaClock className="text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Opening Hours</p>
                    <p className="font-medium">{restaurant.openingHours || '9:00 AM - 10:00 PM'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaPhone className="text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <p className="font-medium">{restaurant.phone || 'Contact number'}</p>
                  </div>
                </div>
              </div>
            </div>

            {restaurant.description && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">About</h2>
                <p className="text-gray-600">{restaurant.description}</p>
              </div>
            )}

            {/* New Features */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button 
                  className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  onClick={() => {/* Add reservation logic */}}
                >
                  Make a Reservation
                </button>
                <button 
                  className="w-full py-3 border border-orange-500 text-orange-500 rounded-lg 
                           hover:bg-orange-50 transition-colors"
                  onClick={() => {/* Add menu view logic */}}
                >
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
              <RestaurantFloorPlan 
                restaurantId={restaurantId}
                floorplanId={floorplanId}
                isCustomerView={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 