import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Image from 'next/image';
import { RiRestaurantLine, RiTimeLine, RiMapPinLine, RiEdit2Line } from 'react-icons/ri';
import { MdRestaurantMenu, MdAnalytics } from 'react-icons/md';
import { GoogleMap, Marker } from '@react-google-maps/api';
import RestaurantProfileForm from './RestaurantProfileForm';

const formatOpeningHours = (hours) => {
  if (!hours || typeof hours !== 'object') return [];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return days.map(day => {
    const time = hours[day];
    if (!time || !time.open || !time.close || time.isClosed) {
      return {
        day: day.charAt(0).toUpperCase() + day.slice(1),
        status: 'Closed',
        isOpen: false
      };
    }
    return {
      day: day.charAt(0).toUpperCase() + day.slice(1),
      hours: `${time.open} - ${time.close}`,
      isOpen: true
    };
  });
};

export default function RestaurantInformation({ restaurant, onEditClick, onUpdateSuccess }) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8"
      >
        <RestaurantProfileForm
          mode="edit"
          initialData={restaurant}
          onSubmitSuccess={(updatedData) => {
            onEditClick(updatedData);
            setIsEditing(false);
            if (onUpdateSuccess) onUpdateSuccess();
          }}
          onCancel={() => setIsEditing(false)}
        />
      </motion.div>
    );
  }

  const formattedHours = formatOpeningHours(restaurant.openingHours);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative aspect-[21/9] w-full rounded-3xl overflow-hidden">
        {restaurant.images?.main ? (
          <Image
            src={restaurant.images.main}
            alt={restaurant.restaurantName}
            fill
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 
            flex items-center justify-center">
            <RiRestaurantLine className="text-6xl text-gray-400" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/40 p-6 flex flex-col justify-between">
          <button
            onClick={() => setIsEditing(true)}
            className="self-end bg-white/90 text-[#FF4F18] px-4 py-2 rounded-lg 
              shadow-lg hover:bg-white transition-all duration-200 flex items-center gap-2"
          >
            <RiEdit2Line />
            Edit Profile
          </button>
          
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{restaurant.restaurantName}</h1>
            <p className="text-white/90">{restaurant.cuisineType}</p>
          </div>
        </div>
      </div>

      {/* Restaurant Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Description */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-black">
            <MdRestaurantMenu className="text-[#FF4F18]" />
            About
          </h3>
          <p className="text-gray-600">{restaurant.description || 'No description provided'}</p>
        </div>

        {/* Opening Hours */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-black">
            <RiTimeLine className="text-[#FF4F18]" />
            Opening Hours
          </h3>
          <div className="space-y-3">
            {formattedHours.map(({ day, hours, isOpen, status }) => (
              <div key={day} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="font-medium text-gray-900">{day}</span>
                {isOpen ? (
                  <span className="text-gray-900">{hours}</span>
                ) : (
                  <span className="text-red-500">{status}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        {restaurant.location && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:col-span-2">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-black">
              <RiMapPinLine className="text-[#FF4F18]" />
              Location
            </h3>
            <p className="text-gray-600 mb-4">{restaurant.location.address}</p>
            {restaurant.location.coordinates && (
              <div className="h-[300px] rounded-lg overflow-hidden">
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={restaurant.location.coordinates}
                  zoom={15}
                >
                  <Marker position={restaurant.location.coordinates} />
                </GoogleMap>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}