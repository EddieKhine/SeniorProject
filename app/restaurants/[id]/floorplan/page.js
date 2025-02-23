'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import RestaurantFloorPlan from '@/components/RestaurantFloorPlan';
import { FaMapMarkerAlt, FaClock, FaPhone, FaStar, FaHome, FaShare, FaBookmark, FaUtensils, FaComments } from 'react-icons/fa';
import Image from 'next/image';
import PublicFloorPlan from '@/components/PublicFloorPlan';
import { GoogleMap, Marker } from '@react-google-maps/api';
import ReviewSection from '@/components/ReviewSection';
import CustomerChat from '@/components/CustomerChat';
import { MdRestaurantMenu } from 'react-icons/md';

export default function RestaurantFloorplanPage({ params }) {
  const restaurantId = use(params).id;
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [showChat, setShowChat] = useState(false);
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
        console.log('DEBUG - Full restaurant data:', data);
        console.log('DEBUG - Images object:', data.images);
        console.log('DEBUG - Menu images array:', data.images?.menu);
        console.log('DEBUG - Number of menu images:', data.images?.menu?.length || 0);
        
        // Ensure menu images is always an array
        if (data.images && !Array.isArray(data.images.menu)) {
          data.images.menu = data.images.menu ? [data.images.menu] : [];
        }
        
        setRestaurant(data);
      } catch (error) {
        console.error('Error fetching restaurant data:', error);
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

  // Add a separate function to render menu section with debugging
  const renderMenuSection = () => {
    console.log('DEBUG - Rendering menu section');
    console.log('DEBUG - Current restaurant state:', restaurant);
    console.log('DEBUG - Menu images in state:', restaurant?.images?.menu);
    console.log('DEBUG - Menu images count:', restaurant?.images?.menu?.length || 0);

    // Ensure menu images is an array
    const menuImages = Array.isArray(restaurant?.images?.menu) 
      ? restaurant.images.menu 
      : restaurant?.images?.menu 
        ? [restaurant.images.menu] 
        : [];

    return (
      <div id="menuSection" className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-[#FF4F18] border-b pb-4 mb-6 flex items-center gap-2">
          <MdRestaurantMenu />
          Menu
        </h2>
        
        {menuImages.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuImages.map((url, index) => {
                console.log('DEBUG - Rendering menu image:', url);
                return (
                  <div key={index} className="relative group">
                    <div className="aspect-[3/4] relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                      <Image
                        src={url}
                        alt={`Menu page ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                        <div className="transform scale-0 group-hover:scale-100 transition-transform duration-200">
                          <button 
                            onClick={() => window.open(url, '_blank')}
                            className="bg-white/90 text-[#FF4F18] px-4 py-2 rounded-lg hover:bg-white transition-all duration-200"
                          >
                            View Full Size
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Click any menu image to view in full size
            </p>
          </>
        ) : (
          <div className="text-center py-12">
            <MdRestaurantMenu className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Menu images are not available at the moment.</p>
          </div>
        )}
      </div>
    );
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
          </div>

          {/* Restaurant Details with Cards */}
          <div className="space-y-6">
            {/* Menu Images Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 text-[#141517] mb-4">
                <MdRestaurantMenu className="text-[#FF4F18]" />
                <span className="font-medium">Menu</span>
              </div>
              {restaurant.images?.menu && restaurant.images.menu.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {restaurant.images.menu.map((url, index) => (
                      <div key={index} className="relative group aspect-[3/4]">
                        <div className="w-full h-full relative rounded-lg overflow-hidden">
                          <Image
                            src={url}
                            alt={`Menu page ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 400px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                            <div className="transform scale-0 group-hover:scale-100 transition-transform duration-200">
                              <button 
                                onClick={() => window.open(url, '_blank')}
                                className="bg-white/90 text-[#FF4F18] px-3 py-1 text-sm rounded-lg hover:bg-white transition-all duration-200"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => document.getElementById('menuSection').scrollIntoView({ behavior: 'smooth' })}
                    className="w-full text-sm text-[#FF4F18] hover:text-[#FF4F18]/80 transition-colors"
                  >
                    View all menu images
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 text-sm pl-8">
                  Menu images not available
                </p>
              )}
            </div>

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

        {/* Main Panel - Floor Plan and Menu */}
        <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          {/* Floorplan Section */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <h2 className="text-xl font-bold p-4 text-[#FF4F18] border-b">Floor Plan</h2>
            <div className="p-6">
              {restaurant.floorplanData ? (
                <PublicFloorPlan 
                  floorplanData={restaurant.floorplanData}
                  floorplanId={restaurant.floorplanId}
                  restaurantId={restaurant._id}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <FaUtensils className="text-4xl text-[#FF4F18] mb-4" />
                  <p className="text-gray-500">Floor plan is not available</p>
                </div>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <ReviewSection restaurantId={restaurantId} />
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowChat(!showChat)}
          className="bg-[#FF4F18] text-white p-4 rounded-full shadow-lg hover:bg-[#FF4F18]/90 transition-all duration-200"
        >
          <FaComments className="text-2xl" />
        </button>
      </div>

      {showChat && restaurant && (
        <CustomerChat
          restaurantId={restaurant._id}
          restaurantName={restaurant.restaurantName}
          customerId={localStorage.getItem('customerUser') ? JSON.parse(localStorage.getItem('customerUser')).userId : null}
          setShowChat={setShowChat}
        />
      )}
    </div>
  );
} 