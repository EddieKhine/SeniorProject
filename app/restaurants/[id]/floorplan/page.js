'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import RestaurantFloorPlan from '@/components/RestaurantFloorPlan';
import { FaMapMarkerAlt, FaClock, FaPhone, FaStar, FaHome, FaShare, FaBookmark, FaUtensils, FaComments, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Image from 'next/image';
import PublicFloorPlan from '@/components/PublicFloorPlan';
import PublicFloorplanSelector from '@/components/PublicFloorplanSelector';
import { GoogleMap, Marker } from '@react-google-maps/api';
import ReviewSection from '@/components/ReviewSection';
import CustomerChat from '@/components/CustomerChat';
import { MdRestaurantMenu } from 'react-icons/md';
import { RiImageAddLine } from 'react-icons/ri';

export default function RestaurantFloorplanPage() {
  const params = useParams();
  const restaurantId = params.id;
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [currentMenuIndex, setCurrentMenuIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      function startLiff() {
        window.liff.init({ liffId: "2007787204-zGYZn1ZE" })
          .then(() => {
            if (window.liff.isInClient()) {
              // Use sessionStorage to prevent infinite login loop in LIFF environment
              const loginAttempted = sessionStorage.getItem('liffLoginComplete');

              if (!loginAttempted) {
                if (window.liff.isLoggedIn()) {
                  window.liff.getProfile().then(profile => {
                    fetch("/api/line-liff-login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(profile)
                    })
                    .then(res => res.json())
                    .then(data => {
                      if (data.user) {
                        // Store LINE user data in localStorage (compatible with new auth system)
                        localStorage.setItem('customerUser', JSON.stringify(data.user));
                        console.log('LINE user logged in:', data.user);
                      }
                      // Set the flag before reloading to break the loop
                      sessionStorage.setItem('liffLoginComplete', 'true');
                      window.location.reload();
                    })
                    .catch(fetchErr => {
                      console.error("Fetch error during LIFF login:", fetchErr);
                    });
                  }).catch(profileErr => {
                    console.error("Error getting LIFF profile:", profileErr);
                  });
                } else {
                  // If not logged into LINE, initiate login
                  window.liff.login();
                }
              }
              // If loginAttempted is true, do nothing. The user is logged in.
            }
            // If NOT in LINE app, do nothing (web/PC flow continues as normal)
          })
          .catch(err => {
            console.error("LIFF init error:", err);
          });
      }

      if (!window.liff) {
        const script = document.createElement("script");
        script.src = "https://static.line-scdn.net/liff/edge/2/sdk.js";
        script.onload = startLiff;
        document.body.appendChild(script);
      } else {
        startLiff();
      }
    }

    const fetchRestaurantAndFloorplan = async () => {
      try {
        console.log('Fetching restaurant data for ID:', restaurantId);
        const response = await fetch(`/api/restaurants/${restaurantId}/public-floorplan`);
        if (!response.ok) {
          console.error('Failed to fetch restaurant:', response.status);
          throw new Error('Failed to fetch restaurant');
        }
        
        const data = await response.json();
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
  };

  const handleGalleryNav = (direction) => {
    if (!restaurant?.images?.gallery?.length) return;
    setCurrentGalleryIndex((prev) => 
      direction === 'next' 
        ? (prev === restaurant.images.gallery.length - 1 ? 0 : prev + 1)
        : (prev === 0 ? restaurant.images.gallery.length - 1 : prev - 1)
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
    <div className="bg-gray-100 min-h-screen">
      {/* Modern Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-lg bg-white/80">
        <div className="max-w-full mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            {/* Home Button */}
            <button 
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-700 hover:text-[#FF4F18] transition-colors"
            >
              <FaHome className="text-lg sm:text-xl" />
              <span className="font-medium text-sm sm:text-base">Home</span>
            </button>
            
            {/* Restaurant Info & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
              {/* Rating & Location */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-gray-600 text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <FaStar className="text-[#FF4F18]" />
                  <span>{restaurant.rating ? restaurant.rating.toFixed(1) : '0.0'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-[#FF4F18]" />
                  <span className="truncate max-w-[200px] lg:max-w-none">
                    {restaurant.location?.address || 'Location not available'}
                  </span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-[#FF4F18] 
                           transition-colors text-sm sm:text-base"
                >
                  <FaShare />
                  <span>Share</span>
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#FF4F18] text-white rounded-lg 
                           hover:bg-[#FF4F18]/90 transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                >
                  <FaBookmark />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with Glass Effect */}
      <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-73px)]">
        {/* Left Panel - Restaurant Info */}
        <div className="w-full lg:w-[400px] bg-white/80 backdrop-blur-sm p-4 lg:p-6 border-b lg:border-r border-gray-100 overflow-y-auto shadow-lg">
          <h1 className="text-xl lg:text-2xl font-bold text-[#141517] mb-4 lg:mb-6">{restaurant.restaurantName}</h1>
          
          {/* Quick Actions */}
          <div className="mb-4 lg:mb-6 space-y-3">
            <button className="w-full bg-[#FF4F18] text-white rounded-lg py-2.5 lg:py-3 hover:bg-[#FF4F18]/90 transition-all shadow-md hover:shadow-lg text-sm lg:text-base">
              Make a Reservation
            </button>
          </div>

          {/* Restaurant Details with Cards */}
          <div className="space-y-4 lg:space-y-6">
            {/* Menu Images Card */}
            <div className="bg-white rounded-xl p-3 lg:p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-2 lg:gap-3 text-[#141517] mb-3 lg:mb-4">
                <MdRestaurantMenu className="text-[#FF4F18]" />
                <span className="font-medium text-sm lg:text-base">Menu</span>
              </div>
              {restaurant.images?.menu && restaurant.images.menu.length > 0 ? (
                <div className="space-y-3 lg:space-y-4">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                    <Image
                      src={restaurant.images.menu[currentMenuIndex]}
                      alt={`Menu page ${currentMenuIndex + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                    />
                    {/* Navigation Buttons */}
                    <div className="absolute inset-0 flex items-center justify-between p-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentMenuIndex((prev) => 
                            prev === 0 ? restaurant.images.menu.length - 1 : prev - 1
                          );
                        }}
                        className="p-1.5 lg:p-2 rounded-full bg-black/30 text-white hover:bg-black/50 
                          transition-all duration-200 transform hover:scale-110"
                      >
                        <FaChevronLeft className="text-base lg:text-xl" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentMenuIndex((prev) => 
                            prev === restaurant.images.menu.length - 1 ? 0 : prev + 1
                          );
                        }}
                        className="p-1.5 lg:p-2 rounded-full bg-black/30 text-white hover:bg-black/50 
                          transition-all duration-200 transform hover:scale-110"
                      >
                        <FaChevronRight className="text-base lg:text-xl" />
                      </button>
                    </div>
                    {/* Image Counter */}
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 
                      py-1 rounded-full text-xs sm:text-sm">
                      {currentMenuIndex + 1} / {restaurant.images.menu.length}
                    </div>
                  </div>
                  {/* Thumbnail Navigation */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {restaurant.images.menu.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentMenuIndex(index)}
                        className={`relative w-14 h-20 sm:w-16 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden 
                          ${currentMenuIndex === index ? 'ring-2 ring-[#FF4F18]' : ''}`}
                      >
                        <Image
                          src={url}
                          alt={`Menu thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => window.open(restaurant.images.menu[currentMenuIndex], '_blank')}
                    className="w-full text-xs sm:text-sm text-[#FF4F18] hover:text-[#FF4F18]/80 transition-colors"
                  >
                    View full size
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 text-sm pl-6 lg:pl-8">
                  Menu images not available
                </p>
              )}
            </div>

            {/* Gallery Images Card */}
            <div className="bg-white rounded-xl p-3 lg:p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-2 lg:gap-3 text-[#141517] mb-3 lg:mb-4">
                <RiImageAddLine className="text-[#FF4F18]" />
                <span className="font-medium text-sm lg:text-base">Gallery</span>
              </div>
              {restaurant.images?.gallery && restaurant.images.gallery.length > 0 ? (
                <div className="space-y-3 lg:space-y-4">
                  <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
                    <Image
                      src={restaurant.images.gallery[currentGalleryIndex]}
                      alt={`Gallery image ${currentGalleryIndex + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                    />
                    {/* Navigation Buttons */}
                    <div className="absolute inset-0 flex items-center justify-between p-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleGalleryNav('prev');
                        }}
                        className="p-1.5 lg:p-2 rounded-full bg-black/30 text-white hover:bg-black/50 
                          transition-all duration-200 transform hover:scale-110"
                      >
                        <FaChevronLeft className="text-base lg:text-xl" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleGalleryNav('next');
                        }}
                        className="p-1.5 lg:p-2 rounded-full bg-black/30 text-white hover:bg-black/50 
                          transition-all duration-200 transform hover:scale-110"
                      >
                        <FaChevronRight className="text-base lg:text-xl" />
                      </button>
                    </div>
                    {/* Image Counter */}
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 
                      py-1 rounded-full text-xs sm:text-sm">
                      {currentGalleryIndex + 1} / {restaurant.images.gallery.length}
                    </div>
                  </div>
                  {/* Thumbnail Navigation */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {restaurant.images.gallery.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentGalleryIndex(index)}
                        className={`relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-lg overflow-hidden 
                          ${currentGalleryIndex === index ? 'ring-2 ring-[#FF4F18]' : ''}`}
                      >
                        <Image
                          src={url}
                          alt={`Gallery thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => window.open(restaurant.images.gallery[currentGalleryIndex], '_blank')}
                    className="w-full text-xs sm:text-sm text-[#FF4F18] hover:text-[#FF4F18]/80 transition-colors"
                  >
                    View full size
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 text-sm pl-6 lg:pl-8">
                  No gallery images available
                </p>
              )}
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-xl p-3 lg:p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-2 lg:gap-3 text-[#141517] mb-2">
                <FaUtensils className="text-[#FF4F18]" />
                <span className="font-medium text-sm lg:text-base">About</span>
              </div>
              <p className="text-gray-600 text-sm lg:text-base pl-6 lg:pl-8">
                {restaurant.description || 'No description available'}
              </p>
            </div>

            {/* Hours Card */}
            <div className="bg-white rounded-xl p-3 lg:p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-2 lg:gap-3 text-[#141517] mb-2">
                <FaClock className="text-[#FF4F18]" />
                <span className="font-medium text-sm lg:text-base">Opening Hours</span>
              </div>
              <p className="text-gray-600 text-sm lg:text-base pl-6 lg:pl-8 whitespace-pre-line">
                {restaurant.openingHours ? Object.entries(restaurant.openingHours).map(([day, hours]) => {
                  const formattedDay = day.charAt(0).toUpperCase() + day.slice(1);
                  return `${formattedDay}: ${hours.open} - ${hours.close}\n`;
                }).join('') : 'Hours not available'}
              </p>
            </div>

            {/* Contact Card - UPDATED TO USE contactNumber */}
            <div className="bg-white rounded-xl p-3 lg:p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-2 lg:gap-3 text-[#141517] mb-2">
                <FaPhone className="text-[#FF4F18]" />
                <span className="font-medium text-sm lg:text-base">Contact</span>
              </div>
              {restaurant.contactNumber ? (
                <p className="text-gray-600 text-sm lg:text-base pl-6 lg:pl-8">
                  {restaurant.contactNumber}
                </p>
              ) : (
                <p className="text-gray-500 italic text-sm lg:text-base pl-6 lg:pl-8">
                  Contact number not available
                </p>
              )}
            </div>

            {/* Map Card */}
            {restaurant.location?.coordinates && (
              <div className="bg-white rounded-xl p-3 lg:p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2 lg:gap-3 text-[#141517] mb-2">
                  <FaMapMarkerAlt className="text-[#FF4F18]" />
                  <span className="font-medium text-sm lg:text-base">Location</span>
                </div>
                <p className="text-gray-600 text-sm lg:text-base pl-6 lg:pl-8 mb-3">
                  {restaurant.location.address}
                </p>
                <div className="h-[150px] lg:h-[200px] rounded-lg overflow-hidden">
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
        <div className="flex-1 p-4 lg:p-6 bg-gray-50 overflow-y-auto">
          {/* Floorplan Section */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 lg:mb-8">
            <h2 className="text-lg lg:text-xl font-bold p-3 lg:p-4 text-[#FF4F18] border-b">Floor Plan</h2>
            <div className="p-4 lg:p-6">
              <PublicFloorplanSelector restaurant={restaurant} />
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
            <ReviewSection restaurantId={restaurantId} />
          </div>
        </div>
      </div>

      {/* Chat Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowChat(!showChat)}
          className="bg-[#FF4F18] text-white p-3 lg:p-4 rounded-full shadow-lg hover:bg-[#FF4F18]/90 transition-all duration-200"
        >
          <FaComments className="text-xl lg:text-2xl" />
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