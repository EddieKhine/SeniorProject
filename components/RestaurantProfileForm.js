"use client";

import { useState } from "react";
import Image from "next/image";
import { RiImageAddLine, RiTimeLine, RiCloseLine } from "react-icons/ri";
import { motion } from "framer-motion";
import LocationSelector from './LocationSelector';
import ImageUpload from './ImageUpload';
import { useRouter } from "next/navigation";

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

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute} ${period}`;
});

export default function RestaurantProfileForm({ 
  mode = 'create',
  initialData = null,
  onSubmitSuccess = () => {},
  onCancel = () => {}
}) {
  console.log('RestaurantProfileForm props:', { mode, initialData, onSubmitSuccess, onCancel });

  const [formData, setFormData] = useState({
    restaurantName: initialData?.restaurantName || "",
    cuisineType: initialData?.cuisineType || "",
    location: initialData?.location || "",
    description: initialData?.description || "",
    openingHours: initialData?.openingHours || {
      monday: { open: "", close: "", isClosed: false },
      tuesday: { open: "", close: "", isClosed: false },
      wednesday: { open: "", close: "", isClosed: false },
      thursday: { open: "", close: "", isClosed: false },
      friday: { open: "", close: "", isClosed: false },
      saturday: { open: "", close: "", isClosed: false },
      sunday: { open: "", close: "", isClosed: false },
    },
    images: {
      main: initialData?.images?.main || "",
      gallery: initialData?.images?.gallery || []
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleHoursChange = (day, type, value) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          [type]: value
        }
      }
    }));
  };

  const toggleDayClosed = (day) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          isClosed: !prev.openingHours[day].isClosed,
          open: prev.openingHours[day].isClosed ? "" : prev.openingHours[day].open,
          close: prev.openingHours[day].isClosed ? "" : prev.openingHours[day].close
        }
      }
    }));
  };

  const copyHoursToAll = (sourceDay) => {
    const sourceHours = formData.openingHours[sourceDay];
    const updatedHours = {};
    
    DAYS.forEach(({ key }) => {
      if (key !== sourceDay) {
        updatedHours[key] = { ...sourceHours };
      }
    });

    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        ...updatedHours
      }
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      location
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const token = localStorage.getItem("restaurantOwnerToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log('Submitting form data:', formData);
      console.log('Mode:', mode);

      const response = await fetch("/api/restaurants", {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save restaurant profile');
      }

      setSuccess(true);

      // Store the restaurant data in localStorage for the floorplan step
      localStorage.setItem("restaurantData", JSON.stringify({
        id: data.restaurant._id,
        name: data.restaurant.restaurantName,
        floorplanId: data.restaurant.floorplanId,
        ownerId: data.restaurant.ownerId,
        location: data.restaurant.location,
        cuisineType: data.restaurant.cuisineType,
        description: data.restaurant.description,
        openingHours: data.restaurant.openingHours
      }));

      // Call the success handler with the restaurant data
      onSubmitSuccess(data.restaurant);

      // Redirect to floorplan creation if in setup flow
      if (mode === 'create' && window.location.pathname.includes('/setup')) {
        router.push('/floorplan');
      }
    } catch (err) {
      setError(err.message);
      console.error('Submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Restaurant Image */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-4">
              Restaurant Image
            </label>
            <ImageUpload
              onImageUpload={(url) => setFormData(prev => ({
                ...prev,
                images: { ...prev.images, main: url }
              }))}
              currentImage={formData.images.main}
            />
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            {/* Restaurant Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Restaurant Name *
              </label>
              <input
                type="text"
                name="restaurantName"
                value={formData.restaurantName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg 
                  focus:ring-[#FF4F18] focus:border-[#FF4F18] placeholder-gray-500"
                placeholder="Enter restaurant name"
              />
            </div>

            {/* Cuisine Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Cuisine Type *
              </label>
              <select
                name="cuisineType"
                value={formData.cuisineType}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg 
                  focus:ring-[#FF4F18] focus:border-[#FF4F18] bg-white"
              >
                <option value="" className="text-gray-500">Select cuisine type</option>
                {RESTAURANT_CATEGORIES.map(category => (
                  <option key={category} value={category} className="text-gray-900">
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg 
                  focus:ring-[#FF4F18] focus:border-[#FF4F18] placeholder-gray-500"
                placeholder="Describe your restaurant"
              />
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-4">
              Restaurant Location *
            </label>
            <LocationSelector
              onLocationSelect={handleLocationSelect}
              initialLocation={formData.location}
              className="text-gray-900"
            />
          </div>
        </div>

        {/* Right Column - Opening Hours */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <RiTimeLine className="text-[#FF4F18]" />
              Opening Hours
            </h3>
          </div>

          <div className="space-y-4">
            {DAYS.map(({ key, label }) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 rounded-lg p-4 relative group hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-col space-y-3">
                  {/* Day Label */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{label}</span>
                    {!formData.openingHours[key].isClosed && (
                      <button
                        type="button"
                        onClick={() => copyHoursToAll(key)}
                        className="text-[#FF4F18] text-sm hover:text-[#FF4F18]/80 
                          transition-all px-2 py-1 rounded hover:bg-[#FF4F18]/10"
                      >
                        Copy to all
                      </button>
                    )}
                  </div>

                  {/* Time Selection */}
                  {formData.openingHours[key].isClosed ? (
                    <div className="flex items-center justify-between bg-white rounded-lg p-3">
                      <span className="text-red-500 font-medium">Closed</span>
                      <button
                        type="button"
                        onClick={() => toggleDayClosed(key)}
                        className="text-[#FF4F18] hover:text-[#FF4F18]/80 font-medium"
                      >
                        Set Hours
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <select
                          value={formData.openingHours[key].open}
                          onChange={(e) => handleHoursChange(key, 'open', e.target.value)}
                          className="w-full form-select rounded-lg border-gray-300 focus:border-[#FF4F18] 
                            focus:ring-[#FF4F18] bg-white text-gray-900 py-2"
                        >
                          <option value="" className="text-gray-500">Opening Time</option>
                          {TIME_SLOTS.map(time => (
                            <option key={time} value={time} className="text-gray-900">
                              {time}
                            </option>
                          ))}
                        </select>

                        <select
                          value={formData.openingHours[key].close}
                          onChange={(e) => handleHoursChange(key, 'close', e.target.value)}
                          className="w-full form-select rounded-lg border-gray-300 focus:border-[#FF4F18] 
                            focus:ring-[#FF4F18] bg-white text-gray-900 py-2"
                        >
                          <option value="" className="text-gray-500">Closing Time</option>
                          {TIME_SLOTS.map(time => (
                            <option key={time} value={time} className="text-gray-900">
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Selected Time Display */}
                      {(formData.openingHours[key].open || formData.openingHours[key].close) && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <span className="text-gray-900 font-medium">
                            Selected Hours: {' '}
                            <span className="text-[#FF4F18]">
                              {formData.openingHours[key].open || 'Not set'} 
                              {' - '} 
                              {formData.openingHours[key].close || 'Not set'}
                            </span>
                          </span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleDayClosed(key)}
                        className="text-gray-500 hover:text-red-500 text-sm transition-colors"
                      >
                        Mark as closed
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="text-green-500 text-sm mt-2">
          Restaurant profile saved successfully!
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-4 mt-8">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 
              hover:bg-gray-50 font-medium"
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-[#FF4F18] text-white rounded-lg hover:bg-[#FF4F18]/90 
            disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create Profile' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
