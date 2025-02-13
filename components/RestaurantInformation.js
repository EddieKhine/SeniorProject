import { motion } from 'framer-motion';
import { useState } from 'react';
import Image from 'next/image';
import { RiRestaurantLine, RiTimeLine } from 'react-icons/ri';
import { GoogleMap, Marker } from '@react-google-maps/api';
import RestaurantProfileForm from './RestaurantProfileForm';

const formatOpeningHours = (hours) => {
  if (!hours || typeof hours !== 'object') return 'Not provided';
  
  return Object.entries(hours)
    .map(([day, time]) => {
      if (!time || !time.open || !time.close) return `${day}: Closed`;
      const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
      return `${capitalizedDay}: ${time.open} - ${time.close}`;
    })
    .join('\n');
};

export default function RestaurantInformation({ restaurant, onEditClick, onUpdateSuccess }) {
  const [isEditing, setIsEditing] = useState(false);

  // Only display fields from the Restaurant model
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-[#141517]">Restaurant Information</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 rounded-lg bg-[#FF4F18] text-[#FFFFFF] hover:opacity-90 transition-all duration-200"
          >
            Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <RestaurantProfileForm
          mode="edit"
          initialData={restaurant}
          onSubmitSuccess={(updatedData) => {
            onEditClick(updatedData);
            setIsEditing(false);
            onUpdateSuccess();
          }}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <InfoItem label="Restaurant Name" value={restaurant.restaurantName} />
            <InfoItem label="Cuisine Type" value={restaurant.cuisineType} />
            <InfoItem label="Description" value={restaurant.description} />
          </div>
          
          <div className="space-y-4">
            <LocationInfoItem location={restaurant.location} />
            <div className="bg-[#F2F4F7] p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <RiTimeLine className="text-[#141517]" />
                <p className="text-sm font-medium text-[#141517]">Opening Hours</p>
              </div>
              <pre className="text-[#141517] whitespace-pre-line font-sans">
                {formatOpeningHours(restaurant.openingHours)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const InfoItem = ({ label, value }) => (
  <div className="bg-[#F2F4F7] p-4 rounded-lg">
    <p className="text-sm font-medium text-[#141517] mb-1">{label}</p>
    <p className="text-[#141517]">{value || 'Not provided'}</p>
  </div>
);

const LocationInfoItem = ({ location }) => {
  if (!location || !location.address) {
    return (
      <div className="bg-[#F2F4F7] p-4 rounded-lg">
        <p className="text-sm font-medium text-[#141517] mb-1">Location</p>
        <p className="text-[#141517]">Not provided</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#F2F4F7] p-4 rounded-lg">
        <p className="text-sm font-medium text-[#141517] mb-1">Location</p>
        <p className="text-[#141517]">{location.address || 'Not provided'}</p>
      </div>
      {location.coordinates && (
        <div className="h-[200px] rounded-lg overflow-hidden">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={location.coordinates}
            zoom={15}
          >
            <Marker position={location.coordinates} />
          </GoogleMap>
        </div>
      )}
    </div>
  );
};